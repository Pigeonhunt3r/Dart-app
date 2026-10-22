import {t} from './i18n.js';
import {gameMessage,points,target,cricketTargets,targetLabel,isExtendedAround,isExtendedCricket} from './engine.js';

const cricketLabel=targetLabel;
const golfStrokes=(dart,hole)=>dart?.n===hole?({1:3,2:1,3:2}[dart.m]):5;
const strokeResult=count=>count===1?t('1 stroke'):t('{count} strokes',{count});

/** Live instructions describe the current saved position; they never change it. */
export function guidance(game){
 const player=game.players[game.active],left=Math.max(0,3-game.darts.length);
 if(game.winner!=null)return {
  title:gameMessage(game),target:t('Game complete'),
  detail:t('Choose Rematch to play again with these settings, another mode with the same players, or End session.'),
  action:t('Rematch or another mode')
 };
 if(left===0){
  const bust=game.message?.startsWith('Bust!')||game.darts.some(dart=>dart.bust);
  let detail=t('All three darts have been recorded. Press Next player to continue.');
  if(bust)detail=t('The whole turn was cancelled. Scores are back where they were at the start of the turn. Press Next player.');
  else if(game.mode==='golf')detail=t('Your last dart gives {result} for this hole. Press Next player to keep that result.',{result:strokeResult(golfStrokes(game.darts.at(-1),game.round))});
  else if(game.mode==='halve'){
   const current=target(game),hits=game.darts.filter(dart=>current==='Double'?dart.m===2:current==='Triple'?dart.m===3:current==='Bull'?dart.n===25:dart.n===current);
   detail=hits.length?t('Your target hits add {points} points. Press Next player to apply the turn.',{points:hits.reduce((sum,dart)=>sum+points(dart),0)}):t('No target hits this turn: your score will halve to {score}. Press Next player to apply it.',{score:Math.floor(player.score/2)});
  }
  return {title:bust?t('Bust — turn cancelled'):t('Turn complete'),target:t('Next player'),detail,action:t('Next player')};
 }
 const result={
  title:left===1?t('{player} · 1 dart left',{player:player.name}):t('{player} · {count} darts left',{player:player.name,count:left}),
  target:'',detail:'',
  action:game.darts.length?(game.mode==='golf'?t('End turn'):t('Add dart')):['x01','countup'].includes(game.mode)?t('Done'):t('Add dart')
 };
 if(game.mode==='x01'){
  result.target=t('{score} points remaining',{score:player.score});
  result.detail=game.options.doubleOut?t('Reach exactly zero. Your final dart must be a double or Bullseye; going below zero or leaving 1 is Bust.'):t('Reach exactly zero on any field. Going below zero cancels the whole turn.');
  if(!game.darts.length)result.detail+=' '+t('Enter your turn total, or use Dart hits to record the exact fields.');
 }else if(['cricket','cutthroat'].includes(game.mode)){
  const targets=cricketTargets(game),next=targets.find(value=>(player.marks[value]||0)<3);
  if(next!==undefined){
   const label=cricketLabel(next),marks=3-(player.marks[next]||0);
   result.target=t('Close {target}',{target:label});
   result.detail=marks===1?t('1 more mark needed on {target}.',{target:label}):t('{marks} more marks needed on {target}.',{marks,target:label});
   result.detail+=' '+(next==='double'?t('Each numbered double hit adds one mark to Double.'):next==='triple'?t('Each numbered triple hit adds one mark to Triple.'):next===25?t('Bull scores one mark; Bullseye scores two.'):t('Singles add one mark, doubles two and triples three.'));
   if(isExtendedCricket(game))result.detail+=' '+t('A double or triple counts toward one row only. Choose its row before adding the dart.');
   if(isExtendedCricket(game)&&next!==25)result.detail+=' '+t('Double and Triple are separate required targets above Bull.');
  }else{
   const open=targets.filter(value=>game.players.some((other,index)=>index!==game.active&&(other.marks[value]||0)<3)).map(cricketLabel).join(', ');
   result.target=game.mode==='cutthroat'?t('Add penalty points'):t('Take the scoring lead');
   result.detail=game.mode==='cutthroat'?t('Your targets are closed. Hit targets opponents still have open to raise their penalty points: {targets}.',{targets:open}):t('Your targets are closed. Score on targets opponents still have open until your score is highest or tied: {targets}.',{targets:open});
  }
 }else if(game.mode==='around'){
  const extended=isExtendedAround(game),progress=player.progress;
  if(extended&&progress===21){result.target=t('Any double');result.detail=t('Hit any numbered double (D1–D20). Bullseye does not count here. Next comes Triple, then Bull.');}
  else if(extended&&progress===22){result.target=t('Any triple');result.detail=t('Hit any numbered triple (T1–T20). Bull is your final target after this.');}
  else if(progress===(extended?23:21)){result.target='Bull';result.detail=t('Hit Bull (25) or Bullseye (50) to finish.');}
  else{
   result.target=t('Hit {number}',{number:progress});
   result.detail=extended?t('A single advances one number, a double two and a triple three. After 20, finish Double → Triple → Bull.'):t('Hit the current number to advance by one. Singles, doubles and triples each advance one target; Bull comes after 20.');
  }
 }else if(game.mode==='clock'){
  result.target=t('Double {number}',{number:player.progress});
  result.detail=player.progress===20?t('Only D20 completes the game. A single or triple 20 does not count.'):t('Only D{number} advances you. Singles and triples do not count. Your next double is D{next}.',{number:player.progress,next:player.progress+1});
 }else if(game.mode==='shanghai'){
  const missing=[1,2,3].filter(multiplier=>!game.darts.some(dart=>dart.n===game.round&&dart.m===multiplier)).map(multiplier=>t(multiplier===1?'Single':multiplier===2?'Double':'Triple'));
  result.target=t('{number}: need {fields}',{number:game.round,fields:missing.join(' + ')});
  result.detail=t('Only {number} scores this round. Single + Double + Triple on it in the same turn wins immediately.',{number:game.round});
 }else if(game.mode==='halve'){
  const current=target(game);
  result.target=current==='Double'?t('Any double'):current==='Triple'?t('Any triple'):current==='Bull'?'Bull':t('Hit {number}',{number:current});
  result.detail=current==='Double'?t('Any double, including Bullseye, adds points. Miss all three and your score is halved.'):current==='Triple'?t('Any triple adds points. Miss all three and your score is halved.'):current==='Bull'?t('Bull (25) and Bullseye (50) add points. Miss both with all three darts and your score is halved.'):t('Only hits on {number} add points. Miss it with all three darts and your score is halved.',{number:current});
 }else if(game.mode==='countup'){
  result.target=t('Score as much as possible');
  result.detail=t('Every field counts. This is turn {round} of 8; enter a 0–180 turn total or record exact darts.',{round:game.round});
 }else if(game.mode==='baseball'){
  result.target=t('Inning {number} · aim for {number}',{number:game.round});
  result.detail=t('Only {number} scores this inning: single = 1 run, double = 2, triple = 3. Other numbers score 0.',{number:game.round});
 }else if(game.mode==='killer'){
  if(!player.killer){result.target=t('Activate on D{number}',{number:player.target});result.detail=t('Hit your own double D{number} to become a killer. You can take opponents’ lives only after activating.',{number:player.target});}
  else{
   const opponents=game.players.filter((other,index)=>index!==game.active&&other.lives>0).map(other=>`D${other.target} (${other.name})`).join(', ');
   result.target=t('Opponents’ doubles');
   result.detail=t('Hit an opponent’s double to take one life: {targets}. Singles and triples do not count.',{targets:opponents});
  }
 }else if(game.mode==='elimination'){
  result.target=t('{points} points to 301',{points:301-player.score});
  result.detail=t('Reach exactly 301. Matching an opponent’s score resets them to 0; going over 301 cancels the whole turn.');
 }else if(game.mode==='golf'){
  result.target=t('Hole {number} · aim for D{number}',{number:game.round});
  result.detail=game.darts.length?t('Your last dart gives {result}. End turn to keep it, or throw again to replace it.',{result:strokeResult(golfStrokes(game.darts.at(-1),game.round))}):t('D{number} = 1 stroke, T{number} = 2, single {number} = 3, any other field = 5. Your last dart decides; you may end early.',{number:game.round});
 }
 return result;
}
