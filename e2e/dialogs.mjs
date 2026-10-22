import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const errors=[],browserDialogs=[];
async function openPage(locale='en-US'){
 const page=await browser.newPage({locale,viewport:{width:390,height:844}});
 page.on('pageerror',error=>errors.push(error.message));
 // Any JavaScript alert/confirm is a regression. Dismiss it so the failure can be reported.
 page.on('dialog',async dialog=>{browserDialogs.push({type:dialog.type(),message:dialog.message()});await dialog.dismiss();});
 await page.addInitScript(()=>{
  window.OcheGameStore={
   load:()=>sessionStorage.getItem('native-game'),
   save:value=>{if(sessionStorage.getItem('fail-save')==='yes')return false;sessionStorage.setItem('native-game',value);return true;}
  };
  window.OcheApp={close:()=>sessionStorage.setItem('close-calls',String(Number(sessionStorage.getItem('close-calls')||0)+1))};
 });
 await page.goto(base);await page.locator('.game-card').first().waitFor();return page;
}
async function start(page,mode='x01'){
 await page.locator(`[data-mode=${mode}]`).click();
 for(const [i,name]of ['Alex','Bo'].entries())await page.locator('[name=player]').nth(i).fill(name);
 await page.locator('.start-button').click();
}
const saved=page=>page.evaluate(()=>sessionStorage.getItem('native-game'));
const fail=(page,value)=>page.evaluate(value=>sessionStorage.setItem('fail-save',value?'yes':'no'),value);
const closeCalls=page=>page.evaluate(()=>Number(sessionStorage.getItem('close-calls')||0));
const closed=page=>page.locator('.confirmation-dialog').waitFor({state:'detached'});
const hasFocus=(page,id)=>page.locator(id).evaluate(element=>element===document.activeElement);

const page=await openPage();await start(page);
for(const digit of ['1','0','0'])await page.locator(`[data-score-digit="${digit}"]`).click();
const original=await saved(page);
await page.locator('#leave').click();
assert.match(await page.locator('#confirm-title').innerText(),/End.*game/i);
assert.equal(await page.locator('.confirmation-dialog').getAttribute('aria-labelledby'),'confirm-title');
assert.equal(await page.locator('.confirmation-dialog').getAttribute('aria-describedby'),'confirm-description');
assert.equal(await hasFocus(page,'#confirm-cancel'),true,'The safe action must receive initial focus');
await page.keyboard.press('Tab');assert.equal(await hasFocus(page,'#confirm-accept'),true);
await page.keyboard.press('Shift+Tab');assert.equal(await hasFocus(page,'#confirm-cancel'),true);
assert.equal(await page.evaluate(()=>{document.querySelector('#leave').focus();return document.activeElement===document.querySelector('#confirm-cancel');}),true,'Background controls must stay inert while the modal is open');
for(const width of [320,390,412]){
 await page.setViewportSize({width,height:844});
 assert.ok(await page.evaluate(()=>{const dialog=document.querySelector('.confirmation-dialog').getBoundingClientRect();return dialog.left>=0&&dialog.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth;}),`Confirmation must fit at ${width}px`);
}
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'artifacts/confirmation-dialog.png'});
await page.locator('#confirm-cancel').click();await closed(page);
assert.equal(await hasFocus(page,'#leave'),true);assert.equal(await saved(page),original);
assert.equal(await page.locator('#score-display').innerText(),'100','Cancelling must retain the unsubmitted score');
await page.locator('#leave').click();await page.keyboard.press('Escape');await closed(page);
assert.equal(await saved(page),original);assert.equal(await hasFocus(page,'#leave'),true);
await page.locator('#leave').click();assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);await closed(page);
assert.equal(await saved(page),original);assert.equal(await closeCalls(page),0);

