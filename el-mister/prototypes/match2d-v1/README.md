# El Míster · Match2D prototype

Prototipo aislado de simulación 2D estilo manager/FIFA con 22 puntos y pelota. No modifica ni publica la APK actual.

## Regla principal

El sistema histórico de partido y decisiones sigue mandando.

- `makeMatchScenario()` sigue creando la situación real.
- La capa 2D recibe esa misma situación y se pausa.
- `resolveMatchChoice(i)` sigue siendo el único resolutor de gameplay en producción.
- El bridge sólo refleja la opción elegida (`set`, `e`, texto) en la posición/movimiento visual de los puntos.
- Un fallo de Canvas/visual nunca borra `S.live.scenario`, nunca avanza el índice de situación y nunca reanuda por su cuenta el partido histórico.

## Integración prevista

1. Iniciar `Match2DEngine` junto con el partido histórico.
2. Sincronizar minuto/marcador/posesión desde `S.live` con `engine.sync(...)`.
3. Cuando exista `S.live.scenario`, llamar `bridge.pauseForScenario(S.live.scenario)`.
4. Mantener el `renderLiveDecision()` y `resolveMatchChoice(i)` actuales.
5. Tras resolver la opción histórica, reflejar únicamente el efecto visual con `bridge.mirrorChoice(i)` y reanudar el motor 2D.

El `index.html` del prototipo usa tres situaciones tácticas reales ya existentes en El Míster solamente para demostrar el acople. No reemplaza el generador de preguntas del juego.
