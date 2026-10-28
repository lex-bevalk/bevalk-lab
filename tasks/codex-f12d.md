# Codex F12d · cerrar la fase A

Misma rama y reglas. No hagas commit ni push. Claude verificó a mano tras tu regeneración (capturas a 1680×916 contra `preview`):
las pantallas ya son fieles a `Lab.dc.html` (F01, F02, F05, F13, F14, F25). La conversión ya es correcta: NO vuelvas a regenerar
salvo que cambies `design/familia/Main.dc.html`. Los 11 fallos de `tests/e2e/family-layout.js` son defectos del test:

1. X de 42,37 px: el móvil está escalado con `transform: scale()` (0,963 a 1680×916). Mide el tamaño CSS (`offsetWidth/offsetHeight`
   o divide el rect por la escala del `.tp-phone`), no el rect en pantalla.
2. `famdescubrean`: la nota está DENTRO de la tarjeta de resultado, bajo «Reportar / Abrir de todos modos» (igual que la referencia).
   La regla correcta: la nota está dentro de `.tp-scroll` y su `top` es mayor que el `bottom` del botón «Comprobarlo en la app de BBVA»
   (la acción principal) y del enlace «Abrir de todos modos».
3. `fambaja`: «Cancelar el plan» es el título de la cabecera fija, fuera del scroll por diseño. La regla correcta: el primer hijo
   visible del `.tp-scroll` no se solapa con la cabecera (su `top` ≥ `bottom` de la cabecera).

Mantén los controles negativos: demuestra que cada regla corregida sigue fallando si el bloque se mueve fuera de su sitio
(p. ej. inyectando en la página un estilo que lo saque de su sitio solo durante el control negativo) y quita esa inyección después.

Después ejecuta la batería completa de F12 con números: `tsc`, `npm test`, `build`, `e2e`, `e2e:baseline`, `invariants`, `sweep`,
`a11y`, `focus`, `e2e:family-layout`, `visual:baseline`, `visual`, `visual:own` (el genérico falla igual en main: entorno, no lo toques).
Si `convert-template` u otro script agota tiempos, no es parada: reinicia los servidores que lanzaste tú (no los demás) y sigue.
Para la comparación visual, informa cuántas capturas excluyes y por qué; ninguna diferencia fuera de las tarjetas de familia de Inicio
y las pantallas de familia.
