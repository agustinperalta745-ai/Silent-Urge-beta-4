const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.performance={now:()=>1000};global.document={getElementById:()=>null};
global.EM80_W=68;global.EM80_GOAL_HALF=11.5;global.EM80={raf:0,minuteTimer:0,running:true,token:1};
global.S={clubId:'usClub',roster:[{id:'u5',name:'Mateo Medio',pos:'MC'},{id:'u9',name:'Nico Nueve',pos:'DC'}],live:null};
function makePlayers(team){return [
 {team,idx:0,id:team+'0',name:team+' GK',pos:'ARQ',x:34,y:team==='us'?95:5,tx:34,ty:50,active:true},
 {team,idx:1,id:team+'1',name:team+' DFC',pos:'DFC',x:30,y:team==='us'?75:25,tx:30,ty:50,active:true},
 {team,idx:2,id:team+'2',name:team+' LI',pos:'LI',x:10,y:team==='us'?70:30,tx:10,ty:50,active:true},
 {team,idx:3,id:team+'3',name:team+' LD',pos:'LD',x:58,y:team==='us'?70:30,tx:58,ty:50,active:true},
 {team,idx:4,id:team+'4',name:team+' MCD',pos:'MCD',x:34,y:team==='us'?60:40,tx:34,ty:50,active:true},
 {team,idx:5,id:team==='us'?'u5':team+'5',name:team==='us'?'Mateo Medio':team+' MC',pos:'MC',x:34,y:50,tx:34,ty:50,active:true},
 {team,idx:6,id:team+'6',name:team+' MCO',pos:'MCO',x:34,y:team==='us'?42:58,tx:34,ty:50,active:true},
 {team,idx:7,id:team+'7',name:team+' EI',pos:'EI',x:10,y:team==='us'?35:65,tx:10,ty:50,active:true},
 {team,idx:8,id:team+'8',name:team+' ED',pos:'ED',x:58,y:team==='us'?35:65,tx:58,ty:50,active:true},
 {team,idx:9,id:team==='us'?'u9':team+'9',name:team==='us'?'Nico Nueve':team+' DC',pos:'DC',x:34,y:team==='us'?25:75,tx:34,ty:50,active:true},
 {team,idx:10,id:team+'10',name:team+' MC2',pos:'MC',x:40,y:50,tx:40,ty:50,active:true}
]}
function live(poss='us',x=34,y=50){let us=makePlayers('us'),them=makePlayers('them');return {minute:30,gh:0,ga:0,flow:{userCards:[],oppCards:[]},stopIndex:0,context:{},v0800:{us,them,ball:{x,y,ownerTeam:poss,ownerIdx:5,lastTeam:poss,flight:null},restartUntil:0},decisions:[],events:[]}}
global.em80State=l=>l.v0800;global.em80Players=(t,l=S.live)=>l.v0800[t];global.em80P=(t,i,l=S.live)=>l.v0800[t][i];global.em80Dir=t=>t==='us'?-1:1;global.em80Opp=t=>t==='us'?'them':'us';global.em80Draw=()=>{};global.em80Stop=()=>{EM80.running=false};global.em80Comment=(txt,l)=>{l.lastComment=txt};
global.em80ShouldPause=()=>true;global.em80Restart=(team,type,l)=>{l.baseRestart={team,type}; l.v0800.ball={x:34,y:type==='goalKick'?(team==='us'?95:5):50,ownerTeam:team,ownerIdx:0,lastTeam:team,flight:null}};
global.em80FinishFlight=()=>{throw new Error('base finish should not be needed in out tests')};global.renderLiveDecision=()=>{global.rendered=true};global.save=()=>{};global.start79=k=>{S.live.chain={type:k}};global.go79=k=>{S.live.lastGo=k};global.mini79done=()=>{};global.visibleTiredPlayer=()=>null;global.playerCareerMetrics=()=>({physical:80});global.p79=(roles)=>{let a=S.live.v0800.us;return a.find(p=>roles.includes(p.pos))||a[0]};
vm.runInThisContext(fs.readFileSync('el-mister/release/v0806/zone-logic.js','utf8'));
function sc(poss,x,y){S.live=live(poss,x,y);return window.em806BuildScenario(0,S.live)}
let a=sc('us',34,80);assert.equal(a.key,'em806_build');assert(!JSON.stringify(a.o).toLowerCase().includes('rematar'));
a=sc('us',34,50);assert.equal(a.key,'em806_mid');assert(!JSON.stringify(a.o).toLowerCase().includes('rematar'));
a=sc('us',34,25);assert.equal(a.key,'em806_edge');assert(JSON.stringify(a).toLowerCase().includes('remate'));
a=sc('them',34,80);assert.equal(a.key,'em806_defend');
a=sc('them',34,20);assert.equal(a.key,'em806_press_build');assert(!JSON.stringify(a.o).toLowerCase().includes('rematar'));
S.live=live('us',34,50);S.live.v0800.ball.flight={};assert.equal(em80ShouldPause(S.live),false);S.live.v0800.ball.flight=null;assert.equal(em80ShouldPause(S.live),true);
S.live=live('us',34,50);go79('inside');assert.equal(S.live.v0800.ball.ownerTeam,'us');assert(S.live.v0800.ball.y<34);assert.equal(S.live.lastGo,'inside');
S.live=live('us',34,20);S.live.v0800.ball.ownerTeam=null;S.live.v0800.ball.flight={kind:'shot',team:'us',from:{x:34,y:20},to:{x:51,y:1},started:0,duration:500,outcome:'wide'};em80FinishFlight(1000,S.live);assert.deepEqual(S.live.baseRestart,{team:'them',type:'goalKick'});
S.live=live('us',34,20);S.live.v0800.ball.ownerTeam=null;S.live.v0800.ball.flight={kind:'deflect',team:'us',lastTouchTeam:'them',from:{x:34,y:20},to:{x:55,y:1},started:0,duration:500,outcome:'out'};em80FinishFlight(1000,S.live);assert.equal(S.live.v0800.lastRestart.type,'corner');assert.equal(S.live.v0800.lastRestart.team,'us');assert.equal(S.live.em806PendingSetPiece.type,'corner');
S.live=live('us',34,50);S.live.v0800.ball.ownerTeam=null;S.live.v0800.ball.flight={kind:'pass',team:'us',from:{x:34,y:50},to:{x:0,y:52},started:0,duration:500,outcome:'out'};em80FinishFlight(1000,S.live);assert.equal(S.live.v0800.lastRestart.type,'throwIn');assert.equal(S.live.v0800.lastRestart.team,'them');
console.log('v0.8.6 zone-driven decisions + restart logic: OK');
