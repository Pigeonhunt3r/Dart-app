import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameStorage} from '../src/storage.js';

const snapshot=score=>JSON.stringify({version:1,game:{mode:'x01',players:[{name:'Anna',score}]},history:[]});
function browser(initial=null){
 const data=new Map(initial===null?[]:[['dartclub',initial]]),events=[];
 return {data,events,
  getItem(key){events.push(['get',key]);return data.get(key)??null;},
  setItem(key,value){events.push(['set',key,value]);data.set(key,value);},
  removeItem(key){events.push(['remove',key]);data.delete(key);}
 };
}
function native(initial=null){
 return {value:initial,events:[],
  load(){this.events.push(['load']);return this.value;},
  save(value){this.events.push(['save',value]);this.value=value;return true;}
 };
}

test('browser state can be read, replaced and deleted using the existing dartclub key',()=>{
 const web=browser(),store=createGameStorage({webStore:web});
 assert.equal(store.read(),null);
 store.write(snapshot(501));assert.equal(store.read(),snapshot(501));
 store.write(snapshot(401));assert.equal(store.read(),snapshot(401));
 store.write(null);assert.equal(store.read(),null);assert.equal(web.data.has('dartclub'),false);
 assert.ok(web.events.every(event=>event[1]==='dartclub'));
});

test('browser access, quota and deletion failures are surfaced',()=>{
 assert.throws(()=>createGameStorage({webStore:{getItem(){throw Error('access denied');}}}).read(),/access denied/);
 assert.throws(()=>createGameStorage({webStore:{setItem(){throw Error('quota exceeded');}}}).write(snapshot(401)),/quota exceeded/);
 assert.throws(()=>createGameStorage({webStore:{removeItem(){throw Error('delete denied');}}}).write(null),/delete denied/);
});

test('acknowledged native state is authoritative and does not read legacy state',()=>{
 const device=native(snapshot(401));let reads=0;
 const store=createGameStorage({nativeStore:device,webStore:{getItem(){reads++;throw Error('do not read');},removeItem(){}}});
 assert.equal(store.read(),snapshot(401));assert.equal(reads,0);
 store.write(snapshot(301));assert.equal(device.value,snapshot(301));assert.equal(store.read(),snapshot(301));
});

test('native write commits before removing stale browser data',()=>{
 const events=[],device={load:()=>null,save(value){events.push(['commit',value]);return true;}};
 const store=createGameStorage({nativeStore:device,webStore:{removeItem(key){events.push(['remove',key]);}}});
 store.write(snapshot(401));assert.deepEqual(events,[['commit',snapshot(401)],['remove','dartclub']]);
});

test('legacy browser data migrates only after an acknowledged native commit',()=>{
 const web=browser(snapshot(401)),device=native(),store=createGameStorage({nativeStore:device,webStore:web});
 assert.equal(store.read(),snapshot(401));assert.equal(device.value,snapshot(401));assert.equal(web.data.has('dartclub'),false);
 assert.deepEqual(device.events,[['load'],['save',snapshot(401)]]);
 web.events.length=0;
 assert.equal(store.read(),snapshot(401));assert.deepEqual(web.events,[]);
});

test('failed native writes do not fall back silently or delete the recoverable legacy game',()=>{
 const web=browser(snapshot(501)),device={load:()=>null,save:()=>false};
 const store=createGameStorage({nativeStore:device,webStore:web});
 assert.throws(()=>store.write(snapshot(401)),/saved durably/);
 assert.equal(web.data.get('dartclub'),snapshot(501));assert.equal(web.events.length,0);
 assert.throws(()=>store.read(),/saved durably/);
 assert.equal(web.data.get('dartclub'),snapshot(501));assert.ok(!web.events.some(event=>event[0]==='remove'));
});

test('native persistence exceptions and nonboolean acknowledgements are surfaced',()=>{
 assert.throws(()=>createGameStorage({nativeStore:{save(){throw Error('disk unavailable');}}}).write(snapshot(401)),/disk unavailable/);
 for(const acknowledgement of [false,undefined,null,'true',1]){
  assert.throws(()=>createGameStorage({nativeStore:{save:()=>acknowledgement}}).write(snapshot(401)),/saved durably/);
 }
});

test('cleared native tombstone prevents old localStorage data from resurrecting',()=>{
 const web=browser(snapshot(501));web.removeItem=()=>{throw Error('browser deletion unavailable');};
 const device=native(snapshot(401));const store=createGameStorage({nativeStore:device,webStore:web});
 store.write(null);assert.equal(device.value,'');assert.equal(web.data.get('dartclub'),snapshot(501));
 const reopened=createGameStorage({nativeStore:device,webStore:web});
 assert.equal(reopened.read(),null);assert.equal(web.events.length,0);
});

test('native state works when browser storage is inaccessible or absent',()=>{
 const inaccessible={getItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 const device=native();const store=createGameStorage({nativeStore:device,webStore:inaccessible});
 assert.equal(store.read(),null);assert.deepEqual(device.events,[['load']]);
 store.write(snapshot(401));assert.equal(store.read(),snapshot(401));
 const noBrowser=createGameStorage({nativeStore:native()});assert.equal(noBrowser.read(),null);
 noBrowser.write(snapshot(301));assert.equal(noBrowser.read(),snapshot(301));
});

test('empty browser storage does not create needless native commits',()=>{
 const device=native(),store=createGameStorage({nativeStore:device,webStore:browser()});
 assert.equal(store.read(),null);assert.deepEqual(device.events,[['load']]);
});

test('storage accepts serialized game strings and rejects accidental object writes',()=>{
 for(const store of [createGameStorage({webStore:browser()}),createGameStorage({nativeStore:native()})]){
  for(const invalid of [undefined,{},[],42])assert.throws(()=>store.write(invalid),TypeError);
  store.write(snapshot(401));store.write('');assert.equal(store.read(),null);
 }
});
