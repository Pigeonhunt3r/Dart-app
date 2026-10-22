import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
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
const activity=badging.match(/^launchable-activity: name='([^']+)'/m)?.[1];
assert.ok(packageName&&activity,'APK must declare a launchable activity.');
assert.equal(android('shell','getprop','ro.kernel.qemu').trim(),'1','Device must be an emulator.');
assert.equal(android('shell','getprop','sys.boot_completed').trim(),'1','Emulator must finish booting.');
await mkdir('artifacts',{recursive:true});

let cdp,port;
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
 const found=await cdp.evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element||element.disabled)return false;element.click();return true;})()`);
 assert.equal(found,true,`Missing or disabled app control: ${selector}`);
}
async function activeScore(score){
 await until(()=>cdp.evaluate(`document.querySelector('.active-player')?.innerText.includes(${JSON.stringify(String(score))})`),`Active score did not become ${score}.`);
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
 android('logcat','-c');launch();await connectWebView();
 await until(()=>cdp.evaluate("document.querySelectorAll('.game-card').length===12"),'Android WebView did not render the 12 game cards.');
 await click('[data-mode="x01"]');await click('.start-button');await activeScore(501);
 await click('#calculator');
 await click('[data-board-n="20"][data-board-m="3"]');await click('#calculator-done');await activeScore(441);
 await click('#undo');await activeScore(501);
 await click('#calculator');await click('#total-tab');
 for(const digit of ['1','0','0'])await click(`[data-digit="${digit}"]`);
 await click('#calculator-done');await activeScore(401);
 // Kill/relaunch the native process, not only the document, and verify persisted state.
 closeWebView();android('shell','am','force-stop',packageName);launch();await connectWebView();await activeScore(401);
 const activities=android('shell','dumpsys','activity','activities');
 assert.ok(activities.split('\n').some(line=>/ResumedActivity/.test(line)&&line.includes(packageName)),'App is not the resumed Android activity.');
 const crashes=android('logcat','-d','-b','crash');
 await writeFile('artifacts/android-crash-log.txt',crashes);
 assert.ok(!crashes.includes(packageName),'Android recorded an app crash. See artifacts/android-crash-log.txt.');
 const screenshot=execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{timeout:15000,maxBuffer:8*1024*1024});
 await writeFile('artifacts/android-native.png',screenshot);
 console.log('Native Android smoke passed: install, same-key reinstall, launch, 12-game UI, dartboard Done, undo, numeric score and process-death persistence.');
}catch(error){
 try{await writeFile('artifacts/android-failure-logcat.txt',android('logcat','-d','-t','1000'));}catch{}
 throw error;
}finally{closeWebView();}
