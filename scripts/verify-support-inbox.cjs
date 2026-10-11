// Render fixture conversations without authentication, network access or database writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function compile(file, imports, extra = '') {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8') + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => imports[name] ?? require(name), module, module.exports);
  return module.exports;
}
const words = compile('lib/support-copy.ts', {});
const threads = [
  { user_id: 'customer-a', customer_name: 'Alice', body: 'Delivery question', locale: 'de', sender_kind: 'customer', unread: 2, created_at: '2026-10-11T12:00:00Z' },
  { user_id: 'customer-b', customer_name: 'Bob', body: 'Your order is confirmed', locale: 'en', sender_kind: 'admin', unread: 0, created_at: '2026-10-11T11:00:00Z' },
];
function render({ locale = 'fr', filter = 'all', search = '', target = '', admin = true } = {}) {
  let index = 0;
  const state = [target ? [{ ...threads[0], id: 'message-a', body: '<script>bad()</script>' }] : [], threads, target, search, filter, '', null, '', '', '', false, false, false, false];
  const mockReact = { ...React, useState: () => [state[index++], () => {}], useRef: value => ({ current: value }), useEffect: () => {}, useCallback: fn => fn };
  const component = compile('components/SupportMessenger.tsx', {
    react: mockReact,
    'next-intl': { useLocale: () => locale },
    '@/i18n/navigation': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    '@/lib/supabase': { supabase: null },
    '@/lib/support-copy': words,
    './AccessContext': { useVerifiedAccess: () => ({ user: { user_metadata: { full_name: 'Alice' } }, verified: true }) },
  }, '\nexport const FixtureMessages = Messages;');
  return renderToStaticMarkup(component.FixtureMessages({ admin, locale }));
}
for (const locale of ['de', 'fr', 'en']) {
  const html = render({ locale });
  assert(html.includes('Alice') && html.includes('Bob'));
  assert(html.includes(words.supportInboxCopy[locale].search));
  assert(!html.includes('<select'), 'Conversation picker is a list');
  assert(html.includes(words.supportInboxCopy[locale].select));
  const selected = render({ locale, target: 'customer-a' });
  assert(selected.includes('<textarea'), 'Reply composer is available');
  assert(selected.includes('overflow-y-auto'), 'Message history scrolls separately');
  assert(selected.includes('&lt;script&gt;bad()&lt;/script&gt;'), 'Messages remain escaped');
}
for (const filter of ['unread', 'pending']) {
  const html = render({ filter });
  assert(html.includes('Alice') && !html.includes('Bob'), filter);
}
const answered = render({ filter: 'answered' });
assert(answered.includes('Bob') && !answered.includes('Alice'));
const search = render({ search: 'delivery' });
assert(search.includes('Alice') && !search.includes('Bob'));
assert(render({ search: 'missing' }).includes(words.supportInboxCopy.fr.noResults));
assert(!render({ admin: false }).includes('type="search"'), 'Customer interface has no inbox controls');
console.log('PASS inbox in DE/FR/EN, customer search, unread/needs-reply/answered filters, reply composer, escaped messages and customer interface.');
