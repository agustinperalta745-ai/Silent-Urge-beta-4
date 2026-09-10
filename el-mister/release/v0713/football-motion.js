/* ===== El Míster v0.7.13 · simulación futbolera con posesión real ===== */
(function(){
 const st=document.createElement('style');
 st.textContent=`
 .v0712Dot{transition:left 1.05s ease,top 1.05s ease,transform .2s ease}
 .v0712Ball{transition:left .68s cubic-bezier(.25,.8,.35,1),top .68s cubic-bezier(.25,.8,.35,1)}
 .v0713Poss{font-size:8px;color:#a9bdc9;margin-top:4px;letter-spacing:.04em}
 .v0713Carrier{box-shadow:0 0 0 3px rgba(255,255,255,.12),0 2px 7px rgba(0,0,0,.42)}
 `;
 document.head.appendChild(st);
})();

function v0713State(l=S.live){
 if(!l)return null;
 if(!l.v0713Visual){
  let slots=v0712BaseSlots(),mid=slots.map((q,i)=>({i,d:Math.abs(q.y-56)+(q.pos==='ARQ'?80:0)})).sort((a,b)=>a.d-b.d)[0]?.i||5;
  l.v0713Visual={poss:'us',carrier:mid,phase:'middle',pass:null,drive:0,nextActionAt:Date.now()+1200,comment:'Tu equipo acomoda la pelota y empieza a construir la jugada.',commentLock:0,lastEventCount:(l.events||[]).length,serial:0};
 }
 return l.v0713Visual
}
function v0713Slots(us,l=S.live){
 let base=v0712ShapeAdjust(us?v0712BaseSlots():v0712MirrorSlots(),us,l),v=v0713State(l);
 if(!v)return base;
 let possUs=v.poss==='us',carrierTeam=us===possUs,carrierBase=carrierTeam?base[v.carrier]:null,ballY=carrierBase?.y??50,ballX=carrierBase?.x??50;
 let attackDir=us?-1:1,ownPoss=us===possUs;
 let zonePush=ownPoss?clamp((50-ballY)*.10*attackDir,-3.2,5.2):clamp((50-ballY)*.055*attackDir,-2.2,2.8);
 let lateral=clamp((ballX-50)*.07,-2.8,2.8);
 return base.map((q,i)=>{
  let y=q.y+zonePush,x=q.x+lateral;
  if(!ownPoss){x=50+(x-50)*.94;y+=attackDir*1.2}
  if(carrierTeam&&i===v.carrier&&v.drive)y+=attackDir*v.drive;
  return {...q,x:clamp(x,6,94),y:clamp(y,4,96)}
 })
}
function v0713DomPoint(team,idx,l=S.live){
 let slots=v0713Slots(team==='us',l),q=slots[idx]||slots[5]||{x:50,y:50};
 let el=document.getElementById(team==='us'?'v0712u'+idx:'v0712o'+idx);
 if(el){let x=parseFloat(el.style.left),y=parseFloat(el.style.top);if(Number.isFinite(x)&&Number.isFinite(y))return{x,y}}
 return{x:q.x,y:q.y}
}
function v0713BallTo(x,y,duration=.68){
 let b=document.getElementById('v0712Ball');if(!b)return;
 b.style.transitionDuration=duration+'s';b.style.left=clamp(x,2,98)+'%';b.style.top=clamp(y,1,99)+'%'
}
function v0713PlayerName(team,idx,l=S.live){
 if(team==='us'){
  let p=v0712Lineup(l)[idx];if(p)return p.name.split(' ').slice(-1)[0]
 }
 return club(l.opponent).name
}
function v0713SetComment(txt,lock=0,l=S.live){let v=v0713State(l);if(!v)return;if(Date.now()<(v.commentLock||0)&&!lock)return;v.comment=txt;if(lock)v.commentLock=Date.now()+lock;let e=document.getElementById('v0712Ticker');if(e)e.innerHTML=`<b>${l.minute}'</b> ${txt}`}
function v0713Phase(team,idx,l=S.live){let q=(team==='us'?v0712BaseSlots():v0712MirrorSlots())[idx]||{y:50};if(team==='us')return q.y>64?'build':q.y<36?'attack':'middle';return q.y<36?'build':q.y>64?'attack':'middle'}
function v0713NearestOpponent(team,idx,l=S.live){
 let mine=team==='us'?v0713Slots(true,l):v0713Slots(false,l),other=team==='us'?v0713Slots(false,l):v0713Slots(true,l),a=mine[idx]||mine[5]||{x:50,y:50};
 return other.map((q,i)=>({i,d:Math.hypot(q.x-a.x,q.y-a.y)})).sort((x,y)=>x.d-y.d)[0]?.i||5
}
function v0713ChooseReceiver(team,idx,l=S.live){
 let slots=team==='us'?v0713Slots(true,l):v0713Slots(false,l),from=slots[idx]||slots[5],dir=team==='us'?-1:1,phase=v0713Phase(team,idx,l);
 let c=slots.map((q,i)=>{if(i===idx)return null;let d=Math.hypot(q.x-from.x,q.y-from.y),prog=(q.y-from.y)*dir,score=0;if(d<8||d>45)score-=20;else score+=18-Math.abs(d-24)*.35;score+=prog*(phase==='build'?0.65:phase==='middle'?0.45:0.18);if(q.pos==='ARQ')score-=phase==='attack'?18:5;if(phase==='attack'&&prog<0)score+=4;score+=Math.random()*7;return{i,score}}).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,4);
 if(!c.length)return idx;let weights=[.46,.29,.17,.08],r=Math.random(),acc=0;for(let i=0;i<c.length;i++){acc+=weights[i]||.05;if(r<=acc)return c[i].i}return c[0].i
}
function v0713StartPass(toTeam,toIdx,turnover=false,l=S.live){
 let v=v0713State(l);if(!v)return;let fromTeam=v.poss,fromIdx=v.carrier,fromName=v0713PlayerName(fromTeam,fromIdx,l),toName=v0713PlayerName(toTeam,toIdx,l),p=v0713DomPoint(toTeam,toIdx,l);
 v.drive=0;v.pass={toTeam,toIdx,endAt:Date.now()+720,turnover};v.serial++;
 v0713BallTo(p.x,p.y,.70);
 if(turnover)v0713SetComment(`${fromName} intenta progresar, pero ${toTeam==='us'?toName:'el rival'} corta la jugada.`,0,l);
 else v0713SetComment(fromTeam==='us'?`${fromName} toca para ${toName} y el equipo mantiene la posesión.`:`${club(l.opponent).name} circula la pelota sin apurarse.`,0,l)
}
function v0713FinishPass(l=S.live){let v=v0713State(l);if(!v?.pass)return false;if(Date.now()<v.pass.endAt)return true;v.poss=v.pass.toTeam;v.carrier=v.pass.toIdx;v.phase=v0713Phase(v.poss,v.carrier,l);v.pass=null;v.nextActionAt=Date.now()+900+Math.random()*850;return false}
function v0713FootballAction(l=S.live){
 let v=v0713State(l);if(!v||v.pass||Date.now()<v.nextActionAt)return;
 let phase=v0713Phase(v.poss,v.carrier,l),flow=l.flow||{},usBias=.5+clamp(((flow.userThreat||0)-(flow.oppThreat||0))*.025,-.10,.10),keep=v.poss==='us'?usBias:1-usBias;
 let lossChance=phase==='attack'?.16:phase==='middle'?.105:.075;lossChance+=Math.max(0,.52-keep)*.12;if(l.context?.pressHigh&&v.poss==='them')lossChance+=.035;if(l.context?.lowBlock&&v.poss==='us')lossChance-=.015;
 let r=Math.random();
 if(r<lossChance){let oi=v0713NearestOpponent(v.poss,v.carrier,l);return v0713StartPass(v.poss==='us'?'them':'us',oi,true,l)}
 if(r<lossChance+.18&&phase!=='attack'){
  v.drive=2.2+Math.random()*1.7;v.nextActionAt=Date.now()+1100;let name=v0713PlayerName(v.poss,v.carrier,l);v0713SetComment(v.poss==='us'?`${name} conduce unos metros y espera que aparezca una línea de pase.`:`El rival conduce y tu bloque acompaña sin romperse.`,0,l);return
 }
 let to=v0713ChooseReceiver(v.poss,v.carrier,l);v0713StartPass(v.poss,to,false,l)
}
function v0713SyncPlayers(l=S.live){
 let a=v0713Slots(true,l),b=v0713Slots(false,l),v=v0713State(l);
 a.forEach((q,i)=>{let e=document.getElementById('v0712u'+i);if(e){e.style.left=q.x+'%';e.style.top=q.y+'%';e.classList.toggle('v0713Carrier',v.poss==='us'&&v.carrier===i&&!v.pass)}});
 b.forEach((q,i)=>{let e=document.getElementById('v0712o'+i);if(e){e.style.left=q.x+'%';e.style.top=q.y+'%';e.classList.toggle('v0713Carrier',v.poss==='them'&&v.carrier===i&&!v.pass)}})
}
function v0713Motion(){
 let l=S.live,pitch=document.getElementById('v0712Pitch');if(!l||!pitch||l.scenario)return;let v=v0713State(l);v0713SyncPlayers(l);
 if(v0713FinishPass(l)){return}
 v0713FootballAction(l);
 if(!v.pass){let p=v0713DomPoint(v.poss,v.carrier,l),dir=v.poss==='us'?-1:1;v0713BallTo(p.x,p.y+dir*.8,.42)}
}
function v0713HandleEngineEvents(l=S.live){
 let v=v0713State(l),ev=l.events||[];if(!v)return;let fresh=ev.slice(v.lastEventCount||0);v.lastEventCount=ev.length;if(!fresh.length)return;
 let last=fresh[fresh.length-1];
 if(last.type==='goal'){
  let scoredUs=last.teamId===S.clubId;v.pass=null;v.drive=0;v0713BallTo(50,scoredUs?1.5:98.5,.55);v0713SetComment(last.txt,2200,l);v.poss=scoredUs?'them':'us';let slots=v.poss==='us'?v0712BaseSlots():v0712MirrorSlots();v.carrier=slots.map((q,i)=>({i,d:Math.abs(q.y-50)+(q.pos==='ARQ'?80:0)})).sort((a,b)=>a.d-b.d)[0]?.i||5;v.nextActionAt=Date.now()+2300
 }else if(last.type==='card'){v0713SetComment(last.txt,1600,l)}
}
function v0713PitchHtml(l=S.live,compact=false){
 if(!l)return'';let us=v0712Lineup(l),a=v0713Slots(true,l),b=v0713Slots(false,l),v=v0713State(l),scene=l.scenario?v0712Scene(l):{ball:null,focus:''};
 let bp=scene.ball||v0713DomPoint(v.poss,v.carrier,l);
 let ud=a.map((q,i)=>{let p=us[i],n=p?squadNumber(p):i+1,car=!l.scenario&&v.poss==='us'&&v.carrier===i&&!v.pass;return `<span id="v0712u${i}" class="v0712Dot us ${scene.focus===`us${i}`?'focus':''} ${car?'v0713Carrier':''}" style="left:${q.x}%;top:${q.y}%" title="${p?.name||''}">${n}</span>`}).join('');
 let od=b.map((q,i)=>{let car=!l.scenario&&v.poss==='them'&&v.carrier===i&&!v.pass;return `<span id="v0712o${i}" class="v0712Dot them ${scene.focus===`them${i}`?'focus':''} ${car?'v0713Carrier':''}" style="left:${q.x}%;top:${q.y}%"></span>`}).join('');
 return `<div class="${compact?'v0712DecisionPitch':''}"><div class="v0712Pitch" id="v0712Pitch"><span class="v0712Box top"></span><span class="v0712Box bottom"></span><span class="v0712Goal top"></span><span class="v0712Goal bottom"></span>${ud}${od}<span id="v0712Ball" class="v0712Ball" style="left:${bp.x}%;top:${bp.y}%"></span></div><div class="v0712Legend"><span><i class="v0712Sw us"></i>${club(S.clubId).name}</span><span><i class="v0712Sw them"></i>${club(l.opponent).name}</span></div></div>`
}
v0712PitchHtml=v0713PitchHtml;
v0712Motion=v0713Motion;
v0712LastTicker=function(l=S.live){let v=v0713State(l);return `<b>${l?.minute||0}'</b> ${v?.comment||'La jugada se desarrolla con paciencia.'}`};

