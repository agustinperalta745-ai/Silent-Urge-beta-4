from pathlib import Path
import re
import sys

src = Path(sys.argv[1])
out = Path(sys.argv[2])
html = src.read_text(encoding='utf-8')

html = html.replace("const VERSION='0.4.2';", "const VERSION='0.4.3';", 1)
html = html.replace("const VERSION_CODE=7;", "const VERSION_CODE=8;", 1)

css = r'''
/* v0.4.3 · Plantel táctico + gestión directa de cantera */
.squadTacticalCard{padding:10px;overflow:hidden}
.formationBar{display:grid;grid-template-columns:42px minmax(0,1fr) 42px;gap:7px;align-items:center;margin-bottom:9px}
.formationArrow{height:40px;border:1px solid #2e4b5e;border-radius:12px;background:#0b1b26;color:#edf4f7;font-size:22px;font-weight:900}
.formationName{height:40px;border:1px solid #294555;border-radius:12px;background:#0b1a24;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#f6f8f9;text-align:center}
.tacticalBoard{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:8px;align-items:stretch}
.footballPitch{position:relative;min-height:480px;aspect-ratio:68/100;border-radius:16px;overflow:hidden;border:1px solid #315e43;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 9%,rgba(0,0,0,.035) 9% 18%),linear-gradient(180deg,#1f6b3b,#15552f);box-shadow:inset 0 0 36px rgba(0,0,0,.22)}
.footballPitch:before{content:"";position:absolute;inset:4%;border:2px solid rgba(231,250,235,.42);border-radius:3px;background:linear-gradient(90deg,transparent calc(50% - 1px),rgba(231,250,235,.34) calc(50% - 1px),rgba(231,250,235,.34) calc(50% + 1px),transparent calc(50% + 1px));pointer-events:none}
.footballPitch:after{content:"";position:absolute;left:50%;top:50%;width:29%;aspect-ratio:1;border:2px solid rgba(231,250,235,.38);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
.pitchBoxTop,.pitchBoxBottom{position:absolute;left:28%;width:44%;height:14%;border:2px solid rgba(231,250,235,.36);pointer-events:none}
.pitchBoxTop{top:4%;border-top:0}.pitchBoxBottom{bottom:4%;border-bottom:0}
.pitchPlayer{position:absolute;transform:translate(-50%,-50%);width:68px;z-index:2;border:1px solid #28495b;border-radius:11px;padding:4px 3px 5px;background:linear-gradient(180deg,#0e2330,#081824);color:#fff;text-align:center;box-shadow:0 7px 14px rgba(0,0,0,.28);transition:.12s}
.pitchPlayer:active{transform:translate(-50%,-50%) scale(.97)}
.pitchPlayer.selected{border-color:var(--gold);box-shadow:0 0 0 2px rgba(243,191,77,.18),0 8px 18px rgba(0,0,0,.32);background:linear-gradient(180deg,#2d291b,#101b22)}
.pitchPlayer.unavailable{opacity:.55}
.shirtMini{width:25px;height:25px;margin:-1px auto 1px;display:grid;place-items:center;clip-path:polygon(24% 4%,39% 0,50% 10%,61% 0,76% 4%,98% 22%,83% 39%,76% 31%,76% 100%,24% 100%,24% 31%,17% 39%,2% 22%);background:linear-gradient(90deg,#111 0 43%,#d7a535 43% 57%,#111 57%);color:#f6f6f6;font-size:8px;font-weight:1000;text-shadow:0 1px 2px #000}
.shirtMini.gk{background:linear-gradient(90deg,#167344,#32b56c)}
.pitchTopline{display:flex;justify-content:center;gap:5px;align-items:center;font-size:9px;line-height:1}.pitchSlot{color:#9fb6c4;font-weight:900}.pitchOvr{color:var(--gold);font-size:13px;font-weight:1000}.pitchName{font-size:9px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}
.benchPanel{border:1px solid #284455;background:#091923;border-radius:15px;padding:7px 5px;display:flex;flex-direction:column;min-width:0}
.benchTitle{font-size:9px;letter-spacing:.09em;color:#9eb3c0;text-transform:uppercase;font-weight:900;padding:3px 3px 7px;white-space:nowrap}
.benchList{overflow:auto;max-height:450px;padding-right:1px;scrollbar-width:none}.benchList::-webkit-scrollbar{display:none}
.benchPlayer{border:1px solid #203b4d;background:#0c1d28;border-radius:10px;padding:6px 5px;margin-bottom:6px;min-width:0}
.benchPlayer.unavailable{opacity:.5}.benchInfo{display:grid;grid-template-columns:27px minmax(0,1fr);gap:5px;align-items:center}.benchInfo .shirtMini{margin:0;width:27px;height:27px}.benchPos{font-size:8px;color:#a2b8c5;font-weight:900}.benchOvr{font-size:13px;color:var(--gold);font-weight:1000}.benchName{font-size:8.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}.benchChange{width:100%;margin-top:5px;border:1px solid #34566a;border-radius:8px;background:#102535;color:#dbe8ee;font-size:8.5px;font-weight:900;padding:6px 2px}.benchChange:disabled{opacity:.35}
.squadHelper{margin-top:9px;padding:10px 11px;border:1px solid #234152;border-radius:12px;background:#0a1822;color:#9eb4c2;font-size:10px;line-height:1.35;text-align:center}
.academyPlayer{cursor:pointer;border:1px solid transparent;border-radius:13px;padding:10px 8px;margin:2px 0;transition:.12s}
.academyPlayer.selected{border-color:var(--gold);background:rgba(243,191,77,.075);box-shadow:0 0 0 1px rgba(243,191,77,.08)}
.academyManage{padding:12px;margin-top:-4px}
.academyHelp{text-align:center;color:#9eb4c2;font-size:10px;margin-bottom:9px}
.academyActions{display:grid;grid-template-columns:1.45fr .82fr 1fr;gap:7px}
.academyActions button{min-width:0;padding:11px 5px;font-size:10px;white-space:normal;line-height:1.15}
.academyActions .releaseBtn{border-color:rgba(255,109,115,.38);color:#ffc0c3;background:rgba(255,109,115,.055)}
.academyActions button:disabled{opacity:.35;transform:none}
@media(max-width:420px){
 .squadTacticalCard{padding:8px}.tacticalBoard{grid-template-columns:minmax(0,1fr) 94px;gap:6px}.footballPitch{min-height:440px}.pitchPlayer{width:60px;padding:3px 2px 4px}.pitchName{font-size:8px}.pitchOvr{font-size:12px}.shirtMini{width:22px;height:22px}.benchPanel{padding:6px 4px}.benchList{max-height:410px}.benchInfo{grid-template-columns:23px minmax(0,1fr);gap:4px}.benchInfo .shirtMini{width:23px;height:24px}.benchName{font-size:7.7px}.benchChange{font-size:7.7px;padding:5px 1px}.academyActions{gap:5px}.academyActions button{font-size:9px;padding:10px 3px}
}
'''
if '</style>' not in html:
    raise SystemExit('No </style> found')
