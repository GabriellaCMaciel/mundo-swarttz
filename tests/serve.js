#!/usr/bin/env node
// Servidor de arquivos mínimo para os testes (sem dependências): serve a pasta do projeto em http://localhost:4173.
// O Playwright liga este servidor sozinho (veja playwright.config.js). Para olhar o site na mão: `node tests/serve.js`.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const port = +process.env.PORT || 4173;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]); if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }           // nunca sai da pasta do projeto
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(file)] || 'application/octet-stream' }); res.end(data);
  });
}).listen(port, () => console.log('Servindo o portfólio em http://localhost:' + port));
