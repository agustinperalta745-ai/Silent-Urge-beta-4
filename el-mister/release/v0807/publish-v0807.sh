#!/usr/bin/env bash
set -euo pipefail
ROOT="$PWD"
rm -rf /tmp/v0807
mkdir -p /tmp/v0807/work/assets /tmp/v0807/signature/META-INF
cp el-mister/source/v0805-index.html /tmp/v0807/index.html
python3 - <<'PY'
from pathlib import Path
p=Path('/tmp/v0807/index.html')
s=p.read_text(encoding='utf-8')
assert "const VERSION='0.8.5';" in s and 'const VERSION_CODE=41;' in s
s=s.replace("const VERSION='0.8.5';","const VERSION='0.8.7';",1)
s=s.replace('const VERSION_CODE=41;','const VERSION_CODE=43;',1)
patches=[Path('el-mister/release/v0806/zone-logic.js').read_text(encoding='utf-8'),Path('el-mister/release/v0807/variety-result-fix.js').read_text(encoding='utf-8')]
head,tail=s.rsplit('</script>',1)
s=head+'\n'+'\n'.join(patches)+'\n</script>'+tail
p.write_text(s,encoding='utf-8')
Path('/tmp/v0807/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')
PY
node --check /tmp/v0807/full.js
grep -q "const VERSION='0.8.7'" /tmp/v0807/index.html
grep -q 'em807BuildScenario' /tmp/v0807/index.html
grep -q 'em807ResultPending' /tmp/v0807/index.html
base64 -d el-mister/source/v074-AndroidManifest.xml.b64 > /tmp/v0807/work/AndroidManifest.xml
base64 -d el-mister/source/v074-classes.dex.b64 > /tmp/v0807/work/classes.dex
cp /tmp/v0807/index.html /tmp/v0807/work/assets/index.html
(cd /tmp/v0807/work && zip -q -r /tmp/v0807/El-Mister-v0.8.7.apk .)
base64 -d el-mister/release/v0807-signed/MANIFEST.MF.b64 > /tmp/v0807/signature/META-INF/MANIFEST.MF
base64 -d el-mister/release/v0807-signed/ELMISTER.SF.b64 > /tmp/v0807/signature/META-INF/ELMISTER.SF
base64 -d el-mister/release/v0807-signed/ELMISTER.RSA.b64 > /tmp/v0807/signature/META-INF/ELMISTER.RSA
(cd /tmp/v0807/signature && zip -q -g -r /tmp/v0807/El-Mister-v0.8.7.apk META-INF)
unzip -t /tmp/v0807/El-Mister-v0.8.7.apk >/dev/null
jarsigner -verify -verbose -certs /tmp/v0807/El-Mister-v0.8.7.apk | tee /tmp/v0807/verify.txt
grep -q 'jar verified' /tmp/v0807/verify.txt
keytool -printcert -file "$ROOT/el-mister/release-cert.pem" | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0807/expected.fp
keytool -printcert -jarfile /tmp/v0807/El-Mister-v0.8.7.apk | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0807/actual.fp
diff -u /tmp/v0807/expected.fp /tmp/v0807/actual.fp
test "$(stat -c%s /tmp/v0807/El-Mister-v0.8.7.apk)" -gt 180000
cp /tmp/v0807/El-Mister-v0.8.7.apk el-mister/El-Mister-v0.8.7.apk
cp /tmp/v0807/index.html el-mister/source/v0807-index.html
SHA=$(sha256sum el-mister/El-Mister-v0.8.7.apk | awk '{print $1}')
cat > el-mister/latest.json <<EOF
{
  "versionCode": 43,
  "versionName": "0.8.7",
  "apkUrl": "https://raw.githubusercontent.com/agustinperalta745-ai/Silent-Urge-beta-4/el-mister-updates/el-mister/El-Mister-v0.8.7.apk",
  "mandatory": false,
  "changes": [
    "Vuelve la variedad completa de decisiones y minijuegos contextuales, incluidos remates, pases filtrados, centros, duelos y salidas bajo presión",
    "Las opciones siguen dependiendo de la posesión y de la zona real de la pelota",
    "Corregido el final del partido: se muestra marcador final y Victoria, Derrota o Empate antes de continuar"
  ],
  "onlineUrl": "https://el-mister-online.agustinperalta745.workers.dev",
  "sha256": "$SHA",
  "migration": true
}
EOF
git config user.name 'El Mister Update Bot'
git config user.email 'actions@users.noreply.github.com'
git add el-mister/El-Mister-v0.8.7.apk el-mister/latest.json el-mister/source/v0807-index.html
git diff --cached --quiet || git commit -m 'Publish corrected signed El Mister v0.8.7'
git push origin HEAD:el-mister-updates
