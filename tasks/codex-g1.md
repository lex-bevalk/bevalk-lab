# Codex G1 · Tier 1: dos prototipos en un Lab (estructura, selector, guardia)

Rama `feat/proto-selector` (ya creada desde `main`). No hagas commit ni push: Claude revisa y hace commit.
Contexto: el Lab tendrá dos prototipos independientes. **Current** (nuevo, por defecto, se porta en G2-G3 desde
`current/current.html`) y **Concept** (el Lab actual de `main`, v1.6.0). Decisión del usuario: `/` = Current, `/concept` = Concept.
Este tier deja la estructura lista; Current todavía es un marcador de posición.

## Prohibido
- Editar `src/ui/generated/**`, `src/logic/**`, `src/data/**`, `src/styles/**`, `src/Host.tsx`, `src/props.ts`, `design/**`
  (concept debe quedar byte a byte igual salvo los renombres de T1). Sin dependencias nuevas.

## T1 Entradas HTML y rutas
- `git mv index.html concept.html` y `git mv review.html concept-review.html` (contenido igual salvo T3: `#proto-root` y
  `<html lang="es" data-proto="concept">`).
- Nuevos `index.html` y `review.html` (Current): `<html lang="es" data-proto="current">`, título
  `BeValk Product Experience Lab · Current version`, noindex, `#proto-root` y un `<main>` mínimo con «Current version · en
  preparación» (se sustituye en G3). `review.html` además monta `src/review/main.tsx` como hoy.
- `vite.config.ts`: entradas `index`, `review`, `concept`, `conceptReview`, `login`, `team`.
- `vercel.json`: rewrites `/concept` → `/concept.html`, `/concept/review` → `/concept-review.html` (mantener las actuales).
- `server/passwall.ts`: comprobar con un test que `/concept`, `/concept/review`, `/concept.html`, `/concept-review.html` y
  `/review.html` sin sesión redirigen a login (`classifyRequest`) y que `safeNextPath` conserva `/concept/review?flow=x`.

## T2 Batería de concept apunta a concept
Toda prueba que hoy carga `/` o `/review.html` prueba concept: el valor por defecto pasa a `http://localhost:4173/concept.html`
y `${baseUrl}/concept-review.html` (`tests/e2e/{axe,family-layout,focus,inv,qa,run,select,sweep,review}.js`,
`tests/visual/{own-capture,visual,smoke,smoke-negative}.mjs`, `tools/compare-geometry.mjs`, `qa.yml`, `visual-full.yml`,
incluidos los `wait_for_url`). `tools/check-login-assets.mjs`: la comprobación de aislamiento de JS que hoy hace sobre
`index.html` se aplica a `index.html` y `concept.html`.
- `tests/visual/smoke.mjs` compara rama contra base: la base (`main`) sirve concept en `/` y la rama en `/concept.html`.
  Resolver la ruta de concept por lado (si el `dist` tiene `concept.html`, usarla; si no, `/`). Que el humo siga dando 0 diferencias
  salvo el selector (ver T3).
- `focus.js` compara la secuencia de tabulación con `handoff/reference`: excluir los elementos dentro de `#proto-root`
  (la referencia no tiene selector); documentarlo en un comentario de una línea.

## T3 Selector de prototipo (compartido)
`src/proto-switch/{main.tsx,ProtoSwitch.tsx,proto-switch.css}`, montado en `#proto-root` de las cuatro entradas.
- Prototipo activo: `document.documentElement.dataset.proto`; página review si `location.pathname` empieza por `/review`,
  `/concept/review` o termina en `-review.html`/`/review.html`.
- `<nav aria-label="Prototipo">` con dos enlaces: «Current version» (`/` o `/review`) y «Concept» (`/concept` o `/concept/review`),
  `aria-current="page"` en el activo. Rutas limpias (en `vite preview` local no resuelven `/concept`; las pruebas comprueban `href`).
- Visual: control segmentado flotante, fijo abajo a la izquierda (16 px), alto 40 px, objetivos táctiles ≥ 32 px, superficie blanca,
  borde `#E3DFEC`, sombra suave, activo en `#4900AC` con texto blanco (contraste AA), `:focus-visible` con anillo de 2 px,
  `font: 600 13px/1 Manrope, system-ui, sans-serif`. CSS solo con clases `.proto-switch*` y valores literales (no depende de los
  tokens de Odin de ningún prototipo). `z-index: 2147483000` por debajo de los modales de review (ver abajo).
