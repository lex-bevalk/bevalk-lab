# Porte BeValk Product Experience Lab · plan

Spec: `handoff/PROMPT_CLAUDE_CODE.md` (Parte B). Rama de trabajo: `feat/port`. Nada entra en `main` sin OK.
Roles: Claude orquesta, revisa y verifica · Codex escribe todo el código de producto y de pruebas · el usuario aprueba merges y todo lo de Vercel.

## Fase 0 · Inventario (26 oct 2026) · HECHA

### Estado del repo
- `main`: 1 commit (`a983ea4`) con `handoff/` (idéntico byte a byte a `bevalk-lab-handoff_1.zip`) y `.gitignore` raíz.
- `fonts/` local (Guton comercial, archivos de escritorio) queda fuera del repo público. La app solo usa
  `handoff/reference/project/ds/odin/assets/fonts/Guton-SemiBold.woff2` (único peso declarado: 600).
- Identidad git local del repo: `lex-bevalk <348239151+lex-bevalk@users.noreply.github.com>`.

### Vercel
- El proyecto se llama `product-lab` (team `bevalk`), no `bevalk-lab`. Preset "Other", enlazado al repo
  (renombrado desde `product-lab`; el enlace funciona).
- El push de `main` ya desplegó a Production (`product-qavomd92y-bevalk.vercel.app`), protegido por Vercel Authentication.
  Cualquier push a cualquier rama despliega (main → Production, resto → Preview).
- `product-lab.vercel.app` es de un tercero. `bevalk-lab.vercel.app` da 404 (probablemente libre).

### Batería contra la referencia
| Prueba | Esperado | Obtenido |
|---|---|---|
| `qa` | 62/62 | 62/62 |
| `qa:baseline` | 62/62 | 62/62 |
| `invariants` | 17 PASS | 17 PASS, 0 FAIL |
| `sweep` | 0 errores | TOTAL ERRORS 0 |
| `a11y` | 0 violaciones | 0 (welcome, flow + case) |

### Pantallas del móvil (`data-screen-label`): 28 únicas, 32 instancias
Acceso (2), Acciones, Alertas (2), Analizador, Aprende, Aviso, Ayuda, Bienvenida, Bloqueo, Borrar mis datos,
Comprobar, Cómo se usa BeValk, Desglose, Hitos, Inicio, Lección, MarIA, Mi Familia (2), Mi huella,
Mi huella · flujo, Notificaciones, Pasos, Perfil, Perfil · flujo, Premium, SOS (2), Soporte técnico, Subida.

Agrupadas por las áreas de Fase 2:
- Acceso y onboarding: Acceso, Bienvenida, Notificaciones, Bloqueo
- Inicio y semana: Inicio, Hitos, Desglose, Acciones, Alertas, Aviso
- Comprobar y analizador: Comprobar, Analizador, Subida, Pasos
- Mi huella y borrado: Mi huella, Mi huella · flujo, Borrar mis datos
- Aprende: Aprende, Lección, Cómo se usa BeValk
- Ayuda y SOS: Ayuda, SOS, MarIA, Soporte técnico
- Perfil y Premium: Perfil, Perfil · flujo, Premium
- Familia: Mi Familia

### Secciones del Lab
- Columna A · navegación «Flujos del prototipo»: búsqueda, selector de plan, notas de plan fijado, cobertura por flujo.
- Columna B · ficha: portada («Empieza por aquí», «Cómo se usa») o flujo (historia `lab-us`, `lab-qm`,
  «Valor de producto», «Freemium y Premium», «Casos extremos», detalle del caso con pasos y disparador).
- Columna C · «Live preview» (simulador escalado), drawer en 900-1279 px, pestañas «Vistas del Lab» < 900 px.

### Hechos técnicos que condicionan el porte
- `Main.dc.html`: plantilla 13-4681, datos 4683-6714, clase `Component` 6715-10613.
- Runtime: React 18.3.1 (`createRoot`). `setState` de DCLogic es síncrono sobre `logic.state`.
  `componentDidUpdate` se llama con UN argumento: la rama `ps && ps.hu ...` (línea 7110) es código muerto y debe seguir siéndolo.
