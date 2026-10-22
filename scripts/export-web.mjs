import {cp,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'dist');
await mkdir(output,{recursive:true});
for(const name of ['index.html','manifest.webmanifest','service-worker.js','src','public','PRIVACY.md'])await cp(path.join(root,name),path.join(output,name),{recursive:true});
console.log('Self-contained web assets exported to dist/. Host on HTTPS for installation and offline caching. No keys or Android build files included.');