html = html.replace('</style>', css + '\n</style>', 1)

old_state = "let S=null,view='home',tacticalChoice='Equilibrado',formation='4-2-3-1',squadTab='first',leagueTab='table';"
new_state = old_state + "\nlet selectedStarterId=null,selectedAcademyId=null;"
if old_state not in html:
    raise SystemExit('State anchor not found')
html = html.replace(old_state, new_state, 1)

squad_block = r'''const FORMATION_SLOTS={
'4-3-3':[{pos:'EI',x:18,y:19},{pos:'DC',x:50,y:15},{pos:'ED',x:82,y:19},{pos:'MC',x:29,y:44},{pos:'MCD',x:50,y:55},{pos:'MC',x:71,y:44},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
'4-2-3-1':[{pos:'DC',x:50,y:15},{pos:'EI',x:19,y:36},{pos:'MCO',x:50,y:34},{pos:'ED',x:81,y:36},{pos:'MCD',x:36,y:56},{pos:'MCD',x:64,y:56},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
'4-4-2':[{pos:'DC',x:36,y:17},{pos:'DC',x:64,y:17},{pos:'EI',x:17,y:43},{pos:'MC',x:39,y:48},{pos:'MC',x:61,y:48},{pos:'ED',x:83,y:43},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}]
};
function positionalFit(p,target){if(!p)return-999;if(p.pos===target)return 46;let rel={ARQ:[],DFC:['LD','LI','MCD'],LD:['DFC','ED'],LI:['DFC','EI'],MCD:['MC','DFC'],MC:['MCD','MCO'],MCO:['MC','EI','ED','DC'],EI:['ED','MCO','DC','LI'],ED:['EI','MCO','DC','LD'],DC:['EI','ED','MCO']};let a=rel[target]||[];return a.includes(p.pos)?20:0}
function automaticLineupIds(form=S.formation||'4-2-3-1'){let slots=FORMATION_SLOTS[form]||FORMATION_SLOTS['4-2-3-1'],pool=S.roster.filter(p=>!(p.injuredWeeks>0)),chosen=[];for(let slot of slots){let cand=pool.filter(p=>!chosen.includes(p.id)).sort((a,b)=>(positionalFit(b,slot.pos)+b.ovr)-(positionalFit(a,slot.pos)+a.ovr))[0];if(cand)chosen.push(cand.id)}for(let p of [...pool].sort((a,b)=>b.ovr-a.ovr)){if(chosen.length>=11)break;if(!chosen.includes(p.id))chosen.push(p.id)}return chosen.slice(0,11)}
function ensureLineup(){let valid=new Set(S.roster.map(p=>p.id));let ids=Array.isArray(S.lineupIds)?S.lineupIds.filter(id=>valid.has(id)):[];if(!ids.length)ids=automaticLineupIds();let fill=automaticLineupIds();for(let id of fill){if(ids.length>=11)break;if(!ids.includes(id))ids.push(id)}if(ids.length<11){for(let p of [...S.roster].sort((a,b)=>b.ovr-a.ovr)){if(ids.length>=11)break;if(!ids.includes(p.id))ids.push(p.id)}}S.lineupIds=ids.slice(0,11);return S.lineupIds}
function bestXI(){let ids=ensureLineup(),xi=ids.map(id=>S.roster.find(p=>p.id===id)).filter(p=>p&&!(p.injuredWeeks>0));for(let p of [...S.roster].filter(p=>!(p.injuredWeeks>0)).sort((a,b)=>b.ovr-a.ovr)){if(xi.length>=11)break;if(!xi.some(x=>x.id===p.id))xi.push(p)}return xi.slice(0,11)}
function assignedLineup(){let slots=FORMATION_SLOTS[S.formation]||FORMATION_SLOTS['4-2-3-1'],pool=ensureLineup().map(id=>S.roster.find(p=>p.id===id)).filter(Boolean),used=new Set(),out=[];for(let slot of slots){let cand=pool.filter(p=>!used.has(p.id)).sort((a,b)=>(positionalFit(b,slot.pos)+b.ovr)-(positionalFit(a,slot.pos)+a.ovr))[0];if(cand){used.add(cand.id);out.push({slot,p:cand})}}return out}
function squadNumber(p){let i=S.roster.findIndex(x=>x.id===p.id);return i<0?'':i+1}
function surname(p){let a=(p?.name||'').trim().split(/\s+/);return a[a.length-1]||p?.name||''}
function selectStarter(id){selectedStarterId=selectedStarterId===id?null:id;render()}
function swapStarter(subId){if(!selectedStarterId){toast('Primero tocá un titular en la cancha.');return}let ids=ensureLineup(),idx=ids.indexOf(selectedStarterId),sub=S.roster.find(p=>p.id===subId);if(idx<0||!sub)return;if(sub.injuredWeeks>0){toast('Ese jugador está lesionado.');return}ids[idx]=subId;S.lineupIds=ids;selectedStarterId=null;save();render();toast('Cambio guardado en el once.')}
function cycleFormation(dir){let forms=['4-2-3-1','4-3-3','4-4-2'],cur=S.formation||'4-2-3-1',i=forms.indexOf(cur);i=(i+dir+forms.length)%forms.length;S.formation=forms[i];formation=S.formation;selectedStarterId=null;save();render()}
function renderSquad(){let c=club(S.clubId),roster=S.roster,avg=Math.round(roster.reduce((a,p)=>a+p.ovr,0)/roster.length),head=`${topShell()}<div class="content"><div class="card"><div class="row between"><div><div class="eyebrow">PLANTEL</div><h2 style="margin:4px 0 0">${c.name}</h2></div>${shield(c,'sm')}</div><div class="grid3" style="margin-top:14px"><div class="metric"><small>Media</small><b>${avg}</b></div><div class="metric"><small>Jugadores</small><b>${roster.length}</b></div><div class="metric"><small>Moral</small><b>${S.morale}</b></div></div></div><div class="subtabs"><button class="subtab ${squadTab==='first'?'active':''}" onclick="squadTab='first';selectedAcademyId=null;render()">Primer equipo</button><button class="subtab ${squadTab==='academy'?'active':''}" onclick="squadTab='academy';selectedStarterId=null;render()">Cantera</button></div>`;return head+(squadTab==='academy'?renderAcademyHtml():renderFirstTeamHtml())+`</div>${nav()}`}
function renderFirstTeamHtml(){ensureLineup();let assigned=assignedLineup(),lineupSet=new Set(S.lineupIds),bench=[...S.roster].filter(p=>!lineupSet.has(p.id)).sort((a,b)=>(a.injuredWeeks>0)-(b.injuredWeeks>0)||b.ovr-a.ovr),selected=S.roster.find(p=>p.id===selectedStarterId),pitch=assigned.map(({slot,p})=>`<button class="pitchPlayer ${selectedStarterId===p.id?'selected':''} ${p.injuredWeeks?'unavailable':''}" style="left:${slot.x}%;top:${slot.y}%" onclick="selectStarter('${p.id}')"><div class="shirtMini ${p.pos==='ARQ'?'gk':''}">${squadNumber(p)}</div><div class="pitchTopline"><span class="pitchSlot">${slot.pos}</span><span class="pitchOvr">${p.ovr}</span></div><div class="pitchName">${surname(p)}</div></button>`).join(''),benchHtml=bench.map(p=>`<div class="benchPlayer ${p.injuredWeeks?'unavailable':''}"><div class="benchInfo"><div class="shirtMini ${p.pos==='ARQ'?'gk':''}">${squadNumber(p)}</div><div><div><span class="benchPos">${p.pos}</span> <span class="benchOvr">${p.ovr}</span></div><div class="benchName">${surname(p)}</div></div></div><button class="benchChange" onclick="swapStarter('${p.id}')" ${p.injuredWeeks?'disabled':''}>Cambiar</button></div>`).join('');return `<div class="card squadTacticalCard"><div class="formationBar"><button class="formationArrow" onclick="cycleFormation(-1)">‹</button><div class="formationName">Formación: ${S.formation||'4-2-3-1'}</div><button class="formationArrow" onclick="cycleFormation(1)">›</button></div><div class="tacticalBoard"><div class="footballPitch"><div class="pitchBoxTop"></div><div class="pitchBoxBottom"></div>${pitch}</div><div class="benchPanel"><div class="benchTitle">Suplentes (${bench.length})</div><div class="benchList">${benchHtml||'<div class="muted small center">Sin suplentes</div>'}</div></div></div><div class="squadHelper">${selected?`Seleccionaste a <b>${selected.name}</b>. Tocá <b>Cambiar</b> en un suplente.`:'Tocá un titular en la cancha y después <b>Cambiar</b> en un suplente.'}</div></div>`}
function selectAcademy(id){selectedAcademyId=selectedAcademyId===id?null:id;render()}
function academyPanelPromote(){if(!selectedAcademyId){toast('Seleccioná un juvenil.');return}academyDecision(selectedAcademyId,'promote',true)}
function academyPanelReport(){if(!selectedAcademyId){toast('Seleccioná un juvenil.');return}showAcademyReport(selectedAcademyId,true)}
function academyPanelRelease(){let y=S.academy.find(x=>x.id===selectedAcademyId);if(!y){toast('Seleccioná un juvenil.');return}openModal(`<div class="eyebrow">CANTERA</div><h2>¿Liberar a ${y.name}?</h2><p>El juvenil dejará tu academia. Esta acción no se puede deshacer.</p><button class="primary danger" onclick="academyDecision('${y.id}','release',true)">Sí, liberar jugador</button><div style="height:8px"></div><button class="secondary" onclick="closeModal()">Cancelar</button>`)}
function renderAcademyHtml(){let academy=S.academy||[];if(selectedAcademyId&&!academy.some(p=>p.id===selectedAcademyId))selectedAcademyId=null;let rows=academy.map(p=>`<div class="academyPlayer ${selectedAcademyId===p.id?'selected':''}" onclick="selectAcademy('${p.id}')"><div class="posBadge">${p.pos}</div><div><b>${p.name}</b><div class="meta">${p.age} años · Media ${p.ovr}</div><div class="pot">Potencial estimado ${p.potMin}–${p.potMax}</div><span class="trait">${p.trait}</span></div><div class="ovr">${p.ovr}</div></div>`).join(''),sel=academy.find(p=>p.id===selectedAcademyId);return `<div class="card"><div class="row between"><div><div class="sectionTitle" style="margin:0">Academia</div><div class="muted small">Los informes importantes aparecen solos en Próximo paso.</div></div><span class="pill">${academy.length} juveniles</span></div><div style="height:8px"></div>${rows||'<div class="notice">No hay juveniles actualmente.</div>'}</div><div class="card academyManage"><div class="academyHelp">${sel?`Gestionando a <b>${sel.name}</b>.`:'Seleccioná un juvenil para gestionar su futuro.'}</div><div class="academyActions"><button class="primary" onclick="academyPanelPromote()" ${sel?'':'disabled'}>↑ Subir al primer equipo</button><button class="secondary releaseBtn" onclick="academyPanelRelease()" ${sel?'':'disabled'}>Liberar</button><button class="secondary" onclick="academyPanelReport()" ${sel?'':'disabled'}>Ver informe</button></div></div>`}
'''

