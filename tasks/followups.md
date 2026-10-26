# Follow-ups

## Fase 2.1–2.2

- [ ] `src/data/alerts.ts`, `family.ts`, `lab.ts` y `score.ts` conservan las declaraciones literales de la referencia bajo `// @ts-nocheck`. Sus callbacks contienen parámetros dinámicos sin anotación y, en `lab.ts`, callbacks de predicados con formas heterogéneas. La prueba Vitest evalúa las declaraciones generadas y compara los datos con `Main.dc.html`.
- [ ] El gate `npx tsc --noEmit -p .` queda pendiente de los tipos de React: no están instalados `@types/react` ni `@types/react-dom`, y la tarea prohíbe añadirlos. `Host.tsx` y `main.tsx` permanecen comprobables cuando esos tipos estén disponibles.

No detecté diferencias de datos ajenas a la sustitución autorizada de rutas ni comportamientos de referencia que requieran cambios fuera de la delegación a `pure.ts`.
