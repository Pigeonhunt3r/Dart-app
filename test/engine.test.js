import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,throwDart,endTurn,checkout,checkoutOptions,recordTotal,bustTurn,points,MODES} from '../src/engine.js';
const g=(mode,opts)=>createGame(mode,['Anna','Bo'],opts);
const dart=(s,n,m=1)=>throwDart(s,n,m);
const turn=(s,ds)=>endTurn(ds.reduce((s,[n,m])=>dart(s,n,m),s));
test('all 12 games initialize and complete a representative turn',()=>{assert.equal(MODES.length,12);for(const {id} of MODES){const s=turn(g(id),[[20,3],[20,2],[25,2]]);assert.equal(s.active,1);assert.equal(s.darts.length,0);}});
test('X01 starts at configured score and subtracts darts',()=>{for(const start of [301,501,701,1001]){let s=dart(g('x01',{start}),20,3);assert.equal(s.players[0].score,start-60);}});
test('X01 bust restores whole turn and is immutable',()=>{const s=g('x01');s.players[0].score=50;let next=dart(s,20);next=dart(next,20,2);assert.equal(next.players[0].score,50);assert.equal(next.darts.length,3);assert.equal(s.darts.length,0);});
test('double out rejects single zero and remaining one; bullseye closes',()=>{let s=g('x01');s.players[0].score=20;assert.equal(dart(s,20).winner,null);s.players[0].score=21;assert.match(dart(s,20).message,/Bust/);s.players[0].score=50;assert.deepEqual(dart(s,25,2).winner,[0]);});
test('straight out permits a single finish',()=>{let s=g('x01',{doubleOut:false});s.players[0].score=20;assert.deepEqual(dart(s,20).winner,[0]);});
test('checkout gives T20 T19 D12 for 141 and bullseye for 50',()=>{assert.deepEqual(checkout(141),[{n:20,m:3},{n:19,m:3},{n:12,m:2}]);assert.deepEqual(checkout(50,1),[{n:25,m:2}]);assert.equal(checkout(169),null);assert.equal(checkout(170,2),null);assert.equal(checkout(1,3),null);assert.equal(checkout(40,0),null);assert.deepEqual(checkout(1,1,false),[{n:1,m:1}]);});
test('every suggested checkout totals correctly and obeys double-out and dart budget',()=>{for(const doubleOut of [true,false])for(let left=1;left<=3;left++)for(let score=1;score<=181;score++){const route=checkout(score,left,doubleOut);if(!route)continue;assert.equal(route.reduce((s,d)=>s+points(d),0),score);assert.ok(route.length<=left);if(doubleOut)assert.equal(route.at(-1).m,2);}});
test('three-dart double-out range excludes all bogey numbers',()=>{for(const n of [159,162,163,165,166,168,169])assert.equal(checkout(n),null);assert.ok(checkout(170));});
test('cricket closes, scores overflow, ignores closed opponents, and wins',()=>{let s=dart(g('cricket'),20,3);assert.equal(s.players[0].marks[20],3);s=dart(s,20,2);assert.equal(s.players[0].score,40);s.players[1].marks[20]=3;s=dart(s,20);assert.equal(s.players[0].score,40);s=endTurn(s);assert.equal(s.active,1);s.players[1].marks=Object.fromEntries([15,16,17,18,19,20,25].map(n=>[n,3]));s.players[1].score=50;assert.deepEqual(dart(s,0).winner,[1]);});
test('cut-throat penalizes only opponents still open',()=>{let s=g('cutthroat');s.players[0].marks[20]=3;s=dart(s,20,3);assert.equal(s.players[0].score,0);assert.equal(s.players[1].score,60);});
test('around world requires ordered targets and bull',()=>{let s=dart(g('around'),2);assert.equal(s.players[0].progress,1);s=dart(s,1,3);assert.equal(s.players[0].progress,2);s.players[0].progress=21;assert.deepEqual(dart(s,25).winner,[0]);});
test('double round ignores singles',()=>{let s=dart(g('clock'),1);assert.equal(s.players[0].progress,1);s=dart(s,1,2);assert.equal(s.players[0].progress,2);});
test('Shanghai wins only with all three multipliers in same turn',()=>{let s=g('shanghai');for(const m of [1,2,3])s=dart(s,1,m);assert.deepEqual(s.winner,[0]);});
test('Halve-it adds target hits and halves misses',()=>{let s=turn(g('halve'),[[15,3],[20,3],[0,1]]);assert.equal(s.players[0].score,85);s=turn(s,[[20,3],[0,1],[0,1]]);assert.equal(s.players[1].score,20);assert.equal(s.round,2);});
test('Baseball counts runs only on the inning number',()=>{let s=turn(g('baseball'),[[1,3],[1,2],[20,3]]);assert.equal(s.players[0].score,5);});
test('Golf uses last dart, allows early stop, and lowest wins',()=>{let s=turn(g('golf'),[[1,2],[20,1]]);assert.equal(s.players[0].score,5);s=turn(s,[[1,2]]);assert.equal(s.players[1].score,1);s.round=9;s.active=1;s.players[0].score=40;s.players[1].score=10;s=turn(s,[[9,2]]);assert.deepEqual(s.winner,[1]);});
test('Killer activates on own double and eliminates opponent',()=>{let s=g('killer');s.players[1].lives=1;s=dart(s,1,2);assert.equal(s.players[0].killer,true);s=dart(s,2,2);assert.equal(s.players[1].lives,0);assert.deepEqual(s.winner,[0]);});
test('elimination resets matching scores and restores opponents on bust',()=>{let s=g('elimination');s.players[0].score=280;s.players[1].score=300;s=dart(s,20);assert.equal(s.players[1].score,0);s=dart(s,20);assert.equal(s.players[0].score,280);assert.equal(s.players[1].score,300);});
test('finite games terminate with ties represented as shared victory',()=>{for(const [mode,rounds] of [['countup',8],['baseball',9],['shanghai',7],['halve',9],['golf',9]]){let s=g(mode);for(let i=0;i<rounds*2;i++)s=turn(s,[[0,1],[0,1],[0,1]]);assert.deepEqual(s.winner,[0,1]);}});
test('invalid darts and insufficient players are rejected',()=>{assert.throws(()=>createGame('killer',['A']));assert.throws(()=>dart(g('x01'),25,3));assert.throws(()=>dart(g('x01'),21));});

