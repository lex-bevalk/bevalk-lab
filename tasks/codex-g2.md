# Codex G2 · Tier 2: extracción de Current (activos, estilos, datos, lógica)

Rama `feat/proto-selector`, encima de G1 ya verificado (commit de G1 hecho por Claude). No hagas commit ni push.
Fuente única y de solo lectura: `design/current/current.html` (export autocontenido de 7,6 MB: runtime DC minificado, React UMD de
cdnjs, lucide 0.544.0 UMD en ~l. 10598-10610, `@ds-bundle` de Odin en ~l. 10611, fuentes e imágenes en `data:` base64).
Mapa aproximado (verifícalo, no lo supongas): `<head>`/estilos Odin y fuentes l. 1-842 · `<x-dc>` plantilla 843-5451 (`<helmet>`
844-886, raíz `.lab` 887) · `<script type="text/x-dc" data-dc-script data-props=…>` 5452 · datos 5453-6915 · `class Component extends
DCLogic` 6916 hasta el cierre del script.

Modelo a seguir (concept, no lo modifiques): `tools/extract-data.mjs`, `tools/extract-logic.mjs`, `tools/copy-assets.mjs`,
`src/logic/DCLogic.ts`, `src/props.ts`, `tests/unit/reference-data.ts`, `tests/unit/data.test.ts`, `tests/unit/logic-smoke.test.ts`.

## Prohibido
Todo path de `concept` en `tools/proto-paths.json`. Sin dependencias nuevas. Ningún import desde `src/current/**` hacia concept
(`tests/unit/proto-isolation.test.ts` debe seguir en verde y dejar de ser vacuo).

## T1 Activos
- `tools/current/assets.mjs`: helper compartido. Encuentra cada `data:<mime>;base64,<…>` del archivo; `assetPath(uri)` devuelve
  `/assets/current/<md5 del binario>.<png|gif>` para imágenes. Error ruidoso ante un mime no previsto.
- `tools/current/extract-assets.mjs`: escribe imágenes únicas en `public/assets/current/` y fuentes `woff2` en
  `src/current/styles/fonts/<Familia>-<peso>[-<estilo>].woff2` (nombre desde su `@font-face`). Idempotente. Imprime recuentos.

## T2 Estilos
- `tools/current/extract-styles.mjs` → `src/current/styles/odin.css`: los `<style>` de cabecera (todo lo anterior a `<x-dc>`, salvo el
  reset del propio runtime si es solo del visor, decídelo leyendo el archivo y justifícalo), con `url(data:…)` de fuentes →
  `./fonts/…woff2` y de imágenes → `/assets/current/…`. El `<helmet><style>` de la plantilla NO va aquí (lo emite el conversor en G3).
- Antes de cerrar: diferencias entre este Odin y `src/styles/odin/**` en tokens (`:root`) en un resumen de 5-10 líneas. Solo informar.

## T3 Datos y props
- `tools/current/extract-data.mjs` → `src/current/data.ts` (un módulo, `// @ts-nocheck` permitido, cada `const` de nivel superior
  exportado con su literal intacto salvo `data:` → `assetPath`) y `src/current/props.ts` desde `data-props` (mismo formato que
  `src/props.ts`, `defaultProps` + `CurrentProps`).
- Test `tests/unit/current-data.test.ts`: evalúa el bloque de datos original en `vm` (con el mismo reemplazo de `data:`) y compara en
  profundidad con lo generado, incluidas funciones por `toString()`; cuenta 62 flujos en `LAB_ALL_FLOWS` y 20 grupos en `LAB_ALL_GROUPS`.

## T4 Lógica
- `tools/current/extract-logic.mjs` → `src/current/logic/LabLogic.ts`: la clase literal (`// @ts-nocheck`), `extends DCLogic` de
  `./DCLogic` (copia de `src/logic/DCLogic.ts`), imports desde `../data`, `data:` → `assetPath`. Únicos cambios permitidos y
  documentados en un comentario de cabecera: `paint()` y `waitLucide()` no-op (los iconos los pinta `<Icon>` en G3, como en concept),
  y lo estrictamente necesario para compilar como módulo. Nada de refactor. Idempotente.
- Test `tests/unit/current-logic-smoke.test.ts` (patrón de `logic-smoke.test.ts`, sin DOM o con el mínimo que use el host falso):
  con `defaultProps`, `componentDidMount` no lanza; para CADA id de `LAB_ALL_FLOWS`, `labOpen(id)` + `renderVals()` no lanza y
  `state.lab.cur === id`; `labPlan('premium')` cambia `world().plan` a premium y `labPlan('free')` lo devuelve; al menos 3 casos
  ejecutables (`casos[].caso`) de flujos distintos alcanzan su pantalla (deduce de la lógica qué campo de estado lo indica).

## T5 Guardia y scripts
- `tools/proto-paths.json` `current` añade: `tools/current/**`, `tests/unit/current-*`, `tests/e2e/current/**`.
- `qa.yml`: los pasos «Prototype guard · Current/Concept» van detrás de «Set up Node.js 24» (hoy corren antes y dependen del Node
  del runner); el paso de setup debe ejecutarse también cuando la guardia aplica, aunque `code` sea `false`. La guardia compara
  contra `origin/${{ github.base_ref }}`, no contra `origin/main` fijo.
- `package.json`: `extract:current` encadena T1-T4. Segunda ejecución → `git status` vacío.

## Entrega y paradas
Reporta: recuentos de activos y fuentes (con tamaños), bytes de `data.ts`/`LabLogic.ts`, resumen de diferencias de Odin,
`npx tsc --noEmit -p .`, `npm test` (total), `npm run build` sin avisos, idempotencia, `grep -c "data:image\|data:font"` en
`src/current` y `public` = 0. Para si: la clase usa APIs del runtime DC que `DCLogic` no tiene (lístalas), el bloque de datos no
es separable del de la clase, o algún flujo lanza en `renderVals()` (no lo «arregles»: reporta el error y el id).
