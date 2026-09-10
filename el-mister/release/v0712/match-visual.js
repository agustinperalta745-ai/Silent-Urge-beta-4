/* ===== El Míster v0.7.12 · cancha animada + intervenciones automáticas ===== */
let _v0712TickTimer=null,_v0712MotionTimer=null,_v0712RunToken=0;

(function(){
 const st=document.createElement('style');
 st.textContent=`
 .v0712MatchBg{background:rgba(2,7,11,.94);align-items:center;padding:10px}.v0712MatchBg .modal{width:min(540px,100%);max-height:calc(100vh - 20px);overflow:auto;background:#07131b;border:1px solid #264354;padding:12px;border-radius:24px}
 .v0712Top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.v0712Top .score{font-size:34px;line-height:1}.v0712Teams{font-size:10px;color:var(--muted);margin-top:5px}.v0712Minute{font-size:10px;font-weight:950;color:var(--gold);letter-spacing:.08em}.v0712LivePill{font-size:9px;border:1px solid rgba(85,214,147,.3);background:rgba(85,214,147,.08);color:#aef0ca;border-radius:999px;padding:5px 8px;white-space:nowrap}
 .v0712Pitch{position:relative;width:100%;aspect-ratio:68/96;max-height:64vh;border:2px solid rgba(225,244,235,.45);border-radius:18px;overflow:hidden;background:linear-gradient(90deg,rgba(255,255,255,.025) 0 12.5%,transparent 12.5% 25%,rgba(255,255,255,.025) 25% 37.5%,transparent 37.5% 50%,rgba(255,255,255,.025) 50% 62.5%,transparent 62.5% 75%,rgba(255,255,255,.025) 75% 87.5%,transparent 87.5%),#0d552f;box-shadow:inset 0 0 50px rgba(0,0,0,.22)}
 .v0712Pitch:before{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(255,255,255,.55)}.v0712Pitch:after{content:'';position:absolute;left:50%;top:50%;width:20%;aspect-ratio:1;border:1px solid rgba(255,255,255,.5);border-radius:50%;transform:translate(-50%,-50%)}
 .v0712Box{position:absolute;left:21%;width:58%;height:16%;border:1px solid rgba(255,255,255,.48)}.v0712Box.top{top:-1px;border-top:0}.v0712Box.bottom{bottom:-1px;border-bottom:0}.v0712Goal{position:absolute;left:39%;width:22%;height:2.8%;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.06)}.v0712Goal.top{top:0}.v0712Goal.bottom{bottom:0}
 .v0712Dot{position:absolute;width:17px;height:17px;border-radius:50%;transform:translate(-50%,-50%);display:grid;place-items:center;font-size:7px;font-weight:1000;transition:left .34s ease,top .34s ease,transform .18s ease;z-index:3;box-shadow:0 2px 6px rgba(0,0,0,.42)}.v0712Dot.us{background:#f3bf4d;color:#111820;border:2px solid #ffe7a6}.v0712Dot.them{background:#64a7ff;color:#08131b;border:2px solid #c3ddff}.v0712Dot.focus{transform:translate(-50%,-50%) scale(1.2);box-shadow:0 0 0 4px rgba(255,255,255,.15),0 3px 8px rgba(0,0,0,.45)}
 .v0712Ball{position:absolute;width:9px;height:9px;border-radius:50%;background:#fff;border:1px solid #222;transform:translate(-50%,-50%);z-index:6;transition:left .27s linear,top .27s linear;box-shadow:0 2px 4px rgba(0,0,0,.5)}
 .v0712Legend{display:flex;justify-content:space-between;gap:8px;margin:8px 2px 0;font-size:9px;color:#a9bdc9}.v0712Legend span{display:flex;align-items:center;gap:5px}.v0712Sw{width:8px;height:8px;border-radius:50%;display:inline-block}.v0712Sw.us{background:#f3bf4d}.v0712Sw.them{background:#64a7ff}
 .v0712Ticker{min-height:31px;margin-top:9px;padding:8px 10px;border:1px solid #1e3b4d;background:#0b1c27;border-radius:12px;font-size:10px;color:#c5d6df;line-height:1.35}.v0712Ticker b{color:#fff}.v0712Actions{display:flex;gap:8px;margin-top:9px}.v0712Actions button{flex:1;padding:10px 8px}.v0712Paused{font-size:9px;color:#ffe0a0;text-align:center;margin:7px 0 2px}
 .v0712DecisionPitch{margin:10px 0 14px}.v0712DecisionPitch .v0712Pitch{max-height:245px;aspect-ratio:86/62}.v0712DecisionPitch .v0712Dot{width:13px;height:13px;font-size:6px}.v0712DecisionPitch .v0712Ball{width:7px;height:7px}.v0712DecisionPitch .v0712Legend{display:none}
 @media(max-height:720px){.v0712Pitch{max-height:54vh}.v0712DecisionPitch .v0712Pitch{max-height:190px}}
 `;
 document.head.appendChild(st);
})();