// Native Back uses the same app dialog. Dismissing it must never close the app or alter a game.
assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);
assert.match(await page.locator('#confirm-title').innerText(),/Close Oche Club/);
await page.locator('#confirm-cancel').click();await closed(page);assert.equal(await closeCalls(page),0);
assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);
assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);await closed(page);assert.equal(await closeCalls(page),0);
assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);
await page.locator('#confirm-accept').click();await closed(page);
assert.equal(await closeCalls(page),1);assert.equal(await saved(page),original,'Closing the native app must preserve its saved game');

// A failed End game stays reviewable, keeps the draft and can be retried directly.
await fail(page,true);await page.locator('#leave').click();await page.locator('#confirm-accept').click();
assert.equal(await page.locator('.confirmation-dialog[open]').count(),1);
assert.match(await page.locator('.confirmation-error').innerText(),/could not be saved/);
assert.equal(await saved(page),original);assert.equal(await page.locator('#score-display').innerText(),'100');
await fail(page,false);await page.locator('#confirm-accept').click();
assert.equal(await page.locator('.game-card').count(),12);assert.equal(await page.locator('dialog[open]').count(),0);
assert.ok(!await saved(page));await page.reload();assert.equal(await page.locator('.game-card').count(),12);

// A nested deletion dialog cancels independently, then clears data only after an acknowledged save.
await start(page,'shanghai');const beforeDelete=await saved(page);
await page.locator('#about').click();await page.locator('#clear-data').click();
assert.equal(await page.locator('dialog[open]').count(),2);
assert.equal(await page.evaluate(()=>window.ocheClubBack()),true);await closed(page);
assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await hasFocus(page,'#clear-data'),true);assert.equal(await saved(page),beforeDelete);
await page.locator('#clear-data').click();await page.keyboard.press('Escape');await closed(page);
assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await saved(page),beforeDelete);
await page.locator('#clear-data').click();await page.locator('#confirm-cancel').click();await closed(page);
assert.equal(await hasFocus(page,'#clear-data'),true);
await page.locator('#clear-data').click();await fail(page,true);await page.locator('#confirm-accept').click();
assert.equal(await page.locator('dialog[open]').count(),2);assert.match(await page.locator('.confirmation-error').innerText(),/could not be saved/);
assert.equal(await saved(page),beforeDelete);
await fail(page,false);await page.locator('#confirm-accept').click();
assert.equal(await page.locator('.game-card').count(),12);assert.equal(await page.locator('dialog[open]').count(),0);assert.ok(!await saved(page));
await page.reload();assert.equal(await page.locator('.game-card').count(),12);await page.close();

const danish=await openPage('da-DK');await start(danish);
await danish.locator('#leave').click();assert.match(await danish.locator('#confirm-title').innerText(),/Afslut.*spil/);
assert.match(await danish.locator('#confirm-accept').innerText(),/Afslut spil/);
assert.match(await danish.locator('#confirm-cancel').innerText(),/Spil videre/);
await danish.locator('#confirm-cancel').click();await closed(danish);
assert.equal(await danish.evaluate(()=>window.ocheClubBack()),true);
assert.match(await danish.locator('#confirm-title').innerText(),/Luk Oche Club/);
assert.match(await danish.locator('#confirm-accept').innerText(),/Luk appen/);
await danish.locator('#confirm-cancel').click();await closed(danish);
await danish.locator('#about').click();await danish.locator('#clear-data').click();
assert.match(await danish.locator('#confirm-title').innerText(),/Slet/);
await danish.locator('#confirm-cancel').click();await closed(danish);await danish.close();
assert.deepEqual(browserDialogs,[],'No flow may show a default browser alert/confirm');assert.deepEqual(errors,[]);
console.log('Dialog checks passed: themed end/delete/exit dialogs, safe default focus, keyboard/background focus containment, cancel/Escape/Android Back, nested modal recovery, preserved score drafts, failed-save retry, acknowledged deletion, native-close bridge, English/Danish and mobile fit.');
await browser.close();
