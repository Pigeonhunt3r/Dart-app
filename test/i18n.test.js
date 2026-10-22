import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLanguage,translate,DANISH,languagePreference,saveLanguagePreference} from '../src/i18n.js';
import {gameMessage} from '../src/engine.js';

test('Danish follows the first device language, all other device languages fall back to English',()=>{
 for(const locale of ['da','da-DK','da-GL','DA-dk','da_Latn_DK'])assert.equal(resolveLanguage([locale,'en']), 'da');
 for(const locale of ['en','en-US','en-GB','de-DE','fr','sv-SE','invalid'])assert.equal(resolveLanguage([locale,'da']), 'en');
 for(const empty of [undefined,null,[],[''],[null]])assert.equal(resolveLanguage(empty),'en');
 assert.equal(resolveLanguage('da-DK'),'da');assert.equal(resolveLanguage(['','da-DK']),'da');
});
test('English defaults and Danish translations cover controls, guides and checkout help',()=>{
 for(const [english,danish] of Object.entries(DANISH)){
  assert.equal(translate(english,'en'),english);assert.equal(translate(english,'da'),danish);
  assert.ok(english.length&&danish.length);
 }
 assert.equal(translate('Around the World','da'),'Jorden rundt');
 assert.equal(translate('Done','da'),'Færdig');
 assert.equal(translate('CHECKOUT OPTIONS','da'),'LUKKEMULIGHEDER');
 assert.equal(translate('A future English label','de'),'A future English label');
});
test('saved winner and bust messages follow the current language without changing names',()=>{
 const players=[{name:'Spiller <1>'},{name:'Anna'}];
 assert.equal(gameMessage({players,winner:[0],message:'Spiller <1> vinder!'}),'Spiller <1> wins!');
 assert.equal(gameMessage({players,winner:[0,1],message:''}),'Spiller <1> & Anna win!');
 assert.equal(gameMessage({players,winner:null,message:'Bust! Hele turen er annulleret.'}),'Bust! Points from this turn are cancelled.');
 assert.equal(translate('{players} wins!','da',{players:'Anna & Bo'}),'Anna & Bo vinder!');
});
test('language choices require acknowledged persistence and system clears the browser override',()=>{
 const originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const originalNative=globalThis.OcheLocale;
 const values=new Map();
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}});
  delete globalThis.OcheLocale;
  assert.equal(languagePreference(),'system');
  assert.equal(saveLanguagePreference('da'),true);assert.equal(languagePreference(),'da');
  assert.equal(saveLanguagePreference('en'),true);assert.equal(languagePreference(),'en');
  assert.equal(saveLanguagePreference('system'),true);assert.equal(languagePreference(),'system');assert.equal(values.size,0);
  assert.equal(saveLanguagePreference('invalid'),false);
  globalThis.OcheLocale={preference:()=> 'system',setPreference:()=>false};
  assert.equal(saveLanguagePreference('da'),false);assert.equal(languagePreference(),'system');assert.equal(values.size,0);
  globalThis.OcheLocale={preference:()=> 'en',setPreference:value=>value==='en'};
  assert.equal(languagePreference(),'en');assert.equal(saveLanguagePreference('en'),true);
 }finally{
  if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);else delete globalThis.localStorage;
  if(originalNative)globalThis.OcheLocale=originalNative;else delete globalThis.OcheLocale;
 }
});
