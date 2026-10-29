# Codex · Fase 2.1 Datos + 2.2 Motor de estado

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/port` (no cambies de rama, no hagas commit ni push).
Lee antes: `handoff/PROMPT_CLAUDE_CODE.md` (Parte B), `tasks/todo.md` (decisiones y estrategia), `handoff/docs/ARQUITECTURA.md`.
Dependencias ya instaladas en la raíz; no hay red para npm. No añadas dependencias (tampoco jsdom ni `@types/*`).

Fuente de verdad: `handoff/reference/project/Main.dc.html`
- datos: líneas 4683-6714 (≈103 declaraciones top-level: `BASE` … `LAB_QA`, incluidas funciones como `pwScore`, `scoreColor`, `labTxt`, `FAM0`, `BR0`)
- clase `Component extends DCLogic`: 6715-10613
- runtime: `handoff/reference/project/support.js` (implementación real de `DCLogic`, del host que llama a la lógica y de `__setLogicState`)
`handoff/source/src/*` sirve para leer, pero manda `Main.dc.html`.

## Reglas duras
- `handoff/` solo lectura.
- Fidelidad ante todo: copia literal. No reformatees, no "mejores", no renombres. Si algo parece un error, anótalo en
  `tasks/followups.md` y replícalo.
- Las rutas `/_blob/<id>` pasan a `/assets/<suggestedName>` según `handoff/reference/assets-manifest.json` (único cambio permitido en los literales).
  El blob JS de lucide no se copia.
- Hechos ya verificados que debes respetar: `setState` de DCLogic fusiona de forma síncrona sobre `logic.state` y provoca re-render del host;
  el host llama `componentDidUpdate` con UN solo argumento (la rama `ps && ps.hu …` de la línea ~7110 debe seguir sin ejecutarse); React 18.3.1 sin StrictMode.

## 2.1 Datos
- `tools/extract-data.mjs`: genera `src/data/*.ts` a partir de las líneas de datos de `Main.dc.html` (no a mano), agrupando por dominio
  (p. ej. `scenarios`, `flows`, `lessons`, `alerts`, `maria`, `analyzer`, `huella`, `perfil`, `onboarding`, `family`, `score`, `lab`).
  Conserva orden y texto exacto; añade `export` y los `import` entre módulos que hagan falta.
  `src/data/types.ts` con los tipos principales (al menos: escenario, flujo, caso extremo según el contrato de `ARQUITECTURA.md`);
  aplica tipos con `satisfies` o anotaciones sin alterar los literales. Si tipar un módulo exige cambiar contenido, deja `// @ts-nocheck` en él y anótalo.
- `tools/copy-assets.mjs`: copia los 27 PNG de `handoff/reference/_blob/` a `public/assets/<suggestedName>`.
- Regenerar debe dar el mismo resultado (idempotente).
- Test Vitest `tests/unit/data.test.ts`: evalúa el bloque de datos original (con `node:vm`, aplicando la misma sustitución de rutas) y comprueba
  que cada constante exportada es idéntica (deep equal; funciones por `.toString()`).

## 2.2 Motor de estado
- `src/logic/DCLogic.ts`: base mínima que replica la semántica de `support.js` (lee la implementación real; replica lo que use la clase:
  `state`, `props`, `setState` síncrono + aviso al host, y lo que haga falta).
- `src/logic/LabLogic.ts`: la clase `Component` copiada literal con `// @ts-nocheck`, importando de `src/data`.
  `paint()`/`waitLucide` pasan a no-op (los iconos llegan en 2.3). Rutas `/_blob/` → `/assets/` igual que en datos.
- `src/logic/pure.ts`: `planWorld`, el núcleo puro de `labTrack` (regla 5: paso k solo si k−1 hecho, predicado visto falso (`armed`) y ahora verdadero),
  `scoreColor` y lo necesario para evaluar predicados de casos. La clase debe usar estas funciones (delegación) sin cambiar comportamiento.
- `src/props.ts`: props por defecto leídas de `data-props` de `Main.dc.html` (`escenario`, `nombre`, `miFamilia`, etc.).
- `src/Host.tsx`: componente de clase que replica el host del runtime: crea la lógica con las props, enlaza el re-render, llama
  `componentDidMount` y `componentDidUpdate(prevProps)` con un argumento, y por ahora renderiza un placeholder
  (la plantilla llega en 2.3). `window.__lab = logic` siempre (decisión del usuario). `src/main.tsx` monta `Host` sin StrictMode.
- Tests Vitest en `tests/unit/`:
  - `planWorld`: reglas 1-3 y 6 de ARQUITECTURA (alertsLeft 99/4, flujos fijados, plan familiar ⇒ Premium, `SCEN` no se muta).
  - `labTrack`: regla 5, incluido que ningún paso se marca al preparar el caso.
  - `scoreColor`: 0..100 idéntico a la función original evaluada desde `Main.dc.html`; tramos de `lessons.md`.
  - Smoke sin DOM: instancia `LabLogic` con stubs mínimos de `window`/`document` dentro del test (sin dependencias nuevas), con fake timers,
    y ejecuta los pasos `js` de 3 casos de `tests/e2e/qa.js` (`registro.c2`, `bienvenida.c2`, `tope.c2`); comprueba `reached` igual al de la referencia.

## Gate (pega los números)
- `npm test` verde; `npm run build` sin avisos; `npx tsc --noEmit -p .` sin errores en los archivos no marcados `@ts-nocheck` (si falla solo por
  falta de `@types/react`, dilo, no lo instales).
- `node tools/extract-data.mjs` y `node tools/copy-assets.mjs` dos veces seguidas: `git status` sin cambios en la segunda.
- `grep -r "/_blob/" src public` = 0.

## Para y reporta si
- necesitas una dependencia nueva;
- la igualdad de datos falla y no es por la sustitución de rutas;
- replicar el comportamiento exige cambiar la lógica más allá de delegar en `pure.ts`.

## Entregable
Archivos creados, números del gate, entradas de `tasks/followups.md`, desviaciones y dudas. Sin commits.
