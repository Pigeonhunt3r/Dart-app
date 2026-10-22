export const MODES=[
{id:'x01',name:'501 & X01',tag:'Klassikeren',icon:'01',description:'301, 501, 701 eller 1001. Ram præcis nul.',rules:'Træk dine point fra startscoren. Du skal ende præcis på 0. Med double-out skal sidste pil være en double (bull tæller). Går du under 0, efterlader 1 med double-out eller lukker forkert, er turen bust: hele turens point annulleres.'},
{id:'cricket',name:'Cricket',tag:'Taktisk',icon:'✳',description:'Luk 15–20 og bull. Saml point undervejs.',rules:'Luk 15, 16, 17, 18, 19, 20 og bull med tre mærker på hvert tal. Single giver ét, double to, triple tre mærker. Ekstra træffere giver point, så længe mindst én modstander ikke har lukket tallet. Luk alt og hav mindst lige så mange point som alle andre for at vinde.'},
{id:'cutthroat',name:'Cut-throat Cricket',tag:'Taktisk',icon:'⚔',description:'Cricket med strafpoint til modstanderne.',rules:'Som Cricket, men overskydende træffere giver point til hver modstander, der ikke har lukket tallet. Luk alle tal og hav færrest point (delt lavest er nok) for at vinde.'},
{id:'around',name:'Jorden rundt',tag:'Præcision',icon:'◎',description:'Rejs fra 1 til 20 og slut på bull.',rules:'Ram 1 til 20 i rækkefølge, og slut med bull. Alle multiplikatorer tæller som én korrekt træffer. Du må ramme flere forskellige mål i samme tur. Første spiller gennem ruten vinder.'},
{id:'clock',name:'Double-runden',tag:'Præcision',icon:'◷',description:'Alle 20 doubler. Den ultimative træning.',rules:'Ram double 1 til double 20 i rækkefølge. Kun den aktuelle double tæller. Første spiller, der rammer double 20, vinder.'},
{id:'shanghai',name:'Shanghai',tag:'7 runder',icon:'✧',description:'Single, double og triple på samme tal.',rules:'Spil syv runder med målene 1 til 7. Kun rundens tal giver point. En single, en double og en triple af rundens tal i samme tur er Shanghai og giver øjeblikkelig sejr. Ellers vinder højeste score efter syv runder; lige score giver delt sejr.'},
{id:'halve',name:'Halve-it',tag:'9 runder',icon:'½',description:'Ram målet — eller halver din score.',rules:'Start på 40. Målene er 15, 16, double, 17, 18, triple, 19, 20 og bull. Kun træffere på målet giver point. Hvis ingen af turens tre pile rammer målet, halveres scoren (rundet ned). Højeste score efter ni runder vinder.'},
{id:'countup',name:'Count Up',tag:'8 runder',icon:'↑',description:'24 pile. Hvor mange point kan du samle?',rules:'Alle point tæller. Hver spiller får otte ture med tre pile. Højeste samlede score vinder; lige score giver delt sejr.'},
{id:'baseball',name:'Baseball',tag:'9 innings',icon:'◇',description:'Ni innings. Slå runs på rundens tal.',rules:'I inning 1 til 9 er rundens nummer målet. Single giver ét run, double to og triple tre. Andre felter giver nul. Flest runs efter ni innings vinder; lige score giver delt sejr.'},
{id:'killer',name:'Killer',tag:'Overlevelse',icon:'ϟ',description:'Bliv killer, og tag modstandernes liv.',rules:'Spillerne får forskellige mål fra 1 og op. Alle starter med tre liv. Ram din egen double for at blive killer. Derefter koster hver pil i en modstanders double dem ét liv. Mister en killer liv, mistes killer-status. Ram egen double igen for at genaktivere den. Sidste overlevende vinder.'},
{id:'elimination',name:'Elimination',tag:'Til 301',icon:'⊘',description:'Nå 301, og nulstil dine modstandere.',rules:'Byg din score fra 0 til præcis 301. Efter hver pil nulstilles andre spillere med præcis din nye score. Går en pil over 301, er hele turen bust og både din score og modstandernes scorer føres tilbage til turens start. Første spiller på 301 vinder.'},
{id:'golf',name:'Golf',tag:'9 huller',icon:'⚑',description:'Færrest slag over ni huller vinder.',rules:'Hul 1 til 9 bruger samme nummer som mål. Double giver 1 slag, triple 2, single 3 og forbi giver 5. Den SIDSTE kastede pil bestemmer hullets score. Du må stoppe turen tidligt for at beholde et godt resultat. Færrest slag efter ni huller vinder.'}
];
export function createGame(mode,names,options={}){
 if(!MODES.some(m=>m.id===mode))throw Error('Ukendt spil');
 if(names.length<1||names.length>8)throw Error('Vælg 1–8 spillere');
 if(['killer','elimination','cutthroat'].includes(mode)&&names.length<2)throw Error('Dette spil kræver mindst to spillere');
 const start=[301,501,701,1001].includes(Number(options.start))?Number(options.start):501;
 return {mode,options:{start,doubleOut:options.doubleOut!==false},players:names.map((name,i)=>({name:name.trim()||`Spiller ${i+1}`,score:mode==='x01'?start:mode==='halve'?40:0,marks:{},progress:1,lives:3,killer:false,target:i+1})),active:0,round:1,darts:[],winner:null,message:'',turnStart:null};
}
export const points=d=>d.n*d.m;
export function target(g){
 if(g.mode==='around')return g.players[g.active].progress===21?'Bull':g.players[g.active].progress;
 if(g.mode==='clock')return 'D'+g.players[g.active].progress;
 if(g.mode==='halve')return [15,16,'Double',17,18,'Triple',19,20,'Bull'][g.round-1];
 if(['shanghai','baseball','golf'].includes(g.mode))return g.round;
 if(g.mode==='killer')return 'D'+g.players[g.active].target;
 return null;
}
function finish(g,indices){g.winner=indices;g.message=indices.map(i=>g.players[i].name).join(' & ')+' vinder!';}
function evaluateCricket(g){const p=g.players[g.active];if([15,16,17,18,19,20,25].every(n=>(p.marks[n]||0)>=3)&&g.players.every(q=>g.mode==='cricket'?p.score>=q.score:p.score<=q.score))finish(g,[g.active]);}
export function throwDart(state,n,m=1){
 if(state.winner!==null||state.darts.length>=3) return state;
 if(!Number.isInteger(n)||![0,...Array.from({length:20},(_,i)=>i+1),25].includes(n)||![1,2,3].includes(m)||(n===25&&m===3)||(n===0&&m!==1))throw Error('Ugyldig pil');
 const g=structuredClone(state);if(!g.turnStart)g.turnStart=structuredClone(g.players);
 const d={n,m};g.darts.push(d);g.message='';const p=g.players[g.active],v=points(d);
 if(g.mode==='x01'){
  const left=p.score-v;
  if(left<0||(g.options.doubleOut&&left===1)||(left===0&&g.options.doubleOut&&m!==2)){
   g.players=structuredClone(g.turnStart);g.message='Bust! Turens point er annulleret.';while(g.darts.length<3)g.darts.push({n:0,m:1,bust:true});
  }else {p.score=left;if(left===0)finish(g,[g.active]);}
 }else if(['cricket','cutthroat'].includes(g.mode)){
  if(n>=15){const old=p.marks[n]||0,extra=Math.max(0,old+m-3);p.marks[n]=Math.min(3,old+m);
   if(g.mode==='cricket'){if(g.players.some((q,i)=>i!==g.active&&(q.marks[n]||0)<3))p.score+=extra*n;}
   else g.players.forEach((q,i)=>{if(i!==g.active&&(q.marks[n]||0)<3)q.score+=extra*n;});
  }evaluateCricket(g);
 }else if(['around','clock'].includes(g.mode)){
  if(n===(p.progress===21?25:p.progress)&&(g.mode==='around'||m===2))p.progress++;
  if(p.progress>(g.mode==='around'?21:20))finish(g,[g.active]);
 }else if(g.mode==='shanghai'){
  if(n===g.round)p.score+=v;
  if([1,2,3].every(mult=>g.darts.some(x=>x.n===g.round&&x.m===mult)))finish(g,[g.active]);
 }else if(g.mode==='countup')p.score+=v;
 else if(g.mode==='baseball'){if(n===g.round)p.score+=m;}
 else if(g.mode==='killer'){
  if(m===2){if(n===p.target)p.killer=true;else if(p.killer){g.players.forEach((q,i)=>{if(i!==g.active&&q.target===n&&q.lives>0){q.lives--;q.killer=false;}});}}
  const alive=g.players.map((q,i)=>q.lives>0?i:-1).filter(i=>i>=0);if(alive.length===1)finish(g,alive);
 }else if(g.mode==='elimination'){
  if(p.score+v>301){g.players=structuredClone(g.turnStart);g.message='Bust! Hele turen er annulleret.';while(g.darts.length<3)g.darts.push({n:0,m:1,bust:true});}
  else{p.score+=v;if(v>0)g.players.forEach((q,i)=>{if(i!==g.active&&q.score===p.score)q.score=0;});if(p.score===301)finish(g,[g.active]);}
 }
 return g;
}
function halveMatch(d,t){return t==='Double'?d.m===2:t==='Triple'?d.m===3:t==='Bull'?d.n===25:d.n===t;}
export function endTurn(state){
 if(state.winner!==null||state.darts.length===0)return state;
 const g=structuredClone(state),p=g.players[g.active];
 if(g.mode==='halve'){const hits=g.darts.filter(d=>halveMatch(d,target(g)));p.score=hits.length?p.score+hits.reduce((s,d)=>s+points(d),0):Math.floor(p.score/2);}
 if(g.mode==='golf'){const d=g.darts.at(-1);p.score+=d.n===g.round?({1:3,2:1,3:2}[d.m]):5;}
 const limits={shanghai:7,halve:9,countup:8,baseball:9,golf:9};
 let next=g.active;do{next=(next+1)%g.players.length;}while(g.mode==='killer'&&g.players[next].lives===0);
 if(next<=g.active){if(limits[g.mode]&&g.round===limits[g.mode]){const scores=g.players.map(q=>q.score),best=g.mode==='golf'?Math.min(...scores):Math.max(...scores);finish(g,scores.map((v,i)=>v===best?i:-1).filter(i=>i>=0));return g;}g.round++;}
 g.active=next;g.darts=[];g.turnStart=null;g.message='';return g;
}
export function dartLabel(d){if(d.totalEntry)return 'Total '+d.total;if(d.notThrown||d.bust)return '—';return d.n===0?'Forbi':d.n===25?(d.m===2?'Bullseye':'Bull'):(d.m===3?'T':d.m===2?'D':'')+d.n;}
// Shortest possible checkout using the darts left in this turn. Bullseye is a double.
export function checkout(score,dartsLeft=3,doubleOut=true){
 if(!Number.isInteger(score)||score<=0||dartsLeft<1)return null;
 const singles=Array.from({length:20},(_,i)=>({n:20-i,m:1}));
 const doubles=Array.from({length:20},(_,i)=>({n:20-i,m:2}));
 const triples=Array.from({length:20},(_,i)=>({n:20-i,m:3}));
 const bull={n:25,m:2},outerBull={n:25,m:1};
 const finishes=doubleOut?[...doubles,bull]:[...singles,...doubles,...triples,outerBull,bull];
 const setups=[...triples,...singles,...doubles,outerBull,bull];
 function find(left,count){
  if(count===1){const d=finishes.find(d=>points(d)===left);return d?[d]:null;}
  for(const d of setups){const remain=left-points(d);if(remain<(doubleOut?2:1)||remain>60*(count-2)+(doubleOut?50:60))continue;
   const route=find(remain,count-1);if(route)return[d,...route];
  }return null;
 }
 for(let count=1;count<=Math.min(dartsLeft,3);count++){const route=find(score,count);if(route)return route;}
 return null;
}

