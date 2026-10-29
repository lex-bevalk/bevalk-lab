# Codex G3 · Tier 3: UI de Current (conversor, Host, entradas, paridad)

Rama `feat/proto-selector`, encima de G1 y G2 verificados. No hagas commit ni push.
Objetivo: `/` y `/review` muestran Current replicado al máximo detalle desde `design/current/current.html`, con su propio shell
(grid `300px | 1fr | 470px`, secciones App / Mi Familia / Próximamente, pills `Todos / Basic / Quien gestiona / Invitada / Miembro`,
plan Free/Premium, modal de «Próximamente»). Sin capturas como gate (decisión del usuario): la fidelidad se demuestra con paridad
determinista contra el original.

## Prohibido
Paths de concept (`tools/proto-paths.json`), incluido `tools/convert-template.mjs` (es de concept: no lo parametrices; copia).
Sin dependencias nuevas (`lucide-react@0.544.0` ya está y coincide con el lucide de current).

## T1 Conversor de Current
`tools/current/convert-template.mjs`, derivado de `tools/convert-template.mjs` (misma semántica: truthiness de `sc-if`, keys por
índice en `sc-for`, acceso tolerante, `sc-interp`, estilos en línea como objetos, `style-hover/active` → clases + CSS, `<i data-icon>`
→ `<Icon>`; lee `tools/TEMPLATE_SEMANTICS.md`). Diferencias:
- Entrada: `node tools/serve-reference.cjs 8766 design/current/current.html` → `http://127.0.0.1:8766/project/Main.dc.html`
  (el original es autocontenido; necesita red para React de cdnjs).
- Secciones por la estructura real de current: `nav.lab-col`, `main.lab-col`, `aside.lab-pv`, el modal `[data-lab-modal]` y lo que
  cuelgue de `.lab`; pantallas por `data-screen-label` (29 etiquetas; error si cambia). Verifica la estructura antes de asumirla.
- Sin sustitución `OptSelect` (current tiene 1 `aria-haspopup="dialog"`; se respeta el original). Sin aserción de 5 triggers.
- `data:` → `assetPath()` de `tools/current/assets.mjs` (G2).
- Salida: `src/current/ui/generated/**`, `src/current/ui/Icon.tsx` (mapa de iconos desde plantilla + `src/current/data.ts` +
  `src/current/logic/LabLogic.ts`, error ruidoso si falta uno), `src/current/styles/lab.css` (`<helmet><style>` + pseudoclases).
- Idempotente: segunda pasada → 0 cambios. `npm run convert:current`.

## T2 Host y entradas
- `src/current/Host.tsx` y `src/current/main.tsx` con el mismo patrón que `src/Host.tsx`/`src/main.tsx` (copia, no import):
  host de clase, `componentDidUpdate` con un argumento, sin StrictMode, `window.__lab` = lógica de current. `main.tsx` importa
  `styles/odin.css` y `styles/lab.css` de current y nada de `src/styles`.
- `index.html` y `review.html`: sustituye el marcador por `#root` + `src/current/main.tsx` (review: además `#review-root` como hoy).
  `<title>`: `BeValk Lab · Current version`. Mantén `data-proto="current"` y `#proto-root`.
- `src/proto-switch/proto-switch.css`: reserva el hueco del selector en el nav de current igual que en concept
  (`html[data-proto="current"] nav.lab-col { padding-bottom: … !important }`), y que el selector no tape el último flujo.
- `vite.config.ts`: `chunkSizeWarningLimit` al tamaño medido (comentario con la cifra); build sin avisos.
- `src/review/bridges.ts`: confirma el puente de current contra la lógica real (`state.lab.cur`, `world().plan`, `labOpen`, `labPlan`);
  quita `labAllFlows` si no existe en current y valida el id contra `LAB_ALL_FLOWS` de `src/current/data.ts` sin importar concept.

## T3 Paridad con el original (gates)
- `tests/e2e/current/parity.js` (`npm run e2e:current:parity`), referencia en 8766 y app en `http://localhost:4173/` (`vite preview`).
  Obtén la instancia de la lógica del original como hace `tests/e2e` con la referencia de concept (fiber walk) y `window.__lab` en la app.
  Para CADA id de `LAB_ALL_FLOWS` (62) y para cada caso ejecutable (`casos[].caso`): `labOpen(id, caso)` en ambos, espera estable, y
  compara: etiquetas `data-screen-label` visibles, texto normalizado de `main.lab-col`, `nav.lab-col` y `aside.lab-pv`, número de
  botones/enlaces visibles y `aria-*` de los controles del shell. Repite 10 flujos de App con `labPlan('premium')` y 5 de Mi Familia con
  cada pill de rol. 0 diferencias; si hay diferencias legítimas (aleatoriedad, hora), enmascáralas con lista explícita y justificada.
- Geometría: `tools/compare-geometry.mjs` es de concept; crea `tests/e2e/current/geometry.js` que compare cajas de `.lab-grid`,
  `nav.lab-col`, `main.lab-col`, `aside.lab-pv`, `.tp-phone` y del modal a 375, 760, 1180, 1440 y 1680 px, ±1 px.
- Foco: `REF_URL=http://127.0.0.1:8766/project/Main.dc.html LAB_URL=http://localhost:4173/ npm run focus` idéntico (ya excluye `#proto-root`).
- Consola: 0 errores/avisos en la app al recorrer los 62 flujos (los avisos del original se listan aparte, no cuentan).
- a11y: axe sobre la portada y 6 flujos (2 por sección): las violaciones de la app ⊆ las del original. Repórtalas.
- `qa.yml`: arrancar la referencia de current en 8766 junto a la de concept y añadir paridad, geometría y foco de current.
  `e2e:proto-switch` y `e2e:review` siguen verdes con Current real en `/` y `/review.html`.

## Entrega y paradas
Reporta: archivos generados (n.º de pantallas), idempotencia, `tsc`, `npm test`, build (tamaños de los chunks de cada entrada),
paridad (flujos × casos comparados, diferencias), geometría, foco (pasos), consola, a11y, `e2e:proto-switch`, `e2e:review`,
`visual:smoke` contra `main` (concept debe dar 0 diferencias), `guard:proto -- current` sobre los archivos de G3 (debe pasar salvo
`src/proto-switch/**` y `src/review/**`, que son compartidos). Para si: la paridad no llega a 0 tras dos iteraciones del conversor
(reporta las diferencias por flujo), o necesitas tocar concept.
