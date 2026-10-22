import test from 'node:test';
import assert from 'node:assert/strict';
import {server} from '../server.js';
test('serves the actual app and rejects private and unknown files',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(base);assert.equal(response.status,200);assert.match(await response.text(),/Oche Club/);
  const js=await fetch(base+'/src/app.js');assert.match(js.headers.get('content-type'),/javascript/);assert.match(await js.text(),/checkoutView/);
  const storage=await fetch(base+'/src/storage.js');assert.equal(storage.status,200);assert.match(await storage.text(),/createGameStorage/);
  for(const name of ['/package.json','/.git/config','/server.js','/missing','/%zz'])assert.equal((await fetch(base+name)).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