function v0712StopVisual(){
 _v0712RunToken++;
 if(_v0712TickTimer){clearTimeout(_v0712TickTimer);_v0712TickTimer=null}
 if(_v0712MotionTimer){clearInterval(_v0712MotionTimer);_v0712MotionTimer=null}
}
function v0712VisualState(l=S.live){if(!l)return null;l.v0712Visual??={poss:'us',lastEventCount:(l.events||[]).length,phase:'open',motion:0};return l.v0712Visual}
function v0712Lineup(l=S.live){let ids=(l?.lineupIds||S.lineupIds||[]).slice(0,11),p=ids.map(id=>S.roster.find(x=>x.id===id)).filter(Boolean);if(p.length<11){for(let x of bestXI())if(p.length<11&&!p.some(y=>y.id===x.id))p.push(x)}return p.slice(0,11)}
function v0712BaseSlots(){return (FORMATION_SLOTS[S.formation]||FORMATION_SLOTS['4-2-3-1']).map(x=>({x:x.x,y:x.y,pos:x.pos}))}
function v0712MirrorSlots(){return (FORMATION_SLOTS['4-2-3-1']||[]).map(x=>({x:100-x.x,y:100-x.y,pos:x.pos}))}
function v0712ShapeAdjust(slots,us=true,l=S.live){let ctx=l?.context||{},flow=l?.flow||{},out=slots.map(x=>({...x}));if(us){
  if(ctx.fullbacksHigh)out.forEach(x=>{if(x.pos==='LI'||x.pos==='LD')x.y-=13});
  if(ctx.pressHigh)out.forEach(x=>{if(x.pos!=='ARQ')x.y-=9});
  if(ctx.lowBlock)out.forEach(x=>{if(x.pos!=='ARQ')x.y+=8});
  if(ctx.possession)out.forEach(x=>{if(['MCD','MC','MCO'].includes(x.pos)){x.y+=2;x.x=50+(x.x-50)*.78}});
  if(ctx.direct)out.forEach(x=>{if(['DC','EI','ED','MCO'].includes(x.pos))x.y-=6});
  if((flow.userThreat||0)>(flow.oppThreat||0)+1)out.forEach(x=>{if(x.pos!=='ARQ')x.y-=4});
 }else{
  if((flow.oppThreat||0)>(flow.userThreat||0)+1)out.forEach(x=>{if(x.pos!=='ARQ')x.y+=5});
  if((flow.userThreat||0)>(flow.oppThreat||0)+1)out.forEach(x=>{if(x.pos!=='ARQ')x.y-=4});
 }
 out.forEach(x=>{x.x=clamp(x.x,7,93);x.y=clamp(x.y,5,95)});return out}
