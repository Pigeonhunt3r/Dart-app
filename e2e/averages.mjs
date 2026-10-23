import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {enterScore,throwHit,finishVisit} from './controls.mjs';

await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const errors=[];
async function openPage(locale='en-US'){
 const page=await browser.newPage({locale,viewport:{width:390,height:844}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  window.OcheGameStore={load:()=>sessionStorage.getItem('native-game'),save:value=>{
   if(sessionStorage.getItem('fail-save')==='yes')return false;
   sessionStorage.setItem('native-game',value);return true;
  }};
 });
 await page.goto(base);return page;
}
const page=await openPage();
const saved=page=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('native-game')));
const average=(page,index=0)=>page.locator(`[data-average-player="${index}"]`).innerText();
const fail=(page,value)=>page.evaluate(value=>sessionStorage.setItem('fail-save',value?'yes':'no'),value);
async function fresh(page,{mode='x01',players=1,start='501',straight=false}={}){
 await page.evaluate(()=>{sessionStorage.removeItem('native-game');sessionStorage.removeItem('fail-save');});await page.reload();
 await page.locator(`[data-mode=${mode}]`).click();
 if(players===1)await page.locator('#remove-player').click();
 for(let i=0;i<players;i++)await page.locator('[name=player]').nth(i).fill(['Alex','Bo'][i]);
 if(mode==='x01'){await page.locator('#start').selectOption(start);if(straight)await page.locator('#out').selectOption('straight');}
 await page.locator('.start-button').click();
}
async function digits(page,total,modal=false){
 const prefix=modal?'data-digit':'data-score-digit';
 if(!modal){const tab=page.locator('#score-tab');if(await tab.getAttribute('aria-pressed')!=='true')await tab.click();}
 for(const digit of String(total))await page.locator(`[${prefix}="${digit}"]`).click();
}

// The requested background is dark on both the canvas and scoring surfaces.
await fresh(page,{players:2});
const colours=await page.evaluate(()=>['html','.input-panel'].map(selector=>getComputedStyle(document.querySelector(selector)).backgroundColor));
for(const colour of colours){const channels=colour.match(/[\d.]+/g).map(Number);assert.ok(channels.slice(0,3).every(value=>value<100)&&(channels.length<4||channels[3]>.9),`Expected a dark opaque surface, got ${colour}`);}
assert.equal(await average(page),'—');assert.equal(await average(page,1),'—');
// Enter activates focused help; only an unfocused scoring shortcut may submit a total.
const beforeHelp=JSON.stringify(await saved(page));await digits(page,100);
await page.locator('.averages-note summary').focus();await page.keyboard.press('Enter');
assert.equal(await page.locator('.averages-note').evaluate(element=>element.open),true);
assert.equal(JSON.stringify(await saved(page)),beforeHelp);assert.equal(await page.locator('#score-display').innerText(),'100');
await page.keyboard.press('Enter');assert.equal(await page.locator('.averages-note').evaluate(element=>element.open),false);
assert.equal(JSON.stringify(await saved(page)),beforeHelp);await page.locator('[data-score-digit="C"]').click();
await page.keyboard.type('2');await page.keyboard.press('Enter');assert.equal(await average(page),'2.00');
await page.locator('#undo').click();assert.equal(JSON.stringify(await saved(page)),beforeHelp);

await page.locator('#calculator').click();await page.locator('#total-tab').click();await digits(page,100,true);await page.locator('#calculator-done').click();
assert.equal(await average(page),'100.00');assert.equal(await average(page,1),'—');
assert.deepEqual((await saved(page)).game.players[0].scoringStats,{points:100,darts:3});
const beforeDraft=JSON.stringify(await saved(page));
await page.locator('#calculator').click();await page.locator('[data-board-n="20"][data-board-m="3"]').click();await page.locator('#close-calculator').click();
assert.equal(JSON.stringify(await saved(page)),beforeDraft);assert.equal(await average(page,1),'—');
await enterScore(page,0);assert.equal(await average(page,1),'0.00');
await enterScore(page,50);assert.equal(await average(page),'75.00');
await page.reload();assert.equal(await average(page),'75.00');assert.equal(await average(page,1),'0.00');
assert.deepEqual((await saved(page)).game.players[0].scoringStats,{points:150,darts:6});
await page.screenshot({path:'artifacts/averages-dark.png',fullPage:true});
await page.locator('#undo').click();assert.equal(await average(page),'100.00');
await page.reload();assert.equal(await average(page),'100.00');

