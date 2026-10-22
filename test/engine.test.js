import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,throwDart,endTurn,completeVisit,throwAroundRing,dartLabel,checkout,checkoutOptions,recordTotal,bustTurn,points,MODES,target} from '../src/engine.js';
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
test('cricket closes, scores overflow, ignores closed opponents, and wins',()=>{let s=dart(g('cricket',{cricketVariant:'classic'}),20,3);assert.equal(s.players[0].marks[20],3);s=dart(s,20,2);assert.equal(s.players[0].score,40);s.players[1].marks[20]=3;s=dart(s,20);assert.equal(s.players[0].score,40);s=endTurn(s);assert.equal(s.active,1);s.players[1].marks=Object.fromEntries([15,16,17,18,19,20,25].map(n=>[n,3]));s.players[1].score=50;assert.deepEqual(dart(s,0).winner,[1]);});
test('cut-throat penalizes only opponents still open',()=>{let s=g('cutthroat');s.players[0].marks[20]=3;s=dart(s,20,3);assert.equal(s.players[0].score,0);assert.equal(s.players[1].score,60);});
test('classic around world requires ordered targets and bull',()=>{let s=dart(g('around',{aroundVariant:'classic'}),2);assert.equal(s.players[0].progress,1);s=dart(s,1,3);assert.equal(s.players[0].progress,2);s.players[0].progress=21;assert.deepEqual(dart(s,25).winner,[0]);});
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


test('every game requires a nonblank player name instead of generating a default',()=>{
 for(const {id} of MODES){
  for(const invalid of ['', ' ', '\t\n', null, undefined, 7]){
   assert.throws(()=>createGame(id,['A',invalid]),`Mode ${id} accepted an invalid name: ${JSON.stringify(invalid)}`);
  }
  assert.throws(()=>createGame(id,['A','x'.repeat(25)]),`Mode ${id} accepted an overlong name`);
  for(const names of [Array(2),['A',,]])assert.throws(()=>createGame(id,names),`Mode ${id} accepted missing sparse-array names`);
  const game=createGame(id,[' A ','<B>']);
  assert.deepEqual(game.players.map(player=>player.name),['A','<B>']);
 }
});


test('extended Around the World advances by the hit multiplier and caps at Double',()=>{
 const original=createGame('around',['A']);
 assert.equal(original.options.aroundVariant,'extended');
 assert.equal(dart(original,1,2).players[0].progress,3);
 assert.equal(dart(original,1,3).players[0].progress,4);
 assert.equal(dart(original,2,3).players[0].progress,1);
 assert.equal(original.players[0].progress,1);
 for(const [progress,n,m] of [[19,19,3],[20,20,2],[20,20,3]]){
  const state=createGame('around',['A']);state.players[0].progress=progress;
  const next=dart(state,n,m);assert.equal(next.players[0].progress,21);assert.equal(next.winner,null);assert.equal(target(next),'Double');
 }
});
test('extended Around finishes through separate Double, Triple and Bull stages',()=>{
 let s=createGame('around',['A']);
 const visit=(n,m=1)=>{s=endTurn(dart(s,n,m));};
 for(const [n,m]of [[1,3],[4,2],[6,3],[9,3],[12,3],[15,3],[18,3]])visit(n,m);
 assert.equal(s.players[0].progress,21);assert.equal(target(s),'Double');
 visit(20);visit(20,3);visit(25,2);assert.equal(s.players[0].progress,21);
 visit(20,2);assert.equal(s.players[0].progress,22);assert.equal(target(s),'Triple');
 visit(1,2);assert.equal(s.players[0].progress,22);
 visit(1,3);assert.equal(s.players[0].progress,23);assert.equal(target(s),'Bull');assert.equal(s.winner,null);
 visit(20);assert.equal(s.players[0].progress,23);
 visit(25);assert.equal(s.players[0].progress,24);assert.deepEqual(s.winner,[0]);
 const bullseye=createGame('around',['A']);bullseye.players[0].progress=23;
 assert.deepEqual(dart(bullseye,25,2).winner,[0]);
});
test('legacy Around saves retain their classic progression without a variant option',()=>{
 const legacy=createGame('around',['A'],{aroundVariant:'classic'});delete legacy.options.aroundVariant;
 assert.equal(dart(legacy,1,3).players[0].progress,2);
 legacy.players[0].progress=21;assert.equal(target(legacy),'Bull');assert.deepEqual(dart(legacy,25,2).winner,[0]);
});
test('low X01 scores retain alternative multi-dart and double-out routes',()=>{
 const routes=checkoutOptions(40,3,true);
 assert.ok(routes.length>1);assert.deepEqual(routes[0],[{n:20,m:2}]);
 assert.ok(routes.some(route=>route.length>1));
 assert.ok(new Set(routes.map(route=>route.at(-1).n)).size>1);
 assert.deepEqual(checkoutOptions(40,1,true),[[{n:20,m:2}]]);
 assert.deepEqual(checkoutOptions(2,3,true),[[{n:1,m:2}]]);
});

