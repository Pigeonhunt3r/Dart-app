import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {throwHit,finishVisit} from './controls.mjs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const page=await browser.newPage({locale:'en-GB',viewport:{width:390,height:844}});
async function startGame(){
 const fields=page.locator('[name=player]');
 for(let i=0;i<await fields.count();i++)if(!(await fields.nth(i).inputValue()).trim())await fields.nth(i).fill(`Player ${i+1}`);
 await page.locator('.start-button').click();
}
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(base);await page.locator('.game-card').first().waitFor();
assert.equal(await page.locator('html').getAttribute('lang'),'en');
assert.match(await page.locator('h1').innerText(),/One throw/i);
assert.equal(await page.locator('.game-card').count(),12);
for(const id of ['x01','cricket','cutthroat','around','clock','shanghai','halve','countup','baseball','killer','elimination','golf']){
 await page.locator(`[data-rules=${id}]`).click();
 assert.match(await page.locator('dialog').innerText(),/The aim/);
 assert.match(await page.locator('dialog').innerText(),/How to play/);
 assert.match(await page.locator('dialog').innerText(),/An example/);
 assert.doesNotMatch(await page.locator('dialog').innerText(),/[æøåÆØÅ]/);
 await page.locator('#close-rules').click();
}
await page.locator('[data-mode=x01]').click();await page.locator('#remove-player').click();
await page.locator('[name=player]').first().fill('Spilleregler <Anna>');
await startGame();
assert.match(await page.locator('.active-player').innerText(),/Spilleregler <Anna>/);
for(const digit of [1,0,0])await page.locator(`[data-score-digit="${digit}"]`).click();
assert.match(await page.locator('#score-done').innerText(),/Done[\s\S]*100/);
await page.locator('#score-done').click();assert.equal(await page.locator('.active-player > strong').innerText(),'401');
// Explicit app language survives reload and can return to the system language.
const savedBeforeLanguage=await page.evaluate(()=>localStorage.getItem('dartclub'));
await page.locator('#language').click();await page.locator('#app-language').selectOption('da');await page.locator('#save-language').click();
await page.waitForFunction(()=>document.documentElement.lang==='da'&&document.querySelector('#language')?.textContent==='DA');
assert.match(await page.locator('#rules').innerText(),/Spilleregler/);
assert.equal(await page.evaluate(()=>localStorage.getItem('dartclub')),savedBeforeLanguage);
await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'da');
await page.locator('#language').click();await page.locator('#app-language').selectOption('en');await page.locator('#save-language').click();
await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.querySelector('#language')?.textContent==='EN');
assert.equal(await page.locator('.active-player > strong').innerText(),'401');
await page.locator('#language').click();await page.locator('#app-language').selectOption('system');await page.locator('#save-language').click();
await page.waitForFunction(()=>document.documentElement.lang==='en'&&!!document.querySelector('.active-player'));
assert.equal(await page.evaluate(()=>localStorage.getItem('oche-language')),null);
await page.reload();assert.equal(await page.locator('.active-player > strong').innerText(),'401');
assert.match(await page.locator('.active-player').innerText(),/Spilleregler <Anna>/);
await page.locator('#undo').click();assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('#about').click();assert.match(await page.locator('dialog').innerText(),/No ads, accounts/);
page.once('dialog',dialog=>dialog.accept());await page.locator('#clear-data').click();
await page.locator('[data-mode=x01]').click();await page.locator('#start').selectOption('301');await startGame();
for(let i=0;i<3;i++)await throwHit(page,20,3);
await finishVisit(page);await page.locator('[data-special=miss]').click();await finishVisit(page);
assert.match(await page.locator('.checkout').innerText(),/CHECKOUT OPTIONS/);
assert.match(await page.locator('.checkout').innerText(),/Triple/);assert.match(await page.locator('.checkout').innerText(),/Double/);
await throwHit(page,20,3);await throwHit(page,15,3);await throwHit(page,8,2);
assert.match(await page.locator('.winner').innerText(),/Player 1 wins!/);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.context().setOffline(true);await page.reload();
assert.match(await page.locator('.winner').innerText(),/Player 1 wins!/);await page.context().setOffline(false);
await page.close();
for(const {locale,native,language,label} of [
 {locale:'da-DK',language:'da',label:'Spilleregler'},
 {locale:'de-DE',language:'en',label:'Rules'},
 {locale:'en-US',native:'da-DK',language:'da',label:'Spilleregler'},
 {locale:'da-DK',native:'en-GB',language:'en',label:'Rules'}
]){
 const localized=await browser.newPage({locale});
 if(native)await localized.addInitScript(value=>{window.OcheLocale={language:()=>value};},native);
 await localized.goto(base);await localized.locator('.game-card').first().waitFor();
 assert.equal(await localized.locator('html').getAttribute('lang'),language);
 assert.equal(await localized.locator('#rules').innerText(),`${label} →`);
 await localized.close();
}
for(const locale of ['en-US','da-DK']){
 const oldWebView=await browser.newPage({locale});
 await oldWebView.addInitScript(()=>{window.structuredClone=undefined;});
 await oldWebView.goto(base);
 assert.match(await oldWebView.locator('#app').innerText(),locale==='da-DK'?/Opdater Android System WebView/:/Update Android System WebView/);
 assert.equal(await oldWebView.locator('.game-card').count(),0);
 await oldWebView.close();
}
assert.deepEqual(errors,[]);
console.log('Language checks passed: English UI and all 12 rulebooks, totals, checkout win, private names, offline reload, Danish system locale, unsupported-language fallback and Android app-locale priority.');
await browser.close();
