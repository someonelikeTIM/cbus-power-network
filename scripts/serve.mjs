import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.COLUMBUS_PREVIEW_ROOT || 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
const port = Number(process.env.COLUMBUS_PREVIEW_PORT || 4173);
const prefix=process.env.COLUMBUS_PREVIEW_PREFIX||'/';
if(!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(prefix))throw Error('Preview prefix must start/end with / and contain safe path segments.');
createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(prefix!=='/'&&pathname===prefix.slice(0,-1)){res.writeHead(302,{Location:prefix});res.end();return;}
    if(!pathname.startsWith(prefix)){res.writeHead(404);res.end('Not found');return;}
    pathname='/'+pathname.slice(prefix.length);
    const target = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    // Windows is case-insensitive; enforce the exact on-disk path for Pages parity.
    let directory=root;
    for(const segment of pathname.split('/').filter(Boolean).length?pathname.split('/').filter(Boolean):['index.html']){const entries=await (await import('node:fs/promises')).readdir(directory);if(!entries.includes(segment))throw Error('Case-sensitive path not found');directory=resolve(directory,segment);}
    const content = await readFile(target); res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}${prefix}`));
