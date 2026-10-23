import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,appendFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// This smoke test is deliberately limited to an isolated Android emulator.
// It never uninstalls an app or clears its saved data.
const sdk=process.env.ANDROID_HOME || '/workspace/.android-sdk';
const serial=process.env.ANDROID_SERIAL || 'emulator-5554';
const apk=path.resolve(process.env.APK_PATH || 'android/app/build/outputs/apk/debug/app-debug.apk');
const adb=path.join(sdk,'platform-tools/adb');
const aapt=path.join(sdk,'build-tools/35.0.0/aapt');
assert.ok(serial.startsWith('emulator-'),'Use an isolated emulator, not a personal device.');
assert.ok(existsSync(apk),`APK not found: ${apk}`);
const run=(file,args,options={})=>execFileSync(file,args,{encoding:'utf8',timeout:45000,maxBuffer:8*1024*1024,...options});
const android=(...args)=>run(adb,['-s',serial,...args]);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,message,timeout=45000){
 const stop=Date.now()+timeout;let detail;
 while(Date.now()<stop){try{const value=await check();if(value)return value;}catch(error){detail=error;}
  await pause(500);
 }
 throw new Error(`${message}${detail?' ('+detail.message+')':''}`);
}
const badging=run(aapt,['dump','badging',apk]);
const packageName=badging.match(/^package: name='([^']+)'/m)?.[1];
const versionCode=Number(badging.match(/versionCode='(\d+)'/)?.[1]);
const durableStorage=versionCode>=3,tapInput=versionCode>=7,guidedVariants=versionCode>=8,autoVisit=versionCode>=9,themedDialogs=versionCode>=10,averages=versionCode>=11;
const activity=badging.match(/^launchable-activity: name='([^']+)'/m)?.[1];
assert.ok(packageName&&activity,'APK must declare a launchable activity.');
assert.equal(android('shell','getprop','ro.kernel.qemu').trim(),'1','Device must be an emulator.');
assert.equal(android('shell','getprop','sys.boot_completed').trim(),'1','Emulator must finish booting.');
await mkdir('artifacts',{recursive:true});
const api=android('shell','getprop','ro.build.version.sdk').trim();
const reportPrefix=`artifacts/android-api${api}`;

