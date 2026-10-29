# Codex G7 · Un solo «BeValk Lab»: nav de Concept idéntico al de Current y cambio de prototipo sin carga visible

Rama `feat/proto-layout` (PR #16 abierta, encima de G6/G6b). No hagas commit ni push. Lee antes `tasks/lessons.md` (solo añadir).

## Petición del usuario
- «El lab es el mismo, "BeValk Lab", no debería cambiar.» El icono de Flow Explorer es más pequeño y «al cambiar se notan los píxeles».
- «La barra de búsqueda debe estar en el mismo sitio en ambos prototipos… la barra de la izquierda debe ser prácticamente igual para
  ambos (disposición, elementos, tamaños).»
- «Al cambiar entre prototipos se produce una carga de página molesta; el cambio debería ser tan fluido que no se aprecie.»

## Referencia: Current no cambia
El nav de Current (`nav.lab-col`) es la referencia y su paridad con `design/current/current.html` debe seguir 149/149 con 0
diferencias. Todo el trabajo de disposición es en Concept. Medidas actuales a 1440×900 (relativas al nav):

| Elemento | Current | Concept hoy |
|---|---|---|
| Icono cabecera | 36×36, radio 10, icono de usuarios | 32×32, radio 9, escudo |
| Título | «BeValk Lab», 17px/600 Guton, y=18, x=63 | «Flow Explorer», x=59 |
| Subtítulo | «N flujos · M grupos», 13px/500 | 12px |
| Selector | y=69, x=13, w=274 | y=65, x=17, w=266 |
| Buscador | justo bajo el selector (input y=132, 15px) | bajo la modalidad (y=203, 14px) |
| Pestañas de sección | App / Mi Familia / Próximamente con contador | no existen |
| «Modalidad simulada» | y=245 | y=117 |
| Toggle Freemium/Premium | h=40, radio 9, 14px | h=36, radio 8, 13px |
| Texto bajo el toggle | «Cambia el plan del móvil al momento…» | no existe |
| Fila de flujo | h=44, x=13, w=274, radio 10 | h=48, x=9, w=282, radio 8 |
| Scroll | todo el nav hace scroll | cabecera fija, lista con scroll propio |
| Fondo de página `.lab` | rgb(244,242,248) | rgb(245,245,245) |

## T1 Nav de Concept = nav de Current
En la plantilla de Concept (`design/familia/Main.dc.html`, sección del nav `aside.lab-a`) y su CSS:
- Cabecera idéntica a la de Current: mismo icono (el de usuarios), mismas medidas, título literal «BeValk Lab», subtítulo con los
  contadores propios de Concept, mismo botón de portada.
- Orden idéntico: cabecera → selector → buscador → pestañas de sección → «Modalidad simulada» → toggle → texto de ayuda → lista.
- Buscador con las mismas medidas, icono, tipografía y placeholder que Current («Buscar en todos los flujos»), y que busque en todos
  los flujos de Concept sin importar la pestaña (comprueba cómo lo hace Current).
- Pestañas de sección en Concept, mismo componente visual que Current: «App» y «Mi Familia» con su número de flujos (no hay
  Próximamente en Concept). Filtran la lista por sección; la pestaña inicial es App. Decide la pertenencia con el dato que ya
  distingue los flujos de familia en `src/data/**`/`src/logic/**` (no inventes una clasificación nueva). Selecciones de flujo, casos,
  plan y deep links existentes no cambian de comportamiento.
- Toggle Freemium/Premium y texto de ayuda con las medidas y estilo de Current; el texto solo si describe con verdad lo que hace el
  toggle en Concept (ajústalo si no).
- Grupos y filas con la tipografía, alturas, sangrías y radios de Current. Los códigos (`01` frente a `A01`) y las insignias son datos y
  se quedan como están.
- Scroll del nav como en Current (todo el nav). Fondo de página y tarjetas de columna (`.lab-a/.lab-b/.lab-c`: fondo, borde, radio)
  iguales a los de Current.
- `<title>` de `concept.html` y `concept-review.html`: «BeValk Lab · Concept».

### Cómo regenerar sin pisar v1.6.0
`npm run convert-template` completo pisa pantallas de v1.6.0 (deuda en `tasks/todo.md`). Añade a `tools/convert-template.mjs` una opción
`--only=<salida,...>` (p. ej. `navigation`, `css`) que escriba solo esas salidas y deje el resto intacto, y úsala. Si el nav o las
pestañas viven en otra salida generada (Root, tabs…), inclúyela y comprueba con diff normalizado (sin `__scopeN`/`__indexN`/
`data-dc-tpl`) que los archivos de `screens/**`, `live-preview.tsx` y `drawer.tsx` quedan idénticos a `main`.

## T2 Cambio de prototipo sin carga visible
Sin SPA ni dependencias nuevas; plataforma nativa:
- Transiciones de vista entre documentos: `@view-transition { navigation: auto; }` en el CSS compartido de los cuatro documentos
  (`src/proto-switch/proto-switch.css` ya se carga en todos), crossfade breve (≤ 200 ms) y desactivado con
  `prefers-reduced-motion: reduce`. Si ayuda, `view-transition-name` en el nav para que no parpadee.
- Speculation Rules: en las cuatro entradas HTML, `<script type="speculationrules">` que haga `prerender` del enlace del otro prototipo
  (el mismo destino que usa el selector, review ↔ review), eagerness `moderate`. Comprueba que el passwall (`middleware`) no rompe el
  prerender con cookie de sesión y que una página prerenderizada no hace efectos indebidos (p. ej. `/review` pidiendo comentarios es
  aceptable; nada de escrituras).
- Navegadores sin soporte: navegación normal, sin errores.

## T3 Gates
- Nuevo gate (en `tests/e2e/proto-switch.js`): a 1440×900, para cada elemento de la tabla (icono, título, subtítulo, selector,
  buscador, pestañas, «Modalidad simulada», toggle, texto de ayuda, primera etiqueta de grupo, primera fila): `y`, `x`, `width`,
  `height` y `font-size` iguales entre `/` y `/concept.html` a ±1 px; título «BeValk Lab» en los dos; fondo de `.lab` igual. Más el
  gate de columnas de G6. La primera fila puede diferir en altura si su texto ocupa dos líneas: compara la de un flujo de una línea.
- Pestañas de Concept: App filtra a flujos no familiares, Mi Familia a los familiares, la búsqueda encuentra flujos de ambas.
- Speculation rules: el JSON es válido y apunta al destino del selector en las cuatro entradas (test unitario).
- Gates de siempre: `tsc`, `npm test`, build sin avisos, `check-login-assets`, `check-middleware-esm`, `e2e:current:parity` 0
  diferencias, `e2e:current:geometry`, `e2e:family-layout` 0 fallos, `e2e:baseline`, `invariants`, `sweep`, `a11y`, `focus` (Current y
  Concept), `select`, `e2e:review`, `e2e:proto-switch`. Si un test de Concept asumía el orden o las medidas viejas del nav, ajústalo y
  explícalo en el informe.

## Paradas
Para y reporta si: igualar el nav exige cambiar la lógica de selección de flujos de Concept más allá del filtro por sección, la
paridad de Current deja de ser 0, o `--only` no puede garantizar que las pantallas quedan idénticas a `main`.
Entrega: tabla de medidas Current/Concept tras el cambio, diff --stat, resultado de cada gate.
