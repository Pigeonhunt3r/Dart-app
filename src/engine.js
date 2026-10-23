import {t} from './i18n.js';
export const MODES=[
{id:'x01',name:'501 & X01',tag:t("The classic"),icon:'01',description:t("301, 501, 701 or 1001. Reach exactly zero."),rules:t("Subtract each score from your starting total and reach exactly 0. In double-out, your last dart must be a double, including bullseye. Going below 0, leaving 1 in double-out, or finishing on the wrong field is a bust: every point from that turn is cancelled.")},
{id:'cricket',name:'Cricket',tag:t("Tactical"),icon:'✳',description:t("Close 15–20, Double, Triple and Bull."),rules:t("Extended Cricket has nine rows: 20, 19, 18, 17, 16, 15, Double, Triple and Bull. Close each row with three marks. On a number, single/double/triple gives one/two/three marks. Each numbered double or triple can instead give one mark to its separate Double or Triple row: choose one row for that dart. Bullseye gives two Bull marks. Extra hits score the actual field value while an opponent has that row open. Close all rows and have at least as many points as every opponent to win. Classic mode uses the six numbers and Bull without separate Double/Triple rows.")},
{id:'cutthroat',name:'Cut-throat Cricket',tag:t("Tactical"),icon:'⚔',description:t("Cricket with penalty points for your opponents."),rules:t("Use the same targets and one-row-per-dart choice as Cricket. Extra hits add penalty points to each opponent whose row is still open. Close every row and have the fewest penalty points to win; a tie is enough. Extended mode adds separate Double and Triple rows before Bull. Classic mode has only 15–20 and Bull.")},
{id:'around',name:t("Around the World"),tag:t("Precision"),icon:'◎',description:t("Advance through 1–20, then Double, Triple and Bull."),rules:t("In the extended game, hit your current number from 1 to 20: a single advances one number, a double two and a triple three. After the numbered targets, hit any numbered double, then any numbered triple, then bull (25 or 50) to win. You must complete those final three stages in order. Classic mode advances one number for every hit and goes directly from 20 to bull.")},
{id:'clock',name:t("Around the Doubles"),tag:t("Precision"),icon:'◷',description:t("All 20 doubles. The ultimate practice round."),rules:t("Hit double 1 through double 20 in order. Only your current double counts. The first player to reach and hit double 20 wins.")},
{id:'shanghai',name:'Shanghai',tag:t("7 rounds"),icon:'✧',description:t("Single, double and triple on the same number."),rules:t("Play seven rounds with targets 1 through 7. Only the current target scores. Hit its single, double and triple in the same turn for Shanghai and an immediate win. Otherwise, the highest score after seven rounds wins. Tied scores share the win.")},
{id:'halve',name:'Halve-it',tag:t("9 rounds"),icon:'½',description:t("Hit the target or halve your score."),rules:t("Start at 40. The targets are 15, 16, double, 17, 18, triple, 19, 20 and bull. Only hits on the target score. If all three darts miss the target, halve your score, rounding down. The highest score after nine rounds wins.")},
{id:'countup',name:'Count Up',tag:t("8 rounds"),icon:'↑',description:t("24 darts. How many points can you score?"),rules:t("Every point counts. Each player has eight turns of three darts. The highest total wins. Tied scores share the win.")},
{id:'baseball',name:'Baseball',tag:'9 innings',icon:'◇',description:t("Nine innings. Score runs on the inning number."),rules:t("In innings 1 through 9, aim for the inning number. A single scores one run, a double two and a triple three. Other fields score nothing. The most runs after nine innings wins. Ties share the win.")},
{id:'killer',name:'Killer',tag:t("Survival"),icon:'ϟ',description:t("Become a killer and take your opponents’ lives."),rules:t("Players receive different targets starting at 1, and three lives each. Hit your own double to become a killer. Then each dart in an opponent’s double takes one of their lives. A killer who loses a life also loses killer status: hit your own double again to regain it. The last survivor wins.")},
{id:'elimination',name:'Elimination',tag:t("Race to 301"),icon:'⊘',description:t("Reach 301 and reset your opponents’ scores."),rules:t("Build your score from 0 to exactly 301. After each dart, reset any opponent whose score matches your new score to 0. Going over 301 busts the whole turn: your score and every affected opponent’s score return to their values at the start of the turn. The first to reach 301 wins.")},
{id:'golf',name:'Golf',tag:t("9 holes"),icon:'⚑',description:t("The fewest strokes over nine holes wins."),rules:t("Holes 1 through 9 use the hole number as their target. A double costs 1 stroke, a triple 2, a single 3 and a miss 5. Your LAST dart determines the hole’s score. Stop your turn early to keep a good result. The fewest strokes after nine holes wins.")}
];
export function createGame(mode,names,options={}){
 if(!MODES.some(m=>m.id===mode))throw Error(t("Unknown game"));
 if(!Array.isArray(names)||names.length<1||names.length>8)throw Error(t("Choose 1–8 players"));
 if(['killer','elimination','cutthroat'].includes(mode)&&names.length<2)throw Error(t("This game needs at least two players"));
 const playerNames=Array.from(names,name=>typeof name==='string'?name.trim():'');
 if(playerNames.some(name=>!name))throw Error(t('Enter a name for every player (at least one non-space character).'));
 if(playerNames.some(name=>name.length>24))throw Error(t('Player names must be 24 characters or fewer.'));
 const start=[301,501,701,1001].includes(Number(options.start))?Number(options.start):501;
 return {mode,options:{start,doubleOut:options.doubleOut!==false,...(mode==='around'?{aroundVariant:options.aroundVariant==='classic'?'classic':'extended'}:{}),...(['cricket','cutthroat'].includes(mode)?{cricketVariant:options.cricketVariant==='classic'?'classic':'extended'}:{})},players:playerNames.map((name,i)=>({name,score:mode==='x01'?start:mode==='halve'?40:0,marks:{},progress:1,lives:3,killer:false,target:i+1,...(['x01','countup'].includes(mode)?{scoringStats:{points:0,darts:0}}:{})})),active:0,round:1,darts:[],winner:null,message:'',turnStart:null};
}
export const points=d=>d.anyRing?0:d.n*d.m;
const hasScoringStats=player=>Number.isInteger(player?.scoringStats?.points)&&player.scoringStats.points>=0&&Number.isInteger(player.scoringStats.darts)&&player.scoringStats.darts>=0;
/** Three-dart average for tracked games. Older saves have no reliable dart count. */
export function scoreAverage(game,playerIndex=game.active){
 const player=game.players?.[playerIndex];
 return ['x01','countup'].includes(game.mode)&&hasScoringStats(player)&&player.scoringStats.darts>0?3*player.scoringStats.points/player.scoringStats.darts:null;
}
function addScoringStats(player,scored,darts){
 if(hasScoringStats(player)){player.scoringStats.points+=scored;player.scoringStats.darts+=darts;}
}

