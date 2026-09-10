/* ===== El Míster v0.8.1 · puente de jugabilidad + cancha adaptativa ===== */
const _em801StateBase=em80State;
em80State=function(l=S.live){
  let s=_em801StateBase(l);if(!s)return s;
  s.em801Tactics??={compactCB:false,fullbacksHigh:false,lowBlock:false,pressHigh:false,direct:false,possession:false,wide:false,until:0,label:'Equilibrado'};
  s.em801PassChain??={team:null,count:0};
  s.firstKickoffTeam??='us';
  return s
};
function em801Tactics(l=S.live){let s=em80State(l);return s?.em801Tactics||null}
function em801ActiveTactics(l=S.live){let t=em801Tactics(l);if(!t)return{};if(t.until&&l.minute>t.until){t.compactCB=t.fullbacksHigh=t.lowBlock=t.pressHigh=t.direct=t.possession=t.wide=false;t.until=0;t.label='Equilibrado'}return t}
function em801SetTactic(l,patch,label,duration=16){let t=em801Tactics(l);if(!t)return;Object.assign(t,patch);t.label=label||t.label;t.until=Math.max(t.until||0,(l.minute||0)+duration);l.context??={};for(let k of ['fullbacksHigh','lowBlock','pressHigh','direct','possession','shootMore'])if(k in patch)l.context[k]=patch[k]}
function em801ApplyChoice(l,s,o){
  let txt=`${s?.t||''} ${s?.d||''} ${o?.t||''} ${o?.h||''}`.toLowerCase();
  if(/cerrar (a )?los centrales|centrales.*cerr|cerrar pasillos|juntar.*centrales|bloque compacto|cerrar espacios|repleg|aguantar|proteger (el )?resultado/.test(txt))em801SetTactic(l,{compactCB:true,lowBlock:true,pressHigh:false},'Bloque compacto',18);
  if(/presi[oó]n alta|presionar arriba|adelantar l[ií]neas|recuperar m[aá]s arriba|ir a presionar|asfixiar/.test(txt))em801SetTactic(l,{pressHigh:true,lowBlock:false,compactCB:false},'Presión alta',14);
  if(/subir (a )?los laterales|laterales altos|soltar (a )?los laterales|atacar por las bandas|abrir la cancha|amplitud/.test(txt))em801SetTactic(l,{fullbacksHigh:true,wide:true},'Laterales altos',16);
  if(/juego directo|atacar m[aá]s directo|pase vertical|buscar el segundo de contra|salir de contra|contraataque|sumar un atacante|pelota larga/.test(txt))em801SetTactic(l,{direct:true,possession:false},'Ataque directo',14);
  if(/controlar el mediocampo|tener la pelota|posesi[oó]n|conservar la pelota|asegurar la posesi[oó]n|dormir el partido/.test(txt))em801SetTactic(l,{possession:true,direct:false},'Posesión',16);
  if(/rematar m[aá]s|probar de afuera|patear de lejos/.test(txt))em801SetTactic(l,{shootMore:true},'Buscar remate',12);
  if(/mantener el equilibrio|volver al equilibrio/.test(txt))em801SetTactic(l,{compactCB:false,fullbacksHigh:false,lowBlock:false,pressHigh:false,direct:false,possession:false,wide:false,shootMore:false},'Equilibrado',10)
}
const _em801ResolveChoiceBase=resolveMatchChoice;
resolveMatchChoice=function(i){let l=S.live,s=l?.scenario,o=s?.o?.[i];if(l&&s&&o)em801ApplyChoice(l,s,o);return _em801ResolveChoiceBase(i)};

const _em801AnchorBase=em80Anchor;
em80Anchor=function(team,p,l=S.live){let a=_em801AnchorBase(team,p,l);if(team!=='us'||!l)return a;let t=em801ActiveTactics(l),s=em80State(l),own=(s.ball.ownerTeam||s.ball.lastTeam)==='us',dir=em80Dir('us');
  if(t.compactCB&&p.pos==='DFC')a.x=em80Lerp(a.x,EM80_W/2,.58);
  if(t.lowBlock){let sh=['ARQ','DFC','LI','LD'].includes(p.pos)?5.5:['MCD','MC'].includes(p.pos)?4:2.2;a.y-=dir*sh}
  if(t.pressHigh&&!own){let sh=['DC','EI','ED','MCO'].includes(p.pos)?7:['MC','MCD'].includes(p.pos)?5:3.2;a.y+=dir*sh;if(p.pos==='DFC')a.x=em80Lerp(a.x,EM80_W/2,.18)}
  if(t.fullbacksHigh&&own&&(p.pos==='LI'||p.pos==='LD'))a.y+=dir*5.5;
  if(t.wide&&own&&['LI','LD','EI','ED'].includes(p.pos))a.x=EM80_W/2+(a.x-EM80_W/2)*1.12;
  if(t.possession&&own&&['MCD','MC','MCO'].includes(p.pos)){a.x=em80Lerp(a.x,s.ball.x,.16);a.y=em80Lerp(a.y,s.ball.y-dir*8,.12)}
  return{x:em80Clamp(a.x,3.5,EM80_W-3.5),y:em80Clamp(a.y,3,97)}
};

