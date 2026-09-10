#!/usr/bin/env bash
set -euo pipefail
rm -rf /tmp/v0807
mkdir -p /tmp/v0807/work/assets /tmp/v0807/signature/META-INF
cp el-mister/source/v0805-index.html /tmp/v0807/index.html
python3 - <<'PY'
from pathlib import Path
p=Path('/tmp/v0807/index.html')
s=p.read_text(encoding='utf-8')
if "const VERSION='0.8.5';" not in s or 'const VERSION_CODE=41;' not in s:
    raise SystemExit('v0.8.5 markers not found')
s=s.replace("const VERSION='0.8.5';", "const VERSION='0.8.7';", 1)
s=s.replace('const VERSION_CODE=41;', 'const VERSION_CODE=43;', 1)
patches=[Path('el-mister/release/v0806/zone-logic.js').read_text(encoding='utf-8'),Path('el-mister/release/v0807/variety-result-fix.js').read_text(encoding='utf-8')]
head,tail=s.rsplit('</script>',1)
s=head+'\n'+'\n'.join(patches)+'\n</script>'+tail
p.write_text(s,encoding='utf-8')
Path('/tmp/v0807/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')
PY
node --check /tmp/v0807/full.js
grep -q "const VERSION='0.8.7'" /tmp/v0807/index.html
grep -q 'em807BuildScenario' /tmp/v0807/index.html
grep -q 'Patear al arco' /tmp/v0807/index.html
base64 -d el-mister/source/v074-AndroidManifest.xml.b64 > /tmp/v0807/work/AndroidManifest.xml
base64 -d el-mister/source/v074-classes.dex.b64 > /tmp/v0807/work/classes.dex
cp /tmp/v0807/index.html /tmp/v0807/work/assets/index.html
(cd /tmp/v0807/work && zip -q -r /tmp/v0807/El-Mister-v0.8.7.apk .)
base64 -d el-mister/release/v0807-signed/MANIFEST.MF.b64 > /tmp/v0807/signature/META-INF/MANIFEST.MF
base64 -d el-mister/release/v0807-signed/ELMISTER.SF.b64 > /tmp/v0807/signature/META-INF/ELMISTER.SF
base64 -d el-mister/release/v0807-signed/ELMISTER.RSA.b64 > /tmp/v0807/signature/META-INF/ELMISTER.RSA
echo '8f0d2575a63ba3573ed2ace260dd9e72d6bddd0f861fd204f9bce8c1b14fcaaf  /tmp/v0807/signature/META-INF/MANIFEST.MF' | sha256sum -c -
echo 'dfdf1e144c6043ec68ec2b24bf5e2c0e24f80ff5403040be4c0e9cf2147c9038  /tmp/v0807/signature/META-INF/ELMISTER.SF' | sha256sum -c -
echo '5cc11bd3306edcf23d55cf31ad46736ff3a092bb8292adaf7fbe7145e1f075c6  /tmp/v0807/signature/META-INF/ELMISTER.RSA' | sha256sum -c -
(cd /tmp/v0807/signature && zip -q -g -r /tmp/v0807/El-Mister-v0.8.7.apk META-INF)
unzip -t /tmp/v0807/El-Mister-v0.8.7.apk >/dev/null
jarsigner -verify -verbose -certs /tmp/v0807/El-Mister-v0.8.7.apk | tee /tmp/v0807/jarverify.txt
grep -q 'jar verified' /tmp/v0807/jarverify.txt
keytool -printcert -file "$GITHUB_WORKSPACE/el-mister/release-cert.pem" | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0807/expected.fp
keytool -printcert -jarfile /tmp/v0807/El-Mister-v0.8.7.apk | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0807/actual.fp
diff -u /tmp/v0807/expected.fp /tmp/v0807/actual.fp
cp /tmp/v0807/El-Mister-v0.8.7.apk el-mister/El-Mister-v0.8.7.apk
cp /tmp/v0807/index.html el-mister/source/v0807-index.html
SHA=$(sha256sum el-mister/El-Mister-v0.8.7.apk | awk '{print $1}')
python3 - "$SHA" <<'PY'
from pathlib import Path
import json,sys
sha=sys.argv[1]
data={"versionCode":43,"versionName":"0.8.7","apkUrl":"https://raw.githubusercontent.com/agustinperalta745-ai/Silent-Urge-beta-4/el-mister-updates/el-mister/El-Mister-v0.8.7.apk","mandatory":False,"changes":["Se recuperó la variedad de decisiones durante los partidos sin perder la lógica de zona y posesión","Vuelven remates, pases filtrados, centros, pases atrás, duelos y salidas bajo presión cuando la jugada lo permite","Corregido el cierre del partido: ningún minijuego puede saltarse el resultado final","Al terminar se muestra primero el marcador final con Victoria, Derrota o Empate","Se mantiene el Motor 2D y las decisiones encadenadas de la v0.8.6"],"onlineUrl":"https://el-mister-online.agustinperalta745.workers.dev","sha256":sha,"migration":True}
Path('el-mister/latest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
PY
git config user.name 'El Mister Update Bot'
git config user.email 'actions@users.noreply.github.com'
git add el-mister/El-Mister-v0.8.7.apk el-mister/latest.json el-mister/source/v0807-index.html
git diff --cached --quiet || git commit -m 'Fix and republish El Mister v0.8.7 signed APK'
git push origin HEAD:el-mister-updates