v0712RenderVisual=function(){
 let l=S.live;if(!l)return render();v0712StopVisual();let token=_v0712RunToken,v=v0713State(l);v.phase='running';
 document.getElementById('modalRoot').innerHTML=`<div class="modalBg v0712MatchBg"><div class="modal"><div class="v0712Top"><div><div id="v0712Minute" class="v0712Minute">${l.minute}' · PARTIDO EN JUEGO</div><div id="v0712Score" class="score">${l.gh} – ${l.ga}</div><div class="v0712Teams">${club(l.home).name} · ${club(l.away).name}</div><div class="v0713Poss">${v.poss==='us'?'Tu equipo tiene la pelota':'Posesión rival'}</div></div><span class="v0712LivePill">SIMULACIÓN DE PARTIDO</span></div>${v0713PitchHtml(l)}<div id="v0712Ticker" class="v0712Ticker">${v0712LastTicker(l)}</div><div class="v0712Actions"><button class="secondary" onclick="v0712ManualSubs()">⏸ DT / Cambios</button></div><div class="v0712Paused">La cancha representa la jugada actual: el partido se frena solo cuando necesita tu decisión.</div></div></div>`;
 v0713Motion();_v0712MotionTimer=setInterval(v0713Motion,850);_v0712TickTimer=setTimeout(()=>v0712Advance(token),650)
};
v0712Advance=function(token){
 if(token!==_v0712RunToken)return;let l=S.live;if(!l||l.scenario)return;try{
  let target=Math.min(90,(l.minute||0)+1);simulateSegment(target);v0713HandleEngineEvents(l);v0712RefreshHud(l);v0713Motion();
  let poss=document.querySelector('.v0713Poss'),v=v0713State(l);if(poss)poss.textContent=v.poss==='us'?'Tu equipo tiene la pelota':'Posesión rival';
  if(l.v067PendingImpact){v0712StopVisual();return v067ShowPendingImpact()}
  if(target===45&&!l.halftimeShown){l.halftimeShown=true;save();v0712StopVisual();return v063RenderHalftime()}
  if(target<90&&v062ShouldPause(l)){l.scenario=makeMatchScenario(l.stopIndex);save();v0712StopVisual();return renderLiveDecision()}
  if(target>=90){v0712StopVisual();return finishRegulation()}
  save();_v0712TickTimer=setTimeout(()=>v0712Advance(token),650)
 }catch(e){console.error('v0713 match simulation',e);v0712StopVisual();try{v063AdvanceUntilDecision()}catch(x){console.error('v0713 fallback',x)}}
};

try{if(S?.live){v0713State(S.live);save()}}catch(e){console.error('v0713 visual migration',e)}
