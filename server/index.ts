// T2.4: HTTP server entry point. Wires walk.ts + classify.ts + liveCache.ts.
//
//   GET /                 -> ../dist-shell/index.html (built frontend shell)
//   GET /assets/*          -> ../dist-shell static assets
//   GET /api/tree?path=    -> DirListing (one directory level, live)
//   GET /api/file?path=    -> FileContent (live, cached by mtime+size)
//   GET /raw/*             -> raw bytes (images), streamed directly
//
// argv: --root <path> --port <n> (0 = OS-assigned). Logs a single
// "listening on <port>" line once bound -- lua/repo-browser/server.lua
// waits on that line to know the server is ready before opening the browser.

import { createServer } from 'node:http';
import { readFileSync, statSync, createReadStream } from 'node:fs';
import { join, normalize, extname, basename } from 'node:path';
import { listDir, repoName } from './walk';
import { classifyFile } from './classify';
import { LiveCache } from './liveCache';
import type { DirListing, FileContent } from '../shared/types';

function parseArgs(argv: string[]): { root: string; port: number } {
  let root = process.cwd();
  let port = 0;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') root = argv[++i];
    else if (argv[i] === '--port') port = Number(argv[++i]);
  }
  return { root, port };
}

const { root, port } = parseArgs(process.argv.slice(2));
const dirCache = new LiveCache<DirListing>();
const fileCache = new LiveCache<FileContent>();

const STATIC_MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const RAW_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
};

// Resolves a client-supplied relative path against `root`, rejecting any
// attempt to escape it (e.g. "../../etc/passwd").
function safeJoin(root: string, relPath: string): string | null {
  const cleaned = relPath.replace(/^\/+/, '');
  const abs = normalize(join(root, cleaned));
  if (abs !== root && !abs.startsWith(root + '/')) return null;
  return abs;
}

// __dirname is server/dist when compiled, but plain server/ under `tsx
// index.ts` in dev -- normalize to server/'s own dir either way.
const serverDir = basename(__dirname) === 'dist' ? join(__dirname, '..') : __dirname;
const shellDir = join(serverDir, '..', 'dist-shell');

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname === '/api/tree') {
    const relPath = url.searchParams.get('path') ?? '';
    const absPath = safeJoin(root, relPath);
    if (!absPath) return send(res, 400, 'text/plain', 'invalid path');
    try {
      const stat = statSync(absPath);
      const listing = dirCache.getOrLoad(relPath, stat.mtimeMs, stat.size, () => listDir(root, relPath));
      return send(res, 200, 'application/json', JSON.stringify(listing));
    } catch {
      return send(res, 404, 'text/plain', 'not found');
    }
  }

  if (url.pathname === '/api/file') {
    const relPath = url.searchParams.get('path') ?? '';
    const absPath = safeJoin(root, relPath);
    if (!absPath) return send(res, 400, 'text/plain', 'invalid path');
    try {
      const stat = statSync(absPath);
      const file = fileCache.getOrLoad(relPath, stat.mtimeMs, stat.size, () =>
        classifyFile(absPath, relPath, stat.size),
      );
      return send(res, 200, 'application/json', JSON.stringify(file));
    } catch {
      return send(res, 404, 'text/plain', 'not found');
    }
  }

  if (url.pathname.startsWith('/raw/')) {
    const relPath = url.pathname.slice('/raw/'.length);
    const absPath = safeJoin(root, relPath);
    if (!absPath) return send(res, 400, 'text/plain', 'invalid path');
    try {
      statSync(absPath); // 404s cleanly before streaming starts
      const mime = RAW_MIME[extname(absPath).toLowerCase()] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      createReadStream(absPath).pipe(res);
      return;
    } catch {
      return send(res, 404, 'text/plain', 'not found');
    }
  }

  // static frontend shell
  const staticRel = url.pathname === '/' ? '/index.html' : url.pathname;
  const staticAbs = safeJoin(shellDir, staticRel);
  if (staticAbs) {
    try {
      const body = readFileSync(staticAbs);
      const mime = STATIC_MIME[extname(staticAbs)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(body);
      return;
    } catch {
      // fall through to 404
    }
  }
  send(res, 404, 'text/plain', 'not found');
});

function send(res: import('node:http').ServerResponse, status: number, contentType: string, body: string) {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
}

server.listen(port, '127.0.0.1', () => {
  const addr = server.address();
  const boundPort = typeof addr === 'object' && addr ? addr.port : port;
  console.log(`nvim-repo-browser: serving ${repoName(root)} -- listening on ${boundPort}`);
});
