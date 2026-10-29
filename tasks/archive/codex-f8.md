# Codex · Contraste del botón "Eliminar cuenta"

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `fix/contraste-eliminar` (desde `feat/select-dropdown`). No cambies de rama, no hagas commit ni
push. Sin red ni dependencias. No escribas en `dist/` (compila con `npx vite build --outDir <tmp fuera del repo>`). No ejecutes servidores ni
la batería e2e/visual: Claude la corre. Seguimiento en `tasks/followups.md` (sección "Selectores → dropdown").

## Problema (verificado por Claude)
El pie del flujo de Perfil pinta el botón primario destructivo con un color fijo de la referencia: `handoff/reference/project/Main.dc.html:9769`
`primaryBg: footer && footer.danger ? "#EF4444" : "var(--color-primary)"` (en `src/logic/LabLogic.ts` ~3027). Texto blanco sobre #EF4444 da
3,76:1 (WCAG AA pide 4,5:1). El token de Odin `--color-destructive` ya vale `#DC2626` (4,83:1). Decisión aprobada por el usuario: usar el token.

## Tareas
1. `tools/extract-logic.mjs`: nueva divergencia declarada con `replaceExactOnce` (igual que la de F5, con comentario de una línea "Divergencia
   F8: …") que cambia `"#EF4444"` por `"var(--color-destructive)"` en esa expresión (usa como aguja la expresión completa, no solo el color).
   Regenera `src/logic/LabLogic.ts` con el generador (nunca a mano) y comprueba que el diff de `LabLogic.ts` es solo esa línea.
2. `tests/e2e/select.js`: en el caso `prdel`, añade una comprobación de contraste del botón primario del pie ("Eliminar cuenta") con axe
   (`runOnly: ['color-contrast']` incluyendo solo ese botón) y falla si hay violaciones. Mantén el resto del test igual.
3. `tasks/followups.md`: marca el punto del contraste como resuelto con fecha (27 oct) y una línea de qué se hizo.
4. `CHANGELOG.md`: bajo `## [Unreleased]` añade `### Fixed` con "- El botón \"Eliminar cuenta\" usa el rojo de Odin y cumple el contraste AA."

## Gate (pega los números)
- `node tools/extract-logic.mjs` dos veces: la segunda no cambia nada. `git diff --stat src/logic` = 1 línea.
- `npx tsc --noEmit -p .` 0; `npm test` verde; build temporal sin avisos.
- `node -e` o similar: no queda `#EF4444` en `src/logic/LabLogic.ts`.

## Para y reporta si
La aguja no aparece exactamente una vez, el diff de `LabLogic.ts` toca más de una línea o hace falta otra dependencia.

## Entregable
Archivos, números del gate y dudas. Sin commits.
