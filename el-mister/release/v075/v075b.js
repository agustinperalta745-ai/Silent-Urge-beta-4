/* ===== El Míster v0.7.5 · progreso visible + mercado de 7 días al final de temporada ===== */
const _v075RenderBase=render;
const _v075NextActionBase=nextAction;

function v075MarketState(){
 if(!S.v075Market){S.v075Market={day:1,targets:[],pending:[],inbox:[],log:[],startBudget:S.budget??club(S.clubId).budget,startRoster:(S.roster||[]).map(p=>p.id),closed:false,nextId:1};v075RefreshTargets(true)}
 return S.v075Market
}
function v075MarketPlayerClone(p,sourceClubId){let cp=JSON.parse(JSON.stringify(p));v06EnsurePlayer(cp);cp.sourceClubId=sourceClubId;cp.asking=+(Math.max(.05,(cp.value||.08)*(1.02+Math.random()*.28))).toFixed(2);return cp}
function v075RefreshTargets(force=false){
 let m=S.v075Market;if(!m)return;let current=new Set((S.roster||[]).map(p=>p.id)),busy=new Set((m.pending||[]).filter(x=>x.status==='pending').map(x=>x.player.id)),myDiv=S.worldDivs?.[S.clubId]||club(S.clubId).div;
 if(force)m.targets=[];let need=Math.max(0,14-(m.targets||[]).length);if(!need)return;
 let clubs=shuffle(CLUBS.filter(c=>c.id!==S.clubId&&Math.abs((S.worldDivs?.[c.id]||c.div)-myDiv)<=1));let add=[];
 for(let c of clubs){for(let p of makeRoster(c).sort((a,b)=>b.ovr-a.ovr).slice(0,4)){if(current.has(p.id)||busy.has(p.id)||m.targets.some(x=>x.id===p.id)||add.some(x=>x.id===p.id))continue;add.push(v075MarketPlayerClone(p,c.id));if(add.length>=need)break}if(add.length>=need)break}
 m.targets=(m.targets||[]).concat(add)
}
function v075MarketEvent(text,tone=''){let m=v075MarketState();m.log.unshift({day:m.day,text,tone});m.log=m.log.slice(0,30)}
function v075MarketId(prefix='m'){let m=v075MarketState();return `${prefix}${m.nextId++}`}
function v075MarketOpen(){return S?.phase==='marketDays'&&!v075MarketState().closed}
v06MarketOpen=function(){return v075MarketOpen()};

