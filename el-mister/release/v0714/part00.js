/* ===== El Míster v0.7.14 · partido vivo: movimientos, acciones y decisiones con lógica ===== */
(function(){
 const st=document.createElement('style');
 st.textContent=`
 .v0714Phase{font-size:8px;color:#c9d7df;margin-top:3px}.v0714Phase b{color:#fff}
 .v0714Carrier{box-shadow:0 0 0 3px rgba(255,255,255,.16),0 2px 8px rgba(0,0,0,.48)!important}
 .v0714Runner{box-shadow:0 0 0 3px rgba(85,214,147,.15),0 2px 7px rgba(0,0,0,.42)!important}
 .v0712Ball{transition:left .54s cubic-bezier(.22,.75,.3,1),top .54s cubic-bezier(.22,.75,.3,1)}
 .v0712Dot{transition:left .72s ease,top .72s ease,transform .18s ease}
 `;
 document.head.appendChild(st)
})();

function v0714Base(team){return team==='us'?v0712BaseSlots():v0712MirrorSlots()}
function v0714Dir(team){return team==='us'?-1:1}
function v0714State(l=S.live){
 if(!l)return null;
 if(!l.v0714Visual){
  let base=v0714Base('us'),carrier=base.map((q,i)=>({i,d:Math.abs(q.y-55)+(q.pos==='ARQ'?80:0)})).sort((a,b)=>a.d-b.d)[0]?.i||5,q=base[carrier]||{x:50,y:55};
  l.v0714Visual={poss:'us',carrier,ball:{x:q.x,y:q.y},action:null,nextActionAt:Date.now()+650,comment:'Tu equipo sale jugando y cada línea ocupa su lugar.',commentLock:0,lastEventCount:(l.events||[]).length,lastAction:'kickoff',side:'center',sequence:0,runner:null,runnerUntil:0}
 }
 return l.v0714Visual
}
v0713State=v0714State;

