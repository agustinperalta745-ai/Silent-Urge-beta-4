#!/usr/bin/env bash
set -euo pipefail

rm -rf /tmp/v0811pub
mkdir -p /tmp/v0811pub/work/assets /tmp/v0811pub/signature/META-INF

cp el-mister/source/v0811-index.html /tmp/v0811pub/work/assets/index.html
base64 -d el-mister/source/v074-AndroidManifest.xml.b64 > /tmp/v0811pub/work/AndroidManifest.xml
base64 -d el-mister/source/v074-classes.dex.b64 > /tmp/v0811pub/work/classes.dex

python3 - <<'PY'
from pathlib import Path
s=Path('/tmp/v0811pub/work/assets/index.html').read_text(encoding='utf-8')
assert "const VERSION='0.8.11';" in s
assert 'const VERSION_CODE=47;' in s
assert 'window.EM811_LEGACY=bag' in s
assert 'window.em809AnimationTruth' in s
assert 'window.em811LegacyDynamicsBridge' in s
assert 'f.outcome=Math.random()<.58' in s
assert s.index('window.EM811_LEGACY=bag') < s.index('El Míster v0.7.12 · cancha animada')
assert s.rindex('window.em811LegacyDynamicsBridge') > s.rindex('window.em809AnimationTruth')
Path('/tmp/v0811pub/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')
PY
node --check /tmp/v0811pub/full.js
node el-mister/release/v0809/test-animation-truth.js

(cd /tmp/v0811pub/work && zip -q -r /tmp/v0811pub/unsigned.apk .)
EXPECTED_UNSIGNED=$(tr -d '[:space:]' < el-mister/release/v0811-prep/unsigned.sha256)
ACTUAL_UNSIGNED=$(sha256sum /tmp/v0811pub/unsigned.apk | awk '{print $1}')
if [ "$EXPECTED_UNSIGNED" != "$ACTUAL_UNSIGNED" ]; then
  echo "ERROR: unsigned APK differs from prepared package" >&2
  echo "expected=$EXPECTED_UNSIGNED" >&2
  echo "actual=$ACTUAL_UNSIGNED" >&2
  exit 1
fi

cp /tmp/v0811pub/unsigned.apk /tmp/v0811pub/El-Mister-v0.8.11.apk
base64 -d el-mister/release/v0811-signed/MANIFEST.MF.b64 > /tmp/v0811pub/signature/META-INF/MANIFEST.MF
base64 -d el-mister/release/v0811-signed/ELMISTER.SF.b64 > /tmp/v0811pub/signature/META-INF/ELMISTER.SF
base64 -d el-mister/release/v0811-signed/ELMISTER.RSA.b64 > /tmp/v0811pub/signature/META-INF/ELMISTER.RSA

echo '4ea3073087633358786063f43c55be3841619fd60ca0df97fa9450c4ce34507f  /tmp/v0811pub/signature/META-INF/MANIFEST.MF' | sha256sum -c -
echo '399b0d57d22c6776b8ca4da3d7ae96180315fbc40120e618d4cbe4566800fb7b  /tmp/v0811pub/signature/META-INF/ELMISTER.SF' | sha256sum -c -
echo '1f43773d60261d37f340cc0dc972d8dad4a138f5d01aaf529218aca3b41be0e4  /tmp/v0811pub/signature/META-INF/ELMISTER.RSA' | sha256sum -c -

(cd /tmp/v0811pub/signature && zip -q -g -r /tmp/v0811pub/El-Mister-v0.8.11.apk META-INF)
unzip -t /tmp/v0811pub/El-Mister-v0.8.11.apk >/dev/null
jarsigner -verify -verbose -certs /tmp/v0811pub/El-Mister-v0.8.11.apk | tee /tmp/v0811pub/jarverify.txt
grep -q 'jar verified' /tmp/v0811pub/jarverify.txt

keytool -printcert -file "$GITHUB_WORKSPACE/el-mister/release-cert.pem" | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0811pub/expected.fp
keytool -printcert -jarfile /tmp/v0811pub/El-Mister-v0.8.11.apk | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0811pub/actual.fp
diff -u /tmp/v0811pub/expected.fp /tmp/v0811pub/actual.fp

unzip -p /tmp/v0811pub/El-Mister-v0.8.11.apk assets/index.html > /tmp/v0811pub/apk-index.html
grep -q "const VERSION='0.8.11'" /tmp/v0811pub/apk-index.html
grep -q 'window.em809AnimationTruth' /tmp/v0811pub/apk-index.html
grep -q 'window.em811LegacyDynamicsBridge' /tmp/v0811pub/apk-index.html
grep -q 'window.EM811_LEGACY=bag' /tmp/v0811pub/apk-index.html

cp /tmp/v0811pub/El-Mister-v0.8.11.apk el-mister/El-Mister-v0.8.11.apk
SHA=$(sha256sum el-mister/El-Mister-v0.8.11.apk | awk '{print $1}')
python3 - "$SHA" <<'PY'
from pathlib import Path
import json,sys
sha=sys.argv[1]
p=Path('el-mister/latest.json')
old=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
data={
  "versionCode":47,
  "versionName":"0.8.11",
  "apkUrl":"https://raw.githubusercontent.com/agustinperalta745-ai/Silent-Urge-beta-4/el-mister-updates/el-mister/El-Mister-v0.8.11.apk",
  "mandatory":False,
  "changes":[
    "Vuelve la última simulación visual lograda en v0.8.9, con continuidad real de pelota y jugadores",
    "Las circunstancias del partido vuelven a la dinámica anterior a introducir la pantalla: goles, pausas contextuales, tarjetas, lesiones y decisiones variadas",
    "Restaurados los minijuegos y su lógica original: penales, tiros libres, centros, mano a mano, pase filtrado, regate, remate y acciones defensivas",
    "La animación ya no inventa goles ni decide qué situación aparece: solo representa lo que resuelve el motor de partido",
    "Se mantiene la protección contra cierres prematuros y la carrera guardada"
  ],
  "onlineUrl":old.get("onlineUrl","https://el-mister-online.agustinperalta745.workers.dev"),
  "sha256":sha,
  "migration":True
}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
PY

git config user.name 'El Mister Update Bot'
git config user.email 'actions@users.noreply.github.com'
git add el-mister/El-Mister-v0.8.11.apk el-mister/latest.json
git diff --cached --quiet || git commit -m 'Publish El Mister v0.8.11 latest visual with legacy match dynamics'
git push origin HEAD:el-mister-updates
