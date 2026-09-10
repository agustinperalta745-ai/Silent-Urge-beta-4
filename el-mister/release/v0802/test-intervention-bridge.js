const fs=require('fs');
let timers=[];
const modalRoot={innerHTML:'',querySelector(sel){if(sel==='.em802Decision')return this.innerHTML.includes('em802Decision')?{}:null;if(sel==='.choice')return this.innerHTML.includes('class="choice')?{}:null;return null}};
global.document={getElementById:id=>id==='modalRoot'?modalRoot:null};
global.setTimeout=(fn)=>{timers.push(fn);return timers.length};global.clearTimeout=()=>{};global.cancelAnimationFrame=()=>{};
let stopped=0,saved=0;
global.S={live:{minute:17,stopIndex:0,gh:0,ga:0,home:'me',away:'opp',opponent:'opp',subsUsed:0,subWindows:0,scenario:null}};
global.club=id=>({name:id==='me'?'Deportivo Costero':'Rincón Unido'});global.save=()=>saved++;global.em80Stop=()=>stopped++;global.em80DrawDecision=()=>{};global.em80DecisionPitchHtml=()=>'<div class="pitch"></div>';global.liveContextHtml=()=>'<div class="ctx"></div>';global.v062OpenSubsFromDecision=()=>{};global.v06RenderMatchHub=()=>{};global.render=()=>{};global.resolveMatchChoice=()=>{};
global.makeMatchScenario=()=>({kind:'seq79',stage:1,t:'Te presionan la salida',d:'El rival salta arriba.',o:[{t:'Salir corto',h:'Buscá al hombre libre',mini:'playout'}]});global.scoreForUser=()=>0;global.scoreAgainst=()=>0;global.EM80={running:true,raf:1,minuteTimer:2};
function em80Frame(){} function em80Pass(){} function em80Anchor(){}
global.em80Frame=em80Frame;global.em80Pass=em80Pass;global.em80Anchor=em80Anchor;const a=em80Frame,b=em80Pass,c=em80Anchor;
global.renderLiveDecision=()=>{};global.em80PauseForDecision=()=>{};global.em80EmergencyDecision=()=>{};
eval(fs.readFileSync(__dirname+'/intervention-bridge.js','utf8'));
em80PauseForDecision(S.live);
if(!S.live.scenario)throw Error('scenario not created');if(!modalRoot.innerHTML.includes('INTERVENCIÓN DEL DT'))throw Error('decision not visible');if(!modalRoot.innerHTML.includes('Te presionan la salida'))throw Error('context scenario lost');if(!modalRoot.innerHTML.includes('Salir corto'))throw Error('single-option sequence not rendered');if(em80Frame!==a||em80Pass!==b||em80Anchor!==c)throw Error('animation/engine function was modified');
const same=S.live.scenario;modalRoot.innerHTML='';for(const fn of timers.splice(0))fn();if(S.live.scenario!==same)throw Error('watchdog replaced scenario');if(!modalRoot.innerHTML.includes('Te presionan la salida'))throw Error('watchdog did not redraw');
console.log('v0.8.2 bridge OK',JSON.stringify({stopped,saved,title:S.live.scenario.t,animationUntouched:true}));
