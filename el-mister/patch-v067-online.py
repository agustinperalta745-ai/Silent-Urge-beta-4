from pathlib import Path
import sys

src = Path(sys.argv[1] if len(sys.argv) > 1 else 'el-mister/source/v066/index.html')
out = Path(sys.argv[2] if len(sys.argv) > 2 else 'el-mister/source/v067/index.html')
css_path = Path('el-mister/online/v067-online.css')
js_path = Path('el-mister/online/v067-online.js')

text = src.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
js = js_path.read_text(encoding='utf-8').rstrip()
if js.endswith('render();'):
    js = js[:-len('render();')].rstrip()

version_old = "const VERSION='0.6.6';\nconst VERSION_CODE=17;"
version_new = "const VERSION='0.6.7';\nconst VERSION_CODE=18;"
if version_old not in text:
    raise SystemExit('v0.6.6 version anchor not found')
text = text.replace(version_old, version_new, 1)

if '</style>' not in text:
    raise SystemExit('style anchor not found')
text = text.replace('</style>', '\n' + css + '\n</style>', 1)

bootstrap = "load();if(S){v066EnforceCompetitionEligibility();formation=S.formation||formation;tacticalChoice=S.tactic||tacticalChoice;ensureLineup();save()}render();setTimeout(()=>checkForUpdates(false),1500);"
if bootstrap not in text:
    raise SystemExit('bootstrap anchor not found')
text = text.replace(bootstrap, js + '\n\n' + bootstrap, 1)

checks = [
    "const VERSION='0.6.7'",
    'const VERSION_CODE=18',
    "V067_ONLINE_API='https://el-mister-online.agustinperalta745.workers.dev'",
    'function renderOnline()',
    "['online','🌐','Online']",
    'changedKick||changedShooter||changedStatus',
]
for needle in checks:
    if needle not in text:
        raise SystemExit(f'missing integration marker: {needle}')

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(text, encoding='utf-8')
print(f'Generated {out} ({len(text)} chars)')