test('multiple checkout choices include triple and bull routes for 100',()=>{
 const options=checkoutOptions(100,3,true);
 assert.ok(options.length>1);assert.ok(options.some(r=>r.some(d=>d.n===20&&d.m===3)));
 assert.ok(options.some(r=>r.some(d=>d.n===25)));
 assert.equal(new Set(options.map(r=>JSON.stringify(r))).size,options.length);
});
test('all alternative checkouts obey score, darts left, legal intermediates and out rule',()=>{
 for(const doubleOut of [true,false])for(let left=1;left<=3;left++)for(let score=1;score<=180;score++){
  for(const route of checkoutOptions(score,left,doubleOut)){
   assert.ok(route.length<=left);assert.equal(route.reduce((sum,d)=>sum+points(d),0),score);
   if(doubleOut)assert.equal(route.at(-1).m,2);
   let remaining=score;for(const [i,d] of route.entries()){remaining-=points(d);if(i<route.length-1)assert.ok(remaining>=(doubleOut?2:1));}
  }
 }
 assert.deepEqual(checkoutOptions(169,3,true),[]);assert.deepEqual(checkoutOptions(100,1,true),[]);
 assert.deepEqual(checkoutOptions(50,1,true),[[{n:25,m:2}]]);
});

test('manual X01 visit subtracts once and supports undo snapshots',()=>{
 const before=g('x01');const after=recordTotal(before,100);assert.equal(after.players[0].score,401);assert.equal(before.players[0].score,501);assert.equal(after.darts.length,3);assert.equal(endTurn(after).active,1);
});
test('manual count up sums visits and invalid or ambiguous target entries fail',()=>{
 assert.equal(recordTotal(g('countup'),180).players[0].score,180);
 for(const total of [-1,181,179,1.5])assert.throws(()=>recordTotal(g('x01'),total));
 assert.throws(()=>recordTotal(g('cricket'),60));assert.throws(()=>recordTotal(dart(g('x01'),20),60));
});
test('manual double-out requires declared final hit and validates bull finishes',()=>{
 let s=g('x01');s.players[0].score=50;assert.throws(()=>recordTotal(s,50));assert.deepEqual(recordTotal(s,50,'bullseye').winner,[0]);
 assert.equal(recordTotal(s,50,'other').players[0].score,50);assert.match(recordTotal(s,50,'other').message,/Bust/);
 s.players[0].score=170;assert.deepEqual(recordTotal(s,170,'bullseye').winner,[0]);assert.equal(recordTotal(s,170,'double').winner,null);
 s.players[0].score=40;assert.deepEqual(recordTotal(s,40,'double').winner,[0]);assert.equal(recordTotal(s,40,'bullseye').winner,null);
 s.players[0].score=41;assert.match(recordTotal(s,40).message,/Bust/);
 s=g('x01',{doubleOut:false});s.players[0].score=20;assert.deepEqual(recordTotal(s,20).winner,[0]);
});
test('explicit bust restores current visit including elimination victims',()=>{
 let s=g('x01');s=dart(s,20,3);s=bustTurn(s);assert.equal(s.players[0].score,501);assert.equal(s.darts.length,3);
 s=g('elimination');s.players[0].score=80;s.players[1].score=100;s=dart(s,20);assert.equal(s.players[1].score,0);s=bustTurn(s);assert.equal(s.players[0].score,80);assert.equal(s.players[1].score,100);
});