function v075OpenBid(id){
 let m=v075MarketState(),p=m.targets.find(x=>x.id===id);if(!p)return;if(!v075MarketOpen())return toast('El mercado está cerrado.');let ask=p.asking||p.value;
 openModal(`<div class="eyebrow">💼 DÍA ${m.day}/7 · OFERTA</div><h2>${p.name}</h2><p>${club(p.sourceClubId)?.name||'El club'} pide ${money(ask)}. La respuesta puede llegar mañana o dentro de dos días.</p>${[[.90,'Probar por debajo','Más riesgo de rechazo o contraoferta.'],[1,'Ofrecer lo pedido','Buena chance de aceptación.'],[1.08,'Acelerar el acuerdo','Más caro, respuesta generalmente favorable.']].map(([r,t,h])=>`<button class="choice" onclick="v075SendBid('${id}',${r})"><b>${t} · ${money(ask*r)}</b><span>${h}</span></button>`).join('')}<button class="secondary" onclick="closeModal()">Cancelar</button>`)
}
function v075SendBid(id,ratio){
 let m=v075MarketState(),p=m.targets.find(x=>x.id===id);if(!p)return;let amount=+((p.asking||p.value)*ratio).toFixed(2);if(S.budget<amount)return toast('No alcanza el presupuesto para esa oferta.');
 let responseDay=Math.min(7,m.day+ri(1,2)),q={id:v075MarketId('bid'),kind:'buy',player:JSON.parse(JSON.stringify(p)),amount,ratio,sentDay:m.day,responseDay,status:'pending'};m.pending.push(q);m.targets=m.targets.filter(x=>x.id!==id);v075MarketEvent(`Enviaste ${money(amount)} por ${p.name}. Respuesta estimada: día ${responseDay}.`);closeModal();save();render()
}
function v075ProcessBid(q){
 let m=v075MarketState(),p=q.player,roll=Math.random(),accept=q.ratio>=1.07?.92:q.ratio>=.99?.76:.36;
 if(roll<accept){q.status='answered';m.inbox.unshift({id:v075MarketId('in'),kind:'buyAccepted',player:p,amount:q.amount,from:p.sourceClubId,day:m.day});v075MarketEvent(`${club(p.sourceClubId)?.name||'El club'} aceptó tu oferta por ${p.name}.`,'good')}
 else if(roll<accept+.34){q.status='answered';let counter=+((p.asking||p.value)*(1.02+Math.random()*.12)).toFixed(2);m.inbox.unshift({id:v075MarketId('in'),kind:'buyCounter',player:p,amount:counter,from:p.sourceClubId,day:m.day});v075MarketEvent(`Contraoferta por ${p.name}: ${money(counter)}.`,'warn')}
 else{q.status='rejected';v075MarketEvent(`${club(p.sourceClubId)?.name||'El club'} rechazó la oferta por ${p.name}.`,'bad')}
}
function v075GenerateIncomingOffer(){
 let m=v075MarketState();if(Math.random()>.62||S.roster.length<=18)return;let pool=S.roster.filter(p=>!m.inbox.some(x=>x.player?.id===p.id&&x.kind==='saleOffer'));if(!pool.length)return;let p=pick(pool),buyers=CLUBS.filter(c=>c.id!==S.clubId),buyer=pick(buyers),amount=+((p.value||.08)*(.82+Math.random()*.48)).toFixed(2);m.inbox.unshift({id:v075MarketId('in'),kind:'saleOffer',player:{id:p.id,name:p.name,pos:p.pos,ovr:p.ovr,value:p.value},amount,from:buyer.id,day:m.day});v075MarketEvent(`${buyer.name} mandó una oferta por ${p.name}: ${money(amount)}.`,'warn')
}
function v075AskOffers(id){
 let m=v075MarketState(),p=S.roster.find(x=>x.id===id);if(!p||S.roster.length<=18)return toast('Necesitás conservar al menos 18 jugadores.');if(m.pending.some(x=>x.kind==='sellSearch'&&x.player.id===id&&x.status==='pending'))return toast('Ya estás buscando comprador para ese jugador.');let responseDay=Math.min(7,m.day+1),q={id:v075MarketId('sell'),kind:'sellSearch',player:{id:p.id,name:p.name,pos:p.pos,ovr:p.ovr,value:p.value},responseDay,status:'pending'};m.pending.push(q);v075MarketEvent(`Tus dirigentes buscan ofertas por ${p.name}.`);save();render()
}
function v075ProcessSellSearch(q){let m=v075MarketState(),p=S.roster.find(x=>x.id===q.player.id);q.status='answered';if(!p)return;let buyers=shuffle(CLUBS.filter(c=>c.id!==S.clubId)).slice(0,ri(1,2));for(let b of buyers){let amount=+((p.value||.08)*(.78+Math.random()*.45)).toFixed(2);m.inbox.unshift({id:v075MarketId('in'),kind:'saleOffer',player:{id:p.id,name:p.name,pos:p.pos,ovr:p.ovr,value:p.value},amount,from:b.id,day:m.day})}v075MarketEvent(`Llegaron propuestas por ${p.name}.`,'warn')}
function v075ProcessDay(){let m=v075MarketState();for(let q of m.pending.filter(x=>x.status==='pending'&&x.responseDay<=m.day)){if(q.kind==='buy')v075ProcessBid(q);else if(q.kind==='sellSearch')v075ProcessSellSearch(q)}v075GenerateIncomingOffer();if(Math.random()<.7)v075RefreshTargets(false)}