- `src/review/review.css`: cuando existe el selector, `.review-toggle` no se solapa con él a 375, 900 y 1440 px (súbelo por encima).
  Las capas modales de review siguen por encima del selector.
- Prueba e2e nueva `tests/e2e/proto-switch.js` (`npm run e2e:proto-switch`, añadir a `qa.yml` tras `e2e:review`): en
  `/concept.html` y `/concept-review.html` hay 2 enlaces con los `href` correctos, «Concept» con `aria-current="page"`; en `/` y
  `/review.html`, «Current version»; las cajas del selector y de `.review-toggle` no intersectan a 375, 900 y 1440; axe sin
  violaciones sobre `#proto-root`. Control negativo documentado (p. ej. cambiar un `href` hace fallar la prueba).

## T4 Puente de review por prototipo
`src/review/bridges.ts` exporta `labBridge(): Bridge | undefined` según `data-proto`:
`interface Bridge { proto: 'concept' | 'current'; current(): { flow: string | null; plan: string | null }; select(flowId: string, plan?: 'free' | 'premium'): boolean }`.
- concept: exactamente la lógica actual de `Review.tsx` (`state.flow`, `world().plan || labPlan || simPlan`, `labFlows().find` + `labSelect`).
- current (API de `current/current.html`, l. 9169-9214): flow `state.lab.cur`, plan `world().plan === 'premium' ? 'premium' : 'free'`,
  select: si existe el id en `labAllFlows?.()` o, si no hay lista, intenta `labOpen(flowId)`; con plan, `labPlan(plan)`. Devuelve `false`
  si `window.__lab` no está.
- `Review.tsx` usa solo el puente (sin cambios de comportamiento en concept: `e2e:review` igual). Test unitario del puente con
  objetos falsos para los dos prototipos.

## T5 Guardia «solo un prototipo»
- `tools/proto-paths.json`: `concept`: `concept.html`, `concept-review.html`, `src/Host.tsx`, `src/main.tsx`, `src/props.ts`,
  `src/vite-env.d.ts`, `src/logic/**`, `src/data/**`, `src/ui/**`, `src/styles/**`, `design/familia/**`, `public/assets/*` (solo
  primer nivel); `current`: `index.html`, `review.html`, `src/current/**`, `design/current/**`, `public/assets/current/**`.
- `tools/check-proto-guard.mjs <proto> [--base <ref>]`: lista `git diff --name-only <base>...HEAD` (por defecto `origin/main`, o
  archivos por stdin) y falla con la lista si se toca algún path del otro prototipo. `npm run guard:proto -- current`.
- `qa.yml`: paso «Prototype guard» tras «Detect code changes»: si la rama empieza por `current/` o la PR tiene la etiqueta
  `proto:current` → `guard:proto current`; `concept/` o `proto:concept` → `guard:proto concept`; si no, se salta. Añadir
  `src/current/**`, `src/proto-switch/**`, `concept.html`, `concept-review.html`, `review.html` a la detección `ui=true`.
- `tests/unit/proto-isolation.test.ts`: ningún archivo de `src/current/**` importa (ruta relativa resuelta) de rutas de concept de
  `proto-paths.json`, ni al revés. `tests/unit/proto-guard.test.ts` para el comprobador (casos de fallo y de paso).

## T6 Fuente de Current
`git mv`no aplica (no está versionado): mover `current/current.html` a `design/current/current.html` y borrar `current/`.
`design/current/README.md` (3-5 líneas): origen, que es solo lectura, y que la copia de trabajo y las regeneraciones llegan en G2.

## Entrega y paradas
Ejecuta y reporta números: `npx tsc --noEmit -p .`, `npm test`, `npm run build` (sin avisos), `npm run check-login-assets`,
`npm run check-middleware-esm`, y contra `npm run preview`: `e2e`, `invariants`, `sweep`, `a11y`, `focus`, `e2e:select`,
`e2e:family-layout`, `e2e:review` (si necesita servidor/DB, explica cómo lo corriste), `e2e:proto-switch`, `visual:smoke`
contra base `main`. `guard:proto current` y `guard:proto concept` sobre la rama (lo esperado: este tier toca los dos y ambos fallan;
documéntalo). Para si: algún gate de concept cambia de resultado salvo por el selector, necesitas tocar un path prohibido o una dependencia.