/** A selection of legal checkouts, including distinct openers and bull routes. */
export function checkoutOptions(score,dartsLeft=3,doubleOut=true,limit=6){
 const best=checkout(score,dartsLeft,doubleOut);
 if(!best)return [];
 limit=Math.max(1,Math.min(24,Math.floor(limit)||6));
 const shots=[...Array.from({length:20},(_,i)=>({n:20-i,m:3})),...Array.from({length:20},(_,i)=>({n:20-i,m:1})),...Array.from({length:20},(_,i)=>({n:20-i,m:2})),{n:25,m:1},{n:25,m:2}];
 const finishes=shots.filter(d=>!doubleOut||d.m===2);
 const all=[];
 function routes(left,count,prefix){
  if(count===1){for(const d of finishes)if(points(d)===left)all.push([...prefix,d]);return;}
  for(const d of shots){const remain=left-points(d);if(remain<(doubleOut?2:1)||remain>60*(count-2)+(doubleOut?50:60))continue;routes(remain,count-1,[...prefix,d]);}
 }
 for(let count=1;count<=Math.min(3,dartsLeft);count++)routes(score,count,[]);
 const key=r=>r.map(d=>`${d.n}:${d.m}`).join('|');
 const chosen=[best],used=new Set([key(best)]);
 function add(route){if(route&&chosen.length<limit&&!used.has(key(route))){chosen.push(route);used.add(key(route));}}
 // Show a bull alternative when one is legal, then vary opening and finishing targets.
 add(all.find(r=>r.some(d=>d.n===25)&&!used.has(key(r))));
 const signatures=new Set(chosen.map(r=>key([r[0],r.at(-1)])));
 for(const route of all){const signature=key([route[0],route.at(-1)]);if(!signatures.has(signature)){add(route);signatures.add(signature);}}
 for(const route of all)add(route);
 return chosen;
}

