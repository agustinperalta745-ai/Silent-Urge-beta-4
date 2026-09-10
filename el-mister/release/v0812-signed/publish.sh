#!/usr/bin/env bash
set -euo pipefail

rm -rf /tmp/v0812pub
mkdir -p /tmp/v0812pub/final/META-INF /tmp/v0812pub/final/assets

# Payload: exactly the already-tested v0.8.11 gameplay/visual combination, only version markers changed.
cp el-mister/source/v0812-index.html /tmp/v0812pub/final/assets/index.html
base64 -d el-mister/source/v0812-AndroidManifest.xml.b64 > /tmp/v0812pub/final/AndroidManifest.xml
base64 -d el-mister/source/v074-classes.dex.b64 > /tmp/v0812pub/final/classes.dex

# Same release identity, with byte-exact v1 signature metadata.
base64 -d el-mister/release/v0812-signed/MANIFEST.MF.b64 > /tmp/v0812pub/final/META-INF/MANIFEST.MF
base64 -d el-mister/release/v0812-signed/ELMISTER.SF.b64 > /tmp/v0812pub/final/META-INF/ELMISTER.SF
base64 -d el-mister/release/v0812-signed/ELMISTER.RSA.b64 > /tmp/v0812pub/final/META-INF/ELMISTER.RSA

python3 - <<'PY'
from pathlib import Path
import struct
s=Path('/tmp/v0812pub/final/assets/index.html').read_text(encoding='utf-8')
assert "const VERSION='0.8.12';" in s
assert 'const VERSION_CODE=48;' in s
assert 'window.EM811_LEGACY=bag' in s
assert 'window.em809AnimationTruth' in s
assert 'window.em811LegacyDynamicsBridge' in s
Path('/tmp/v0812pub/full.js').write_text(s.split('<script>',1)[1].rsplit('</script>',1)[0],encoding='utf-8')

b=bytearray(Path('/tmp/v0812pub/final/AndroidManifest.xml').read_bytes())
pos=8; strings=[]; native=None; package=None
while pos < len(b):
    typ,hs,sz=struct.unpack_from('<HHI',b,pos)
    if typ==0x0001:
        sc,sty,flags,ss,sts=struct.unpack_from('<IIIII',b,pos+8); utf8=bool(flags&0x100); offs=[struct.unpack_from('<I',b,pos+hs+4*i)[0] for i in range(sc)]; base=pos+ss
        def r8(q):
            x=b[q]; q+=1
            if x&0x80:return ((x&0x7f)<<8)|b[q],q+1
            return x,q
        for o in offs:
            q=base+o
            if utf8:
                _,q=r8(q); ln,q=r8(q); strings.append(bytes(b[q:q+ln]).decode('utf-8'))
            else:
                ln=struct.unpack_from('<H',b,q)[0]; q+=2; strings.append(bytes(b[q:q+ln*2]).decode('utf-16le'))
    elif typ==0x0102 and strings:
        ns,name=struct.unpack_from('<II',b,pos+16); attrStart,attrSize,attrCount=struct.unpack_from('<HHH',b,pos+24)
        if strings[name]=='manifest':
            ap=pos+16+attrStart
            for i in range(attrCount):
                ans,aname,raw=struct.unpack_from('<III',b,ap)
                if strings[aname]=='versionCode': native=struct.unpack_from('<I',b,ap+16)[0]
                if strings[aname]=='package': package=strings[raw]
                ap+=attrSize
    pos+=sz
assert package=='com.elmister.carrera', package
assert native==48, native
print('Android package:', package, 'native versionCode:', native)
PY
node --check /tmp/v0812pub/full.js
node el-mister/release/v0809/test-animation-truth.js

# Create the JAR/APK with META-INF first, avoiding the malformed stream layout from v0.8.11.
(cd /tmp/v0812pub/final && zip -q -r /tmp/v0812pub/El-Mister-v0.8.12.apk META-INF AndroidManifest.xml classes.dex assets)
unzip -t /tmp/v0812pub/El-Mister-v0.8.12.apk >/dev/null

jarsigner -verify -verbose -certs /tmp/v0812pub/El-Mister-v0.8.12.apk | tee /tmp/v0812pub/jarverify.txt
grep -q 'jar verified' /tmp/v0812pub/jarverify.txt
if grep -q 'internal inconsistencies' /tmp/v0812pub/jarverify.txt; then
  echo 'ERROR: malformed JAR/APK stream layout' >&2
  exit 1
fi

keytool -printcert -file "$GITHUB_WORKSPACE/el-mister/release-cert.pem" | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0812pub/expected.fp
keytool -printcert -jarfile /tmp/v0812pub/El-Mister-v0.8.12.apk | sed -n 's/.*SHA256: //p' | tr -d ': ' > /tmp/v0812pub/actual.fp
diff -u /tmp/v0812pub/expected.fp /tmp/v0812pub/actual.fp

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"
APKSIGNER=$(find "$SDK/build-tools" -maxdepth 2 -type f -name apksigner 2>/dev/null | sort -V | tail -1)
if [ -z "$APKSIGNER" ]; then
  echo 'ERROR: Android apksigner not found on runner' >&2
  exit 1
fi
"$APKSIGNER" verify --verbose --print-certs /tmp/v0812pub/El-Mister-v0.8.12.apk | tee /tmp/v0812pub/apkverify.txt
grep -q 'Verifies' /tmp/v0812pub/apkverify.txt

unzip -p /tmp/v0812pub/El-Mister-v0.8.12.apk assets/index.html > /tmp/v0812pub/apk-index.html
grep -q "const VERSION='0.8.12'" /tmp/v0812pub/apk-index.html
grep -q 'const VERSION_CODE=48;' /tmp/v0812pub/apk-index.html
grep -q 'window.em809AnimationTruth' /tmp/v0812pub/apk-index.html
grep -q 'window.em811LegacyDynamicsBridge' /tmp/v0812pub/apk-index.html

cp /tmp/v0812pub/El-Mister-v0.8.12.apk el-mister/El-Mister-v0.8.12.apk
SHA=$(sha256sum el-mister/El-Mister-v0.8.12.apk | awk '{print $1}')
python3 - "$SHA" <<'PY'
from pathlib import Path
import json,sys
sha=sys.argv[1]
p=Path('el-mister/latest.json')
old=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
data={
  "versionCode":48,
  "versionName":"0.8.12",
  "apkUrl":"https://raw.githubusercontent.com/agustinperalta745-ai/Silent-Urge-beta-4/el-mister-updates/el-mister/El-Mister-v0.8.12.apk",
  "mandatory":False,
  "changes":[
    "Corregido el paquete Android: la actualización ahora lleva versionCode nativo 48 y se instala como actualización real",
    "Corregido el orden interno de firma del APK para que Android no lo rechace como paquete inválido",
    "Se mantiene sin cambios la combinación de v0.8.11: simulación visual v0.8.9 + dinámicas históricas del partido",
    "La animación sigue siendo solo visual; goles, decisiones, minijuegos, lesiones, tarjetas y cierre dependen del motor de partido",
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
git add el-mister/El-Mister-v0.8.12.apk el-mister/latest.json
git diff --cached --quiet || git commit -m 'Publish El Mister v0.8.12 Android package fix'
git push origin HEAD:el-mister-updates