pattern = re.compile(r"function bestXI\(\)\{.*?\nfunction renderLeague\(\)", re.S)
m = pattern.search(html)
if not m:
    raise SystemExit('Squad block anchor not found')
html = html[:m.start()] + squad_block + "\nfunction renderLeague()" + html[m.end():]

academy_block = r'''function showAcademyReport(id,fromPanel=false){let y=S.academy.find(x=>x.id===id);if(!y){if(fromPanel){closeModal();render();return}return advanceWeekFlow()}openModal(`<div class="eyebrow">🌱 INFORME DE CANTERA</div><h2>${y.name}</h2><p>${y.age} años · ${y.pos} · Media ${y.ovr}. El cuerpo técnico estima un potencial de ${y.potMin}–${y.potMax}.</p><div class="notice"><b>${y.trait}</b> es el rasgo que más destaca en los informes actuales.</div><button class="choice" onclick="academyDecision('${id}','promote',${fromPanel})"><b>Subirlo al primer equipo</b><span>Puede acelerar su experiencia, pero ocupará un lugar en la plantilla.</span></button><button class="choice" onclick="academyDecision('${id}','focus',${fromPanel})"><b>Plan individual de desarrollo</b><span>Mejora su progresión y afina la estimación de potencial.</span></button><button class="choice" onclick="academyDecision('${id}','observe',${fromPanel})"><b>Seguir observándolo</b><span>No apresurás su proceso y obtenés un informe más preciso.</span></button>`)}
function academyDecision(id,type,fromPanel=false){let y=S.academy.find(x=>x.id===id);if(!y)return;let title='Informe actualizado',text='',fx=[],tone='info',icon='🌱';if(type==='promote'){S.academy=S.academy.filter(x=>x.id!==id);S.roster.push(normalizePlayer({id:y.id,name:y.name,pos:y.pos,age:y.age,ovr:y.ovr,value:+Math.max(.05,(y.ovr-45)/40).toFixed(2),morale:82,relation:2,trait:y.trait,injuredWeeks:0,stats:{apps:0,starts:0,goals:0,assists:0,ratingSum:0}}));S.confidence=clamp(S.confidence+1,0,100);S.reputation=clamp(S.reputation+1,0,100);addMessage(y.name,'Gracias, míster. No voy a desaprovechar esta oportunidad con el primer equipo.','Gracias por hacerme debutar',false,null,y.id);title='¡Sube al primer equipo!';text=`${y.name} ya forma parte del plantel profesional.`;fx=['Directiva +1','Reputación +1'];tone='success';icon='🌟'}else if(type==='release'){S.academy=S.academy.filter(x=>x.id!==id);title='Juvenil liberado';text=`${y.name} deja la academia y queda libre.`;fx=['Cantera -1 jugador'];tone='warn';icon='👋'}else if(type==='focus'){let before=y.ovr;y.ovr=clamp(y.ovr+ri(0,1),40,88);y.potMin=clamp(y.potMin+2,y.ovr,y.potential);y.potMax=clamp(y.potMax-1,y.potential,92);title='Plan individual';text=`${y.name} tendrá un seguimiento especial de desarrollo.`;fx=[`Media ${before} → ${y.ovr}`,`Potencial ${y.potMin}–${y.potMax}`]}else{y.potMin=clamp(y.potMin+1,y.ovr,y.potential);y.potMax=clamp(y.potMax-1,y.potential,92);text=`Seguirás observando a ${y.name} antes de tomar una decisión.`;fx=[`Potencial ${y.potMin}–${y.potMax}`]}selectedAcademyId=null;save();let done=fromPanel?()=>{closeModal();render()}:advanceWeekFlow;showConsequence({type:tone,icon,title,text,effects:fx,duration:2800,onDone:done})}
'''
pattern2 = re.compile(r"function showAcademyReport\(id\)\{.*?\nfunction renderPrepare\(mode='league'\)", re.S)
m2 = pattern2.search(html)
if not m2:
    raise SystemExit('Academy block anchor not found')
html = html[:m2.start()] + academy_block + "\nfunction renderPrepare(mode='league')" + html[m2.end():]

old_tail = "load();render();setTimeout(()=>checkForUpdates(false),1500);"
new_tail = "load();if(S){formation=S.formation||formation;tacticalChoice=S.tactic||tacticalChoice;ensureLineup();save()}render();setTimeout(()=>checkForUpdates(false),1500);"
if old_tail not in html:
    raise SystemExit('Tail anchor not found')
html = html.replace(old_tail, new_tail, 1)

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'v0.4.3 source written: {out} ({out.stat().st_size} bytes)')