- Plantilla: ~2786 huecos (rutas simples), ~410 `sc-if`, 158 `sc-for`, 83 `style-hover`, ~131 `style-active`,
  texto interpolado en `<span class="sc-interp">`.
- Iconos: lucide **0.544.0** (blob JS del manifest), 103 nombres en plantilla más los que vienen de datos → `lucide-react@0.544.0`.
- Odin: la plantilla solo usa clases CSS (`odin-btn` ×93, `odin-card` ×85, `odin-spinner` ×1). `_ds_bundle.js` no se porta
  (comprobar antes de 2.3 si inyecta CSS global).
- Assets: 27 PNG + 1 JS en `assets-manifest.json`.
- `qa.js` y `sweep.js` cuentan warnings de consola: verificar siempre contra `preview`, nunca contra `dev`.

## Decisiones (26 oct 2026 · el usuario aprueba "la mejor recomendación")
1. **Pushes de `feat/port`:** permitidos (los Previews quedan tras Vercel Authentication), pero solo al cerrar cada gate, no por commit.
   **URL:** renombrar el proyecto `product-lab` → `bevalk-lab` en Fase 3 (conserva el enlace con GitHub); si el nombre está ocupado, parar.
2. **`window.__lab`:** activo siempre (prototipo con datos simulados), para que e2e funcione contra `preview` y producción.
3. **Baseline visual:** no se versiona (`tests/visual/baseline/` en `.gitignore`); se regenera desde `handoff/reference` en cada entorno y en CI.
4. **Lógica:** copia literal con `// @ts-nocheck`; `planWorld`, `labTrack` (núcleo puro), `scoreColor` y predicados tipados y con tests.

## Autorizaciones (26 oct 2026, 17:30 · el usuario: "prosigue automáticamente hasta finalizar todo el plan")
5. **`@types/react` y `@types/react-dom`:** aprobados como devDependencies; `tsc --noEmit` entra en el gate.
6. **Fase 3:** autorizada entera sin parar (renombrar a `bevalk-lab`, `vercel.json`, noindex, Previews por PR, CI `qa.yml`). Si el nombre está ocupado o algo falla, parar.
7. **Merge `feat/port` → `main`:** autorizado solo con el gate final completo en verde; después, verificación contra producción.
8. **Acceso:** mantener Vercel Authentication; antes de cerrar, confirmar qué URLs cubre.
9. **2.4:** informe por área al usuario sin esperar respuesta entre áreas.
10. **Guton:** se versiona en el repo público (decisión del usuario, 26 oct 2026); `.gitignore` ancla `/fonts/` a la raíz.
11. **Verificación de producción:** por equivalencia de artefactos (hashes de Vite en el log de Vercel = build limpio del repo = `dist`
    verificado en local y en CI), sin bypass de Vercel Authentication. El modo auto bloqueó crear el bypass y el usuario eligió esta vía.

## Estrategia de porte (blueprint de Fable, validado contra el código)
- **Plantilla → TSX por conversión mecánica**, no a mano: `tools/convert-template.mjs` parsea con Chromium (mismo parser que el runtime)
  y emite TSX con la misma semántica (truthiness de `sc-if`, keys por índice en `sc-for`, acceso tolerante a undefined, `sc-interp`,
  estilos en línea como objetos, `style-hover/active` → clases + CSS generado, `<i data-icon>` → `<Icon>`).
  Un archivo por pantalla y por sección del Lab. Regla: nunca editar la salida generada; regenerar debe dar `git diff` vacío.
- **Lógica:** copia literal de la clase a `src/logic/LabLogic.ts`; base `DCLogic` mínima; `paint()` desaparece.
- **Host:** componente de clase que replica el host del runtime (didUpdate con 1 argumento, re-render en cada `setState`, sin StrictMode).
- Versiones fijadas: `react@18.3.1`, `react-dom@18.3.1`, `lucide-react@0.544.0`.

