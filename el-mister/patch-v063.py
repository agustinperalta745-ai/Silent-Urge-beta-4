from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-v063.py INPUT_HTML OUTPUT_HTML')

src = Path(sys.argv[1])
out = Path(sys.argv[2])
s = src.read_text(encoding='utf-8')

s = s.replace("const VERSION='0.6.2';", "const VERSION='0.6.3';", 1)
s = s.replace('const VERSION_CODE=13;', 'const VERSION_CODE=14;', 1)

marker = "const _v062NextActionBase=nextAction;"
pos = s.find(marker)
if pos < 0:
    raise SystemExit('v0.6.2 marker missing')

insert = r'''

/* ===== El Míster v0.6.3 · simulación por tramos, sin reloj visible ===== */
let _v063Advancing=false;

function v063AdvanceUntilDecision(){
 if(_v063Advancing)return;
 let l=S.live;if(!l)return render();
 _v063Advancing=true;
 try{
  v061StopClock();
  _v061ClockPaused=true;
  while(S.live&&l.minute<90){
   let target=Math.min(l.minute+1,90);
   simulateSegment(target);
   if(!S.live)return;
   if(target===45&&!l.halftimeShown){
    l.halftimeShown=true;save();
    return v063RenderHalftime();
   }
   if(target<90&&v062ShouldPause(l)){
    l.scenario=makeMatchScenario(l.stopIndex);save();
    return renderLiveDecision();
   }
   if(target>=90)return finishRegulation();
  }
 }finally{_v063Advancing=false}
}

/* El reloj ya no corre en pantalla. Se simula internamente hasta la próxima decisión. */
v061StartClock=function(){v061StopClock()};
v061Tick=function(){};
v061PauseManage=function(){};

v06RenderMatchHub=function(){
 let l=S.live;if(!l)return render();
 v061StopClock();_v061ClockPaused=true;v061InitMatchEnergy();
 let events=l.events.filter(e=>e.type!=='decision').slice(-3).reverse();
 openModal(`<div class="liveHead"><div class="row between"><span class="minute">PARTIDO EN CURSO</span><span class="pill">Cambios ${l.subsUsed}/5 · Ventanas ${l.subWindows}/3</span></div><div class="liveScore">${l.gh} – ${l.ga}</div><div class="muted small">${club(l.home).name} · ${club(l.away).name}</div></div>${events.length?`<div class="miniEvents">${events.map(e=>`<div>${e.m}' ${e.txt}</div>`).join('')}</div>`:''}<div class="notice"><b>Simulando…</b> El encuentro avanza hasta que aparezca una situación en la que tengas que intervenir.</div><div class="matchClockHint">No tenés que mirar correr el reloj. El minuto aparece cuando surge una decisión.</div>`);
 setTimeout(v063AdvanceUntilDecision,120)
};
runNextStop=function(){v06RenderMatchHub()};

v063RenderHalftime=function(){
 let l=S.live,avg=v061LiveAverageEnergy();
 openModal(`<div class="eyebrow">ENTRETIEMPO</div><h2>${l.gh} – ${l.ga}</h2><p>${club(l.home).name} · ${club(l.away).name}</p><div class="teamEnergy"><div class="barLine"><span>Energía del equipo</span><b>${avg}%</b></div><div class="fitnessTrack energy ${v061FitnessTone(avg)}"><i style="width:${avg}%"></i></div></div><button class="primary" onclick="v063ResumeSecondHalf()">Jugar segundo tiempo</button><div class="matchClockHint">La simulación continuará hasta la próxima decisión.</div>`)
};
function v063ResumeSecondHalf(){if(!S.live)return;closeModal();v06RenderMatchHub()}
v061RenderHalftime=v063RenderHalftime;
v061ResumeSecondHalf=v063ResumeSecondHalf;

/* El cambio se ofrece dentro de la decisión ya existente. */
renderLiveDecision=function(){
 let l=S.live,s=l?.scenario;if(!l||!s)return v06RenderMatchHub();
 let cls=s.kind==='keyplay'?'keyplay':s.kind==='rare'?'rare':'',intensity=v062MatchIntensity(l),canSub=l.subsUsed<5&&(l.minute===45||l.activeSubWindowMinute===l.minute||l.subWindows<3);
 openModal(`<div class="liveHead"><div class="row between"><span class="minute">${l.minute}' · INTERVENCIÓN ${l.pauseCount||l.stopIndex+1}</span><span class="pill ${s.kind==='rare'?'bad':s.kind==='keyplay'?'warn':''}">${s.kind==='rare'?'EN CANCHA':s.kind==='keyplay'?'JUGADA CLAVE':'LECTURA DEL PARTIDO'}</span></div><div class="liveScore">${l.gh} – ${l.ga}</div><div class="muted small">${club(l.home).name} · ${club(l.away).name}</div></div>${liveContextHtml(l)}<div class="small muted" style="margin-bottom:10px">Intensidad del partido: <b>${intensity}/100</b></div><h2>${s.t}</h2><p>${s.d}</p>${s.o.map((o,i)=>`<button class="choice ${cls}" onclick="resolveMatchChoice(${i})"><b>${o.t}</b><span>${o.h}</span></button>`).join('')}<div style="height:8px"></div><button class="secondary" onclick="v062OpenSubsFromDecision()" ${canSub?'':'disabled'}>🔄 Hacer cambio</button><div class="small muted center" style="margin-top:9px">La decisión queda pendiente mientras hacés la sustitución. Después volvés acá para resolverla.</div>`)
};
'''

s = s[:pos] + insert + s[pos:]

old = "const _v062NextActionBase=nextAction;\nnextAction=function(){let a=_v062NextActionBase();if(S.phase==='match')a.d='El partido corre solo. Las pausas aparecen según su intensidad y cada decisión permite hacer cambios antes de continuar.';if(S.phase==='cupMatch'||S.phase==='continentalMatch')a.d='La intensidad y la importancia del partido determinan cuántas veces tendrás que intervenir.';return a};"
new = "const _v062NextActionBase=nextAction;\nnextAction=function(){let a=_v062NextActionBase();if(S.phase==='match')a.d='El partido se simula por tramos y solo se detiene cuando aparece una decisión. En esa misma intervención podés hacer un cambio antes de responder.';if(S.phase==='cupMatch'||S.phase==='continentalMatch')a.d='La intensidad y la importancia del partido determinan cuántas intervenciones tendrás que resolver.';return a};"
if old not in s:
    raise SystemExit('v0.6.2 nextAction block missing')
s = s.replace(old, new, 1)

out.write_text(s, encoding='utf-8')
