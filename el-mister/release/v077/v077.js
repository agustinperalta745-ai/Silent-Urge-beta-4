/* ===== El Míster v0.7.7 · inmersión: las mecánicas nunca hablan como videojuego ===== */
function v077SkillFeedback(p,kind,success){
 if(success){
  if(kind==='penalty')return `${p.name} espera el movimiento del arquero y coloca el penal contra un palo.`;
  if(kind==='freekick')return `${p.name} supera la barrera con un remate preciso y la pelota termina en la red.`;
  return `${p.name} acomoda el cuerpo y define con precisión ante la salida del arquero.`
 }
 if(kind==='penalty')return pick([`${p.name} cruza demasiado el remate y la pelota se va afuera.`,`El arquero adivina la intención de ${p.name} y contiene el penal.`,`El remate de ${p.name} se estrella contra el palo.`]);
 if(kind==='freekick')return pick([`El remate de ${p.name} pasa apenas por encima del travesaño.`,`La barrera alcanza a desviar el tiro de ${p.name}.`,`El arquero vuela y rechaza el tiro libre de ${p.name}.`]);
 return pick([`${p.name} define apurado y la pelota se va ancha.`,`El arquero achica bien y tapa el remate de ${p.name}.`,`Un defensor alcanza a bloquear la definición de ${p.name}.`])
}

v062FinishMiniDecision=function(success,title,icon,feedback,effects,choice,defensiveSuccess=false){
 v062ClearMiniTimers();let l=S.live,s=l?.scenario;if(!l||!s)return;let label=choice?.t||'Acción';
 l.decisions.push({m:l.minute,title:s.t,choice:label,feedback});
 l.events.push({m:l.minute,type:'decision',txt:`⚽ ${label}`});
 l.stopIndex++;l.scenario=null;save();
 showConsequence({type:success?'success':'danger',icon,title,text:feedback,effects,duration:3100,onDone:runNextStop})
};

v06StartSkillGame=function(kind,p,choice){
 let l=S.live,d=v062Difficulty(p,kind),width=clamp(29-d.difficulty*.18+(d.skill-70)*.05,10,27),center=ri(26,74),speed=clamp(.055+d.difficulty*.00082-(d.skill-70)*.00012,.052,.135);_v06SkillGame={kind,pid:p.id,choice,center,width,speed,pos:0,dir:1,last:performance.now(),stopped:false,diff:d};
 let copy=kind==='penalty'
  ?`El árbitro señala el punto penal. ${p.name} acomoda la pelota y espera la orden. Frená el indicador en la zona marcada para dirigir bien el remate.`
  :kind==='freekick'
   ?`La barrera ya está armada y el arquero ordena a sus compañeros. Ajustá el remate de ${p.name} y frená el indicador en la zona marcada.`
   :`${p.name} queda de cara al arquero. Elegí el instante justo para definir antes de que se cierre el ángulo.`;
 openModal(`<div class="eyebrow">${kind==='penalty'?'⚽ PENAL':kind==='freekick'?'🎯 TIRO LIBRE':'🔥 DEFINICIÓN'}</div><h2>${p.name}</h2><p>${copy}</p><div class="skillTrack"><div class="skillZone" style="left:${center-width/2}%;width:${width}%"></div><div id="v06SkillMarker" class="skillMarker"></div></div><button class="primary" onclick="v06StopSkillGame()">EJECUTAR</button>`);requestAnimationFrame(v06AnimateSkill)
};

v06StopSkillGame=function(){
 let g=_v06SkillGame;if(!g||g.stopped)return;g.stopped=true;let l=S.live,p=S.roster.find(x=>x.id===g.pid),dist=Math.abs(g.pos-g.center),success=dist<=g.width/2,title,icon,feedback;
 if(success){teamGoal(S.clubId,l.minute,g.kind==='penalty'?'penal':g.kind==='freekick'?'tiro libre':'mano a mano');title='¡GOL!';icon='⚽'}
 else{title=g.kind==='penalty'?pick(['ATAJÓ','AFUERA','AL PALO']):pick(['ATAJÓ','AFUERA','BLOQUEADO']);icon='❌'}
 feedback=v077SkillFeedback(p,g.kind,success);
 let effects=success
  ?[g.kind==='penalty'?'Definición desde los doce pasos':g.kind==='freekick'?'Remate directo al arco':'Definición mano a mano']
  :[g.kind==='penalty'?'La oportunidad se pierde':g.kind==='freekick'?'El tiro libre no termina en gol':'La ocasión no termina en gol'];
 v062FinishMiniDecision(success,title,icon,feedback,effects,g.choice)
};

