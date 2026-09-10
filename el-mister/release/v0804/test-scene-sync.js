const fs=require('fs'),vm=require('vm');
global.window=global;global.performance={now:()=>1000};global.document={getElementById:()=>null};global.requestAnimationFrame=()=>0;global.setTimeout=()=>0;
global.EM80={running:false};global.EM80_W=68;global.EM80_H=100;
global.S={clubId:'usclub',roster:[],live:{minute:64,scenario:{kind:'keyplay',key:'v067_longshot',playerId:'u8',t:'Gael Paz recibe con espacio a 28 metros',d:"64' · El rival retrocede y nadie salta a taparlo.",o:[{t:'Pegarle de lejos'}]},events:[],flow:{userThreat:1,oppThreat:.2},context:{},home:'usclub',away:'themclub',opponent:'themclub',gh:3,ga:0}};
function mk(team){let pos=['ARQ','LI','DFC','DFC','LD','MCD','MC','MCO','EI','ED','DC'];return pos.map((p,i)=>({team,idx:i,id:(team==='us'?'u':'t')+i,pos:p,x:34,y:team==='us'?85:15,tx:34,ty:50,vx:2,vy:2,active:true}))}
S.roster=mk('us').map(p=>({id:p.id,name:p.id,pos:p.pos}));S.live.v0800={us:mk('us'),them:mk('them'),ball:{x:34,y:85,ownerTeam:'us',ownerIdx:5,lastTeam:'us',flight:null},shots:{us:1,them:1},possessionTicks:{us:1,them:1}};
global.em80State=l=>l.v0800;global.em80Players=(team,l=S.live)=>team==='us'?l.v0800.us:l.v0800.them;global.em80Dir=t=>t==='us'?-1:1;global.em80BaseSlots=t=>em80Players(t).map((p,i)=>({idx:i,x:6+(i%5)*14,y:p.y,pos:p.pos}));global.em80BallOwner=l=>{let b=l.v0800.ball;return b.ownerTeam?em80Players(b.ownerTeam,l)[b.ownerIdx]:null};global.em80UserLineup=()=>S.roster;global.save=()=>{};global.club=id=>({name:id});global.squadNumber=()=>1;global.em80PossessionPct=()=>50;global.em80Draw=()=>{};global.em80DrawDecision=()=>true;global.em80Stop=()=>{};global.em801Kickoff=()=>{};global.em80Restart=()=>{};global.runNextStop=()=>{global.baseRuns=(global.baseRuns||0)+1};global.teamGoal=(team,m,source)=>{S.live.events.push({m,type:'goal',teamId:team,playerId:'random',txt:'old'});S.live.gh++};
vm.runInThisContext(fs.readFileSync('el-mister/release/v0804/scene-sync.js','utf8'));
if(em804SceneType(S.live.scenario)!=='longshot')throw Error('longshot not classified');
em804StageScenario(S.live.scenario,S.live);
let a=S.live.v0800.us.find(p=>p.id==='u8');
if(Math.abs(a.y-27)>.01)throw Error('actor not at 28m scene: '+a.y);
if(S.live.v0800.ball.ownerIdx!==a.idx||Math.abs(S.live.v0800.ball.y-(27-.65))>.01)throw Error('ball not with actor');
S.live.em804SceneStamp=null;S.live.scenario={kind:'keyplay',key:'penalty',playerId:'u10',t:'¡Penal para tu equipo!',d:'',o:[{t:'Izquierda'}]};em804StageScenario(S.live.scenario,S.live);let p=S.live.v0800.us[10];if(Math.abs(p.y-12.2)>.01)throw Error('penalty actor misplaced');
S.live.em804SceneStamp=null;S.live.scenario={kind:'keyplay',key:'v067_longshot',playerId:'u8',t:'Gael Paz recibe con espacio a 28 metros',d:'',o:[{t:'Pegarle de lejos'}]};em804StageScenario(S.live.scenario,S.live);teamGoal('usclub',64,'golazo');if(!S.live.em804PendingGoal)throw Error('goal replay not queued');if(S.live.em804PendingGoal.playerId!=='u8')throw Error('wrong visual scorer');let ev=S.live.events.at(-1);if(ev.playerId!=='u8')throw Error('goal event scorer not synchronized');
console.log('v0.8.4 scene/goal bridge tests OK');
