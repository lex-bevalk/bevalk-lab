# Codex · Fase 1 · Red de seguridad

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/port` (ya creada; no cambies de rama, no hagas commit ni push).
Windows 11 + PowerShell. Spec vinculante: `handoff/PROMPT_CLAUDE_CODE.md` (Parte B) y plan `tasks/todo.md`.
Lee ambos antes de empezar. La referencia está servida en http://127.0.0.1:8765/project/Main.dc.html
(si no responde: `node handoff/reference/serve.js 8765` en segundo plano).

## Reglas duras
- `handoff/` es de solo lectura. No lo modifiques. Si instalas en `handoff/qa`, usa `npm install --no-package-lock`.
- Scripts npm multiplataforma: nada de bash, `rm`, `cp`, `&&` dependiente de shell, ni `python3`. Usa node.
- Dependencias permitidas, versiones exactas (sin `^`):
  - `react@18.3.1`, `react-dom@18.3.1`, `lucide-react@0.544.0`
  - dev: `vite`, `typescript`, `@vitejs/plugin-react`, `vitest`, `playwright@1.63.0`, `axe-core@4.10.2`, `pixelmatch`, `pngjs`
  - Cualquier otra (incluidos `@types/*`): NO la instales; anótala en tu informe con la razón.
- No toques nada de Vercel. No crees `vercel.json`.

## Tareas
### 1.1 Scaffold
- `package.json` en la raíz (con `package-lock.json`), `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`
  provisional (render mínimo, sin diseño). `npm run build` debe terminar sin avisos.
- Scripts: `dev`, `build`, `preview` (`vite preview --port 4173 --strictPort`), `test` (`vitest run`), `e2e`, `e2e:baseline`,
  `invariants`, `sweep`, `a11y`, `focus`, `visual:baseline`, `visual`.
- Añade a `.gitignore`: `tests/visual/baseline/`, `tests/visual/current/`, `tests/visual/diff/`, `tests/e2e/results/`.

### 1.2 Captura y comparación visual (`tests/visual/`)
- `capture.mjs <url> <outDir>`: Playwright Chromium, viewports 1920×1080, 1680×916, 1440×900, 1280×800, 1024×768, 768×1024, 375×812.
- Escenas (spec, Fase 1.1): portada; ficha de los 30 flujos en Freemium y en Premium; un caso activo por grupo de casos
  (deduce los grupos de los datos `LAB`/casos en `handoff/source/src/lab-data.js`); drawer abierto a 1024; las tres pestañas a 375.
  Lleva el estado con la lógica (`window.__lab` si existe, si no el recorrido de fibra de React que usa `handoff/qa/qa.js`).
- Determinismo: `reducedMotion: 'reduce'`, CSS que anula animaciones/transiciones, esperar a `document.fonts.ready`,
  a que la cuenta del anillo termine (`state.shown` estable igual a su valor final), sin toast visible, y un margen fijo.
- Registra en un JSON por ejecución las respuestas 404 (separando las de rutas `{{ ... }}`).
- `compare.mjs <baselineDir> <currentDir>`: pixelmatch umbral 0.1; % de píxeles distintos por captura; PNG de diff en
  `tests/visual/diff/`; tabla resumen; código de salida ≠ 0 si alguna captura supera 0,5 % o falta.
- `visual:baseline` captura la referencia en `tests/visual/baseline`; `visual` captura `LAB_URL` (por defecto
  `http://localhost:4173/`) en `tests/visual/current` y compara.

### 1.3 e2e adaptado (`tests/e2e/`)
- Copia `handoff/qa/{qa,inv,sweep,axe,run}.js` a `tests/e2e/`. Cambia solo:
  - `getC`: usar `window.__lab` si existe; si no, el recorrido de fibra original (así funciona contra la referencia y la app).
  - URL: `process.env.LAB_URL || 'http://localhost:4173/'`.
  - Rutas de resultados a `tests/e2e/results/`.
  Las aserciones, SPEC y criterios no cambian.
- `focus.js`: recorre con Tab (N pasos suficientes para cubrir el Lab) en `REF_URL` (por defecto la referencia en 8765) y en
  `LAB_URL`, registra la secuencia (tag, aria-label o texto recortado) y falla si difieren.

## Gate (ejecútalo y pega los números en tu informe)
1. `npm run build` sin avisos.
2. Contra la referencia (`LAB_URL=http://127.0.0.1:8765/project/Main.dc.html`): `e2e` 62/62, `e2e:baseline` 62/62,
   `invariants` 17 PASS, `sweep` TOTAL ERRORS 0, `a11y` 0 violaciones, `focus` ref contra ref idéntico.
3. Determinismo visual: captura la referencia dos veces en carpetas distintas y compara: 0,00 % en todas las capturas.
   Indica cuántas capturas salen y su tamaño total.

## Para y reporta si
- necesitas una dependencia no permitida;
- ref contra ref no da 0,00 % tras ajustar esperas (explica qué varía);
- la batería adaptada no da 62/62 contra la referencia.

## Entregable
Archivos creados, números del gate, desviaciones y dudas. Sin commits.
