# Codex F12b · correcciones de la fase A (revisión de Claude)

Misma rama y reglas que `tasks/codex-f12.md`. No hagas commit ni push. Diagnóstico de Claude contra `npm run preview`:

## 1. Crash al abrir F20 `famcomparto` (causa de `sweep`)
`selectFlow` (src/logic/LabLogic.ts ~l. 558) mezcla bien `famPatch.mem` en profundidad sobre `fam0`, pero la rama `f.start === "fam"`
(~l. 577) vuelve a aplicar `f.famPatch` en plano sobre `st.fam` y pisa `mem` con `{aviso:false}` → `famVals` hace `.map` sobre
`undefined` y React desmonta todo el Lab. Corrige la raíz en ese único sitio: la rama `fam` no debe volver a aplicar `famPatch`
(ya está en `st.fam`), o debe usar la misma mezcla profunda. Añade un test unitario de regresión que, para CADA entrada de `FLOWS`,
llame a `selectFlow` y a `renderVals()` sin lanzar errores (control negativo: debe fallar con el código actual).

## 2. Casos validados eliminados (incumple «sin perder casos que sigan siendo válidos»)
Se sustituyeron 18 casos de familia con historial de QA por los de `Lab.dc.html`. Restáuralos desde `git show HEAD:src/data/lab.ts`
con su id, `prep`, `steps`, `ac` y su guion de `tests/e2e/qa.js` (`git show HEAD:tests/e2e/qa.js`), y entradas en `LAB_QA`/`LAB_AC_BY`:
- famoferta c1-c2 · famcrear c1-c2 · famadmin c1-c3 (c2 es crítico de seguridad) · famavisar c1-c2 · famficha c1-c2 ·
  famajustes c1-c2 · faminvite c1-c2 · fammember c1 · famayuda c1-c3.
Los casos de `Lab.dc.html` se AÑADEN detrás con los ids siguientes (p. ej. famadmin c4, c5). Si un caso antiguo ya existe con otro
texto entre los nuevos (p. ej. «Sin conexión» de famayuda), no lo dupliques: queda el antiguo.
Si un caso antiguo necesita ajustar `prep`/`steps` porque la pantalla cambió (p. ej. cancelar el plan ahora pasa por la vista `baja`,
salir del grupo por `salir`), ajústalo para que siga alcanzando el final y lístalo. No borres ninguno.

## 3. `tests/e2e/inv.js`
Revierte la invariante 4 a su versión de HEAD (era «un caso con sin conexión no contamina otro flujo» usando famadmin c3; con el
punto 2 vuelve a existir). Conserva solo el cambio de `executablePath`. Comprueba la invariante 5 con los casos restaurados; si falla,
arregla la causa en el código, no la expectativa.

## 4. `tests/e2e/focus.js`
La diferencia con la referencia es esperada solo por los botones de flujos de familia nuevos en la navegación. Normaliza ambas
secuencias quitando los botones de navegación de los grupos «Mi Familia · …» (y de los dos grupos antiguos en la referencia) y exige
que el resto sea idéntico. Si queda alguna otra diferencia, es un bug: arréglalo en el código.

## Entrega
Toda la batería de F12 incluidas las visuales (`visual:baseline`, `visual`, `visual:own`) con números. Diff de casos restaurados y
ajustados. Mismas paradas.
