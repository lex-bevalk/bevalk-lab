# Codex · Baseline propio del dropdown en CI

## Contexto
Rama `feat/select-dropdown` (PR #4 en borrador). Sin commit ni push, sin dependencias, no escribas en `dist/`, no ejecutes servidores ni la
batería (el equipo anda corto de memoria). El usuario aprobó las capturas del menú abierto como baseline propio. La CI corre en Linux y renderiza
distinto que Windows, así que el baseline se generará en CI y Claude lo versionará después.

## Problema
`tests/visual/compare.mjs` escribe siempre en `tests/visual/diff/` (diffs y `comparison-summary.json`). Si `visual:own` corre en CI después de
`npm run visual`, sobrescribe el resumen principal de 1.470 capturas que se sube como artefacto.

## Tareas
1. `tests/visual/compare.mjs`: tercer argumento opcional `diffDir` (relativo a la raíz); sin él, comportamiento idéntico al actual.
2. `tests/visual/own-capture.mjs`: pasa `tests/visual/own/diff` como `diffDir`. Captura determinista: antes de cada captura espera a que
   terminen las transiciones del menú y del chevron (p. ej. `page.emulateMedia({ reducedMotion: 'reduce' })` si las reglas lo respetan; si no,
   espera explícita a `getAnimations()` vacías o `transitionend`), y fuentes cargadas (`document.fonts.ready`). Si no existe el baseline, sale
   con 0 e imprime que la comparación se omitió (como ahora).
3. `.gitignore`: añade `tests/visual/own/diff/`.
4. `.github/workflows/qa.yml`: tras "Visual comparison", paso `- name: Own visual (dropdowns)` con `if: steps.changes.outputs.code == 'true'` y
   `run: npm run visual:own`. Después, paso de subida `actions/upload-artifact@v4` con nombre `qa-own-visual`, `if: always() &&
   steps.changes.outputs.code == 'true'`, `if-no-files-found: ignore` y rutas `tests/visual/own/current/` y `tests/visual/own/diff/`.
   No cambies nada más del workflow.

## Gate
`npx tsc --noEmit -p .` 0; `npm test` verde; `node --check` de los dos `.mjs`. Entregable: diff resumido.
