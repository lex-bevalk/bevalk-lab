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

## Decisiones pendientes del usuario (antes de Fase 1)
1. **Vercel y pushes de `feat/port`:** cada push crea un Preview. ¿Se permite, o se pausa el proyecto hasta Fase 3?
   Además: ¿renombrar `product-lab` → `bevalk-lab` o crear un proyecto nuevo? (Fase 3, pero condiciona la URL).
2. **`window.__lab`:** la spec lo pide solo en desarrollo, pero exige e2e contra `preview` y producción, que son builds de producción.
   Propuesta: activo siempre (prototipo con datos simulados) o tras un flag de build de prueba.
3. **Baseline visual:** ~490 PNG (≈150 MB) en git. Propuesta: no versionar y regenerar desde `handoff/reference` en cada entorno (CI incluido). Alternativa: Git LFS.
4. **Tipado de la lógica:** copia literal con `// @ts-nocheck` y solo `planWorld`, `labTrack` (núcleo puro), `scoreColor`
   y predicados tipados y testeados (fidelidad primero) frente a tipado completo (más tiempo, más riesgo de deriva).

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

## Fase 2 · Porte por áreas (un commit por área)
| Tarea Codex | Entregable | Gate |
|---|---|---|
| 2.1 Datos | `src/data/*.ts` + `types.ts`; `/_blob/id` → `/assets/<nombre>`; `tools/copy-assets.mjs` desde el manifest | Vitest: datos idénticos a los del script original; `scoreColor` 0..100 igual a la referencia |
| 2.2 Motor | `LabLogic.ts`, `DCLogic.ts`, `Host.tsx`, props por defecto de `data-props`; tests de `planWorld`, `labTrack` (regla 5), predicados | 3 casos de qa ejecutados sin DOM alcanzan sus pasos |
| 2.3 Conversor + shell | `tools/convert-template.mjs`, `src/ui/**`, `src/styles/odin/**`, `lab.css`, mapa de iconos (error ruidoso si falta uno) | build sin avisos; cajas de `.lab`, `.lab-a/b/c`, `.tp-phone` ±1 px en los 7 anchos; e2e completo |
| 2.4 a-h Áreas del móvil | revisión estructural y visual por área; arreglos solo en el conversor | >0,5 % tras 2 iteraciones → `tasks/followups.md` y reporte |

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
