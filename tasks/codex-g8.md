# Codex G8 · Misma tipografía en el panel central, «Current» y cambio de prototipo sin blanco

Rama `feat/cohesion-tipografia` (desde `main` 4266e3a). No hagas commit ni push. Lee antes `tasks/lessons.md` (solo añadir).

## Petición del usuario
1. «En el panel central los tamaños de fuente no coinciden entre Current y Concept. Unificarlos todos.» Lo mismo en la barra de
   flujos. El panel derecho (móvil en vivo) no se toca.
2. La pestaña «Current version» pasa a llamarse «Current».
3. «Al cambiar de prototipo la vista sigue apreciando un reload. ¿Se puede hacer imperceptible?»

Current es la referencia y no cambia de aspecto: su paridad con `design/current/current.html` sigue 149/149, 0 diferencias.
Todo el trabajo tipográfico es en Concept.

## T1 Tipografía de Concept = escala de Current
Los estilos del centro de Concept son inline en `src/ui/generated/cover.tsx` y `flow.tsx`, generados desde
`design/familia/Main.dc.html`. Edita la plantilla y regenera solo `--only=cover,flow,navigation` (no edites `generated/**` a mano).
Para regenerar, el servidor de referencia debe servir la plantilla de Concept:
`node tools/serve-reference.cjs 8765 design/familia/Main.dc.html` (sin el tercer argumento sirve `handoff/reference` y el conversor
falla con «Anclaje de ProtoSwitch ambiguo… 0»). Claude comprobó que `--only=cover,flow` sobre `main` da diff normalizado 0 (sin
`__scopeN`/`__indexN`/`data-dc-tpl`): cover y flow no tienen deriva. `live-preview`, `screens/**` y `drawer` quedan idénticos a `main`.

Medidas a 1440×900 (tamaño/interlineado, peso, familia). Columna «Concept hoy» → debe quedar como «Current».

### Portada (cover)
| Rol | Current (referencia) | Concept hoy |
|---|---|---|
| Migas «Lab › Portada» | 14/20 500 Manrope, x=25 | 13/20, x=21 |
| Antetítulo mono («BeValk · …», «Cómo se usa», «Empieza por aquí») | 12/16 600 Geist Mono, letter-spacing .08em (0.96px) | .06em |
| H1 y entradilla | 32/38 Guton 600 · 16/24 400 | igual |
| Número de estadística | 28/32 700 **Manrope** | 26/32 600 Guton |
| Etiqueta de estadística | 14/20 400 | 13/18 500 |
| Rejilla de estadísticas | 4 en una fila a 1440 | la 4.ª baja a otra fila |
| Número de paso («1»…) | 14/14 600 Manrope | 12/12 600 Geist Mono |
| Título de paso | 15/22 600 | 14/20 |
| Descripción de paso | 14/20 400 | 13/18 |
| Meta de tarjeta («F01 · Sin cuenta») | 12/16 600 Geist Mono | 11/16 |
| Título de tarjeta | 17/22 600 | 15/20 |
| Descripción de tarjeta | 14/20 400 | 13/18 |
| Tabla de cobertura: cabecera | 12/16 600 | 13/18 |
| Tabla: filas y números | 14/20 (nombre 500, resto 400, números en Manrope) | 13/18, números Geist Mono |
| Chip de estado de la tabla | 12/16 700 | — |

### Ficha de flujo (flow)
| Rol | Current (referencia) | Concept hoy |
|---|---|---|
| Migas | 14/20 500 | 13/20 |
| Botón de reinicio de la cabecera | 14/16 600 | 13/16 |
| Meta bajo migas (código / grupo) | código 12/18 600 Geist Mono; grupo 14/20 500 | grupo 13/18 |
| Datos («Plan», «Casos»…): etiqueta / valor | 13/16 500 / 14/20 600 | 12/16 500 / 12/16 600 |
| Títulos de sección («User story», «Qué mirar», «Freemium y Premium», «Casos extremos»…) | antetítulo mono 12/16 600, .08em, mayúsculas | mono .06em, y «Freemium y Premium»/«Casos extremos» en 18/24 Guton |
| User story: término («Como/Quiero/Para») | 14/20 600 Manrope | 13/24 600 Geist Mono |
| User story: texto | 16/24 400 | 17/24 500 |
| Resumen junto a título («2 casos · …») | 13/16 500 | 13/18 500 |
| Caso: código | 12/16 600 Geist Mono | 11/16 500 |
| Caso: chip | 11/16 700 | 11/16 600 |
| Caso: título | 15/22 600 | 15/20 |
| Caso: descripción | 14/20 400 | 13/18 |
| Caso: botón «Probar caso» | 14/16 600 | 13/16 |
| Cuerpo de texto («Qué mirar», problema/necesidad, GIVEN/WHEN/THEN) | 15/22 o 14/20 400 como hoy | ya coincide |

Lo que solo existe en Concept («Valor de producto», «Criterios de aceptación», «Entorno de prueba», summaries plegables, chips de
entorno) usa el rol de Current más cercano: texto 14/20 400, etiqueta 13/16 500, título de bloque 15/22 600, meta/chip 12/16 o 11/16,
antetítulo mono 12/16 .08em. Ningún tamaño fuera de esta escala: {11, 12, 13, 14, 15, 16, 17, 28, 32} px. Cambia solo tipografía
(tamaño, interlineado, peso, familia, letter-spacing) y la rejilla de estadísticas; no textos, orden, colores ni estructura.

