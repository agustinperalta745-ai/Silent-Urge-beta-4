 if(saved){point={x:50+(Math.random()-.5)*11,y:team==='us'?6:94};let gk=v0714Nearest(team==='us'?'them':'us',point,l,['ARQ']);v0714Comment(team==='us'?`${v0714Name(team,idx,l)} patea al arco y el arquero contiene.`:'El rival remata, pero tu arquero controla la pelota.',0,l);return v0714StartAction('shot-save',{team,fromIdx:idx,point,after:{team:team==='us'?'them':'us',idx:gk.i},duration:600},l)}
 point={x:50+(Math.random()<.5?-1:1)*(22+Math.random()*10),y:goalY};let other=team==='us'?'them':'us',gk=v0714Nearest(other,{x:50,y:team==='us'?7:93},l,['ARQ']);v0714Comment(team==='us'?`${v0714Name(team,idx,l)} prueba al arco y el remate se va afuera.`:'El remate rival sale desviado.',0,l);v0714StartAction('shot-wide',{team,fromIdx:idx,point,after:{team:other,idx:gk.i},duration:650},l)
}
function v0714Clearance(team,idx,l=S.live){let dir=v0714Dir(team),from=v0714Point(team,idx,l),point={x:28+Math.random()*44,y:clamp(from.y+dir*(28+Math.random()*14),8,92)},nearest=v0714Nearest(team,point,l,['MC','MCD','MCO','EI','ED','DC']);v0714Comment(team==='us'?`${v0714Name(team,idx,l)} despeja lejos del área y el equipo sale de la última línea.`:'La defensa rival rechaza el centro y adelanta el bloque.',0,l);v0714StartAction('clearance',{team,fromIdx:idx,point,after:{team,idx:nearest.i},duration:740},l)}
function v0714FootballAction(l=S.live){
 let v=v0714State(l);if(!v||v.action||Date.now()<v.nextActionAt)return;let team=v.poss,idx=v.carrier,slot=v0714Base(team)[idx]||{pos:'MC'},pos=slot.pos,phase=v0714Phase(team,l),side=v0714Side(l),point=v0714Point(team,idx,l),wide=point.x<30||point.x>70,dir=v0714Dir(team),r=Math.random();
 if(phase==='final'){
  let close=team==='us'?point.y<26:point.y>74;
  if(wide&&['EI','ED','LI','LD'].includes(pos)){
   if(close&&r<.48)return v0714Cross(team,idx,l,r<.20);
   if(r<.27)return v0714Carry(team,idx,l);
   let to=v0714Receiver(team,idx,l,r<.58?'through':'normal');return v0714Pass(team,idx,to,l,r<.58?'through':'pass')
  }
  if(['DC','MCO','MC','EI','ED'].includes(pos)&&close&&r<.46)return v0714Shot(team,idx,l,false);
  if(r<.20){let to=v0714Receiver(team,idx,l,'through'),dest=v0714Point(team,to,l);v0714Run(team,to,{x:dest.x,y:clamp(dest.y+dir*9,5,95)},l);return v0714Pass(team,idx,to,l,'through')}
  if(r<.38)return v0714Carry(team,idx,l);
  return v0714Pass(team,idx,v0714Receiver(team,idx,l),l,'pass')
 }
 if(phase==='middle'){
  if((pos==='LI'||pos==='LD')&&wide&&r<.25){let wing=v0714Nearest(team,{x:point.x,y:point.y+dir*18},l,['EI','ED']);if(wing){v0714Run(team,wing.i,{x:clamp(point.x,8,92),y:clamp(point.y+dir*22,5,95)},l);return v0714Pass(team,idx,wing.i,l,'through')}}
  if((pos==='EI'||pos==='ED')&&wide&&r<.23)return v0714Carry(team,idx,l);
  if(r<.16){let to=v0714Receiver(team,idx,l,'switch');return v0714Pass(team,idx,to,l,'switch')}
  if(r<.31)return v0714Carry(team,idx,l);
  return v0714Pass(team,idx,v0714Receiver(team,idx,l,r<.53?'through':'normal'),l,r<.53?'through':'pass')
 }
 // Salida: centrales abiertos, pivote y laterales dan líneas; el arquero nunca regala la pelota de frente.
 if(pos==='ARQ'){let to=v0714Nearest(team,{x:point.x+(Math.random()<.5?-22:22),y:point.y+dir*18},l,['DFC','LI','LD']).i;return v0714Pass(team,idx,to,l,'pass')}
 if((pos==='DFC'||pos==='MCD')&&r<.18)return v0714Carry(team,idx,l);
 if(r<.12){let to=v0714Receiver(team,idx,l,'switch');return v0714Pass(team,idx,to,l,'switch')}
 return v0714Pass(team,idx,v0714Receiver(team,idx,l),l,'pass')
}
function v0714SyncPlayers(l=S.live){let v=v0714State(l),a=v0714Slots(true,l),b=v0714Slots(false,l);a.forEach((q,i)=>{let e=document.getElementById('v0712u'+i);if(e){e.style.left=q.x+'%';e.style.top=q.y+'%';e.classList.toggle('v0714Carrier',v.poss==='us'&&v.carrier===i&&!v.action);e.classList.toggle('v0714Runner',!!(v.runner&&v.runner.team==='us'&&v.runner.idx===i&&Date.now()<v.runnerUntil))}});b.forEach((q,i)=>{let e=document.getElementById('v0712o'+i);if(e){e.style.left=q.x+'%';e.style.top=q.y+'%';e.classList.toggle('v0714Carrier',v.poss==='them'&&v.carrier===i&&!v.action);e.classList.toggle('v0714Runner',!!(v.runner&&v.runner.team==='them'&&v.runner.idx===i&&Date.now()<v.runnerUntil))}})}
function v0714Motion(l=S.live){let pitch=document.getElementById('v0712Pitch');if(!l||!pitch||l.scenario)return;let v=v0714State(l);v0714SyncPlayers(l);if(v0714FinishAction(l))return;if(v.runner&&Date.now()>=v.runnerUntil)v.runner=null;v0714FootballAction(l);if(!v.action){let p=v0714Point(v.poss,v.carrier,l);v.ball={x:p.x,y:p.y};v0714SetBall(p.x,p.y+v0714Dir(v.poss)*.65,.28)}}
v0713Motion=v0714Motion;v0712Motion=v0714Motion;

