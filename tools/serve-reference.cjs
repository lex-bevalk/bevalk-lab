const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

// Load the reference server as CommonJS while the repository stays ESM.
const file = path.resolve(__dirname, '../handoff/reference/serve.js');
const serverModule = new Module(file, module);
serverModule.filename = file;
serverModule.paths = Module._nodeModulePaths(path.dirname(file));
serverModule._compile(fs.readFileSync(file, 'utf8'), file);
