from pathlib import Path
import sys

src = Path(sys.argv[1])
out = Path(sys.argv[2])
html = src.read_text(encoding='utf-8')

html = html.replace("const VERSION='0.6.3'", "const VERSION='0.6.4'", 1)
html = html.replace("const VERSION_CODE=14", "const VERSION_CODE=15", 1)

css = r'''
/* El Míster v0.6.4 · etapa de carrera visible en Plantel */
.squadStageLegend{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:-1px 0 9px;color:#9fb2bd;font-size:9px;font-weight:800}
.squadStageLegend span{white-space:nowrap}
.stageEmoji{display:inline-block;font-size:10px;line-height:1;margin-right:3px;vertical-align:0}
.pitchName .stageEmoji{font-size:9px;margin-right:2px}
.benchName .stageEmoji{font-size:10px;margin-right:3px}
'''
html = html.replace('</style>', css + '\n</style>', 1)

pitch_old = '<div class="pitchName">${surname(p)}</div><div class="pitchFitness ${tone}">'
pitch_new = '<div class="pitchName"><span class="stageEmoji">${v064CareerEmoji(p)}</span>${surname(p)}</div><div class="pitchFitness ${tone}">'
bench_old = '<div class="benchName">${surname(p)}</div>${v061FitnessBar(p)}${v061InjuryLabel(p)}'
bench_new = '<div class="benchName"><span class="stageEmoji">${v064CareerEmoji(p)}</span>${surname(p)}</div>${v061FitnessBar(p)}${v061InjuryLabel(p)}'
board_old = '<div class="tacticalBoard"><div class="footballPitch">'
board_new = '<div class="squadStageLegend"><span>🌱 Joven</span><span>⚽ Adulto</span><span>👴🏻 Veterano</span></div><div class="tacticalBoard"><div class="footballPitch">'

if pitch_old not in html:
    raise SystemExit('final pitch player template not found')
if bench_old not in html:
    raise SystemExit('final bench player template not found')
html = html.replace(pitch_old, pitch_new, 1)
html = html.replace(bench_old, bench_new, 1)
# Replace the LAST tactical board occurrence so the legend is attached to the active squad renderer.
pos = html.rfind(board_old)
if pos < 0:
    raise SystemExit('active tactical board not found')
html = html[:pos] + board_new + html[pos+len(board_old):]

anchor = "load();if(S){formation=S.formation||formation;tacticalChoice=S.tactic||tacticalChoice;ensureLineup();save()}render();setTimeout(()=>checkForUpdates(false),1500);"
patch = r'''
/* ===== El Míster v0.6.4 · indicador de etapa de carrera en Plantel ===== */
function v064CareerEmoji(p){let s=careerStage(p);return s==='Juvenil'?'🌱':s==='Veterano'?'👴🏻':'⚽'}

'''
if anchor not in html:
    raise SystemExit('load anchor not found')
html = html.replace(anchor, patch + anchor, 1)

checks = [
    "const VERSION='0.6.4'",
    "const VERSION_CODE=15",
    "function v064CareerEmoji",
    "🌱 Joven",
    "⚽ Adulto",
    "👴🏻 Veterano",
    "${v064CareerEmoji(p)}",
]
for check in checks:
    if check not in html:
        raise SystemExit(f'missing {check}')

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(out)
