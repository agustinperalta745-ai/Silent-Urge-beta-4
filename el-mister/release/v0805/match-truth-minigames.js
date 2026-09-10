/* ===== El Míster v0.8.5 · una sola verdad de partido + minijuegos recalibrados =====
   Alcance: NO modifica el movimiento normal, pases ni físicas del Motor 2D.
   1) Todo gol de la simulación debe verse en la cancha antes de subir al marcador.
   2) Los minijuegos recuperan dificultad media/adaptativa, especialmente la barrita.
*/
(function(){
  function em805Clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function em805TeamFromId(teamId){return teamId===S.clubId?'us':'them'}
  function em805GoalPoint(team){return {x:EM80_W/2,y:team==='us'?1.2:98.8}}
  function em805NearVisualGoal(team,l=S.live){
    try{
      let s=em80State(l),b=s?.ball;if(!b)return false;
      let gy=team==='us'?1:99;
      return Math.abs(b.y-gy)<=4.8&&Math.abs(b.x-EM80_W/2)<=EM80_GOAL_HALF+4.5
    }catch(e){return false}
  }
  function em805Attacker(team,l=S.live){
    let arr=em80Players(team,l).filter(p=>p.active!==false),owner=em80BallOwner(l);
    if(owner&&owner.team===team)return owner;
    return arr.find(p=>p.pos==='DC')||arr.find(p=>['EI','ED','MCO','MC'].includes(p.pos))||arr[0]
  }
  function em805PauseKeepCanvas(){
    EM80.running=false;EM80.token++;
    if(EM80.raf){cancelAnimationFrame(EM80.raf);EM80.raf=0}
    if(EM80.minuteTimer){clearTimeout(EM80.minuteTimer);EM80.minuteTimer=0}
  }
  function em805PlaceGoalScene(team,l=S.live){
    let s=em80State(l),dir=em80Dir(team),goal=em805GoalPoint(team),actor=em805Attacker(team,l),opp=em80Players(em80Opp(team),l),gk=opp.find(p=>p.pos==='ARQ');
    let ay=team==='us'?17:83,ax=EM80_W*(.44+Math.random()*.12);
    if(actor){actor.x=ax;actor.y=ay;actor.tx=ax;actor.ty=ay;actor.vx=0;actor.vy=0}
    if(gk){gk.x=EM80_W/2;gk.y=team==='us'?5.8:94.2;gk.tx=gk.x;gk.ty=gk.y;gk.vx=0;gk.vy=0}
    let defs=opp.filter(p=>p!==gk&&['DFC','LI','LD','MCD'].includes(p.pos)).slice(0,5);
    defs.forEach((p,i)=>{let x=EM80_W*(.25+(i%5)*.125),y=team==='us'?11+(i%2)*5:89-(i%2)*5;p.x=x;p.y=y;p.tx=x;p.ty=y;p.vx=0;p.vy=0});
    s.ball={x:actor?.x??ax,y:(actor?.y??ay)+dir*.75,vx:0,vy:0,ownerTeam:null,ownerIdx:null,lastTeam:team,flight:null};
    return {actor,start:{x:s.ball.x,y:s.ball.y},goal}
  }

  const em805TeamGoalBase=teamGoal;
  function em805QueueGoal(teamId,m,source){
    let l=S.live;if(!l)return;
    l.em805GoalQueue??=[];
    l.em805GoalQueue.push({teamId,m,source:source||'jugada'});
    try{save()}catch(e){}
    if(!l.em805GoalVisualActive)setTimeout(()=>em805PlayQueuedGoal(l),0)
  }
  function em805PlayQueuedGoal(l=S.live){
    if(!l||l.em805GoalVisualActive)return;
    let q=l.em805GoalQueue?.shift();if(!q)return;
    l.em805GoalVisualActive=true;
    let canvas=EM80.canvas||document.getElementById('em80Canvas');
    em805PauseKeepCanvas();
    if(!canvas){
      l.em805GoalVisualActive=false;em805TeamGoalBase(q.teamId,q.m,q.source);try{save()}catch(e){};
      return typeof v06RenderMatchHub==='function'?v06RenderMatchHub():null
    }
    let team=em805TeamFromId(q.teamId),scene=em805PlaceGoalScene(team,l),s=em80State(l),ticker=document.getElementById('em80Ticker');
    if(ticker)ticker.innerHTML=`<b>${q.m}'</b> ${team==='us'?'Tu equipo':'El rival'} termina la jugada: viene el remate.`;
    try{em80Draw(canvas,l)}catch(e){}
    let start=scene.start,target=scene.goal,t0=performance.now(),dur=720;
    function frame(now){
      let t=em805Clamp((now-t0)/dur,0,1),ease=t*t*(3-2*t);
      s.ball.x=start.x+(target.x-start.x)*ease;s.ball.y=start.y+(target.y-start.y)*ease;
      try{em80Draw(canvas,l)}catch(e){}
      if(t<1)return requestAnimationFrame(frame);
      em805TeamGoalBase(q.teamId,q.m,q.source);
      if(ticker)ticker.innerHTML=`<b>${q.m}'</b> ¡Gol! La pelota entra y recién ahora cambia el marcador.`;
      try{em80UpdateHud(l);save()}catch(e){}
      setTimeout(()=>{
        try{em80Restart(em80Opp(team),'kickoff',l);em80Draw(canvas,l)}catch(e){}
        if(ticker)ticker.innerHTML=`<b>${q.m}'</b> Saca ${team==='us'?'el rival':'tu equipo'} desde el círculo central.`;
        setTimeout(()=>{
          l.em805GoalVisualActive=false;try{save()}catch(e){}
          if(l.em805GoalQueue?.length)return em805PlayQueuedGoal(l);
          if(S.live===l&&!l.scenario&&l.minute<90)return em80RenderMatch();
          if(S.live===l&&l.minute>=90)return finishRegulation();
        },650)
      },650)
    }
    requestAnimationFrame(frame)
  }
  teamGoal=function(teamId,m,source='jugada'){
    let l=S.live;
    if(!l||typeof EM80==='undefined'||!l.v0800)return em805TeamGoalBase(teamId,m,source);
    let team=em805TeamFromId(teamId),scenarioGoal=!!l.scenario||!!l.em804PlayingGoal,regulation=(m??l.minute)<=90;
    if(regulation&&!scenarioGoal&&!em805NearVisualGoal(team,l)){
      em805QueueGoal(teamId,m,source);
      return null
    }
    return em805TeamGoalBase(teamId,m,source)
  };

  // Barritas: menos margen y más velocidad, con ayuda moderada por habilidad.
  function em805BarParams(d,hard=false){
    let diff=Number(d?.difficulty||60),imp=Number(d?.importance||50),skill=Number(d?.skill||70);
    let width=(hard?15.1:18.2)-diff*(hard?.071:.064)-Math.max(0,imp-50)*(hard?.026:.020)+(skill-70)*(hard?.020:.024);
    width=em805Clamp(width,hard?6.5:8.2,hard?11.5:14.2);
    let speed=.094+diff*.00066+Math.max(0,imp-50)*.00034-(skill-70)*.00012;
    speed=em805Clamp(speed,.105,.178);
    return {width,speed}
  }

  v067ShotAim=function(zone){
    let g=_v067ShotGame;if(!g)return;g.zone=zone;
    let d=g.diff,hard=g.type==='long'||g.type==='volley',p=em805BarParams(d,hard),center=ri(22,78);
    g.center=center;g.width=p.width;g.speed=p.speed;g.pos=0;g.dir=1;g.last=performance.now();g.stopped=false;
    openModal(`<div class="eyebrow">🎯 TIMING DEL REMATE</div><h2>${S.roster.find(x=>x.id===g.pid)?.name}</h2><p>Frená dentro de la zona verde. El margen cambia con la presión del partido y la dificultad de la acción.${hard?' Este remate exige mucha precisión.':''}</p><div class="skillTrack"><div class="skillZone" style="left:${center-p.width/2}%;width:${p.width}%"></div><div id="v067ShotMarker" class="skillMarker"></div></div><button class="primary" onclick="v067StopShot()">REMATAR</button>`);
    requestAnimationFrame(v067AnimateShot)
  };

  v067StopShot=function(){
    let g=_v067ShotGame;if(!g||g.stopped)return;g.stopped=true;
    let p=S.roster.find(x=>x.id===g.pid),l=S.live,d=g.diff,dist=Math.abs(g.pos-g.center),inside=dist<=g.width/2,perfect=dist<=g.width*.18,skill=d.skill,hard=(g.type==='long'||g.type==='volley'),zoneBonus=g.zone==='center'?-.02:g.zone==='left'?.01:.025;
    let chance=.12+(inside?.25:.02)+(skill-60)*.0037-(d.difficulty-55)*.0024+zoneBonus-(hard?.035:0);chance=clamp(chance,.035,.72);
    let goal=Math.random()<chance,title,icon,feedback;
    if(goal){teamGoal(S.clubId,l.minute,hard?'golazo':'remate');let golazo=hard&&(perfect||d.difficulty>=78)&&Math.random()<.68;title=golazo?'¡GOLAZO!':'¡GOL!';icon='⚽';feedback=golazo?`${p.name} saca un remate espectacular que se mete donde no llega nadie.`:`${p.name} encuentra el hueco y define la jugada.`}
    else{title=pick(inside?['ATAJÓ','PALO','BLOQUEADO']:['AFUERA','BLOQUEADO','ATAJÓ']);icon=title==='PALO'?'🥅':'❌';feedback=inside?'La ejecución fue buena, pero la jugada no termina adentro.':`${p.name} no logra darle la precisión necesaria al remate.`}
    v062FinishMiniDecision(goal,title,icon,feedback,[inside?'Timing correcto':'Timing impreciso',perfect?'Contacto perfecto':'Resolución bajo presión'],g.choice)
  };

  track79start=function(p){
    let g=_79mini,d=v062Difficulty(p,g.kind==='tackle'||g.kind==='press'?'defense':g.kind==='dribble'?'dribble':g.kind==='first'?'finish':g.kind==='freekick'?'setpiece':'finish'),hard=['first','freekick','tackle'].includes(g.kind),bp=em805BarParams(d,hard),center=ri(20,80);
    Object.assign(g,{d,width:bp.width,center,speed:bp.speed,pos:0,dir:1,last:performance.now(),done:false});
    let verb=g.kind==='tackle'?'ENTRAR':g.kind==='press'?'PRESIONAR':g.kind==='first'?'REMATAR':g.kind==='freekick'?'PATEAR':'ENCARAR';
    openModal(`<div class="eyebrow">${g.kind==='tackle'?'🛡️ CORTE':g.kind==='press'?'🔥 PRESIÓN':g.kind==='first'?'💥 REMATE':g.kind==='freekick'?'🎯 TIRO LIBRE':'⚡ DUELO'}</div><h2>${p.name}</h2><p>Esperá el momento y frená dentro de la zona marcada. La ventana es corta: necesitás precisión.</p><div class="skillTrack"><div class="skillZone" style="left:${center-bp.width/2}%;width:${bp.width}%"></div><div id="m79mark" class="skillMarker"></div></div><button class="primary" onclick="stop79track()">${verb}</button>`);
    _79raf=requestAnimationFrame(anim79track)
  };

  // Los otros minijuegos también suben un escalón, sin volverse frustrantes.
  lane79start=function(p){
    let g=_79mini,d=v062Difficulty(p,'passing'),ms=Math.round(em805Clamp(940-d.difficulty*4.0-Math.max(0,(d.importance||50)-50)*1.7+(d.skill-70)*1.4,520,880));
    Object.assign(g,{d,open:ri(0,2),done:false});
    openModal(`<div class="eyebrow">${g.kind==='playout'?'🧩 SALIDA':'🧠 PASE FILTRADO'}</div><h2>${p.name}</h2><p>${g.kind==='playout'?'La presión cambia de receptor. Tocá al compañero que quede libre.':'La última línea se mueve. Tocá el carril que se abra.'}</p><div id="m79lanes" class="laneGame"></div>`);
    render79lane();_79laneTimer=setInterval(()=>{if(!_79mini||_79mini.done)return;let n=ri(0,2);if(n===_79mini.open)n=(n+1)%3;_79mini.open=n;render79lane()},ms)
  };
  mem79start=function(p){
    let g=_79mini,d=v062Difficulty(p,'cross'),show=Math.round(em805Clamp(980-d.difficulty*3.4-Math.max(0,(d.importance||50)-50)*1.4+(d.skill-70)*1.2,500,900)),target=ri(0,3);
    Object.assign(g,{d,target,done:false});
    openModal(`<div class="eyebrow">${g.kind==='cross'?'🎯 CENTRO':'↩️ PASE ATRÁS'}</div><h2>${p.name}</h2><p>Memorizá la zona marcada. Va a desaparecer rápido.</p><div id="m79grid" class="grid2">${[0,1,2,3].map(i=>`<button class="choice ${i===target?'selected':''}" disabled><b>${i===target?'● LLEGADA':'·'}</b><span>${['Primer palo','Punto penal','Segundo palo','Frontal'][i]}</span></button>`).join('')}</div>`);
    _79memTimer=setTimeout(()=>{if(!_79mini||_79mini.done)return;let e=document.getElementById('m79grid');if(e)e.innerHTML=[0,1,2,3].map(i=>`<button class="choice" onclick="pick79mem(${i})"><b>Elegir zona</b><span>${['Primer palo','Punto penal','Segundo palo','Frontal'][i]}</span></button>`).join('')},show)
  };
  keeper79start=function(p){
    let g=_79mini,d=v062Difficulty(p,'keeper'),delay=Math.round(em805Clamp(1050-d.difficulty*3.5+(d.skill-70)*1.2,600,1050)),response=Math.round(em805Clamp(820-d.difficulty*3.2-Math.max(0,(d.importance||50)-50)*1.3+(d.skill-70)*1.1,430,760));
    Object.assign(g,{d,target:ri(0,2),done:false});
    openModal(`<div class="eyebrow">🧤 MANO A MANO</div><h2>${p.name}</h2><p>Aguardá el remate. Cuando aparezca la dirección, elegí rápido el sector.</p><div id="m79keep" class="grid3"><button class="choice"><b>↙</b><span>Izquierda</span></button><button class="choice"><b>↓</b><span>Centro</span></button><button class="choice"><b>↘</b><span>Derecha</span></button></div>`);
    setTimeout(()=>{let e=document.getElementById('m79keep');if(!_79mini||_79mini.done||!e)return;e.innerHTML=[0,1,2].map(i=>`<button class="choice ${i===g.target?'selected':''}" onclick="pick79keeper(${i})"><b>${i===g.target?'⚽':' '}</b><span>${['Izquierda','Centro','Derecha'][i]}</span></button>`).join('');_79memTimer=setTimeout(()=>{if(_79mini&&!_79mini.done)pick79keeper(-1)},response)},delay)
  };

  window.em805PlayQueuedGoal=em805PlayQueuedGoal;
  window.em805BarParams=em805BarParams;
})();