export function bustTurn(state){
 if(!['x01','elimination'].includes(state.mode)||state.winner!==null)return state;
 const g=structuredClone(state);
 if(g.turnStart)g.players=structuredClone(g.turnStart);
 g.turnStart??=structuredClone(g.players);
 while(g.darts.length<3)g.darts.push({n:0,m:1,bust:true});
 g.message='Bust! Turens point er annulleret.';
 return g;
}
function possibleTotals(count){
 let totals=new Set([0]);
 const values=[0,25,50,...Array.from({length:20},(_,i)=>i+1).flatMap(n=>[n,n*2,n*3])];
 for(let i=0;i<count;i++)totals=new Set([...totals].flatMap(total=>values.map(value=>total+value)));
 return totals;
}
const TURN_TOTALS=possibleTotals(3),SETUP_TOTALS=possibleTotals(2);
/** Manual entry is a full visit, so the unknown darts cannot be used for target games. */
export function recordTotal(state,total,finalHit=''){
 if(!['x01','countup'].includes(state.mode))throw Error('Dette spil kræver de konkrete felter. Brug dartskiven.');
 if(state.winner!==null||state.darts.length)throw Error('Indtast kun en samlet score ved starten af en tur.');
 if(!Number.isInteger(total)||total<0||total>180||!TURN_TOTALS.has(total))throw Error('Indtast en mulig score fra 0 til 180 med højst tre pile.');
 const g=structuredClone(state),p=g.players[g.active];g.turnStart=structuredClone(g.players);
 g.darts=[{n:0,m:1,totalEntry:true,total},{n:0,m:1,notThrown:true},{n:0,m:1,notThrown:true}];g.message='';
 if(g.mode==='countup'){p.score+=total;return g;}
 const remaining=p.score-total;
 if(remaining<0||(g.options.doubleOut&&remaining===1))return bustTurn(g);
 if(remaining===0&&g.options.doubleOut){
  if(!['double','bullseye','other'].includes(finalHit))throw Error('Vælg, hvad den sidste pil ramte.');
  const valid=finalHit==='bullseye'?SETUP_TOTALS.has(total-50):finalHit==='double'?Array.from({length:20},(_,i)=>(i+1)*2).some(n=>SETUP_TOTALS.has(total-n)):false;
  if(!valid)return bustTurn(g);
 }
 p.score=remaining;
 if(remaining===0)finish(g,[g.active]);
 return g;
}
