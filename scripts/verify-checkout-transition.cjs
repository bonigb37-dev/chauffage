/* Read-only tests: checkout responses, browser storage and navigation are mocked. */
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript'),React=require('react');
function load(file,imports={},source){const m={exports:{}};const code=ts.transpileModule(source??fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(name=>imports[name]??require(name),m,m.exports);return m.exports;}
function findForm(node){if(!node||typeof node!=='object')return null;if(node.type==='form'&&node.props.onSubmit)return node;for(const child of React.Children.toArray(node.props?.children)){const found=findForm(child);if(found)return found;}return null;}
async function scenario(blocked,rejected,baseline=false){
 const stored=new Map();const storage={getItem:k=>{if(blocked)throw new Error('blocked storage');return stored.get(k)??null;},setItem:(k,v)=>{if(blocked)throw new Error('blocked storage');stored.set(k,v);}};
 const confirmedVat=load('lib/vat.ts').vatSummary([{product:{id:1,type:'Granulés'},grossCents:10000}]);
 const navigation=[],states=[];let clearCount=0,stopCount=0,requests=0;
 global.window={sessionStorage:storage,location:{search:'?reference=TP-MOCK-ONLY',assign:url=>navigation.push(url)}};global.sessionStorage=storage;
 const fields={firstName:'Test',lastName:'User',street:'Teststraße 1',postalCode:'10115',city:'Berlin',email:'test@example.invalid',terms:'on'};
 const NativeFormData=global.FormData;global.FormData=class{entries(){return Object.entries(fields)}has(key){return Object.hasOwn(fields,key)}};
 const nativeFetch=global.fetch;global.fetch=async(url,options)=>{assert.equal(url,'/api/checkout');requests++;const body=JSON.parse(options.body);assert.equal(body.acceptedTerms,true);assert.equal(body.items[0].unitPriceCents,10000);return{ok:!rejected,json:async()=>rejected?{error:'Un prix a changé. Actualisez votre panier et vérifiez le nouveau total avant de commander.'}:{reference:'TP-MOCK-ONLY',totalCents:10000,proofToken:'mock-proof',vat:confirmedVat}}};
 const pending=load('lib/pending-order.ts');
 const imports={
 'react':{...React,useState:initial=>[initial,value=>states.push(value)],useEffect:effect=>effect()},
 'next-intl':{useLocale:()=> 'de'},
 '@/i18n/copy':{localizeNode:n=>n,translate:k=>k},
 '@/i18n/routing':load('i18n/routing.ts'),
 '@/i18n/navigation':{__esModule:true,default:()=>null,useRouter:()=>({push:url=>navigation.push(url)})},
 '@/lib/pending-order':pending,
 '@/lib/vat':load('lib/vat.ts'),
 '@/components/IncludedVatSummary':{__esModule:true,default:()=>null},
 '@/lib/analytics':{emitAnalytics:()=>{}},
 '@/lib/supabase':{supabase:null},
 '@/components/CartProvider':{useCart:()=>({ready:true,items:[{productId:1,quantity:1}],products:[{id:1,name:'Test product',priceAmount:10000,price:'100 €',image:'/test.webp'}],clearCart:()=>clearCount++})},
 '@/components/ActionLoadingProvider':{useActionLoading:()=>({triggerLoading:()=>{},stopLoading:()=>stopCount++})},
 'next/image':{__esModule:true,default:()=>null},
 };
 for(const name of ['DeliveryInformation','PaymentMethods','AddressAutocomplete','PaymentProofUpload'])imports['@/components/'+name]={__esModule:true,default:()=>null};
 imports['@/lib/store-config']=load('lib/store-config.ts');
 try{
 const source=baseline?require('node:child_process').execFileSync('git',['show','7d47631:components/CheckoutPageContent.tsx'],{encoding:'utf8'}):undefined;
 const {default:Checkout}=load('components/CheckoutPageContent.tsx',imports,source);
 await findForm(Checkout()).props.onSubmit({preventDefault(){},currentTarget:{}});
 assert.equal(requests,1);
 const errors=states.filter(v=>typeof v==='string'&&v.length);
 if(baseline){assert.equal(navigation.length,0);assert.equal(errors.length,1);console.log('REPRODUCED: successful checkout followed by blocked storage is shown as an order error in the previous version.');return;}
 if(rejected){assert.equal(navigation.length,0);assert.equal(errors.length,1);assert.equal(clearCount,0);assert.equal(pending.readPendingOrder('TP-MOCK-ONLY'),null);}
 else{assert.equal(errors.length,0);assert.equal(navigation[0],'/de/commande/succes?reference=TP-MOCK-ONLY');assert.equal(clearCount,0,'Cart remains until confirmation');assert.equal(pending.readPendingOrder('TP-MOCK-ONLY').proofToken,'mock-proof');assert.deepEqual(pending.readPendingOrder('TP-MOCK-ONLY').vat,confirmedVat);assert.equal(pending.readPendingOrder('TP-MOCK-ONLY').delivery.feeCents,0);assert.equal(pending.readPendingOrder('OTHER'),null);const {default:Success}=load('components/CheckoutSuccessContent.tsx',imports);Success();Success();assert.equal(clearCount,1);assert(stopCount>=1,'Loading stops on confirmation');}
 console.log('PASS '+(rejected?'rejected order retains cart and shows its error':blocked?'successful order with blocked storage reaches bank confirmation without error':'successful order reaches confirmation and clears cart once'));
 }finally{global.FormData=NativeFormData;global.fetch=nativeFetch;delete global.window;delete global.sessionStorage;}
}
(async()=>{if(process.argv.includes('--baseline'))await scenario(true,false,true);else{await scenario(false,false);await scenario(true,false);await scenario(false,true);}})().catch(e=>{console.error(e);process.exitCode=1});
