/* ===== El Míster v0.8.15 · continuidad real de goles + DT siempre participa =====
   No cambia las situaciones ni los minijuegos históricos.
   Corrige dos puentes:
   1) los goles de simulateSegment se representan desde la posición REAL de la pelota antes de tocar el marcador;
   2) el sistema histórico conserva su aleatoriedad, pero se garantizan al menos dos oportunidades de intervención por partido.
*/
(function(){
  const previousTeamGoal=teamGoal;
  let inLogicTick=false;

  function teamKey(teamId,l=S.live){return teamId===S.clubId?'us':'them'}
  function clamp815(v,a,b){return Math.max(a,Math.min(b,v))}
  function smooth815(t){t=clamp815(t,0,1);return t*t*(3-2*t)}
  function stopKeepCanvas(){
    if(typeof EM80==='undefined')return;
    EM80.running=false;EM80.token++;
    if(EM80.raf){cancelAnimationFrame(EM80.raf);EM80.raf=0}
    if(EM80.minuteTimer){clearTimeout(EM80.minuteTimer);EM80.minuteTimer=0}
  }
  function commitGoal(q,l=S.live){
    if(!l||!q)return;
    const old=!!l.em804PlayingGoal;
    l.em815CommittingGoal=true;l.em804PlayingGoal=true;
    try{previousTeamGoal(q.teamId,q.m,q.source||'jugada')}
    finally{l.em804PlayingGoal=old;l.em815CommittingGoal=false}
  }

  teamGoal=function(teamId,m,source='jugada'){
    const l=S.live,regulation=(Number(m??l?.minute)||0)<=90;
    if(l&&inLogicTick&&regulation&&!l.scenario&&!l.em815CommittingGoal){
      l.em815GoalQueue??=[];
      l.em815GoalQueue.push({teamId,m:Number(m??l.minute)||l.minute,source:source||'jugada'});
      try{save()}catch(e){}
      return null;
    }
    return previousTeamGoal(teamId,m,source)
  };

  function decisionPlan(l=S.live){
    if(!l)return null;
    if(!l.em815DecisionPlan){
      l.em815DecisionPlan={first:ri(17,29),second:ri(54,69)};
      try{save()}catch(e){}
    }
    return l.em815DecisionPlan
  }
  function shouldPauseHistorical(l=S.live){
    if(!l||l.scenario||l.minute>=89)return false;
    let old=false;
    try{old=!!v062ShouldPause(l)}catch(e){console.error('em815 historical pause',e)}
    if(old)return true;
    const p=decisionPlan(l),count=Math.max(Number(l.pauseCount)||0,Number(l.stopIndex)||0);
    if(!p)return false;
    const force=(count===0&&l.minute>=p.first)||(count===1&&l.minute>=p.second);
    if(!force)return false;
    l.pauseCount=count+1;
    l.nextEligibleMinute=l.minute+ri(9,14);
    try{save()}catch(e){}
    return true
  }

  function pointAt(a,b,t){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}
  function goalPoint(team){return{x:EM80_W/2+(Math.random()-.5)*7,y:team==='us'?1.1:98.9}}
  function shotPoint(team,start){
    const gy=team==='us'?17.5:82.5;
    return{x:clamp815(start.x*.25+(EM80_W/2)*.75+(Math.random()-.5)*7,EM80_W*.28,EM80_W*.72),y:gy}
  }
  function currentOwnerTeam(l=S.live){
    try{return em80BallOwner(l)?.team||em80State(l)?.ball?.ownerTeam||em80State(l)?.ball?.lastTeam||null}catch(e){return null}
  }

  function afterLogicalMinute(l,to){
    if(!l||S.live!==l)return;
    if(l.v067PendingImpact){
      try{em80Stop()}catch(e){}
      return typeof v067ShowPendingImpact==='function'?v067ShowPendingImpact():undefined
    }
    if(to===45&&!l.halftimeShown){
      l.halftimeShown=true;try{save()}catch(e){};try{em80Stop()}catch(e){}
      return typeof v063RenderHalftime==='function'?v063RenderHalftime():undefined
    }
    if(to<90&&shouldPauseHistorical(l)){
      return em80PauseForDecision(l)
    }
    if(to>=90){
      try{em80Stop()}catch(e){}
      return finishRegulation()
    }
    try{save()}catch(e){}
    return typeof em80RenderMatch==='function'?em80RenderMatch():v06RenderMatchHub()
  }

  function playQueuedGoal(l=S.live,to=Number(l?.minute)||0){
    if(!l||l.em815GoalVisualActive)return;
    const q=l.em815GoalQueue?.shift();
    if(!q)return afterLogicalMinute(l,to);
    l.em815GoalVisualActive=true;
    stopKeepCanvas();

    const canvas=EM80.canvas||document.getElementById('em80Canvas');
    if(!canvas){
      commitGoal(q,l);l.em815GoalVisualActive=false;
      try{save()}catch(e){}
      return l.em815GoalQueue?.length?playQueuedGoal(l,to):afterLogicalMinute(l,to)
    }

    const s=em80State(l),b=s.ball,team=teamKey(q.teamId,l),ownerBefore=currentOwnerTeam(l);
    const start={x:Number(b.x)||EM80_W/2,y:Number(b.y)||50};
    const actor=(ownerBefore===team?em80BallOwner(l):null)||em80Nearest(team,start,l).p;
    const actorStart=actor?{x:actor.x,y:actor.y}:start;
    const strike=shotPoint(team,start),goal=goalPoint(team),dir=em80Dir(team);

    b.ownerTeam=null;b.ownerIdx=null;b.flight=null;b.lastTeam=team;b.x=start.x;b.y=start.y;
    const ticker=document.getElementById('em80Ticker');
    const lost=ownerBefore&&ownerBefore!==team;
    if(ticker)ticker.innerHTML=`<b>${l.minute}'</b> ${lost?(team==='us'?'Recuperás y salís rápido.':'Perdés la pelota y el rival sale rápido.'):(team==='us'?'Tu ataque acelera hacia el área.':'El rival acelera la jugada hacia tu área.')}`;

    const t0=performance.now(),duration=2100;
    function frame(now){
      if(S.live!==l)return;
      const t=clamp815((now-t0)/duration,0,1);
      if(t<.18){
        const z=smooth815(t/.18);
        if(actor){actor.x=actorStart.x+(start.x-actorStart.x)*z;actor.y=actorStart.y+(start.y-actorStart.y)*z;actor.tx=actor.x;actor.ty=actor.y}
        b.x=start.x;b.y=start.y
      }else if(t<.72){
        const z=smooth815((t-.18)/.54),mid={x:(start.x+strike.x)/2+(start.x<EM80_W/2?3:-3),y:(start.y+strike.y)/2};
        let pos;
        if(z<.5)pos=pointAt(start,mid,smooth815(z*2));else pos=pointAt(mid,strike,smooth815((z-.5)*2));
        if(actor){actor.x=pos.x;actor.y=pos.y;actor.tx=pos.x;actor.ty=pos.y;actor.vx=0;actor.vy=0}
        b.x=pos.x;b.y=pos.y+dir*.65
      }else{
        const z=smooth815((t-.72)/.28),from={x:strike.x,y:strike.y+dir*.65},pos=pointAt(from,goal,z);
        if(actor){actor.x=strike.x;actor.y=strike.y;actor.tx=strike.x;actor.ty=strike.y}
        b.x=pos.x;b.y=pos.y
      }
      try{em80Draw(canvas,l)}catch(e){}
      if(t<1)return requestAnimationFrame(frame);

      commitGoal(q,l);
      try{em80UpdateHud(l)}catch(e){}
      if(ticker)ticker.innerHTML=`<b>${l.minute}'</b> ${team==='us'?'¡GOL! La jugada que viste termina en la red.':'Gol rival. La jugada que viste termina en tu arco.'}`;
      try{save()}catch(e){}
      setTimeout(()=>{
        try{if(typeof em801Kickoff==='function')em801Kickoff(em80Opp(team),l,'Saque del medio después del gol.');else em80Restart(em80Opp(team),'kickoff',l)}catch(e){console.warn('em815 kickoff',e)}
        l.em815GoalVisualActive=false;
        try{save()}catch(e){}
        if(l.em815GoalQueue?.length)return playQueuedGoal(l,to);
        return afterLogicalMinute(l,to)
      },650)
    }
    requestAnimationFrame(frame)
  }

  em80MinuteTick=function(token){
    if(token!==EM80.token||!EM80.running||!S.live)return;
    const l=S.live,from=Number(l.minute)||0,to=Math.min(90,from+1);
    inLogicTick=true;
    try{simulateSegment(to)}
    catch(e){console.error('em815 legacy segment',e);try{em80Stop()}catch(x){};return}
    finally{inLogicTick=false}
    if(!S.live)return;
    try{em80UpdateHud(l)}catch(e){}
    if(Array.isArray(l.em815GoalQueue)&&l.em815GoalQueue.length){
      EM80.minuteTimer=0;
      return playQueuedGoal(l,to)
    }
    return afterLogicalMinute(l,to)
  };

  // Si una versión anterior dejó un gol visual pendiente al cerrar/reabrir la app,
  // lo trasladamos al nuevo puente en vez de dejar el partido congelado.
  try{
    if(S?.live){
      const l=S.live;
      l.em815GoalQueue??=[];
      if(Array.isArray(l.em805GoalQueue)&&l.em805GoalQueue.length){l.em815GoalQueue.push(...l.em805GoalQueue);l.em805GoalQueue=[]}
      l.em805GoalVisualActive=false;
      decisionPlan(l);save()
    }
  }catch(e){console.error('em815 migration',e)}

  window.em815MatchTruth={version:'0.8.15',goalVisual:'continuous-before-score',interventions:'historical-minimum-two'};
})();
