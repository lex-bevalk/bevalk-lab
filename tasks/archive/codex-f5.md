# Codex · Selectores `opts` → dropdown Odin

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/select-dropdown` (no cambies de rama, no hagas commit ni push). Sin red. Sin dependencias nuevas.
No escribas en `dist/` (compila con `npx vite build --outDir <tmp fuera del repo>`). No toques Vercel ni GitHub. No añadas `--configLoader runner` a `package.json`.
Petición del usuario (aprobada): los 5 selectores que hoy abren un drawer inferior (`sheet.kind === "opts"`) deben abrir un dropdown con el diseño
de Odin (Select §13.6), igual en todos los sitios. Es la primera divergencia de producto respecto a la referencia. Blueprint validado por Claude:
lo que sigue es vinculante.

## Hechos verificados
- Triggers: los únicos `aria-haspopup="dialog"` de `handoff/reference/project/Main.dc.html` (líneas 1684, 1724, 1751, 3673, 3745), con
  `onClick` `pr.sec.pick`→`prsec`, `pr.del.pick`→`prdel`, `pr.fb.pick`→`prfb`, `sop.pickAsunto`→`sop`, `sos.pickHelp`→`sos`.
- Estado: rama opts de `sheetBase` en `renderVals` (`Main.dc.html` ~9354-9375). Todos los `pick` ya hacen `sheet:null`. Escape ya cierra el sheet
  (`src/logic/LabLogic.ts` `onKey` → `closeOverlays`). El drawer se monta bajo `sheet.visible` (`Main.dc.html:4394`).
- `prsec` y `prdel` pueden estar a la vez en pantalla: abierto ⇔ `sheet.hasOpts && sheet.target === target`.
- El estado cerrado está en el gate visual (`tests/visual/review-areas.mjs` captura `sos-formulario` y `soporte-tecnico`): debe quedar a 0 px.
- Comportamiento Odin de referencia: `Select` en `handoff/reference/project/ds/odin/_ds_bundle.js` (busca `// components/forms/Select.jsx`).

## Reglas
- "Generado, no editar" sigue vigente: los cambios van en `tools/extract-logic.mjs` y `tools/convert-template.mjs` como divergencias declaradas.
  Cada divergencia usa una aguja exacta y hace `throw` si no aparece. Regenerar dos veces debe dejar `git diff` vacío en la segunda.

## Tareas
1. `tools/extract-logic.mjs`: en la rama opts de `sheetBase`, `{visible:true, title: s.sheet.title || "", body:"", hasList:false` →
   `{visible:false, target: optTarget, title: s.sheet.title || "", body:"", hasList:false` (reemplazo exacto + `throw` si falta). Con
   `visible:false` el drawer no se monta (sin `dialogRef` ni `trapKey`). Regenera `src/logic/LabLogic.ts`.
2. `tools/convert-template.mjs`: localiza los nodos `button[aria-haspopup="dialog"]`, `assert` de que son exactamente 5 y mapea su expresión
   `onClick` a target (tabla de arriba). Envuelve la salida normal del botón (sin cambiar nada del botón) en
   `<OptSelect vals={…scope raíz con sheet…} target="prsec">…</OptSelect>`, con el import en los generados que lo usen.
3. `src/ui/OptSelect.tsx` (nuevo): wrapper `<div className="lab-optsel" style={{position:'relative', display:'flex', flexDirection:'column'}}>`
   (comprueba que no altera el layout: el gate visual lo dirá) + `cloneElement(children, …)` que inyecta `aria-haspopup="listbox"`,
   `aria-expanded`, `aria-controls`, `aria-activedescendant`, `data-open`, `onKeyDown` y un `onClick` que alterna (abierto → `vals.sheet.close()`;
   cerrado → `onClick` original). Concatena `className`, no lo sustituyas. Abierto ⇔ `vals.sheet.hasOpts && vals.sheet.target === target`.
   Menú: `<div className="odin-menu" role="listbox" id=… aria-label={vals.sheet.title}>` con `vals.sheet.opts` como
   `<button type="button" role="option" className="odin-menu__item" aria-selected data-active>` + `odin-menu__check` (lucide Check 16 vía
   `src/ui/Icon.tsx` si es posible) en la seleccionada; `onClick` = `o.pick()`. Teclado (réplica de Odin `Select`): ArrowDown/ArrowUp (abre si
   está cerrado, colocando el cursor en la opción actual), Home, End, Enter y Espacio con cursor; `onMouseEnter` mueve el cursor; `mousedown` fuera
   del wrapper cierra (listener en `document` solo mientras está abierto). Escape ya funciona vía `closeOverlays`, no lo dupliques. Al abrir:
   `menu.scrollIntoView({block:'nearest'})`. Al pasar de abierto a cerrado: si `document.activeElement` es `body` o está dentro del wrapper,
   `trigger.focus()`.
4. `src/styles/opt-select.css` (nuevo, ≈10 líneas, importado en `src/main.tsx` después de `main.css`):
   `.lab-optsel > [data-open="true"]{border-color:var(--color-ring)!important;box-shadow:var(--focus-ring)}`, el chevron del trigger abierto rota
   180° con transición `var(--duration-normal) var(--ease-out)`,
   `.lab-optsel .odin-menu{top:100%}` si hace falta, y `.lab-optsel .odin-menu__item{font:400 1rem/1.5rem var(--font-sans);min-height:44px;padding:10px 40px 10px 12px}`.
5. `tests/e2e/select.js` (+ script `e2e:select` en `package.json`, con el mismo patrón que `tests/e2e/qa.js`: `LAB_URL`, headless, `GETC`): para
   cada uno de los 5 targets, navega con `window.__lab` hasta la pantalla (sos/sop: patches de `review-areas.mjs`; prsec/prdel/prfb: lee
   `renderVals()` para llegar). Comprueba: abrir con clic → `aria-expanded="true"` y menú visible; no existe `.odin-drawer` ni `[role=dialog]`;
   elegir con clic → valor en el estado y menú cerrado; reabrir y cerrar con `mousedown` fuera; con Escape; con teclado ArrowDown+Enter; foco en
   el trigger tras cerrar. Además, una pasada de axe (como en `tests/e2e/axe.js`) con un menú abierto: 0 violaciones. Salida `N/N`.
6. Capturas propias: `tests/visual/own-capture.mjs` (+ script `visual:own`) que captura cada target con el menú abierto a 1680×916 y 375×812 en
   `tests/visual/own/current/`, y lo compara (reutiliza el `compare` existente) contra `tests/visual/own/baseline/` si existe. No generes el
   baseline: lo genera Claude y lo aprueba el usuario. No toques `qa.yml` todavía.

## Gate (pega los números)
- `npx tsc --noEmit -p .` 0; `npm test` verde; regenerar los dos generadores dos veces: la segunda sin cambios; 0 `/_blob/`; build sin avisos.
- No ejecutes la batería e2e/visual existente contra preview ni `e2e:select`: la ejecuta Claude. Sí puedes probar `OptSelect` como quieras sin
  escribir en `dist/`.

## Para y reporta si
Una aguja no casa; hace falta tocar otra cosa de la lógica o de la plantilla; una dependencia nueva; o el envoltorio exige cambiar estilos del
trigger cerrado.

## Entregable
Archivos, números del gate, desviaciones y dudas. Sin commits.
