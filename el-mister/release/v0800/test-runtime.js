global.document={createElement:()=>({textContent:''}),head:{appendChild:()=>{}},getElementById:()=>null,querySelector:()=>null};
global.window={devicePixelRatio:1};
global.performance={now:(()=>{let t=0;return()=>t+=100})()};
global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};
global.setTimeout=()=>0;global.clearTimeout=()=>{};
function ri(a,b){return Math.floor((a+b)/2)}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
const formation=[
{x:50,y:91,pos:'ARQ'},{x:20,y:75,pos:'LI'},{x:40,y:78,pos:'DFC'},{x:60,y:78,pos:'DFC'},{x:80,y:75,pos:'LD'},
{x:42,y:60,pos:'MCD'},{x:58,y:60,pos:'MC'},{x:18,y:42,pos:'EI'},{x:50,y:42,pos:'MCO'},{x:82,y:42,pos:'ED'},{x:50,y:20,pos:'DC'}];
function v0712BaseSlots(){return formation.map(x=>({...x}))}function v0712MirrorSlots(){return formation.map(x=>({x:100-x.x,y:100-x.y,pos:x.pos}))}
const userPlayers=formation.map((q,i)=>({id:'p'+i,name:'Jugador '+i,pos:q.pos,ovr:72+i%4,skills:{passing:70+i%5,finishing:68+i%6,technique:70,pace:72,defense:68},fitness:100,stats:{}}));
function v0712Lineup(){return userPlayers}function bestXI(){return userPlayers}function playerCareerMetrics(p){return{decision:p.ovr,composure:p.ovr,physical:p.ovr}}
function club(id){return{id,name:id==='me'?'Mi Club':'Rival',r:id==='me'?74:72}}
function squadNumber(p){return Number(p.id.slice(1))+1}
function teamGoal(teamId,m,src){if(teamId===S.live.home)S.live.gh++;else S.live.ga++;S.live.events.push({m,type:'goal',teamId,txt:'goal'})}
function scoreForUser(l){return l.home==='me'?l.gh:l.ga}function scoreAgainst(l){return l.home==='me'?l.ga:l.gh}
function v061DrainEnergy(){}function back79(){return null}function start79(){}function seq79(){return {kind:'seq79',t:'situacion',o:[{t:'x'}]}}
function v067OffensiveScenario(){return {kind:'keyplay',t:'ataque',o:[{t:'x'}]}}
function makeMatchScenario(){return {kind:'tactical',t:'base',o:[{t:'x'}]}}function renderLiveDecision(){}function render(){}function v063RenderHalftime(){}function finishRegulation(){}function closeModal(){}function v06OpenSubs(){}function save(){}function v063ResumeSecondHalf(){}let v061ResumeSecondHalf;
let v0712StopVisual=()=>{},v0712PitchHtml=()=>'',v0712RenderVisual=()=>{},v06RenderMatchHub=()=>{},runNextStop=()=>{},v063AdvanceUntilDecision=()=>{},v0712ManualSubs=()=>{};
let S={clubId:'me',tactic:'Equilibrado',live:{mode:'league',home:'me',away:'opp',opponent:'opp',isHome:true,gh:0,ga:0,minute:0,stopIndex:0,pauseCount:0,userAttack:0,userDefense:0,fatigue:0,events:[],decisions:[],flow:{userThreat:0,oppThreat:0},context:{},lineupIds:userPlayers.map(p=>p.id)}};
const fs=require('fs'),path=require('path');
const engine=fs.readFileSync(path.join(__dirname,'match-engine.js'),'utf8');
const checks=`
let l=S.live,s=em80State(l);em80RefreshRoster(l);
if(s.us.filter(p=>p.active!==false).length!==11||s.them.filter(p=>p.active!==false).length!==11)throw Error('player init');
for(let k=0;k<3000;k++){em80MovePlayers(.05,l);em80FinishFlight(performance.now(),l);em80BallControl(l);em80SyncOwnedBall(l);em80CarrierThink(l);for(let team of ['us','them'])for(let p of em80Players(team,l)){if(p.active===false)continue;if(!(p.x>=2.5&&p.x<=EM80_W-2.5&&p.y>=2&&p.y<=98))throw Error('out of bounds')}}
if(s.shots.us+s.shots.them<2)throw Error('no shots generated');if(s.passes.us+s.passes.them<10)throw Error('no passing sequences');
let pauses=[];for(let m=1;m<90;m++){l.minute=m;if(em80ShouldPause(l))pauses.push(m)}if(pauses.length<s.decision.min)throw Error('not enough interventions');
console.log('runtime OK',JSON.stringify({shots:s.shots,passes:s.passes,score:[l.gh,l.ga],pauses}));`;
eval(engine+'\n'+checks);
