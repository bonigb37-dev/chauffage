/* Tests avec Supabase et les envois d’e-mails simulés : aucune commande réelle. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const cache = new Map();
let mockDb;
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = name => name === '@supabase/supabase-js' ? { createClient: () => new Proxy(mockDb ?? {}, { get(target, key) {
    return key === 'rpc' ? (name, payload) => name === 'consume_api_rate_limit' ? Promise.resolve({ data: [{ allowed: true, retry_after: 60 }], error: null }) : target.rpc(name, payload) : target[key];
  } }) } : name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : require(name);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
  return module.exports;
}
function checkReviews() {
  const reviews = load('lib/reviews.ts');
  for (const id of [1,5,14,8305,999999]) {
    assert.equal(reviews.getReviewsForProduct(id).length,0,'No invented customer reviews');
    assert.equal(reviews.getAverageRating(id).count,0);
    assert.equal(reviews.getAverageRating(id).average,0);
  }
  assert.equal(reviews.getAllReviews().length,0);
  assert.equal(reviews.getTotalReviewsSummary().totalReviews,0);
}

async function run() {
  checkReviews();
  const { mergeCatalog } = load('lib/catalog.ts');
  const catalog = mergeCatalog([]);
  assert(catalog.every(p => p.priceAmount > 0 && p.stock !== 0));
  const updated = mergeCatalog([{ product_id: 2, is_deleted: false, data: { priceAmount: 12345, stock: 3, price: 'ancien prix' } }]);
  assert.equal(updated.find(p => p.id === 2).priceAmount, 12345);
  assert.match(updated.find(p => p.id === 2).price, /123,45/);
  assert.equal(mergeCatalog([{ product_id: 2, is_deleted: false, data: { stock: 0 } }]).find(p => p.id === 2).stock, 0);
  assert(!mergeCatalog([{ product_id: 2, is_deleted: true, data: {} }]).some(p => p.id === 2));
  assert.equal(mergeCatalog([{ product_id: 2, is_deleted: false, data: { priceAmount: null } }]).find(p => p.id === 2).priceAmount, undefined);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.invalid';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'mock-public';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-server';
  let rpcCalls = 0, rpcPayload;
  let rows = [];
  mockDb = { from: () => ({ select: () => ({ in: async () => ({ data: rows, error: null }) }) }), rpc: async (_, payload) => { rpcCalls++; rpcPayload = payload; return { data: 1, error: null }; } };
  const { POST } = load('app/api/checkout/route.ts');
  const customer = { firstName: 'Test', lastName: 'Client', street: 'Teststrasse 1', postalCode: '66663', city: 'Merzig', email: 'test@example.invalid' };
  const request = (price = 49900, quantity = 1) => new Request('https://mock.invalid/api/checkout', { method: 'POST', body: JSON.stringify({ customer, acceptedTerms: true, items: [{ productId: 2, quantity, unitPriceCents: price }] }) });
  assert.equal((await POST(request(40000))).status, 409); assert.equal(rpcCalls, 0);
  rows = [{ product_id: 2, is_deleted: false, data: { stock: 0 } }];
  assert.equal((await POST(request())).status, 409); assert.equal(rpcCalls, 0);
  rows = [{ product_id: 2, is_deleted: false, data: { priceAmount: 12345, stock: 3 } }];
  const result = await POST(request(12345, 2)); assert.equal(result.status, 201);
  assert.equal((await result.json()).totalCents, 24690);
  assert.equal(rpcPayload.p_items[0].unit_price_cents, 12345);
  assert.equal(rpcPayload.p_user_id, null, 'Achat sans compte');
  // Le justificatif peut écrire dans Storage, jamais dans les statuts de paiement.
  const proof = fs.readFileSync('app/api/payment-proof/route.ts', 'utf8');
  assert(!/\.update\(|\.rpc\(/.test(proof));
  assert(proof.includes("select('id')"));
  let uploaded = false;
  mockDb = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 1 }, error: null }) }) }) }),
    storage: { getBucket: async () => ({ data: { public: false, allowed_mime_types: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'] } }), from: () => ({ upload: async () => { uploaded = true; return { error: null }; } }) },
  };
  const proofRoute = load('app/api/payment-proof/route.ts');
  const { paymentProofToken } = load('lib/payment-proof-token.ts');
  const proofForm = new FormData(); const reference = 'TP-123456789ABC';
  proofForm.set('reference', reference); proofForm.set('token', paymentProofToken(reference, 'mock-server'));
  proofForm.set('file', new Blob([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }), 'proof.png');
  assert.equal((await proofRoute.POST(new Request('https://mock.invalid/api/payment-proof', { method: 'POST', body: proofForm }))).status, 200);
  assert(uploaded, 'Justificatif envoyé uniquement dans le stockage simulé');
  delete process.env.RESEND_API_KEY; delete process.env.WITHDRAWAL_FROM_EMAIL;
  let saved = null;
  mockDb = { from: () => ({ select: () => ({ eq: () => ({ like: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }), insert: async data => { saved = data; return { error: null }; } }) };
  const withdrawal = load('app/api/withdrawal/route.ts');
  const notification = new Request('https://mock.invalid/api/withdrawal', { method: 'POST', body: JSON.stringify({ name: 'Client test', email: 'test@example.invalid', contract: 'Commande test — aucune commande réelle', id: '12345678-1234-1234-1234-123456789abc' }) });
  const response = await withdrawal.POST(notification); assert.equal(response.status, 200);
  const receipt = await response.json(); assert.equal(receipt.emailSent, false); assert(receipt.receipt.includes('Reçue le :')); assert(saved.message.includes('Déclaration :'));
  const malformed = new Request('https://mock.invalid/api/withdrawal', { method: 'POST', body: '{}' }); assert.equal((await withdrawal.POST(malformed)).status, 400);
  const realFetch = global.fetch;
  process.env.RESEND_API_KEY = 'mock-mail'; process.env.WITHDRAWAL_FROM_EMAIL = 'test@example.invalid';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    const mail = JSON.parse(options.body); assert.deepEqual(mail.to, ['test@example.invalid']); assert(mail.text.includes('Déclaration :'));
    return new Response('{}', { status: 200 });
  };
  const emailed = await withdrawal.POST(new Request('https://mock.invalid/api/withdrawal', { method: 'POST', body: JSON.stringify({ name: 'Client test', email: 'test@example.invalid', contract: 'Test simulé', id: '12345678-1234-1234-1234-123456789abc' }) }));
  assert.equal((await emailed.json()).emailSent, true);
  global.fetch = realFetch;
  console.log('OK : catalogue, prix actualisés, stock nul, total serveur, achat invité, avis fictifs absents, justificatif séparé du paiement, rétractation simulée.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
