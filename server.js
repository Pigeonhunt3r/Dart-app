import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.webmanifest':'application/manifest+json'};
export const server=http.createServer(async(req,res)=>{
  try {
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(root)||(!['/manifest.webmanifest','/service-worker.js','/public/icon.svg','/public/icon-192.png','/public/icon-512.png','/src/fonts/barlow-condensed-latin-800-normal.woff2','/src/fonts/barlow-condensed-latin-600-normal.woff2','/src/fonts/dm-sans-latin-400-normal.woff2','/src/fonts/dm-sans-latin-700-normal.woff2','/index.html','/src/app.js','/src/engine.js','/src/style.css'].includes(name)&&name!=='/')){res.writeHead(404);res.end('Ikke fundet');return;}
    const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)],'X-Content-Type-Options':'nosniff'});res.end(body);
  } catch {res.writeHead(404);res.end('Ikke fundet');}
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Oche Club kører på port '+(process.env.PORT||3000)));
