#!/usr/bin/env bash
set -euo pipefail
rm -rf /tmp/v0808pub
mkdir -p /tmp/v0808pub/work/assets /tmp/v0808pub/signature/META-INF

cp el-mister/source/v0808-index.html /tmp/v0808pub/index.html
node --check <(python3 - <<'PY'
from pathlib import Path
s=Path('/tmp/v0808pub/index.html').read_text(encoding='utf-8')
print(s.split('<script>',1)[1].rsplit('</script>',1)[0])
PY
) 2>/dev/null || {
  python3 - <<'PY'
from pathlib import Path
s=Path('/tmp/v0808pub/index.html').read_text(encoding='utf-8')
Path('/tmp/v0808pub/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')
PY
  node --check /tmp/v0808pub/full.js
}

grep -q "const VERSION='0.8.8'" /tmp/v0808pub/index.html
grep -q 'const VERSION_CODE=44;' /tmp/v0808pub/index.html
grep -q 'em808MatchEndGuard' /tmp/v0808pub/index.html
grep -q 'blocked premature finish' /tmp/v0808pub/index.html

base64 -d el-mister/source/v074-AndroidManifest.xml.b64 > /tmp/v0808pub/work/AndroidManifest.xml
base64 -d el-mister/source/v074-classes.dex.b64 > /tmp/v0808pub/work/classes.dex
cp /tmp/v0808pub/index.html /tmp/v0808pub/work/assets/index.html
(cd /tmp/v0808pub/work && zip -q -r /tmp/v0808pub/El-Mister-v0.8.8.apk .)

base64 -d el-mister/release/v0808-signed/MANIFEST.MF.b64 > /tmp/v0808pub/signature/META-INF/MANIFEST.MF
base64 -d el-mister/release/v0808-signed/ELMISTER.SF.b64 > /tmp/v0808pub/signature/META-INF/ELMISTER.SF
base64 -d el-mister/release/v0808-signed/ELMISTER.RSA.b64 > /tmp/v0808pub/signature/META-INF/ELMISTER.RSA

echo 'd8069b2cfe2b184bb490537bf3623796228e4d1f7496fcedf2553b918b4a4e63  /tmp/v0808pub/signature/META-INF/MANIFEST.MF' | sha256sum -c -
echo '2ad19c2af4227e56ff883e5b68aa36eeeaa1cf34216f7727575b33a075f90754  /tmp/v0808pub/signature/META-INF/ELMISTER.SF' | sha256sum -c -
echo 'deb4a885be286c71d3af201a1a722b92ebe8ef067754cd75113fa58d550c481b  /tmp/v0808pub/signature/META-INF/ELMISTER.RSA' | sha256sum -c -

(cd /tmp/v0808pub/signature && zip -q -g -r /tmp/v0808pub/El-Mister-v0.8.8.apk META-INF)
unzip -t /tmp/v0808pub/El-Mister-v0.8.8.apk >/dev/null
jarsigner -verify -verbose -certs /tmp/v0808pub/El-Mister-v0.8.8.apk | tee /tmp/v0808pub/jarverify.txt
grep -q 'jar verified' /tmp/v0808pub/jarverify.txt

keytool -printcert -file "$GITHUB_WORKSPACE/el-mister/release-cert.pem" | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0808pub/expected.fp
keytool -printcert -jarfile /tmp/v0808pub/El-Mister-v0.8.8.apk | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0808pub/actual.fp
diff -u /tmp/v0808pub/expected.fp /tmp/v0808pub/actual.fp

test "$(stat -c%s /tmp/v0808pub/El-Mister-v0.8.8.apk)" -gt 180000
cp /tmp/v0808pub/El-Mister-v0.8.8.apk el-mister/El-Mister-v0.8.8.apk
SHA=$(sha256sum el-mister/El-Mister-v0.8.8.apk | awk '{print $1}')
python3 - "$SHA" <<'PY'
from pathlib import Path
import json,sys
sha=sys.argv[1]
data={
  "versionCode":44,
  "versionName":"0.8.8",
  "apkUrl":"https://raw.githubusercontent.com/agustinperalta745-ai/Silent-Urge-beta-4/el-mister-updates/el-mister/El-Mister-v0.8.8.apk",
  "mandatory":False,
  "changes":[
    "Corregido el cierre inesperado del partido: ningún callback viejo puede terminarlo antes de los 90 minutos",
    "El Motor 2D se detiene de forma segura al finalizar y muestra primero un silbatazo de final con el marcador",
    "Se bloquean cierres duplicados después de decisiones y minijuegos",
    "El resultado final sigue mostrando Victoria, Derrota o Empate antes de continuar",
    "Se mantienen la variedad de decisiones, los minijuegos y la lógica contextual de la v0.8.7"
  ],
  "onlineUrl":"https://el-mister-online.agustinperalta745.workers.dev",
  "sha256":sha,
  "migration":True
}
Path('el-mister/latest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
PY

git config user.name 'El Mister Update Bot'
git config user.email 'actions@users.noreply.github.com'
git add el-mister/El-Mister-v0.8.8.apk el-mister/latest.json
git diff --cached --quiet || git commit -m 'Publish signed El Mister v0.8.8 match ending fix'
git push origin HEAD:el-mister-updates
