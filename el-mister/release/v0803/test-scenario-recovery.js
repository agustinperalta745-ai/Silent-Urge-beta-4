const fs=require('fs'),path=require('path');
global.window={};global.document={getElementById:()=>({querySelector:()=>({})})};global.setTimeout=(f)=>0;
let saved=0,rendered=0,stopped=0;
function save(){saved++} function render(){return null} function renderLiveDecision(){rendered++;return true} function em80Stop(){stopped++}
function scoreForUser(l){return l.gh} function scoreAgainst(l){return l.ga}
function v06LiveLineup(){return [{id:'p1',name:'Pérez',fitness:72,pos:'LD'},{id:'p2',name:'Gómez',fitness:75,pos:'DC'}]}
function v061EnergyOf(p){return p.fitness}
function em80State(l){return l.v0800}
function em80Zone(team,y){let p=team==='us'?100-y:y;return p<35?'Salida':p<70?'Progresión':'Último tercio'}
function em80Side(x){return x<24?'izquierda':x>44?'derecha':'centro'}
function em80PauseForDecision(){}
const frame=()=>1,pass=()=>2,anchor=()=>3;let em80Frame=frame,em80Pass=pass,em80Anchor=anchor;
let legacyCalls=0;
function makeMatchScenario(){legacyCalls++;throw Error('simulated broken current builder')}
function _79sc(){return {key:'legacy_context',kind:'tactical',t:'El extremo rival recibe siempre con ventaja',d:'La banda necesita una corrección.',o:[{t:'Doblar la marca',h:'Ayuda defensiva',e:{def:.01}},{t:'Cerrar por dentro',h:'Protegés el carril interior',e:{def:.008}}]}}
let S={live:{minute:27,gh:0,ga:0,isHome:true,stopIndex:0,flow:{userThreat:.1,oppThreat:.2,userCards:[]},context:{},v0800:{ball:{ownerTeam:'us',lastTeam:'us',x:34,y:55}}}};
let src=fs.readFileSync(path.join(__dirname,'scenario-recovery.js'),'utf8');eval(src);
em80PauseForDecision(S.live);
if(!S.live.scenario)throw Error('scenario missing');
if(S.live.scenario.t==='El partido está en una zona de decisiones')throw Error('generic fallback leaked');
if(S.live.scenario.t!=='El extremo rival recibe siempre con ventaja')throw Error('legacy contextual scenario not recovered: '+S.live.scenario.t);
if(rendered<1)throw Error('decision not rendered');
if(em80Frame!==frame||em80Pass!==pass||em80Anchor!==anchor)throw Error('2D animation function changed');
// Force every legacy builder to fail. Recovery pool must still be contextual and varied.
makeMatchScenario=()=>null;_79sc=()=>null;S.live.scenario=null;S.live.context.fullbacksHigh=true;S.live.flow.oppThreat=2;S.live.flow.userThreat=.1;S.live.v0800.ball={ownerTeam:'them',lastTeam:'them',x:54,y:55};
em80PauseForDecision(S.live);
if(!S.live.scenario||/zona de decisiones|partido pide una reacción|administrar la ventaja/i.test(S.live.scenario.t))throw Error('pool fell back to generic');
let first=S.live.scenario.t;S.live.scenario=null;em80PauseForDecision(S.live);let second=S.live.scenario?.t;
if(!second)throw Error('second contextual scenario missing');
if(first===second&&S.live.em803ScenarioHistory.length<2)throw Error('history not recorded');
console.log('v0.8.3 scenario recovery OK',JSON.stringify({first,second,legacyCalls,rendered,stopped}));
