// All database and storage operations are mocked. No real order is deleted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
async function check({ token = true, user = true, role = 'admin', archived = true, dbError = false, proofError = false, body = { orderId: 5, reference: 'TP-ABCDEF123456' } } = {}) {
  let deletes = 0, proofs = 0;
  const filters = {};
  const db = {
    auth: { getUser: async () => ({ data: { user: user ? { id: 'admin-id' } : null } }) },
    from(table) {
      const query = {
        select() { return this; },
        eq(key, value) { filters[key] = value; return this; },
        not(key, operator, value) { assert.deepEqual([key, operator, value], ['archived_at', 'is', null]); filters.archived = true; return this; },
        delete() { deletes++; return this; },
        async maybeSingle() {
          if (table === 'admin_roles') return { data: { role } };
          assert.equal(filters.id, body.orderId); assert.equal(filters.reference, body.reference); assert.equal(filters.archived, true);
          return { data: archived ? { id: 5, reference: body.reference } : null, error: dbError ? {} : null };
        },
      };
      return query;
    },
    storage: { from(bucket) { assert.equal(bucket, 'payment-proofs'); return { remove: async paths => {
      proofs++; assert.deepEqual(paths, ['TP-ABCDEF123456/proof']);
      if (proofError) throw Error('storage unavailable');
      return { error: null };
    } }; } },
  };
  const mocks = {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@supabase/supabase-js': { createClient: () => db },
    '@/lib/api-security': { protectApi: async () => null, readLimitedJson: request => request.json(), BodyLimitError: class extends Error {} },
    '@/lib/supabase-defaults': { DEFAULT_SUPABASE_URL: 'https://mock.invalid', DEFAULT_SERVICE_ROLE_KEY: 'mock' },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('app/api/admin/archived-orders/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => { if (!(name in mocks)) throw Error(name); return mocks[name]; }, module, module.exports);
  const result = await module.exports.DELETE(new Request('https://shop.invalid/api/admin/archived-orders', {
    method: 'DELETE', headers: token ? { authorization: 'Bearer mock' } : {}, body: JSON.stringify(body),
  }));
  return { status: result.status, body: await result.json(), deletes, proofs };
}
(async () => {
  for (const options of [{ token: false }, { user: false }]) {
    const r = await check(options); assert.equal(r.status, 401); assert.equal(r.deletes, 0);
  }
  const denied = await check({ role: 'customer' }); assert.equal(denied.status, 403); assert.equal(denied.deletes, 0);
  for (const role of ['admin', 'super_admin', 'owner']) {
    const r = await check({ role }); assert.equal(r.status, 200); assert.equal(r.body.deleted, true); assert.equal(r.proofs, 1);
  }
  const restored = await check({ archived: false }); assert.equal(restored.status, 409); assert.equal(restored.proofs, 0);
  const failure = await check({ dbError: true }); assert.equal(failure.status, 500); assert.equal(failure.proofs, 0);
  const cleanup = await check({ proofError: true }); assert.equal(cleanup.body.deleted, true); assert(cleanup.body.warning);
  for (const body of [{ orderId: -1, reference: 'TP-ABCDEF123456' }, { orderId: 5, reference: '../bad' }, null]) {
    const r = await check({ body }); assert.equal(r.status, 400); assert.equal(r.deletes, 0);
  }
  console.log('Archived order deletion: authorization, archive guard, validation, storage cleanup and errors passed (mocked).');
})().catch(error => { console.error(error); process.exitCode = 1; });