## Fase 1 · Red de seguridad
Archivos: `package.json` + lock en raíz, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx` provisional,
`tests/visual/{capture,compare}.mjs`, `tests/e2e/*` (copia adaptada de `handoff/qa`), `tests/e2e/focus.js`, `tests/serve.mjs`.

| Tarea Codex | Entregable | Para si |
|---|---|---|
| 1.1 Scaffold | deps fijadas (solo las permitidas); scripts `dev build preview test e2e e2e:baseline invariants sweep a11y visual`; build sin avisos | necesita otra dependencia |
| 1.2 Captura visual | 7 anchos × escenas de la spec; `reducedMotion`, espera a anillo estable, sin toast, `fonts.ready`; registro de 404 | ref contra ref no da 0,00 % |
| 1.3 e2e adaptado + foco | `getC = window.__lab ?? fiberWalk()`, `LAB_URL` (por defecto `http://localhost:4173/`); `focus.js` compara la secuencia de tabulación | contra la referencia no da 62/62 |

**Gate F1:** ref contra ref 0,00 % en todas las capturas · e2e adaptado contra referencia 62/62 · 62/62 · 17 · 0 · 0 · build sin avisos.

**Resultado F1 (26 oct 2026, verificado por Claude con Chromium de Playwright 1.63) · PASS**
- `npm run build`: sin avisos. `npm test`: sin tests todavía (llegan en 2.1-2.2).
- Contra la referencia: e2e 62/62 · e2e:baseline 62/62 · invariants 17 PASS · sweep 0 · a11y 0 · focus idéntico (102 pasos, 100 elementos).
- Visual ref contra ref: 550 capturas (30 flujos × 2 planes + portada + 17 categorías de caso, × 7 anchos, + drawer + 3 pestañas), 112 MiB,
  pixelmatch 0,0000 % en las 550. 404: 78, todos de rutas `{{...}}`.
- Pendiente antes de portar la ficha (2.3): las capturas son de viewport; el contenido bajo el pliegue de cada panel con scroll
  propio no se compara. Añadir capturas por tramos de scroll de `.lab-scroll`.
- npm bloquea el `postinstall` de esbuild (allowScripts); el build funciona igual. Revisar en CI.

## Fase 2 · Porte por áreas (un commit por área)
| Tarea Codex | Entregable | Gate |
|---|---|---|
| 2.1 Datos | `src/data/*.ts` + `types.ts`; `/_blob/id` → `/assets/<nombre>`; `tools/copy-assets.mjs` desde el manifest | Vitest: datos idénticos a los del script original; `scoreColor` 0..100 igual a la referencia |
| 2.2 Motor | `LabLogic.ts`, `DCLogic.ts`, `Host.tsx`, props por defecto de `data-props`; tests de `planWorld`, `labTrack` (regla 5), predicados | 3 casos de qa ejecutados sin DOM alcanzan sus pasos |
| 2.3 Conversor + shell | `tools/convert-template.mjs`, `src/ui/**`, `src/styles/odin/**`, `lab.css`, mapa de iconos (error ruidoso si falta uno) | build sin avisos; cajas de `.lab`, `.lab-a/b/c`, `.tp-phone` ±1 px en los 7 anchos; e2e completo |
| 2.4 a-h Áreas del móvil | revisión estructural y visual por área; arreglos solo en el conversor | >0,5 % tras 2 iteraciones → `tasks/followups.md` y reporte |

**Resultado 2.1 + 2.2 (26 oct 2026, verificado por Claude) · PASS**
- `npm test` 118/118 (datos idénticos a la referencia evaluada en VM, puras, smoke de 3 casos con `reached` igual al original).
- `npm run build` sin avisos (chunk `react-vendor` separado). 27 PNG en `public/assets`, 0 rutas `/_blob/` en `src`, `public` y `dist`.
- Generadores idempotentes (`extract-data`, `extract-logic`, `copy-assets`): `git status` vacío tras regenerar.
- `LabLogic.ts` = clase original salvo: imports, `planWorld`/`labTrack` delegados en `pure.ts`, `paint`/`waitLucide` no-op, rutas de imagen.
  `planWorld` puro devuelve copia en vez de mutar; los 3 llamadores usan el valor devuelto (equivalente).
- Navegador (`vite preview`): `window.__lab` presente, 30 flujos, `prem-amitad`/Premium, anillo 81, 0 errores de consola.
- Pendiente: `tsc --noEmit` exige `@types/react` y `@types/react-dom` (decisión del usuario). 4 módulos de datos con `@ts-nocheck` (ver followups).

**Resultado 2.3 + 2.4 (26 oct 2026, verificado por Claude contra `vite preview`, baseline con Chromium de Playwright) · PASS**
- `tsc --noEmit` 0 errores (con `@types/react` 18.3.31 y `@types/react-dom` 18.3.7); `npm test` 118/118; build sin avisos
  (`chunkSizeWarningLimit` 1198 kB, bundle único con carga eager); 0 rutas `/_blob/` en `src`, `public`, `dist`.
- Conversor y `copy-odin` idempotentes: 58 archivos, 0 cambios en la segunda pasada; misma salida con Chrome local y Chromium de Playwright.
- e2e 62/62 · baseline 62/62 · invariants 17/0 · sweep 0 · a11y 0 · focus idéntico (102 pasos, 100 elementos) · cajas 35/35 a ±1 px.
- Visual: 1.470/1.470 capturas (incluye tramos bajo el pliegue), 0 píxeles distintos en todas; 0 404 en la app (74 en la referencia, todos `{{…}}`).
  Control negativo: dos capturas distintas del baseline → 125.039 px distintos (la comparación discrimina).
- 2.4 por áreas (`tests/visual/review-areas.mjs`, 375×812, 2 planes): 86/86 estados, 8/8 áreas, máximo 0,00 %. Sin arreglos necesarios.

Tras cada área: `npm run build`, e2e contra `npm run preview`, comparación visual; resumen y capturas que difieran al usuario.

**Gate F2 (criterios de aceptación de la spec):** build sin avisos · e2e 62/62 · baseline 62/62 · invariants 17 · sweep 0 · a11y 0 ·
visual ≤ 0,5 % por captura (pixelmatch 0.1) · 0 rutas `/_blob/` en `dist` · orden de foco idéntico · ningún 404 nuevo · unit tests verdes.

## Fase 3 · Vercel (solo tras OK)
`vercel.json` (vite, `npm run build`, `dist`, `X-Robots-Tag: noindex`), `<meta name="robots" content="noindex">`, nombre `bevalk-lab`,
Previews por PR y `main` → producción, protección de acceso según plan (decide el usuario), `.github/workflows/qa.yml` (build, e2e, visual sobre `vite preview` en ubuntu-latest),
comprobación final contra https://bevalk-lab.vercel.app/ (requiere quitar Vercel Authentication o usar bypass).

## Riesgos
1. Fidelidad plantilla → JSX (≈4.670 líneas): conversor con el parser de Chromium y gate estructural antes de comparar píxeles.
2. Estilos en línea: objeto React frente a `cssText`; verificar con diff de estilos computados.
3. Ciclo de vida y temporizadores: host de clase, mismo `setTimeout`, sin StrictMode; los `wait` fijos de qa dependen de ello.
4. Anillo con cuenta animada: capturar con `shown` estable.
5. Fuentes de Google en CI: requieren red; esperar a `document.fonts.ready`.
6. Iconos cuyo nombre viene de los datos: `Icon` falla ruidoso y el sweep lo detecta.
7. Los 404 de `{{ }}` desaparecen en el porte (permitido por la spec).
8. Vercel: cada push despliega; la URL de la spec exige renombrar o crear el proyecto `bevalk-lab`.

## Resultado Fase 3 (26 oct 2026, 21:35)
- CI `qa` run 40386492563 (head 0d4d8a6, ubuntu-latest): 17/17 pasos verdes; visual 1.470/1.470, 0 px distintos, 0 ausentes.
- PR #1 fusionada en `main` (merge 91efc25, `--match-head-commit 0d4d8a6`).
- Producción `bevalk-hq3lvkvv0` (alias https://bevalk-lab.vercel.app) construida desde 91efc25: mismos hashes que el build verificado
  (`index-9yMUh4ZO.js`, `index-CvLjGx0_.css`, `react-vendor-BdZgHC1P.js`, `Guton-SemiBold-CFvyU6pK.woff2`).
- Cobertura de Vercel Authentication, observada con curl:
  - Con  (Standard Protection),  respondía **200 público** (con noindex).
  - El usuario eligió proteger producción (21:40). Cambiado a  (All Deployments, disponible en Hobby sin coste
    según https://vercel.com/docs/deployment-protection).
  - Tras el cambio:  (página y assets), URL del despliegue,  y
     → 302 a .
