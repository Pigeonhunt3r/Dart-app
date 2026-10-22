import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {throwHit,finishVisit} from './controls.mjs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({locale:'en-US'});
async function startGame(){
 const fields=page.locator('[name=player]');
 for(let i=0;i<await fields.count();i++)if(!(await fields.nth(i).inputValue()).trim())await fields.nth(i).fill(`Player ${i+1}`);
 await page.locator('.start-button').click();
}
await page.addInitScript(()=>{
 window.OcheGameStore={
  load:()=>sessionStorage.getItem('native-game'),
  save:value=>{if(sessionStorage.getItem('fail-save')==='yes')return false;sessionStorage.setItem('native-game',value);return true;}
 };
});
await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3000');
const fail=async value=>page.evaluate(value=>sessionStorage.setItem('fail-save',value?'yes':'no'),value);
await page.locator('[data-mode=x01]').click();await fail(true);await startGame();
assert.match(await page.locator('#form-error').innerText(),/could not be saved/);assert.equal(await page.locator('.active-player').count(),0);
await fail(false);await startGame();
await fail(true);await throwHit(page,20);
assert.equal(await page.locator('.active-player > strong').innerText(),'501');assert.match(await page.locator('.storage-warning').innerText(),/could not be saved/);
assert.match(await page.locator('#pending-dart').innerText(),/20/);
await fail(false);await page.locator('#add-dart').click();assert.equal(await page.locator('.active-player > strong').innerText(),'481');
await fail(true);await page.locator('#undo').click();assert.equal(await page.locator('.active-player > strong').innerText(),'481');
await page.locator('#about').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#clear-data').click();
assert.match(await page.locator('#privacy-error').innerText(),/could not be saved/);assert.equal(await page.locator('dialog[open]').count(),1);
assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('native-game')).game.players[0].score),481);
await page.reload();assert.equal(await page.locator('.active-player > strong').innerText(),'481');
await fail(false);await page.locator('#undo').click();assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('#about').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#clear-data').click();
assert.equal(await page.locator('.game-card').count(),12);await page.reload();assert.equal(await page.locator('.game-card').count(),12);
await page.locator('[data-mode=x01]').click();await startGame();
// Failed inline totals keep both the saved score and entered digits for a direct retry.
await fail(true);for(const digit of ['1','0','0'])await page.locator(`[data-score-digit="${digit}"]`).click();
await page.locator('#score-done').click();assert.equal(await page.locator('.active-player > strong').innerText(),'501');assert.equal(await page.locator('#score-display').innerText(),'100');
assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('native-game')).game.darts.length),0);
await fail(false);await page.locator('#score-done').click();assert.equal(await page.locator('.player-row > strong').first().innerText(),'401');assert.match(await page.locator('.active-player').innerText(),/Player 2/);
await page.locator('#undo').click();await page.locator('#hits-tab').click();
// Play long enough to exercise bounded history, then undo the last turn.
await page.evaluate(()=>{for(let i=0;i<120;i++){document.querySelector('[data-special=miss]').click();(document.querySelector('#finish-turn')||document.querySelector('#next')).click();}});
let stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('native-game')));
assert.equal(stored.game.round,61);assert.equal(stored.history.length,200);
assert.equal(stored.game.players[0].score,501);assert.equal(stored.game.players[1].score,501);
await page.locator('#undo').click();stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('native-game')));
assert.equal(stored.game.round,60);assert.equal(stored.game.darts.length,1);
// Failed session ending must keep the completed game and its reusable roster.
page.once('dialog',dialog=>dialog.accept());await page.locator('#leave').click();
await page.locator('[data-mode=shanghai]').click();await startGame();
for(const mult of [1,2,3])await throwHit(page,1,mult);
await page.locator('#another-mode').click();await fail(true);await page.locator('#end-roster').click();
assert.match(await page.locator('#continue-roster').innerText(),/Player 1/);
assert.match(await page.locator('.storage-warning').innerText(),/could not be saved/);
assert.deepEqual(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('native-game')).game.winner),[0]);
await page.locator('#back-result').click();assert.match(await page.locator('.winner').innerText(),/Player 1 wins!/);
await fail(false);await page.locator('#end-session').click();assert.equal(await page.locator('.game-card').count(),12);
await page.reload();assert.equal(await page.locator('.game-card').count(),12);
console.log('Storage UI checks passed: failed start/score/undo/deletion preserve state, retry succeeds, deletion survives reload, a long game retains bounded undo and failed session ending preserves its roster.');
await browser.close();
