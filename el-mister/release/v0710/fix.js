/* ===== El Míster v0.7.10 · hotfix real cierre de temporada ===== */
function v0710RankedDivision(d){
 if(S.league?.div===d)return sortedTable().map(x=>x.id);
 return CLUBS.filter(c=>(S.worldDivs?.[c.id]||c.div)===d).sort((a,b)=>(b.r||0)-(a.r||0)).map(c=>c.id)
}
v078RankedDivision=v0710RankedDivision;

function v0710EnterMarketFromSeasonEnd(tr){
 closeModal();
 S.v078Playoff=null;
 S.v075SeasonTransition=tr||S.v075SeasonTransition||{};
 S.week=19;S.phase='marketDays';S.weekFlow=null;S.lastMatch=null;S.pendingJobOffer=null;view='market';
 if(!S.v075Market){S.v075Market={day:1,targets:[],pending:[],inbox:[],log:[],startBudget:S.budget??club(S.clubId).budget,startRoster:(S.roster||[]).map(p=>p.id),closed:false,nextId:1,v079Booted:false}}
 save();
 try{if(!S.v075Market.targets.length)v075RefreshTargets(true)}catch(e){console.error('v0710 market targets',e)}
 try{if(!S.v075Market.v079Booted){S.v075Market.v079Booted=true;v075ProcessDay()}}catch(e){console.error('v0710 market day',e)}
 save();render()
}
v078AfterPromotion=function(){v0710EnterMarketFromSeasonEnd(S.v075SeasonTransition)};

const _v0710RenderPost=renderPost;
renderPost=function(){
 if(S?.lastMatch?.mode!=='promotion')return _v0710RenderPost();
 let promoted=S.v075SeasonTransition?.promo,releg=S.v075SeasonTransition?.releg;
 openModal(`<div class="eyebrow">PROMOCIÓN RESUELTA</div><h2>${promoted?'¡Ascenso!':releg?'Descenso':'Categoría asegurada'}</h2><p>${promoted?`Ganaste el partido más importante del año y además recibís ${money(V078_PRIZES.promotionPlayoff)} por el ascenso.`:releg?'La derrota te manda a la categoría inferior.':'La Promoción terminó y tu equipo permanece en la división.'}</p><button class="primary" onclick="v0710EnterMarketFromSeasonEnd(S.v075SeasonTransition)">Ir al mercado</button>`)
};