v062StartLaneGame=function(p,choice){
 v062ClearMiniTimers();let d=v062Difficulty(p,'passing'),switchMs=Math.round(clamp(1250-d.difficulty*7+d.skill*2.2,520,1250));_v062LaneGame={pid:p.id,choice,open:ri(0,2),done:false,diff:d,switchMs};
 openModal(`<div class="eyebrow">⚡ CONTRAATAQUE</div><h2>${p.name}</h2><p>La defensa retrocede y va cerrando caminos. Tocá la línea que quede libre para que ${p.name} filtre el pase antes de que el rival la tape.</p><div id="v062Lanes" class="laneGame"></div><div class="small muted center">Leé el movimiento de la última línea y soltá la pelota en el momento justo.</div>`);v062RenderLanes();_v062LaneTimer=setInterval(()=>{if(!_v062LaneGame||_v062LaneGame.done)return;let n=ri(0,2);if(n===_v062LaneGame.open)n=(n+1)%3;_v062LaneGame.open=n;v062RenderLanes()},switchMs)
};

v062ChooseLane=function(i){
 let g=_v062LaneGame;if(!g||g.done)return;g.done=true;if(_v062LaneTimer){clearInterval(_v062LaneTimer);_v062LaneTimer=null}let l=S.live,p=S.roster.find(x=>x.id===g.pid),success=i===g.open,feedback,title,icon;
 if(success){teamGoal(S.clubId,l.minute,'contraataque');title='¡GOL!';icon='⚽';feedback=`${p.name} ve el hueco, mete el pase entre los defensores y la contra termina en gol.`}
 else{title='PASE INTERCEPTADO';icon='🧱';feedback='El defensor alcanza a cerrar la línea y corta el pase antes de que llegue al delantero.'}
 v062FinishMiniDecision(success,title,icon,feedback,[success?'La contra encuentra el espacio':'La defensa corta el avance'],g.choice)
};

v062StartMemoryGame=function(p,choice,source='corner'){
 v062ClearMiniTimers();let d=v062Difficulty(p,'cross'),showMs=Math.round(clamp(1450-d.difficulty*7+d.skill*3.2,600,1500)),target=ri(0,2);_v062MemoryGame={pid:p.id,choice,source,target,done:false,diff:d,hidden:false};let names=['PRIMER PALO','PUNTO PENAL','SEGUNDO PALO'];
 openModal(`<div class="eyebrow">🎯 PELOTA PARADA</div><h2>${p.name}</h2><p>El cuerpo técnico marca una zona de ataque. Mirá dónde se prepara el movimiento y, cuando desaparezca la señal, mandá el centro a ese sector.</p><div id="v062MemoryZones" class="memoryZones">${names.map((n,i)=>`<button class="memoryZone ${i===target?'target':''}" disabled><b>${i===target?'◎ ZONA':'·'}</b><span>${n}</span></button>`).join('')}</div><div id="v062MemoryHint" class="small muted center">Los jugadores toman posición…</div>`);
 _v062MemoryTimer=setTimeout(()=>{let g=_v062MemoryGame;if(!g||g.done)return;g.hidden=true;let el=document.getElementById('v062MemoryZones'),hint=document.getElementById('v062MemoryHint');if(el)el.innerHTML=names.map((n,i)=>`<button class="memoryZone" onclick="v062ChooseMemory(${i})"><b>?</b><span>${n}</span></button>`).join('');if(hint)hint.textContent='Elegí dónde mandar el centro.'},showMs)
};

v062ChooseMemory=function(i){
 let g=_v062MemoryGame;if(!g||g.done||!g.hidden)return;g.done=true;let l=S.live,p=S.roster.find(x=>x.id===g.pid),success=i===g.target,feedback,title,icon;
 if(success){teamGoal(S.clubId,l.minute,g.source==='freekick_cross'?'tiro libre':'córner');title='¡GOL!';icon='⚽';feedback=`${p.name} pone el centro justo en la zona preparada y la jugada termina en gol.`}
 else{title='CENTRO IMPRECISO';icon='🧱';feedback=`El envío de ${p.name} cae lejos del movimiento preparado y la defensa despeja.`}
 v062FinishMiniDecision(success,title,icon,feedback,[success?'La pelota cae en la zona preparada':'El rival gana el duelo aéreo'],g.choice)
};

