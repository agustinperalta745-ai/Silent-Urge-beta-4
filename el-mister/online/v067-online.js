/* El Míster v0.6.7 · Online 1v1 */
const V067_ONLINE_API='https://el-mister-online.agustinperalta745.workers.dev';
let V067_ONLINE={token:'',slot:null,state:null,ws:null,selected:null,locked:false,needleX:0,needleDir:1,timer:null,connecting:false,error:''};

function v067OnlineEsc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function v067OnlinePlayerId(){let id=localStorage.getItem('elmisterOnlinePlayerId');if(!id){let r=()=>Math.random().toString(16).slice(2);id=(globalThis.crypto?.randomUUID?.()||`${Date.now().toString(16)}-${r()}-${r()}`);localStorage.setItem('elmisterOnlinePlayerId',id)}return id}
async function v067OnlineReq(path,opt={}){let r=await fetch(V067_ONLINE_API+path,{headers:{'content-type':'application/json'},...opt}),d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.message||`Error Online (${r.status})`);return d}
function v067OnlineSetError(e){V067_ONLINE.error=e?.message||String(e||'No se pudo conectar.');if(view==='online')render()}
function v067OnlineClearError(){V067_ONLINE.error=''}
function v067OnlinePersist(){if(!V067_ONLINE.state?.code||!V067_ONLINE.token)return;localStorage.setItem('elmisterOnlineSession',JSON.stringify({code:V067_ONLINE.state.code,token:V067_ONLINE.token,slot:V067_ONLINE.slot}))}
function v067OnlineForget(){localStorage.removeItem('elmisterOnlineSession')}