let cdp,port,lastClick,stage='install';
class CDP {
 constructor(socket){this.socket=socket;this.next=1;this.pending=new Map();socket.addEventListener('message',event=>{
  const data=JSON.parse(event.data);const item=this.pending.get(data.id);if(!item)return;
  clearTimeout(item.timer);this.pending.delete(data.id);
  if(data.error)item.reject(new Error(JSON.stringify(data.error)));else item.resolve(data.result);
 });}
 async call(method,params={}){
  const id=this.next++;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error(`CDP timeout: ${method}`));},15000);
   this.pending.set(id,{resolve,reject,timer});this.socket.send(JSON.stringify({id,method,params}));
  });
 }
 // A deliberately closing WebView may disappear before acknowledging its final input.
 send(method,params={}){this.socket.send(JSON.stringify({id:this.next++,method,params}));}
 async evaluate(expression){
  const reply=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(reply.exceptionDetails)throw new Error('WebView JavaScript exception: '+JSON.stringify(reply.exceptionDetails));
  return reply.result?.value;
 }
 close(){for(const item of this.pending.values()){clearTimeout(item.timer);item.reject(new Error('CDP closed'));}this.pending.clear();this.socket.close();}
}
async function connectWebView(){
 const pid=await until(()=>android('shell','pidof',packageName).trim().split(/\s+/)[0],'App process did not start.');
 port=await until(()=>{
  try{return android('forward','tcp:0',`localabstract:webview_devtools_remote_${pid}`).trim();}catch{return null;}
 },'Could not forward WebView debugging socket.');
 const target=await until(async()=>{
  const response=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(3000)});
  const targets=await response.json();return targets.find(item=>item.type==='page'&&item.url.startsWith('https://appassets.androidplatform.net/assets/www/'));
 },'Bundled Android WebView did not expose the app page.');
 const socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('WebView socket connection timeout')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('WebView socket connection failed'));},{once:true});
 });
 cdp=new CDP(socket);
 await cdp.call('Runtime.enable');
}
function closeWebView(){
 if(cdp){cdp.close();cdp=null;}
 if(port){try{android('forward','--remove',`tcp:${port}`);}catch{}port=null;}
}
async function click(selector,{closesPage=false}={}){
 const hit=await cdp.evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element||element.disabled)return null;element.scrollIntoView({block:'center',inline:'center'});const r=element.getBoundingClientRect();if(!r.width||!r.height)return null;const x=r.left+r.width/2,y=r.top+r.height/2;const target=document.elementFromPoint(x,y);return {x,y,target:target?.outerHTML.slice(0,350)};})()`);
 assert.ok(hit,`Missing, hidden or disabled app control: ${selector}`);
 lastClick={selector,...hit};
 // Use real renderer input: SVG dart fields have no HTMLElement.click() method.
 await cdp.call('Input.dispatchMouseEvent',{type:'mousePressed',x:hit.x,y:hit.y,button:'left',clickCount:1});
 const release={type:'mouseReleased',x:hit.x,y:hit.y,button:'left',clickCount:1};
 if(closesPage)cdp.send('Input.dispatchMouseEvent',release);else await cdp.call('Input.dispatchMouseEvent',release);
}

async function activeScore(score){
 await until(()=>cdp.evaluate(`document.querySelector('.active-player > strong')?.textContent.trim()===${JSON.stringify(String(score))}`),`Active score did not become ${score}.`);
}
async function averageStats(index,scored,darts){
 if(!averages)return;
 const language=await cdp.evaluate('document.documentElement.lang');
 const expected=darts?new Intl.NumberFormat(language,{minimumFractionDigits:2,maximumFractionDigits:2}).format(3*scored/darts):'—';
 await until(()=>cdp.evaluate(`document.querySelector('[data-average-player="${index}"]')?.textContent.trim()===${JSON.stringify(expected)}`),`Player ${index+1} average did not become ${expected}.`);
 assert.deepEqual(await cdp.evaluate(`JSON.parse(window.OcheGameStore.load()).game.players[${index}].scoringStats`),{points:scored,darts},'Displayed average must match durable points and dart counts.');
}
async function recordedScore(score,expectedDarts=3){
 if(!autoVisit)return activeScore(score);
 await until(()=>cdp.evaluate(`(()=>{const saved=JSON.parse(window.OcheGameStore.load()),rows=document.querySelectorAll('.player-row');return saved.game.players[0].score===${score}&&saved.game.active===1&&saved.game.darts.length===0&&rows[0]?.querySelector('strong')?.textContent.trim()===${JSON.stringify(String(score))}&&rows[1]?.classList.contains('active-player');})()`),`Done must save Player 1's score ${score} and advance exactly once to Player 2.`);
 await activeScore(501);
 assert.equal(await cdp.evaluate("document.querySelectorAll('#next').length"),0,'X01 Done must not require a second Next player action.');
 await averageStats(0,501-score,expectedDarts);
}
async function prepareNativeBack(){
 // Renderer readiness does not imply the Android window has focus after locale recreation.
 await until(()=>{
  const activities=android('shell','dumpsys','activity','activities');
  const windows=android('shell','dumpsys','window');
  return activities.split('\n').some(line=>/ResumedActivity/.test(line)&&line.includes(packageName))
   &&windows.split('\n').some(line=>line.includes('mCurrentFocus')&&line.includes(packageName));
 },'App did not regain the native window focus before Back.');
 // Back first dismisses an IME if one is visible; that must not count as an exit request.
 const imeVisible=()=>/mInputShown=true|isInputViewShown=true/.test(android('shell','dumpsys','input_method'));
 if(imeVisible()){
  android('shell','input','keyevent','4');
  await until(()=>!imeVisible(),'Keyboard did not close before the native Back test.');
 }
 // Wait for the actual accessibility window, rather than only the CDP document.
 await until(()=>{
  android('shell','uiautomator','dump','/data/local/tmp/oche-window.xml');
  return android('shell','cat','/data/local/tmp/oche-window.xml').includes(`package="${packageName}"`);
 },'App accessibility window was not ready before Back.');
}
async function openThemedExit(title){
 await prepareNativeBack();
 android('shell','input','keyevent','4');
 await until(()=>cdp.evaluate(`Boolean(document.querySelector('.confirmation-dialog[open]'))&&document.querySelector('#confirm-title')?.textContent.trim()===${JSON.stringify(title)}`),`Themed exit dialog did not appear: ${title}`);
 assert.equal(await cdp.evaluate("document.querySelectorAll('dialog[open]').length"),1,'Exit confirmation must be one app dialog.');
}
async function cancelThemedDialog(){
 await click('#confirm-cancel');
 await until(()=>cdp.evaluate("!document.querySelector('.confirmation-dialog[open]')"),'Cancel did not dismiss the app confirmation.');
}
async function hitDart(n,m=1){
 if(!tapInput){await click(`[data-mult="${m}"]`);await click(`[data-hit="${n}"]`);return;}
 const hasTab=await cdp.evaluate("Boolean(document.querySelector('#hits-tab'))");
 if(hasTab)await click('#hits-tab');
 for(let i=0;i<m;i++)await click(`[data-hit="${n}"]`);
 await click('#add-dart');
}
async function totalVisit(total){
 if(tapInput){
  await click('#score-tab');
  for(const digit of String(total))await click(`[data-score-digit="${digit}"]`);
  await click('#score-done');
 }else{
  await click('#calculator');await click('#total-tab');
  for(const digit of String(total))await click(`[data-digit="${digit}"]`);
  await click('#calculator-done');
 }
}
async function typePlayers(names){
 for(const [index,name] of names.entries()){
  await click(`#players label:nth-child(${index+1}) input`);
  await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
  await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
  await cdp.call('Input.insertText',{text:name});
 }
 await cdp.evaluate('document.activeElement.blur()');
}
function launch(){
 const output=android('shell','am','start','-W','-n',`${packageName}/${activity}`);
 assert.ok(!/^Error:/m.test(output),output);
}
try{
 // Reproduce an existing original app and prove Preview installs alongside it.
 const legacy=path.resolve('downloads/v1.0.0-alpha.1/OcheClub-1.0.0-debug.apk');
 if(packageName==='dk.pigeonarmy.ocheclub.preview'&&existsSync(legacy)){
  assert.match(android('install','-r',legacy),/Success/);
  assert.match(android('shell','pm','path','dk.pigeonarmy.ocheclub'),/package:/);
 }
 console.log(`Installing ${path.basename(apk)} as ${packageName}`);
 const installed=android('install','-r',apk);assert.match(installed,/Success/,'Android package installer rejected the APK.');
 assert.match(android('shell','pm','path',packageName),/package:/);
 if(packageName==='dk.pigeonarmy.ocheclub.preview'&&existsSync(legacy))assert.match(android('shell','pm','path','dk.pigeonarmy.ocheclub'),/package:/);
 // Exercise same-certificate updates too; failures retain adb's actual install reason.
 assert.match(android('install','-r',apk),/Success/);
 console.log('APK installation and same-certificate reinstall passed.');
 stage='launch';android('logcat','-c');launch();await connectWebView();
 await until(()=>cdp.evaluate("document.querySelectorAll('.game-card').length===12"),'Android WebView did not render the 12 game cards.');
 if(tapInput){
  assert.match(await cdp.evaluate('window.OcheLocale.language()'),/^en/,'The English emulator system language must reach the app.');
  assert.equal(await cdp.evaluate('document.documentElement.lang'),'en');
 }
 if(durableStorage)assert.equal(await cdp.evaluate("typeof window.OcheGameStore?.load"),'function','Android durable game store is missing.');
 if(themedDialogs)assert.equal(await cdp.evaluate("typeof window.OcheApp?.close"),'function','Android close-app bridge is missing.');
 stage='player names';await click('[data-mode="x01"]');
 // Type names through renderer input, as fresh games no longer have defaults.
 await typePlayers(['Player 1','Player 2']);
 assert.deepEqual(await cdp.evaluate("[...document.querySelectorAll('[name=player]')].map(input=>input.value)"),['Player 1','Player 2']);
 await cdp.evaluate('document.activeElement.blur()');
 stage='dartboard score';await click('.start-button');await activeScore(501);
 if(averages){
  await averageStats(0,0,0);await averageStats(1,0,0);
  assert.equal(await cdp.evaluate("['html','.input-panel'].every(selector=>{const channels=getComputedStyle(document.querySelector(selector)).backgroundColor.match(/[0-9.]+/g).map(Number);return channels.slice(0,3).every(value=>value<100)&&(channels.length<4||channels[3]>.9);})"),true,'App and scoring panel backgrounds must be dark.');
 }
 if(guidedVariants){
  assert.equal(await cdp.evaluate("document.querySelectorAll('.match-score-strip .player-row').length"),2,'Every named player must appear above score entry.');
  assert.equal(await cdp.evaluate("document.querySelectorAll('.player-row').length"),2,'The top score strip must not duplicate player scores.');
  assert.equal(await cdp.evaluate("document.querySelector('.match-score-strip').getBoundingClientRect().bottom <= document.querySelector('.input-panel').getBoundingClientRect().top+1"),true,'Player scores must precede the input controls.');
  assert.ok((await cdp.evaluate("document.querySelector('#turn-guide')?.textContent||''")).trim(),'The match must explain the next action.');
 }
 await click('#calculator');
 if(versionCode>=13)assert.equal(await cdp.evaluate("document.querySelector('#calculator-total').textContent.trim()"),'0');
 await click('[data-board-n="20"][data-board-m="3"]');
 if(versionCode>=13){
  assert.equal(await cdp.evaluate("document.querySelector('#calculator-total').textContent.trim()"),'60');
  assert.equal(await cdp.evaluate("document.querySelector('#calculator-running-total').textContent.trim()"),'60');
 }
 await click('#calculator-done');await recordedScore(441);
 if(autoVisit)assert.equal(await cdp.evaluate('JSON.parse(window.OcheGameStore.load()).history.length'),1,'Calculator Done must save the partial visit and advance in one undo action.');
 await click('#undo');await activeScore(501);await averageStats(0,0,0);
 if(autoVisit)assert.equal(await cdp.evaluate('JSON.parse(window.OcheGameStore.load()).game.active'),0,'One undo must restore Player 1 as well as the score.');
 if(versionCode>=13){
  stage='live numeric calculator total';
  await click('#calculator');await click('#total-tab');
  for(const [digit,total] of [[1,'1'],[0,'10'],[0,'100'],['⌫','10'],['C','0']]){
   await click(`[data-digit="${digit}"]`);
   assert.equal(await cdp.evaluate("document.querySelector('#total-display').textContent.trim()"),total);
   assert.equal(await cdp.evaluate("document.querySelector('#calculator-running-total').textContent.trim()"),total);
  }
  await click('#close-calculator');await activeScore(501);
 }
 if(tapInput){
  stage='tap-to-cycle exact dart';
  assert.equal(await cdp.evaluate("document.querySelectorAll('#calculator svg').length"),1,'The calculator launcher must show a dartboard icon.');
  assert.equal(await cdp.evaluate("document.querySelectorAll('[data-mult]').length"),0,'Legacy multiplier controls must be removed.');
  await click('#hits-tab');
  const saved=await cdp.evaluate('window.OcheGameStore.load()');
  for(const label of ['20','D20','T20']){
   await click('[data-hit="20"]');await activeScore(501);
   assert.ok((await cdp.evaluate("document.querySelector('#pending-dart').textContent")).includes(label),'Repeated target taps must update the pending dart.');
   assert.equal(await cdp.evaluate('window.OcheGameStore.load()'),saved,'Pending taps must not change the saved match.');
  }
  await click('#add-dart');await activeScore(441);await averageStats(0,60,1);
  assert.equal(await cdp.evaluate('JSON.parse(window.OcheGameStore.load()).game.darts.length'),1,'Triple entry must record one dart.');
  await click('#undo');await activeScore(501);await averageStats(0,0,0);
  await click('#score-tab');
  assert.equal(await cdp.evaluate("document.querySelectorAll('[data-score-digit]').length"),12,'The regular number pad must be visible in the match.');
 }
 stage='numeric score';await totalVisit(100);await recordedScore(401);
 if(await cdp.evaluate("typeof window.OcheGameStore?.load==='function'")){
  const persisted=await cdp.evaluate('JSON.parse(window.OcheGameStore.load())');
  assert.equal(persisted.game.players[autoVisit?0:persisted.game.active].score,401,'Numeric score must be committed before it is shown.');
 }
 // Kill/relaunch the native process, not only the document, and verify persisted state.
 console.log('Native dartboard, undo and numeric score passed.');
 stage='process-death persistence';closeWebView();android('shell','am','force-stop',packageName);launch();await connectWebView();await recordedScore(401);
 if(averages){
  await cdp.evaluate('window.scrollTo(0,0)');
  await writeFile(`${reportPrefix}-averages.png`,execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:15000,maxBuffer:8*1024*1024}));
 }
 if(Number(badging.match(/versionCode='(\d+)'/)?.[1])>=4){
  stage='Danish Android app language';
  closeWebView();android('shell','am','force-stop',packageName);
  android('shell','cmd','locale','set-app-locales',packageName,'--user','0','--locales','da');
  launch();await connectWebView();await recordedScore(401);
  assert.equal(await cdp.evaluate('document.documentElement.lang'),'da');
  assert.match(await cdp.evaluate('document.querySelector("#rules").textContent'),/Spilleregler/);
  assert.match(await cdp.evaluate('window.OcheLocale.language()'),/^da/);
  if(themedDialogs){
   const savedBeforeExit=await cdp.evaluate('window.OcheGameStore.load()');
   await openThemedExit('Luk Oche Club?');
   await cancelThemedDialog();
   assert.equal(await cdp.evaluate('window.OcheGameStore.load()'),savedBeforeExit,'Cancelling exit must preserve the saved game.');
   // A second real Android Back dismisses the top app dialog without another popup.
   await openThemedExit('Luk Oche Club?');
   android('shell','input','keyevent','4');
   await until(()=>cdp.evaluate("!document.querySelector('dialog[open]')"),'Android Back did not dismiss the themed exit dialog.');
   assert.equal(await cdp.evaluate('window.OcheGameStore.load()'),savedBeforeExit,'Dismissing exit with Back must preserve the saved game.');
  }else{
   // Older previews used an Android resource dialog rather than the app's own design.
   await prepareNativeBack();
   android('shell','input','keyevent','4');
   await until(()=>{
    android('shell','uiautomator','dump','/data/local/tmp/oche-window.xml');
    return android('shell','cat','/data/local/tmp/oche-window.xml').includes('Luk Oche Club?');
   },'Danish native exit dialog did not appear.');
   android('shell','input','keyevent','4');
  }
  stage='English Android app language';
  closeWebView();android('shell','am','force-stop',packageName);
  android('shell','cmd','locale','set-app-locales',packageName,'--user','0','--locales','en');
  launch();await connectWebView();await recordedScore(401);
  assert.equal(await cdp.evaluate('document.documentElement.lang'),'en');
  assert.match(await cdp.evaluate('document.querySelector("#rules").textContent'),/Rules/);
  if(themedDialogs){
   stage='English themed confirmations';
   const savedBeforeConfirmation=await cdp.evaluate('window.OcheGameStore.load()');
   await openThemedExit('Close Oche Club?');
   await cancelThemedDialog();
   await click('#leave');
   await until(()=>cdp.evaluate("Boolean(document.querySelector('.confirmation-dialog[open]'))"),'End game did not use a themed confirmation.');
   assert.match(await cdp.evaluate("document.querySelector('#confirm-title').textContent"),/End.*game/i);
   await cancelThemedDialog();
   assert.equal(await cdp.evaluate('window.OcheGameStore.load()'),savedBeforeConfirmation,'Cancelling End game must preserve score, player and history.');
  }
  if(tapInput){
   stage='in-app language selection';
   const savedBeforeLanguage=await cdp.evaluate('window.OcheGameStore.load()');
   await click('#language');
   await cdp.evaluate("document.querySelector('#app-language').value='da'");
   await click('#save-language');
   await until(()=>cdp.evaluate("document.documentElement.lang==='da'&&document.querySelector('#language')?.textContent==='DA'"),'In-app Danish selection did not apply.');
   assert.equal(await cdp.evaluate('window.OcheLocale.preference()'),'da');
   assert.equal(await cdp.evaluate('window.OcheGameStore.load()'),savedBeforeLanguage,'Language selection must preserve the saved game.');
   closeWebView();android('shell','am','force-stop',packageName);launch();await connectWebView();await recordedScore(401);
   assert.equal(await cdp.evaluate('document.documentElement.lang'),'da','Manual language must survive a process restart.');
   await click('#language');
   await cdp.evaluate("document.querySelector('#app-language').value='system'");
   await click('#save-language');
   await until(()=>cdp.evaluate("document.documentElement.lang==='en'&&document.querySelector('#language')?.textContent==='EN'"),'System language must restore the English Android app locale.');
   assert.equal(await cdp.evaluate('window.OcheLocale.preference()'),'system');
   await recordedScore(401);
  }
 }
 if(Number(badging.match(/versionCode='(\d+)'/)?.[1])>=6){
  stage='finished game session';
  // Complete the real 401 game: two 180 visits, then single 1 and double 20.
  async function passOpponent(){if(!autoVisit)await click('#next');if(tapInput)await click('#hits-tab');await click('[data-special="miss"]');await click(autoVisit?'#finish-turn':'#next');}
  for(const total of [180,180]){await passOpponent();await totalVisit(total);}
  await recordedScore(41,9);await passOpponent();
  if(autoVisit)assert.equal(await cdp.evaluate("document.querySelectorAll('.checkout-option').length"),3,'Double-out help must show three legal alternatives when at least three exist.');
  await hitDart(1);await hitDart(20,2);
  await until(()=>cdp.evaluate("Boolean(document.querySelector('.winner #rematch')&&document.querySelector('#another-mode')&&document.querySelector('#end-session'))"),'Completed game did not offer all three session choices.');
  await averageStats(0,501,11);
  await click('#another-mode');await click('[data-mode="shanghai"]');
  const roster=()=>cdp.evaluate("[...document.querySelectorAll('[name=player]')].map(input=>input.value)");
  assert.deepEqual(await roster(),['Player 1','Player 2'],'Next mode must carry the named roster.');
  await click('.start-button');await activeScore(0);
  async function winShanghai(){
   for(const multiplier of [1,2,3])await hitDart(1,multiplier);
   await until(()=>cdp.evaluate("Boolean(document.querySelector('.winner'))"),'Shanghai did not finish naturally.');
  }
  await winShanghai();await click('#rematch');await activeScore(0);
  if(tapInput){
   assert.ok((await cdp.evaluate("document.querySelector('#pending-dart').textContent")).includes('—'),'Rematch must clear the pending dart.');
   assert.equal(await cdp.evaluate("document.querySelector('#add-dart').disabled"),true,'Rematch must require a new dart selection.');
  }else assert.equal(await cdp.evaluate("document.querySelector('[data-mult=\"1\"]').getAttribute('aria-pressed')"),'true','Rematch must reset dart input to Single.');
  assert.equal(await cdp.evaluate("document.querySelector('#undo').disabled"),true,'Rematch must clear undo history.');
  await winShanghai();await click('#end-session');
  assert.equal(await cdp.evaluate("document.querySelectorAll('.game-card').length"),12);
  assert.equal(await cdp.evaluate('window.OcheGameStore.load()'),'','End session must delete the saved roster and result.');
  await click('[data-mode="x01"]');
  assert.deepEqual(await roster(),['',''],'A new session must require names again.');
  console.log('Native named-session checks passed: real X01 finish, Shanghai rematch, same roster in another mode and session deletion.');
 }
 if(guidedVariants){
  stage='extended Around the World';
  await click('#back');await click('[data-mode="around"]');await click('#remove-player');await typePlayers(['Player 1']);await click('.start-button');
  const progress=()=>cdp.evaluate('JSON.parse(window.OcheGameStore.load()).game.players[0].progress');
  assert.equal(await cdp.evaluate("document.querySelectorAll('.match-score-strip .player-row').length"),1);
  for(const[n,m,expected]of [[1,3,4],[4,2,6],[6,3,9],[9,3,12],[12,3,15],[15,3,18],[18,3,21]]){
   await hitDart(n,m);assert.equal(await progress(),expected,'Doubles and triples must advance through the numeric route.');await click('#next');
  }
  assert.match(await cdp.evaluate("document.querySelector('#turn-guide').textContent"),/Double/i);
  if(autoVisit){await click('[data-hit="double"]');await click('#add-dart');}else await hitDart(20,2);
  assert.equal(await progress(),22);await click('#next');
  assert.match(await cdp.evaluate("document.querySelector('#turn-guide').textContent"),/Triple/i);
  if(autoVisit){await click('[data-hit="triple"]');await click('#add-dart');}else await hitDart(20,3);
  assert.equal(await progress(),23);await click('#next');
  assert.match(await cdp.evaluate("document.querySelector('#turn-guide').textContent"),/Bull/i);
  await hitDart(25);await until(()=>cdp.evaluate("Boolean(document.querySelector('.winner'))"),'Around must finish only after Double, Triple and Bull.');
  assert.equal(await progress(),24);
  stage='extended Cricket targets';
  await click('#another-mode');await click('[data-mode="cricket"]');await click('.start-button');
  const rows=await cdp.evaluate("[...document.querySelectorAll('.cricket-scroll tbody tr>th')].map(row=>row.textContent.trim())");
  assert.equal(rows.length,9);assert.match(rows[6],/Double/i);assert.match(rows[7],/Triple/i);assert.match(rows[8],/Bull/i);
  await click('[data-hit="double"]');
  assert.equal(await cdp.evaluate("document.querySelector('#add-dart').disabled"),true,'Category entry must require an actual numbered field.');
  await cdp.evaluate("(()=>{const select=document.querySelector('#category-number');select.value='20';select.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await click('#add-dart');
  const categoryState=await cdp.evaluate('JSON.parse(window.OcheGameStore.load()).game');
  assert.equal(categoryState.players[0].marks.double,1);assert.equal(categoryState.players[0].marks[20]||0,0,'A category hit must not also count toward its number.');
  await click('#undo');assert.equal(await cdp.evaluate('JSON.parse(window.OcheGameStore.load()).game.players[0].marks.double||0'),0);
  console.log('Native guided-variant checks passed: all scores on top, per-mode guidance, accelerated Around route and Double/Triple/Bull finish, nine Cricket targets and exclusive category credit.');
 }
 if(averages){
  stage='Count Up average';
  await click('#leave');await click('#confirm-accept');
  await click('[data-mode="countup"]');await click('#remove-player');await typePlayers(['Player 1']);await click('.start-button');
  await averageStats(0,0,0);await totalVisit(60);await averageStats(0,60,3);
  await click('#next');await totalVisit(120);await averageStats(0,180,6);
  await cdp.evaluate('window.scrollTo(0,0)');
  await writeFile(`${reportPrefix}-countup-average.png`,execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:15000,maxBuffer:8*1024*1024}));
 }
 const activities=android('shell','dumpsys','activity','activities');
 assert.ok(activities.split('\n').some(line=>/ResumedActivity/.test(line)&&line.includes(packageName)),'App is not the resumed Android activity.');
 const crashes=android('logcat','-d','-b','crash');
 await writeFile(`${reportPrefix}-crash-log.txt`,crashes);
 assert.ok(!crashes.includes(packageName),'Android recorded an app crash. See artifacts/android-crash-log.txt.');
 const screenshot=execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:15000,maxBuffer:8*1024*1024});
 await writeFile(`${reportPrefix}-native.png`,screenshot);
 if(themedDialogs){
  stage='confirmed app close and relaunch';
  const savedBeforeClose=await cdp.evaluate('window.OcheGameStore.load()');
  await openThemedExit('Close Oche Club?');
  await click('#confirm-accept',{closesPage:true});
  await until(()=>!android('shell','dumpsys','activity','activities').split('\n').some(line=>/ResumedActivity/.test(line)&&line.includes(packageName)),'Close app did not finish its Android Activity.');
  closeWebView();launch();await connectWebView();
  await until(()=>cdp.evaluate(`window.OcheGameStore.load()===${JSON.stringify(savedBeforeClose)}`),'Saved game changed after a confirmed close and relaunch.');
  await until(()=>cdp.evaluate("Boolean(document.querySelector('.match'))&&!document.querySelector('dialog[open]')"),'Relaunch did not restore the saved match without a popup.');
  await averageStats(0,180,6);
  console.log('Native themed-dialog checks passed: English/Danish exit, Cancel, Android Back dismissal, End game cancellation, confirmed Activity close and saved-game relaunch.');
 }

 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`\nAndroid API ${api}: exact APK installation, same-key reinstall, real scoring and process-death persistence passed. For versionCode 4+, English/Danish Android app language passed; versions 4–9 also check the former native exit dialog. For versionCode 6+, named-player entry, rematch, cross-mode roster reuse and session ending passed. For versionCode 7+, the visible regular keypad, atomic repeated-tap triple entry and durable in-app language selection also passed. For versionCode 8+, top scores, mode guidance, accelerated Around with Double/Triple/Bull stages and extended Cricket category credit also passed. For versionCode 9+, calculator and numeric Done advance once, one undo restores the pre-calculator turn, the next player persists across process death and language changes, checkout help shows three legal alternatives, and the Around Double/Triple buttons complete their stages. For versionCode 10+, English/Danish themed exit dialogs, Cancel, Back dismissal, End game cancellation and confirmed Close app/relaunch preserve the saved match. For versionCode 11+, dark app/scoring surfaces, per-player X01/Count Up three-dart averages, exact hits, numeric visits, undo, process-death recovery, English/Danish formatting and close/relaunch persistence also passed.\n`);
 console.log('Native Android smoke passed: install, same-key reinstall, launch, 12-game UI, dartboard Done, undo, numeric score, repeated-tap exact dart entry and process-death persistence.');
}catch(error){
 let web;
 if(cdp){try{web=await cdp.evaluate("({url:location.href,cards:document.querySelectorAll('.game-card').length,player:document.querySelector('.active-player')?.innerText,dialog:document.querySelector('dialog[open]')?.innerText,darts:[...document.querySelectorAll('.dart-slot')].map(e=>e.innerText),body:document.body.innerText.slice(0,1800)})");}catch{}}
 const detail=JSON.stringify({api,stage,error:error.message,lastClick,web});
 console.error('::error title=Native Android diagnostic::'+detail.slice(0,5000).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'\n## Native Android diagnostic\n\n    '+detail.replaceAll('\n','\n    ')+'\n');
 try{await writeFile(`${reportPrefix}-failure-logcat.txt`,android('logcat','-d','-t','1000'));}catch{}
 try{
  android('shell','uiautomator','dump','/data/local/tmp/oche-window.xml');
  await writeFile(`${reportPrefix}-failure-window.txt`,android('shell','cat','/data/local/tmp/oche-window.xml'));
 }catch{}
 try{await writeFile(`${reportPrefix}-failure-focus-ime.txt`,android('shell','dumpsys','window')+'\n'+android('shell','dumpsys','input_method'));}catch{}
 throw error;
}finally{closeWebView();}
