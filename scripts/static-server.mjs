#!/usr/bin/env node
// Servidor estático mínimo (sem dependências) para servir o build do Angular
// (dist/pastoral-frontend/browser) atrás do PM2, com fallback de SPA para
// index.html — necessário porque o Angular Router usa rotas sem hash (#).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.env.STATIC_ROOT ?? 'dist/pastoral-frontend/browser';
const PORT = Number(process.env.PORT ?? 4300);
const HOST = process.env.HOST ?? '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolveStaticFile(pathname) {
  const safePath = normalize(pathname).replace(/^([.]{2}[/\\])+/, '');
  const filePath = join(ROOT, safePath);
  try {
    const info = await stat(filePath);
    if (info.isFile()) return filePath;
  } catch {
    // Arquivo não existe — cai no fallback de SPA.
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  // config.json nunca deve ser cacheado pelo navegador (ver app-config.loader.ts).
  if (url.pathname === '/config.json') res.setHeader('Cache-Control', 'no-store');

  const direct = await resolveStaticFile(url.pathname);
  const filePath = direct ?? join(ROOT, 'index.html');

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Servindo ${ROOT} em http://${HOST}:${PORT}`);
});
