# El Míster — firma y publicación de APK

Este archivo deja documentado el procedimiento canónico para que el problema de la firma no vuelva a resolverse desde cero en cada versión.

## Identidad de firma que debe conservarse

- Paquete Android: `com.elmister.carrera`
- Alias histórico: `elmister-release`
- Certificado: `CN=El Mister Release, O=El Mister, C=AR`
- Huella SHA-256 del certificado: `87:11:11:3A:4D:61:A2:06:FC:5B:17:8E:F8:70:B6:6A:97:1E:FF:6C:F4:CF:23:BD:43:FC:6D:2D:0B:CF:C2:57`
- El certificado público del repositorio está en `el-mister/release-cert.pem`.

Nunca cambiar de clave de firma para una actualización normal: Android rechazaría la APK sobre una instalación existente.

## Procedimiento que ya funcionó

1. Construir la APK unsigned exacta desde la fuente/version que se va a publicar.
2. Firmar esa APK localmente con la clave histórica de El Míster. La clave privada y su contraseña NO se suben al repositorio.
3. Verificar la APK firmada con `jarsigner -verify -verbose -certs` y comprobar que la huella del certificado coincida con `el-mister/release-cert.pem`.
4. Extraer de la APK firmada estos tres archivos:
   - `META-INF/MANIFEST.MF`
   - `META-INF/ELMISTER.SF`
   - `META-INF/ELMISTER.RSA`
5. Guardar sólo esos bloques de firma públicos, codificados en base64, bajo `el-mister/release/vXXXX-signed/`.
6. El workflow de publicación reconstruye la APK exacta, adjunta esos tres bloques, vuelve a verificar la firma y la huella, publica la APK, guarda la fuente versionada y recién entonces actualiza `el-mister/latest.json`.

Este patrón se usó en las publicaciones de la línea 0.7.x y nuevamente en v0.8.0. La v0.8.0 está implementada en `.github/workflows/el-mister-v0800-publish.yml` y sirve como plantilla de referencia para las próximas versiones.

## Si vuelve a aparecer el mensaje “falta la contraseña”

Antes de asumir que la firma está perdida:

1. Revisar si en el workspace actual ya existe una APK firmada de esa versión o una carpeta de release con los tres archivos `META-INF`.
2. Revisar los artefactos de la sesión/build y los logs de `jarsigner`; un intento anterior puede haber firmado correctamente aunque la publicación haya quedado interrumpida.
3. Si la APK firmada existe y verifica con la huella canónica, no hace falta volver a firmarla: extraer sus tres bloques y continuar con el workflow de publicación.
4. Sólo si no existe ningún firmado válido de esa versión hace falta volver a usar la clave privada local.

## Seguridad

- No subir jamás el `.p12`, una clave privada ni la contraseña a este repositorio público.
- No escribir la contraseña en workflows, commits, issues o documentación.
- Los archivos `.SF`, `.RSA` y `MANIFEST.MF` extraídos de una APK firmada son artefactos de firma de esa APK concreta, no sustituyen la clave privada y no permiten firmar una APK diferente.
- Antes de mover `latest.json`, verificar siempre versión, firma, certificado y contenido de `assets/index.html`.