test('extended Cricket credits one selected target per dart without double counting',()=>{
 let s=g('cricket');assert.equal(s.options.cricketVariant,'extended');
 s=throwDart(s,20,2,'double');
 assert.equal(s.players[0].marks.double,1);assert.equal(s.players[0].marks[20]||0,0);assert.equal(s.players[0].score,0);
 assert.equal(s.darts[0].category,'double');
 s=throwDart(s,20,3,'triple');
 assert.equal(s.players[0].marks.triple,1);assert.equal(s.players[0].marks[20]||0,0);
 s=throwDart(s,20,3);
 assert.equal(s.players[0].marks[20],3);assert.equal(s.players[0].marks.triple,1);assert.equal(s.players[0].score,0);
});
test('extended Cricket requires Double and Triple closures as well as numbers and Bull',()=>{
 let s=createGame('cricket',['A']);
 const visit=(n,m=1,category='number')=>{s=endTurn(throwDart(s,n,m,category));};
 for(const n of [20,19,18,17,16,15])visit(n,3);
 visit(25,2);visit(25);assert.equal(s.players[0].marks[25],3);assert.equal(s.winner,null);
 for(let i=0;i<3;i++)visit(7,2,'double');
 assert.equal(s.players[0].marks.double,3);assert.equal(s.winner,null);
 for(let i=0;i<3;i++)visit(8,3,'triple');
 assert.equal(s.players[0].marks.triple,3);assert.deepEqual(s.winner,[0]);
});
test('extended Cricket scores extra category hits using the actual field value',()=>{
 let s=g('cricket');s.players[0].marks.double=3;
 s=throwDart(s,7,2,'double');assert.equal(s.players[0].score,14);assert.equal(s.players[0].marks[7]||0,0);
 s.players[1].marks.double=3;s=throwDart(s,20,2,'double');assert.equal(s.players[0].score,14);
 let cut=createGame('cutthroat',['A','B','C']);cut.players[0].marks.triple=3;cut.players[2].marks.triple=3;
 cut=throwDart(cut,9,3,'triple');assert.equal(cut.players[0].score,0);assert.equal(cut.players[1].score,27);assert.equal(cut.players[2].score,0);
});
test('Cricket categories reject incorrect rings, Bull and classic variants',()=>{
 for(const [n,m,category]of [[20,1,'double'],[20,3,'double'],[20,2,'triple'],[25,2,'double'],[0,1,'double'],[20,2,'unknown']]){
  assert.throws(()=>throwDart(g('cricket'),n,m,category));
 }
 assert.throws(()=>throwDart(g('cricket',{cricketVariant:'classic'}),20,2,'double'));
 assert.throws(()=>throwDart(g('x01'),20,2,'double'));
});
test('legacy Cricket saves still win with the original seven targets',()=>{
 const legacy=g('cricket',{cricketVariant:'classic'});delete legacy.options.cricketVariant;
 legacy.players[0].marks=Object.fromEntries([20,19,18,17,16,15].map(n=>[n,3]));legacy.players[0].marks[25]=2;
 assert.deepEqual(dart(legacy,25).winner,[0]);
});


test('Done commits a full X01 total and advances once without changing the source',()=>{
 const before=g('x01'),recorded=recordTotal(before,100),snapshot=structuredClone(recorded),next=completeVisit(recorded);
 assert.equal(next.active,1);assert.equal(next.players[0].score,401);assert.equal(next.players[1].score,501);
 assert.equal(next.darts.length,0);assert.equal(next.turnStart,null);assert.equal(next.round,1);
 assert.deepEqual(next.lastVisit,{player:0,name:'Anna',score:401,total:100,bust:false});assert.deepEqual(recorded,snapshot);
 assert.equal(completeVisit(next),next,'A repeated confirmation must not skip another player');
});
test('Done completes partial X01 hits and solo turns without counting extra points',()=>{
 const recorded=throwDart(g('x01'),20,3),next=completeVisit(recorded);
 assert.equal(next.players[0].score,441);assert.equal(next.active,1);assert.equal(next.lastVisit.total,60);
 const solo=completeVisit(throwDart(createGame('x01',['A']),25));
 assert.equal(solo.active,0);assert.equal(solo.round,2);assert.equal(solo.players[0].score,476);assert.equal(solo.darts.length,0);
});
test('Done advances after a Bust and retains the restored score and result',()=>{
 let before=g('x01');before.players[0].score=40;
 const next=completeVisit(throwDart(throwDart(before,20),20,2));
 assert.equal(next.active,1);assert.equal(next.players[0].score,40);assert.equal(next.lastVisit.bust,true);assert.equal(next.lastVisit.total,0);
 const explicit=completeVisit(bustTurn(throwDart(g('x01'),20,3)));
 assert.equal(explicit.players[0].score,501);assert.equal(explicit.active,1);assert.equal(explicit.lastVisit.bust,true);
});
test('Done leaves winning X01 results and other game turns in place',()=>{
 const before=g('x01');before.players[0].score=40;const won=throwDart(before,20,2);
 assert.equal(completeVisit(won),won);assert.equal(won.active,0);assert.deepEqual(won.winner,[0]);
 for(const mode of ['countup','cricket','around']){const other=throwDart(g(mode),20);assert.equal(completeVisit(other),other);}
});
test('Around ring shortcuts use the current number and preserve final-stage labels',()=>{
 let state=g('around'),before=structuredClone(state);
 state=throwAroundRing(state,3);assert.equal(state.players[0].progress,4);assert.equal(dartLabel(state.darts[0]),'T1');assert.deepEqual(before,g('around'));
 state=throwAroundRing(state,2);assert.equal(state.players[0].progress,6);assert.equal(dartLabel(state.darts[1]),'D4');
 state.players[0].progress=21;state=endTurn(state);state.active=0;
 state=throwAroundRing(state,2);assert.equal(state.players[0].progress,22);assert.equal(dartLabel(state.darts[0]),'Double');assert.equal(points(state.darts[0]),0);
 state=throwAroundRing(state,3);assert.equal(state.players[0].progress,23);assert.equal(dartLabel(state.darts[1]),'Triple');
 assert.equal(state.winner,null);state=throwDart(state,25);assert.deepEqual(state.winner,[0]);
 assert.throws(()=>throwAroundRing(g('x01'),2));assert.throws(()=>throwAroundRing(g('around'),1));
});
