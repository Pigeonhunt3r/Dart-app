import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
import assert from 'node:assert/strict';
import {throwHit,enterScore} from './controls.mjs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const BASE=process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const page=await browser.newPage({locale:'da-DK',viewport:{width:1440,height:1100}});
async function startGame(){
 const fields=page.locator('[name=player]');
 for(let i=0;i<await fields.count();i++)if(!(await fields.nth(i).inputValue()).trim())await fields.nth(i).fill(`Spiller ${i+1}`);
 await page.locator('.start-button').click();
}
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(BASE);
await page.locator('.game-card').first().waitFor();
assert.equal(await page.locator('.game-card').count(),12);
for(const id of ['x01','cricket','cutthroat','around','clock','shanghai','halve','countup','baseball','killer','elimination','golf']){
 await page.locator(`[data-rules=${id}]`).click();assert.equal(await page.locator('dialog').count(),1);
 assert.match(await page.locator('dialog').innerText(),/Målet med spillet/);assert.match(await page.locator('dialog').innerText(),/Et eksempel/);
 await page.locator('dialog summary').click();assert.match(await page.locator('dialog').innerText(),/D20 = 40/);
 await page.locator('#close-rules').click();await page.locator('dialog').waitFor({state:'detached'});
}
await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
// The ordinary turn-total keypad is visible immediately; dartboard entry is one icon away.
await page.locator('[data-mode=x01]').click();await startGame();
assert.equal(await page.locator('[data-score-digit]').count(),12);
assert.equal(await page.locator('[data-mult]').count(),0);
assert.equal(await page.locator('#calculator svg').count(),1);
for(const digit of ['1','8','1'])await page.locator(`[data-score-digit="${digit}"]`).click();
await page.locator('#score-done').click();assert.match(await page.locator('#score-error').innerText(),/180/);
assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('[data-score-digit=C]').click();assert.equal(await page.locator('#score-display').innerText(),'0');assert.equal(await page.locator('#score-done').isDisabled(),true);
for(const digit of ['1','0','5','⌫','0'])await page.locator(`[data-score-digit="${digit}"]`).click();
assert.match(await page.locator('#score-done').innerText(),/100/);
assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('#score-done').click();assert.equal(await page.locator('.active-player > strong').innerText(),'401');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dartclub')).game.darts.length),3);
await page.locator('#undo').click();assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('#hits-tab').click();
const originalSave=await page.evaluate(()=>localStorage.getItem('dartclub'));
for(const label of [/20/,/D20/,/T20/]){
 await page.locator('[data-hit="20"]').click();assert.match(await page.locator('#pending-dart').innerText(),label);
 assert.equal(await page.locator('.active-player > strong').innerText(),'501');
 assert.equal(await page.evaluate(()=>localStorage.getItem('dartclub')),originalSave);
}
await page.locator('#add-dart').click();assert.equal(await page.locator('.active-player > strong').innerText(),'441');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dartclub')).game.darts.length),1);
for(let i=0;i<2;i++)await throwHit(page,20,3);
assert.equal(await page.locator('.active-player > strong').innerText(),'321');
assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('dartclub')).game.darts.map(d=>d.m)),[3,3,3]);
for(let i=0;i<3;i++)await page.locator('#undo').click();
await throwHit(page,25,2);assert.equal(await page.locator('.active-player > strong').innerText(),'451');
await page.locator('#undo').click();await page.locator('#hits-tab').click();
for(let i=0;i<3;i++)await page.locator('[data-hit="25"]').click();assert.equal(await page.locator('#pending-dart').innerText(),'Bull');
await page.locator('[data-hit="20"]').click();await page.locator('[data-hit="20"]').click();await page.locator('[data-hit="19"]').click();
assert.match(await page.locator('#pending-dart').innerText(),/19/);assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('#score-tab').click();assert.equal(await page.locator('.active-player > strong').innerText(),'501');await page.locator('#hits-tab').click();assert.equal(await page.locator('#pending-dart').innerText(),'19');
await page.reload();assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('#calculator').click();await page.locator('[data-board-n="20"][data-board-m="2"]').click();await page.locator('#close-calculator').click();
assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.evaluate(()=>localStorage.clear());await page.reload();
await page.locator('[data-mode=x01]').click();
await page.locator('#start').selectOption('301');
await startGame();
for(let i=0;i<3;i++)await throwHit(page,20,3);
assert.match(await page.locator('.active-player').innerText(),/121/);
await page.locator('#next').click();
await page.locator('#undo').click();
assert.match(await page.locator('.active-player').innerText(),/Spiller 1/);
await page.reload();
assert.match(await page.locator('.active-player').innerText(),/121/);
await page.locator('#undo').click();
assert.match(await page.locator('.active-player').innerText(),/181/);
await page.locator('#match-rules').click();assert.equal(await page.locator('dialog').count(),1);
await page.locator('#rule-mode').selectOption('cricket');assert.match(await page.locator('#rule-copy').innerText(),/tre mærker/);
await page.locator('#close-rules').click();
// Start a legitimate 501 game, reaching 141 with six triple twenties.
await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('[data-mode=x01]').click();await startGame();
for(let round=0;round<2;round++){
 for(let i=0;i<3;i++)await throwHit(page,20,3);await page.locator('#next').click();
 await page.locator('[data-special=miss]').click();await page.locator('#next').click();
}
assert.match(await page.locator('.checkout').innerText(),/Triple 20/);
assert.match(await page.locator('.checkout').innerText(),/Triple 19/);
assert.match(await page.locator('.checkout').innerText(),/Double 12/);assert.ok(await page.locator('.checkout-option').count()>1);
await throwHit(page,20,3);await throwHit(page,19,3);await throwHit(page,12,2);
assert.match(await page.locator('.winner').innerText(),/Spiller 1 vinder/);
await page.locator('#rematch').click();assert.match(await page.locator('.active-player').innerText(),/501/);
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'artifacts/mobile-match.png',fullPage:true});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.evaluate(()=>localStorage.clear());await page.reload();
await page.screenshot({path:'artifacts/mobile.png',fullPage:true});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('[data-filter="Præcision"]').click();assert.equal(await page.locator('.game-card').count(),5);
await page.locator('[data-filter="Alle"]').click();
for(const id of ['cricket','cutthroat','around','clock','shanghai','halve','countup','baseball','killer','elimination','golf']){
 await page.locator(`[data-mode=${id}]`).click();await startGame();
 await throwHit(page,['cricket','cutthroat'].includes(id)?20:1);await page.locator('#next').click();
 assert.match(await page.locator('.active-player').innerText(),/Spiller 2/);
 await page.evaluate(()=>localStorage.clear());await page.reload();
}
// Test in-app privacy and deletion, plus Android back dispatch.
await page.locator('[data-mode=x01]').click();assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);
await page.locator('#about').click();assert.match(await page.locator('dialog').innerText(),/Ingen reklamer/);
assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);await page.locator('dialog').waitFor({state:'detached'});
await page.locator('[data-mode=x01]').click();await startGame();await throwHit(page,20);
await page.locator('#about').click();page.once('dialog',d=>d.accept());await page.locator('#clear-data').click();assert.equal(await page.locator('.game-card').count(),12);
assert.equal(await page.evaluate(()=>localStorage.getItem('dartclub')),null);
// Dartboard calculator is a draft until Done; numeric totals consume a full visit.
await page.locator('[data-mode=x01]').click();await startGame();
await page.locator('#calculator').click();
await page.locator('[data-board-n="20"][data-board-m="3"]').click();
await page.locator('[data-board-n="20"][data-board-m="2"]').click();
await page.locator('#calculator-bull').click();
assert.match(await page.locator('.active-player').innerText(),/501/);
await page.screenshot({path:'artifacts/calculator.png',fullPage:true});
await page.locator('#calculator-done').click();assert.match(await page.locator('.active-player').innerText(),/376/);
await page.locator('#undo').click();assert.match(await page.locator('.active-player').innerText(),/501/);
await page.locator('#calculator').click();await page.locator('#total-tab').click();
for(const n of [1,0,0])await page.locator(`[data-digit="${n}"]`).click();
await page.locator('#calculator-done').click();assert.match(await page.locator('.active-player').innerText(),/401/);
await page.locator('#next').click();await throwHit(page,20);
await page.locator('#bust').click();assert.match(await page.locator('.active-player').innerText(),/501/);assert.match(await page.locator('.turn-message').innerText(),/Bust/);
await page.evaluate(()=>localStorage.clear());await page.reload();
await page.locator('[data-mode=cricket]').click();await startGame();await page.locator('#calculator').click();
assert.equal(await page.locator('#total-tab').isDisabled(),true);
await page.locator('[data-board-n="20"][data-board-m="3"]').click();await page.locator('#calculator-done').click();assert.match(await page.locator('table').innerText(),/⊗/);
await page.evaluate(()=>localStorage.clear());await page.reload();
// A manual double-out checkout requires the last field before confirming a win.
await page.locator('[data-mode=x01]').click();await page.locator('#start').selectOption('301');await startGame();
for(const total of [180,81]){
 await enterScore(page,total);await page.locator('#next').click();await throwHit(page,0);await page.locator('#next').click();
}
assert.equal(await page.locator('.active-player > strong').innerText(),'40');
await page.locator('#score-tab').click();for(const digit of ['4','0'])await page.locator(`[data-score-digit="${digit}"]`).click();
await page.locator('#score-done').click();assert.ok((await page.locator('#score-error').innerText()).length>0);
assert.equal(await page.locator('.active-player > strong').innerText(),'40');assert.equal(await page.locator('.winner').count(),0);
await page.locator('#score-finish').selectOption('double');await page.locator('#score-done').click();await page.locator('.winner').waitFor();
await page.evaluate(()=>localStorage.clear());await page.reload();
// Wait for a first online installation, then reload and play with the network off.
await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
await page.context().setOffline(true);await page.reload();
await page.locator('[data-mode=cricket]').click();await startGame();await throwHit(page,20,3);assert.match(await page.locator('table').innerText(),/⊗/);
await page.reload();assert.match(await page.locator('table').innerText(),/⊗/);
await page.context().setOffline(false);
assert.deepEqual(errors,[]);console.log('Browser smoke passed: 12 games, checkout win, undo, persistence, rules, rematch, filters, mobile overflow, privacy deletion, Android back dispatch offline PWA persistence, dartboard Done, visible numeric keypad, tap-cycle single/double/triple entry, atomic pending darts, numeric totals and Bust.');
await browser.close();
