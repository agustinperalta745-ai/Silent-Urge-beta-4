/* ===== El Míster v0.8.18 · Match2D desacoplado =====
   REGLA: la lógica histórica manda. Este módulo solo dibuja y controla el reloj visible.
   No sustituye makeMatchScenario(), no decide goles y nunca borra S.live.scenario.
*/
(function(){
  'use strict';
  const EM818={
    token:0,logicTimer:0,raf:0,running:false,canvas:null,ctx:null,lastFrame:0,
    matchKey:null,visual:null,visualFailed:false,displayScore:{home:0,away:0},goalLockUntil:0,
    lastEventCount:0
  };
  const clamp818=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp818=(a,b,t)=>a+(b-a)*t;
  const rnd818=(a,b)=>a+Math.random()*(b-a);
  const now818=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
  const safe818=(fn,fallback=null)=>{try{return fn()}catch(e){console.error('[Match2D 0.8.18]',e);return fallback}};

  function userSide818(l=S.live){return l&&l.home===S.clubId?'home':'away'}
  function otherSide818(side){return side==='home'?'away':'home'}
  function matchKey818(l){return l?`${l.mode||'match'}|${l.home}|${l.away}|${l.startedAt||l.week||0}|${l.season||S.season||0}`:'none'}
  function defaultPlan818(){return {line:0,width:0,press:0,tempo:0,direct:0,fullbacks:0,compact:0,risk:0,label:'Equilibrado',key:'balanced'}}

  const BASE_433=[
    ['ARQ',5,32],['LI',18,10],['DFC',15,23],['DFC',15,41],['LD',18,54],
    ['MC',37,18],['MCD',34,32],['MC',37,46],['EI',61,10],['DC',67,32],['ED',61,54]
  ];

  const FORMATION_VISUAL_FALLBACK={
    '4-3-3':[{pos:'EI',x:18,y:19},{pos:'DC',x:50,y:15},{pos:'ED',x:82,y:19},{pos:'MC',x:29,y:44},{pos:'MCD',x:50,y:55},{pos:'MC',x:71,y:44},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-2-3-1':[{pos:'DC',x:50,y:15},{pos:'EI',x:19,y:36},{pos:'MCO',x:50,y:34},{pos:'ED',x:81,y:36},{pos:'MCD',x:36,y:56},{pos:'MCD',x:64,y:56},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-4-2':[{pos:'DC',x:36,y:17},{pos:'DC',x:64,y:17},{pos:'EI',x:17,y:43},{pos:'MC',x:39,y:48},{pos:'MC',x:61,y:48},{pos:'ED',x:83,y:43},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}]
  };

  function formationName818(team,l){
    if(team===userSide818(l))return (S.formation&&FORMATION_VISUAL_FALLBACK[S.formation])?S.formation:'4-2-3-1';
    const explicit=l?.opponentFormation||l?.rivalFormation||l?.aiFormation||l?.em818OpponentFormation;
    if(explicit&&FORMATION_VISUAL_FALLBACK[explicit])return explicit;
    const forms=['4-2-3-1','4-3-3','4-4-2'],id=String(team==='home'?l?.home:l?.away||'rival');
    let h=0;for(let i=0;i<id.length;i++)h=((h*31)+id.charCodeAt(i))|0;
    const picked=forms[Math.abs(h)%forms.length];
    if(l)l.em818OpponentFormation=picked;
    return picked;
  }

  function formationSlots818(form){
    try{if(typeof FORMATION_SLOTS!=='undefined'&&Array.isArray(FORMATION_SLOTS[form])&&FORMATION_SLOTS[form].length===11)return FORMATION_SLOTS[form]}catch(e){}
    return FORMATION_VISUAL_FALLBACK[form]||FORMATION_VISUAL_FALLBACK['4-2-3-1'];
  }

  function roleLayout818(team,l){
    const form=formationName818(team,l),source=formationSlots818(form).slice(0,11);
    return source.map(slot=>{
      let x=8+(90-clamp818(Number(slot.y)||50,10,92))*.78;
      let y=4+clamp818(Number(slot.x)||50,4,96)*.56;
      if(team==='away')x=100-x;
      return {role:slot.pos||'MC',x:clamp818(x,5,95),y:clamp818(y,5,59),formation:form};
    });
  }

  function makePlayers818(team,l){
    return roleLayout818(team,l).map((slot,i)=>({
      id:`${team}-${i}`,team,idx:i,role:slot.role,formation:slot.formation,
      x:slot.x,y:slot.y,baseX:slot.x,baseY:slot.y,tx:slot.x,ty:slot.y,
      speed:rnd818(.82,1.08),seed:(team==='home'?17:43)+i*13+(i%3)*7
    }));
  }

  function ensureVisual818(l=S.live){
    if(!l)return null;
    const key=matchKey818(l);
    if(!EM818.visual||EM818.matchKey!==key){
      EM818.matchKey=key;
      EM818.visual={
        possession:l.isHome?'home':'away',phase:'circulation',phaseLeft:.5,
        players:[...makePlayers818('home',l),...makePlayers818('away',l)],
        ball:{x:50,y:32,owner:'home-6',vx:0,vy:0,target:null},
        plans:{home:defaultPlan818(),away:defaultPlan818()},
        ticker:'La pelota empieza a rodar.',script:null,shotCount:{home:0,away:0}
      };
      EM818.displayScore={home:Number(l.gh)||0,away:Number(l.ga)||0};
      EM818.lastEventCount=Array.isArray(l.events)?l.events.length:0;
      applySavedPlan818(l);
    }
    return EM818.visual;
  }

  function planPreset818(key){
    return ({
      pressHigh:{line:.95,press:1,tempo:.55,risk:.45},
      lowBlock:{line:-.95,press:-.55,compact:.9,tempo:-.30,risk:-.45},
      fullbacksHigh:{fullbacks:1,width:.75,line:.30,risk:.30},
      coverFlanks:{fullbacks:-.2,width:.20,compact:.55,risk:-.15},
      possession:{tempo:-.2,direct:-.9,compact:.25,risk:-.2},
      direct:{tempo:.50,direct:1,risk:.25},
      controlledAttack:{line:.35,tempo:.25,risk:.08},
      extraForward:{line:.50,compact:-.20,risk:.65},
      manageEnergy:{tempo:-.55,press:-.45,risk:-.25},
      shootMore:{tempo:.25,direct:.35,risk:.20},
      targetBooked:{width:.45,tempo:.35,risk:.15},
      diagonal:{width:.20,direct:.45,tempo:.20},
      holdPosition:{compact:.55,line:-.10,risk:-.20},
      calmDuels:{press:-.25,risk:-.25},
      coverBooked:{compact:.60,press:-.10,risk:-.15},
      aggressiveBooked:{press:.55,risk:.55}
    })[key]||null;
  }

  function inferKey818(choice={}){
    if(choice.set)return choice.set;
    const t=String(choice.t||'').toLowerCase();
    if(t.includes('presion'))return 'pressHigh';
    if(t.includes('cerr')||t.includes('aguant')||t.includes('asegurar'))return 'lowBlock';
    if(t.includes('banda')||t.includes('lateral'))return 'fullbacksHigh';
    if(t.includes('pase')||t.includes('pelota')||t.includes('circular')||t.includes('mediocampo'))return 'possession';
    if(t.includes('direct')||t.includes('rápido')||t.includes('rapido')||t.includes('contra'))return 'direct';
    if(t.includes('atac')||t.includes('buscarlo')||t.includes('gol'))return 'controlledAttack';
    return 'balanced';
  }

  function applyChoiceVisual818(choice,l=S.live){
    if(!choice||!l)return;
    const v=ensureVisual818(l),side=userSide818(l),key=inferKey818(choice),base=defaultPlan818(),preset=planPreset818(key);
    if(preset)Object.assign(base,preset);
    const e=choice.e||{},att=Number(e.att)||0,def=Number(e.def)||0;
    base.line=clamp818(base.line+att*8-def*4,-1,1);
    base.risk=clamp818(base.risk+att*7-def*5,-1,1);
    base.label=choice.t||key;base.key=key;
    v.plans[side]=base;
    l.em818VisualPlan={side,key,label:base.label,plan:{...base},at:Number(l.minute)||0};
    v.ticker=`🧠 ${base.label}`;
    try{save()}catch(e2){}
  }

  function applySavedPlan818(l=S.live){
    if(!l||!EM818.visual)return;
    const side=userSide818(l),p=l.em818VisualPlan;
    if(p?.side&&p.plan)EM818.visual.plans[p.side]={...defaultPlan818(),...p.plan};
    else{
      const plan=EM818.visual.plans[side];
      if(S.tactic==='Ofensivo'){Object.assign(plan,planPreset818('controlledAttack')||{});plan.label='Ofensivo';plan.key='controlledAttack'}
      else if(S.tactic==='Defensivo'){Object.assign(plan,planPreset818('lowBlock')||{});plan.label='Defensivo';plan.key='lowBlock'}
      else{plan.label='Equilibrado';plan.key='balanced'}
    }
    const plan=EM818.visual.plans[side];
    if(l.context?.pressHigh){Object.assign(plan,planPreset818('pressHigh')||{});plan.label=p?.label||'Presión alta'}
    if(l.context?.lowBlock){Object.assign(plan,planPreset818('lowBlock')||{});plan.label=p?.label||'Bloque bajo'}
    if(l.context?.fullbacksHigh){Object.assign(plan,planPreset818('fullbacksHigh')||{});plan.label=p?.label||'Laterales altos'}
  }

  function assignBall818(team,index=6){
    const v=EM818.visual;if(!v)return;
    const arr=v.players.filter(p=>p.team===team),p=arr[clamp818(index,0,arr.length-1)]||arr[0];
    if(!p)return;v.possession=team;v.ball.owner=p.id;v.ball.x=p.x;v.ball.y=p.y;v.ball.vx=0;v.ball.vy=0;v.ball.target=null;
  }

  function kick818(x,y,ownerAfter,speed=22){
    const b=EM818.visual?.ball;if(!b)return;
    const dx=x-b.x,dy=y-b.y,d=Math.max(.01,Math.hypot(dx,dy));
    b.owner=null;b.vx=dx/d*speed;b.vy=dy/d*speed;b.target={x,y,ownerAfter};
  }

  function visualPhase818(){
    const v=EM818.visual,l=S.live;if(!v||!l||v.script)return;
    const atk=v.possession,def=otherSide818(atk),ap=v.plans[atk],dp=v.plans[def],roll=Math.random(),pressure=Math.max(0,dp.press)*.11,direct=Math.max(0,ap.direct)*.16;
    if(roll<.09+pressure){assignBall818(def,5+Math.floor(Math.random()*3));v.phase='turnover';v.phaseLeft=rnd818(.35,.75);v.ticker=`${def==='home'?club(l.home).name:club(l.away).name} recupera la pelota.`;return}
    const arr=v.players.filter(p=>p.team===atk),owner=arr.find(p=>p.id===v.ball.owner)||arr[6],dir=atk==='home'?1:-1;
    let targets=arr.filter(p=>dir*(p.x-owner.x)>4);if(!targets.length)targets=arr;
    if(roll<.30+direct){targets.sort((a,b)=>dir*(b.x-a.x));const t=targets[Math.floor(Math.random()*Math.min(4,targets.length))]||arr[9];kick818(t.x,t.y,t.id,30);v.phase='vertical';v.phaseLeft=rnd818(.45,.9);v.ticker='El equipo busca progresar rápido.';return}
    if(roll<.80){const t=targets[Math.floor(Math.random()*targets.length)]||arr[5];kick818(t.x,t.y,t.id,19);v.phase='circulation';v.phaseLeft=rnd818(.5,1.0);v.ticker=ap.direct<-.5?'Circulación paciente para mover al rival.':'El equipo hace correr la pelota.';return}
    const goalX=atk==='home'?98:2;kick818(goalX,rnd818(24,40),null,35);v.phase='shot';v.phaseLeft=.7;v.shotCount[atk]++;v.ticker=`Remate de ${atk==='home'?club(l.home).name:club(l.away).name}.`;
    setTimeout(()=>{if(!EM818.visual||EM818.visual.script)return;assignBall818(def,0)},430);
  }

  function group818(role){
    if(role==='ARQ'||role==='GK')return 'GK';
    if(['LI','LD','LB','RB','DFC','CB','LCB','RCB'].includes(role))return 'DEF';
    if(['MCD','MC','MCO','CM','CDM','CAM','LCM','RCM'].includes(role))return 'MID';
    return 'ATT';
  }
  function isWide818(p){return ['LI','LD','LB','RB','EI','ED','LW','RW'].includes(p.role)}
  function isFullback818(p){return ['LI','LD','LB','RB'].includes(p.role)}
  function dBall818(p,b){return Math.hypot(p.x-b.x,(p.y-b.y)*1.15)}
  function clampAround818(v,base,r){return clamp818(v,base-r,base+r)}

  function individualTarget818(p,v,plan,rank,now){
    const dir=p.team==='home'?1:-1,b=v.ball,g=group818(p.role),has=v.possession===p.team,owner=b.owner===p.id;
    const phase=(Number(p.seed)||1)*.73,slow=Math.sin(now*(.68+(p.idx%4)*.07)+phase),sideWave=Math.cos(now*(.52+(p.idx%5)*.045)+phase*1.7);
    let x=p.baseX,y=p.baseY;
    const lineWeight=g==='DEF'?6.2:g==='MID'?7.6:g==='ATT'?4.3:1.0;
    x+=dir*plan.line*lineWeight;
    const widthWeight=isWide818(p)?1.0:g==='MID'?.62:g==='ATT'?.55:.28;
    y=32+(y-32)*(1+plan.width*.22*widthWeight-plan.compact*.18*(g==='DEF'?.78:1));
    if(isFullback818(p))x+=dir*plan.fullbacks*13;
    if(g==='ATT')x+=dir*plan.direct*2.7;

    if(g==='GK'){
      const ownGoal=p.team==='home'?5:95;
      x=lerp818(x,ownGoal,.78);y=lerp818(y,b.y,.16);
      x+=slow*.18;y+=sideWave*.28;
      return {x:clamp818(x,3,97),y:clamp818(y,8,56)};
    }

    if(has){
      if(owner){
        const maxRun=g==='ATT'?12:g==='MID'?9:6;
        x=clampAround818(p.x+dir*(1.2+Math.max(-.2,plan.tempo)*.8),p.baseX,maxRun);
        y=lerp818(y,b.y,.22)+sideWave*(g==='ATT'?1.15:.72);
      }else if(g==='ATT'){
        const lane=p.baseY<28?-1:p.baseY>36?1:0,run=3.2+Math.max(0,plan.risk)*3.3+(p.idx%3)*.75;
        x+=dir*run;
        if(isWide818(p))y+=lane*(1.7+Math.max(0,plan.width)*2.5)+sideWave*1.0;
        else y=lerp818(y,b.y,.10)+sideWave*.85;
      }else if(g==='MID'){
        if(rank<=1){x=lerp818(x,b.x-dir*(6+rank*3),.22);y=lerp818(y,b.y+(rank===0?-7:7),.18)}
        else{x+=dir*(1.0+Math.max(0,plan.tempo)*1.3);y+=sideWave*.72}
      }else{
        x+=dir*(.5+(p.idx%2)*.7+Math.max(0,plan.line)*1.2);
        y=lerp818(y,b.y,.035+(p.idx%3)*.012)+sideWave*.38;
      }
    }else{
      if(rank===0){
        const chase=g==='ATT'?18:g==='MID'?16:12,amount=.43+Math.max(0,plan.press)*.20;
        x=clampAround818(lerp818(x,b.x,amount),p.baseX,chase);
        y=clampAround818(lerp818(y,b.y,.56+Math.max(0,plan.press)*.15),p.baseY,chase*.72);
      }else if(rank===1){
        const coverX=b.x-dir*(5.5+(g==='DEF'?2:0));
        x=clampAround818(lerp818(x,coverX,.24),p.baseX,g==='DEF'?9:12);
        y=clampAround818(lerp818(y,b.y,.28),p.baseY,9);
      }else{
        const lateral=g==='MID'?.10:g==='DEF'?.065:.055;
        y=lerp818(y,b.y,lateral)+sideWave*(g==='ATT'?.50:g==='MID'?.42:.28);
        if(g==='MID')x-=dir*(.5+Math.max(0,-plan.line)*1.4);
        if(g==='ATT')x-=dir*(1.0+Math.max(0,plan.compact)*1.4);
      }
    }
    const amp=g==='ATT'?.70:g==='MID'?.55:.32;
    x+=slow*amp*.45;y+=sideWave*amp;
    return {x:clamp818(x,3,97),y:clamp818(y,3,61)};
  }

  function updateTargets818(l=S.live){
    const v=EM818.visual;if(!v||!l)return;
    applySavedPlan818(l);
    const now=now818()/1000,ranks={};
    for(const team of ['home','away'])ranks[team]=v.players.filter(p=>p.team===team&&group818(p.role)!=='GK').sort((a,b)=>dBall818(a,v.ball)-dBall818(b,v.ball));
    for(const p of v.players){
      const plan=v.plans[p.team],rank=Math.max(0,ranks[p.team].indexOf(p)),t=individualTarget818(p,v,plan,rank,now);
      p.tx=t.x;p.ty=t.y;
    }
  }

  function updateBall818(dt){
    const v=EM818.visual,b=v?.ball;if(!v||!b)return;
    if(v.script?.type==='goal'){
      const sc=v.script,t=clamp818((now818()-sc.started)/sc.duration,0,1),dir=sc.team==='home'?1:-1;
      b.owner=null;b.x=lerp818(sc.startX,dir>0?99:1,t);b.y=lerp818(sc.startY,32+sc.goalY,t);b.vx=b.vy=0;b.target=null;
      if(t>=1)v.script=null;
      return;
    }
    if(b.owner){const p=v.players.find(x=>x.id===b.owner);if(p){b.x=lerp818(b.x,p.x,.55);b.y=lerp818(b.y,p.y,.55)}return}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.target&&Math.hypot(b.target.x-b.x,b.target.y-b.y)<2){b.x=b.target.x;b.y=b.target.y;if(b.target.ownerAfter)b.owner=b.target.ownerAfter;b.target=null;b.vx=b.vy=0}
    b.x=clamp818(b.x,0,100);b.y=clamp818(b.y,0,64);
  }

  function updateVisual818(dt,l=S.live){
    const v=ensureVisual818(l);if(!v)return;
    if(!v.script){v.phaseLeft-=dt;if(v.phaseLeft<=0)visualPhase818()}
    updateTargets818(l);
    for(const p of v.players){const gain=clamp818(dt*(1.45+p.speed*.9),0,.24);p.x=lerp818(p.x,p.tx,gain);p.y=lerp818(p.y,p.ty,gain)}
    updateBall818(dt);
  }

  function setCanvasSize818(c){
    const r=c.getBoundingClientRect(),dpr=clamp818(window.devicePixelRatio||1,1,2),w=Math.max(280,Math.round(r.width*dpr)),h=Math.max(178,Math.round(r.width*.64*dpr));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h}return {w,h,dpr};
  }
  function color818(id,fallback){try{return club(id)?.c1||fallback}catch(e){return fallback}}
  function drawPitch818(c,l=S.live){
    if(!c||!l)return false;
    try{
      const v=ensureVisual818(l),ctx=c.getContext('2d');if(!ctx)throw new Error('canvas context unavailable');const {w,h}=setCanvasSize818(c),X=x=>x/100*w,Y=y=>y/64*h;
      ctx.clearRect(0,0,w,h);ctx.fillStyle='#173c27';ctx.fillRect(0,0,w,h);
      for(let i=0;i<10;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.018)':'rgba(0,0,0,.018)';ctx.fillRect(i*w/10,0,w/10,h)}
      ctx.strokeStyle='rgba(255,255,255,.58)';ctx.lineWidth=Math.max(1.5,w/330);ctx.strokeRect(X(2),Y(2),X(96),Y(60));ctx.beginPath();ctx.moveTo(X(50),Y(2));ctx.lineTo(X(50),Y(62));ctx.stroke();ctx.beginPath();ctx.arc(X(50),Y(32),X(9),0,Math.PI*2);ctx.stroke();ctx.strokeRect(X(2),Y(18),X(16),Y(28));ctx.strokeRect(X(82),Y(18),X(16),Y(28));ctx.strokeRect(X(2),Y(25),X(6),Y(14));ctx.strokeRect(X(92),Y(25),X(6),Y(14));
      const hc=color818(l.home,'#64a7ff'),ac=color818(l.away,'#ff6d73'),rad=Math.max(4,w/85);
      for(const p of v.players){ctx.beginPath();ctx.arc(X(p.x),Y(p.y),rad,0,Math.PI*2);ctx.fillStyle=p.team==='home'?hc:ac;ctx.fill();ctx.lineWidth=Math.max(1,w/500);ctx.strokeStyle='rgba(255,255,255,.88)';ctx.stroke()}
      ctx.beginPath();ctx.arc(X(v.ball.x),Y(v.ball.y),Math.max(2.7,w/155),0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.stroke();
      EM818.visualFailed=false;return true;
    }catch(e){console.error('[Match2D draw isolated]',e);EM818.visualFailed=true;return false}
  }

  function fallbackVisual818(){
    const wrap=document.getElementById('em818CanvasWrap');if(!wrap||wrap.dataset.failed)return;wrap.dataset.failed='1';wrap.innerHTML='<div class="em818VisualFallback">La vista 2D se reinició. El partido y las decisiones siguen funcionando.</div>';
  }

  function frame818(ts){
    const token=EM818.token;if(!EM818.running||!S.live)return;
    const dt=Math.min(.10,Math.max(.012,(ts-(EM818.lastFrame||ts))/1000));EM818.lastFrame=ts;
    safe818(()=>updateVisual818(dt,S.live));
    if(EM818.canvas&&!drawPitch818(EM818.canvas,S.live))fallbackVisual818();
    updateHud818(S.live);
    if(token===EM818.token&&EM818.running)EM818.raf=requestAnimationFrame(frame818);
  }

  function updateHud818(l=S.live){
    if(!l)return;const v=EM818.visual,m=document.getElementById('em818Minute'),sc=document.getElementById('em818Score'),meta=document.getElementById('em818Meta'),ticker=document.getElementById('em818Ticker'),plan=document.getElementById('em818Plan');
    if(m)m.textContent=`${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO`;
    if(sc)sc.textContent=`${EM818.displayScore.home} – ${EM818.displayScore.away}`;
    if(meta&&v){const poss=v.possession==='home'?club(l.home).name:club(l.away).name;meta.textContent=`Posesión visual: ${poss} · Remates ${v.shotCount.home}-${v.shotCount.away}`}
    if(ticker&&v)ticker.textContent=v.ticker||'Partido en juego';
    if(plan&&v){const p=v.plans[userSide818(l)];plan.textContent=`Plan: ${p.label||'Equilibrado'}`}
  }

  function stageGoal818(team,l=S.live){
    const v=ensureVisual818(l);if(!v)return;
    const dir=team==='home'?1:-1,arr=v.players.filter(p=>p.team===team),att=arr.find(p=>['DC','ST'].includes(p.role))||arr[9]||arr[0];
    v.possession=team;v.script={type:'goal',team,started:now818(),duration:900,startX:att?att.x:(dir>0?70:30),startY:att?att.y:32,goalY:rnd818(-5,5)};v.ticker=`⚽ ¡GOL de ${team==='home'?club(l.home).name:club(l.away).name}!`;
    EM818.goalLockUntil=Date.now()+980;
  }

  function syncLogicEvents818(l,before){
    const after={home:Number(l.gh)||0,away:Number(l.ga)||0};
    if(after.home>before.home)stageGoal818('home',l);else if(after.away>before.away)stageGoal818('away',l);
    if(after.home===before.home&&after.away===before.away)EM818.displayScore=after;
    else setTimeout(()=>{if(S.live===l){EM818.displayScore={home:Number(l.gh)||0,away:Number(l.ga)||0};updateHud818(l)}},920);
    const ev=Array.isArray(l.events)?l.events:[];
    if(ev.length>EM818.lastEventCount){const last=ev[ev.length-1];if(last?.txt&&!String(last.txt).includes('🧠'))EM818.visual.ticker=String(last.txt);EM818.lastEventCount=ev.length}
  }

  function decisionPlan818(l){
    if(l?.em815DecisionPlan)return l.em815DecisionPlan;
    if(!l.em818DecisionPlan){l.em818DecisionPlan={first:typeof ri==='function'?ri(17,29):22,second:typeof ri==='function'?ri(54,69):61};try{save()}catch(e){}}
    return l.em818DecisionPlan;
  }
  function shouldPause818(l){
    if(!l||l.scenario||Number(l.minute)>=89)return false;
    let old=false;try{old=typeof v062ShouldPause==='function'&&!!v062ShouldPause(l)}catch(e){console.error('em818 historical pause',e)}if(old)return true;
    const p=decisionPlan818(l),count=Math.max(Number(l.pauseCount)||0,Number(l.stopIndex)||0);if(!p)return false;
    const force=(count===0&&l.minute>=p.first)||(count===1&&l.minute>=p.second);if(!force)return false;
    l.pauseCount=count+1;l.nextEligibleMinute=l.minute+(typeof ri==='function'?ri(9,14):11);try{save()}catch(e){}return true;
  }

  function buildHistoricalScenario818(l){
    const builders=[];
    try{if(typeof makeMatchScenario==='function')builders.push(makeMatchScenario)}catch(e){}
    try{if(typeof _79sc==='function')builders.push(_79sc)}catch(e){}
    try{if(typeof _v062BaseScenario==='function')builders.push(_v062BaseScenario)}catch(e){}
    for(const fn of builders){try{const s=fn(l.stopIndex);if(s&&s.t&&Array.isArray(s.o)&&s.o.length)return s}catch(e){console.error('em818 historical scenario builder',e)}}
    return null;
  }

  function pauseForDecision818(l=S.live){
    if(!l)return;stop818(true);
    if(!l.scenario){const s=buildHistoricalScenario818(l);if(s)l.scenario=s}
    if(!l.scenario){console.error('em818: no historical scenario available; retrying later');l.nextEligibleMinute=(Number(l.minute)||0)+2;renderMatch818();return}
    try{save()}catch(e){}
    try{return renderLiveDecision()}catch(e){console.error('em818 render historical decision',e);try{if(typeof em817SafeDecisionFallback==='function')em817SafeDecisionFallback(l)}catch(x){console.error('em818 decision fallback',x)}}
  }

  function logicTick818(token){
    if(token!==EM818.token||!EM818.running||!S.live)return;const l=S.live;
    if(l.scenario)return pauseForDecision818(l);
    const wait=Math.max(0,EM818.goalLockUntil-Date.now());if(wait>0){EM818.logicTimer=setTimeout(()=>logicTick818(token),wait+20);return}
    const from=Number(l.minute)||0,to=Math.min(90,from+1),before={home:Number(l.gh)||0,away:Number(l.ga)||0};
    try{simulateSegment(to)}catch(e){console.error('em818 historical simulateSegment',e);EM818.logicTimer=setTimeout(()=>logicTick818(token),900);return}
    if(!S.live||S.live!==l)return;
    syncLogicEvents818(l,before);updateHud818(l);
    if(to===45&&!l.halftimeShown){l.halftimeShown=true;try{save()}catch(e){};stop818(true);return typeof v063RenderHalftime==='function'?v063RenderHalftime():undefined}
    if(to<90&&shouldPause818(l))return pauseForDecision818(l);
    if(to>=90){stop818(true);return finishRegulation()}
    try{save()}catch(e){}EM818.logicTimer=setTimeout(()=>logicTick818(token),700);
  }

  function stopOldVisual818(){
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    try{if(typeof v0712StopVisual==='function'&&v0712StopVisual!==stop818)v0712StopVisual()}catch(e){}
  }
  function stop818(keepSnapshot=false){
    EM818.running=false;EM818.token++;if(EM818.logicTimer){clearTimeout(EM818.logicTimer);EM818.logicTimer=0}if(EM818.raf){cancelAnimationFrame(EM818.raf);EM818.raf=0}EM818.canvas=null;EM818.ctx=null;EM818.lastFrame=0;if(!keepSnapshot)EM818.goalLockUntil=0;
  }

  function renderMatch818(){
    const l=S.live;if(!l)return typeof render==='function'?render():undefined;if(l.scenario)return renderLiveDecision();
    stopOldVisual818();stop818(true);ensureVisual818(l);EM818.displayScore={home:Number(l.gh)||0,away:Number(l.ga)||0};
    const root=document.getElementById('modalRoot');if(!root)return;
    try{
      root.innerHTML=`<div class="modalBg em818MatchBg"><div class="modal em818Match"><div class="em818Top"><div><div id="em818Minute" class="em818Minute">${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO</div><div id="em818Score" class="em818Score">${l.gh} – ${l.ga}</div><div class="em818Teams">${club(l.home).name} · ${club(l.away).name}</div></div><span class="em818Mode">MATCH 2D</span></div><div id="em818CanvasWrap" class="em818CanvasWrap"><canvas id="em818Canvas" class="em818Canvas"></canvas></div><div class="em818Info"><span id="em818Plan">Plan: Equilibrado</span><span id="em818Meta">Simulación visual</span></div><div id="em818Ticker" class="em818Ticker">${EM818.visual?.ticker||'Partido en juego'}</div><button class="secondary" onclick="em818ManualSubs()">⏸ DT / Cambios</button><div class="em818Hint">El resultado y las situaciones siguen usando el sistema histórico. Match2D solamente representa lo que pasa en cancha.</div></div></div>`;
      EM818.canvas=document.getElementById('em818Canvas');if(!EM818.canvas)throw new Error('Match2D canvas missing');drawPitch818(EM818.canvas,l);
    }catch(e){
      console.error('em818 visual mount',e);EM818.visualFailed=true;root.innerHTML=`<div class="modalBg"><div class="modal"><div class="liveHead"><div class="minute">${l.minute}' · PARTIDO EN JUEGO</div><div id="em818Score" class="liveScore">${l.gh} – ${l.ga}</div><div class="muted small">${club(l.home).name} · ${club(l.away).name}</div></div><div class="notice">La vista 2D no pudo iniciarse, pero el partido sigue con su lógica normal.</div><button class="secondary" onclick="em818ManualSubs()">⏸ DT / Cambios</button></div></div>`;
    }
    EM818.running=true;EM818.lastFrame=now818();const token=EM818.token;EM818.raf=requestAnimationFrame(frame818);EM818.logicTimer=setTimeout(()=>logicTick818(token),700);updateHud818(l);
  }

  function decisionPitch818(){return '<div class="em818DecisionBoard"><div id="em818DecisionWrap" class="em818CanvasWrap"><canvas id="em818DecisionCanvas" class="em818Canvas"></canvas></div></div>'}
  function drawDecision818(){const c=document.getElementById('em818DecisionCanvas');if(c&&S.live){ensureVisual818(S.live);if(!drawPitch818(c,S.live)){const w=document.getElementById('em818DecisionWrap');if(w)w.innerHTML='<div class="em818VisualFallback">Vista 2D en reinicio. La decisión sigue activa.</div>'}}}
  function manualSubs818(){stop818(true);stopOldVisual818();if(typeof v06OpenSubs==='function')return v06OpenSubs()}

  const baseResolve818=resolveMatchChoice;
  resolveMatchChoice=function(i){
    const l=S.live,s=l?.scenario,o=s?.o?.[i];
    const out=baseResolve818(i);
    if(o&&l)try{applyChoiceVisual818(o,l)}catch(e){console.error('em818 mirror choice',e)}
    return out;
  };

  const baseRenderDecision818=renderLiveDecision;
  renderLiveDecision=function(){stop818(true);stopOldVisual818();const out=baseRenderDecision818();setTimeout(drawDecision818,0);return out};

  em80DecisionPitchHtml=decisionPitch818;
  em80DrawDecision=drawDecision818;
  v06RenderMatchHub=function(){const l=S.live;if(!l)return typeof render==='function'?render():undefined;if(l.scenario)return renderLiveDecision();return renderMatch818()};
  runNextStop=function(){return S.live?v06RenderMatchHub():(typeof render==='function'?render():undefined)};
  v063AdvanceUntilDecision=function(){return S.live?v06RenderMatchHub():(typeof render==='function'?render():undefined)};
  v0712RenderVisual=renderMatch818;
  em80RenderMatch=renderMatch818;
  window.em818ManualSubs=manualSubs818;
  window.em818RenderMatch=renderMatch818;
  window.em818Stop=stop818;
  window.em818Match2D={version:'0.8.18',authority:'historical',visual:'isolated-read-only',scenarioClear:false};

  try{
    const st=document.createElement('style');st.id='em818-match2d-style';st.textContent=`
      .em818MatchBg{align-items:flex-start;overflow:auto}.em818Match{max-width:540px}.em818Top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}.em818Minute{font-size:11px;color:var(--muted);font-weight:900;letter-spacing:.06em}.em818Score{font-size:38px;font-weight:1000;line-height:1;margin:6px 0}.em818Teams{font-size:10px;color:var(--muted)}.em818Mode{font-size:9px;font-weight:1000;color:var(--gold);border:1px solid rgba(243,191,77,.35);background:rgba(243,191,77,.08);padding:7px 9px;border-radius:999px}.em818CanvasWrap{width:100%;aspect-ratio:100/64;background:#173c27;border:1px solid rgba(255,255,255,.18);border-radius:15px;overflow:hidden;margin:10px 0}.em818Canvas{display:block;width:100%;height:100%}.em818Info{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:10px;color:#a9bbc6;margin:7px 0}.em818Ticker{min-height:34px;padding:9px 11px;background:#08151e;border:1px solid #1f3543;border-radius:12px;font-size:11px;color:#d7e3e9;margin-bottom:10px}.em818Hint{font-size:9px;color:var(--muted);line-height:1.35;text-align:center;margin-top:8px}.em818VisualFallback{height:100%;min-height:150px;display:grid;place-items:center;text-align:center;padding:20px;color:#b7c8d1;font-size:11px;background:#0d1d25}.em818DecisionBoard{margin:8px 0 12px}`;document.head.appendChild(st);
  }catch(e){console.error('em818 css',e)}

  stopOldVisual818();
})();
