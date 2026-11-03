// Minimal static file server for the renderer page.
const http = require('http'), fs = require('fs'), path = require('path');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
module.exports = function serve(root, port) {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(root)) { rsp.writeHead(403); return rsp.end(); }
      fs.readFile(p.endsWith('/') ? p + 'index.html' : p, (err, data) => {
        if (err) { rsp.writeHead(404); return rsp.end('nf'); }
        rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
        rsp.end(data);
      });
    });
    srv.listen(port, '127.0.0.1', () => res(srv));
  });
};
