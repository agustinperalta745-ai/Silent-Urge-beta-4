#!/usr/bin/env bash
set -euo pipefail
rm -rf /tmp/v0808
mkdir -p /tmp/v0808
cp el-mister/source/v0807-index.html /tmp/v0808/index.html
python3 - <<'PY'
from pathlib import Path
p=Path('/tmp/v0808/index.html')
s=p.read_text(encoding='utf-8')
if "const VERSION='0.8.7';" not in s or 'const VERSION_CODE=43;' not in s:
    raise SystemExit('v0.8.7 markers not found')
s=s.replace("const VERSION='0.8.7';","const VERSION='0.8.8';",1)
s=s.replace('const VERSION_CODE=43;','const VERSION_CODE=44;',1)
patch=Path('el-mister/release/v0808/match-end-guard.js').read_text(encoding='utf-8')
head,tail=s.rsplit('</script>',1)
s=head+'\n'+patch+'\n</script>'+tail
p.write_text(s,encoding='utf-8')
Path('/tmp/v0808/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')
PY
node --check /tmp/v0808/full.js
grep -q "const VERSION='0.8.8'" /tmp/v0808/index.html
grep -q 'em808MatchEndGuard' /tmp/v0808/index.html
cp /tmp/v0808/index.html el-mister/source/v0808-index.html
git config user.name 'El Mister Update Bot'
git config user.email 'actions@users.noreply.github.com'
git add el-mister/source/v0808-index.html
git diff --cached --quiet || git commit -m 'Prepare El Mister v0.8.8 guarded match ending source'
git push origin HEAD:el-mister-updates
