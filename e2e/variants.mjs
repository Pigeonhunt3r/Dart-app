import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {throwHit,finishVisit} from './controls.mjs';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({locale:'en-US',viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
page.on('dialog',dialog=>dialog.accept());
await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3000');
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dartclub')));
const state=async()=>(await saved()).game;
async function solo(mode,variant='extended'){
 await page.locator(`[data-mode=${mode}]`).click();
 if(['around','cricket'].includes(mode))await page.locator(`#${mode}-variant`).selectOption(variant);
 await page.locator('#remove-player').click();await page.locator('[name=player]').fill('A');await page.locator('.start-button').click();
}
async function visit(n,m=1){await throwHit(page,n,m);if((await state()).winner===null)await finishVisit(page);}
async function categoryVisit(category,n){
 await page.locator(`[data-hit=${category}]`).click();await page.locator('#category-number').selectOption(String(n));await page.locator('#add-dart').click();
 if((await state()).winner===null)await finishVisit(page);
}
async function leave(){await page.locator('#leave').click();await page.locator('.game-card').first().waitFor();}

// Extended Around starts with multiplier-based jumps; unconfirmed taps remain drafts.
await solo('around');assert.equal((await state()).options.aroundVariant,'extended');
assert.equal(await page.locator('.match-score-strip .player-row').count(),1);
for(let i=0;i<3;i++)await page.locator('[data-hit="1"]').click();
assert.equal((await state()).players[0].progress,1);await page.locator('#add-dart').click();
assert.equal((await state()).players[0].progress,4);assert.match(await page.locator('#turn-guide .guide-target').innerText(),/\b4\b/);
await page.locator('#undo').click();assert.equal((await state()).players[0].progress,1);
await page.locator('[data-hit=double]').click();await page.locator('[data-hit="1"]').click();assert.equal(await page.locator('#pending-dart').innerText(),'1','A number starts at single after a ring shortcut');
await page.locator('[data-hit=triple]').click();assert.match(await page.locator('#pending-dart').innerText(),/^T1$/);await page.locator('#add-dart').click();await finishVisit(page);
await page.locator('[data-hit=double]').click();assert.match(await page.locator('#pending-dart').innerText(),/^D4$/);await page.locator('#add-dart').click();await finishVisit(page);
for(const[n,m]of [[6,3],[9,3],[12,3],[15,3],[18,3]])await visit(n,m);
assert.equal((await state()).players[0].progress,21);assert.match(await page.locator('#turn-guide').innerText(),/Double/i);
await visit(25,2);assert.equal((await state()).players[0].progress,21,'Bullseye must not bypass the separate numbered Double stage');
assert.equal(await page.locator('[data-hit=triple]').isDisabled(),true);
await page.locator('[data-hit=double]').click();assert.match(await page.locator('#pending-dart').innerText(),/^Double$/);await page.locator('#add-dart').click();await finishVisit(page);assert.equal((await state()).players[0].progress,22);assert.match(await page.locator('#turn-guide').innerText(),/Triple/i);
assert.equal(await page.locator('[data-hit=double]').isDisabled(),true);
await page.locator('[data-hit=triple]').click();assert.match(await page.locator('#pending-dart').innerText(),/^Triple$/);await page.locator('#add-dart').click();await finishVisit(page);assert.equal((await state()).players[0].progress,23);
assert.equal(await page.locator('[data-hit=double]').isDisabled(),true);assert.equal(await page.locator('[data-hit=triple]').isDisabled(),true);assert.match(await page.locator('#turn-guide').innerText(),/Bull/i);
await visit(25);await page.locator('.winner').waitFor();assert.deepEqual((await state()).winner,[0]);
await page.locator('#rematch').click();assert.equal((await state()).options.aroundVariant,'extended');assert.equal((await state()).players[0].progress,1);await leave();

// The classic route is selectable and old results retain that rule on rematch.
await solo('around','classic');await visit(1,3);assert.equal((await state()).players[0].progress,2);
for(let n=2;n<=20;n++)await visit(n);await visit(25);await page.locator('.winner').waitFor();
await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('dartclub'));delete data.game.options.aroundVariant;for(const old of data.history)delete old.options.aroundVariant;localStorage.setItem('dartclub',JSON.stringify(data));});
await page.reload();await page.locator('#rematch').click();assert.equal((await state()).options.aroundVariant,'classic');await visit(1,3);assert.equal((await state()).players[0].progress,2);await leave();

// Extended Cricket exposes the two extra targets before Bull, with no guessed field.
await solo('cricket');assert.equal((await state()).options.cricketVariant,'extended');
assert.deepEqual(await page.locator('.hit-pad [data-hit]').evaluateAll(buttons=>buttons.map(button=>button.dataset.hit)),['20','19','18','17','16','15','double','triple','25']);
const labels=await page.locator('.cricket-scroll tbody tr > th').allTextContents();
assert.equal(labels.length,9);assert.match(labels[6],/Double/i);assert.match(labels[7],/Triple/i);assert.match(labels[8],/Bull/i);
await page.locator('[data-hit=double]').click();assert.equal(await page.locator('#category-number').inputValue(),'');assert.equal(await page.locator('#add-dart').isDisabled(),true);
await page.locator('#category-number').selectOption('20');await page.locator('#add-dart').click();
assert.equal((await state()).players[0].marks.double,1);assert.equal((await state()).players[0].marks[20]||0,0);
await page.locator('#undo').click();assert.equal((await state()).players[0].marks.double||0,0);
await page.locator('#calculator').click();await page.locator('#calculator-credit').selectOption('double');
await page.locator('[data-board-n="20"][data-board-m="3"]').click();assert.ok((await page.locator('.calculator-error').innerText()).trim());
assert.equal((await state()).players[0].marks.double||0,0);
await page.locator('[data-board-n="20"][data-board-m="2"]').click();assert.equal((await state()).players[0].marks.double||0,0);
await page.locator('#calculator-done').click();assert.equal((await state()).players[0].marks.double,1);assert.equal((await state()).players[0].marks[20]||0,0);
await page.locator('#undo').click();
for(const n of [20,19,18,17,16,15])await visit(n,3);
for(let i=0;i<3;i++)await categoryVisit('double',1);
for(let i=0;i<3;i++)await categoryVisit('triple',2);
assert.equal((await state()).winner,null,'Bull still needs closing after all number, Double and Triple targets');
await visit(25,2);await visit(25);await page.locator('.winner').waitFor();await page.locator('#rematch').click();
assert.equal((await state()).options.cricketVariant,'extended');assert.equal(await page.locator('.cricket-scroll tbody tr').count(),9);await leave();

// Original seven-target games stay playable and remain classic after an old-save rematch.
await solo('cricket','classic');assert.equal(await page.locator('.cricket-scroll tbody tr').count(),7);assert.equal(await page.locator('[data-hit=double]').count(),0);
for(const n of [20,19,18,17,16,15])await visit(n,3);await visit(25,2);await visit(25);await page.locator('.winner').waitFor();
await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('dartclub'));delete data.game.options.cricketVariant;for(const old of data.history)delete old.options.cricketVariant;localStorage.setItem('dartclub',JSON.stringify(data));});
await page.reload();await page.locator('#rematch').click();assert.equal((await state()).options.cricketVariant,'classic');assert.equal(await page.locator('.cricket-scroll tbody tr').count(),7);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.deepEqual(errors,[]);
console.log('Variant checks passed: top player scores, multiplier-based Around jumps, separate Double/Triple/Bull finish, classic and legacy rematches, nine Cricket targets, exclusive category credit, calculator validation and full wins.');
await browser.close();
