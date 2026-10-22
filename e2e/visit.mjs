import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {enterScore,throwHit} from './controls.mjs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({locale:'en-US',viewport:{width:412,height:915}});
await page.addInitScript(()=>{window.OcheGameStore={load:()=>sessionStorage.getItem('game'),save:value=>{if(sessionStorage.getItem('fail')==='yes')return false;sessionStorage.setItem('game',value);return true;}};});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3000');
const saved=()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('game')));
const fail=value=>page.evaluate(value=>sessionStorage.setItem('fail',value?'yes':'no'),value);
await page.locator('[data-mode=x01]').click();
await page.locator('[name=player]').nth(0).fill('Alex');await page.locator('[name=player]').nth(1).fill('Bo');
await page.locator('.start-button').click();
// A partial dartboard visit is one atomic action including the player handoff.
await page.locator('#calculator').click();await page.locator('[data-board-n="20"][data-board-m="3"]').click();
await fail(true);await page.locator('#calculator-done').click();
assert.equal(await page.locator('dialog[open]').count(),1);assert.match(await page.locator('.calculator-error').innerText(),/could not be saved/);
assert.equal((await saved()).game.active,0);assert.equal((await saved()).game.players[0].score,501);
assert.match(await page.locator('.board-preview').innerText(),/T20/);
await fail(false);await page.locator('#calculator-done').click();
let data=await saved();assert.equal(data.game.active,1);assert.equal(data.game.players[0].score,441);assert.equal(data.game.darts.length,0);assert.equal(data.history.length,1);
assert.equal(await page.locator('#next').count(),0);assert.match(await page.locator('#visit-feedback').innerText(),/Alex scored 60. 441 remaining/);
await page.reload();data=await saved();assert.equal(data.game.active,1);assert.match(await page.locator('.active-player').innerText(),/Bo/);
await page.locator('#undo').click();data=await saved();assert.equal(data.game.active,0);assert.equal(data.game.players[0].score,501);assert.equal(data.history.length,0);
// Inline Done and calculator Bust use the same single-save handoff.
await enterScore(page,100);data=await saved();assert.equal(data.game.active,1);assert.equal(data.game.players[0].score,401);assert.equal(data.history.length,1);
await page.locator('#calculator').click();await page.locator('[data-board-n="20"][data-board-m="3"]').click();await page.locator('#calculator-bust').click();
data=await saved();assert.equal(data.game.active,0);assert.equal(data.game.players[1].score,501);assert.equal(data.game.round,2);assert.match(await page.locator('#visit-feedback').innerText(),/Bo: Bust/);
await page.locator('#undo').click();assert.equal((await saved()).game.active,1);
await page.locator('#undo').click();assert.equal((await saved()).game.active,0);assert.equal((await saved()).game.players[0].score,501);
// A visible Done ends exact-hit input too, including if the user switches tabs.
await throwHit(page,20,3);await page.locator('#score-tab').click();assert.match(await page.locator('.input-hint').first().innerText(),/Press Done/);
await page.locator('#finish-turn').click();assert.equal((await saved()).game.active,1);assert.equal((await saved()).game.players[0].score,441);
assert.equal(await page.locator('#next').count(),0);
// Reaching 141 naturally gives three legal choices, and winning Done keeps the winner.
await page.locator('#undo').click();await page.locator('#undo').click();
for(const total of [180,180]){await enterScore(page,total);await throwHit(page,0);await page.locator('#finish-turn').click();}
assert.equal((await saved()).game.players[0].score,141);assert.equal(await page.locator('.checkout-option').count(),3);
await page.locator('#calculator').click();
for(const[n,m]of [[20,3],[19,3],[12,2]])await page.locator(`[data-board-n="${n}"][data-board-m="${m}"]`).click();
await page.locator('#calculator-done').click();await page.locator('.winner').waitFor();
data=await saved();assert.deepEqual(data.game.winner,[0]);assert.equal(data.game.active,0);assert.equal(data.game.players[0].score,0);
assert.deepEqual(errors,[]);
console.log('Visit checks passed: one-save Done handoff, partial board entries, failed-save draft/retry, reload, score/player undo, Bust, exact-hit Done, three checkout options and winning result.');
await browser.close();
