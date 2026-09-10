#!/usr/bin/env bash
set -euo pipefail

rm -rf /tmp/v0810pub
mkdir -p /tmp/v0810pub/work/assets /tmp/v0810pub/signature/META-INF

cp el-mister/source/v0711-index.html /tmp/v0810pub/index.html
python3 - <<'PY'
from pathlib import Path
p=Path('/tmp/v0810pub/index.html')
s=p.read_text(encoding='utf-8')
if "const VERSION='0.7.11';" not in s or 'const VERSION_CODE=32;' not in s:
    raise SystemExit('v0.7.11 base markers not found')
s=s.replace("const VERSION='0.7.11';", "const VERSION='0.8.10';", 1)
s=s.replace('const VERSION_CODE=32;', 'const VERSION_CODE=46;', 1)
patch=Path('el-mister/release/v0712/match-visual.js').read_text(encoding='utf-8')
head,tail=s.rsplit('</script>',1)
s=head+'\n'+patch+'\n</script>'+tail
p.write_text(s,encoding='utf-8')
Path('/tmp/v0810pub/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')
PY

# Gameplay must be the exact pre-screen base; only the original v0.7.12 visual layer is appended.
node --check /tmp/v0810pub/full.js
grep -q "const VERSION='0.8.10'" /tmp/v0810pub/index.html
grep -q 'const VERSION_CODE=46;' /tmp/v0810pub/index.html
grep -q 'v078MiniIntro' /tmp/v0810pub/index.html
grep -q 'start79' /tmp/v0810pub/index.html
grep -q 'v0711EnsureRosterIdentity' /tmp/v0810pub/index.html
grep -q 'v0712Advance' /tmp/v0810pub/index.html
grep -q 'La cancha se detuvo en esta situación' /tmp/v0810pub/index.html
if grep -q 'em80' /tmp/v0810pub/index.html; then
  echo 'ERROR: v0.8.x 2D match engine leaked into the restored build' >&2
  exit 1
fi

base64 -d el-mister/source/v074-AndroidManifest.xml.b64 > /tmp/v0810pub/work/AndroidManifest.xml
base64 -d el-mister/source/v074-classes.dex.b64 > /tmp/v0810pub/work/classes.dex
cp /tmp/v0810pub/index.html /tmp/v0810pub/work/assets/index.html
(cd /tmp/v0810pub/work && zip -q -r /tmp/v0810pub/El-Mister-v0.8.10.apk .)

base64 -d el-mister/release/v0810-signed/MANIFEST.MF.b64 > /tmp/v0810pub/signature/META-INF/MANIFEST.MF
base64 -d el-mister/release/v0810-signed/ELMISTER.SF.b64 > /tmp/v0810pub/signature/META-INF/ELMISTER.SF
base64 -d el-mister/release/v0810-signed/ELMISTER.RSA.b64 > /tmp/v0810pub/signature/META-INF/ELMISTER.RSA

echo '683fa247b9c889006cf05d3d1857c079cd28df71f7c794f648ac603ee961d60a  /tmp/v0810pub/signature/META-INF/MANIFEST.MF' | sha256sum -c -
echo 'e86ee2fb8e4da3d3a2f6a377265a45a2e3571b775e51705dd59961c9fc04a06c  /tmp/v0810pub/signature/META-INF/ELMISTER.SF' | sha256sum -c -
echo '2aa666587c9d2dde17296f3bc1698790632cd7c254c98f1faf8e3b671b6066de  /tmp/v0810pub/signature/META-INF/ELMISTER.RSA' | sha256sum -c -

(cd /tmp/v0810pub/signature && zip -q -g -r /tmp/v0810pub/El-Mister-v0.8.10.apk META-INF)
unzip -t /tmp/v0810pub/El-Mister-v0.8.10.apk >/dev/null
jarsigner -verify -verbose -certs /tmp/v0810pub/El-Mister-v0.8.10.apk | tee /tmp/v0810pub/jarverify.txt
grep -q 'jar verified' /tmp/v0810pub/jarverify.txt

keytool -printcert -file "$GITHUB_WORKSPACE/el-mister/release-cert.pem" | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0810pub/expected.fp
keytool -printcert -jarfile /tmp/v0810pub/El-Mister-v0.8.10.apk | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0810pub/actual.fp
diff -u /tmp/v0810pub/expected.fp /tmp/v0810pub/actual.fp

unzip -p /tmp/v0810pub/El-Mister-v0.8.10.apk assets/index.html > /tmp/v0810pub/apk-index.html
grep -q "const VERSION='0.8.10'" /tmp/v0810pub/apk-index.html
grep -q 'v0712Advance' /tmp/v0810pub/apk-index.html
if grep -q 'em80' /tmp/v0810pub/apk-index.html; then exit 1; fi

cp /tmp/v0810pub/El-Mister-v0.8.10.apk el-mister/El-Mister-v0.8.10.apk
cp /tmp/v0810pub/index.html el-mister/source/v0810-index.html
SHA=$(sha256sum el-mister/El-Mister-v0.8.10.apk | awk '{print $1}')
python3 - "$SHA" <<'PY'
from pathlib import Path
import json,sys
sha=sys.argv[1]
p=Path('el-mister/latest.json')
old=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
data={
  "versionCode":46,
  "versionName":"0.8.10",
  "apkUrl":"https://raw.githubusercontent.com/agustinperalta745-ai/Silent-Urge-beta-4/el-mister-updates/el-mister/El-Mister-v0.8.10.apk",
  "mandatory":False,
  "changes":[
    "Restaurado el sistema de partido exacto de la base anterior a la pantalla de simulación (v0.7.11)",
    "Vuelven las preguntas, decisiones, minijuegos, pausas, consecuencias, cambios y cierre de partido originales",
    "La cancha animada se agrega únicamente como capa visual y se congela sobre la misma decisión de siempre",
    "Eliminado del partido el Motor 2D v0.8.x que había reemplazado parte de la jugabilidad",
    "La carrera guardada se mantiene"
  ],
  "onlineUrl":old.get("onlineUrl","https://el-mister-online.agustinperalta745.workers.dev"),
  "sha256":sha,
  "migration":True
}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
PY

git config user.name 'El Mister Update Bot'
git config user.email 'actions@users.noreply.github.com'
git add el-mister/El-Mister-v0.8.10.apk el-mister/source/v0810-index.html el-mister/latest.json
git diff --cached --quiet || git commit -m 'Publish El Mister v0.8.10 restored gameplay with visual simulation'
git push origin HEAD:el-mister-updates
