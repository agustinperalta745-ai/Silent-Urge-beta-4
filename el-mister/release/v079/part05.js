/* v0.7.9 hotfix · fin de temporada -> mercado */
function v079MarketShellInit(tr){
 S.v075SeasonTransition=tr||S.v075SeasonTransition||{};
 S.week=19;S.phase='marketDays';S.weekFlow=null;S.lastMatch=null;S.pendingJobOffer=null;view='market';
 if(!S.v075Market){
  S.v075Market={day:1,targets:[],pending:[],inbox:[],log:[],startBudget:S.budget??club(S.clubId).budget,startRoster:(S.roster||[]).map(p=>p.id),closed:false,nextId:1,v079Booted:false};
 }
 let m=S.v075Market;
 m.day=Math.max(1,Math.min(7,Number(m.day)||1));m.targets??=[];m.pending??=[];m.inbox??=[];m.log??=[];m.nextId??=1;m.closed=!!m.closed;
 return m
}
function v079RenderMarketNow(){
 view='market';save();
 try{root().innerHTML=`<div class="app">${v075RenderMarketDays()}</div>`}
 catch(err){console.error('v079 market render fallback',err);render()}
}
v078EnterMarket=function(tr){
 closeModal();let m=v079MarketShellInit(tr);save();
 try{if(!m.targets.length)v075RefreshTargets(true)}catch(err){console.error('v079 target refresh',err)}
 try{if(!m.v079Booted){m.v079Booted=true;v075ProcessDay()}}catch(err){console.error('v079 first market day',err)}
 v079RenderMarketNow()
};
function v079OpenMarket(){
 if(S?.phase!=='marketDays')return;
 v079MarketShellInit(S.v075SeasonTransition);v079RenderMarketNow()
}
const _v079NextActionBase=nextAction;
nextAction=function(){
 if(S?.phase==='marketDays'){
  let m=v079MarketShellInit(S.v075SeasonTransition);
  return{e:'MERCADO DE PASES',t:`Día ${m.day} de 7`,d:'El mercado está abierto. Podés negociar y seguir usando el resto del club.',b:'Entrar al mercado',a:'v079OpenMarket()'}
 }
 return _v079NextActionBase()
};
