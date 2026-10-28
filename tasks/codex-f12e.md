# Codex F12e · comparación visual con máscaras en lugar de exclusiones

Misma rama y reglas. No hagas commit ni push. No regeneres plantillas.

## Diagnóstico de Claude sobre los 361 FAIL / 256 MISSING (tests/visual/diff/comparison-summary.json)
- 479 son capturas `*-scroll-nav-*`: la navegación tiene 47 flujos en vez de 30, así que cambia su contenido y su número de páginas.
- El resto, mirado a mano, cae en:
  a) cabecera de la navegación («47 flujos · 14 grupos»);
  b) Inicio con la tarjeta `famHome` (todo usuario sin grupo o con grupo), que empuja el contenido de debajo;
  c) analizador de Basic con riesgo medio/alto: la nota `famAn.nudge` alarga el resultado y reduce el hueco flexible (~20 px en F10);
  d) vista de caso `case-seguridad-F01-c2` (y otras `case-*`): contenido de la ficha idéntico, pero la columna central queda 10 px más
     abajo. Causa sin verificar: averíguala; si viene de un cambio nuestro en el shell o en el scroll al caso, corrígela; si es
     consecuencia legítima de (a)-(c), demuéstralo.

## Qué hacer
1. `capture.mjs` guarda junto a cada PNG (sidecar JSON o un manifiesto) las cajas de `.lab-a` y de `.tp-phone`, y si en ese momento
   `famHome.show` o `famAn.nudge`/`famAn.show` son verdaderos o la pantalla es `familia`.
2. `compare.mjs` aplica máscaras, no exclusiones de archivo:
   - siempre se enmascara la caja de `.lab-a` (navegación; su contenido lo cubren e2e, `focus` normalizado y `visual:own`);
   - se enmascara la caja de `.tp-phone` solo cuando el sidecar dice que hay bloque de familia visible o pantalla `familia`;
   - todo lo demás (ficha central, cabeceras, móvil sin bloques de familia) se compara con el umbral actual.
   - las series `*-scroll-nav-*` se excluyen por nombre (su número de páginas depende de la longitud de la lista), con motivo.
3. Quita la lista de 1502 exclusiones por nombre de flujo de familia: con las máscaras ya no hace falta salvo `scroll-nav`.
4. Control negativo: un cambio de 1 px de color en la ficha central de un flujo no familiar debe dar FAIL (hazlo en una copia temporal
   de una captura, no en el código).

## Entrega
`visual:baseline` + `visual` con números (compared/pass/fail/missing y cuántas capturas llevan máscara de móvil). Objetivo: 0 FAIL y
0 MISSING fuera de `scroll-nav`. Si queda algún FAIL, lista los nombres y la causa; no amplíes máscaras para taparlo.
Vuelve a pasar `npm test`, `tsc` y `e2e:family-layout` si tocaste algo compartido.
