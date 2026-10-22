import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {throwHit,finishVisit} from './controls.mjs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({locale:'en-US',viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3000');
const fields=()=>page.locator('[name=player]');
async function choose(mode){await page.locator(`[data-mode=${mode}]`).click();}
async function names(values){for(let i=0;i<values.length;i++)await fields().nth(i).fill(values[i]);}
async function winShanghai(){for(const mult of [1,2,3])await throwHit(page,1,mult);await page.locator('.winner').waitFor();}
async function freshShanghai(){await choose('shanghai');await names(['A','B']);await page.locator('.start-button').click();}
async function assertFresh(){assert.equal(await page.locator('.game-card').count(),12);assert.equal(await page.evaluate(()=>localStorage.getItem('dartclub')),null);await choose('shanghai');assert.deepEqual(await fields().evaluateAll(inputs=>inputs.map(input=>input.value)),['','']);await page.locator('#back').click();}

// Every fresh mode starts with required empty fields, rather than generated names.
for(const id of ['x01','cricket','cutthroat','around','clock','shanghai','halve','countup','baseball','killer','elimination','golf']){
 await choose(id);assert.deepEqual(await fields().evaluateAll(inputs=>inputs.map(input=>input.value)),['','']);
 await page.locator('.start-button').click();assert.equal(await page.locator('.active-player').count(),0);
 assert.equal(await fields().first().evaluate(input=>input.validity.valueMissing),true);
 await page.locator('#back').click();
}
await choose('shanghai');await names(['   ','B']);await page.locator('.start-button').click();
assert.equal(await page.locator('.active-player').count(),0);
assert.ok((await page.locator('#form-error').innerText()).trim()||await fields().first().evaluate(input=>!input.checkValidity()));
const specialName='<B & ">';
await names([' A ',specialName]);await page.locator('.start-button').click();
assert.deepEqual(await page.locator('.player-name > b').allTextContents(),['A',specialName]);
await winShanghai();
for(const id of ['rematch','another-mode','end-session'])assert.equal(await page.locator(`#${id}`).count(),1);
await page.locator('#rematch').click();
assert.equal(await page.locator('.active-player > strong').innerText(),'0');
assert.deepEqual(await page.locator('.player-name > b').allTextContents(),['A',specialName]);
assert.match(await page.locator('#pending-dart').innerText(),/—/);assert.equal(await page.locator('#add-dart').isDisabled(),true);
assert.equal(await page.locator('#undo').isDisabled(),true);
await winShanghai();await page.locator('#another-mode').click();
assert.match(await page.locator('#continue-roster').innerText(),/A/);assert.ok((await page.locator('#continue-roster').innerText()).includes(specialName));
await page.reload();await page.locator('.winner').waitFor();
assert.deepEqual(await page.locator('.player-name > b').allTextContents(),['A',specialName]);
await page.locator('#another-mode').click();
await page.locator('#back-result').click();await page.locator('.winner').waitFor();
await page.locator('#another-mode').click();assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);await page.locator('.winner').waitFor();
await page.locator('#another-mode').click();await choose('cricket');
assert.deepEqual(await fields().evaluateAll(inputs=>inputs.map(input=>input.value)),['A',specialName]);
await page.locator('.start-button').click();assert.deepEqual(await page.locator('.player-name > b').allTextContents(),['A',specialName]);
let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dartclub')));
assert.equal(saved.game.mode,'cricket');assert.deepEqual(saved.history,[]);assert.equal(saved.game.winner,null);assert.ok(saved.game.players.every(player=>player.score===0));
await page.locator('#leave').click();await page.locator('#confirm-accept').click();await assertFresh();

// Ending a completed game clears the roster and saved result, including on reload.
await freshShanghai();await winShanghai();await page.locator('#end-session').click();await assertFresh();await page.reload();await assertFresh();

// A solo roster can continue into a multiplayer mode by adding a named player.
await choose('shanghai');await page.locator('#remove-player').click();await names(['A']);await page.locator('.start-button').click();
await winShanghai();await page.locator('#another-mode').click();await choose('killer');
assert.deepEqual(await fields().evaluateAll(inputs=>inputs.map(input=>input.value)),['A']);
await page.locator('.start-button').click();assert.equal(await page.locator('.active-player').count(),0);assert.match(await page.locator('#form-error').innerText(),/at least two/i);
await page.locator('#add-player').click();assert.equal(await fields().nth(1).inputValue(),'');await fields().nth(1).fill('B');await page.locator('.start-button').click();
assert.deepEqual(await page.locator('.player-name > b').allTextContents(),['A','B']);await page.locator('#leave').click();await page.locator('#confirm-accept').click();

// Rematch retains a non-default X01 start/out rule, resetting score, input and undo.
await choose('x01');await names(['A','B']);await page.locator('#start').selectOption('301');await page.locator('#out').selectOption('straight');await page.locator('.start-button').click();
for(let i=0;i<3;i++)await throwHit(page,20,3);
await finishVisit(page);await page.locator('[data-special=miss]').click();await finishVisit(page);
await throwHit(page,20,3);await throwHit(page,15,3);await throwHit(page,8,2);
await page.locator('#rematch').click();assert.equal(await page.locator('.active-player > strong').innerText(),'301');assert.match(await page.locator('.match-info').innerText(),/any field/);
assert.equal(await page.locator('[data-score-digit]').count(),12);await page.locator('#hits-tab').click();
assert.match(await page.locator('#pending-dart').innerText(),/—/);assert.equal(await page.locator('#add-dart').isDisabled(),true);assert.equal(await page.locator('#undo').isDisabled(),true);
saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dartclub')));assert.equal(saved.game.options.doubleOut,false);assert.equal(saved.game.options.start,301);assert.deepEqual(saved.game.players.map(player=>player.name),['A','B']);
await page.locator('#leave').click();await page.locator('#confirm-accept').click();

// Ending from the next-mode picker also forgets the reused roster.
await freshShanghai();await winShanghai();await page.locator('#another-mode').click();await page.locator('#end-roster').click();await assertFresh();
assert.deepEqual(errors,[]);
console.log('Session checks passed: required names in all modes, one-character/trimmed names, escaped roster reuse across modes, rematch reset, solo-to-multiplayer validation, back navigation and end-session deletion.');
await browser.close();