function em801ResetChain(l=S.live){let s=em80State(l);if(s)s.em801PassChain={team:null,count:0}}
const _em801PassBase=em80Pass;
em80Pass=function(team,carrier,target,l=S.live,kind='pass'){let s=em80State(l),c=s.em801PassChain||{team:null,count:0};if(c.team===team)c.count++;else{c.team=team;c.count=1}s.em801PassChain=c;let r=_em801PassBase(team,carrier,target,l,kind);if(s.ball.flight?.outcome==='intercept')em801ResetChain(l);return r};
const _em801CarryBase=em80Carry;em80Carry=function(team,carrier,l=S.live){em801ResetChain(l);return _em801CarryBase(team,carrier,l)};
const _em801ShotBase=em80Shot;em80Shot=function(team,carrier,l=S.live){em801ResetChain(l);return _em801ShotBase(team,carrier,l)};
const _em801CrossBase=em80Cross;em80Cross=function(team,carrier,l=S.live){em801ResetChain(l);return _em801CrossBase(team,carrier,l)};
const _em801CarrierThinkBase=em80CarrierThink;
em80CarrierThink=function(l=S.live){let s=em80State(l),b=s?.ball;if(!s||!b?.ownerTeam||performance.now()<s.nextBrainAt||performance.now()<s.restartUntil)return _em801CarrierThinkBase(l);let team=b.ownerTeam,t=team==='us'?em801ActiveTactics(l):{},chain=s.em801PassChain||{team:null,count:0},limit=t.direct?2:t.possession?5:3;if(chain.team===team&&chain.count>=limit){let c=em80P(team,b.ownerIdx,l),progress=em80Progress(team,c.y),pressure=em80Nearest(em80Opp(team),c,l).d;s.nextBrainAt=performance.now()+420+Math.random()*260;if(progress>72&&['DC','MCO','MC','EI','ED'].includes(c.pos)&&pressure>1.5){em801ResetChain(l);return em80Shot(team,c,l)}let vertical=em80BestPass(team,c,l,'through'),gain=vertical?em80Progress(team,vertical.y)-progress:-99;em801ResetChain(l);if(vertical&&gain>6)return em80Pass(team,c,vertical,l,'through');return em80Carry(team,c,l)}return _em801CarrierThinkBase(l)};

function em801Kickoff(team,l=S.live,comment='Se reanuda desde el círculo central.'){let s=em80State(l);if(!s)return;for(let tm of ['us','them']){let slots=em80BaseSlots(tm),arr=em80Players(tm,l);arr.forEach((p,i)=>{let q=slots[i]||{x:EM80_W/2,y:50};p.x=q.x;p.y=q.y;p.tx=q.x;p.ty=q.y;p.vx=0;p.vy=0})}let arr=em80Players(team,l).filter(p=>p.active!==false),k=arr.find(p=>p.pos==='DC')||arr.find(p=>p.pos==='MCO')||arr.find(p=>['MC','MCD'].includes(p.pos))||arr[0];k.x=EM80_W/2;k.y=team==='us'?52:48;k.tx=k.x;k.ty=k.y;s.ball={x:EM80_W/2,y:50,vx:0,vy:0,ownerTeam:team,ownerIdx:k.idx,lastTeam:team,flight:null};s.restartUntil=performance.now()+900;s.nextBrainAt=s.restartUntil+240;s.comment=comment;em801ResetChain(l)}
const _em801RestartBase=em80Restart;
em80Restart=function(team,type='goalKick',l=S.live){if(type==='kickoff')return em801Kickoff(team,l,'Saque del medio. Los equipos vuelven a ocupar sus posiciones.');em801ResetChain(l);return _em801RestartBase(team,type,l)};
v063ResumeSecondHalf=function(){if(!S.live)return;let s=em80State(S.live),team=s.firstKickoffTeam==='us'?'them':'us';em801Kickoff(team,S.live,'Arranca el segundo tiempo desde el círculo central.');closeModal();v06RenderMatchHub()};
v061ResumeSecondHalf=v063ResumeSecondHalf;

