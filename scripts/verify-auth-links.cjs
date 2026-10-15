const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const tested = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('lib/auth-link.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInThisContext(`(function(module,exports){${code}\n})`)(tested, tested.exports);
const { readAuthLink, verifyAuthLink, wasEmailConfirmed, clearEmailConfirmation } = tested.exports;
const user = { id: 'test-user', email_confirmed_at: '2026-10-08T00:00:00Z' };
function client({ initError = null, session = { access_token: 'token-test', user }, verifiedUser = user } = {}) {
  return { auth: { initialize: async () => ({ error: initError }), getSession: async () => ({ data: { session }, error: null }), getUser: async () => ({ data: { user: verifiedUser }, error: null }) } };
}
async function run() {
  const intent = readAuthLink('https://bois-de-chauffage-de.vercel.app/#access_token=token-test&type=signup');
  assert.equal(intent.kind, 'confirmation');
  assert.equal((await verifyAuthLink(client(), intent)).success, true);
  assert(wasEmailConfirmed(user.id)); clearEmailConfirmation(); assert(!wasEmailConfirmed(user.id));
  assert.equal((await verifyAuthLink(client({ verifiedUser: { ...user, email_confirmed_at: null } }), intent)).success, false);
  assert.equal((await verifyAuthLink(client({ verifiedUser: { ...user, id: 'another-user' } }), intent)).success, false);
  assert.equal((await verifyAuthLink(client({ initError: new Error('invalid token') }), intent)).success, false);
  assert.equal((await verifyAuthLink(client({ session: null }), intent)).success, false);
  assert.equal((await verifyAuthLink(client({ session: { access_token: 'old-session', user } }), intent)).success, false);
  assert.equal((await verifyAuthLink(client(), readAuthLink('https://example.invalid/compte?mode=confirm'))).success, false);
  const expired = await verifyAuthLink(client(), readAuthLink('https://example.invalid/#error=access_denied&error_code=otp_expired'));
  assert.equal(expired.success, false); assert.equal(expired.expired, true);
  const recovery = await verifyAuthLink(client(), readAuthLink('https://example.invalid/#access_token=token-test&type=recovery'));
  assert.equal(recovery.success, true); assert.equal(recovery.recovery, true); assert(!wasEmailConfirmed(user.id));
  const account = fs.readFileSync('components/AccountPageContent.tsx', 'utf8');
  for (const method of ['signInWithPassword', 'signOut', 'resetPasswordForEmail', 'updateUser', 'resend']) assert(account.includes(`auth.${method}`));
  assert(!account.includes("router.replace('/')"));
  const payment = fs.readFileSync('components/PaymentMethods.tsx', 'utf8'); assert(payment.includes('recorded && hasBankDetails')); assert(payment.includes('beforeOrderPaymentInstructions'));
  assert(fs.readFileSync('components/CheckoutSuccessContent.tsx', 'utf8').includes('BANK_DETAILS'));
  console.log('OK : confirmation verifiee, liens invalides/expirés, session ancienne refusee, recuperation separee, paiement avant/apres commande. Aucun e-mail reel envoye.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