### Barra de flujos (navigation)
Ya coincide salvo el chip «Free»/«Premium» de las filas de Concept: 10/14 600 → 11/16 700 Geist Mono como Current.

### Fuentes
`src/styles/odin/tokens/fonts.css` carga Manrope y Geist Mono con `@import` de Google Fonts. Cámbialo por los mismos `@font-face`
locales que usa Current (`src/current/styles/odin.css` líneas 1-6, archivos `src/current/styles/fonts/*.woff2`; reutiliza esos
archivos, no los dupliques si Vite permite importarlos desde ahí). Así los dos prototipos pintan con los mismos archivos de fuente y
desaparece una petición externa que bloquea el render (ver T3).

## T2 «Current version» → «Current»
Texto visible en `src/proto-switch/ProtoSwitch.tsx`, `src/comments/constants.ts` (etiqueta), `src/team/CommentsPage.tsx`
(opción del filtro) y `<title>` de `index.html` y `review.html` («BeValk Lab · Current»). El valor interno `current` (API, columna
`proto`, `data-proto`) no cambia. Ajusta los tests que buscan el texto (`tests/e2e/proto-switch.js`, `tests/e2e/review.js`,
`tests/unit/proto-switch.test.ts`).

## T3 Cambio de prototipo sin fotograma en blanco
Diagnóstico de Claude (Chrome 156, `vite preview`, captura de fotogramas por CDP):
- Al pulsar Concept desde Current aparece un fotograma **blanco** (~575 ms) antes de pintar Concept.
- `pageswap` del documento viejo trae `viewTransition`, pero `pagereveal` del nuevo llega con `viewTransition = null`: la transición
  se salta. Bisección: la causa es el `@import` de Google Fonts dentro del CSS de Concept (con ese CSS sin el `@import`, la
  transición sí se aplica). T1/Fuentes lo elimina.
- Además, en `pagereveal` `#root` está vacío (React monta después de la primera pintura), así que aun con transición se fundiría
  a una página vacía.

Qué hacer (plataforma nativa, sin SPA ni dependencias):
- Primera pintura con la app ya montada en los cuatro documentos (`index.html`, `review.html`, `concept.html`,
  `concept-review.html`): `blocking="render"` en el `<script type="module">` de entrada y render inicial síncrono con `flushSync`
  en `src/main.tsx`, `src/current/main.tsx` y las entradas de review. Comprueba que Vite conserva `blocking="render"` en `dist/*.html`;
  si no lo conserva, aplica la solución mínima que lo garantice (p. ej. un plugin `transformIndexHtml` de pocas líneas en
  `vite.config.ts`). Comprueba que no hay `React.lazy`/Suspense en el render inicial que `flushSync` no espere.
- Speculation Rules: `eagerness` `moderate` → `immediate` (un solo destino por página: el otro prototipo; review ↔ review).
- Mantén el fundido de 160 ms y `prefers-reduced-motion`.
- Login (`login.html`) y `team.html` no se tocan salvo la opción de T2.

## T4 Gates
Nuevos, en `tests/e2e/proto-switch.js` (o un archivo enlazado en `qa.yml`):
- **Tipografía**: a 1440×900, para cada rol de las tablas de T1 (portada y ficha de un mismo flujo en los dos prototipos, p. ej.
  «Le llega un enlace peligroso»), `font-size`, `line-height`, `font-weight` y `font-family` iguales entre Current y Concept; y el
  conjunto de tamaños usados en el centro de Concept (portada + esa ficha) ⊆ escala de Current. Chip «Free» del nav igual.
- **Cambio sin blanco**: con Chromium, ir de `/` a `/concept` pulsando el selector y viceversa (y `/review` ↔ `/concept/review`):
  en `pagereveal` del documento nuevo `viewTransition` no es null y `#root` ya tiene contenido. Además, captura de fotogramas por
  CDP (`Page.startScreencast`) entre el clic y +1,5 s: ningún fotograma con luminancia media > 0,97 (blanco). Nota: el prerender no
  se puede observar bajo Playwright (`PrerenderingDisabledByDevTools`); el gate cubre el caso sin prerender, que es el peor.
- Speculation rules: test unitario actualizado (`immediate`, destino correcto en las cuatro entradas).
Gates de siempre: `npx tsc --noEmit -p .`, `npm test`, `npm run build` sin avisos, `check-login-assets`, `check-middleware-esm`,
`e2e:current:parity` 0 diferencias, `e2e:current:geometry`, `e2e:family-layout` 0 fallos, `e2e`, `invariants`, `sweep`, `a11y`,
`focus` (Current y Concept, con `FOCUS_IGNORE_CONCEPT_NAV=1` para Concept), `select`, `e2e:review`, `e2e:proto-switch`.
Diff normalizado: `screens/**`, `live-preview.tsx`, `drawer.tsx` idénticos a `main`. Si un test de Concept fijaba tamaños viejos,
ajústalo y explícalo en el informe.

## Paradas
Para y reporta si: la paridad de Current deja de ser 0; `--only` toca algo fuera de cover/flow/navigation/css; tras quitar el
`@import` `pagereveal` sigue sin `viewTransition`; o `blocking="render"` no se puede conservar en el build.
Entrega: tabla de roles Current/Concept tras el cambio, diff --stat, resultado de cada gate, y los fotogramas del gate de cambio.
