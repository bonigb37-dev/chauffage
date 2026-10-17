// Read-only tests with database, checkout and email operations mocked.
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const assert = require('node:assert/strict');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(nodes)];
}
async function main() {
  const helper = load('lib/admin-order-product.ts');
  const product = { id: 123, name: 'Current name', image: '/current.jpg', priceAmount: 1200, type: 'Bois de chauffage', stock: 10 };
  const oldLine = { product_id: 123, name: 'Name at order time', quantity: 2, unit_price_cents: 1000 };
  const legacy = helper.adminOrderProduct(oldLine, [product]);
  assert.equal(legacy.image, '/current.jpg'); assert.equal(legacy.name, oldLine.name);
  assert.equal(helper.adminOrderProduct({ ...oldLine, image: '/ordered.jpg' }, [product]).image, '/ordered.jpg');
  assert.equal(helper.adminOrderProduct({ ...oldLine, image: '/ordered.jpg' }, []).image, '/ordered.jpg');
  assert.equal(helper.adminOrderProduct(oldLine, []).image, null);
  assert.equal(helper.adminOrderProduct({ productId: 123, quantity: 3 }, [product]).quantity, 3);
  assert.equal(helper.adminOrderProduct({ ...oldLine, image: 'javascript:alert(1)' }, []).image, null);
  assert.equal(helper.adminOrderProduct({ ...oldLine, image: '//evil.invalid/x' }, []).image, null);
  let failed = null;
  const Component = load('components/AdminProductLine.tsx', {
    react: { ...React, useState: () => [failed, value => { failed = value; }] },
    'next/image': { __esModule: true, default: 'product-image' },
    'lucide-react': { Package: () => null }, '@/components/CartProvider': { useCart: () => ({ products: [product] }) },
    '@/i18n/copy': { translate: text => text }, '@/lib/admin-order-product': helper,
  }).default;
  let view = nodes(Component({ line: oldLine }));
  const image = view.find(node => node.type === 'product-image');
  assert.equal(image.props.src, '/current.jpg'); assert.equal(image.props.alt, oldLine.name);
  image.props.onError(); view = nodes(Component({ line: oldLine }));
  assert(!view.some(node => node.type === 'product-image')); assert(view.some(node => node.props?.role === 'img'));
  const db = { from: () => ({ select: () => ({ in: async () => ({ data: [], error: null }) }) }),
    rpc: async (_name, payload) => { saved = payload; return { data: 456, error: null }; } };
  let saved;
  const route = load('app/api/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) }, after: () => {} },
    '@supabase/supabase-js': { createClient: () => db }, '@/lib/products': { products: [product] },
    '@/lib/catalog': { mergeCatalog: () => [product] }, '@/translations/de.json': {},
    '@/lib/vat': { vatRateForProduct: () => 7, vatSummary: () => ({ included: true }) },
    '@/lib/cart-drafts-server': { draftId: () => null }, '@/lib/payment-proof-token': { paymentProofToken: () => 'mock' },
    '@/lib/api-security': { protectApi: async () => null, readLimitedJson: request => request.json(), BodyLimitError: class extends Error {} },
    '@/lib/order-email': { sendOrderConfirmationEmail: async () => false },
    '@/lib/supabase-defaults': { DEFAULT_SUPABASE_URL: 'https://mock.invalid', DEFAULT_SERVICE_ROLE_KEY: 'mock' },
  });
  const response = await route.POST(new Request('https://shop.invalid/api/checkout', { method: 'POST', body: JSON.stringify({
    acceptedTerms: true,
    customer: { firstName: 'Test', lastName: 'User', street: 'Teststrasse 1', postalCode: '10115', city: 'Berlin', email: 'test@example.invalid' },
    items: [{ productId: 123, quantity: 2, unitPriceCents: 1200, image: 'https://forged.invalid/fake.jpg' }],
  }) }));
  assert.equal(response.status, 201, await response.clone().text());
  assert.equal(saved.p_items[0].image, '/current.jpg', 'Image must come from the server catalogue');
  assert.equal(saved.p_items[0].quantity, 2); assert.equal(saved.p_items[0].unit_price_cents, 1200);
  assert.equal((await response.json()).totalCents, 2400);
  console.log('PASS: legacy orders, image snapshots, deleted products, drafts, broken images, unsafe URLs, and server-controlled checkout images; prices and quantities preserved. No real order or email.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
