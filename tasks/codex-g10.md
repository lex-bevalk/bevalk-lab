# Codex G10 · Current · Próximamente: «Echar un vistazo» tras 5 latigazos

Rama `current/vistazo-proximamente` (desde `main` 07fc659). **Solo Current.** Concept no se toca: nada en `src/ui/**`, `src/styles/**`,
`src/logic/**`, `src/data/**`, `design/familia/**`, `concept*.html`. Ejecuta `npm run guard:proto -- current --base main`. No hagas
commit ni push. Lee antes `tasks/lessons.md`.

## Petición del usuario
«En Current › Próximamente todos los flujos están difuminados y no se pueden desbloquear. Después de 5 latigazos, en cualquier flujo,
que aparezca un CTA tipo enlace que diga "Desbloquear", "Echar un vistazo" o similar, que quite el difuminado para ojear el flujo.»

## Dónde
Fuente: `design/current/current.html`; regenera con `npm run convert:current` (no edites `src/current/ui/generated/**` ni
`src/current/logic/LabLogic.ts` a mano si son salida del conversor; compruébalo). Si `src/current/props.ts` tipa `lab.soon`, añade ahí los
campos nuevos. La paridad `e2e:current:parity` sigue en 0 diferencias.

Estado actual (verificado por Claude):
- `labVals()` (~9298-9350): `fSoon = LAB_SOON_OF(f)`; `soon.blur/pe/hidden` difuminan dos zonas: el panel central (~967: `filter`,
  `pointer-events`, `user-select`, `aria-hidden`) y el envoltorio del móvil (~1136: los mismos menos `user-select`).
- `labSoon(view)` (~9263): `"whip"` suma `s.lab.whips` (contador de sesión, no se reinicia al cambiar de flujo) y abre la vista
  `whipped`. Vistas del modal en `MODAL`: `ask`, `whipped`, `no`, `lex`. Los grupos `lex` (p1, p2) llegan a latigazos con «Meterle
  prisa» → `ask` → «Sí». El banner fijo (`lab.soon.reopen`, ~964) reabre el modal. Escape cierra (~7064).

## T1 Comportamiento
- Constante `SOON_PEEK_WHIPS = 5` junto a `LAB_SOON_OF` (no un literal suelto).
- Umbral global: cuando `whips >= SOON_PEEK_WHIPS`, **todas** las vistas del modal (`ask`, `whipped`, `no`, `lex`) muestran, debajo de
  los botones, un `<button type="button">` con aspecto de enlace (sin fondo, texto `#4900AC` 600, subrayado, icono `eye` del set ya
  usado si existe, objetivo ≥ 44 px de alto, foco visible). Así aparece en el momento del 5.º latigazo, al reabrir desde el banner y en
  cualquier otro flujo de Próximamente (también p1/p2). Con 4 latigazos no aparece.
- Texto del enlace: rota según el número de latigazos sobre un array corto, tono del modal: «Echar un vistazo», «Desbloquear»,
  «Ojear lo que lleva Lex», «Vale, enséñamelo». Cuando el enlace está presente, la vista `whipped` cambia el cuerpo a una línea que lo
  justifique (p. ej. «Lex se rinde: puedes ojear lo que lleva hecho. Aún no está en vigor.»). Las demás vistas mantienen su texto.
- Al pulsarlo: se añade `s.cur` a `s.lab.peek` (array de ids, solo en memoria de la sesión, sin localStorage) y se cierra el modal.
  Para el flujo actual, si `peek` lo incluye: `blur:"none"`, `pe:"auto"`, `hidden:"false"` en **las dos zonas**; el móvil y el panel
  central responden a clics y a teclado como en un flujo normal. Otros flujos de Próximamente siguen difuminados hasta que se pulse su
  enlace (que ya se ofrece, porque el umbral es global).
- `soon.on` sigue verdadero en un flujo ojeado: el banner fijo se mantiene, con el texto «Vistazo · aún no está en vigor» (o similar
  según `whip`/`lex`), y reabre el modal como hoy. El chip «Próximamente» del flujo no cambia.
- Tras desbloquear, el foco va al `main.lab-col` (o a su primer encabezado), no se pierde en `body`.
- Al abrir un flujo ya ojeado, el modal no se abre automáticamente (`labOpen` abre hoy `soonOpen: !!soon`): en ese caso
  `soonOpen:false`.
- `Reiniciar el móvil` y el cambio de plan no quitan el vistazo.

## T2 Comprobación de producto
Lista en el informe qué flujos de p1-p4 no tienen pantalla propia (sin `case` que fije `st.screen`, o pantalla inexistente) y qué ve
el móvil al ojearlos. No lo arregles: solo infórmalo.

## T3 Gates
- `npm run convert:current` idempotente (segunda pasada, 0 cambios).
- `npx tsc --noEmit -p .`, `npm test`, `npm run build` sin avisos, `check-login-assets`, `check-middleware-esm`.
- `e2e:current:parity` 0 diferencias, `e2e:current:geometry`, `e2e:current:a11y`, `e2e:current:home`, focus de Current,
  `e2e:proto-switch`, `e2e:review`, `npm run guard:proto -- current --base main`.
- Nuevo `tests/e2e/current/soon-peek.js` (`npm run e2e:current:peek`, paso nuevo en `.github/workflows/qa.yml` junto a «Current
  redesigned home»): en `/`, abrir un flujo de Novedades (p. ej. A14) → modal `ask` sin enlace; «Sí» y 3× «Otro latigazo» (4 en total)
  → sin enlace; 5.º → enlace presente; pulsarlo → modal cerrado, las dos zonas con `filter: none`, `aria-hidden="false"`,
  `pointer-events` auto y un clic en el móvil cambia de pantalla; banner presente y reabre el modal, con el enlace aún visible.
  Abrir otro flujo de Novedades → difuminado y el modal ya ofrece el enlace. Abrir un flujo `lex` (p1) → «Vale, esperaré»/«Meterle
  prisa» llevan a una vista con enlace. Volver al primer flujo → sigue ojeado y sin modal automático. Recargar la página → todo vuelve
  a difuminarse y los latigazos a 0.
- Concept intacto: `git diff --stat main` sin archivos de Concept.

## Paradas
Para y reporta si: la paridad deja de ser 0, el conversor no regenera limpio, `whips` se pierde al cambiar de flujo, o hace falta
tocar algo de Concept.
Entrega: diff --stat, capturas a 1440×900 en `.tmp/` (modal con el enlace tras el 5.º latigazo; flujo ojeado sin difuminado), la lista
de T2 y el resultado de cada gate.