function v075AcceptInbox(id){
 let m=v075MarketState(),x=m.inbox.find(a=>a.id===id);if(!x)return;
 if(x.kind==='saleOffer'){
  if(S.roster.length<=18)return toast('No podés bajar de 18 jugadores.');let p=S.roster.find(p=>p.id===x.player.id);if(!p){m.inbox=m.inbox.filter(a=>a.id!==id);save();return render()}
  S.budget=+(S.budget+x.amount).toFixed(2);S.roster=S.roster.filter(p=>p.id!==x.player.id);S.lineupIds=(S.lineupIds||[]).filter(pid=>pid!==x.player.id);S.market??={history:[]};S.market.history??=[];S.market.history.push({season:S.season,week:19,type:'sell',player:p.name,amount:x.amount,clubId:x.from,marketDay:m.day});m.inbox=m.inbox.filter(a=>a.id!==id);v075MarketEvent(`${p.name} fue vendido a ${club(x.from)?.name||'otro club'} por ${money(x.amount)}.`,'good');ensureLineup();save();render();return
 }
 if(S.roster.length>=32)return toast('Plantel completo: máximo 32 jugadores.');if(S.budget<x.amount)return toast('Ya no alcanza el presupuesto para cerrar esta operación.');
 let cp=JSON.parse(JSON.stringify(x.player));delete cp.asking;delete cp.sourceClubId;normalizePlayer(cp);v06EnsurePlayer(cp);if(S.roster.some(p=>p.id===cp.id))return toast('Ese jugador ya está en tu plantel.');S.budget=+(S.budget-x.amount).toFixed(2);S.roster.push(cp);S.market??={history:[]};S.market.history??=[];S.market.history.push({season:S.season,week:19,type:'buy',player:cp.name,amount:x.amount,clubId:x.from,marketDay:m.day});m.inbox=m.inbox.filter(a=>a.id!==id);v075MarketEvent(`${cp.name} firmó por ${club(S.clubId).name} a cambio de ${money(x.amount)}.`,'good');ensureLineup();save();render()
}
function v075RejectInbox(id){let m=v075MarketState(),x=m.inbox.find(a=>a.id===id);if(!x)return;m.inbox=m.inbox.filter(a=>a.id!==id);v075MarketEvent(`${x.kind==='saleOffer'?'Rechazaste la oferta por '+x.player.name:'Descartaste la propuesta por '+x.player.name}.`);save();render()}

function v075AdvanceMarketDay(){let m=v075MarketState();if(m.day>=7)return v075CloseMarket();m.day++;v075ProcessDay();save();render();toast(`Día ${m.day}/7 del mercado.`)}
function v075CloseMarket(){let m=v075MarketState();for(let q of m.pending.filter(x=>x.status==='pending'))q.status='expired';m.closed=true;S.phase='marketSummary';save();render()}

