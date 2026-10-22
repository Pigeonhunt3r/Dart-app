// Enter exact fields through the tap-to-cycle dart editor.
export async function throwHit(page,n,m=1){
 const tab=page.locator('#hits-tab');
 if(await tab.count()&&await tab.getAttribute('aria-pressed')!=='true')await tab.click();
 if(n===0){await page.locator('[data-special=miss]').click();return;}
 for(let i=0;i<m;i++)await page.locator(`[data-hit="${n}"]`).click();
 await page.locator('#add-dart').click();
}
export async function enterScore(page,total){
 const tab=page.locator('#score-tab');
 if(await tab.count()&&await tab.getAttribute('aria-pressed')!=='true')await tab.click();
 for(const digit of String(total))await page.locator(`[data-score-digit="${digit}"]`).click();
 await page.locator('#score-done').click();
}

export async function finishVisit(page){
 const done=page.locator('#finish-turn');
 await (await done.count()?done:page.locator('#next')).click();
}
