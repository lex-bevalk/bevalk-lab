# Codex · Mantenimiento tras el porte

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `chore/mantenimiento` (no cambies de rama, no hagas commit ni push). Sin red.
El porte está en producción y verificado (paridad visual 1.470/1.470 con 0 px). Nada de esta tarea puede cambiar el runtime.
No escribas en `dist/`: si compilas, usa `npx vite build --outDir <carpeta temporal fuera del repo>`. No toques Vercel ni GitHub.
No añadas `--configLoader runner` a `package.json`. Sin dependencias nuevas (tampoco actions de terceros nuevas).

## Tarea 1 · CI: PRs de solo documentación sin batería pesada (`.github/workflows/qa.yml`)
El check `qa` es obligatorio en `main`, así que el job debe ejecutarse SIEMPRE y terminar en verde; no uses `paths`/`paths-ignore`.
- `actions/checkout` con `fetch-depth: 0`.
- Paso `changes` (bash) justo tras el checkout: en `pull_request`, lista
  `git diff --name-only "origin/${{ github.base_ref }}...HEAD"`; si TODOS los archivos casan con `^tasks/` o `\.md$`, output `code=false`;
  en cualquier otro caso (incluido `workflow_dispatch`, lista vacía o error de git) `code=true`. Imprime la lista y la decisión.
- Todos los pasos desde "Set up Node.js 24" hasta "Visual comparison" y la subida del resumen: `if: steps.changes.outputs.code == 'true'`
  (el resumen: `success() && ...`). "Upload failure diagnostics" sigue con `failure()`.
- Prueba la lógica del filtro en local con un script de bash extrayendo la función o replicándola: casos solo `tasks/x.md`; `README.md`;
  `tasks/a.md` + `src/x.ts`; `.github/workflows/qa.yml`; lista vacía. Pega la salida.

## Tarea 2 · Quitar `@ts-nocheck` de `src/data/{alerts,family,lab,score}.ts`
Se generan con `tools/extract-data.mjs` (`noCheckDomains`, línea ~106). Sin `@ts-nocheck`, `tsc` da ~90 errores: TS7006 (parámetros
implícitos), TS6133 (45 parámetros sin usar en predicados de `lab.ts`) y algunos TS2554/2349/2362/2363/2365/7053 en `score.ts`/`lab.ts`.
- Arréglalo en el extractor (la salida es generada; nunca se edita a mano). Puedes añadir anotaciones de tipo, `satisfies` o tipos en
  `src/data/types.ts`. NO cambies los literales de la referencia (valores, textos, orden, cuerpos de funciones) más allá de lo que el
  compilador elimina (anotaciones de tipo). No desactives `noUnusedLocals`/`noUnusedParameters`/`strict`; no uses `@ts-ignore`/`@ts-expect-error`.
  Para parámetros sin usar que la referencia nombra, el prefijo `_` NO vale (cambia el literal).
- Si un archivo no puede quedar limpio sin cambiar literales o desactivar comprobaciones, déjalo con `@ts-nocheck` y explica por qué
  (errores concretos). Un resultado parcial es aceptable; uno que cambie el runtime no.

## Gate (pega los números)
- `npx tsc --noEmit -p .` 0 errores; `npm test` verde (incluido `tests/unit/data.test.ts` sin cambiar sus aserciones).
- `node tools/extract-data.mjs` dos veces: la segunda no cambia nada.
- `npx vite build --outDir <tmp>`: sin avisos y **mismos nombres de archivo** que producción:
  `index-9yMUh4ZO.js`, `index-CvLjGx0_.css`, `react-vendor-BdZgHC1P.js`, `Guton-SemiBold-CFvyU6pK.woff2`.
  Si `index-*.js` cambia de hash, para y reporta el diff del JS (el runtime habría cambiado).
- `qa.yml` YAML válido (parséalo con node si puedes) y salida de la prueba del filtro.

## Para y reporta si
Hace falta una dependencia nueva, cambiar aserciones de tests o el hash del bundle cambia.
