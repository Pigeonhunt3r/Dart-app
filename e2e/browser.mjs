import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
import assert from 'node:assert/strict';
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
await page.locator('[data-mode=x01]').click();
await page.locator('#start').selectOption('301');
await startGame();
await page.locator('[data-mult="3"]').click();
await page.locator('[data-hit="20"]').click();
await page.locator('[data-hit="20"]').click();
await page.locator('[data-hit="20"]').click();
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
 await page.locator('[data-mult="3"]').click();for(let i=0;i<3;i++)await page.locator('[data-hit="20"]').click();await page.locator('#next').click();
 await page.locator('[data-special=miss]').click();await page.locator('#next').click();
}
assert.match(await page.locator('.checkout').innerText(),/Triple 20/);
assert.match(await page.locator('.checkout').innerText(),/Triple 19/);
assert.match(await page.locator('.checkout').innerText(),/Double 12/);assert.ok(await page.locator('.checkout-option').count()>1);
await page.locator('[data-hit="20"]').click();await page.locator('[data-hit="19"]').click();await page.locator('[data-mult="2"]').click();await page.locator('[data-hit="12"]').click();
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
 await page.locator('[data-hit="1"]').click();await page.locator('#next').click();
 assert.match(await page.locator('.active-player').innerText(),/Spiller 2/);
 await page.evaluate(()=>localStorage.clear());await page.reload();
}
// Test in-app privacy and deletion, plus Android back dispatch.
await page.locator('[data-mode=x01]').click();assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);
await page.locator('#about').click();assert.match(await page.locator('dialog').innerText(),/Ingen reklamer/);
assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);await page.locator('dialog').waitFor({state:'detached'});
await page.locator('[data-mode=x01]').click();await startGame();await page.locator('[data-hit="20"]').click();
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
await page.locator('#next').click();await page.locator('[data-hit="20"]').click();
await page.locator('#bust').click();assert.match(await page.locator('.active-player').innerText(),/501/);assert.match(await page.locator('.turn-message').innerText(),/Bust/);
await page.evaluate(()=>localStorage.clear());await page.reload();
await page.locator('[data-mode=cricket]').click();await startGame();await page.locator('#calculator').click();
assert.equal(await page.locator('#total-tab').isDisabled(),true);
await page.locator('[data-board-n="20"][data-board-m="3"]').click();await page.locator('#calculator-done').click();assert.match(await page.locator('table').innerText(),/⊗/);
await page.evaluate(()=>localStorage.clear());await page.reload();
// Wait for a first online installation, then reload and play with the network off.
await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
await page.context().setOffline(true);await page.reload();
await page.locator('[data-mode=cricket]').click();await startGame();await page.locator('[data-mult="3"]').click();await page.locator('[data-hit="20"]').click();assert.match(await page.locator('table').innerText(),/⊗/);
await page.reload();assert.match(await page.locator('table').innerText(),/⊗/);
await page.context().setOffline(false);
assert.deepEqual(errors,[]);console.log('Browser smoke passed: 12 games, checkout win, undo, persistence, rules, rematch, filters, mobile overflow, privacy deletion, Android back dispatch offline PWA persistence, dartboard Done, numeric totals and Bust.');
await browser.close();
