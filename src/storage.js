const KEY='dartclub';

/**
 * Store one serialized game snapshot. Android's narrow native store acknowledges
 * a durable commit; browsers retain localStorage. No game rules live here.
 *
 * Native load(): null = never initialized, '' = deliberately cleared.
 * Native save(string): true only after the state is committed to device storage.
 */
export function createGameStorage({nativeStore,webStore}={}){
 const useNative=nativeStore!==null&&nativeStore!==undefined;
 function forgetLegacy(){
  try{webStore?.removeItem(KEY);}catch{/* An acknowledged native state is authoritative. */}
 }
 function commit(value){
  if(nativeStore.save(value)!==true)throw new Error('Game state could not be saved durably on this device.');
 }
 function stringOrNull(value){
  if(value===null||value===undefined)return null;
  if(typeof value!=='string')throw new TypeError('Game storage must contain a serialized string.');
  return value===''?null:value;
 }
 return {
  read(){
   if(!useNative)return stringOrNull(webStore.getItem(KEY));
   const current=nativeStore.load();
   // An empty native value is a tombstone. Consulting legacy data here would
   // resurrect a game the player explicitly deleted.
   if(current!==null&&current!==undefined)return stringOrNull(current);
   let legacy;
   try{legacy=webStore?.getItem(KEY);}catch{return null;}
   legacy=stringOrNull(legacy);
   if(legacy===null)return null;
   commit(legacy);
   forgetLegacy();
   return legacy;
  },
  write(serialized){
   if(serialized!==null&&typeof serialized!=='string')throw new TypeError('Write a serialized game string or null to clear it.');
   if(useNative){
    commit(serialized===null?'':serialized);
    forgetLegacy();
   }else if(serialized===null||serialized==='')webStore.removeItem(KEY);
   else webStore.setItem(KEY,serialized);
  }
 };
}
