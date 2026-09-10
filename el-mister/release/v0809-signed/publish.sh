#!/usr/bin/env bash
set -euo pipefail
rm -rf /tmp/v0809pub
mkdir -p /tmp/v0809pub/work/assets /tmp/v0809pub/signature/META-INF

cp el-mister/source/v0809-index.html /tmp/v0809pub/index.html
python3 - <<'PY'
from pathlib import Path
s=Path('/tmp/v0809pub/index.html').read_text(encoding='utf-8')
Path('/tmp/v0809pub/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')
PY
node --check /tmp/v0809pub/full.js

grep -q "const VERSION='0.8.9'" /tmp/v0809pub/index.html
grep -q 'const VERSION_CODE=45;' /tmp/v0809pub/index.html
grep -q 'em809AnimationTruth' /tmp/v0809pub/index.html
grep -q 'visual continuity' el-mister/release/v0809/test-animation-truth.js
node el-mister/release/v0809/test-animation-truth.js

base64 -d el-mister/source/v074-AndroidManifest.xml.b64 > /tmp/v0809pub/work/AndroidManifest.xml
base64 -d el-mister/source/v074-classes.dex.b64 > /tmp/v0809pub/work/classes.dex
cp /tmp/v0809pub/index.html /tmp/v0809pub/work/assets/index.html
(cd /tmp/v0809pub/work && zip -q -r /tmp/v0809pub/El-Mister-v0.8.9.apk .)

base64 -d el-mister/release/v0809-signed/MANIFEST.MF.b64 > /tmp/v0809pub/signature/META-INF/MANIFEST.MF
base64 -d el-mister/release/v0809-signed/ELMISTER.SF.b64 > /tmp/v0809pub/signature/META-INF/ELMISTER.SF
base64 -d el-mister/release/v0809-signed/ELMISTER.RSA.b64 > /tmp/v0809pub/signature/META-INF/ELMISTER.RSA

echo 'a48f87591c0e6157feb0c4e83c3c0aeec1d3da2a2b34c9c55e142502b45d66cb  /tmp/v0809pub/signature/META-INF/MANIFEST.MF' | sha256sum -c -
echo '7a96722b23a287ed9e583faaa431e91a73343168bc923132c84c4806e46c4173  /tmp/v0809pub/signature/META-INF/ELMISTER.SF' | sha256sum -c -
echo 'eaa2cc9f7de30dc53d7de9bc0f4cba97f03791a6b7b5d0e5555f01d5ab6e8ac9  /tmp/v0809pub/signature/META-INF/ELMISTER.RSA' | sha256sum -c -

(cd /tmp/v0809pub/signature && zip -q -g -r /tmp/v0809pub/El-Mister-v0.8.9.apk META-INF)
unzip -t /tmp/v0809pub/El-Mister-v0.8.9.apk >/dev/null
jarsigner -verify -verbose -certs /tmp/v0809pub/El-Mister-v0.8.9.apk | tee /tmp/v0809pub/jarverify.txt
grep -q 'jar verified' /tmp/v0809pub/jarverify.txt

keytool -printcert -file "$GITHUB_WORKSPACE/el-mister/release-cert.pem" | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0809pub/expected.fp
keytool -printcert -jarfile /tmp/v0809pub/El-Mister-v0.8.9.apk | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0809pub/actual.fp
diff -u /tmp/v0809pub/expected.fp /tmp/v0809pub/actual.fp

test "$(stat -c%s /tmp/v0809pub/El-Mister-v0.8.9.apk)" -gt 180000
unzip -p /tmp/v0809pub/El-Mister-v0.8.9.apk assets/index.html | grep -q "const VERSION='0.8.9'"
unzip -p /tmp/v0809pub/El-Mister-v0.8.9.apk assets/index.html | grep -q 'em809AnimationTruth'

cp /tmp/v0809pub/El-Mister-v0.8.9.apk el-mister/El-Mister-v0.8.9.apk
SHA=$(sha256sum el-mister/El-Mister-v0.8.9.apk | awk '{print $1}')
python3 - "$SHA" <<'PY'
from pathlib import Path
import json,sys
sha=sys.argv[1]
old={}
p=Path('el-mister/latest.json')
if p.exists():
    old=json.loads(p.read_text(encoding='utf-8'))
data={
  "versionCode":45,
  "versionName":"0.8.9",
  "apkUrl":"https://raw.githubusercontent.com/agustinperalta745-ai/Silent-Urge-beta-4/el-mister-updates/el-mister/El-Mister-v0.8.9.apk",
  "mandatory":False,
  "changes":[
    "La animación vuelve a respetar la posición real de la pelota y de los jugadores cuando aparece una decisión",
    "Las continuaciones de las jugadas se muestran en cancha en vez de teletransportar la pelota a otra zona",
    "Se mantiene el Motor 2D actual: no se reemplazaron decisiones, minijuegos ni el flujo general del partido",
    "Penales, tiros libres, córners y demás reinicios conservan su lógica específica",
    "Se mantiene la protección contra finales prematuros y el resultado final de la v0.8.8"
  ],
  "onlineUrl":old.get("onlineUrl","https://el-mister-online.agustinperalta745.workers.dev"),
  "sha256":sha,
  "migration":True
}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
PY

git config user.name 'El Mister Update Bot'
git config user.email 'actions@users.noreply.github.com'
git add el-mister/El-Mister-v0.8.9.apk el-mister/latest.json
git diff --cached --quiet || git commit -m 'Publish signed El Mister v0.8.9 animation continuity fix'
git push origin HEAD:el-mister-updates
