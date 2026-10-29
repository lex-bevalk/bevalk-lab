# Codex G8b · Regenerar Root en vez de los parches `!important`

Rama `feat/cohesion-tipografia`, encima de G8 sin commit. No hagas commit ni push.

Claude comprobó que `Root.tsx` no tiene deriva: `--only=root` con la plantilla de G8 solo cambia la tipografía que G8 ya puso en
`design/familia/Main.dc.html` (migas, botones de cabecera, summaries, entorno de prueba) y un salto de línea. Mi restricción a
`cover,flow,navigation` en G8 forzó las cuatro reglas `!important` con selectores estructurales en `<style>` de la plantilla
(línea ~52: `.lab-b > div:first-child > nav[aria-label="Ruta"]`, `... button`, `.lab-b details > summary`,
`.lab-b [role="radiogroup"] > span`). Además, varios estilos de Root de la plantilla no llegan al build porque Root no se regeneró.

1. Quita esas cuatro reglas de la plantilla; deja que las inline de la plantilla manden.
2. Regenera `--only=root,css` (servidor de referencia en :8765 con `design/familia/Main.dc.html`). Diff normalizado de `Root.tsx`
   contra `main`: solo cambios de tipografía.
3. Gates: `npx tsc --noEmit -p .`, `npm test`, `npm run build`, `e2e:proto-switch` (incluido el gate tipográfico y el de cambio sin
   blanco), `e2e:family-layout` 0 fallos, `e2e`, `invariants`, `a11y`, `focus` de Concept con `FOCUS_IGNORE_CONCEPT_NAV=1`, `e2e:review`.
   `screens/**`, `live-preview.tsx`, `drawer.tsx` idénticos a `main`.
Entrega: diff --stat y resultado de cada gate.
