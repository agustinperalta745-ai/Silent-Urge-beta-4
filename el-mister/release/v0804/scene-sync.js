/* ===== El Míster v0.8.4 · escenas coherentes + cierre visual del gol =====
   Alcance: sincroniza la fotografía de cada intervención con lo que describe
   y, tras un gol nacido de una intervención/minijuego, muestra la pelota entrando
   antes del saque del medio rival. NO modifica la lógica normal del Motor 2D.
*/
(function(){
  function em804Clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function em804Text(sc){return `${sc?.key||''} ${sc?.t||''} ${sc?.d||''}`.toLowerCase()}
  function em804Stamp(sc){return `${sc?.key||sc?.kind||'s'}|${sc?.stage||0}|${sc?.t||''}`}
  function em804Place(p,x,y){if(!p)return;p.x=em804Clamp(x,2.8,EM80_W-2.8);p.y=em804Clamp(y,2.5,97.5);p.tx=p.x;p.ty=p.y;p.vx=0;p.vy=0}
  function em804BaseX(team,p,l){try{let q=(typeof em80BaseSlots==='function'?em80BaseSlots(team):[])[p.idx];return q?.x??p.x}catch(e){return p.x}}
  function em804RoleY(p,team,mode){
    let pos=p.pos||'MC',def=['DFC','LI','LD'].includes(pos),mid=['MCD','MC','MCO'].includes(pos),att=['EI','ED','MI','MD','DC','SD'].includes(pos);
    if(mode==='attack'){
      if(team==='us'){if(pos==='ARQ')return 92;if(def)return 68;if(mid)return 47;if(att)return 30;return 48}
      if(pos==='ARQ')return 6;if(def)return 21;if(mid)return 38;if(att)return 56;return 40
    }
    if(mode==='defend'){
      if(team==='us'){if(pos==='ARQ')return 94;if(def)return 80;if(mid)return 68;if(att)return 51;return 66}
      if(pos==='ARQ')return 6;if(def)return 31;if(mid)return 51;if(att)return 73;return 53
    }
    if(mode==='mid'){
      if(team==='us'){if(pos==='ARQ')return 92;if(def)return 72;if(mid)return 54;if(att)return 38;return 54}
      if(pos==='ARQ')return 7;if(def)return 28;if(mid)return 46;if(att)return 62;return 46
    }
    return p.y
  }
  function em804Shape(mode,l=S.live){
    if(!l||!['attack','defend','mid'].includes(mode))return;
    let s=em80State(l);for(let team of ['us','them'])for(let p of em80Players(team,l)){let x=em804BaseX(team,p,l),y=em804RoleY(p,team,mode);em804Place(p,x,y)}
    if(s?.ball?.flight)s.ball.flight=null
  }
  function em804FindUser(id,l=S.live){let a=em80Players('us',l);return (id&&a.find(p=>p.id===id))||a.find(p=>p.pos==='DC')||a.find(p=>['MCO','MC','EI','ED'].includes(p.pos))||a[0]}
  function em804FindThem(pos,l=S.live){let a=em80Players('them',l);return a.find(p=>p.pos===pos)||a.find(p=>p.pos==='DC')||a[0]}
  function em804OwnBall(team,p,l=S.live,x=null,y=null){let s=em80State(l);if(!s||!p)return;if(x!=null&&y!=null)em804Place(p,x,y);let dir=em80Dir(team);s.ball={x:p.x,y:p.y+dir*.65,vx:0,vy:0,ownerTeam:team,ownerIdx:p.idx,lastTeam:team,flight:null}}
  function em804SceneType(sc){
    let z=em804Text(sc),k=String(sc?.key||'').toLowerCase();
    if(k==='penalty'||/penal para|punto penal/.test(z))return'penalty';
    if(k==='corner'||/córner|corner/.test(z))return'corner';
    if(k==='freekick'||/tiro libre|24 metros|pelota parada peligrosa/.test(z))return'freekick';
    if(k==='v067_longshot'||/28 metros|pegarle de lejos|remate desde la medialuna|probar desde la medialuna/.test(z))return'longshot';
    if(k==='v067_volley'||/de aire|volea/.test(z))return'volley';
    if(k==='v067_rebound'||/rebote suelto/.test(z))return'rebound';
    if(k==='v067_one_touch'||/borde del área|definir de primera|ángulo de remate/.test(z))return'edge';
    if(k==='oneonone'||/mano a mano|cara a cara|rompe la última línea/.test(z))return'oneonone';
    if(/línea de fondo|2 contra 1 por la banda|banda/.test(z)&&sc?.kind==='seq79')return'wide';
    if(/saque lateral|segunda pelota|mitad de cancha|recibe entre líneas/.test(z))return'mid';
    if(/salida limpia|presión rival|salir de la presión|aprieta arriba/.test(z))return'buildout';
    if(/laterales arriba|te agarraron|rival queda mano a mano|lateral cansado|carga sobre tu lateral/.test(z))return'defend';
    if(k==='em803_striker'||/delantero queda demasiado aislado/.test(z))return'striker';
    if(k==='em803_pin'||/rival defendiendo muy cerca de su área/.test(z))return'attack';
    return null
  }
  function em804StageScenario(sc=S.live?.scenario,l=S.live){
    if(!sc||!l||typeof em80State!=='function')return false;
    let stamp=em804Stamp(sc);if(l.em804SceneStamp===stamp)return true;
    let type=em804SceneType(sc);if(!type){l.em804SceneStamp=stamp;return false}
    let s=em80State(l),actor=em804FindUser(sc.playerId,l),oppGK=em804FindThem('ARQ',l),team='us';
    if(type==='defend'){em804Shape('defend',l);team='them';let opp=em804FindThem('DC',l);em804OwnBall('them',opp,l,EM80_W*.52,77);actor=opp}
    else if(type==='buildout'){em804Shape('defend',l);actor=em804FindUser(sc.playerId,l);if(!actor||actor.pos==='ARQ')actor=em80Players('us',l).find(p=>['DFC','MCD','MC'].includes(p.pos))||actor;em804OwnBall('us',actor,l,EM80_W*.48,78)}
    else if(type==='mid'){em804Shape('mid',l);actor=em804FindUser(sc.playerId,l);em804OwnBall('us',actor,l,EM80_W*.50,50)}
    else if(type==='striker'){em804Shape('mid',l);let striker=em80Players('us',l).find(p=>p.pos==='DC')||actor,mid=em80Players('us',l).find(p=>['MCO','MC'].includes(p.pos))||actor;em804Place(striker,EM80_W*.5,31);em804Place(em80Players('them',l).find(p=>p.pos==='DFC'),EM80_W*.43,27);let defs=em80Players('them',l).filter(p=>p.pos==='DFC');if(defs[1])em804Place(defs[1],EM80_W*.57,27);em804OwnBall('us',mid,l,EM80_W*.48,47);actor=mid}
    else{
      em804Shape('attack',l);
      if(type==='penalty'){
        em804Place(oppGK,EM80_W*.5,5.2);em804OwnBall('us',actor,l,EM80_W*.5,12.2);
        em80Players('us',l).filter(p=>p!==actor&&p.pos!=='ARQ').forEach((p,i)=>em804Place(p,EM80_W*(.26+(i%5)*.12),25+(i>4?5:0)));
        em80Players('them',l).filter(p=>p!==oppGK).forEach((p,i)=>em804Place(p,EM80_W*(.22+(i%6)*.11),24+(i>5?5:0)));
      }else if(type==='corner'){
        let side=(Math.random()<.5?.06:.94),x=EM80_W*side;em804OwnBall('us',actor,l,x,4.6);em804Place(oppGK,EM80_W*.5,5.5);
        let usBox=em80Players('us',l).filter(p=>p!==actor&&p.pos!=='ARQ');usBox.forEach((p,i)=>em804Place(p,EM80_W*(.28+(i%5)*.11),13+(i%3)*4));
        em80Players('them',l).filter(p=>p!==oppGK).forEach((p,i)=>em804Place(p,EM80_W*(.25+(i%6)*.10),11+(i%4)*4));
      }else if(type==='freekick'){
        em804OwnBall('us',actor,l,EM80_W*.5,23.5);em804Place(oppGK,EM80_W*.5,5.5);let wall=em80Players('them',l).filter(p=>p.pos!=='ARQ').slice(0,4);wall.forEach((p,i)=>em804Place(p,EM80_W*(.43+i*.047),15.5));
      }else if(type==='longshot'){em804OwnBall('us',actor,l,EM80_W*.5,27.0);em804Place(oppGK,EM80_W*.5,5.5)}
      else if(type==='volley'||type==='edge'){em804OwnBall('us',actor,l,EM80_W*.5,20.5);em804Place(oppGK,EM80_W*.5,5.5)}
      else if(type==='rebound'){em804OwnBall('us',actor,l,EM80_W*.47,15.8);em804Place(oppGK,EM80_W*.58,8.5)}
      else if(type==='oneonone'){em804OwnBall('us',actor,l,EM80_W*.5,15.5);em804Place(oppGK,EM80_W*.5,7.4)}
      else if(type==='wide'){let x=EM80_W*.84;em804OwnBall('us',actor,l,x,17.5);em804Place(oppGK,EM80_W*.5,5.5)}
      else {em804OwnBall('us',actor,l,actor?.x??EM80_W*.5,actor?.y??31)}
    }
    l.em804SceneStamp=stamp;l.em804Scene={stamp,type,team,actorId:actor?.id||null,actorIdx:actor?.idx??null,ball:{x:s.ball.x,y:s.ball.y},at:l.minute};
    try{save()}catch(e){}
    return true
  }

  const _em804DrawDecision=typeof em80DrawDecision==='function'?em80DrawDecision:null;
  if(_em804DrawDecision)em80DrawDecision=function(){try{em804StageScenario(S.live?.scenario,S.live)}catch(e){console.warn('em804 stage',e)}return _em804DrawDecision()};

  function em804GoalActor(l){
    let scene=l?.em804Scene;if(scene?.actorId){let p=em80Players('us',l).find(x=>x.id===scene.actorId);if(p)return p}
    let sc=l?.scenario;if(sc?.playerId){let p=em80Players('us',l).find(x=>x.id===sc.playerId);if(p)return p}
    return (typeof em80BallOwner==='function'?em80BallOwner(l):null)||em80Players('us',l).find(p=>['DC','MCO','EI','ED','MC'].includes(p.pos))||em80Players('us',l)[0]
  }
  const _em804TeamGoal=teamGoal;
  teamGoal=function(teamId,m,source='jugada'){
    let l=S.live,visualGoal=!!(l&&teamId===S.clubId&&typeof EM80!=='undefined'&&!EM80.running&&!!l.scenario);
    let actor=visualGoal?em804GoalActor(l):null,before=l?.events?.length||0;
    let r=_em804TeamGoal(teamId,m,source);
    if(visualGoal&&l){
      let s=em80State(l),start=actor?{x:actor.x,y:actor.y+em80Dir('us')*.65}:{x:s.ball.x,y:s.ball.y};
      l.em804PendingGoal={team:'us',playerId:actor?.id||null,playerIdx:actor?.idx??null,start,target:{x:EM80_W/2,y:1.2},source,minute:m};
      let ev=(l.events||[]).slice(before).reverse().find(e=>e.type==='goal'&&e.teamId===S.clubId);
      if(ev&&actor?.id){let rp=S.roster.find(x=>x.id===actor.id);if(rp){ev.playerId=rp.id;ev.txt=`⚽ ${rp.name} (${club(S.clubId).name}) — ${source}`}}
      try{save()}catch(e){}
    }
    return r
  };

  const _em804RunNextStop=runNextStop;
  function em804GoalShell(l){
    let s=em80State(l),pct=typeof em80PossessionPct==='function'?em80PossessionPct(l):50;
    document.getElementById('modalRoot').innerHTML=`<div class="modalBg em80MatchBg"><div class="modal"><div class="em80Top"><div><div class="em80Minute">${l.minute}' · GOL</div><div class="em80Score">${l.gh} – ${l.ga}</div><div class="em80Teams">${club(l.home).name} · ${club(l.away).name}</div></div><span class="em80Mode">MOTOR 2D</span></div><div class="em80CanvasWrap"><canvas id="em804GoalCanvas" class="em80Canvas"></canvas></div><div class="em80Meta"><span><b>${club(S.clubId).name}</b> · definición</span><span>Posesión ${pct}% · Remates ${s.shots?.us||0}-${s.shots?.them||0}</span></div><div id="em804GoalTicker" class="em80Ticker"><b>${l.minute}'</b> La jugada termina en el arco.</div></div></div>`;
    return document.getElementById('em804GoalCanvas')
  }
  function em804PlayGoalResume(l=S.live){
    let g=l?.em804PendingGoal;if(!l||!g)return _em804RunNextStop();
    l.em804PendingGoal=null;l.em804PlayingGoal=true;try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    let s=em80State(l),canvas=em804GoalShell(l),actor=g.playerId?em80Players('us',l).find(p=>p.id===g.playerId):null,start=actor?{x:actor.x,y:actor.y+em80Dir('us')*.65}:g.start,target=g.target||{x:EM80_W/2,y:1.2};
    s.ball={x:start.x,y:start.y,vx:0,vy:0,ownerTeam:null,ownerIdx:null,lastTeam:'us',flight:null};em80Draw(canvas,l);
    let t0=performance.now(),dur=650;
    function frame(now){let t=em804Clamp((now-t0)/dur,0,1),ease=t*t*(3-2*t);s.ball.x=start.x+(target.x-start.x)*ease;s.ball.y=start.y+(target.y-start.y)*ease;em80Draw(canvas,l);if(t<1)return requestAnimationFrame(frame);
      let tick=document.getElementById('em804GoalTicker');if(tick)tick.innerHTML=`<b>${l.minute}'</b> La pelota entra. El rival vuelve al círculo central.`;
      setTimeout(()=>{try{if(typeof em801Kickoff==='function')em801Kickoff('them',l,'Saca el rival desde el medio después del gol.');else em80Restart('them','kickoff',l)}catch(e){console.warn('em804 kickoff',e)}em80Draw(canvas,l);let t2=document.getElementById('em804GoalTicker');if(t2)t2.innerHTML=`<b>${l.minute}'</b> Saque del medio del rival.`;try{save()}catch(e){}setTimeout(()=>{l.em804PlayingGoal=false;l.em804Scene=null;l.em804SceneStamp=null;_em804RunNextStop()},600)},360)
    }
    requestAnimationFrame(frame)
  }
  runNextStop=function(){let l=S.live;if(l?.em804PendingGoal&&!l.em804PlayingGoal)return em804PlayGoalResume(l);return _em804RunNextStop()};

  window.em804StageScenario=em804StageScenario;
  window.em804SceneType=em804SceneType;
})();
