const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

// Load the reference server as CommonJS while the repository stays ESM.
const file = path.resolve(__dirname, '../handoff/reference/serve.js');
const template = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : null;
const serverModule = new Module(file, module);
serverModule.filename = file;
serverModule.paths = Module._nodeModulePaths(path.dirname(file));
let source = fs.readFileSync(file, 'utf8');
if (template) {
  source = source
    .replace('const file = path.normalize(path.join(ROOT, p));', `const file = p === '/project/Main.dc.html' ? ${JSON.stringify(template)} : path.normalize(path.join(ROOT, p));`)
    .replace('if (!file.startsWith(ROOT))', "if (p !== '/project/Main.dc.html' && !file.startsWith(ROOT))");
}
serverModule._compile(source, file);
