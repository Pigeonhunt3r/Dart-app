import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const page=await browser.newPage({locale:'en-GB',viewport:{width:390,height:844}});
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
await page.locator('[data-mode=x01]').click();
await page.locator('[name=player]').first().fill('Spilleregler <Anna>');
await page.locator('.start-button').click();
assert.match(await page.locator('.active-player').innerText(),/Spilleregler <Anna>/);
await page.locator('#calculator').click();await page.locator('#total-tab').click();
for(const digit of [1,0,0])await page.locator(`[data-digit="${digit}"]`).click();
assert.match(await page.locator('#calculator-done').innerText(),/Done.*100 points/);
await page.locator('#calculator-done').click();assert.equal(await page.locator('.active-player > strong').innerText(),'401');
await page.reload();assert.equal(await page.locator('.active-player > strong').innerText(),'401');
assert.match(await page.locator('.active-player').innerText(),/Spilleregler <Anna>/);
await page.locator('#undo').click();assert.equal(await page.locator('.active-player > strong').innerText(),'501');
await page.locator('#about').click();assert.match(await page.locator('dialog').innerText(),/No ads, accounts/);
page.once('dialog',dialog=>dialog.accept());await page.locator('#clear-data').click();
await page.locator('[data-mode=x01]').click();await page.locator('#start').selectOption('301');await page.locator('.start-button').click();
await page.locator('[data-mult="3"]').click();for(let i=0;i<3;i++)await page.locator('[data-hit="20"]').click();
await page.locator('#next').click();await page.locator('[data-special=miss]').click();await page.locator('#next').click();
assert.match(await page.locator('.checkout').innerText(),/CHECKOUT OPTIONS/);
assert.match(await page.locator('.checkout').innerText(),/Triple/);assert.match(await page.locator('.checkout').innerText(),/Double/);
await page.locator('[data-mult="3"]').click();await page.locator('[data-hit="20"]').click();await page.locator('[data-hit="15"]').click();
await page.locator('[data-mult="2"]').click();await page.locator('[data-hit="8"]').click();
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
