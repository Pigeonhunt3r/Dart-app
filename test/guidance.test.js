import test from 'node:test';
import assert from 'node:assert/strict';
import {guidance} from '../src/guidance.js';
import {MODES,createGame,throwDart,bustTurn} from '../src/engine.js';

const make=(mode,options={})=>{const game=createGame(mode,['Alex','Bo'],options);game.options={...game.options,...options};return game;};

test('every mode explains its current goal without changing the saved position',()=>{
 for(const mode of MODES){
  const game=make(mode.id),before=structuredClone(game),guide=guidance(game);
  for(const key of ['title','target','detail','action'])assert.ok(guide[key].length,`${mode.id}: ${key}`);
  assert.match(guide.title,/Alex/);assert.deepEqual(game,before);
 }
});

test('Around guidance follows numeric, double, triple and bull stages and preserves classic instructions',()=>{
 const game=make('around',{aroundVariant:'extended'});
 game.players[0].progress=7;
 assert.equal(guidance(game).target,'Hit 7');assert.match(guidance(game).detail,/double two and a triple three/);
 for(const [progress,expected]of [[21,'Any double'],[22,'Any triple'],[23,'Bull']]){
  game.players[0].progress=progress;assert.equal(guidance(game).target,expected);
  if(progress===21)assert.match(guidance(game).detail,/D1–D20.*Bullseye does not count/);
  if(progress===22)assert.match(guidance(game).detail,/T1–T20/);
 }
 const classic=make('around',{aroundVariant:'classic'});assert.match(guidance(classic).detail,/each advance one target/);
 classic.players[0].progress=21;assert.equal(guidance(classic).target,'Bull');
});

test('extended Cricket guidance lists required Double and Triple targets above Bull',()=>{
 const game=make('cricket',{cricketVariant:'extended'});
 for(const n of [20,19,18,17,16,15])game.players[0].marks[n]=3;
 assert.equal(guidance(game).target,'Close Double');
 game.players[0].marks.double=2;assert.match(guidance(game).detail,/1 more mark needed on Double/);assert.match(guidance(game).detail,/one row only/);assert.match(guidance(game).detail,/numbered double/);
 game.players[0].marks.double=3;assert.equal(guidance(game).target,'Close Triple');
 game.players[0].marks.triple=3;assert.equal(guidance(game).target,'Close Bull');
 const classic=make('cricket',{cricketVariant:'classic'});
 for(const n of [20,19,18,17,16,15])classic.players[0].marks[n]=3;
 assert.equal(guidance(classic).target,'Close Bull');
});

test('closed Cricket targets lead to points instructions while behind',()=>{
 for(const mode of ['cricket','cutthroat']){
  const game=make(mode,{cricketVariant:'extended'});
  for(const key of [20,19,18,17,16,15,'double','triple',25])game.players[0].marks[key]=3;
  game.players[0].score=mode==='cricket'?0:40;game.players[1].score=mode==='cricket'?40:0;
  const guide=guidance(game);assert.match(guide.detail,/opponents still have open/);assert.match(guide.detail,/Double/);
 }
});

test('Shanghai guidance removes fields already hit in this turn',()=>{
 let game=make('shanghai');
 assert.match(guidance(game).target,/Single \+ Double \+ Triple/);
 game=throwDart(game,1,1);assert.equal(guidance(game).target,'1: need Double + Triple');
 assert.equal(guidance(game).action,'Add dart');
 game=throwDart(game,1,2);assert.equal(guidance(game).target,'1: need Triple');
 assert.match(guidance(game).title,/1 dart left/);
});

test('target games keep the next dart as the primary action while darts remain',()=>{
 let game=make('around',{aroundVariant:'extended'});
 game=throwDart(game,1);assert.equal(guidance(game).action,'Add dart');
 game=throwDart(game,2);assert.equal(guidance(game).action,'Add dart');
 game=throwDart(game,3);assert.equal(guidance(game).action,'Next player');
});

test('Killer guidance changes from activation to living opponents’ doubles',()=>{
 const game=make('killer');assert.match(guidance(game).target,/D1/);
 game.players[0].killer=true;assert.match(guidance(game).detail,/D2 \(Bo\)/);
 assert.doesNotMatch(guidance(game).detail,/D1 \(Alex\)/);
});

test('Golf explains the result of stopping now and the last-dart rule',()=>{
 let game=make('golf');assert.match(guidance(game).detail,/D1 = 1 stroke/);
 game=throwDart(game,1,2);assert.match(guidance(game).detail,/1 stroke\./);assert.equal(guidance(game).action,'End turn');
 game=throwDart(game,0);assert.match(guidance(game).detail,/5 strokes/);
 game=throwDart(game,1,3);assert.match(guidance(game).detail,/2 strokes/);assert.equal(guidance(game).action,'Next player');
});

test('completed Halve-it turns explain pending halving or added points',()=>{
 let missed=make('halve');for(let i=0;i<3;i++)missed=throwDart(missed,0);
 assert.match(guidance(missed).detail,/halve to 20/);assert.equal(guidance(missed).action,'Next player');
 let scored=make('halve');for(let i=0;i<3;i++)scored=throwDart(scored,15);
 assert.match(guidance(scored).detail,/add 45 points/);
});

test('Bust and completed-game instructions replace normal targeting',()=>{
 const busted=bustTurn(throwDart(make('x01'),20));
 assert.match(guidance(busted).title,/Bust/);assert.match(guidance(busted).detail,/Scores are back/);assert.equal(guidance(busted).action,'Done');
 const won=make('around');won.winner=[0];
 assert.match(guidance(won).title,/Alex wins/);assert.equal(guidance(won).target,'Game complete');assert.equal(guidance(won).action,'Rematch or another mode');
});
