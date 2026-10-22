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
const durableStorage=Number(badging.match(/versionCode='(\d+)'/)?.[1])>=3;
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
async function click(selector){
 const hit=await cdp.evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element||element.disabled)return null;element.scrollIntoView({block:'center',inline:'center'});const r=element.getBoundingClientRect();if(!r.width||!r.height)return null;const x=r.left+r.width/2,y=r.top+r.height/2;const target=document.elementFromPoint(x,y);return {x,y,target:target?.outerHTML.slice(0,350)};})()`);
 assert.ok(hit,`Missing, hidden or disabled app control: ${selector}`);
 lastClick={selector,...hit};
 // Use real renderer input: SVG dart fields have no HTMLElement.click() method.
 await cdp.call('Input.dispatchMouseEvent',{type:'mousePressed',x:hit.x,y:hit.y,button:'left',clickCount:1});
 await cdp.call('Input.dispatchMouseEvent',{type:'mouseReleased',x:hit.x,y:hit.y,button:'left',clickCount:1});
}

async function activeScore(score){
 await until(()=>cdp.evaluate(`document.querySelector('.active-player > strong')?.textContent.trim()===${JSON.stringify(String(score))}`),`Active score did not become ${score}.`);
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
 if(durableStorage)assert.equal(await cdp.evaluate("typeof window.OcheGameStore?.load"),'function','Android durable game store is missing.');
 stage='player names';await click('[data-mode="x01"]');
 // Type names through renderer input, as fresh games no longer have defaults.
 for(let i=0;i<2;i++){
  await click(`#players label:nth-child(${i+1}) input`);
  await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
  await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
  await cdp.call('Input.insertText',{text:`Player ${i+1}`});
 }
 assert.deepEqual(await cdp.evaluate("[...document.querySelectorAll('[name=player]')].map(input=>input.value)"),['Player 1','Player 2']);
 await cdp.evaluate('document.activeElement.blur()');
 stage='dartboard score';await click('.start-button');await activeScore(501);
 await click('#calculator');
 await click('[data-board-n="20"][data-board-m="3"]');await click('#calculator-done');await activeScore(441);
 await click('#undo');await activeScore(501);
 stage='numeric score';await click('#calculator');await click('#total-tab');
 for(const digit of ['1','0','0'])await click(`[data-digit="${digit}"]`);
 await click('#calculator-done');await activeScore(401);
 if(await cdp.evaluate("typeof window.OcheGameStore?.load==='function'")){
  const persisted=await cdp.evaluate('JSON.parse(window.OcheGameStore.load())');
  assert.equal(persisted.game.players[persisted.game.active].score,401,'Numeric score must be committed before it is shown.');
 }
 // Kill/relaunch the native process, not only the document, and verify persisted state.
 console.log('Native dartboard, undo and numeric score passed.');
 stage='process-death persistence';closeWebView();android('shell','am','force-stop',packageName);launch();await connectWebView();await activeScore(401);
 if(Number(badging.match(/versionCode='(\d+)'/)?.[1])>=4){
  stage='Danish Android app language';
  closeWebView();android('shell','am','force-stop',packageName);
  android('shell','cmd','locale','set-app-locales',packageName,'--user','0','--locales','da');
  launch();await connectWebView();await activeScore(401);
  assert.equal(await cdp.evaluate('document.documentElement.lang'),'da');
  assert.match(await cdp.evaluate('document.querySelector("#rules").textContent'),/Spilleregler/);
  assert.match(await cdp.evaluate('window.OcheLocale.language()'),/^da/);
  // Check a real Android resource dialog as well as the translated WebView.
  android('shell','input','keyevent','4');
  await until(()=>{
   android('shell','uiautomator','dump','/data/local/tmp/oche-window.xml');
   return android('shell','cat','/data/local/tmp/oche-window.xml').includes('Luk Oche Club?');
  },'Danish native exit dialog did not appear.');
  android('shell','input','keyevent','4');
  stage='English Android app language';
  closeWebView();android('shell','am','force-stop',packageName);
  android('shell','cmd','locale','set-app-locales',packageName,'--user','0','--locales','en');
  launch();await connectWebView();await activeScore(401);
  assert.equal(await cdp.evaluate('document.documentElement.lang'),'en');
  assert.match(await cdp.evaluate('document.querySelector("#rules").textContent'),/Rules/);
 }
 if(Number(badging.match(/versionCode='(\d+)'/)?.[1])>=6){
  stage='finished game session';
  // Complete the real 401 game: two 180 visits, then single 1 and double 20.
  async function passOpponent(){await click('#next');await click('[data-special="miss"]');await click('#next');}
  async function totalVisit(total){
   await click('#calculator');await click('#total-tab');
   for(const digit of String(total))await click(`[data-digit="${digit}"]`);
   await click('#calculator-done');
  }
  for(const total of [180,180]){await passOpponent();await totalVisit(total);}
  await activeScore(41);await passOpponent();
  await click('[data-mult="1"]');await click('[data-hit="1"]');await click('[data-mult="2"]');await click('[data-hit="20"]');
  await until(()=>cdp.evaluate("Boolean(document.querySelector('.winner #rematch')&&document.querySelector('#another-mode')&&document.querySelector('#end-session'))"),'Completed game did not offer all three session choices.');
  await click('#another-mode');await click('[data-mode="shanghai"]');
  const roster=()=>cdp.evaluate("[...document.querySelectorAll('[name=player]')].map(input=>input.value)");
  assert.deepEqual(await roster(),['Player 1','Player 2'],'Next mode must carry the named roster.');
  await click('.start-button');await activeScore(0);
  async function winShanghai(){
   for(const multiplier of [1,2,3]){await click(`[data-mult="${multiplier}"]`);await click('[data-hit="1"]');}
   await until(()=>cdp.evaluate("Boolean(document.querySelector('.winner'))"),'Shanghai did not finish naturally.');
  }
  await winShanghai();await click('#rematch');await activeScore(0);
  assert.equal(await cdp.evaluate("document.querySelector('[data-mult=\"1\"]').getAttribute('aria-pressed')"),'true','Rematch must reset dart input to Single.');
  assert.equal(await cdp.evaluate("document.querySelector('#undo').disabled"),true,'Rematch must clear undo history.');
  await winShanghai();await click('#end-session');
  assert.equal(await cdp.evaluate("document.querySelectorAll('.game-card').length"),12);
  assert.equal(await cdp.evaluate('window.OcheGameStore.load()'),'','End session must delete the saved roster and result.');
  await click('[data-mode="x01"]');
  assert.deepEqual(await roster(),['',''],'A new session must require names again.');
  console.log('Native named-session checks passed: real X01 finish, Shanghai rematch, same roster in another mode and session deletion.');
 }
 const activities=android('shell','dumpsys','activity','activities');
 assert.ok(activities.split('\n').some(line=>/ResumedActivity/.test(line)&&line.includes(packageName)),'App is not the resumed Android activity.');
 const crashes=android('logcat','-d','-b','crash');
 await writeFile(`${reportPrefix}-crash-log.txt`,crashes);
 assert.ok(!crashes.includes(packageName),'Android recorded an app crash. See artifacts/android-crash-log.txt.');
 const screenshot=execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:15000,maxBuffer:8*1024*1024});
 await writeFile(`${reportPrefix}-native.png`,screenshot);
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`\nAndroid API ${api}: exact APK installation, same-key reinstall, real scoring and process-death persistence passed. For versionCode 4+, English/Danish Android app language and Danish native dialog also passed. For versionCode 6+, named-player entry, rematch, cross-mode roster reuse and session ending passed.\n`);
 console.log('Native Android smoke passed: install, same-key reinstall, launch, 12-game UI, dartboard Done, undo, numeric score and process-death persistence.');
}catch(error){
 let web;
 if(cdp){try{web=await cdp.evaluate("({url:location.href,cards:document.querySelectorAll('.game-card').length,player:document.querySelector('.active-player')?.innerText,dialog:document.querySelector('dialog[open]')?.innerText,darts:[...document.querySelectorAll('.dart-slot')].map(e=>e.innerText),body:document.body.innerText.slice(0,1800)})");}catch{}}
 const detail=JSON.stringify({api,stage,error:error.message,lastClick,web});
 console.error('::error title=Native Android diagnostic::'+detail.slice(0,5000).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'\n## Native Android diagnostic\n\n    '+detail.replaceAll('\n','\n    ')+'\n');
 try{await writeFile(`${reportPrefix}-failure-logcat.txt`,android('logcat','-d','-t','1000'));}catch{}
 throw error;
}finally{closeWebView();}
