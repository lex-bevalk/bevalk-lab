# Codex G5 · Tier 5: limpieza, documentación y cierre (v2.0.0)

Rama `feat/proto-selector`, encima de G1-G4 verificados. No hagas commit ni push.

## Prohibido
Cambiar comportamiento de cualquiera de los dos prototipos. Paths de prototipo solo si es un borrado de la tabla (ninguno lo es).

## T0 Regresión: `npm run check-login-assets` falla (detectado en G4)
Causa: `src/current/styles/fonts/Guton-600.woff2` es byte a byte igual a `src/styles/odin/assets/fonts/Guton-SemiBold.woff2`
(md5 `f6901718…`); Vite deduplica y el CSS de `/login` acaba referenciando `Guton-600-<hash>.woff2`, fuera de la lista permitida.
Arreglo: `tools/current/extract-assets.mjs` nombra la Guton 600 como `Guton-SemiBold.woff2` (y `extract-styles.mjs` la referencia así),
regenera con `npm run extract:current` (idempotente), borra `Guton-600.woff2`. No toques `tools/check-login-assets.mjs`.
Gate: `npm run build && npm run check-login-assets` en verde; `e2e:current:parity` sigue 0 diferencias. Añade la lección a `tasks/lessons.md`.

## T1 Borrados (confirmados por Claude: sin referencias en tests, tools ni CI)
- `handoff/qa/`, `handoff/docs/`, `handoff/source/`, `handoff/PROMPT_CLAUDE_CODE.md`, `handoff/README.md`. Se mantiene
  `handoff/reference/` (la usan `focus.js`, `visual-full.yml` y los extractores de concept). Añade `handoff/README.md` nuevo de 3 líneas:
  «Referencia de solo lectura del porte original de Concept; el resto del handoff se retiró en v2.0.0 (ver git history)».
- `mi-familia-lab/` entero. `tests/unit/family-icons.test.ts`: quita la lectura de `mi-familia-lab/Lab.dc.html` y su recorte
  (`familyTemplate`); los iconos de familia ya están en `design/familia/Main.dc.html` y en `src/`. El control negativo se mantiene.
  `design/familia/README.md`: deja constancia en una línea de que `mi-familia-lab/` se retiró y sigue en el historial de git.
- `tests/visual/review-areas.mjs`, `tools/area-review.md`, `tools/STYLES_COMPARISON.md` (análisis de un solo uso del porte) y la
  línea de `.gitignore` que solo servía a `review-areas`.
- `tasks/codex-f*.md` → `tasks/archive/` con `git mv`; corrige las rutas en `tasks/todo.md` y `tasks/plan-equipo.md`.

## T2 Comprobación de que nada se rompe
`git grep` de cada ruta borrada fuera de `tasks/archive/` y de la historia en `tasks/todo.md` → 0 referencias vivas.
`npm run build`, `npx tsc --noEmit -p .`, `npm test`, `npm run check-login-assets`, `npm run check-middleware-esm`.

## T3 Documentación
- `CHANGELOG.md` y `src/team/changelog.ts` (lo que muestra `/changelog`, mismo formato que las entradas existentes): **2.0.0** con
  Current version como prototipo por defecto en `/`, Concept en `/concept`, selector de prototipo, comentarios separados por
  prototipo y guardia «solo un prototipo». `package.json` `version` → `2.0.0`. Ajusta el test de changelog si cuenta versiones.
- `tasks/todo.md`: sección «v2.0.0 · Dos prototipos» con decisiones 24-29 del usuario (29 oct 2026: «adelante con tus recomendaciones»):
  24 `/` = Current y `/concept` = Concept; 25 Current replica `design/current/current.html` con su shell y pills; 26 `/comments` muestra
  Current por defecto; 27 se borra `mi-familia-lab/` (revierte la 20); 28 independencia: «solo tocaremos current» ⇒ rama `current/*` o
  etiqueta `proto:current` y `npm run guard:proto -- current`; 29 cada prototipo tiene su propio conversor y extractores
  (`tools/convert-template.mjs` + `tools/extract-*.mjs` para Concept, `tools/current/*` para Current). Y una tabla corta
  «Cómo trabajar en un prototipo»: fuente, comando de regeneración, tests de paridad, rutas protegidas.
- `tasks/lessons.md`: las lecciones que hayas encontrado en G1-G4 que sean comprobables mecánicamente (máx. 4).

## Entrega
Lista de borrados con tamaño liberado, `git grep` limpio, resultados de T2. Para si algo de la tabla resulta referenciado.
