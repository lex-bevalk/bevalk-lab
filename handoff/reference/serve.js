// Servidor local de la referencia (sin dependencias). Funciona igual en Windows, macOS y Linux.
// Uso: node reference/serve.js [puerto]   →   http://127.0.0.1:8765/project/Main.dc.html
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8765;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};
// PNG transparente de 1×1 para /_blob/<id> que no exista (mismo comportamiento que serve.py).
const PIXEL = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');

http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (p.startsWith('/_blob/')) {
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(200, {'Content-Type': 'image/png'}); return res.end(PIXEL); }
      const js = data.slice(0, 3).toString() === '/**';
      res.writeHead(200, {'Content-Type': js ? 'text/javascript; charset=utf-8' : 'image/png'});
      res.end(data);
    });
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type': 'text/plain'}); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('Referencia en http://127.0.0.1:' + PORT + '/project/Main.dc.html'));
