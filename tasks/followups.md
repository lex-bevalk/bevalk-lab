# Follow-ups

## Fase 2.1–2.2

- [ ] `src/data/alerts.ts`, `family.ts`, `lab.ts` y `score.ts` conservan las declaraciones literales de la referencia bajo `// @ts-nocheck`. Sus callbacks contienen parámetros dinámicos sin anotación y, en `lab.ts`, callbacks de predicados con formas heterogéneas. La prueba Vitest evalúa las declaraciones generadas y compara los datos con `Main.dc.html`.
- [x] `@types/react` 18.3.31 y `@types/react-dom` 18.3.7 instalados por Claude (aprobados por el usuario); `tsc --noEmit -p .` da 0 errores tras quitar del conversor los parámetros e imports sin usar.

No detecté diferencias de datos ajenas a la sustitución autorizada de rutas ni comportamientos de referencia que requieran cambios fuera de la delegación a `pure.ts`.

## Fase 2.3

- [ ] `handoff/reference/project/ds/odin/tokens/brand.css` referencia `../assets/brand/app-background.png`, pero ese archivo no existe en el material de referencia. Se conserva la URL relativa original; el build la deja externa para que no falle intentando copiar un asset ausente. Si se recibe el asset de marca, añadirlo en su ruta original y quitar la excepción de `vite.config.ts`.
- [x] El baseline de referencia registró 79 respuestas 404 de imágenes con rutas literales `{{…}}`; el porte no hace esas solicitudes. En 2.4 se confirma que son peticiones inválidas causadas por valores de plantilla sin resolver en la referencia: no entregan imágenes ni afectan el render. Se dejan omitidas; 1.470 comparaciones visuales dieron 0,00% de diferencia y la app no tuvo 404.