const _em801ShouldPauseBase=em80ShouldPause;
em80ShouldPause=function(l=S.live){if(typeof v0714ShouldPause==='function')return v0714ShouldPause(l);return _em801ShouldPauseBase(l)};
function em801ValidScenario(s){return !!(s&&s.t&&Array.isArray(s.o)&&s.o.length>=2)}
function em801FallbackScenario(l){let us=scoreForUser(l),them=scoreAgainst(l),m=l.minute;if(us<them)return{kind:'tactical',t:'El partido pide una reacción',d:`Minuto ${m}. Estás ${us}-${them} y necesitás cambiar la dinámica.`,o:[{t:'Soltar los laterales y atacar por afuera',h:'Ganás amplitud y gente cerca del área.',e:{att:.018,def:-.008,fat:1}},{t:'Presionar arriba y adelantar líneas',h:'Buscás recuperar cerca del arco rival.',e:{att:.022,def:-.01,fat:2}},{t:'Buscar pases verticales y segunda pelota',h:'Acelerás el ataque sin regalar toda la estructura.',e:{att:.016,def:-.004,fat:1}}]};if(us>them)return{kind:'tactical',t:'Hay que administrar la ventaja',d:`Minuto ${m}. Ganás ${us}-${them} y el rival empieza a arriesgar.`,o:[{t:'Juntar centrales y cerrar pasillos interiores',h:'El equipo se hace corto y protege el área.',e:{att:-.008,def:.024}},{t:'Conservar la pelota y enfriar el partido',h:'Reducís transiciones y obligás al rival a correr.',e:{att:.002,def:.012}},{t:'Salir rápido cuando recuperemos',h:'Cedés metros para atacar el espacio de contra.',e:{att:.017,def:-.006,fat:1}}]};return{kind:'tactical',t:'El partido está en una zona de decisiones',d:`Minuto ${m}. El marcador sigue ${us}-${them} y hay distintos caminos para romperlo.`,o:[{t:'Atacar por las bandas y subir laterales',h:'Buscás superioridad por afuera.',e:{att:.016,def:-.006,fat:1}},{t:'Controlar el mediocampo y tener la pelota',h:'Priorizás apoyos y circulación con sentido.',e:{att:.006,def:.012}},{t:'Acelerar con pases verticales',h:'Intentás llegar antes al área rival.',e:{att:.014,def:-.004,fat:1}}]}}
function em801RenderScenario(sc,l=S.live){if(!l)return false;if(!em801ValidScenario(sc))return false;l.scenario=sc;save();renderLiveDecision();return true}
function em801RecoverLegacyDecision(l=S.live){if(!l)return;try{let sc=typeof _em80ScenarioBase==='function'?_em80ScenarioBase(l.stopIndex):null;if(!em801ValidScenario(sc))sc=em801FallbackScenario(l);if(em801RenderScenario(sc,l))return}catch(e){console.error('em801 legacy recovery',e)}try{em801RenderScenario(em801FallbackScenario(l),l)}catch(e){console.error('em801 fallback decision',e)}}
em80EmergencyDecision=em801RecoverLegacyDecision;
em80PauseForDecision=function(l=S.live){if(!l||l.scenario)return;EM80.running=false;if(EM80.raf){cancelAnimationFrame(EM80.raf);EM80.raf=0}if(EM80.minuteTimer){clearTimeout(EM80.minuteTimer);EM80.minuteTimer=0}try{let sc=makeMatchScenario(l.stopIndex);if(!em801ValidScenario(sc))sc=typeof _em80ScenarioBase==='function'?_em80ScenarioBase(l.stopIndex):null;if(!em801ValidScenario(sc))sc=em801FallbackScenario(l);em801RenderScenario(sc,l);setTimeout(()=>{if(!S.live?.scenario)return;let has=document.querySelector('#modalRoot .choice, #modalRoot .primary');if(!has)em801RecoverLegacyDecision(S.live)},180)}catch(e){console.error('em801 decision bridge',e);em801RecoverLegacyDecision(l)}};

try{if(S?.live){em80State(S.live);save()}}catch(e){console.error('em801 migration',e)}
