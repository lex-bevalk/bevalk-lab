# Codex · Fase 3 · Archivos de despliegue y CI

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/port` (no cambies de rama, no hagas commit ni push). Sin red.
Lee `handoff/PROMPT_CLAUDE_CODE.md` (Parte B, Fase 3) y `tasks/todo.md` (decisiones y autorizaciones).
IMPORTANTE: Claude está capturando contra `vite preview`, que sirve `dist/`. **No ejecutes nada que escriba en `dist/`**
(`npm run build`, `vite build` sin `--outDir`). Si necesitas compilar, usa `npx vite build --outDir <carpeta temporal fuera del repo>`.
No toques Vercel ni GitHub (ni CLI ni API): eso lo hace Claude. No añadas `--configLoader runner` a `package.json`.

## Tareas
1. `vercel.json` en la raíz: `framework` "vite", `buildCommand` "npm run build", `outputDirectory` "dist" y cabecera
   `X-Robots-Tag: noindex` para todas las rutas (`"source": "/(.*)"`). Incluye `"$schema": "https://openapi.vercel.sh/vercel.json"`. Nada más.
2. `index.html`: añade `<meta name="robots" content="noindex">` en `<head>`. No cambies nada más.
3. `.github/workflows/qa.yml`: en cada `pull_request` (y `workflow_dispatch`), `ubuntu-latest`, Node 24 (`actions/setup-node` con caché npm):
   - `npm ci`; `npx playwright install --with-deps chromium`.
   - `npx tsc --noEmit -p .`, `npm test`, `npm run build`.
   - Arranca en segundo plano `npm run preview` (4173) y `node handoff/reference/serve.js 8765`; espera a que ambos respondan (bucle con `curl`, timeout).
   - Con `LAB_URL=http://localhost:4173/`: `npm run e2e`, `npm run e2e:baseline`, `npm run invariants`, `npm run sweep`, `npm run a11y`, `npm run focus`.
   - `npm run visual:baseline` y después `npm run visual`.
   - Si algo falla, sube como artefacto `tests/visual/diff/` y `tests/e2e/results/` (`if: failure()`); si todo pasa, sube solo `tests/visual/diff/comparison-summary.json`.
   - `timeout-minutes` del job: 240. `concurrency` por PR con `cancel-in-progress: true`. Permisos mínimos (`contents: read`).
   - Nombre del job estable: `qa` (Claude lo pondrá como check obligatorio en la protección de `main`).
   - Comprueba que los scripts no dependen de Windows (rutas, `cmd`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`); si alguno lo hace, corrígelo en el script de test
     sin cambiar su comportamiento en Windows.
4. Revisa `tests/e2e/*.js` y `tests/visual/*.mjs`: los navegadores deben lanzarse en headless (en CI no hay pantalla). Corrige si no.

## Gate (pega los números)
- `vercel.json` es JSON válido; `npx tsc --noEmit -p .` 0 errores; `npm test` verde; `npx vite build --outDir <tmp>` sin avisos y el `index.html` resultante
  contiene la meta robots.
- `qa.yml` es YAML válido (parséalo con node si puedes; si no, revisión manual) y lista de pasos final.

## Para y reporta si
Algo de CI exige una dependencia nueva o cambiar aserciones de los tests.
