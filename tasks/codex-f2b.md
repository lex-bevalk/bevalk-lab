# Codex · Fase 2.3 · Cobertura visual + conversor de plantilla + shell

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/port` (no cambies de rama, no hagas commit ni push). Sin red para npm; deps ya instaladas.
Lee antes: `handoff/PROMPT_CLAUDE_CODE.md` (Parte B), `tasks/todo.md` (decisiones, estrategia, resultados 2.1-2.2), `handoff/docs/ARQUITECTURA.md`,
`handoff/docs/lessons.md`. Ya existen y no debes cambiar su comportamiento: `src/data/**`, `src/logic/**`, `src/Host.tsx`, `src/props.ts` (generados o verificados).
Si `Host.tsx` necesita cambiar para renderizar la plantilla, cambia solo `render()` y lo imprescindible, y explícalo.

Fuente de verdad: `handoff/reference/project/Main.dc.html`
- `<helmet>` con `<style>` global (desde la línea ~16) + `<link rel="stylesheet" href="ds/odin/styles.css">`.
- Plantilla dentro de `<x-dc>` hasta la línea ~4681: huecos `{{ ruta }}`, `<sc-if value>`, `<sc-for>`, `style-hover`/`style-active`,
  eventos `onClick` (378), `onChange` (42), `onKeyDown` (6), `onSubmit` (2), `onTouchStart`/`onTouchEnd`, `ref="{{ ... }}"`, `<i data-icon data-size>`.
- Runtime que define la semántica exacta: `handoff/reference/project/support.js` (host y `__setLogicState` ~167356, compilador ~157556,
  funciones de render ~160400-166000). Léelo; la semántica del runtime manda sobre cualquier suposición.

## Reglas duras
- `handoff/` solo lectura. Sin dependencias nuevas. Sin Tailwind ni CSS-in-JS.
- Es un porte: mismos textos, estilos, orden, animaciones y comportamiento. Lo dudoso → `tasks/followups.md` y se replica.
- La salida del conversor es generada: nunca se edita a mano; regenerar debe dejar `git status` limpio. Los arreglos se hacen en el conversor.
- Rutas `/_blob/<id>` → `/assets/<suggestedName>` (manifest). Ningún `/_blob/` en `src`, `public`, `dist`.

## Tarea 0 · Cobertura visual bajo el pliegue (`tests/visual/capture.mjs`)
Las capturas actuales son de viewport. Añade, para cada escena de flujo × plan y para la portada, capturas por tramos del scroll propio de cada
panel `.lab-scroll` (y del contenido del móvil si tiene scroll propio): desplaza en pasos de `clientHeight` hasta el final y captura cada tramo.
Presupuesto: ≤ 1.500 capturas en total y ≤ 400 MB; si no cabe, limita los tramos a 1680×916, 1024×768 y 375×812 y documéntalo.
Mantén nombres estables y el manifiesto. (Claude regenerará el baseline con el Chromium de Playwright; tú puedes probar con el navegador que tengas.)

## Tarea 1 · Comprobaciones previas
- ¿`ds/odin/_ds_bundle.js` inyecta CSS global o modifica el DOM al cargar? Documenta la respuesta; si inyecta CSS, ese CSS debe portarse.
- Qué hace exactamente el runtime con: texto interpolado (`<span class="sc-interp">`), `style` (cssText), `style-hover`/`style-active`,
  `class`, `value`/`checked`, `ref`, keys de `sc-for`, scope de `sc-for`, truthiness de `sc-if`, atributos booleanos, `hint-placeholder-val`.
  Resúmelo en `tools/TEMPLATE_SEMANTICS.md` con referencias a `support.js`.

## Tarea 2 · Estilos
- `tools/copy-odin.mjs`: copia los CSS de `handoff/reference/project/ds/odin/**` (sin `_ds_bundle.js`) a `src/styles/odin/**`
  y `assets/fonts/Guton-SemiBold.woff2`, conservando rutas relativas (Google Fonts igual que en `fonts.css`).
- El `<style>` del `<helmet>` → `src/styles/main.css` (generado por el conversor, con la sustitución de rutas). Comprueba si equivale a
  `handoff/source/src/lab.css` + estilos del móvil y documenta diferencias. Orden de carga igual que la referencia.

## Tarea 3 · Conversor `tools/convert-template.mjs`
- Parsea la plantilla con Chromium vía Playwright (mismo parser HTML que el runtime; aplica el mismo preproceso que `support.js`).
- Emite TSX en `src/ui/generated/**` con cabecera "generado, no editar": un archivo por `data-screen-label` (28) y por sección del Lab
  (navegación, ficha/portada, ficha/flujo, live preview, pestañas, drawer), más un componente raíz que los compone en el orden original.
- Semántica idéntica al runtime (Tarea 1): huecos con acceso tolerante a undefined; `sc-interp`; `sc-if` con la misma truthiness;
  `sc-for` con keys por índice y el mismo scope; `style` a objeto con los mismos valores (custom properties incluidas); `style-hover`/`style-active`
  como en el runtime (clase + CSS generado); `class` → `className`; eventos al handler del hueco; `ref` al callback del hueco; `value`/`checked`
  como el runtime.
- Iconos: `<i data-icon data-size>` → componente `Icon` (`src/ui/Icon.tsx`) que conserva el `<i>` y sus atributos y pinta el SVG de
  `lucide-react@0.544.0` con los mismos atributos que `lucide.createElement` + `width/height=size` + `display:block` (replica `paint()` del original).
  Mapa estático de iconos con todos los nombres usados (plantilla + datos + lógica); nombre desconocido → `console.error` (ruidoso, lo detecta el sweep).
  No importes el catálogo entero de lucide.
- `Host.render()` = componente raíz con `logic.renderVals()`.

## Gate (pega los números)
1. `npm run build` sin avisos; `npm test` verde; regenerar (`convert-template`, `copy-odin`) → `git status` limpio; 0 `/_blob/`.
2. Contra `npm run preview` (`LAB_URL=http://localhost:4173/`): `e2e`, `e2e:baseline`, `invariants`, `sweep`, `a11y`, `focus`
   (focus compara con la referencia en 8765). Objetivo 62/62 · 62/62 · 17 · 0 · 0 · idéntico. Si no llega, da los fallos concretos.
3. Cajas (`getBoundingClientRect`) de `.lab`, `.lab-a`, `.lab-b`, `.lab-c`, `.tp-phone` en los 7 anchos, app contra referencia: ±1 px.
4. `npm run visual` contra preview (con un baseline de referencia generado por ti): tabla de % por captura; agrupa los fallos por pantalla/área.
   Este punto informa, no bloquea: los arreglos por área son la 2.4.

## Para y reporta si
- necesitas una dependencia nueva o tocar la lógica/datos más allá de lo indicado;
- una semántica del runtime no se puede replicar en React sin cambiar comportamiento;
- tras 2 iteraciones del conversor el e2e no llega a 62/62 (reporta los casos y la causa).

## Entregable
Archivos creados, números de cada punto del gate, respuesta de la Tarea 1, followups, desviaciones y dudas. Sin commits.
