/* ===== El Míster v0.8.23 · Escena táctica estática =====
   Sin animación de futbolistas. La cancha muestra una sola imagen táctica
   coherente con la situación actual o con la intervención que debe resolver el DT.
   El motor histórico conserva toda la autoridad sobre resultado, eventos y decisiones.
*/
(function(){
  'use strict';

  const ST={token:0,timer:0,running:false,scene:null,snapshot:null,lastSceneMinute:-99,matchKey:null};
  const oldStopVisual=typeof v0712StopVisual==='function'?v0712StopVisual:null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const userSide=l=>l&&String(l.home)===String(S.clubId)?'home':'away';
  const other=s=>s==='home'?'away':'home';
  const dir=side=>side==='home'?1:-1;
  const sideName=(side,l)=>{try{return club(side==='home'?l.home:l.away).name}catch(e){return side==='home'?'Local':'Visitante'}};
  const matchKey=l=>l?`${l.mode||'match'}|${l.home}|${l.away}|${l.startedAt||l.week||0}|${l.season||S.season||0}`:'none';

  const FALLBACK={
    '4-3-3':[
      {pos:'ARQ',x:7,y:32},{pos:'LI',x:22,y:10},{pos:'DFC',x:22,y:25},{pos:'DFC',x:22,y:39},{pos:'LD',x:22,y:54},
      {pos:'MC',x:41,y:15},{pos:'MCD',x:39,y:32},{pos:'MC',x:41,y:49},{pos:'EI',x:59,y:11},{pos:'DC',x:61,y:32},{pos:'ED',x:59,y:53}
    ],
    '4-2-3-1':[
      {pos:'ARQ',x:7,y:32},{pos:'LI',x:22,y:10},{pos:'DFC',x:22,y:25},{pos:'DFC',x:22,y:39},{pos:'LD',x:22,y:54},
      {pos:'MCD',x:39,y:23},{pos:'MCD',x:39,y:41},{pos:'EI',x:53,y:12},{pos:'MCO',x:51,y:32},{pos:'ED',x:53,y:52},{pos:'DC',x:64,y:32}
    ],
    '4-4-2':[
      {pos:'ARQ',x:7,y:32},{pos:'LI',x:22,y:10},{pos:'DFC',x:22,y:25},{pos:'DFC',x:22,y:39},{pos:'LD',x:22,y:54},
      {pos:'MI',x:41,y:10},{pos:'MC',x:40,y:25},{pos:'MC',x:40,y:39},{pos:'MD',x:41,y:54},{pos:'DC',x:60,y:24},{pos:'DC',x:60,y:40}
    ]
  };

  function roleGroup(role){
    const r=String(role||'').toUpperCase();
    if(['ARQ','GK','POR'].includes(r))return 'GK';
    if(['LI','LD','LB','RB','DFC','CB','LCB','RCB'].includes(r))return 'DEF';
    if(['MCD','MC','MCO','CM','CDM','CAM','LCM','RCM','MI','MD','LM','RM'].includes(r))return 'MID';
    return 'ATT';
  }
  function isFullback(role){return ['LI','LD','LB','RB'].includes(String(role||'').toUpperCase())}
  function isWide(role){return ['LI','LD','LB','RB','EI','ED','LW','RW','MI','MD','LM','RM'].includes(String(role||'').toUpperCase())}

  function formationName(side,l){
    if(side===userSide(l))return S.formation||'4-2-3-1';
    const explicit=l?.opponentFormation||l?.rivalFormation||l?.aiFormation||l?.em821OpponentFormation||l?.em823OpponentFormation;
    if(explicit)return explicit;
    const forms=['4-2-3-1','4-3-3','4-4-2'],id=String(side==='home'?l?.home:l?.away||'rival');let h=0;
    for(let i=0;i<id.length;i++)h=((h*31)+id.charCodeAt(i))|0;
    const f=forms[Math.abs(h)%forms.length];if(l)l.em823OpponentFormation=f;return f;
  }
  function slotsFor(form){
    try{
      if(typeof FORMATION_SLOTS!=='undefined'&&Array.isArray(FORMATION_SLOTS[form])&&FORMATION_SLOTS[form].length===11){
        return FORMATION_SLOTS[form].map(s=>({pos:s.pos,x:5+(100-clamp(Number(s.y)||50,4,96))*.62,y:5+clamp(Number(s.x)||50,4,96)*.54}));
      }
    }catch(e){}
    return (FALLBACK[form]||FALLBACK['4-2-3-1']).map(x=>({...x}));
  }
  function tacticalFlags(side,l){
    const ctx=l?.context||{},isUser=side===userSide(l),t=String(isUser?(S.tactic||'Equilibrado'):(l?.opponentTactic||'Equilibrado')).toLowerCase();
    return {offensive:t.includes('ofens'),defensive:t.includes('defens'),pressHigh:!!ctx.pressHigh&&isUser,lowBlock:!!ctx.lowBlock&&isUser,fullbacksHigh:!!ctx.fullbacksHigh&&isUser,direct:!!ctx.direct&&isUser};
  }
  function redCount(side,l){
    const ev=Array.isArray(l?.events)?l.events:[],teamId=side==='home'?l.home:l.away,name=sideName(side,l).toLowerCase();let n=0;
    for(const e of ev){const t=String(e?.txt||e?.type||'').toLowerCase();if(!(t.includes('🔴')||t.includes('roja')||t.includes('expuls')))continue;const eid=e?.teamId??e?.clubId??e?.team;if((eid!=null&&String(eid)===String(teamId))||t.includes(name))n++}return n;
  }
  function teamPlayers(side,l){
    const form=formationName(side,l),flags=tacticalFlags(side,l),d=dir(side);
    let pts=slotsFor(form).slice(0,11).map((s,i)=>{
      let x=s.x,y=s.y;
      if(side==='away'){x=100-x;y=64-y}
      const g=roleGroup(s.pos),fb=isFullback(s.pos);
      if(flags.offensive&&g!=='GK')x+=d*(g==='ATT'?4:g==='MID'?3:1.5);
      if(flags.defensive&&g!=='GK')x-=d*(g==='ATT'?1.5:g==='MID'?2.5:2);
      if(flags.pressHigh&&g!=='GK')x+=d*(g==='ATT'?6:g==='MID'?5:3);
      if(flags.lowBlock&&g!=='GK')x-=d*(g==='ATT'?2:g==='MID'?5:4);
      if(flags.fullbacksHigh&&fb)x+=d*7;
      return {id:`${side}-${i}`,side,pos:s.pos||'MC',x:clamp(x,3,97),y:clamp(y,3,61)};
    });
    let reds=redCount(side,l);
    while(reds-->0&&pts.length>1){let idx=pts.findIndex(p=>roleGroup(p.pos)==='MID');if(idx<0)idx=pts.findIndex(p=>roleGroup(p.pos)==='ATT');if(idx<0)idx=pts.findIndex(p=>roleGroup(p.pos)==='DEF');if(idx>=0)pts.splice(idx,1)}
    return pts;
  }

  function threat(l,who){return Number(l?.flow?.[who==='user'?'userThreat':'oppThreat'])||0}
  function sceneFromText(sc,l){
    const us=userSide(l),them=other(us),t=`${sc?.t||''} ${sc?.d||''}`.toLowerCase();
    let type='midfield',owner=us,left=t.includes('izquier')||(!t.includes('derech')&&((Number(l.minute)||0)%2===0));
    const rival=t.includes('rival')||t.includes('nos atac')||t.includes('tu defensa')||t.includes('defender')||t.includes('contra rival');
    if(rival&&!t.includes('a favor')&&!t.includes('tu ataque'))owner=them;
    if(t.includes('penal'))type='penalty';
    else if(t.includes('tiro libre'))type='freekick';
    else if(t.includes('córner')||t.includes('corner'))type='corner';
    else if(t.includes('centro'))type='cross';
    else if(t.includes('mano a mano')||t.includes('remate')||t.includes('disparo')||t.includes('defin'))type='attack';
    else if(t.includes('banda')||t.includes('lateral')||t.includes('extremo')||t.includes('espalda'))type='wing';
    else if(t.includes('salida')||t.includes('sacar jugando'))type='build';
    else if(t.includes('presión')||t.includes('presion'))type=owner===us?'press':'build';
    else if(t.includes('bloque bajo')||t.includes('cerrar')||t.includes('repleg'))type='defend';
    else if(t.includes('contra')||t.includes('transición')||t.includes('transicion'))type='counter';
    return {type,owner,left,title:sc?.t||titleFor(type,owner,l),text:sc?.d||textFor(type,owner,l),key:`scenario|${Number(l.minute)||0}|${sc?.t||''}`};
  }
  function titleFor(type,owner,l){
    const us=userSide(l),ours=owner===us;
    return type==='build'?'Salida desde atrás':type==='wing'?'Jugando por la banda':type==='cross'?'Centro al área':type==='attack'?(ours?'Llegada de tu equipo':'Ataque rival'):type==='press'?'Presión alta':type==='defend'?'Bloque defensivo':type==='counter'?'Transición rápida':type==='penalty'?'Penal':type==='freekick'?'Tiro libre':type==='corner'?'Córner':'Batalla en el mediocampo';
  }
  function textFor(type,owner,l){
    const name=sideName(owner,l);
    return type==='build'?`${name} intenta salir limpio desde el fondo.`:type==='wing'?`${name} progresa por un costado y busca una línea de pase.`:type==='cross'?`${name} tiene espacio para meter la pelota al área.`:type==='attack'?`${name} llega con gente a zona de peligro.`:type==='press'?`${name} salta a presionar la salida rival.`:type==='defend'?`${name} achica espacios y protege el área.`:type==='counter'?`${name} acelera una transición con campo por delante.`:'La pelota se disputa en la mitad de la cancha.';
  }
  function pickLiveScene(l){
    const us=userSide(l),them=other(us),m=Number(l.minute)||0,ud=threat(l,'user'),od=threat(l,'opp'),ctx=l?.context||{};
    let owner=(m%10<5?us:them),type='midfield';
    if(ud>od+.7){owner=us;type=ud>1.5?'attack':'wing'}
    else if(od>ud+.7){owner=them;type=od>1.5?'attack':'wing'}
    else if(ctx.pressHigh&&owner===them)type='press';
    else if(ctx.lowBlock&&owner===them)type='defend';
    else if(ctx.fullbacksHigh&&owner===us)type='wing';
    else if(m%15<4)type='build';
    else if(m%15>10)type='wing';
    const left=((Math.floor(m/4)+(l.stopIndex||0))%2)===0;
    return {type,owner,left,title:titleFor(type,owner,l),text:textFor(type,owner,l),key:`live|${type}|${owner}|${left?'L':'R'}|${Math.floor(m/4)}`};
  }

  function copyPlayers(a){return a.map(p=>({...p}))}
  function choose(a,pred,score){const x=a.filter(pred);return (x.length?x:a).slice().sort((p,q)=>score(p)-score(q))[0]}
  function nearest(a,t,n=1,pred=()=>true){return a.filter(pred).slice().sort((p,q)=>Math.hypot(p.x-t.x,p.y-t.y)-Math.hypot(q.x-t.x,q.y-t.y)).slice(0,n)}
  function move(map,p,x,y){if(!p)return null;const q=map.get(p.id);if(q){q.x=clamp(x,3,97);q.y=clamp(y,3,61)}return q}
  function shift(map,p,dx,dy){const q=p&&map.get(p.id);return q?move(map,p,q.x+dx,q.y+dy):null}
  function arrow(arrows,a,b,type='pass'){if(a&&b&&arrows.length<3)arrows.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,type})}
  function snapshot(scene,l){
    const home=teamPlayers('home',l),away=teamPlayers('away',l),players=copyPlayers([...home,...away]),map=new Map(players.map(p=>[p.id,p]));
    const own=scene.owner==='home'?home:away,opp=scene.owner==='home'?away:home,d=dir(scene.owner),wideY=scene.left?12:52;
    const out=p=>roleGroup(p.pos)!=='GK',mid=p=>roleGroup(p.pos)==='MID',att=p=>roleGroup(p.pos)==='ATT',def=p=>roleGroup(p.pos)==='DEF',wide=p=>isWide(p.pos),fb=p=>isFullback(p.pos),gk=p=>roleGroup(p.pos)==='GK';
    const arrows=[],active=[];let ball={x:50,y:32};
    const activate=(...ps)=>ps.flat().filter(Boolean).forEach(p=>{if(!active.includes(p.id))active.push(p.id)});
    let carrier=choose(own,out,p=>Math.abs(p.x-50)+Math.abs(p.y-32)*.3),receiver=null,support=null,presser=null,cover=null;

    if(scene.type==='penalty'||scene.type==='freekick'||scene.type==='corner'){
      const kicker=choose(own,p=>att(p)||mid(p),p=>Math.abs(p.y-wideY)),keeper=choose(opp,gk,()=>0),goalX=scene.owner==='home'?96:4;
      if(scene.type==='penalty')ball={x:scene.owner==='home'?86:14,y:32};
      if(scene.type==='freekick')ball={x:scene.owner==='home'?75:25,y:scene.left?22:42};
      if(scene.type==='corner')ball={x:scene.owner==='home'?96:4,y:scene.left?4:60};
      move(map,kicker,ball.x-d*4,ball.y);
      if(keeper)move(map,keeper,goalX,32);
      if(scene.type==='penalty'){
        own.filter(out).filter(p=>p.id!==kicker.id).slice(0,4).forEach((p,i)=>move(map,p,scene.owner==='home'?75:25,20+i*8));
        opp.filter(out).slice(0,4).forEach((p,i)=>move(map,p,scene.owner==='home'?77:23,20+i*8));
      }else{
        own.filter(out).filter(p=>p.id!==kicker.id).slice(0,4).forEach((p,i)=>move(map,p,scene.owner==='home'?84:16,16+i*10));
        opp.filter(out).slice(0,4).forEach((p,i)=>move(map,p,scene.owner==='home'?87:13,17+i*10));
      }
      activate(kicker,keeper);return {players,ball,active,arrows};
    }

    if(scene.type==='build'){
      carrier=choose(own,p=>def(p)&&!fb(p),p=>Math.abs(p.y-32));
      receiver=choose(own,mid,p=>Math.abs(p.y-wideY));
      support=choose(own,fb,p=>Math.abs(p.y-wideY));
      const c=shift(map,carrier,d*3,0),r=shift(map,receiver,d*2,(wideY-receiver.y)*.16),s=shift(map,support,d*4,(wideY-support.y)*.12);
      presser=nearest(opp,c||carrier,1,out)[0];if(presser){const q=map.get(presser.id);move(map,presser,q.x-d*3,q.y)}
      ball={x:(c||carrier).x,y:(c||carrier).y};arrow(arrows,c||carrier,r||receiver,'pass');arrow(arrows,c||carrier,s||support,'support');activate(carrier,receiver,support,presser);
    }else if(scene.type==='midfield'){
      carrier=choose(own,mid,p=>Math.abs(p.x-50)+Math.abs(p.y-32)*.3);
      receiver=choose(own,p=>mid(p)&&p.id!==carrier.id,p=>Math.abs(p.y-wideY));
      support=choose(own,att,p=>Math.abs(p.y-wideY));
      const c=shift(map,carrier,d*3,0),r=shift(map,receiver,d*4,(wideY-receiver.y)*.18);
      presser=nearest(opp,c||carrier,1,out)[0];if(presser){const q=map.get(presser.id);move(map,presser,q.x-d*2,(q.y+(c||carrier).y)/2)}
      ball={x:(c||carrier).x,y:(c||carrier).y};arrow(arrows,c||carrier,r||receiver,'pass');if(support){const sm=map.get(support.id);arrow(arrows,sm,{x:sm.x+d*6,y:sm.y},'run')}activate(carrier,receiver,support,presser);
    }else if(scene.type==='wing'||scene.type==='cross'){
      carrier=choose(own,p=>wide(p)&&out(p),p=>Math.abs(p.y-wideY)+Math.abs(p.x-55)*.15);
      receiver=choose(own,p=>att(p)&&!wide(p),p=>Math.abs(p.y-32));
      support=choose(own,fb,p=>Math.abs(p.y-wideY));
      const c=move(map,carrier,scene.owner==='home'?68:32,wideY),r=move(map,receiver,scene.owner==='home'?78:22,32),s=support?move(map,support,scene.owner==='home'?61:39,wideY+(scene.left?5:-5)):null;
      presser=nearest(opp,c,1,out)[0];cover=nearest(opp,r,2,out).find(p=>p.id!==presser?.id);
      if(presser){const q=map.get(presser.id);move(map,presser,(q.x+c.x)/2,(q.y+c.y)/2)}if(cover){const q=map.get(cover.id);move(map,cover,(q.x+r.x)/2,(q.y+r.y)/2)}
      ball={x:c.x,y:c.y};arrow(arrows,c,scene.type==='cross'?r:(s||r),scene.type==='cross'?'cross':'pass');if(s)arrow(arrows,s,{x:s.x+d*8,y:s.y},'run');activate(carrier,receiver,support,presser,cover);
    }else if(scene.type==='attack'||scene.type==='counter'){
      carrier=choose(own,p=>mid(p)||wide(p),p=>Math.abs(p.y-32));receiver=choose(own,att,p=>Math.abs(p.y-32));support=choose(own,p=>att(p)&&p.id!==receiver.id,p=>Math.abs(p.y-wideY));
      const c=move(map,carrier,scene.owner==='home'?67:33,scene.left?26:38),r=move(map,receiver,scene.owner==='home'?79:21,32),s=support?move(map,support,scene.owner==='home'?73:27,wideY):null;
      presser=nearest(opp,c,1,out)[0];cover=nearest(opp,r,2,out).find(p=>p.id!==presser?.id);
      if(presser){const q=map.get(presser.id);move(map,presser,(q.x+c.x)/2,(q.y+c.y)/2)}if(cover){const q=map.get(cover.id);move(map,cover,(q.x+r.x)/2,(q.y+r.y)/2)}
      ball={x:c.x,y:c.y};arrow(arrows,c,r,'pass');if(s)arrow(arrows,s,{x:s.x+d*(scene.type==='counter'?10:6),y:s.y},'run');activate(carrier,receiver,support,presser,cover);
    }else if(scene.type==='press'){
      carrier=choose(opp,p=>def(p)||mid(p),p=>Math.abs(p.y-32));const c=map.get(carrier.id);presser=nearest(own,c,1,out)[0];support=nearest(own,c,3,out).find(p=>p.id!==presser?.id);
      ball={x:c.x,y:c.y};if(presser){const q=map.get(presser.id);arrow(arrows,q,{x:(q.x+c.x)/2,y:(q.y+c.y)/2},'press');move(map,presser,(q.x+c.x)/2,(q.y+c.y)/2)}if(support){const q=map.get(support.id);arrow(arrows,q,{x:(q.x+c.x)/2,y:(q.y+c.y)/2},'press')}activate(carrier,presser,support);
    }else if(scene.type==='defend'){
      carrier=choose(opp,p=>mid(p)||wide(p),p=>Math.abs(p.y-wideY));const c=move(map,carrier,scene.owner==='home'?65:35,wideY);const defenders=nearest(own,c,3,out);
      defenders.forEach((p,i)=>{const q=map.get(p.id);const nx=(q.x+c.x)/2-d*2;move(map,p,nx,q.y+(c.y-q.y)*.24);if(i<2)arrow(arrows,q,{x:nx,y:q.y+(c.y-q.y)*.24},'close')});ball={x:c.x,y:c.y};activate(carrier,defenders);
    }
    return {players,ball,active,arrows};
  }

  function arrowSvg(snap){
    if(!snap.arrows.length)return '';
    const lines=snap.arrows.map(a=>`<line class="${a.type}" x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" marker-end="url(#em823Arrow)"/>`).join('');
    return `<svg class="em823Arrows" viewBox="0 0 100 64" preserveAspectRatio="none"><defs><marker id="em823Arrow" markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="rgba(255,255,255,.84)"/></marker></defs>${lines}</svg>`;
  }
  function pitchHtml(scene,l,compact=false){
    const snap=snapshot(scene,l),active=new Set(snap.active);
    return `<div class="em823Pitch ${compact?'compact':''}"><div class="em823Lines"><i class="half"></i><i class="circle"></i><i class="box left"></i><i class="box right"></i><i class="six left"></i><i class="six right"></i></div>${arrowSvg(snap)}${snap.players.map(p=>`<i class="em823Dot ${p.side} ${active.has(p.id)?'hot':''}" style="left:${p.x}%;top:${p.y/64*100}%"></i>`).join('')}<i class="em823Ball" style="left:${snap.ball.x}%;top:${snap.ball.y/64*100}%">⚽</i></div>`;
  }
  function eventLines(l){
    const ev=Array.isArray(l?.events)?l.events.filter(e=>e.type!=='decision').slice(-4).reverse():[];
    if(!ev.length)return '<div class="em823Quiet">Sin incidencias importantes.</div>';
    return ev.map(e=>`<div class="em823Event"><b>${esc(e.m??l.minute)}'</b><span>${esc(e.txt||e.type||'Incidencia')}</span></div>`).join('');
  }
  function tacticLabel(){return S.tactic||'Equilibrado'}

  function stopStatic(){ST.running=false;ST.token++;if(ST.timer){clearTimeout(ST.timer);ST.timer=0}}
  function stopOthers(){
    stopStatic();
    try{if(typeof em821Stop==='function')em821Stop()}catch(e){}
    try{if(typeof em820Stop==='function')em820Stop()}catch(e){}
    try{if(typeof em818Stop==='function')em818Stop()}catch(e){}
    try{if(typeof em80Stop==='function')em80Stop()}catch(e){}
    try{if(oldStopVisual&&oldStopVisual!==stopStatic)oldStopVisual()}catch(e){}
  }
  function decisionPlan(l){
    if(l?.em815DecisionPlan)return l.em815DecisionPlan;
    if(l?.em821DecisionPlan)return l.em821DecisionPlan;
    if(!l.em823DecisionPlan){l.em823DecisionPlan={first:typeof ri==='function'?ri(17,29):22,second:typeof ri==='function'?ri(54,69):61};try{save()}catch(e){}}
    return l.em823DecisionPlan;
  }
  function shouldPause(l){
    if(!l||l.scenario||Number(l.minute)>=89)return false;
    let old=false;try{old=typeof v062ShouldPause==='function'&&!!v062ShouldPause(l)}catch(e){console.error('em823 historical pause',e)}if(old)return true;
    const p=decisionPlan(l),count=Math.max(Number(l.pauseCount)||0,Number(l.stopIndex)||0);if(!p)return false;
    const force=(count===0&&l.minute>=p.first)||(count===1&&l.minute>=p.second);if(!force)return false;
    l.pauseCount=count+1;l.nextEligibleMinute=l.minute+(typeof ri==='function'?ri(9,14):11);try{save()}catch(e){}return true;
  }
  function makeHistorical(l){try{const s=makeMatchScenario(l.stopIndex);return s&&s.t&&Array.isArray(s.o)&&s.o.length?s:null}catch(e){console.error('em823 historical scenario',e);return null}}
  function pauseDecision(l){
    stopOthers();if(!l.scenario){const sc=makeHistorical(l);if(sc)l.scenario=sc}
    if(!l.scenario){l.nextEligibleMinute=(Number(l.minute)||0)+2;try{save()}catch(e){}return renderStaticMatch()}
    try{save()}catch(e){};return renderLiveDecision();
  }
  function renderSceneContent(l,force=false){
    const change=!ST.scene||force||(Number(l.minute)||0)-ST.lastSceneMinute>=4;
    if(change){ST.scene=pickLiveScene(l);ST.lastSceneMinute=Number(l.minute)||0;const host=document.getElementById('em823PitchHost');if(host)host.innerHTML=pitchHtml(ST.scene,l,false);const t=document.getElementById('em823SceneTitle');if(t)t.textContent=ST.scene.title;const d=document.getElementById('em823SceneText');if(d)d.textContent=ST.scene.text}
    const minute=document.getElementById('em823Minute'),score=document.getElementById('em823Score'),events=document.getElementById('em823Events'),shape=document.getElementById('em823Shape');
    if(minute)minute.textContent=`${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO`;if(score)score.textContent=`${Number(l.gh)||0} – ${Number(l.ga)||0}`;if(events)events.innerHTML=eventLines(l);if(shape)shape.textContent=`${formationName(userSide(l),l)} · ${tacticLabel()}`;
  }
  function tick(token){
    if(token!==ST.token||!ST.running||!S.live)return;const l=S.live;if(l.scenario)return pauseDecision(l);
    const to=Math.min(90,(Number(l.minute)||0)+1);
    try{simulateSegment(to)}catch(e){console.error('em823 simulateSegment',e);ST.timer=setTimeout(()=>tick(token),900);return}
    if(!S.live||S.live!==l)return;renderSceneContent(l,false);
    if(to===45&&!l.halftimeShown){l.halftimeShown=true;try{save()}catch(e){};stopOthers();return typeof v063RenderHalftime==='function'?v063RenderHalftime():undefined}
    if(to<90&&shouldPause(l))return pauseDecision(l);
    if(to>=90){stopOthers();return finishRegulation()}
    try{save()}catch(e){}ST.timer=setTimeout(()=>tick(token),700);
  }
  function renderStaticMatch(){
    const l=S.live;if(!l)return typeof render==='function'?render():undefined;if(l.scenario){stopOthers();return renderLiveDecision()}
    stopOthers();const key=matchKey(l);if(ST.matchKey!==key){ST.matchKey=key;ST.scene=null;ST.lastSceneMinute=-99}
    ST.scene=pickLiveScene(l);ST.lastSceneMinute=Number(l.minute)||0;
    const root=document.getElementById('modalRoot');if(!root)return;
    root.innerHTML=`<div class="modalBg em823Bg"><div class="modal em823Match"><div class="em823Top"><div><div id="em823Minute" class="em823Minute">${Math.floor(Number(l.minute)||0)}' · PARTIDO EN JUEGO</div><div id="em823Score" class="em823Score">${Number(l.gh)||0} – ${Number(l.ga)||0}</div><div class="em823Teams">${esc(sideName('home',l))} · ${esc(sideName('away',l))}</div></div><span class="em823Mode">ESCENA</span></div><div id="em823PitchHost">${pitchHtml(ST.scene,l,false)}</div><div class="em823Meta"><span id="em823Shape">${esc(formationName(userSide(l),l))} · ${esc(tacticLabel())}</span><span>Imagen de la situación</span></div><div class="em823Narrative"><b id="em823SceneTitle">${esc(ST.scene.title)}</b><p id="em823SceneText">${esc(ST.scene.text)}</p></div><div id="em823Events" class="em823Events">${eventLines(l)}</div><button class="secondary" onclick="em823ManualSubs()">⏸ DT / Cambios</button></div></div>`;
    ST.running=true;const token=++ST.token;ST.timer=setTimeout(()=>tick(token),700);
  }
  function decisionPitch(){const l=S.live,sc=l?.scenario;if(!l||!sc)return '';const scene=sceneFromText(sc,l);return `<div class="em823Decision"><div class="em823DecisionLabel">Así está planteada la jugada</div>${pitchHtml(scene,l,true)}</div>`}
  function manualSubs(){stopOthers();if(typeof v06OpenSubs==='function')return v06OpenSubs()}

  em80DecisionPitchHtml=decisionPitch;
  em80DrawDecision=function(){};
  v0712PitchHtml=function(l,compact=false){return compact?decisionPitch():''};
  v06RenderMatchHub=function(){return S.live?(S.live.scenario?(stopOthers(),renderLiveDecision()):renderStaticMatch()):(typeof render==='function'?render():undefined)};
  runNextStop=function(){return S.live?v06RenderMatchHub():(typeof render==='function'?render():undefined)};
  v063AdvanceUntilDecision=function(){return v06RenderMatchHub()};
  v0712RenderVisual=renderStaticMatch;
  em80RenderMatch=renderStaticMatch;
  v0712StopVisual=stopStatic;
  window.em823ManualSubs=manualSubs;
  window.em823RenderMatch=renderStaticMatch;
  window.em823Stop=stopStatic;
  window.em823StaticMatch={version:'0.8.23',mode:'static-situation-image',authority:'historical',animated:false,randomMotion:false,horizontal:true,scenarioDriven:true};

  const prior=document.getElementById('em823-static-style');if(prior)prior.remove();
  const st=document.createElement('style');st.id='em823-static-style';st.textContent=`
    .em823Bg{align-items:flex-start;overflow:auto}.em823Match{max-width:560px}.em823Top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}.em823Minute{font-size:11px;color:#a9bad0;font-weight:900;letter-spacing:.05em}.em823Score{font-size:42px;font-weight:1000;line-height:1;margin:6px 0}.em823Teams{font-size:11px;color:#8da4b3}.em823Mode{font-size:10px;font-weight:1000;color:var(--gold);border:1px solid rgba(243,191,77,.45);padding:9px 14px;border-radius:999px;background:rgba(243,191,77,.06)}
    .em823Pitch{position:relative;width:100%;aspect-ratio:100/64;border-radius:18px;overflow:hidden;background:repeating-linear-gradient(90deg,#0d5328 0 12.5%,#115f30 12.5% 25%);border:1px solid rgba(255,255,255,.23);margin:10px auto 8px;box-shadow:inset 0 0 28px rgba(0,0,0,.18)}.em823Pitch.compact{width:min(100%,500px);margin:8px auto 12px}.em823Lines{position:absolute;inset:2.5%;border:1.5px solid rgba(255,255,255,.72)}.em823Lines .half{position:absolute;top:0;bottom:0;left:50%;border-left:1.5px solid rgba(255,255,255,.72)}.em823Lines .circle{position:absolute;width:18%;aspect-ratio:1;border:1.5px solid rgba(255,255,255,.72);border-radius:50%;left:41%;top:50%;transform:translateY(-50%)}.em823Lines .box{position:absolute;top:22%;width:15%;height:56%;border:1.5px solid rgba(255,255,255,.72)}.em823Lines .box.left{left:0;border-left:0}.em823Lines .box.right{right:0;border-right:0}.em823Lines .six{position:absolute;top:35%;width:5%;height:30%;border:1.5px solid rgba(255,255,255,.72)}.em823Lines .six.left{left:0;border-left:0}.em823Lines .six.right{right:0;border-right:0}
    .em823Dot{position:absolute;width:13px;height:13px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,.92);z-index:5;transition:none!important;animation:none!important}.em823Dot.home{background:#6952b7}.em823Dot.away{background:#3b8264}.em823Dot.hot{box-shadow:0 0 0 5px rgba(242,210,88,.24),0 0 18px rgba(242,210,88,.72);border-color:#ffe68b}.em823Ball{position:absolute;transform:translate(-50%,-50%);font-style:normal;font-size:13px;line-height:1;z-index:7;filter:drop-shadow(0 1px 1px #000);transition:none!important;animation:none!important}.em823Arrows{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4}.em823Arrows line{stroke:rgba(255,255,255,.82);stroke-width:.7;vector-effect:non-scaling-stroke;stroke-dasharray:2.4 1.5}.em823Arrows line.run{stroke:rgba(171,128,255,.95)}.em823Arrows line.press,.em823Arrows line.close{stroke:rgba(211,234,221,.82)}.em823Arrows line.cross{stroke:rgba(255,224,125,.92)}
    .em823Meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:10px;color:#9fb3bf;margin:7px 1px 11px}.em823Narrative{padding:14px 15px;border-radius:16px;background:#08151e;border:1px solid #213746;margin-bottom:10px}.em823Narrative b{font-size:13px}.em823Narrative p{margin:6px 0 0;color:#b6c5cd;font-size:11px;line-height:1.42}.em823Events{padding:2px 0 9px}.em823Event{display:flex;gap:9px;padding:6px 3px;border-bottom:1px solid rgba(255,255,255,.05);font-size:10px;color:#b8c8d0}.em823Event b{color:var(--gold);min-width:26px}.em823Quiet{font-size:10px;color:var(--muted);padding:7px 2px}.em823Decision{margin:8px 0 12px}.em823DecisionLabel{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);font-weight:900;margin:0 2px 6px}
    .em821Board,.em80CanvasWrap,.v0712Pitch{animation:none!important}.em821Dot,.em821Ball{transition:none!important;animation:none!important}
  `;document.head.appendChild(st);
})();
