// Render the shared admin panel with simulated records and React state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
let selection = [], reset;
const code = ts.transpileModule(fs.readFileSync('components/AdminWorkspace.tsx', 'utf8') + '\nexport { AdminPanel };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('require', 'module', 'exports', code)(name => {
  if (name === 'react') return { ...React, useState: () => [selection, value => { selection = typeof value === 'function' ? value(selection) : value; }], useEffect: effect => { reset = effect; } };
  if (name === 'react/jsx-runtime') return require(name);
  if (name === 'next-intl') return { useLocale: () => 'de' };
  if (name === '@/i18n/copy') return { localizeNode: node => node, translate: text => text };
  if (name === '@/lib/order-archive-copy') return { orderArchiveCopy: { de: {} } };
  if (name === '@/lib/analytics-copy') return { analyticsCopy: { de: {} } };
  if (name === '@/lib/order-status') return { paymentStatusLabel: () => 'Pending' };
  return {};
}, moduleUnderTest, moduleUnderTest.exports);
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(nodes)];
}
const orders = [1, 2].map(id => ({ id, reference: `TEST-${id}`, created_at: '2026-10-17T12:00:00Z', archived_at: '2026-10-17T12:00:00Z', items: [], customer: {}, total_cents: 1000 }));
let deleted;
const props = { contacts: [], orders, workingId: '', archiveReady: true, showArchived: true, orderOffset: 0, onDeleteArchived: ids => { deleted = ids; } };
const view = overrides => nodes(moduleUnderTest.exports.AdminPanel({ ...props, ...overrides }));
let tree = view();
let boxes = tree.filter(n => n.type === 'input'); assert.equal(boxes.length, 3);
assert(tree.find(n => n.type === 'button' && n.props.children?.[1] === 'Ausgewählte endgültig löschen').props.disabled);
boxes[1].props.onChange({ target: { checked: true } }); assert.deepEqual(selection, [1]);
tree = view(); const element = {}; tree.find(n => n.type === 'input').props.ref(element); assert.equal(element.indeterminate, true);
tree.find(n => n.type === 'input').props.onChange({ target: { checked: true } }); assert.deepEqual(selection, [1, 2]);
tree = view(); boxes = tree.filter(n => n.type === 'input'); assert(boxes.every(n => n.props.checked));
tree.find(n => n.type === 'button' && n.props.children?.[1] === 'Ausgewählte endgültig löschen').props.onClick(); assert.deepEqual(deleted, [1, 2]);
boxes[0].props.onChange({ target: { checked: false } }); assert.deepEqual(selection, []);
selection = [1, 2]; reset(); assert.deepEqual(selection, []);
assert.equal(view({ showArchived: false }).filter(n => n.type === 'input').length, 0);
assert(view({ workingId: 'delete-selected' }).filter(n => n.type === 'input').every(n => n.props.disabled));
selection = [1, 99]; tree = view({ orders: [orders[0]] });
tree.find(n => n.type === 'button' && n.props.children?.[1] === 'Ausgewählte endgültig löschen').props.onClick(); assert.deepEqual(deleted, [1]);
console.log('PASS individual selection, select/deselect page, mixed state, bulk callback, reset, stale IDs, active view and busy controls.');
