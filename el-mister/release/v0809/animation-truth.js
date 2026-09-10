/* ===== El Míster v0.8.9 · verdad visual de la jugada =====
   Arreglo exclusivamente visual sobre v0.8.8:
   - NO reemplaza el Motor 2D ni cambia decisiones, minijuegos, probabilidades, goles, reloj o cierre.
   - Las decisiones se dibujan sobre la posición REAL en la que se detuvo el partido.
   - Las continuaciones de una secuencia ya no teletransportan pelota/jugadores: se ve el pase, conducción o avance.
   - Laterales, córners, saques, penales y demás reinicios siguen usando la lógica reglamentaria que ya tiene el motor.
*/
(function(){
  const C=(v,a,b)=>Math.max(a,Math.min(b,v));
  const L=(a,b,t)=>a+(b-a)*t;

  function state(l=S.live){
    try{return typeof em80State==='function'?em80State(l):null}catch(e){return null}
  }
  function players(team,l=S.live){
    try{return typeof em80Players==='function'?em80Players(team,l).filter(p=>p.active!==false):[]}catch(e){return []}
  }
  function owner(team,l=S.live){
    const s=state(l),b=s?.ball;
    if(!b||b.ownerTeam!==team||b.ownerIdx==null)return null;
    try{return typeof em80P==='function'?em80P(team,b.ownerIdx,l):players(team,l).find(p=>p.idx===b.ownerIdx)}catch(e){return null}
  }
  function pickPlayer(team,roles,l=S.live,preferOwner=false){
    const o=preferOwner?owner(team,l):null;if(o)return o;
    const a=players(team,l);return a.find(p=>roles.includes(p.pos))||a[0]||null
  }
  function dir(team){try{return typeof em80Dir==='function'?em80Dir(team):(team==='us'?-1:1)}catch(e){return team==='us'?-1:1}}
  function sideX(x){const w=Number(typeof EM80_W!=='undefined'?EM80_W:68);return x<w/2?w*.18:w*.82}

  /* El destino conserva el sentido de la decisión, pero parte SIEMPRE del lugar real de la pelota. */
  function planTransition(k,l=S.live){
    const s=state(l),b=s?.ball;if(!s||!b)return null;
    const w=Number(typeof EM80_W!=='undefined'?EM80_W:68),sx=Number(b.x??w/2),sy=Number(b.y??50);
    let team='us',roles=['MC','MCO','DC'],prefer=false,dx=sx,dy=sy,label='La jugada continúa';
    const adv=(tm,n)=>C(sy+dir(tm)*n,3,97);
    switch(k){
      case 'inside': roles=['MCO','MC','DC'];dx=w*.5;dy=adv('us',11);label='La pelota viaja por dentro';break;
      case 'wide': roles=['EI','ED','LI','LD'];dx=sideX(sx);dy=adv('us',10);label='La jugada se abre hacia la banda';break;
      case 'duel': roles=['EI','ED','MCO','DC'];prefer=true;dx=C(sx+(sx<w/2?-2.5:2.5),3,w-3);dy=adv('us',7);label='El atacante conduce y fija al defensor';break;
      case 'line': roles=['EI','ED','LI','LD'];prefer=true;dx=C(sideX(sx),3,w-3);dy=adv('us',9);label='El atacante gana metros hacia la línea de fondo';break;
      case 'shot': roles=['DC','MCO','EI','ED'];prefer=true;dx=L(sx,w*.5,.45);dy=adv('us',5);label='Se acomoda para quedar de frente al arco';break;
      case 'finish': roles=['DC','MCO','EI','ED'];dx=L(sx,w*.5,.65);dy=adv('us',11);label='El pase rompe la última línea';break;
      case 'first': roles=['DC','MCO','EI','ED'];dx=L(sx,w*.5,.7);dy=adv('us',8);label='La pelota llega a zona de definición';break;
      case 'second': roles=['MC','MCD','MCO','DC'];dx=L(sx,w*.5,.55);dy=C(sy+dir('us')*Math.min(19,Math.max(8,Math.abs(sy-50)*.55)),8,92);label='La pelota larga cae en la segunda jugada';break;
      case 'pressout': roles=['DFC','MCD','MC'];dx=L(sx,w*.5,.45);dy=adv('us',8);label='Tu equipo supera la primera presión';break;
      case 'counterdef': team='them';roles=['DC','MCO','EI','ED'];dx=L(sx,w*.5,.45);dy=adv('them',10);label='El rival acelera la transición';break;
      case 'keeper': team='them';roles=['DC','MCO','EI','ED'];dx=L(sx,w*.5,.7);dy=adv('them',12);label='El rival entra en zona de mano a mano';break;
      case 'safe': roles=['MCD','MC','DFC','LI','LD'];dx=L(sx,w*.5,.35);dy=adv('us',5);label='Tu equipo recupera y asegura la pelota';break;
      default:return null;
    }
    const p=pickPlayer(team,roles,l,prefer);if(!p)return null;
    return {key:k,team,p,fromBall:{x:sx,y:sy},fromPlayer:{x:Number(p.x??sx),y:Number(p.y??sy)},to:{x:C(dx,2.8,w-2.8),y:C(dy,2.5,97.5)},label};
  }

  function drawDecision(){
    const l=(typeof S!=='undefined'&&S)?S.live:null,c=document.getElementById('em80DecisionCanvas');
    if(c&&l&&typeof em80Draw==='function')em80Draw(c,l);
  }

  function bridgeCanvas(l,label){
    let c=document.getElementById('em80DecisionCanvas');if(c)return c;
    const root=document.getElementById('modalRoot');
    if(!root||typeof em80DecisionPitchHtml!=='function')return null;
    let h='',a='';try{h=club(l.home)?.name||'';a=club(l.away)?.name||''}catch(e){}
    root.innerHTML=`<div class="modalBg"><div class="modal em809Bridge"><div class="liveHead"><div class="row between"><span class="minute">${Number(l.minute)||0}' · JUGADA EN CURSO</span><span class="pill warn">SE VE EN CANCHA</span></div><div class="liveScore">${Number(l.gh)||0} – ${Number(l.ga)||0}</div><div class="muted small">${h} · ${a}</div></div>${em80DecisionPitchHtml()}<div class="small muted center" style="margin-top:9px">${label||'La decisión se ejecuta en la cancha.'}</div></div></div>`;
    return document.getElementById('em80DecisionCanvas');
  }

  function finishGo(k,l,plan){
    const s=state(l),b=s?.ball,p=plan?.p;
    if(s&&b&&plan&&p){
      p.x=plan.to.x;p.y=plan.to.y;p.tx=p.x;p.ty=p.y;p.vx=0;p.vy=0;
      b.x=plan.to.x;b.y=plan.to.y;b.vx=0;b.vy=0;b.flight=null;b.ownerTeam=plan.team;b.ownerIdx=p.idx;b.lastTeam=plan.team;
    }
    try{
      const v=typeof s79==='function'?s79():null;
      l.scenario=typeof seq79==='function'?seq79(k,{back:typeof back79==='function'?back79():null}):l.scenario;
      if(v?.chain)v.chain.stage=k;
      l.em809Transitioning=false;
      save();
      renderLiveDecision();
    }catch(e){
      l.em809Transitioning=false;console.error('em809 finish continuation',e);
      try{save();renderLiveDecision()}catch(x){}
    }
  }

  function animateGo(k,l=S.live){
    if(!l||l.em809Transitioning)return;
    const plan=planTransition(k,l);
    if(!plan)return finishGo(k,l,null);
    l.em809Transitioning=true;
    try{document.querySelectorAll('#modalRoot .choice,#modalRoot .primary,#modalRoot .secondary').forEach(b=>b.disabled=true)}catch(e){}
    const canvas=bridgeCanvas(l,plan.label),s=state(l),b=s?.ball,p=plan.p;
    if(!canvas||!s||!b||typeof requestAnimationFrame!=='function')return finishGo(k,l,plan);
    const oldOwner={team:b.ownerTeam,idx:b.ownerIdx,last:b.lastTeam};
    b.ownerTeam=null;b.ownerIdx=null;b.flight=null;b.lastTeam=oldOwner.last||plan.team;
    const dist=Math.hypot(plan.to.x-plan.fromBall.x,plan.to.y-plan.fromBall.y),dur=C(480+dist*8,540,920),t0=performance.now();
    function frame(now){
      if(S.live!==l)return;
      const t=C((now-t0)/dur,0,1),ease=t*t*(3-2*t),ballT=C((t-.08)/.92,0,1),ballEase=ballT*ballT*(3-2*ballT);
      /* El receptor acompaña la jugada; la pelota recorre físicamente el trayecto en vez de aparecer en destino. */
      p.x=L(plan.fromPlayer.x,plan.to.x,ease);p.y=L(plan.fromPlayer.y,plan.to.y,ease);p.tx=p.x;p.ty=p.y;
      b.x=L(plan.fromBall.x,plan.to.x,ballEase);b.y=L(plan.fromBall.y,plan.to.y,ballEase);
      try{em80Draw(canvas,l)}catch(e){}
      if(t<1)return requestAnimationFrame(frame);
      finishGo(k,l,plan)
    }
    try{em80Draw(canvas,l)}catch(e){}
    requestAnimationFrame(frame)
  }

  /* v0.8.6 envolvía go79 con moveForStage(), que hacía el salto instantáneo.
     Lo reemplazamos por la misma continuación lógica, pero mostrando primero su recorrido. */
  if(typeof go79==='function')go79=function(k){return animateGo(k,S.live)};

  /* Mantener el dibujo de las intervenciones como una foto exacta del Motor 2D. */
  em80DrawDecision=drawDecision;

  window.em809AnimationTruth={version:'0.8.9',drawDecision,planTransition,animateGo,finishGo};
})();