async function v067OnlineCreate(){
 if(V067_ONLINE.connecting)return;V067_ONLINE.connecting=true;v067OnlineClearError();if(view==='online')render();
 try{let name=(S?.manager||'Míster').trim()||'Míster',d=await v067OnlineReq('/api/rooms',{method:'POST',body:JSON.stringify({name,playerId:v067OnlinePlayerId()})});v067OnlineEnter(d)}catch(e){v067OnlineSetError(e)}finally{V067_ONLINE.connecting=false;if(view==='online')render()}
}
async function v067OnlineJoin(){
 let input=document.getElementById('v067OnlineCode'),code=(input?.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==7)return v067OnlineSetError(new Error('Ingresá el código de 7 caracteres.'));
 if(V067_ONLINE.connecting)return;V067_ONLINE.connecting=true;v067OnlineClearError();if(view==='online')render();
 try{let name=(S?.manager||'Míster').trim()||'Míster',d=await v067OnlineReq('/api/rooms/'+code+'/join',{method:'POST',body:JSON.stringify({name,playerId:v067OnlinePlayerId()})});v067OnlineEnter(d)}catch(e){v067OnlineSetError(e)}finally{V067_ONLINE.connecting=false;if(view==='online')render()}
}
function v067OnlineEnter(d){
 v067OnlineStopTiming();if(V067_ONLINE.ws)try{V067_ONLINE.ws.close()}catch{}
 V067_ONLINE.token=d.token||'';V067_ONLINE.slot=Number(d.slot);V067_ONLINE.state=d.state||null;V067_ONLINE.selected=null;V067_ONLINE.locked=false;V067_ONLINE.needleX=0;V067_ONLINE.needleDir=1;v067OnlinePersist();v067OnlineConnect();if(view==='online')render()
}
function v067OnlineConnect(){
 let o=V067_ONLINE;if(!o.state?.code||!o.token)return;if(o.ws&&(o.ws.readyState===0||o.ws.readyState===1))return;
 try{let ws=new WebSocket(V067_ONLINE_API.replace(/^http/,'ws')+'/api/rooms/'+o.state.code+'/ws?token='+encodeURIComponent(o.token));o.ws=ws;
 ws.onopen=()=>{o.error='';if(view==='online')render()};
 ws.onmessage=e=>{try{let m=JSON.parse(e.data);if(!m.state)return;let prev=o.state,next=m.state,changedKick=prev?.penalties?.totalKicks!==next.penalties?.totalKicks,changedShooter=prev?.penalties?.shooterSlot!==next.penalties?.shooterSlot,changedStatus=prev?.status!==next.status;o.state=next;if(changedKick||changedShooter||changedStatus){o.selected=null;o.locked=false;o.needleX=0;o.needleDir=1}v067OnlinePersist();if(view==='online')render()}catch{}};
 ws.onerror=()=>{};
 ws.onclose=()=>{if(o.ws===ws)o.ws=null;if(o.state&&o.state.status!=='finished'&&o.token)setTimeout(()=>v067OnlineConnect(),1600);if(view==='online')render()};
 }catch(e){v067OnlineSetError(e)}
}
function v067OnlineSelect(d){if(V067_ONLINE.locked)return;V067_ONLINE.selected=Number(d);if(view==='online')render()}
function v067OnlineStartTiming(){let o=V067_ONLINE;if(o.timer||o.locked||o.state?.status!=='playing'||o.state?.penalties?.shooterSlot!==o.slot)return;o.timer=setInterval(()=>{o.needleX+=o.needleDir*2.6;if(o.needleX>=99){o.needleX=99;o.needleDir=-1}if(o.needleX<=0){o.needleX=0;o.needleDir=1}let n=document.getElementById('v067OnlineNeedle');if(n)n.style.left=o.needleX+'%'},28)}
function v067OnlineStopTiming(){let o=V067_ONLINE;if(o.timer){clearInterval(o.timer);o.timer=null}}
async function v067OnlineLock(){
 let o=V067_ONLINE;if(o.locked)return;if(o.selected===null)return toast('Elegí una dirección.');let shooter=o.state?.penalties?.shooterSlot===o.slot,timing=.5;if(shooter){v067OnlineStopTiming();timing=Math.max(0,1-Math.abs(o.needleX-50)/50)}o.locked=true;v067OnlineClearError();if(view==='online')render();
 try{let d=await v067OnlineReq('/api/rooms/'+o.state.code+'/penalty/choice',{method:'POST',body:JSON.stringify({token:o.token,direction:o.selected,timing})}),prev=o.state;o.state=d.state;if(prev?.penalties?.totalKicks!==d.state?.penalties?.totalKicks){o.selected=null;o.locked=false;o.needleX=0;o.needleDir=1}v067OnlinePersist();if(view==='online')render()}catch(e){o.locked=false;v067OnlineSetError(e)}
}
async function v067OnlineRematch(){try{let d=await v067OnlineReq('/api/rooms/'+V067_ONLINE.state.code+'/rematch',{method:'POST',body:JSON.stringify({token:V067_ONLINE.token})});V067_ONLINE.state=d.state;V067_ONLINE.selected=null;V067_ONLINE.locked=false;V067_ONLINE.needleX=0;V067_ONLINE.needleDir=1;v067OnlinePersist();if(view==='online')render()}catch(e){v067OnlineSetError(e)}}
function v067OnlineLeave(){v067OnlineStopTiming();if(V067_ONLINE.ws)try{V067_ONLINE.ws.close()}catch{};V067_ONLINE={token:'',slot:null,state:null,ws:null,selected:null,locked:false,needleX:0,needleDir:1,timer:null,connecting:false,error:''};v067OnlineForget();render()}
async function v067OnlineResume(){if(V067_ONLINE.state||V067_ONLINE.connecting)return;let raw=localStorage.getItem('elmisterOnlineSession');if(!raw)return;try{let saved=JSON.parse(raw);if(!saved?.code||!saved?.token)return v067OnlineForget();V067_ONLINE.connecting=true;let d=await v067OnlineReq('/api/rooms/'+saved.code);V067_ONLINE.token=saved.token;V067_ONLINE.slot=Number(saved.slot);V067_ONLINE.state=d.state;V067_ONLINE.connecting=false;v067OnlineConnect();if(view==='online')render()}catch{V067_ONLINE.connecting=false;v067OnlineForget()}}
function v067OnlineConnected(){return V067_ONLINE.ws?.readyState===1}
function v067OnlineKickDots(p){return (p?.kicks||[]).map(k=>`<span class="onlineKick ${v067OnlineEsc(k.outcome)}">${k.outcome==='goal'?'✓':'×'}</span>`).join('')}
function v067OnlineRoomHtml(){
 let o=V067_ONLINE,s=o.state,p=s.penalties||{},a=s.players?.[0],b=s.players?.[1],status=s.status,shooting=p.shooterSlot===o.slot,winner=p.winnerSlot;
 let top=`<div class="card onlineHero"><div class="row between"><div class="onlineStatus"><i class="onlineDot ${v067OnlineConnected()?'on':''}"></i>${v067OnlineConnected()?'Conectado':'Reconectando…'}</div><button class="ghost" style="width:auto" onclick="v067OnlineLeave()">Salir</button></div><div class="onlineCode">${v067OnlineEsc(s.code)}</div><div class="muted small center">Código de sala</div><div class="onlineScore"><div class="onlineName">${v067OnlineEsc(a?.name||'DT 1')}</div><strong>${p.score?.[0]||0} - ${p.score?.[1]||0}</strong><div class="onlineName">${v067OnlineEsc(b?.name||'Esperando')}</div></div><div class="onlineKickLog">${v067OnlineKickDots(p)}</div></div>`;
 if(status==='waiting')return top+`<div class="card center"><div style="font-size:28px">📡</div><h2>Esperando rival</h2><p>Pasale el código <b>${v067OnlineEsc(s.code)}</b> al otro DT. Cuando entre, la tanda arranca sola.</p></div>`;
 if(status==='finished'){let won=winner===o.slot,name=s.players?.[winner]?.name||'Un DT';return top+`<div class="card center"><div style="font-size:34px">${won?'🏆':'🏁'}</div><h2>${won?'¡Ganaste!':'Tanda finalizada'}</h2><p>${v067OnlineEsc(name)} ganó ${p.score?.[winner]||0}-${p.score?.[1-winner]||0}.</p><button class="primary" onclick="v067OnlineRematch()">REVANCHA</button></div>`}
 let dirs=[['0','↖'],['1','↑'],['2','↗'],['3','←'],[null,'•'],['4','→'],['5','↙'],['6','↓'],['7','↘']];let buttons=dirs.map(([d,x])=>d===null?`<button class="onlineDir blank" disabled>•</button>`:`<button class="onlineDir ${o.selected===Number(d)?'selected':''}" onclick="v067OnlineSelect(${d})" ${o.locked?'disabled':''}>${x}</button>`).join('');
 let role=shooting?'⚽ Te toca patear':'🧤 Te toca atajar',help=shooting?'Elegí el lugar y después frená la precisión.':'Elegí hacia dónde tirarte. La dirección del rival permanece oculta.';
 let timing=shooting?`<div><div class="small muted" style="font-weight:900">PRECISIÓN DEL REMATE</div><div class="onlineTiming"><div class="onlineTimingZone"></div><div id="v067OnlineNeedle" class="onlineNeedle" style="left:${o.needleX}%"></div></div></div>`:'';
 let action=o.locked?`<div class="onlineLocked">🔒 Elección confirmada. Esperando al otro DT…</div>`:`<button class="primary" onclick="v067OnlineLock()">CONFIRMAR EN SECRETO</button>`;
 return top+`<div class="card"><div class="eyebrow">PENAL ${Number(p.totalKicks||0)+1}</div><h2>${role}</h2><p>${help}</p><div class="onlineDirs">${buttons}</div>${timing}${action}</div>`
}
function renderOnline(){
 let o=V067_ONLINE;if(!o.state){let err=o.error?`<div class="onlineError">${v067OnlineEsc(o.error)}</div>`:'';return `${topShell()}<div class="content"><div class="card onlineHero"><div class="eyebrow">🌐 ONLINE · ALPHA</div><h1 style="margin:5px 0">Duelo de penales 1v1</h1><p>Ya está integrado en El Míster. Creá una sala o entrá con el código de otro DT; no hace falta abrir ninguna web externa.</p><div class="notice"><b>Tu DT:</b> ${v067OnlineEsc(S?.manager||'Míster')} · conexión en tiempo real.</div></div><div class="card"><button class="primary" onclick="v067OnlineCreate()" ${o.connecting?'disabled':''}>${o.connecting?'CONECTANDO…':'CREAR SALA'}</button><div class="divider"></div><input id="v067OnlineCode" class="input" maxlength="7" placeholder="Código de 7 caracteres" style="text-transform:uppercase"><button class="secondary" onclick="v067OnlineJoin()" ${o.connecting?'disabled':''}>ENTRAR A SALA</button>${err}</div><div class="card"><div class="sectionTitle">Modo disponible</div><div class="notice"><b>⚽ Penales Online</b><br>Dos teléfonos · elecciones ocultas · cinco remates por lado + muerte súbita.</div><div class="muted small" style="margin-top:10px">El partido táctico Online se agregará sobre esta misma conexión una vez estabilizada la tanda.</div></div></div>${nav()}`}
 let err=o.error?`<div class="onlineError">${v067OnlineEsc(o.error)}</div>`:'';return `${topShell()}<div class="content">${v067OnlineRoomHtml()}${err}</div>${nav()}`
}
function v067OnlineAfterRender(){if(view!=='online'){v067OnlineStopTiming();return}if(!V067_ONLINE.state){v067OnlineResume();return}v067OnlineConnect();let shooting=V067_ONLINE.state.status==='playing'&&V067_ONLINE.state.penalties?.shooterSlot===V067_ONLINE.slot;if(shooting&&!V067_ONLINE.locked)v067OnlineStartTiming();else v067OnlineStopTiming()}

nav=function(){return `<div class="bottomNav v067OnlineNav">${[['home','⌂','Inicio'],['squad','♟','Plantel'],['online','🌐','Online'],['league','▤','Competic.'],['contract','✎','Contrato'],['career','★','Carrera']].map(([v,i,l])=>`<button class="navBtn ${view===v?'active':''}" onclick="go('${v}')"><span class="ico">${i}</span>${l}</button>`).join('')}</div>`};
go=function(v){if(v!=='online')v067OnlineStopTiming();view=v;render()};
render=function(){if(!S){startFlow();return}let html=view==='home'?renderHome():view==='squad'?renderSquad():view==='online'?renderOnline():view==='league'?renderLeague():view==='contract'?renderContract():renderCareer();root().innerHTML=`<div class="app">${html}</div>`;if(view==='online')setTimeout(v067OnlineAfterRender,0)};
render();
