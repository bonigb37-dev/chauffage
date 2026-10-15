const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = name => {
    if (name === 'server-only') return {};
    if (name.endsWith('.json')) {
      const jsonPath = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    if (name.startsWith('@/')) {
      const rel = name.slice(2);
      const targetPath = fs.existsSync(rel + '.tsx') ? rel + '.tsx' : rel + '.ts';
      return load(targetPath);
    }
    if (name.startsWith('./') || name.startsWith('../')) {
      const dir = path.dirname(file);
      const rel = path.resolve(dir, name);
      const targetPath = fs.existsSync(rel + '.tsx') ? rel + '.tsx' : fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.js';
      return load(targetPath);
    }
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
  return module.exports;
}

async function run() {
  console.log('Loading lib/order-email.ts...');
  const { sendOrderConfirmationEmail } = load('lib/order-email.ts');
  console.log('Sending test order email to reinholdp04@gmail.com...');
  const success = await sendOrderConfirmationEmail({
    reference: 'TP-A1B2C3D4E5F6',
    customer: {
      firstName: 'Reinhold',
      lastName: 'Petzsche',
      email: 'reinholdp04@gmail.com',
      street: 'Musterstraße 12',
      postalCode: '10115',
      city: 'Berlin',
    },
    totalCents: 49900,
    lines: [
      {
        name: 'Holzpellets Premium ENplus A1',
        quantity: 1,
        unit_price_cents: 49900,
      },
    ],
  });
  console.log('sendOrderConfirmationEmail RESULT:', success);
}

run().catch(console.error);