function v075MarketInboxHtml(){let m=v075MarketState();if(!m.inbox.length)return '<div class="notice">No tenés propuestas pendientes. Simulá el día para recibir respuestas y ofertas.</div>';return m.inbox.map(x=>{let sale=x.kind==='saleOffer',clubName=club(x.from)?.name||'Otro club',label=sale?`Oferta por ${x.player.name}`:x.kind==='buyCounter'?`Contraoferta por ${x.player.name}`:`Oferta aceptada por ${x.player.name}`;return `<div class="marketPlayer"><div class="row between"><div><b>${label}</b><div class="muted small">${clubName} · Día ${x.day}</div></div><b>${money(x.amount)}</b></div><div class="row" style="margin-top:9px"><button class="secondary" onclick="v075AcceptInbox('${x.id}')">${sale?'Aceptar venta':'Cerrar fichaje'}</button><button class="ghost" onclick="v075RejectInbox('${x.id}')">Rechazar</button></div></div>`}).join('')}
function v075MarketTargetsHtml(){let m=v075MarketState(),pending=new Set(m.pending.filter(x=>x.status==='pending'&&x.kind==='buy').map(x=>x.player.id));let cards=m.targets.slice(0,14).map(p=>`<div class="marketPlayer"><div class="row between"><div><b>${p.name}</b><div class="muted small">${p.pos} · ${p.age} años · ${club(p.sourceClubId)?.name||''}</div></div><div style="text-align:right"><span class="ovr">${p.ovr}</span><div class="muted small">OVR · POT ${p.potential}</div></div></div><div class="row between" style="margin-top:8px"><b>${money(p.asking||p.value)}</b><button class="secondary" style="width:auto;padding:9px 12px" onclick="v075OpenBid('${p.id}')" ${pending.has(p.id)?'disabled':''}>Ofertar</button></div></div>`).join('');return cards||'<div class="notice">No quedan objetivos visibles. Al avanzar de día pueden aparecer nuevos.</div>'}
function v075MarketSalesHtml(){return [...S.roster].sort((a,b)=>a.ovr-b.ovr).map(p=>`<div class="sellRow"><div><b>${p.name}</b><div class="muted small">${p.pos} · ${p.ovr} OVR · valor ${money(p.value||.05)}</div></div><button class="ghost" onclick="v075AskOffers('${p.id}')" ${S.roster.length<=18?'disabled':''}>Buscar ofertas</button></div>`).join('')}
let v075MarketTab='inbox';
function v075RenderMarketDays(){
 let m=v075MarketState(),pending=m.pending.filter(x=>x.status==='pending').length,days=Array.from({length:7},(_,i)=>`<span class="dayDot ${i+1===m.day?'active':i+1<m.day?'done':''}">${i+1}</span>`).join(''),body=v075MarketTab==='targets'?v075MarketTargetsHtml():v075MarketTab==='sales'?v075MarketSalesHtml():v075MarketInboxHtml();
 return `${topShell()}<div class="content marketDaysPage"><div class="card hero"><div class="row between"><div><div class="eyebrow">MERCADO DE PASES · FIN DE TEMPORADA</div><h1 style="font-size:27px">Día ${m.day} de 7</h1></div><span class="pill good">${money(S.budget)}</span></div><div class="marketDays">${days}</div><p>Cada avance simula un día completo. Las negociaciones pueden responder más tarde y el día 7 es el cierre.</p></div><div class="grid3"><div class="metric"><small>Pendientes</small><b>${pending}</b></div><div class="metric"><small>Propuestas</small><b>${m.inbox.length}</b></div><div class="metric"><small>Plantel</small><b>${S.roster.length}</b></div></div><div class="subtabs scrollTabs" style="margin-top:14px">${[['inbox','📨 Propuestas'],['targets','🔎 Buscar'],['sales','⬆️ Salidas']].map(([id,l])=>`<button class="subtab ${v075MarketTab===id?'active':''}" onclick="v075MarketTab='${id}';render()">${l}</button>`).join('')}</div>${body}<div class="card"><button class="primary" onclick="v075AdvanceMarketDay()">${m.day<7?'Simular siguiente día →':'Cerrar mercado'}</button><div class="small muted center" style="margin-top:9px">${m.day<7?'Al avanzar pueden llegar respuestas, contraofertas y nuevas propuestas.':'No habrá nuevas operaciones después del cierre.'}</div></div>${m.log.length?`<div class="card"><div class="sectionTitle">Movimiento del mercado</div>${m.log.slice(0,8).map(x=>`<div class="msg"><b>Día ${x.day}</b><div class="msgBody">${x.text}</div></div>`).join('')}</div>`:''}</div>`
}