// Bust cancels this turn's points but counts the three-dart visit; undo restores both.
await fresh(page);await enterScore(page,100);await throwHit(page,20,3);assert.equal(await average(page),'120.00');
await throwHit(page,0);assert.equal(await average(page),'96.00');
await page.locator('#bust').click();assert.equal(await average(page),'50.00');
assert.deepEqual((await saved(page)).game.players[0].scoringStats,{points:100,darts:6});
await page.locator('#undo').click();assert.equal(await average(page),'96.00');
await finishVisit(page);assert.equal(await average(page),'80.00');
await page.reload();assert.equal(await average(page),'80.00');

// Exact checkouts count only the darts actually thrown, then rematch clears statistics.
await fresh(page,{start:'301'});await enterScore(page,180);await enterScore(page,80);
await throwHit(page,1);await throwHit(page,20,2);await page.locator('.winner').waitFor();
assert.equal(await average(page),'112.88');assert.deepEqual((await saved(page)).game.players[0].scoringStats,{points:301,darts:8});
await page.locator('#rematch').click();assert.equal(await average(page),'—');
assert.deepEqual((await saved(page)).game.players[0].scoringStats,{points:0,darts:0});

// Manual finishes expose their real dart count in both numeric entry methods.
for(const modal of [false,true]){
 await fresh(page,{start:'301'});await enterScore(page,180);await enterScore(page,81);
 if(modal){await page.locator('#calculator').click();await page.locator('#total-tab').click();}
 await digits(page,40,modal);
 await page.locator(modal?'#finish-choice':'#score-finish').selectOption('double');
 const selector=modal?'#finish-darts':'#score-darts';assert.equal(await page.locator(selector).inputValue(),'3');
 await page.locator(selector).selectOption(modal?'3':'1');await page.locator(modal?'#calculator-done':'#score-done').click();
 await page.locator('.winner').waitFor();assert.equal(await average(page),modal?'100.33':'129.00');
 assert.equal((await saved(page)).game.players[0].scoringStats.darts,modal?9:7);
}
await fresh(page,{start:'301',straight:true});await enterScore(page,180);await enterScore(page,101);
await digits(page,20);assert.equal(await page.locator('#score-finish').count(),0);await page.locator('#score-darts').selectOption('1');await page.locator('#score-done').click();
await page.locator('.winner').waitFor();assert.equal(await average(page),'129.00');

// Count Up averages remain correct through its complete eight-turn game and rematch.
await fresh(page,{mode:'countup'});
for(const total of [180,60,0,0,0,0,0,0]){await enterScore(page,total);await finishVisit(page);}
await page.locator('.winner').waitFor();assert.equal(await average(page),'30.00');
assert.deepEqual((await saved(page)).game.players[0].scoringStats,{points:240,darts:24});
await page.locator('#rematch').click();assert.equal(await average(page),'—');

// Old saves have no full dart history: show no invented average until a new game.
await fresh(page);await enterScore(page,100);
await page.evaluate(()=>{const saved=JSON.parse(sessionStorage.getItem('native-game'));for(const game of [saved.game,...saved.history])for(const player of [...game.players,...(game.turnStart||[])])delete player.scoringStats;sessionStorage.setItem('native-game',JSON.stringify(saved));});
await page.reload();assert.equal(await average(page),'—');
assert.match(await page.locator('.averages-note').textContent(),/new game|rematch/i);
for(const total of [180,180])await enterScore(page,total);await throwHit(page,1);await throwHit(page,20,2);await page.locator('.winner').waitFor();
assert.equal(await average(page),'—');await page.locator('#rematch').click();await enterScore(page,60);assert.equal(await average(page),'60.00');

// Failed commits never advance the counter, including calculator drafts and retries.
await fresh(page);await fail(page,true);await digits(page,100);await page.locator('#score-done').click();
assert.equal(await average(page),'—');assert.deepEqual((await saved(page)).game.players[0].scoringStats,{points:0,darts:0});
await fail(page,false);await page.locator('#score-done').click();assert.equal(await average(page),'100.00');
await page.locator('#undo').click();assert.equal(await average(page),'—');
await page.locator('#calculator').click();await page.locator('[data-board-n="20"][data-board-m="3"]').click();await fail(page,true);await page.locator('#calculator-done').click();
assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await average(page),'—');
await fail(page,false);await page.locator('#calculator-done').click();assert.equal(await average(page),'60.00');

const danish=await openPage('da-DK');await fresh(danish);await enterScore(danish,100);
assert.equal(await danish.locator('html').getAttribute('lang'),'da');assert.equal(await average(danish),'100,00');
assert.doesNotMatch(await danish.locator('.player-average').innerText(),/3-dart avg/);
await danish.close();await page.close();assert.deepEqual(errors,[]);
console.log('Average checks passed: dark surfaces, player-specific three-dart averages, calculator and inline totals, exact hits, misses, Bust and undo, partial visits, exact/manual checkouts, Count Up, rematch, legacy saves, failed-write retries, reload persistence and Danish formatting.');
await browser.close();
