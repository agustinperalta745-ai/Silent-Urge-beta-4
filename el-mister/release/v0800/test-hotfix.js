global.document={createElement:()=>({textContent:''}),head:{appendChild:()=>{}},getElementById:()=>null,querySelector:()=>null};
global.window={devicePixelRatio:1};
global.performance={now:(()=>{let t=0;return()=>t+=100})()};
global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};global.setTimeout=()=>0;global.clearTimeout=()=>{};
function ri(a,b){return Math.floor((a+b)/2)}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
const formation=[{x:50,y:91,pos:'ARQ'},{x:20,y:75,pos:'LI'},{x:40,y:78,pos:'DFC'},{x:60,y:78,pos:'DFC'},{x:80,y:75,pos:'LD'},{x:42,y:60,pos:'MCD'},{x:58,y:60,pos:'MC'},{x:18,y:42,pos:'EI'},{x:50,y:42,pos:'MCO'},{x:82,y:42,pos:'ED'},{x:50,y:20,pos:'DC'}];
function v0712BaseSlots(){return formation.map(x=>({...x}))}function v0712MirrorSlots(){return formation.map(x=>({x:100-x.x,y:100-x.y,pos:x.pos}))}
const userPlayers=formation.map((q,i)=>({id:'p'+i,name:'Jugador '+i,pos:q.pos,ovr:72+i%4,skills:{passing:72,finishing:72,technique:72,pace:72,defense:70},fitness:100,stats:{}}));
function v0712Lineup(){return userPlayers}function bestXI(){return userPlayers}function playerCareerMetrics(p){return{decision:p.ovr,composure:p.ovr,physical:p.ovr}}
function club(id){return{id,name:id==='me'?'Mi Club':'Rival',r:id==='me'?74:72}}function squadNumber(p){return Number(p.id.slice(1))+1}
function teamGoal(teamId,m,src){if(teamId===S.live.home)S.live.gh++;else S.live.ga++;S.live.events.push({m,type:'goal',teamId,txt:'goal'})}
function scoreForUser(l){return l.home==='me'?l.gh:l.ga}function scoreAgainst(l){return l.home==='me'?l.ga:l.gh}
function v061DrainEnergy(){}function back79(){return null}function start79(){}function seq79(){return {kind:'seq79',t:'Situación vieja',d:'Contexto',o:[{t:'Opción A',h:'A'},{t:'Opción B',h:'B'}]}}
function v067OffensiveScenario(){return {kind:'keyplay',t:'Ataque',d:'Contexto',o:[{t:'Rematar',h:'A'},{t:'Seguir',h:'B'}]}}
function makeMatchScenario(){return {kind:'tactical',t:'Lectura vieja',d:'Contexto',o:[{t:'Cerrar espacios',h:'A'},{t:'Atacar por bandas',h:'B'},{t:'Jugar directo',h:'C'}]}}
function renderLiveDecision(){}function resolveMatchChoice(i){S.live.stopIndex++;S.live.scenario=null}function render(){}function v063RenderHalftime(){}function finishRegulation(){}function closeModal(){}function v06OpenSubs(){}function save(){}function v063ResumeSecondHalf(){}let v061ResumeSecondHalf;
let v0712StopVisual=()=>{},v0712PitchHtml=()=>'',v0712RenderVisual=()=>{},v06RenderMatchHub=()=>{},runNextStop=()=>{},v063AdvanceUntilDecision=()=>{},v0712ManualSubs=()=>{};
let legacyPauseCalls=0;function v0714ShouldPause(){legacyPauseCalls++;return true}
let S={clubId:'me',tactic:'Equilibrado',live:{mode:'league',home:'me',away:'opp',opponent:'opp',isHome:true,gh:0,ga:0,minute:30,stopIndex:0,pauseCount:0,userAttack:0,userDefense:0,fatigue:0,events:[],decisions:[],flow:{userThreat:0,oppThreat:0},context:{},lineupIds:userPlayers.map(p=>p.id)}};
const fs=require('fs'),path=require('path'),engine=fs.readFileSync(path.join(__dirname,'match-engine.js'),'utf8'),hotfix=fs.readFileSync(path.join(__dirname,'match-engine-hotfix.js'),'utf8');
const checks=`
let l=S.live,s=em80State(l);em80RefreshRoster(l);
let cb=s.us.find(p=>p.pos==='DFC'),rawCB=_em801AnchorBase('us',cb,l);em801SetTactic(l,{compactCB:true,lowBlock:true,pressHigh:false},'Bloque compacto',18);let tight=em80Anchor('us',cb,l);if(Math.abs(tight.x-EM80_W/2)>=Math.abs(rawCB.x-EM80_W/2))throw Error('centrales no se cierran visualmente');if(tight.y<=rawCB.y)throw Error('bloque bajo no retrocede');
let fb=s.us.find(p=>p.pos==='LI');em801SetTactic(l,{compactCB:false,lowBlock:false,pressHigh:false,fullbacksHigh:true,wide:true},'Laterales altos',18);s.ball.ownerTeam='us';s.ball.ownerIdx=5;s.ball.lastTeam='us';let rawFB=_em801AnchorBase('us',fb,l),highFB=em80Anchor('us',fb,l);if(highFB.y>=rawFB.y)throw Error('lateral no sube');
em801SetTactic(l,{fullbacksHigh:false,wide:false,pressHigh:true,lowBlock:false},'Presión alta',18);s.ball.ownerTeam='them';s.ball.ownerIdx=5;s.ball.lastTeam='them';let dc=s.us.find(p=>p.pos==='DC'),rawPress=_em801AnchorBase('us',dc,l),pressed=em80Anchor('us',dc,l);if(pressed.y>=rawPress.y)throw Error('presion alta no adelanta');
let fallback=em801FallbackScenario(l);if(!em801ValidScenario(fallback)||fallback.o.length<3)throw Error('fallback contextual invalido');
if(!em80ShouldPause(l)||legacyPauseCalls!==1)throw Error('no delega pausas al sistema anterior');
em801Kickoff('them',l,'Segundo tiempo');if(Math.abs(s.ball.x-EM80_W/2)>.01||Math.abs(s.ball.y-50)>.01||s.ball.ownerTeam!=='them')throw Error('saque de medio incorrecto');
let before=s.em801PassChain.count,carrier=em80P('them',s.ball.ownerIdx,l),target=em80Players('them',l).find(p=>p.active!==false&&p.idx!==carrier.idx&&p.pos!=='ARQ');em80Pass('them',carrier,target,l,'pass');if(s.em801PassChain.count<=before)throw Error('cadena de pases no registrada');
console.log('hotfix OK',JSON.stringify({compactCB:tight.x,lowBlock:tight.y,fullbackY:highFB.y,pressY:pressed.y,kickoff:[s.ball.x,s.ball.y],legacyPauseCalls}));`;
eval(engine+'\n'+hotfix+'\n'+checks);