v062StartKeeperGame=function(p,choice){
 v062ClearMiniTimers();let d=v062Difficulty(p,'keeper'),windowMs=Math.round(clamp(1250-d.difficulty*7+d.skill*3.5,520,1350)),cue=ri(0,2);_v062KeeperGame={pid:p.id,choice,cue,done:false,diff:d,windowMs,active:false};let names=['← IZQUIERDA','↑ CENTRO','DERECHA →'];
 openModal(`<div class="eyebrow">🧤 MANO A MANO</div><h2>${p.name}</h2><p>El delantero entra al área con tiempo para definir. Esperá su gesto y tocá el sector del remate antes de que sea tarde.</p><div id="v062KeeperZones" class="keeperZones">${names.map((n,i)=>`<button class="keeperZone" onclick="v062KeeperTap(${i})"><b>•</b><span>${n}</span></button>`).join('')}</div><div id="v062KeeperHint" class="small muted center">El delantero acomoda el cuerpo…</div>`);
 _v062KeeperTimer=setTimeout(()=>{let g=_v062KeeperGame;if(!g||g.done)return;g.active=true;let el=document.getElementById('v062KeeperZones'),hint=document.getElementById('v062KeeperHint');if(el)el.innerHTML=names.map((n,i)=>`<button class="keeperZone ${i===g.cue?'cue':''}" onclick="v062KeeperTap(${i})"><b>${i===g.cue?'⚡':'•'}</b><span>${n}</span></button>`).join('');if(hint)hint.textContent='¡REMATA!';_v062KeeperTimer=setTimeout(()=>v062KeeperTimeout(),windowMs)},ri(480,850))
};

v062ResolveKeeper=function(correct,late=false){
 let g=_v062KeeperGame;if(!g||g.done)return;g.done=true;if(_v062KeeperTimer){clearTimeout(_v062KeeperTimer);_v062KeeperTimer=null}let l=S.live,p=S.roster.find(x=>x.id===g.pid),saved=!!correct&&!late,feedback,title,icon;
 if(saved){title='¡ATAJÓ!';icon='🧤';feedback=`${p.name} aguanta hasta el último instante, lee la definición y tapa el mano a mano.`}
 else{teamGoal(l.opponent,l.minute,'mano a mano');title='GOL RIVAL';icon='🥅';feedback=late?`${p.name} reacciona tarde y el delantero define antes de que pueda cubrir el arco.`:`El delantero engaña a ${p.name} y encuentra el sector libre.`}
 v062FinishMiniDecision(saved,title,icon,feedback,[saved?'Gran respuesta del arquero':'El rival aprovecha el mano a mano'],g.choice,saved)
};

v067StopShot=function(){
 let g=_v067ShotGame;if(!g||g.stopped)return;g.stopped=true;let p=S.roster.find(x=>x.id===g.pid),l=S.live,dist=Math.abs(g.pos-g.center),inside=dist<=g.width/2,perfect=dist<=g.width*.18,hard=(g.type==='long'||g.type==='volley'),goal=inside,title,icon,feedback;
 if(goal){teamGoal(S.clubId,l.minute,hard?'golazo':'remate');let golazo=hard&&perfect;title=golazo?'¡GOLAZO!':'¡GOL!';icon='⚽';feedback=golazo?`${p.name} conecta de lleno y clava un remate espectacular, imposible para el arquero.`:`${p.name} encuentra el hueco y define con precisión para ponerla adentro.`}
 else{title=pick(['AFUERA','BLOQUEADO','ATAJÓ']);icon='❌';feedback=title==='ATAJÓ'?`El arquero responde bien y contiene el remate de ${p.name}.`:title==='BLOQUEADO'?`Un defensor se cruza justo a tiempo y bloquea el disparo de ${p.name}.`:`El remate de ${p.name} se va apenas afuera.`}
 v062FinishMiniDecision(goal,title,icon,feedback,[goal?'La jugada termina en gol':'La ocasión se pierde'],g.choice)
};