function v0714Player(team,idx,l=S.live){if(team==='us')return v0712Lineup(l)[idx]||null;let q=v0714Base('them')[idx];return q?{name:club(l.opponent).name,pos:q.pos,ovr:club(l.opponent).r||70}:null}
function v0714Name(team,idx,l=S.live){let p=v0714Player(team,idx,l);if(team==='us'&&p)return p.name.split(/\s+/).slice(-1)[0];let pos=p?.pos;return pos==='ARQ'?'El arquero rival':pos==='DC'?'El 9 rival':pos==='LI'||pos==='LD'?'El lateral rival':pos==='EI'||pos==='ED'?'El extremo rival':'El rival'}
function v0714Quality(team,idx,kind='passing',l=S.live){let p=v0714Player(team,idx,l);if(!p)return 68;if(team!=='us')return clamp((club(l.opponent).r||70)+(Math.random()*4-2),52,92);let m=typeof playerCareerMetrics==='function'?playerCareerMetrics(p):{};let s=p.skills||{};if(kind==='passing')return s.passing||m.decision||p.ovr;if(kind==='finishing')return s.finishing||m.composure||p.ovr;if(kind==='technique')return s.technique||m.decision||p.ovr;if(kind==='defense')return s.defense||m.decision||p.ovr;return p.ovr}
function v0714Ball(l=S.live){let v=v0714State(l);if(!v)return{x:50,y:50};if(v.action?.point)return v.action.point;return v.ball||{x:50,y:50}}
function v0714Phase(team,l=S.live){let b=v0714Ball(l),progress=team==='us'?100-b.y:b.y;if(progress<36)return'build';if(progress<68)return'middle';return'final'}
function v0714Side(l=S.live){let x=v0714Ball(l).x;return x<36?'left':x>64?'right':'center'}
function v0714PhaseLabel(team,l=S.live){let p=v0714Phase(team,l);return p==='build'?'Salida':p==='middle'?'Progresión':'Último tercio'}
function v0714Blend(a,b,t){return a+(b-a)*t}
function v0714Target(team,idx,l=S.live){
 let v=v0714State(l),base=v0714Base(team),q={...(base[idx]||{x:50,y:50,pos:'MC'})},dir=v0714Dir(team),own=v.poss===team,b=v0714Ball(l),phase=v0714Phase(team,l),side=v0714Side(l),pos=q.pos,ballSide=side==='center'||(side==='left'&&q.x<50)||(side==='right'&&q.x>50),ctx=l.context||{};
 if(pos==='ARQ'){
  q.x=50+(b.x-50)*.08;q.y=team==='us'?(phase==='build'&&own?86:92):(phase==='build'&&own?14:8);return q
 }
 if(own){
  if(pos==='DFC'){
   q.y+=dir*(phase==='build'?5:phase==='middle'?9:12);if(phase==='build')q.x=50+(q.x-50)*1.18;else q.x=50+(q.x-50)*.98
  }else if(pos==='LI'||pos==='LD'){
   let extra=ctx.fullbacksHigh?5:0;
   if(ballSide){q.y+=dir*((phase==='build'?8:phase==='middle'?15:21)+extra);q.x=50+(q.x-50)*1.12}
   else{q.y+=dir*(phase==='build'?4:phase==='middle'?7:10);q.x=50+(q.x-50)*.72}
  }else if(pos==='MCD'){
   let behind=b.y-dir*10;q.y=v0714Blend(q.y+dir*5,behind,.55);q.x=v0714Blend(q.x,50+(b.x-50)*.38,.45)
  }else if(pos==='MC'){
   if(ballSide){q.x=v0714Blend(q.x,b.x<50?Math.min(44,b.x+12):Math.max(56,b.x-12),.48);q.y=v0714Blend(q.y+dir*7,b.y-dir*4,.36)}
   else{q.x=50+(q.x-50)*.68;q.y+=dir*(phase==='final'?15:10)}
  }else if(pos==='MCO'){
   q.x=v0714Blend(q.x,50+(b.x-50)*.35,.58);q.y=v0714Blend(q.y+dir*(phase==='final'?8:13),b.y+dir*11,.45)
  }else if(pos==='EI'||pos==='ED'){
   if(ballSide){q.x=50+(q.x-50)*1.12;q.y+=dir*(phase==='build'?8:phase==='middle'?13:10)}
   else{q.x=50+(q.x-50)*(phase==='final'?.74:1.02);q.y+=dir*(phase==='final'?20:15)}
  }else if(pos==='DC'){
   q.x=v0714Blend(q.x,50+(b.x-50)*.16,.5);q.y=v0714Blend(q.y,b.y+dir*(phase==='build'?23:phase==='middle'?17:10),.6)
  }
  if(ctx.pressHigh&&phase!=='build'&&pos!=='DFC')q.y+=dir*2.5;
  if(ctx.lowBlock&&['DFC','LI','LD','MCD'].includes(pos))q.y-=dir*3
 }else{
  let defLine=team==='us'?clamp(b.y+18,61,82):clamp(b.y-18,18,39),shift=clamp((b.x-50)*.32,-9,9);
  if(pos==='DFC'){q.y=defLine;q.x=50+(q.x-50)*.86+shift*.28}
  else if(pos==='LI'||pos==='LD'){q.y=defLine+dir*1;q.x=ballSide?v0714Blend(q.x,b.x,.28):50+(q.x-50)*.78}
  else if(pos==='MCD'){q.y=defLine+dir*11;q.x=50+shift*.45}
  else if(pos==='MC'){q.y=defLine+dir*18;q.x=50+(q.x-50)*.7+shift*.42}
  else if(pos==='MCO'){q.y=defLine+dir*24;q.x=50+shift*.48}
  else if(pos==='EI'||pos==='ED'){q.y=defLine+dir*(ctx.lowBlock?17:27);q.x=50+(q.x-50)*(ctx.lowBlock?.72:.92)+shift*.28}
  else if(pos==='DC'){q.y=defLine+dir*(ctx.pressHigh?31:35);q.x=50+shift*.18}
  if(ctx.pressHigh&&['DC','EI','ED','MCO','MC'].includes(pos)){q.x=v0714Blend(q.x,b.x,.13);q.y=v0714Blend(q.y,b.y-dir*5,.09)}
 }
 if(v.runner&&v.runner.team===team&&v.runner.idx===idx&&Date.now()<v.runnerUntil){q.x=v.runner.x;q.y=v.runner.y}
 if(v.action?.type==='intercept'&&v.action.interceptor?.team===team&&v.action.interceptor.idx===idx){q.x=v.action.point.x;q.y=v.action.point.y}
 return {...q,x:clamp(q.x,5,95),y:clamp(q.y,4,96)}
}
function v0714Slots(us,l=S.live){let team=us?'us':'them';return v0714Base(team).map((_,i)=>v0714Target(team,i,l))}
v0713Slots=v0714Slots;

function v0714Point(team,idx,l=S.live){let q=v0714Target(team,idx,l),e=document.getElementById(team==='us'?'v0712u'+idx:'v0712o'+idx);if(e){let x=parseFloat(e.style.left),y=parseFloat(e.style.top);if(Number.isFinite(x)&&Number.isFinite(y))return{x,y}}return{x:q.x,y:q.y}}
function v0714SetBall(x,y,d=.5){let b=document.getElementById('v0712Ball');if(b){b.style.transitionDuration=d+'s';b.style.left=clamp(x,1,99)+'%';b.style.top=clamp(y,.8,99.2)+'%'}}
function v0714Comment(txt,lock=0,l=S.live){let v=v0714State(l);if(!v)return;if(Date.now()<(v.commentLock||0)&&!lock)return;v.comment=txt;if(lock)v.commentLock=Date.now()+lock;let e=document.getElementById('v0712Ticker');if(e)e.innerHTML=`<b>${l.minute}'</b> ${txt}`}
function v0714Nearest(team,point,l=S.live,filter=null){let a=v0714Slots(team==='us',l).map((q,i)=>({i,q,d:Math.hypot(q.x-point.x,q.y-point.y),pos:q.pos}));if(filter)a=a.filter(x=>filter.includes(x.pos));return a.sort((x,y)=>x.d-y.d)[0]||{i:5,q:a[0]?.q||point,d:99}}
