// All database and mail operations are mocked. No customer data or mail is created.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const pdf = require('pdf-lib');
const cache = new Map();
let raw = '', unavailable = false, reads = 0;
const sent = [], drawn = [];
const fakeFetch = async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  sent.push(JSON.parse(options.body));
  return { ok: true };
};
const db = { from(table) {
  assert.equal(table, 'site_settings');
  const query = { select() { return query; }, eq(key, value) {
    assert.equal(key, 'key'); assert.equal(value, 'bank_transfer'); return query;
  }, async maybeSingle() { reads++; return { data: unavailable ? null : { value: { details: raw } }, error: unavailable ? {} : null }; } };
  return query;
} };
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const requireMock = name => {
    if (name === 'server-only') return {};
    if (name === '@/lib/supabase-defaults') return { DEFAULT_SUPABASE_URL: 'https://db.invalid', DEFAULT_SERVICE_ROLE_KEY: 'mock' };
    if (name === '@supabase/supabase-js') return { createClient: (_url, _key, options) => {
      assert(options.global.fetch.toString().includes('no-store')); return db;
    } };
    if (name === 'nodemailer') return { createTransport: () => { throw Error('Unexpected SMTP call'); } };
    if (name === 'pdf-lib') return { ...pdf, PDFDocument: { create: async () => {
      const doc = await pdf.PDFDocument.create();
      const addPage = doc.addPage.bind(doc);
      doc.addPage = (...args) => {
        const page = addPage(...args.map(value => Array.isArray(value) ? Array.from(value) : value)), drawText = page.drawText.bind(page);
        page.drawText = (text, options) => { drawn.push(text); return drawText(text, options); };
        return page;
      };
      return doc;
    } } };
    if (name.startsWith('@/')) return load(name.slice(2) + (name.endsWith('.json') ? '' : '.ts'));
    if (name.startsWith('./')) return load(path.join(path.dirname(file), name) + '.ts');
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports,fetch,process,console){${code}\n})`)(
    requireMock, module, module.exports, fakeFetch,
    { env: { RESEND_API_KEY: 'mock', ORDER_FROM_EMAIL: 'shop@mock.local' } },
    { log() {}, warn() {}, error() {} },
  );
  return module.exports;
}
async function main() {
  const { parseBankDetails } = load('lib/bank-details.ts');
  const first = 'Name: Test Recipient A\n\nIBAN: DE89 3704 0044 0532 0130 00\nBIC: COBADEFFXXX\nBank: Test Bank A';
  const second = 'Empf\u00e4nger: Test Recipient B\nIBAN: FR14 2004 1010 0505 0001 3M02 606\nBIC: PSSTFRPPXXX\nBank: Test Bank B';
  assert.equal(parseBankDetails(first).recipient, 'Test Recipient A');
  assert.equal(parseBankDetails(second).recipient, 'Test Recipient B');
  assert.equal(parseBankDetails('B\u00e9n\u00e9ficiaire: Test\nIBAN: DE89370400440532013000').recipient, 'Test');
  assert.equal(parseBankDetails(''), null);
  assert.equal(parseBankDetails('IBAN: DE89370400440532013000'), null);
  const server = load('lib/server-bank-details.ts');
  const mail = load('lib/order-email.ts');
  const invoice = load('lib/invoice-pdf.ts');
  const order = { reference: 'TP-BANK-MOCK', customer: { firstName: 'Test', lastName: 'User',
    email: 'customer@mock.local', street: 'Teststrasse 1', postalCode: '10115', city: 'Berlin' },
    totalCents: 10000, lines: [{ name: 'Test wood', quantity: 1, unit_price_cents: 10000 }] };
  for (const [text, name, bank] of [[first, 'Test Recipient A', 'Test Bank A'], [second, 'Test Recipient B', 'Test Bank B']]) {
    raw = text;
    assert.equal((await server.getBankDetails()).recipient, name);
    assert.equal(await mail.sendOrderConfirmationEmail({ ...order, attachInvoice: true }), true);
    assert(sent.at(-1).text.includes(name)); assert(sent.at(-1).html.includes(bank));
    assert(sent.at(-1).html.includes('Vielen Dank f\u00fcr Ihre Bestellung!'));
    assert(sent.at(-1).html.includes('Beg\u00fcnstigte:'));
    assert(sent.at(-1).text.includes('Bank\u00fcberweisung'));
    for (const field of ['subject', 'text', 'html']) {
      assert(!/[\u251c\u252c]|\u00d4[\u00c7\u00f6\u00a3]/.test(sent.at(-1)[field]), `Corrupted characters in ${field}`);
      assert(sent.at(-1)[field].includes('\u20ac'), `Euro currency missing from ${field}`);
      assert(!sent.at(-1)[field].includes('\u00a3'), `Unexpected pound sign in ${field}`);
    }
    assert(sent.at(-1).text.includes(parseBankDetails(raw).iban));
    assert.equal(Buffer.from(sent.at(-1).attachments[0].content, 'base64').subarray(0, 5).toString(), '%PDF-');
    drawn.length = 0;
    assert.equal(await mail.sendPaymentConfirmedEmail(order), true);
    assert(sent.at(-1).subject.includes('Zahlungsbest\u00e4tigung'));
    for (const field of ['subject', 'text', 'html']) {
      assert(!/[\u251c\u252c]|\u00d4[\u00c7\u00f6\u00a3]/.test(sent.at(-1)[field]));
      assert(sent.at(-1)[field].includes('\u20ac'));
    }
    assert(drawn.some(text => text.includes(bank)));
    assert.equal(Buffer.from(sent.at(-1).attachments[0].content, 'base64').subarray(0, 5).toString(), '%PDF-');
    for (const generate of [invoice.generateInvoicePdf, invoice.generatePaymentReceiptPdf]) {
      drawn.length = 0;
      const bytes = await generate(order);
      assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
      assert(drawn.some(text => text.includes(bank)));
      assert(drawn.some(text => text.includes(parseBankDetails(raw).iban)));
      assert(!drawn.some(text => /DE38\s?7602|NORSDE71/.test(text)));
    }
  }
  assert(reads >= 8, 'Configuration is read freshly for each operation');
  unavailable = true;
  const count = sent.length;
  await assert.rejects(server.getBankDetails());
  await assert.rejects(mail.sendOrderConfirmationEmail(order));
  await assert.rejects(invoice.generateInvoicePdf(order));
  await assert.rejects(invoice.generatePaymentReceiptPdf(order));
  assert.equal(sent.length, count, 'No mail sent with missing or stale bank details');
  unavailable = false; raw = 'incomplete';
  await assert.rejects(server.getBankDetails());

  // Run the bank-refresh effect with browser hooks mocked, without mounting the cart.
  const effects = [], updates = [], events = new Map();
  let interval, cleared = false;
  const hooks = {
    createContext: () => ({ Provider: () => null }), useContext: () => null,
    useState: value => [value, next => updates.push(next)], useRef: value => ({ current: value }),
    useEffect: effect => effects.push(effect), useCallback: callback => callback, useMemo: callback => callback(),
  };
  const browser = { setInterval(callback, ms) { assert.equal(ms, 30_000); interval = callback; return 1; },
    clearInterval() { cleared = true; }, addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: name => events.delete(name) };
  const document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  const component = { exports: {} };
  const componentCode = ts.transpileModule(fs.readFileSync('components/CartProvider.tsx', 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mocks = { react: hooks, 'next-intl': { useLocale: () => 'de' },
    '@/i18n/copy': { localizeNode: node => node }, '@/lib/supabase': { supabase: db },
    '@/lib/products': { products: [] }, '@/lib/catalog': { mergeCatalog: () => [] },
    '@/lib/analytics': { emitAnalytics() {} } };
  new Function('require', 'module', 'exports', 'window', 'document', componentCode)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), component, component.exports, browser, document,
  );
  component.exports.CartProvider({ children: null });
  raw = first;
  const cleanup = effects[1]();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(updates.at(-1), first);
  raw = second; await events.get('focus')(); assert.equal(updates.at(-1), second);
  raw = first; interval(); await new Promise(resolve => setImmediate(resolve)); assert.equal(updates.at(-1), first);
  raw = second; await events.get('bren-bank-settings-updated')(); assert.equal(updates.at(-1), second);
  unavailable = true; await events.get('focus')(); assert.equal(updates.at(-1), '');
  cleanup(); assert(cleared); assert.equal(events.size, 0);
  console.log('PASS: admin label compatibility, two successive bank configurations in emails and both PDFs, fresh reads, and no stale fallback on failure. No real mail or database writes.');
  console.log('PASS: browser refresh on focus, admin-save event and timer; stale data cleared on failure; listeners cleaned up.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
