/* ===== El Míster v0.8.20 · Partido por escenas tácticas =====
   La lógica histórica manda. No hay simulación visual continua.
   El reloj ejecuta simulateSegment(); esta capa solo representa estados y situaciones.
*/
(function(){
  'use strict';
  const EM820={token:0,timer:0,running:false,scene:null,lastSceneMinute:-99,matchKey:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const userSide=l=>l&&l.home===S.clubId?'home':'away';
  const other=s=>s==='home'?'away':'home';
  const sideName=(side,l)=>{try{return club(side==='home'?l.home:l.away).name}catch(e){return side==='home'?'Local':'Visitante'}};
  const matchKey=l=>l?`${l.mode||'match'}|${l.home}|${l.away}|${l.startedAt||l.week||0}|${l.season||S.season||0}`:'none';

  const FALLBACK={
    '4-3-3':[{pos:'EI',x:18,y:19},{pos:'DC',x:50,y:15},{pos:'ED',x:82,y:19},{pos:'MC',x:29,y:44},{pos:'MCD',x:50,y:55},{pos:'MC',x:71,y:44},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-2-3-1':[{pos:'DC',x:50,y:15},{pos:'EI',x:19,y:36},{pos:'MCO',x:50,y:34},{pos:'ED',x:81,y:36},{pos:'MCD',x:36,y:56},{pos:'MCD',x:64,y:56},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-4-2':[{pos:'DC',x:36,y:17},{pos:'DC',x:64,y:17},{pos:'EI',x:17,y:43},{pos:'MC',x:39,y:48},{pos:'MC',x:61,y:48},{pos:'ED',x:83,y:43},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}]
  };

  function formationName(side,l){
    if(side===userSide(l))return FALLBACK[S.formation]?S.formation:'4-2-3-1';
    const explicit=l?.opponentFormation||l?.rivalFormation||l?.aiFormation||l?.em818OpponentFormation||l?.em820OpponentFormation;
    if(explicit&&FALLBACK[explicit])return explicit;
    const forms=['4-2-3-1','4-3-3','4-4-2'],id=String(side==='home'?l?.home:l?.away||'rival');let h=0;
    for(let i=0;i<id.length;i++)h=((h*31)+id.charCodeAt(i))|0;
    const f=forms[Math.abs(h)%forms.length];if(l)l.em820OpponentFormation=f;return f;
  }
  function formationSlots(form){
    try{if(typeof FORMATION_SLOTS!=='undefined'&&Array.isArray(FORMATION_SLOTS[form])&&FORMATION_SLOTS[form].length===11)return FORMATION_SLOTS[form]}catch(e){}
    return FALLBACK[form]||FALLBACK['4-2-3-1'];
  }
  function teamPoints(side,l){
    const form=formationName(side,l),src=formationSlots(form).slice(0,11);
    return src.map((slot,i)=>{
      let x=8+(90-clamp(Number(slot.y)||50,10,92))*.78;
      let y=4+clamp(Number(slot.x)||50,4,96)*.56;
      if(side==='away')x=100-x;
      return {side,i,pos:slot.pos||'MC',x:clamp(x,5,95),y:clamp(y,5,59)};
    });
  }

  function threat(l,who){return Number(l?.flow?.[who==='user'?'userThreat':'oppThreat'])||0}
  function pickScene(l){
    const us=userSide(l),them=other(us),m=Number(l.minute)||0,ud=threat(l,'user'),od=threat(l,'opp');
    let type='midfield',owner=m%9<5?us:them;
    if(ud>od+.75){type='userAttack';owner=us}
    else if(od>ud+.75){type='oppAttack';owner=them}
    else if(m>=70&&typeof scoreForUser==='function'&&scoreForUser(l)<scoreAgainst(l)){type='userAttack';owner=us}
    else if(m%16>=11){type='wing';owner=(m%32<16?us:them)}
    else if(m%12<3){type='build';owner=(m%24<12?us:them)}
    const left=((Math.floor(m/4)+(l.stopIndex||0))%2)===0;
    return sceneObject(type,owner,left,l);
  }
  function sceneObject(type,owner,left,l){
    const dir=owner==='home'?1:-1,attacking=type==='userAttack'||type==='oppAttack';let bx=50,by=32,tx=60,ty=32,title='Partido disputado',text='Los dos equipos se acomodan y buscan encontrar espacios.';
    if(type==='build'){bx=owner==='home'?27:73;by=32;tx=bx+dir*18;ty=left?20:44;title='Salida desde el fondo';text=`${sideName(owner,l)} intenta superar la primera línea de presión.`}
    if(type==='midfield'){bx=50;by=left?25:39;tx=50+dir*15;ty=32;title='Batalla en el mediocampo';text='La pelota cambia de sector y el partido se juega lejos de las áreas.'}
    if(type==='wing'){bx=50+dir*12;by=left?11:53;tx=50+dir*28;ty=left?16:48;title='La jugada se abre por la banda';text=`${sideName(owner,l)} busca progresar por afuera sin romper todavía el partido.`}
    if(attacking){bx=owner==='home'?68:32;by=left?22:42;tx=owner==='home'?88:12;ty=32;title=owner===userSide(l)?'Tu equipo pisa campo rival':'El rival se acerca a tu área';text=owner===userSide(l)?'La jugada gana metros y tus atacantes empiezan a ocupar zonas de peligro.':'La defensa tiene que ordenar marcas y cerrar el camino al arco.'}
    return {type,owner,bx,by,tx,ty,title,text,at:Number(l.minute)||0};
  }

  function scenarioScene(sc,l){
    const us=userSide(l),them=other(us),t=(String(sc?.t||'')+' '+String(sc?.d||'')).toLowerCase();let owner=us,type='midfield',left=t.includes('izquier')||(!t.includes('derech')&&((Number(l.minute)||0)%2===0));
    const rival=t.includes('rival')||t.includes('defend')||t.includes('arquero')||t.includes('ataque')||t.includes('contra');
    if(rival&&!(t.includes('tu ataque')||t.includes('a favor')))owner=them;
    if(t.includes('penal')||t.includes('mano a mano')||t.includes('remate')||t.includes('defin')||t.includes('área')||t.includes('area')||t.includes('tiro libre')||t.includes('córner')||t.includes('corner'))type=owner===us?'userAttack':'oppAttack';
    else if(t.includes('banda')||t.includes('lateral')||t.includes('extremo')||t.includes('centro'))type='wing';
    else if(t.includes('salida')||t.includes('presión')||t.includes('presion'))type='build';
    const o=sceneObject(type,owner,left,l);o.title=sc?.t||o.title;o.text=sc?.d||o.text;return o;
  }

  function tacticLabel(){return S.tactic||'Equilibrado'}
  function nearest(points,x,y,n=3){return [...points].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,n).map(p=>p.i)}
  function boardHtml(scene,l,compact=false){
    const hp=teamPoints('home',l),ap=teamPoints('away',l),hotH=nearest(hp,scene.bx,scene.by,scene.owner==='home'?3:2),hotA=nearest(ap,scene.bx,scene.by,scene.owner==='away'?3:2);
    const dot=p=>`<i class="em820Dot ${p.side} ${(p.side==='home'?hotH:hotA).includes(p.i)?'hot':''}" style="left:${p.x}%;top:${p.y/64*100}%"></i>`;
    return `<div class="em820Board ${compact?'compact':''}"><div class="em820PitchLines"><span class="half"></span><span class="circle"></span><span class="box left"></span><span class="box right"></span></div>${hp.map(dot).join('')}${ap.map(dot).join('')}<i class="em820Ball" style="left:${scene.bx}%;top:${scene.by/64*100}%"></i><svg class="em820Arrow" viewBox="0 0 100 64" preserveAspectRatio="none"><defs><marker id="em820Arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill="rgba(255,255,255,.72)"/></marker></defs><line x1="${scene.bx}" y1="${scene.by}" x2="${scene.tx}" y2="${scene.ty}" marker-end="url(#em820Arr)"/></svg></div>`;
  }

  function eventLines(l){
    const ev=Array.isArray(l.events)?l.events.slice(-4).reverse():[];
    if(!ev.length)return '<div class="em820Quiet">Sin incidencias importantes en los últimos minutos.</div>';
    return ev.map(e=>`<div class="em820Event"><b>${esc(e.m??l.minute)}'</b><span>${esc(e.txt||e.type||'Incidencia')}</span></div>`).join('');
  }
  function renderSceneContent(l,force=false){
    if(!EM820.scene||force||(Number(l.minute)||0)-EM820.lastSceneMinute>=4){EM820.scene=pickScene(l);EM820.lastSceneMinute=Number(l.minute)||0}
    const s=EM820.scene,board=document.getElementById('em820BoardHost'),title=document.getElementById('em820SceneTitle'),text=document.getElementById('em820SceneText'),minute=document.getElementById('em820Minute'),score=document.getElementById('em820Score'),events=document.getElementById('em820Events'),shape=document.getElementById('em820Shape');
    if(board)board.innerHTML=boardHtml(s,l,false);if(title)title.textContent=s.title;if(text)text.textContent=s.text;if(minute)minute.textContent=`${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO`;if(score)score.textContent=`${Number(l.gh)||0} – ${Number(l.ga)||0}`;if(events)events.innerHTML=eventLines(l);if(shape)shape.textContent=`${formationName(userSide(l),l)} · ${tacticLabel()}`;
  }

  function stop820(){EM820.running=false;EM820.token++;if(EM820.timer){clearTimeout(EM820.timer);EM820.timer=0}}
  function stopOld(){try{if(typeof em818Stop==='function')em818Stop()}catch(e){}try{if(typeof em80Stop==='function')em80Stop()}catch(e){}try{if(typeof v0712StopVisual==='function')v0712StopVisual()}catch(e){}}
  function decisionPlan(l){if(l?.em815DecisionPlan)return l.em815DecisionPlan;if(!l.em820DecisionPlan){l.em820DecisionPlan={first:typeof ri==='function'?ri(17,29):22,second:typeof ri==='function'?ri(54,69):61};try{save()}catch(e){}}return l.em820DecisionPlan}
  function shouldPause(l){
    if(!l||l.scenario||Number(l.minute)>=89)return false;
    let old=false;try{old=typeof v062ShouldPause==='function'&&!!v062ShouldPause(l)}catch(e){console.error('em820 historical pause',e)}if(old)return true;
    const p=decisionPlan(l),count=Math.max(Number(l.pauseCount)||0,Number(l.stopIndex)||0);if(!p)return false;
    const force=(count===0&&l.minute>=p.first)||(count===1&&l.minute>=p.second);if(!force)return false;
    l.pauseCount=count+1;l.nextEligibleMinute=l.minute+(typeof ri==='function'?ri(9,14):11);try{save()}catch(e){}return true;
  }
  function makeHistorical(l){try{const s=makeMatchScenario(l.stopIndex);return s&&s.t&&Array.isArray(s.o)&&s.o.length?s:null}catch(e){console.error('em820 historical scenario',e);return null}}
  function pauseDecision(l){
    stop820();stopOld();if(!l.scenario){const sc=makeHistorical(l);if(sc)l.scenario=sc}
    if(!l.scenario){l.nextEligibleMinute=(Number(l.minute)||0)+2;try{save()}catch(e){}return renderMatch820()}
    try{save()}catch(e){};try{return renderLiveDecision()}catch(e){console.error('em820 decision render',e);try{if(typeof em817SafeDecisionFallback==='function')return em817SafeDecisionFallback(l)}catch(x){console.error('em820 safe fallback',x)}}
  }
  function tick820(token){
    if(token!==EM820.token||!EM820.running||!S.live)return;const l=S.live;if(l.scenario)return pauseDecision(l);
    const to=Math.min(90,(Number(l.minute)||0)+1);try{simulateSegment(to)}catch(e){console.error('em820 historical simulateSegment',e);EM820.timer=setTimeout(()=>tick820(token),900);return}
    if(!S.live||S.live!==l)return;renderSceneContent(l,false);
    if(to===45&&!l.halftimeShown){l.halftimeShown=true;try{save()}catch(e){};stop820();return typeof v063RenderHalftime==='function'?v063RenderHalftime():undefined}
    if(to<90&&shouldPause(l))return pauseDecision(l);
    if(to>=90){stop820();return finishRegulation()}
    try{save()}catch(e){}EM820.timer=setTimeout(()=>tick820(token),700);
  }

  function renderMatch820(){
    const l=S.live;if(!l)return typeof render==='function'?render():undefined;if(l.scenario)return renderLiveDecision();stopOld();stop820();
    const key=matchKey(l);if(EM820.matchKey!==key){EM820.matchKey=key;EM820.scene=null;EM820.lastSceneMinute=-99}
    const root=document.getElementById('modalRoot');if(!root)return;const initial=EM820.scene||pickScene(l);EM820.scene=initial;
    root.innerHTML=`<div class="modalBg em820Bg"><div class="modal em820Match"><div class="em820Top"><div><div id="em820Minute" class="em820Minute">${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO</div><div id="em820Score" class="em820Score">${Number(l.gh)||0} – ${Number(l.ga)||0}</div><div class="em820Teams">${esc(sideName('home',l))} · ${esc(sideName('away',l))}</div></div><span class="em820Mode">ESCENAS</span></div><div id="em820BoardHost">${boardHtml(initial,l,false)}</div><div class="em820Meta"><span id="em820Shape">${formationName(userSide(l),l)} · ${esc(tacticLabel())}</span><span>Representación táctica</span></div><div class="em820Narrative"><b id="em820SceneTitle">${esc(initial.title)}</b><p id="em820SceneText">${esc(initial.text)}</p></div><div id="em820Events" class="em820Events">${eventLines(l)}</div><button class="secondary" onclick="em820ManualSubs()">⏸ DT / Cambios</button><div class="em820Hint">El partido se resuelve con el sistema histórico. La cancha solo muestra escenas del encuentro; no simula jugadores en tiempo real.</div></div></div>`;
    EM820.running=true;const token=++EM820.token;renderSceneContent(l,true);EM820.timer=setTimeout(()=>tick820(token),700);
  }

  function decisionPitch(){const l=S.live,sc=l?.scenario;if(!l||!sc)return '';const s=scenarioScene(sc,l);return `<div id="em820DecisionHost" class="em820DecisionHost">${boardHtml(s,l,true)}</div>`}
  function drawDecision(){/* DOM/SVG estático: no existe loop visual que pueda colgar el partido. */}
  function manualSubs(){stop820();stopOld();if(typeof v06OpenSubs==='function')return v06OpenSubs()}

  const baseDecision=renderLiveDecision;
  renderLiveDecision=function(){stop820();stopOld();return baseDecision()};
  em80DecisionPitchHtml=decisionPitch;em80DrawDecision=drawDecision;
  v06RenderMatchHub=function(){const l=S.live;if(!l)return typeof render==='function'?render():undefined;if(l.scenario)return renderLiveDecision();return renderMatch820()};
  runNextStop=function(){return S.live?v06RenderMatchHub():(typeof render==='function'?render():undefined)};
  v063AdvanceUntilDecision=function(){return S.live?v06RenderMatchHub():(typeof render==='function'?render():undefined)};
  v0712RenderVisual=renderMatch820;em80RenderMatch=renderMatch820;
  window.em820ManualSubs=manualSubs;window.em820RenderMatch=renderMatch820;window.em820Stop=stop820;
  window.em820SceneMatch={version:'0.8.20',mode:'scene-event',authority:'historical',continuous:false,scenarioClear:false};

  const st=document.createElement('style');st.id='em820-scene-style';st.textContent=`
  .em820Bg{align-items:flex-start;overflow:auto}.em820Match{max-width:540px}.em820Top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}.em820Minute{font-size:11px;color:var(--muted);font-weight:900;letter-spacing:.05em}.em820Score{font-size:40px;font-weight:1000;line-height:1;margin:6px 0}.em820Teams{font-size:10px;color:var(--muted)}.em820Mode{font-size:9px;font-weight:1000;color:var(--gold);border:1px solid rgba(243,191,77,.35);padding:7px 9px;border-radius:999px;background:rgba(243,191,77,.08)}
  .em820Board{position:relative;width:100%;aspect-ratio:100/64;border-radius:16px;overflow:hidden;background:repeating-linear-gradient(90deg,#173c27 0 10%,#1a432c 10% 20%);border:1px solid rgba(255,255,255,.18);margin:10px 0}.em820PitchLines{position:absolute;inset:3%;border:1.5px solid rgba(255,255,255,.52)}.em820PitchLines .half{position:absolute;left:50%;top:0;bottom:0;border-left:1.5px solid rgba(255,255,255,.52)}.em820PitchLines .circle{position:absolute;width:18%;aspect-ratio:1;border:1.5px solid rgba(255,255,255,.52);border-radius:50%;left:41%;top:35%}.em820PitchLines .box{position:absolute;top:28%;height:44%;width:16%;border:1.5px solid rgba(255,255,255,.52)}.em820PitchLines .box.left{left:0;border-left:0}.em820PitchLines .box.right{right:0;border-right:0}
  .em820Dot{position:absolute;width:10px;height:10px;border-radius:50%;transform:translate(-50%,-50%);border:1.5px solid rgba(255,255,255,.78);z-index:3}.em820Dot.home{background:#6550a8}.em820Dot.away{background:#367256}.em820Dot.hot{box-shadow:0 0 0 4px rgba(243,191,77,.20);border-color:#ffe09a}.em820Ball{position:absolute;width:6px;height:6px;border-radius:50%;background:white;border:1px solid #111;transform:translate(-50%,-50%);z-index:5}.em820Arrow{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}.em820Arrow line{stroke:rgba(255,255,255,.68);stroke-width:.65;stroke-dasharray:2 1}.em820Board.compact{margin:8px 0 12px}.em820Meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:10px;color:#9fb3bf;margin:6px 0 10px}.em820Narrative{padding:12px 13px;border-radius:14px;background:#08151e;border:1px solid #213746;margin-bottom:10px}.em820Narrative b{font-size:12px}.em820Narrative p{margin:5px 0 0;color:#b6c5cd;font-size:11px;line-height:1.4}.em820Events{padding:3px 0 8px}.em820Event{display:flex;gap:9px;padding:6px 3px;border-bottom:1px solid rgba(255,255,255,.05);font-size:10px;color:#b8c8d0}.em820Event b{color:var(--gold);min-width:26px}.em820Quiet{font-size:10px;color:var(--muted);padding:7px 2px}.em820Hint{font-size:9px;color:var(--muted);line-height:1.35;text-align:center;margin-top:8px}.em820DecisionHost{margin:8px 0}
  `;document.head.appendChild(st);
})();