function v0712Scene(l=S.live){
 let s=l?.scenario,k=s?.kind==='seq79'?(s.t||'').toLowerCase():'',ball=null,focus='';
 if(!s)return {ball:null,focus:''};
 if(/línea de fondo/.test(k)){ball={x:82,y:14};focus='us8'}
 else if(/mano a mano/.test(k)){ball={x:50,y:82};focus='them8'}
 else if(/laterales arriba|contra/.test(k)){ball={x:50,y:58};focus='them6'}
 else if(/salida limpia|presión/.test(k)){ball={x:48,y:73};focus='us9'}
 else if(/lateral cansado/.test(k)){ball={x:18,y:67};focus='them7'}
 else if(/entre líneas|segunda pelota|mitad de cancha/.test(k)){ball={x:50,y:45};focus='us5'}
 else if(/rompe la última línea|ángulo de remate|definir de primera/.test(k)){ball={x:50,y:23};focus='us0'}
 else if(/banda|saque lateral/.test(k)){ball={x:84,y:49};focus='us3'}
 else if(s.kind==='keyplay'){ball={x:50,y:25};focus='us0'}
 return {ball,focus}
}
function v0712Jitter(base,idx,us,l){
 let v=v0712VisualState(l),n=(v?.motion||0)+idx*1.7+(us?0:4.2),amp=base.pos==='ARQ'?1.2:2.7,dx=Math.sin(n*.83)*amp,dy=Math.cos(n*.57)*amp;
 return {x:clamp(base.x+dx,5,95),y:clamp(base.y+dy,4,96)}
}
function v0712PitchHtml(l=S.live,compact=false){
 if(!l)return'';let us=v0712Lineup(l),a=v0712ShapeAdjust(v0712BaseSlots(),true,l),b=v0712ShapeAdjust(v0712MirrorSlots(),false,l),scene=v0712Scene(l),v=v0712VisualState(l),ball=scene.ball||{x:v?.poss==='us'?50:52,y:v?.poss==='us'?54:47};
 let ud=a.map((q,i)=>{let p=us[i],n=p?squadNumber(p):i+1;return `<span id="v0712u${i}" class="v0712Dot us ${scene.focus===`us${i}`?'focus':''}" style="left:${q.x}%;top:${q.y}%" title="${p?.name||''}">${n}</span>`}).join('');
 let od=b.map((q,i)=>`<span id="v0712o${i}" class="v0712Dot them ${scene.focus===`them${i}`?'focus':''}" style="left:${q.x}%;top:${q.y}%"></span>`).join('');
 return `<div class="${compact?'v0712DecisionPitch':''}"><div class="v0712Pitch" id="v0712Pitch"><span class="v0712Box top"></span><span class="v0712Box bottom"></span><span class="v0712Goal top"></span><span class="v0712Goal bottom"></span>${ud}${od}<span id="v0712Ball" class="v0712Ball" style="left:${ball.x}%;top:${ball.y}%"></span></div><div class="v0712Legend"><span><i class="v0712Sw us"></i>${club(S.clubId).name}</span><span><i class="v0712Sw them"></i>${club(l.opponent).name}</span></div></div>`
}
function v0712Motion(){
 let l=S.live,pitch=document.getElementById('v0712Pitch');if(!l||!pitch||l.scenario)return;let v=v0712VisualState(l);v.motion=(v.motion||0)+.48;
 let us=v0712ShapeAdjust(v0712BaseSlots(),true,l),op=v0712ShapeAdjust(v0712MirrorSlots(),false,l);
 us.forEach((q,i)=>{let e=document.getElementById('v0712u'+i),z=v0712Jitter(q,i,true,l);if(e){e.style.left=z.x+'%';e.style.top=z.y+'%'}});
 op.forEach((q,i)=>{let e=document.getElementById('v0712o'+i),z=v0712Jitter(q,i,false,l);if(e){e.style.left=z.x+'%';e.style.top=z.y+'%'}});
 let ball=document.getElementById('v0712Ball');if(ball){let possessionBias=.5+clamp(((l.flow?.userThreat||0)-(l.flow?.oppThreat||0))*.035,-.16,.16);if(Math.random()<.18)v.poss=Math.random()<possessionBias?'us':'them';let pool=v.poss==='us'?us:op,ids=v.poss==='us'?[1,2,3,4,5,6,7,8]:[2,3,4,5,6,7,8,9],q=pool[ids[Math.floor(Math.random()*ids.length)]||5]||pool[5];let z=v0712Jitter(q,3,v.poss==='us',l);ball.style.left=clamp(z.x+(Math.random()-.5)*3,3,97)+'%';ball.style.top=clamp(z.y+(Math.random()-.5)*3,2,98)+'%'}
}
function v0712LastTicker(l=S.live){let e=(l?.events||[]).filter(x=>x.type!=='decision').slice(-1)[0];if(!e)return'<b>Partido en juego.</b> Los equipos se acomodan según el plan táctico.';return `<b>${e.m}'</b> ${e.txt}`}
function v0712RefreshHud(l=S.live){
 if(!l)return;let m=document.getElementById('v0712Minute'),sc=document.getElementById('v0712Score'),tk=document.getElementById('v0712Ticker');if(m)m.textContent=`${l.minute}' · PARTIDO EN JUEGO`;if(sc)sc.textContent=`${l.gh} – ${l.ga}`;if(tk)tk.innerHTML=v0712LastTicker(l)
}
function v0712RenderVisual(){
 let l=S.live;if(!l)return render();v0712StopVisual();let token=_v0712RunToken,v=v0712VisualState(l);v.phase='running';
 document.getElementById('modalRoot').innerHTML=`<div class="modalBg v0712MatchBg"><div class="modal"><div class="v0712Top"><div><div id="v0712Minute" class="v0712Minute">${l.minute}' · PARTIDO EN JUEGO</div><div id="v0712Score" class="score">${l.gh} – ${l.ga}</div><div class="v0712Teams">${club(l.home).name} · ${club(l.away).name}</div></div><span class="v0712LivePill">SIMULACIÓN VISUAL</span></div>${v0712PitchHtml(l)}<div id="v0712Ticker" class="v0712Ticker">${v0712LastTicker(l)}</div><div class="v0712Actions"><button class="secondary" onclick="v0712ManualSubs()">⏸ DT / Cambios</button></div><div class="v0712Paused">No tenés que avanzar nada: el partido se frena solo cuando necesita tu decisión.</div></div></div>`;
 _v0712MotionTimer=setInterval(v0712Motion,360);_v0712TickTimer=setTimeout(()=>v0712Advance(token),300)
}
function v0712Advance(token){
 if(token!==_v0712RunToken)return;let l=S.live;if(!l||l.scenario)return;try{
  let target=Math.min(90,(l.minute||0)+1);simulateSegment(target);v0712RefreshHud(l);v0712Motion();
  if(l.v067PendingImpact){v0712StopVisual();return v067ShowPendingImpact()}
  if(target===45&&!l.halftimeShown){l.halftimeShown=true;save();v0712StopVisual();return v063RenderHalftime()}
  if(target<90&&v062ShouldPause(l)){l.scenario=makeMatchScenario(l.stopIndex);save();v0712StopVisual();return renderLiveDecision()}
  if(target>=90){v0712StopVisual();return finishRegulation()}
  save();_v0712TickTimer=setTimeout(()=>v0712Advance(token),300)
 }catch(e){console.error('v0712 visual advance',e);v0712StopVisual();try{v063AdvanceUntilDecision()}catch(x){console.error('v0712 fallback',x)}}
}
function v0712ManualSubs(){v0712StopVisual();v06OpenSubs()}

