# Codex · Fase 2.3 · Correcciones de revisión

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/port` (no cambies de rama, no hagas commit ni push). Sin red.
Claude ya instaló `@types/react@18.3.31` y `@types/react-dom@18.3.7` y quitó `--configLoader runner` de `package.json`
(no lo vuelvas a añadir: si tu sandbox lo necesita, pásalo solo en tu línea de comandos).

## Tareas
1. `npx tsc --noEmit -p .` da 28 errores TS6133: `'variant'` sin usar en los 28 `src/ui/generated/screens/*.tsx` e `'Icon'` sin usar en
   `src/ui/generated/drawer.tsx`. Arréglalo en `tools/convert-template.mjs` (no en la salida generada): emite solo los parámetros e imports usados.
   No desactives `noUnusedLocals`/`noUnusedParameters` ni añadas `@ts-nocheck` a los generados.
2. `vite.config.ts`: sustituye el `manualChunks` con buckets por hash por algo simple y legible. Todo se carga de forma eager, así que
   trocear por hash no aporta nada salvo esquivar el aviso de tamaño. Deja `react-vendor` como estaba antes
   (`manualChunks: { 'react-vendor': ['react', 'react-dom'] }`) y fija `chunkSizeWarningLimit` justo por encima del chunk mayor resultante
   con un comentario de una línea (prototipo de una página, carga eager). Conserva el `external` de `app-background.png`.

## Gate (pega los números)
- `npx tsc --noEmit -p .` 0 errores; `npm run build` sin avisos; `npm test` verde.
- `node tools/convert-template.mjs` dos veces: la segunda no cambia nada.
- No ejecutes la batería e2e ni visual: la corre Claude.

## Para y reporta si
Arreglar los tipos exige cambiar semántica del conversor o tocar `src/logic`/`src/data`.
