const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
function load(file, imports) {
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require','module','exports',code)(name=>imports[name] || require(name),module,module.exports);
  return module.exports;
}
const routing = load('i18n/routing.ts',{});
const {translate,localizeNode} = load('i18n/copy.tsx',{
  '@/translations/de.json':require('../translations/de.json'),
  '@/translations/en.json':require('../translations/en.json'),
  './routing':routing,
});
for(const locale of ['de','en']) {
  const dictionary = require('../translations/'+locale+'.json');
  for(const source of Object.keys(require('../translations/admin.json'))) {
    assert.equal(typeof dictionary[source],'string',source);
    assert.equal(translate(source,locale),dictionary[source],source);
  }
  const onClick = () => {};
  const node = localizeNode(React.createElement('div',null,
    React.createElement('button',{onClick,title:'Retirer les droits'},'Enregistrer'),
    React.createElement('span',{'data-original-content':true},'Enregistrer'),
    React.createElement('input',{value:'Enregistrer',placeholder:'Adresse e-mail utilisateur'}),
    React.createElement('a',{href:'/fr/admin'},'Ouvrir l’espace boutique')),locale);
  assert.equal(node.props.children[0].props.onClick,onClick);
  assert.equal(node.props.children[0].props.children,dictionary.Enregistrer);
  assert.equal(node.props.children[1].props.children,'Enregistrer','Customer text is preserved');
  assert.equal(node.props.children[2].props.value,'Enregistrer','Form values are preserved');
  assert.equal(node.props.children[2].props.placeholder,dictionary['Adresse e-mail utilisateur']);
  assert.equal(node.props.children[3].props.href,'/'+locale+'/admin');
  assert.equal(translate('constructor',locale),'constructor','Only own dictionary entries are used');
  assert.equal(translate('Rôle enregistré pour test@example.invalid.',locale),dictionary['Rôle enregistré pour']+' test@example.invalid.');
}
assert.equal(translate('Enregistrer','fr'),'Enregistrer');
const {products} = load('lib/products.ts',{});
for(const locale of ['de','en']) {
  const dictionary = require('../translations/'+locale+'.json');
  for(const product of products) for(const field of ['name','description','quantity','type']) {
    const source=product[field].replace(/\s+/g,' ').trim();
    assert(Object.hasOwn(dictionary,source),locale+' product '+product.id+' '+field);
  }
}
console.log('PASS DE/EN administration copy, confirmation labels, dynamic notices, customer/form values, handlers and localized links.');
