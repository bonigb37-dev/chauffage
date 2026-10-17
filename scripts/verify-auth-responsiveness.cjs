// Auth, navigation and timers are mocked: no account or real mail is created.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(nodes)];
}
async function scenario(mode, fail = false) {
  const state = [], refs = [], redirects = [];
  let cursor = 0, refCursor = 0, calls = 0, finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const auth = async () => { calls++; return pending; };
  const Account = load('components/AccountPageContent.tsx', {
    react: { ...React, useEffect() {}, useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = index === 0 ? mode : initial;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    }, useRef(initial) { return refs[refCursor++] ?? (refs[refCursor - 1] = { current: initial }); } },
    'next-intl': { useLocale: () => 'de' },
    '@/i18n/copy': { localizeNode: node => node },
    '@/i18n/navigation': { __esModule: true, default: 'a', useRouter: () => ({ replace: url => redirects.push(url) }) },
    '@/lib/supabase': { isPasswordRecoveryRedirect: false, supabase: { auth: { signInWithPassword: auth, signUp: auth } } },
    '@/lib/admin-access': { getAdminRole: () => new Promise(() => {}) },
    '@/lib/auth-link': { wasEmailConfirmed: () => false, confirmationMessage: '' },
    '@/components/CartProvider': { useCart: () => ({ items: [], products: [], itemCount: 0, ready: true }) },
    '@/lib/order-status': {}, '@/lib/store-config': { siteUrl: 'https://example.invalid' },
    '@/components/BrandWordmark': { __esModule: true, default: () => null },
    '@/components/IncludedVatSummary': { __esModule: true, default: () => null },
  }).default;
  const render = () => { cursor = 0; refCursor = 0; return nodes(Account()); };
  const form = render().find(node => node.type === 'form' && node.props.onSubmit);
  assert.equal(form.props['data-no-loading'], 'true');
  const event = { preventDefault() {}, currentTarget: {} };
  const first = form.props.onSubmit(event);
  const second = form.props.onSubmit(event);
  assert.equal(calls, 1, 'Repeated mobile taps must not duplicate auth requests');
  let tree = render();
  assert.equal(tree.find(node => node.type === 'form').props['aria-busy'], true);
  assert.equal(tree.find(node => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  assert(tree.some(node => node.props?.role === 'status'));
  finish(fail ? { error: new Error('mock network failure') } : mode === 'signin'
    ? { data: { user: { id: 'mock', email_confirmed_at: '2026-01-01' } }, error: null }
    : { data: { session: null }, error: null });
  let deadline;
  try {
    await Promise.race([Promise.all([first, second]), new Promise((_, reject) => {
      deadline = setTimeout(() => reject(Error('Auth completion blocked on role lookup')), 300);
    })]);
  } finally { clearTimeout(deadline); }
  assert.equal(state[3], false);
  if (fail) assert.equal(state[6], 'mock network failure');
  else if (mode === 'signin') {
    assert.deepEqual(redirects, [], 'No redundant navigation or blocking role lookup after sign-in');
    assert.equal(state[1].id, 'mock');
  }
  else assert(state[5].includes('Inscription'));
}
async function main() {
  const nativeFormData = global.FormData;
  global.FormData = class { get(name) { return ({ email: 'mock@example.invalid', password: 'mock-password', confirmPassword: 'mock-password', firstName: 'Test', lastName: 'User' })[name] ?? ''; } };
  try { await scenario('signin'); await scenario('signup'); await scenario('signin', true); }
  finally { global.FormData = nativeFormData; }

  // Entry forms render while session/role requests are pending. Private routes do not.
  const placeholder = React.createElement('form', { id: 'public-auth-form' });
  const guardCases = [
    { path: '/compte', expected: true },
    { path: '/compte', user: { id: 'pending-role' }, expected: true },
    { path: '/admin', expected: false },
    { path: '/super-admin', expected: false },
    { path: '/panier', expected: false },
    { path: '/commande', expected: false },
    { path: '/compte', recovery: true, expected: false },
    { path: '/compte', user: { id: 'admin' }, role: 'admin', expected: false },
  ];
  for (const test of guardCases) {
    let index = 0;
    const overrides = { 0: test.user ?? null, 1: Boolean(test.user),
      2: test.role ? { userId: test.user.id, role: test.role } : null };
    const Guard = load('components/RoleAccessGuard.tsx', {
      react: { ...React, useEffect() {}, useState(initial) {
        const i = index++; return [Object.hasOwn(overrides, i) ? overrides[i] : initial, () => {}];
      } },
      'next-intl': { useLocale: () => 'de' }, '@/i18n/copy': { localizeNode: node => node },
      '@/i18n/navigation': { usePathname: () => test.path, useRouter: () => ({ replace() {} }) },
      '@/lib/supabase': { supabase: { auth: {} }, isPasswordRecoveryRedirect: Boolean(test.recovery) },
      '@/lib/auth-link': { incomingAuthLink: test.recovery ? { kind: 'recovery' } : null },
      '@/lib/admin-access': {}, '@/components/AccessContext': { AccessContext: React.createContext({}) },
    }).default;
    const result = Guard({ children: placeholder });
    assert.equal(nodes(result).some(node => node.props?.id === 'public-auth-form'), test.expected, test.path);
  }

  const handlers = {}, updates = [], effects = [];
  const nativeDocument = global.document, nativeWindow = global.window;
  global.document = { addEventListener: (name, handler) => { handlers[name] = handler; }, removeEventListener() {} };
  global.window = { location: { pathname: '/de/compte' } };
  try {
    const Provider = load('components/ActionLoadingProvider.tsx', {
      react: { ...React, useState: value => [value, next => updates.push(next)], useRef: () => ({ current: null }), useCallback: callback => callback, useEffect: effect => effects.push(effect) },
      'next-intl': { useLocale: () => 'de' }, '@/i18n/copy': { localizeNode: node => node },
      './FirewoodLoader': { __esModule: true, default: () => null },
    }).ActionLoadingProvider;
    Provider({ children: null });
    const cleanup = effects[0]();
    handlers.submit({ target: { getAttribute: name => name === 'data-no-loading' ? 'true' : null, checkValidity: () => true } });
    assert.equal(updates.length, 0, 'Auth forms must not start the artificial global overlay');
    cleanup();
  } finally { global.document = nativeDocument; global.window = nativeWindow; }
  console.log('PASS: immediate auth feedback, duplicate-tap prevention, signup and signin completion, error recovery, and no artificial global overlay. No real auth requests.');
  console.log('PASS: public auth forms are visible without waiting for session/roles; private routes, recovery and admin redirects remain guarded.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