function v075TransferSummary(){let hist=(S.market?.history||[]).filter(h=>h.season===S.season&&h.week===19),buys=hist.filter(h=>h.type==='buy'),sales=hist.filter(h=>h.type==='sell'),spent=buys.reduce((a,h)=>a+h.amount,0),earned=sales.reduce((a,h)=>a+h.amount,0);return {buys,sales,spent,earned}}
function v075RenderMarketSummary(){let x=v075TransferSummary(),m=v075MarketState();return `${topShell()}<div class="content"><div class="card hero"><div class="eyebrow">MERCADO CERRADO</div><h1>Resumen de los 7 días</h1><p>Terminó la ventana. Ya no se pueden iniciar operaciones nuevas.</p></div><div class="grid2"><div class="metric"><small>Altas</small><b>${x.buys.length}</b></div><div class="metric"><small>Bajas</small><b>${x.sales.length}</b></div><div class="metric"><small>Gastado</small><b>${money(x.spent)}</b></div><div class="metric"><small>Ingresado</small><b>${money(x.earned)}</b></div></div><div class="card"><div class="sectionTitle">Altas</div>${x.buys.length?x.buys.map(h=>`<div class="sellRow"><b>⬇️ ${h.player}</b><span>${money(h.amount)}</span></div>`).join(''):'<div class="muted small">Sin incorporaciones.</div>'}<div class="sectionTitle" style="margin-top:15px">Bajas</div>${x.sales.length?x.sales.map(h=>`<div class="sellRow"><b>⬆️ ${h.player}</b><span>${money(h.amount)}</span></div>`).join(''):'<div class="muted small">Sin salidas.</div>'}</div><div class="card"><div class="row between"><div><b>Plantel final</b><div class="muted small">${S.roster.length} jugadores · presupuesto ${money(S.budget)}</div></div><span class="pill">Día 7/7</span></div><div style="height:12px"></div><button class="primary" onclick="v075StartNextSeason()">Comenzar próxima temporada</button></div></div>`}

function v075ApplySeasonDevelopment(){
 let season=S.season;
 for(let p of S.roster){
  v06EnsurePlayer(p);let before=p.ovr,age=p.age,room=Math.max(0,p.potential-p.ovr),apps=Math.max(0,(p.stats?.apps||0)-(p.v075SeasonAppsBase||0)),starts=Math.max(0,(p.stats?.starts||0)-(p.v075SeasonStartsBase||0)),rating=apps?((p.stats?.ratingSum||0)-(p.v075SeasonRatingBase||0))/apps:6.2,pro=(p.profile?.professionalism||65)/100,minutes=Math.min(1,(starts+Math.max(0,apps-starts)*.45)/15),form=clamp((rating-6.0)/1.4,0,1),gain=0;
  if(age<=21&&room>0){let score=.38+minutes*.52+form*.28+(pro-.5)*.30+(room>=8?.12:0);if(score>=.92)gain=2;else if(Math.random()<score)gain=1;if(gain>=1&&room>=7&&minutes>.72&&rating>=6.8&&Math.random()<.34)gain++;gain=Math.min(gain,3,room)}
  else if(age<=25&&room>0){let score=.22+minutes*.38+form*.22+(pro-.5)*.20;if(score>=.88)gain=2;else if(Math.random()<score)gain=1;gain=Math.min(gain,2,room)}
  else if(age<=29&&room>0){let score=.10+minutes*.20+form*.13;if(Math.random()<score)gain=1}
  else if(age>=32){let decline=age>=35?.48:age>=33?.30:.15;if(Math.random()<decline)gain=-1;if(age>=36&&Math.random()<.18)gain=-2}
  p.ovr=clamp(p.ovr+gain,40,p.potential||93);if(gain>0){let f=v065TrainingFocus?.(p)||p.trainingFocus||'auto',key=f==='setpieces'?'setPieces':f;if(p.skills?.[key]!=null)p.skills[key]=clamp(p.skills[key]+gain*(1.1+Math.random()*.8),20,97);p.devXP=Math.max(0,(p.devXP||0)-gain*32)}
  if(gain<0){p.profile.athleticism=clamp(p.profile.athleticism+gain*1.6,25,96);p.profile.recovery=clamp(p.profile.recovery+gain,25,96)}
  p.age++;p.developmentHistory??=[];p.developmentHistory.push({season,week:19,ovr:p.ovr,ovrDelta:p.ovr-before,focus:'fin de temporada',skillGain:Math.max(0,gain)});p.developmentHistory=p.developmentHistory.slice(-20);p.v075SeasonAppsBase=p.stats?.apps||0;p.v075SeasonStartsBase=p.stats?.starts||0;p.v075SeasonRatingBase=p.stats?.ratingSum||0
 }
 for(let p of S.academy||[]){v06EnsurePlayer(p);let room=Math.max(0,p.potential-p.ovr),gain=room?Math.min(room,Math.random()<.28?3:Math.random()<.72?2:1):0;p.ovr=clamp(p.ovr+gain,40,p.potential);p.age++;p.developmentHistory??=[];p.developmentHistory.push({season,week:19,ovr:p.ovr,ovrDelta:gain,focus:'cantera',skillGain:gain})}
}
function v075StartNextSeason(){
 let tr=S.v075SeasonTransition||{},nextTier=tr.nextTier;v075ApplySeasonDevelopment();S.season++;S.week=1;S.contract.duration=Math.max(1,S.contract.duration-1);S.contract.objective=objectiveFor(club(S.clubId));S.contract.cupObjective=cupObjectiveFor(club(S.clubId));S.phase='weekStart';S.weekFlow=null;S.lastMatch=null;S.pendingJobOffer=null;S.winStreak=0;S.stint.startWeek=1;if(S.academy.length<4)S.academy=S.academy.concat(makeAcademy(club(S.clubId),S.season).slice(0,5-S.academy.length));initLeague(S.worldDivs[S.clubId]||club(S.clubId).div,0);S.cup=setupCupFor(S.clubId,S.season,S.worldDivs);S.continental=v06SetupContinental(S.clubId,S.season,S.worldDivs,nextTier);S.v075Market=null;S.v075SeasonTransition=null;S.market={history:S.market?.history||[],offers:[],windowKey:null};view='home';save();render();toast(`Comienza la temporada ${S.season}.`)
}

