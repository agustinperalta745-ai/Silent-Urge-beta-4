/* v0.7.4 · venta de canteranos */
function v074AcademyValue(y){
  let potential=y.potential||y.potMax||y.ovr+8;
  let raw=((Math.max(0,y.ovr-42)**2)/180)*(0.9+Math.max(0,potential-y.ovr)/40);
  return +Math.max(.05,Math.min(6,raw)).toFixed(2)
}
function v074FindAcademyBuyer(id){
  if(!v06MarketOpen())return toast('El mercado está cerrado.');
  let y=(S.academy||[]).find(x=>x.id===id);if(!y)return;
  let base=v074AcademyValue(y),buyers=shuffle(CLUBS.filter(c=>c.id!==S.clubId)).slice(0,3),offers=buyers.map(c=>({c,amount:+(base*(.8+Math.random()*.4)).toFixed(2)})).sort((a,b)=>b.amount-a.amount);
  openModal(`<div class="eyebrow">🌱 OFERTAS POR ${y.name}</div><h2>Venta de canterano</h2><p>${y.name} · ${y.pos} · ${y.ovr} OVR · potencial ${y.potMin}–${y.potMax}. Valor orientativo ${money(base)}.</p>${offers.map(o=>`<button class="choice" onclick="v074AcceptAcademySale('${id}','${o.c.id}',${o.amount})"><b>${o.c.name} · ${money(o.amount)}</b><span>${o.amount>=base?'Buena propuesta por el juvenil':'Oferta por debajo del valor estimado'}.</span></button>`).join('')}<button class="secondary" onclick="closeModal()">Rechazar todas</button>`)
}
function v074AcceptAcademySale(id,clubId,amount){
  let y=(S.academy||[]).find(x=>x.id===id);if(!y)return;
  S.budget=+(Number(S.budget||0)+Number(amount||0)).toFixed(2);
  S.academy=S.academy.filter(x=>x.id!==id);
  S.market??={history:[],offers:[],windowKey:null};
  S.market.history??=[];
  S.market.history.push({season:S.season,week:S.week,type:'sell_youth',player:y.name,amount:+amount,clubId});
  selectedAcademyId=null;save();
  showConsequence({type:'info',icon:'💰',title:'CANTERANO VENDIDO',text:`${y.name} deja la cantera y se marcha a ${club(clubId).name}.`,effects:[`Ingresan ${money(+amount)}`],duration:2400,onDone:()=>{closeModal();render()}})
}
renderAcademyHtml=function(){
  let academy=S.academy||[];
  if(selectedAcademyId&&!academy.some(p=>p.id===selectedAcademyId))selectedAcademyId=null;
  let rows=academy.map(p=>`<div class="academyPlayer ${selectedAcademyId===p.id?'selected':''}" onclick="selectAcademy('${p.id}')"><div class="posBadge">${p.pos}</div><div><b><span class="academyMark">🌱</span>${p.name}</b><div class="meta">${p.age} años · Juvenil · Media ${p.ovr}</div><div class="pot">Potencial estimado ${p.potMin}–${p.potMax}</div><span class="traitStrong ${personalityIsException(p)?'exception':''}">${personalityLabel(p)}</span></div><div class="ovr">${p.ovr}</div></div>`).join(''),sel=academy.find(p=>p.id===selectedAcademyId),marketOpen=v06MarketOpen();
  return `<div class="card"><div class="row between"><div><div class="sectionTitle" style="margin:0">Academia</div><div class="muted small">🌱 identifica a los futbolistas formados en tu cantera.</div></div><span class="pill">${academy.length} juveniles</span></div><div style="height:8px"></div>${rows||'<div class="notice">No hay juveniles actualmente.</div>'}${sel?profilePanelHtml(sel):''}</div><div class="card academyManage"><div class="academyHelp">${sel?`Gestionando a <b>${sel.name}</b>.`:'Seleccioná un juvenil para gestionar su futuro.'}</div><div class="academyActions"><button class="primary" onclick="academyPanelPromote()" ${sel?'':'disabled'}>↑ Subir al primer equipo</button><button class="secondary" onclick="v074FindAcademyBuyer('${sel?.id||''}')" ${sel&&marketOpen?'':'disabled'}>💰 Buscar ofertas</button><button class="secondary releaseBtn" onclick="academyPanelRelease()" ${sel?'':'disabled'}>Liberar</button><button class="secondary" onclick="academyPanelReport()" ${sel?'':'disabled'}>Ver informe</button></div>${!marketOpen?'<div class="muted small" style="margin-top:9px">La venta de juveniles se habilita durante la ventana de mercado.</div>':''}</div>`
}