function v0714HandleEngineEvents(l=S.live){let v=v0714State(l),ev=l?.events||[];if(!v)return;let fresh=ev.slice(v.lastEventCount||0);v.lastEventCount=ev.length;if(!fresh.length)return;let goals=fresh.filter(e=>e.type==='goal'),last=goals[goals.length-1];if(last){let us=last.teamId===S.clubId,team=us?'us':'them',idx;if(us){idx=v0712Lineup(l).findIndex(p=>p.id===last.playerId);if(idx<0)idx=v0714Nearest('us',{x:50,y:18},l,['DC','MCO','EI','ED','MC']).i}else idx=v0714Nearest('them',{x:50,y:82},l,['DC','MCO','EI','ED','MC']).i;v.poss=team;v.carrier=idx;let p=v0714Point(team,idx,l);v.ball={x:p.x,y:p.y};return v0714Shot(team,idx,l,true)}let card=fresh.filter(e=>e.type==='card'||e.type==='red').slice(-1)[0];if(card)v0714Comment(card.txt||'El árbitro detiene el juego.',1300,l)}
v0713HandleEngineEvents=v0714HandleEngineEvents;

function v0714PitchHtml(l=S.live,compact=false){if(!l)return'';let us=v0712Lineup(l),a=v0714Slots(true,l),b=v0714Slots(false,l),v=v0714State(l),scene=l.scenario?v0712Scene(l):{ball:null,focus:''},bp=scene.ball||v0714Ball(l);let ud=a.map((q,i)=>{let p=us[i],n=p?squadNumber(p):i+1,car=!l.scenario&&v.poss==='us'&&v.carrier===i&&!v.action,run=v.runner&&v.runner.team==='us'&&v.runner.idx===i&&Date.now()<v.runnerUntil;return `<span id="v0712u${i}" class="v0712Dot us ${scene.focus===`us${i}`?'focus':''} ${car?'v0714Carrier':''} ${run?'v0714Runner':''}" style="left:${q.x}%;top:${q.y}%" title="${p?.name||''}">${n}</span>`}).join(''),od=b.map((q,i)=>{let car=!l.scenario&&v.poss==='them'&&v.carrier===i&&!v.action,run=v.runner&&v.runner.team==='them'&&v.runner.idx===i&&Date.now()<v.runnerUntil;return `<span id="v0712o${i}" class="v0712Dot them ${scene.focus===`them${i}`?'focus':''} ${car?'v0714Carrier':''} ${run?'v0714Runner':''}" style="left:${q.x}%;top:${q.y}%"></span>`}).join('');return `<div class="${compact?'v0712DecisionPitch':''}"><div class="v0712Pitch" id="v0712Pitch"><span class="v0712Box top"></span><span class="v0712Box bottom"></span><span class="v0712Goal top"></span><span class="v0712Goal bottom"></span>${ud}${od}<span id="v0712Ball" class="v0712Ball" style="left:${bp.x}%;top:${bp.y}%"></span></div><div class="v0712Legend"><span><i class="v0712Sw us"></i>${club(S.clubId).name}</span><span><i class="v0712Sw them"></i>${club(l.opponent).name}</span></div></div>`}
v0713PitchHtml=v0714PitchHtml;v0712PitchHtml=v0714PitchHtml;
v0712LastTicker=function(l=S.live){let v=v0714State(l);return `<b>${l?.minute||0}'</b> ${v?.comment||'El equipo ocupa los espacios y la jugada sigue.'}`};