export const isExtendedAround=g=>g.options?.aroundVariant==='extended';
export const isExtendedCricket=g=>['cricket','cutthroat'].includes(g.mode)&&g.options?.cricketVariant==='extended';
export const cricketTargets=g=>isExtendedCricket(g)?[20,19,18,17,16,15,'double','triple',25]:[20,19,18,17,16,15,25];
export const targetLabel=value=>value==='double'?t('Double'):value==='triple'?t('Triple'):value===25||value==='Bull'?'Bull':String(value);
export function target(g){
 if(g.mode==='around'){
  const progress=g.players[g.active].progress;
  return isExtendedAround(g)?({21:'Double',22:'Triple',23:'Bull'}[progress]??progress):progress===21?'Bull':progress;
 }
 if(g.mode==='clock')return 'D'+g.players[g.active].progress;
 if(g.mode==='halve')return [15,16,'Double',17,18,'Triple',19,20,'Bull'][g.round-1];
 if(['shanghai','baseball','golf'].includes(g.mode))return g.round;
 if(g.mode==='killer')return 'D'+g.players[g.active].target;
 return null;
}
export function gameMessage(state){
 if(state.winner!==null)return t(state.winner.length===1?'{players} wins!':'{players} win!',{players:state.winner.map(i=>state.players[i].name).join(' & ')});
 if(state.message?.startsWith('Bust!'))return t('Bust! Points from this turn are cancelled.');
 return state.message||'';
}
function finish(g,indices){g.winner=indices;g.message=gameMessage(g);}
function evaluateCricket(g){const p=g.players[g.active];if(cricketTargets(g).every(n=>(p.marks[n]||0)>=3)&&g.players.every(q=>g.mode==='cricket'?p.score>=q.score:p.score<=q.score))finish(g,[g.active]);}
export function throwDart(state,n,m=1,category='number'){
 if(state.winner!==null||state.darts.length>=3) return state;
 if(!Number.isInteger(n)||![0,...Array.from({length:20},(_,i)=>i+1),25].includes(n)||![1,2,3].includes(m)||(n===25&&m===3)||(n===0&&m!==1))throw Error(t("Invalid dart"));
 if(!['number','double','triple'].includes(category)||(category!=='number'&&(!isExtendedCricket(state)||n<1||n>20||m!==(category==='double'?2:3))))throw Error(t('Choose a numbered double or triple that matches the selected row.'));
 const g=structuredClone(state);if(!g.turnStart)g.turnStart=structuredClone(g.players);
 const d=category==='number'?{n,m}:{n,m,category};g.darts.push(d);g.message='';const p=g.players[g.active],v=points(d);
 if(g.mode==='x01'){
  const left=p.score-v;
  if(left<0||(g.options.doubleOut&&left===1)||(left===0&&g.options.doubleOut&&m!==2)){
   g.players=structuredClone(g.turnStart);addScoringStats(g.players[g.active],0,3);g.message=t("Bust! Points from this turn are cancelled.");while(g.darts.length<3)g.darts.push({n:0,m:1,bust:true});
  }else {p.score=left;addScoringStats(p,v,1);if(left===0)finish(g,[g.active]);}
 }else if(['cricket','cutthroat'].includes(g.mode)){
  if(category!=='number'||n>=15){const row=category==='number'?n:category,marks=category==='number'?m:1,old=p.marks[row]||0,extra=Math.max(0,old+marks-3),scored=extra*(category==='number'?n:v);p.marks[row]=Math.min(3,old+marks);
   if(g.mode==='cricket'){if(g.players.some((q,i)=>i!==g.active&&(q.marks[row]||0)<3))p.score+=scored;}
   else g.players.forEach((q,i)=>{if(i!==g.active&&(q.marks[row]||0)<3)q.score+=scored;});
  }evaluateCricket(g);
 }else if(g.mode==='around'){
  if(isExtendedAround(g)){
   if(p.progress<=20&&n===p.progress)p.progress=Math.min(21,p.progress+m);
   else if(p.progress===21&&n>=1&&n<=20&&m===2)p.progress=22;
   else if(p.progress===22&&n>=1&&n<=20&&m===3)p.progress=23;
   else if(p.progress===23&&n===25)p.progress=24;
   if(p.progress>23)finish(g,[g.active]);
  }else{if(n===(p.progress===21?25:p.progress))p.progress++;if(p.progress>21)finish(g,[g.active]);}
 }else if(g.mode==='clock'){
  if(n===p.progress&&m===2)p.progress++;
  if(p.progress>20)finish(g,[g.active]);
 }else if(g.mode==='shanghai'){
  if(n===g.round)p.score+=v;
  if([1,2,3].every(mult=>g.darts.some(x=>x.n===g.round&&x.m===mult)))finish(g,[g.active]);
 }else if(g.mode==='countup'){p.score+=v;addScoringStats(p,v,1);}
 else if(g.mode==='baseball'){if(n===g.round)p.score+=m;}
 else if(g.mode==='killer'){
  if(m===2){if(n===p.target)p.killer=true;else if(p.killer){g.players.forEach((q,i)=>{if(i!==g.active&&q.target===n&&q.lives>0){q.lives--;q.killer=false;}});}}
  const alive=g.players.map((q,i)=>q.lives>0?i:-1).filter(i=>i>=0);if(alive.length===1)finish(g,alive);
 }else if(g.mode==='elimination'){
  if(p.score+v>301){g.players=structuredClone(g.turnStart);g.message=t("Bust! The whole turn is cancelled.");while(g.darts.length<3)g.darts.push({n:0,m:1,bust:true});}
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
/** Confirm one X01 visit, including a partial board entry, as a single saved action. */
export function completeVisit(state){
 if(state.mode!=='x01'||state.winner!==null||!state.darts.length)return state;
 const player=state.players[state.active],before=state.turnStart?.[state.active]?.score??player.score;
 const bust=state.message?.startsWith('Bust!')||state.darts.some(dart=>dart.bust);
 let completed=state;
 while(completed.darts.length<3)completed=throwDart(completed,0,1);
 const next=endTurn(completed);
 next.lastVisit={player:state.active,name:player.name,score:player.score,total:before-player.score,bust:Boolean(bust)};
 return next;
}
/** Around only needs the ring at its final Double/Triple stages. */
export function throwAroundRing(state,m){
 if(state.mode!=='around'||![2,3].includes(m))throw Error(t('Invalid dart'));
 const progress=state.players[state.active].progress;
 const next=throwDart(state,progress<=20?progress:1,m);
 if(next!==state&&progress>20)next.darts.at(-1).anyRing=m===2?'double':'triple';
 return next;
}
export function dartLabel(d){if(d.totalEntry)return 'Total '+d.total;if(d.notThrown||d.bust)return '—';if(d.anyRing)return targetLabel(d.anyRing);const label=d.n===0?t("Miss"):d.n===25?(d.m===2?'Bullseye':'Bull'):(d.m===3?'T':d.m===2?'D':'')+d.n;return d.category&&d.category!=='number'?label+' · '+targetLabel(d.category):label;}
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
 if(g.mode==='x01')addScoringStats(g.players[g.active],0,3);
 while(g.darts.length<3)g.darts.push({n:0,m:1,bust:true});
 g.message=t("Bust! Points from this turn are cancelled.");
 return g;
}
function possibleTotals(count){
 let totals=new Set([0]);
 const values=[0,25,50,...Array.from({length:20},(_,i)=>i+1).flatMap(n=>[n,n*2,n*3])];
 for(let i=0;i<count;i++)totals=new Set([...totals].flatMap(total=>values.map(value=>total+value)));
 return totals;
}
const TOTALS_BY_DARTS=Array.from({length:4},(_,count)=>possibleTotals(count));
const TURN_TOTALS=TOTALS_BY_DARTS[3],SETUP_TOTALS=TOTALS_BY_DARTS[2];
/** Manual entry is a full visit, so the unknown darts cannot be used for target games. */
export function recordTotal(state,total,finalHit='',dartsUsed=3){
 if(!['x01','countup'].includes(state.mode))throw Error(t("This game needs the exact fields hit. Use the dartboard."));
 if(state.winner!==null||state.darts.length)throw Error(t("Enter a turn total only at the start of a turn."));
 if(!Number.isInteger(total)||total<0||total>180||!TURN_TOTALS.has(total))throw Error(t("Enter a possible score from 0 to 180 using up to three darts."));
 if(!Number.isInteger(dartsUsed)||dartsUsed<1||dartsUsed>3)throw Error(t('Choose 1, 2 or 3 darts for the checkout.'));
 const remaining=state.mode==='x01'?state.players[state.active].score-total:null;
 if(dartsUsed!==3&&remaining!==0)throw Error(t('Only a checkout can use fewer than three darts for a turn total.'));
 const g=structuredClone(state),p=g.players[g.active];g.turnStart=structuredClone(g.players);
 g.darts=[{n:0,m:1,totalEntry:true,total,dartsUsed},{n:0,m:1,notThrown:true},{n:0,m:1,notThrown:true}];g.message='';
 if(g.mode==='countup'){p.score+=total;addScoringStats(p,total,3);return g;}
 if(remaining<0||(g.options.doubleOut&&remaining===1))return bustTurn(g);
 if(remaining===0){
  if(g.options.doubleOut){
   if(!['double','bullseye','other'].includes(finalHit))throw Error(t("Choose what the final dart hit."));
   const finishes=finalHit==='bullseye'?[50]:finalHit==='double'?Array.from({length:20},(_,i)=>(i+1)*2):[];
   if(!finishes.some(value=>SETUP_TOTALS.has(total-value)))return bustTurn(g);
   if(!finishes.some(value=>TOTALS_BY_DARTS[dartsUsed-1].has(total-value)))throw Error(t('That checkout is not possible with the selected dart count.'));
  }else if(!TOTALS_BY_DARTS[dartsUsed].has(total))throw Error(t('That checkout is not possible with the selected dart count.'));
 }
 p.score=remaining;addScoringStats(p,total,dartsUsed);
 if(remaining===0)finish(g,[g.active]);
 return g;
}
