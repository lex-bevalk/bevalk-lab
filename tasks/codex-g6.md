# Codex G6 · Mismo ancho de columnas y selector de prototipo dentro del nav

Rama `feat/proto-layout` (desde `main` con v2.0.0). No hagas commit ni push. El usuario autoriza tocar los dos prototipos en esta tarea.

## Petición del usuario
1. «Las 3 columnas deberían mantener el mismo ancho al cambiar entre versiones, siempre.»
2. «El switcher de versiones lo pondría debajo del título "BeValk Lab · xx flujos · xx grupos" o encima.» Decisión de Claude: **debajo**
   del bloque título + subtítulo, a todo el ancho del nav, antes del siguiente control (Current: buscador; Concept: «Modalidad simulada»).

## T1 Geometría: Concept adopta la de Current
Current es la referencia y no cambia: `.lab` padding 16; `.lab-grid` `grid-template-columns:300px minmax(0,1fr) 470px; gap:16px`;
`@media (max-width:1180px)` → `280px minmax(0,1fr)`; `@media (max-width:760px)` → una columna (`design/current/current.html`,
`src/current/styles/lab.css`). Su `tests/e2e/current/geometry.js` debe seguir a ±1 px contra el original.
En `src/styles/main.css` (Concept):
- `.lab`: `padding:16px; gap:16px; grid-template-columns:300px minmax(0,1fr) 470px` (comentario de una línea: «geometría de Current,
  design/current/current.html»). Mira también la altura: el `.lab-grid` de Current mide `calc(100vh - 32px)`; si las alturas de las
  columnas difieren entre prototipos, iguálalas en Concept sin romper su scroll interno.
- Punto de corte compacto `1279px` → `1180px`, y su pista de dos columnas → `280px minmax(0,1fr)` (gap/padding 16). El resto del modo
  compacto (drawer del preview, `.lab-only-compact`) se mantiene igual con el nuevo punto de corte. Busca otros usos de 1279/1280 en
  concept (CSS, JS, tests) y alinéalos. `@media (max-width:899px)` (pestañas) no se toca.

## T2 Selector dentro del nav, generado por los conversores
- `src/proto-switch/ProtoSwitch.tsx` se renderiza dentro del árbol de React de cada prototipo. Inyección en el conversor de cada
  prototipo (`tools/convert-template.mjs` para Concept, `tools/current/convert-template.mjs` para Current): tras el bloque de cabecera
  que contiene el subtítulo «N flujos · M grupos», emitir `<ProtoSwitch />` y su import. Anclaje explícito con error ruidoso si no se
  encuentra; idempotente (segunda pasada = 0 cambios). Regenera con `npm run convert-template` y `npm run convert:current`. No edites a
  mano `src/**/generated/**`.
- Aspecto: control segmentado a todo el ancho, mismo idioma visual que el toggle Freemium/Premium de cada prototipo (fondo neutro,
  segmento activo marcado), altura 36-40 px, tokens Odin (`var(--…)`) en vez de hex sueltos donde existan. Conserva
  `nav[aria-label="Prototipo"]`, enlaces `<a>` con `aria-current="page"`, foco visible, objetivo táctil >= 24 px.
- Borra: `#proto-root` y el script `src/proto-switch/main.tsx` de `index.html`, `review.html`, `concept.html`, `concept-review.html`;
  `src/proto-switch/main.tsx`; `position:fixed`/`z-index`; las dos reglas de `padding-bottom:56px`. El CSS del selector se importa desde
  `ProtoSwitch.tsx`. Revisa `vite.config.ts` y `tools/proto-paths.json` (shared) por si referencian lo borrado.

## T3 Tests
- Ajusta: `tests/e2e/proto-switch.js` (ya no hay `#proto-root`; el selector está dentro del nav), `tests/e2e/focus.js` (excluir
  `.proto-switch` en vez de `#proto-root`), `tests/e2e/current/geometry.js` (línea 47), `tests/e2e/current/parity.js` (texto del nav y
  conteo de botones/enlaces excluyen `.proto-switch`), y cualquier test de Concept que cuente enlaces/botones del nav o espere 1279.
  `tests/unit/proto-isolation.test.ts` si afirma algo de `#proto-root`.
- Nuevo gate de la petición (en `tests/e2e/proto-switch.js` o archivo nuevo enlazado en `qa.yml`): `vite preview`, cargar `/` y
  `/concept.html` a 1440×900, 1200×900 y 1000×900; `getBoundingClientRect()` de nav, centro y preview (`nav.lab-col`, `main.lab-col`,
  `aside.lab-pv` en Current; `.lab-a`, `.lab-b`, `.lab-c` en Concept): `x` y `width` iguales a ±1 px entre prototipos (a 1000 px, solo
  nav y centro; el preview de Concept es drawer). Además: el selector está dentro del nav, debajo del subtítulo, visible sin scroll,
  y no tapa ningún flujo.
- Unitario barato: lee columnas/gap/padding de `.lab` en `src/styles/main.css` y el `style` de `.lab-grid`/`.lab` en
  `design/current/current.html` y afirma que coinciden.

## Gates
`npx tsc --noEmit -p .`, `npm test`, `npm run build` sin avisos, `check-login-assets`, `check-middleware-esm`, idempotencia de los dos
conversores, `e2e:current:parity` 0 diferencias, `e2e:current:geometry`, focus de Current y de Concept, `e2e:proto-switch` (con el gate
nuevo), `e2e:review`, la batería e2e de Concept (baseline, invariants, sweep, a11y, select, family-layout). `visual:smoke` contra `main`
**cambiará** en Concept por diseño: reporta el resumen, no lo trates como fallo.

## Paradas
Para y reporta si: la paridad de Current no vuelve a 0, un anclaje de conversor es ambiguo, o igualar la altura rompe el scroll de Concept.
Entrega: diff --stat, medidas del gate nuevo (tabla x/width por viewport), resultados de cada gate.
