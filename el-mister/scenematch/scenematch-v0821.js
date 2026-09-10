/* ===== El Míster v0.8.21 · Jugadas tácticas deterministas =====
   La lógica histórica del partido sigue mandando.
   Esta capa visual NO decide resultados: representa cada situación con un guion fijo por frames.
*/
(function(){
  'use strict';

  const EM821={
    token:0,timer:0,frameTimer:0,running:false,scene:null,play:null,
    lastSceneMinute:-99,matchKey:null,frame:0
  };

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const userSide=l=>l&&l.home===S.clubId?'home':'away';
  const other=s=>s==='home'?'away':'home';
  const sideName=(side,l)=>{try{return club(side==='home'?l.home:l.away).name}catch(e){return side==='home'?'Local':'Visitante'}};
  const matchKey=l=>l?`${l.mode||'match'}|${l.home}|${l.away}|${l.startedAt||l.week||0}|${l.season||S.season||0}`:'none';
  const dirFor=side=>side==='home'?-1:1; // home at bottom, away at top

  const FALLBACK={
    '4-3-3':[{pos:'EI',x:18,y:19},{pos:'DC',x:50,y:15},{pos:'ED',x:82,y:19},{pos:'MC',x:29,y:44},{pos:'MCD',x:50,y:55},{pos:'MC',x:71,y:44},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-2-3-1':[{pos:'DC',x:50,y:15},{pos:'EI',x:19,y:36},{pos:'MCO',x:50,y:34},{pos:'ED',x:81,y:36},{pos:'MCD',x:36,y:56},{pos:'MCD',x:64,y:56},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-4-2':[{pos:'DC',x:36,y:17},{pos:'DC',x:64,y:17},{pos:'EI',x:17,y:43},{pos:'MC',x:39,y:48},{pos:'MC',x:61,y:48},{pos:'ED',x:83,y:43},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}]
  };

  function formationName(side,l){
    if(side===userSide(l))return FALLBACK[S.formation]?S.formation:'4-2-3-1';
    const explicit=l?.opponentFormation||l?.rivalFormation||l?.aiFormation||l?.em818OpponentFormation||l?.em820OpponentFormation||l?.em821OpponentFormation;
    if(explicit&&FALLBACK[explicit])return explicit;
    const forms=['4-2-3-1','4-3-3','4-4-2'],id=String(side==='home'?l?.home:l?.away||'rival');let h=0;
    for(let i=0;i<id.length;i++)h=((h*31)+id.charCodeAt(i))|0;
    const f=forms[Math.abs(h)%forms.length];if(l)l.em821OpponentFormation=f;return f;
  }
  function formationSlots(form){
    try{if(typeof FORMATION_SLOTS!=='undefined'&&Array.isArray(FORMATION_SLOTS[form])&&FORMATION_SLOTS[form].length===11)return FORMATION_SLOTS[form]}catch(e){}
    return FALLBACK[form]||FALLBACK['4-2-3-1'];
  }
  function roleGroup(role){
    const r=String(role||'').toUpperCase();
    if(['ARQ','GK','POR'].includes(r))return 'GK';
    if(['LI','LD','LB','RB','DFC','CB','LCB','RCB'].includes(r))return 'DEF';
    if(['MCD','MC','MCO','CM','CDM','CAM','LCM','RCM','MI','MD'].includes(r))return 'MID';
    return 'ATT';
  }
  function isFullback(role){return ['LI','LD','LB','RB'].includes(String(role||'').toUpperCase())}
  function isWide(role){return ['LI','LD','LB','RB','EI','ED','LW','RW','MI','MD'].includes(String(role||'').toUpperCase())}

  function tacticalFlags(side,l){
    const isUser=side===userSide(l),ctx=l?.context||{},vp=l?.em818VisualPlan||l?.em80VisualPlan||{};
    const tactic=isUser?String(S.tactic||'Equilibrado').toLowerCase():String(l?.opponentTactic||'equilibrado').toLowerCase();
    const label=String(vp?.label||vp?.plan?.label||'').toLowerCase();
    const key=String(vp?.key||vp?.plan?.key||'').toLowerCase();
    return {
      offensive:tactic.includes('ofens')||label.includes('ofens')||key.includes('attack'),
      defensive:tactic.includes('defens')||label.includes('bloque bajo')||key.includes('lowblock'),
      pressHigh:!!ctx.pressHigh||label.includes('presión alta')||label.includes('presion alta')||key.includes('presshigh'),
      lowBlock:!!ctx.lowBlock||label.includes('bloque bajo')||key.includes('lowblock'),
      fullbacksHigh:!!ctx.fullbacksHigh||label.includes('laterales')||key.includes('fullback')
    };
  }

  function redInfo(side,l){
    const ev=Array.isArray(l?.events)?l.events:[],name=sideName(side,l).toLowerCase(),teamId=side==='home'?l?.home:l?.away,out=[];
    for(const e of ev){
      const t=String(e?.txt||e?.type||'').toLowerCase();
      if(!(t.includes('🔴')||t.includes('roja')||t.includes('expuls')))continue;
      const eid=e?.teamId??e?.clubId??e?.team;
      const belongs=(eid!=null&&String(eid)===String(teamId))||t.includes(name);
      if(belongs)out.push(t);
    }
    return out;
  }
  function removeDismissed(points,side,l){
    const reds=redInfo(side,l);if(!reds.length)return points;
    const arr=[...points];
    for(const txt of reds){
      let wanted=txt.includes('volante')?'MID':txt.includes('defensor')?'DEF':txt.includes('delanter')?'ATT':null;
      let idx=arr.findIndex(p=>roleGroup(p.pos)===wanted&&roleGroup(p.pos)!=='GK');
      if(idx<0)idx=arr.findIndex(p=>roleGroup(p.pos)!=='GK');
      if(idx>=0)arr.splice(idx,1);
    }
    return arr;
  }

  function teamPoints(side,l){
    const form=formationName(side,l),src=formationSlots(form).slice(0,11),flags=tacticalFlags(side,l),dir=dirFor(side);
    let pts=src.map((slot,i)=>{
      let x=4+clamp(Number(slot.x)||50,4,96)*.56;
      let y=clamp(Number(slot.y)||50,5,95);
      if(side==='away'){x=64-x;y=100-y}
      const g=roleGroup(slot.pos),fb=isFullback(slot.pos);
      let shift=0;
      if(flags.offensive)shift+=dir*3.0;
      if(flags.defensive)shift+=-dir*2.5;
      if(flags.pressHigh)shift+=dir*(g==='GK'?0:g==='DEF'?3.0:g==='MID'?5.0:6.5);
      if(flags.lowBlock)shift+=-dir*(g==='GK'?0:g==='DEF'?4.0:g==='MID'?5.0:3.0);
      if(flags.fullbacksHigh&&fb)shift+=dir*7.0;
      y+=shift;
      if(flags.lowBlock&&g!=='GK')x=32+(x-32)*.88;
      return {id:`${side}-${i}`,side,i,pos:slot.pos||'MC',x:clamp(x,3.5,60.5),y:clamp(y,4,96)};
    });
    return removeDismissed(pts,side,l);
  }

  function threat(l,who){return Number(l?.flow?.[who==='user'?'userThreat':'oppThreat'])||0}
  function recentEvent(l){
    const ev=Array.isArray(l?.events)?l.events:[];if(!ev.length)return null;
    const last=ev[ev.length-1],m=Number(last?.m);return Number.isFinite(m)&&Math.abs((Number(l?.minute)||0)-m)<=1?last:null;
  }
  function pickScene(l){
    const us=userSide(l),them=other(us),m=Number(l.minute)||0,ud=threat(l,'user'),od=threat(l,'opp'),ctx=l?.context||{};
    let type='midfield',owner=m%9<5?us:them;
    if(ud>od+.75){type='attack';owner=us}
    else if(od>ud+.75){type='attack';owner=them}
    else if(m>=70&&typeof scoreForUser==='function'&&scoreForUser(l)<scoreAgainst(l)){type='attack';owner=us}
    else if(m%16>=11){type='wing';owner=(m%32<16?us:them)}
    else if(m%12<3){type='build';owner=(m%24<12?us:them)}
    if(ctx.pressHigh&&owner===them)type='press';
    if(ctx.lowBlock&&owner===them)type='defend';
    if(ctx.fullbacksHigh&&owner===us)type='wing';
    const left=((Math.floor(m/4)+(l.stopIndex||0))%2)===0;
    const ev=recentEvent(l),et=String(ev?.txt||ev?.type||'').toLowerCase();
    if(et.includes('🔴')||et.includes('roja')||et.includes('expuls'))return sceneObject('reorganize',owner,left,l);
    return sceneObject(type,owner,left,l);
  }
  function sceneObject(type,owner,left,l){
    const us=userSide(l);let title='Partido disputado',text='Los dos equipos mantienen sus líneas y buscan el momento para progresar.';
    if(type==='build'){title='Salida limpia desde atrás';text=`${sideName(owner,l)} abre líneas de pase para superar la primera presión.`}
    else if(type==='midfield'){title='La jugada pasa por el medio';text=`${sideName(owner,l)} intenta progresar sin romper la estructura del equipo.`}
    else if(type==='wing'){title='Progresión por la banda';text=`${sideName(owner,l)} carga un costado y genera un apoyo para avanzar.`}
    else if(type==='attack'){title=owner===us?'Tu equipo pisa zona de ataque':'El rival entra en zona de peligro';text=owner===us?'Los de arriba coordinan un desmarque y una línea de pase.':'Tu defensa acompaña la jugada, cierra espacios y protege el área.'}
    else if(type==='press'){title='Presión alta';text='Tu equipo salta a presionar con un hombre sobre la pelota y otro cerrando la salida.'}
    else if(type==='defend'){title='Bloque compacto';text='El equipo retrocede junto, protege el carril central y obliga al rival a jugar por fuera.'}
    else if(type==='reorganize'){title='Reordenando el equipo';text='Tras la incidencia, las líneas vuelven a acomodarse sin abandonar la estructura.'}
    return {type,owner,left,title,text,at:Number(l.minute)||0,key:`${type}|${owner}|${left?'L':'R'}|${Math.floor((Number(l.minute)||0)/4)}`};
  }

  function scenarioScene(sc,l){
    const us=userSide(l),them=other(us),t=(String(sc?.t||'')+' '+String(sc?.d||'')).toLowerCase();
    let owner=us,type='midfield',left=t.includes('izquier')||(!t.includes('derech')&&((Number(l.minute)||0)%2===0));
    const clearlyRival=t.includes('rival')||t.includes('defend')||t.includes('arquero rival')||t.includes('ataque rival')||t.includes('contra rival');
    if(clearlyRival&&!(t.includes('tu ataque')||t.includes('a favor')))owner=them;
    if(t.includes('penal'))type='penalty';
    else if(t.includes('tiro libre'))type='freekick';
    else if(t.includes('córner')||t.includes('corner'))type='corner';
    else if(t.includes('centro'))type='cross';
    else if(t.includes('mano a mano')||t.includes('remate')||t.includes('defin')||t.includes('disparo'))type='attack';
    else if(t.includes('banda')||t.includes('lateral')||t.includes('extremo'))type='wing';
    else if(t.includes('salida'))type='build';
    else if(t.includes('presión')||t.includes('presion'))type=owner===us?'press':'build';
    else if(t.includes('cerrar')||t.includes('bloque bajo'))type='defend';
    const o=sceneObject(type,owner,left,l);o.title=sc?.t||o.title;o.text=sc?.d||o.text;o.key=`scenario|${Number(l.minute)||0}|${String(sc?.t||'')}`;return o;
  }

  function tacticLabel(){return S.tactic||'Equilibrado'}
  function dist(a,b){return Math.hypot((a.x-b.x),(a.y-b.y)*.64)}
  function nearest(points,target,n=1,filter=()=>true){return points.filter(filter).sort((a,b)=>dist(a,target)-dist(b,target)).slice(0,n)}
  function choose(points,pred,score){const a=points.filter(pred);if(!a.length)return points.find(p=>roleGroup(p.pos)!=='GK')||points[0];return [...a].sort((x,y)=>score(x)-score(y))[0]}
  function clonePlayers(base){return base.map(p=>({...p}))}
  function frame(base,ball){return {players:clonePlayers(base),ball:{...ball},active:[],arrows:[]}}
  function fp(f,id){return f.players.find(p=>p.id===id)}
  function move(f,p,x,y){const q=fp(f,p.id);if(q){q.x=clamp(x,3.5,60.5);q.y=clamp(y,4,96)}return q}
  function shift(f,p,dx,dy){const q=fp(f,p.id);return q?move(f,p,q.x+dx,q.y+dy):null}
  function approachPoint(from,to,stop=5){
    const dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy);if(d<=stop||!d)return {x:from.x,y:from.y};
    const k=(d-stop)/d;return {x:from.x+dx*k,y:from.y+dy*k};
  }
  function setActive(f,...ps){f.active=ps.flat().filter(Boolean).map(p=>p.id)}
  function addArrow(f,from,to,type='pass'){if(f.arrows.length<2&&from&&to)f.arrows.push({x1:from.x,y1:from.y,x2:to.x,y2:to.y,type})}
  function midpoint(a,b,k=.5){return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}}

  function buildPlay(scene,l){
    const hp=teamPoints('home',l),ap=teamPoints('away',l),base=[...hp,...ap],own=scene.owner==='home'?hp:ap,opp=scene.owner==='home'?ap:hp,dir=dirFor(scene.owner),screenX=scene.left?15:49;
    const out=p=>roleGroup(p.pos)!=='GK',mid=p=>roleGroup(p.pos)==='MID',att=p=>roleGroup(p.pos)==='ATT',def=p=>roleGroup(p.pos)==='DEF',wide=p=>isWide(p.pos),fb=p=>isFullback(p.pos);
    const centerScore=p=>Math.abs(p.x-32);
    const sideScore=p=>Math.abs(p.x-screenX);
    const goal={x:32,y:scene.owner==='home'?3:97};
    let carrier=choose(own,p=>out(p),p=>centerScore(p)),receiver=null,support=null,presser=null,cover=null;

    if(scene.type==='build'){
      carrier=choose(own,p=>def(p)&&!fb(p),p=>centerScore(p));
      receiver=choose(own,p=>mid(p),p=>sideScore(p)+Math.abs(p.y-(carrier.y+dir*12))*.25);
      support=choose(own,p=>fb(p),p=>sideScore(p));
    }else if(scene.type==='midfield'){
      carrier=choose(own,p=>mid(p),p=>centerScore(p));
      receiver=choose(own,p=>mid(p)&&p.id!==carrier.id,p=>sideScore(p));
      support=choose(own,p=>att(p),p=>sideScore(p));
    }else if(scene.type==='wing'||scene.type==='cross'){
      carrier=choose(own,p=>wide(p)&&out(p),p=>sideScore(p)+Math.abs(p.y-50)*.08);
      receiver=choose(own,p=>att(p)&&!wide(p),p=>Math.abs(p.x-32)+Math.abs(p.y-(carrier.y+dir*16))*.12);
      support=choose(own,p=>fb(p)&&p.id!==carrier.id,p=>sideScore(p));
      if(!support||support.id===carrier.id)support=choose(own,p=>mid(p),p=>sideScore(p));
    }else if(scene.type==='attack'){
      carrier=choose(own,p=>mid(p)||wide(p),p=>Math.abs(p.y-(scene.owner==='home'?35:65))*.16+sideScore(p)*.12);
      receiver=choose(own,p=>att(p)&&!wide(p),p=>centerScore(p));
      support=choose(own,p=>att(p)&&p.id!==receiver.id,p=>sideScore(p));
    }else if(scene.type==='press'||scene.type==='defend'){
      carrier=choose(own,p=>mid(p)||def(p),p=>centerScore(p));
      receiver=choose(own,p=>wide(p)&&out(p),p=>sideScore(p));
      support=choose(own,p=>out(p)&&p.id!==receiver.id,p=>Math.abs(p.y-carrier.y)+sideScore(p)*.25);
    }else if(scene.type==='reorganize'){
      carrier=choose(own,p=>mid(p),p=>centerScore(p));
      receiver=choose(own,p=>out(p)&&p.id!==carrier.id,p=>sideScore(p));
    }

    presser=nearest(opp,carrier,1,out)[0];
    cover=receiver?nearest(opp,receiver,2,out).find(p=>p.id!==presser?.id):nearest(opp,carrier,2,out).find(p=>p.id!==presser?.id);

    // Set pieces are static pre-action pictures: they must not predict the user's choice.
    if(['penalty','freekick','corner'].includes(scene.type))return buildSetPiece(scene,l,base,own,opp,goal);

    const f0=frame(base,carrier),f1=frame(base,carrier),f2=frame(base,carrier),f3=frame(base,carrier);
    const c1=shift(f1,carrier,0,dir*3.2)||carrier;
    if(receiver)shift(f1,receiver,(screenX-receiver.x)*.18,dir*2.4);
    if(support)shift(f1,support,(screenX-support.x)*.12,dir*1.6);
    if(presser){const q=approachPoint(presser,c1,6.2);move(f1,presser,q.x,q.y)}
    setActive(f1,carrier,receiver,presser);

    const c2=shift(f2,carrier,0,dir*(scene.type==='wing'||scene.type==='cross'?6.5:4.2))||carrier;
    let r2=receiver?move(f2,receiver,receiver.x+(screenX-receiver.x)*.22,receiver.y+dir*(scene.type==='attack'?7.0:4.0)):null;
    if(support)move(f2,support,support.x+(screenX-support.x)*.18,support.y+dir*3.2);
    if(presser){const q=approachPoint(presser,c2,5.4);move(f2,presser,q.x,q.y)}
    if(cover&&r2){const q=approachPoint(cover,r2,6.0);move(f2,cover,q.x,q.y)}
    f2.ball={x:c2.x,y:c2.y};setActive(f2,carrier,receiver,support,presser,cover);

    if(scene.type==='reorganize'){
      f2.ball={x:carrier.x,y:carrier.y};
      f3.ball={x:carrier.x,y:carrier.y};
      setActive(f3,carrier,receiver);
      return {scene,base,frames:[f0,f1,f2,f3]};
    }

    // One meaningful passing arrow, plus at most one supporting run.
    if(r2)addArrow(f2,c2,r2,'pass');
    if(support){const s0=fp(f1,support.id)||support,s2=fp(f2,support.id)||support;if(Math.hypot(s2.x-s0.x,s2.y-s0.y)>2.2)addArrow(f2,s0,s2,'run')}

    let target=r2||c2;
    if(scene.type==='cross'&&receiver){
      target=move(f3,receiver,clamp(32+(receiver.x-32)*.18,24,40),clamp(goal.y-dir*17,12,88));
      const c3=move(f3,carrier,c2.x,c2.y+dir*1.5)||c2;
      f3.ball=midpoint(c3,target,.92);
      if(cover&&target){const q=approachPoint(cover,target,4.5);move(f3,cover,q.x,q.y)}
      setActive(f3,carrier,receiver,cover);
    }else if(receiver){
      target=move(f3,receiver,r2.x,r2.y+dir*(scene.type==='attack'?3.5:1.5));
      f3.ball={x:target.x,y:target.y};
      if(presser){const q=approachPoint(fp(f2,presser.id)||presser,target,5.0);move(f3,presser,q.x,q.y)}
      if(cover){const q=approachPoint(fp(f2,cover.id)||cover,target,5.8);move(f3,cover,q.x,q.y)}
      setActive(f3,receiver,presser,cover);
    }else{
      f3.ball={x:c2.x,y:c2.y};setActive(f3,carrier,presser);
    }

    // The ball moves only along the scripted action; never to an arbitrary point.
    if(receiver){const start=fp(f2,carrier.id)||c2;const end=target||r2;f2.ball=midpoint(start,end,.35)}
    return {scene,base,frames:[f0,f1,f2,f3]};
  }

  function buildSetPiece(scene,l,base,own,opp,goal){
    const out=p=>roleGroup(p.pos)!=='GK',gk=p=>roleGroup(p.pos)==='GK',att=p=>roleGroup(p.pos)==='ATT',mid=p=>roleGroup(p.pos)==='MID';
    const dir=dirFor(scene.owner),kicker=choose(own,p=>att(p)||mid(p),p=>Math.abs(p.x-32)),keeper=choose(opp,gk,()=>0),f=frame(base,{x:32,y:50});
    let ball={x:32,y:scene.owner==='home'?26:74};
    if(scene.type==='penalty')ball={x:32,y:scene.owner==='home'?14:86};
    if(scene.type==='freekick')ball={x:scene.left?24:40,y:scene.owner==='home'?25:75};
    if(scene.type==='corner')ball={x:scene.left?4:60,y:scene.owner==='home'?4:96};
    move(f,kicker,ball.x+(scene.left?2:-2),ball.y-dir*3.8);
    if(keeper)move(f,keeper,32,scene.owner==='home'?5.5:94.5);
    if(scene.type==='penalty'){
      const box=own.filter(out).filter(p=>p.id!==kicker.id).slice(0,4);box.forEach((p,i)=>move(f,p,22+i*6.5,scene.owner==='home'?22:78));
    }else if(scene.type==='corner'){
      const targets=own.filter(out).filter(p=>p.id!==kicker.id).slice(0,4);targets.forEach((p,i)=>move(f,p,24+i*5.4,scene.owner==='home'?12+i%2*5:88-i%2*5));
      const marks=opp.filter(out).slice(0,4);marks.forEach((p,i)=>move(f,p,25+i*5.2,scene.owner==='home'?14+i%2*4:86-i%2*4));
    }
    f.ball=ball;setActive(f,kicker,keeper);
    return {scene,base,frames:[f,f,f,f]};
  }

  function pctX(x){return x/64*100}
  function dotHtml(p,active=[]){return `<i class="em821Dot ${p.side} ${active.includes(p.id)?'hot':''}" data-pid="${p.id}" style="left:${pctX(p.x)}%;top:${p.y}%"></i>`}
  function arrowsHtml(f){
    const arrows=(f?.arrows||[]).slice(0,2);if(!arrows.length)return '';
    const lines=arrows.map(a=>`<line class="${a.type==='run'?'run':'pass'}" x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" marker-end="url(#em821Arr)"/>`).join('');
    return `<svg class="em821Arrow" viewBox="0 0 64 100" preserveAspectRatio="none"><defs><marker id="em821Arr" markerWidth="4.5" markerHeight="4.5" refX="4" refY="2.25" orient="auto"><path d="M0,0 L4.5,2.25 L0,4.5 z" fill="rgba(255,255,255,.82)"/></marker></defs>${lines}</svg>`;
  }
  function boardHtml(play,l,compact=false,frameIndex=0){
    const f=play.frames[clamp(frameIndex,0,play.frames.length-1)]||play.frames[0],players=f.players;
    return `<div class="em821Board ${compact?'compact':''}"><div class="em821PitchLines"><span class="half"></span><span class="circle"></span><span class="box top"></span><span class="box bottom"></span><span class="six top"></span><span class="six bottom"></span></div>${players.map(p=>dotHtml(p,f.active)).join('')}<i class="em821Ball" style="left:${pctX(f.ball.x)}%;top:${f.ball.y}%"></i><span class="em821ArrowHost">${arrowsHtml(f)}</span></div>`;
  }
  function applyFrame(play,index,hostId='em821BoardHost'){
    const host=document.getElementById(hostId),f=play?.frames?.[clamp(index,0,play.frames.length-1)];if(!host||!f)return;
    const active=new Set(f.active||[]);
    host.querySelectorAll('.em821Dot').forEach(el=>{
      const p=f.players.find(x=>x.id===el.dataset.pid);if(!p)return;
      el.style.left=`${pctX(p.x)}%`;el.style.top=`${p.y}%`;el.classList.toggle('hot',active.has(p.id));
    });
    const ball=host.querySelector('.em821Ball');if(ball){ball.style.left=`${pctX(f.ball.x)}%`;ball.style.top=`${f.ball.y}%`}
    const ah=host.querySelector('.em821ArrowHost');if(ah)ah.innerHTML=arrowsHtml(f);
  }
  function stopFrames(){if(EM821.frameTimer){clearTimeout(EM821.frameTimer);EM821.frameTimer=0}EM821.frame=0}
  function startFrames(play){
    stopFrames();if(!play?.frames?.length)return;EM821.frame=0;applyFrame(play,0);
    const step=()=>{if(!EM821.running||EM821.play!==play)return;EM821.frame++;if(EM821.frame>=play.frames.length){EM821.frame=play.frames.length-1;return}applyFrame(play,EM821.frame);EM821.frameTimer=setTimeout(step,680)};
    EM821.frameTimer=setTimeout(step,360);
  }

  function eventLines(l){
    const ev=Array.isArray(l.events)?l.events.slice(-4).reverse():[];
    if(!ev.length)return '<div class="em821Quiet">Sin incidencias importantes en los últimos minutos.</div>';
    return ev.map(e=>`<div class="em821Event"><b>${esc(e.m??l.minute)}'</b><span>${esc(e.txt||e.type||'Incidencia')}</span></div>`).join('');
  }
  function renderSceneContent(l,force=false){
    const change=!EM821.scene||force||(Number(l.minute)||0)-EM821.lastSceneMinute>=4;
    if(change){EM821.scene=pickScene(l);EM821.lastSceneMinute=Number(l.minute)||0;EM821.play=buildPlay(EM821.scene,l)}
    const s=EM821.scene,play=EM821.play,board=document.getElementById('em821BoardHost'),title=document.getElementById('em821SceneTitle'),text=document.getElementById('em821SceneText'),minute=document.getElementById('em821Minute'),score=document.getElementById('em821Score'),events=document.getElementById('em821Events'),shape=document.getElementById('em821Shape');
    if(change&&board){board.innerHTML=boardHtml(play,l,false,0);startFrames(play)}
    if(title)title.textContent=s.title;if(text)text.textContent=s.text;if(minute)minute.textContent=`${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO`;if(score)score.textContent=`${Number(l.gh)||0} – ${Number(l.ga)||0}`;if(events)events.innerHTML=eventLines(l);if(shape)shape.textContent=`${formationName(userSide(l),l)} · ${tacticLabel()}`;
  }

  function stop821(){EM821.running=false;EM821.token++;if(EM821.timer){clearTimeout(EM821.timer);EM821.timer=0}stopFrames()}
  function stopOld(){
    try{if(typeof em820Stop==='function')em820Stop()}catch(e){}
    try{if(typeof em818Stop==='function')em818Stop()}catch(e){}
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    try{if(typeof v0712StopVisual==='function'&&v0712StopVisual!==stop821)v0712StopVisual()}catch(e){}
  }
  function decisionPlan(l){if(l?.em815DecisionPlan)return l.em815DecisionPlan;if(l?.em820DecisionPlan)return l.em820DecisionPlan;if(!l.em821DecisionPlan){l.em821DecisionPlan={first:typeof ri==='function'?ri(17,29):22,second:typeof ri==='function'?ri(54,69):61};try{save()}catch(e){}}return l.em821DecisionPlan}
  function shouldPause(l){
    if(!l||l.scenario||Number(l.minute)>=89)return false;
    let old=false;try{old=typeof v062ShouldPause==='function'&&!!v062ShouldPause(l)}catch(e){console.error('em821 historical pause',e)}if(old)return true;
    const p=decisionPlan(l),count=Math.max(Number(l.pauseCount)||0,Number(l.stopIndex)||0);if(!p)return false;
    const force=(count===0&&l.minute>=p.first)||(count===1&&l.minute>=p.second);if(!force)return false;
    l.pauseCount=count+1;l.nextEligibleMinute=l.minute+(typeof ri==='function'?ri(9,14):11);try{save()}catch(e){}return true;
  }
  function makeHistorical(l){try{const s=makeMatchScenario(l.stopIndex);return s&&s.t&&Array.isArray(s.o)&&s.o.length?s:null}catch(e){console.error('em821 historical scenario',e);return null}}
  function pauseDecision(l){
    stop821();stopOld();if(!l.scenario){const sc=makeHistorical(l);if(sc)l.scenario=sc}
    if(!l.scenario){l.nextEligibleMinute=(Number(l.minute)||0)+2;try{save()}catch(e){}return renderMatch821()}
    try{save()}catch(e){};try{return renderLiveDecision()}catch(e){console.error('em821 decision render',e);try{if(typeof em817SafeDecisionFallback==='function')return em817SafeDecisionFallback(l)}catch(x){console.error('em821 safe fallback',x)}}
  }
  function tick821(token){
    if(token!==EM821.token||!EM821.running||!S.live)return;const l=S.live;if(l.scenario)return pauseDecision(l);
    const to=Math.min(90,(Number(l.minute)||0)+1);try{simulateSegment(to)}catch(e){console.error('em821 historical simulateSegment',e);EM821.timer=setTimeout(()=>tick821(token),900);return}
    if(!S.live||S.live!==l)return;renderSceneContent(l,false);
    if(to===45&&!l.halftimeShown){l.halftimeShown=true;try{save()}catch(e){};stop821();return typeof v063RenderHalftime==='function'?v063RenderHalftime():undefined}
    if(to<90&&shouldPause(l))return pauseDecision(l);
    if(to>=90){stop821();return finishRegulation()}
    try{save()}catch(e){}EM821.timer=setTimeout(()=>tick821(token),700);
  }

  function renderMatch821(){
    const l=S.live;if(!l)return typeof render==='function'?render():undefined;if(l.scenario)return renderLiveDecision();stopOld();stop821();
    const key=matchKey(l);if(EM821.matchKey!==key){EM821.matchKey=key;EM821.scene=null;EM821.play=null;EM821.lastSceneMinute=-99}
    const root=document.getElementById('modalRoot');if(!root)return;
    EM821.scene=pickScene(l);EM821.play=buildPlay(EM821.scene,l);EM821.lastSceneMinute=Number(l.minute)||0;
    const initial=EM821.scene,play=EM821.play;
    root.innerHTML=`<div class="modalBg em821Bg"><div class="modal em821Match"><div class="em821Top"><div><div id="em821Minute" class="em821Minute">${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO</div><div id="em821Score" class="em821Score">${Number(l.gh)||0} – ${Number(l.ga)||0}</div><div class="em821Teams">${esc(sideName('home',l))} · ${esc(sideName('away',l))}</div></div><span class="em821Mode">JUGADA</span></div><div id="em821BoardHost">${boardHtml(play,l,false,0)}</div><div class="em821Meta"><span id="em821Shape">${formationName(userSide(l),l)} · ${esc(tacticLabel())}</span><span>Situación actual</span></div><div class="em821Narrative"><b id="em821SceneTitle">${esc(initial.title)}</b><p id="em821SceneText">${esc(initial.text)}</p></div><div id="em821Events" class="em821Events">${eventLines(l)}</div><button class="secondary" onclick="em821ManualSubs()">⏸ DT / Cambios</button></div></div>`;
    EM821.running=true;const token=++EM821.token;startFrames(play);EM821.timer=setTimeout(()=>tick821(token),700);
  }

  function decisionPitch(){
    const l=S.live,sc=l?.scenario;if(!l||!sc)return '';
    const scene=scenarioScene(sc,l),play=buildPlay(scene,l),idx=scene.type==='penalty'||scene.type==='freekick'||scene.type==='corner'?0:2;
    return `<div id="em821DecisionHost" class="em821DecisionHost">${boardHtml(play,l,true,idx)}</div>`
  }
  function drawDecision(){/* La situación ya está guionada; no se recalculan destinos mientras el DT decide. */}
  function manualSubs(){stop821();stopOld();if(typeof v06OpenSubs==='function')return v06OpenSubs()}

  const baseDecision=renderLiveDecision;
  renderLiveDecision=function(){stop821();stopOld();return baseDecision()};
  em80DecisionPitchHtml=decisionPitch;em80DrawDecision=drawDecision;
  v06RenderMatchHub=function(){const l=S.live;if(!l)return typeof render==='function'?render():undefined;if(l.scenario)return renderLiveDecision();return renderMatch821()};
  runNextStop=function(){return S.live?v06RenderMatchHub():(typeof render==='function'?render():undefined)};
  v063AdvanceUntilDecision=function(){return S.live?v06RenderMatchHub():(typeof render==='function'?render():undefined)};
  v0712RenderVisual=renderMatch821;em80RenderMatch=renderMatch821;
  window.em821ManualSubs=manualSubs;window.em821RenderMatch=renderMatch821;window.em821Stop=stop821;
  window.em821SceneMatch={version:'0.8.21',mode:'deterministic-keyframes',authority:'historical',continuous:false,randomVisual:false,portrait:true,scenarioClear:false};

  const oldStyle=document.getElementById('em821-scene-style');if(oldStyle)oldStyle.remove();
  const st=document.createElement('style');st.id='em821-scene-style';st.textContent=`
  .em821Bg{align-items:flex-start;overflow:auto}.em821Match{max-width:540px}.em821Top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}.em821Minute{font-size:11px;color:var(--muted);font-weight:900;letter-spacing:.05em}.em821Score{font-size:40px;font-weight:1000;line-height:1;margin:6px 0}.em821Teams{font-size:10px;color:var(--muted)}.em821Mode{font-size:9px;font-weight:1000;color:var(--gold);border:1px solid rgba(243,191,77,.35);padding:7px 9px;border-radius:999px;background:rgba(243,191,77,.08)}
  .em821Board{position:relative;width:min(100%,390px);aspect-ratio:64/100;border-radius:18px;overflow:hidden;background:repeating-linear-gradient(0deg,#173c27 0 10%,#1a432c 10% 20%);border:1px solid rgba(255,255,255,.20);margin:10px auto 8px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025)}.em821PitchLines{position:absolute;inset:2.5%;border:1.5px solid rgba(255,255,255,.55)}.em821PitchLines .half{position:absolute;left:0;right:0;top:50%;border-top:1.5px solid rgba(255,255,255,.55)}.em821PitchLines .circle{position:absolute;width:30%;aspect-ratio:1;border:1.5px solid rgba(255,255,255,.55);border-radius:50%;left:35%;top:50%;transform:translateY(-50%)}.em821PitchLines .box{position:absolute;left:22%;width:56%;height:16%;border:1.5px solid rgba(255,255,255,.55)}.em821PitchLines .box.top{top:0;border-top:0}.em821PitchLines .box.bottom{bottom:0;border-bottom:0}.em821PitchLines .six{position:absolute;left:35%;width:30%;height:6.5%;border:1.5px solid rgba(255,255,255,.55)}.em821PitchLines .six.top{top:0;border-top:0}.em821PitchLines .six.bottom{bottom:0;border-bottom:0}
  .em821Dot{position:absolute;width:11px;height:11px;border-radius:50%;transform:translate(-50%,-50%);border:1.5px solid rgba(255,255,255,.86);z-index:4;transition:left .58s cubic-bezier(.25,.72,.25,1),top .58s cubic-bezier(.25,.72,.25,1),box-shadow .16s,border-color .16s}.em821Dot.home{background:#6550a8}.em821Dot.away{background:#367256}.em821Dot.hot{box-shadow:0 0 0 4px rgba(243,191,77,.22),0 0 13px rgba(243,191,77,.42);border-color:#ffe09a}.em821Ball{position:absolute;width:7px;height:7px;border-radius:50%;background:#fff;border:1px solid #111;transform:translate(-50%,-50%);z-index:6;transition:left .58s cubic-bezier(.25,.72,.25,1),top .58s cubic-bezier(.25,.72,.25,1)}.em821ArrowHost{position:absolute;inset:0;pointer-events:none;z-index:3}.em821Arrow{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.em821Arrow line{stroke:rgba(255,255,255,.82);stroke-width:.55;vector-effect:non-scaling-stroke}.em821Arrow line.pass{stroke-dasharray:2.2 1.2}.em821Arrow line.run{stroke-dasharray:1.1 1.7;opacity:.72}
  .em821Board.compact{width:min(100%,330px);margin:8px auto 12px}.em821Meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:10px;color:#9fb3bf;margin:6px 0 10px}.em821Narrative{padding:12px 13px;border-radius:14px;background:#08151e;border:1px solid #213746;margin-bottom:10px}.em821Narrative b{font-size:12px}.em821Narrative p{margin:5px 0 0;color:#b6c5cd;font-size:11px;line-height:1.4}.em821Events{padding:3px 0 8px}.em821Event{display:flex;gap:9px;padding:6px 3px;border-bottom:1px solid rgba(255,255,255,.05);font-size:10px;color:#b8c8d0}.em821Event b{color:var(--gold);min-width:26px}.em821Quiet{font-size:10px;color:var(--muted);padding:7px 2px}.em821DecisionHost{margin:8px 0}
  `;document.head.appendChild(st);
})();
