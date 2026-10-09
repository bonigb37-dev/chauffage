const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const tested = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('lib/admin-access.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInThisContext(`(function(module,exports){${code}\n})`)(tested, tested.exports);
const { getAdminRole } = tested.exports;
async function run() {
  let requests = 0;
  let resolve;
  const client = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => { requests++; return new Promise((done) => { resolve = done; }); } }) }) }) };
  const first = getAdminRole(client, 'admin-a');
  const second = getAdminRole(client, 'admin-a');
  assert.equal(requests, 1);
  resolve({ data: { role: 'admin' }, error: null });
  assert.deepEqual(await Promise.all([first, second]), ['admin', 'admin']);
  const revoked = getAdminRole(client, 'admin-a');
  assert.equal(requests, 2, 'Aucun rôle conservé après la requête');
  resolve({ data: null, error: null }); assert.equal(await revoked, null);
  const failing = getAdminRole(client, 'admin-a');
  resolve({ data: null, error: new Error('network') }); await assert.rejects(failing);
  const retry = getAdminRole(client, 'admin-a');
  resolve({ data: { role: 'unexpected' }, error: null }); assert.equal(await retry, null);
  const owner = getAdminRole(client, 'owner'); resolve({ data: { role: 'owner' }, error: null }); assert.equal(await owner, 'owner');
  console.log('OK : requêtes de rôle simultanées mutualisées, pas de cache persistant, révocation, échec/reprise et rôle inconnu refusé. Aucune connexion réelle.');
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