/* Reemplaza la pantalla estática "Simulando...". */
v06RenderMatchHub=function(){let l=S.live;if(!l)return render();if(l.scenario)return renderLiveDecision();v0712RenderVisual()};
runNextStop=function(){v06RenderMatchHub()};
v063AdvanceUntilDecision=function(){if(!S.live)return render();if(S.live.scenario)return renderLiveDecision();v0712RenderVisual()};

/* Al intervenir, la cancha queda congelada arriba de la decisión. */
const _v0712DecisionBase=renderLiveDecision;
renderLiveDecision=function(){
 v0712StopVisual();let l=S.live;if(!l)return render();_v0712DecisionBase();
 let modal=document.querySelector('#modalRoot .modal'),head=modal?.querySelector('.liveHead');if(modal&&head){head.insertAdjacentHTML('afterend',v0712PitchHtml(l,true));let note=document.createElement('div');note.className='v0712Paused';note.textContent='La cancha se detuvo en esta situación. Tu decisión define cómo continúa la jugada.';head.nextElementSibling?.insertAdjacentElement('afterend',note)}
};

/* Cualquier pantalla de cambios pausa la simulación visual y al volver la retoma. */
const _v0712SubsBase=v06OpenSubs;
v06OpenSubs=function(){v0712StopVisual();return _v0712SubsBase()};

/* El entretiempo también corta cualquier temporizador antes de mostrarse. */
const _v0712HalfBase=v063RenderHalftime;
v063RenderHalftime=function(){v0712StopVisual();return _v0712HalfBase()};
v061RenderHalftime=v063RenderHalftime;

/* Un partido guardado en la vieja pantalla puede retomar con la cancha nueva. */
try{if(S?.live){S.live.v0712Visual??={poss:'us',lastEventCount:(S.live.events||[]).length,phase:'ready',motion:0};save()}}catch(e){console.error('v0712 visual migration',e)}