closeSeason=function(met,promo,releg){
 let pos=tablePos(),oldDiv=S.league.div,nextTier=v06Qualification(pos,oldDiv,S.cup.champion);closeModal();S.reputation=clamp(S.reputation+(met?8:-8)+(promo?12:0)+(releg?-8:0),0,100);S.confidence=clamp(S.confidence+(met?10:-12)+(promo?8:0)+(releg?-10:0),0,100);if(promo)S.career.promotions++;updateWorldDivisions();
 if(S.confidence<=20){S.phase='fired';S.career.firings++;archiveStint('Despido al final de temporada');save();render();return}
 S.v075SeasonTransition={season:S.season,pos,oldDiv,nextTier,met,promo,releg};S.week=19;S.phase='marketDays';S.weekFlow=null;S.lastMatch=null;S.pendingJobOffer=null;S.v075Market=null;v075MarketState();v075ProcessDay();view='market';save();render()
};

nextAction=function(){if(S?.phase==='marketDays'){let m=v075MarketState();return {e:'MERCADO DE PASES',t:`Día ${m.day} de 7`,d:'Negociá, esperá respuestas y avanzá el mercado día por día.',b:'Entrar al mercado',a:"view='market';render()"}}return _v075NextActionBase()};
render=function(){if(!S){startFlow();return}if(S.phase==='marketDays'){root().innerHTML=`<div class="app">${v075RenderMarketDays()}</div>`;return}if(S.phase==='marketSummary'){root().innerHTML=`<div class="app">${v075RenderMarketSummary()}</div>`;return}_v075RenderBase()};

/* El mercado viejo deja de abrir durante la temporada regular. */
const _v075MarketRenderBase=v067RenderMarket;
v067RenderMarket=function(){if(S.phase==='marketDays')return v075RenderMarketDays();if(S.phase==='marketSummary')return v075RenderMarketSummary();return `${topShell()}<div class="content"><div class="card hero"><div class="eyebrow">MERCADO DE PASES</div><h1>Mercado cerrado</h1><p>La ventana de fichajes ahora se disputa al terminar la temporada: 7 días simulados de negociaciones, respuestas y cierre.</p></div></div>${nav()}`};

(function(){let st=document.createElement('style');st.textContent='.marketDays{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:14px 0}.dayDot{height:32px;border-radius:10px;border:1px solid #294555;display:grid;place-items:center;font-size:11px;font-weight:900;color:#79909d;background:#09161e}.dayDot.done{color:#9ee9bd;border-color:rgba(85,214,147,.35);background:rgba(85,214,147,.08)}.dayDot.active{color:#111820;background:var(--gold);border-color:var(--gold)}.marketDaysPage .marketPlayer{margin-bottom:10px}';document.head.appendChild(st)})();
