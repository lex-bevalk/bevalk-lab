# Codex G9 · Current · Próximamente › Novedades: flujo «Home rediseñada» y su pantalla

Rama `current/home-redisenada` (desde `main` ccbf58c). **Solo Current.** Concept no se toca: nada en `src/ui/**`, `src/styles/**`,
`src/logic/**`, `src/data/**`, `design/familia/**`, `concept*.html`. La PR llevará la etiqueta `proto:current` y el CI ejecuta
`npm run guard:proto -- current`: ejecútalo tú también. No hagas commit ni push. Lee antes `tasks/lessons.md`.

## Petición del usuario
«Añade a Current › Próximamente › Novedades el flujo "Home rediseñada" y crea esta pantalla», con la referencia
`tasks/ref-home-redisenada.png`, «con la salvedad de quitar el badge de "Nuevo" de "Mi huella"».

## Dónde
La fuente es la plantilla `design/current/current.html`. Se edita ahí y se regenera con `npm run convert:current` (no edites
`src/current/ui/generated/**` a mano). La paridad `e2e:current:parity` compara el Lab con esa misma plantilla, así que debe seguir con
0 diferencias, ahora con un flujo más.

## T1 El flujo
En `LAB_APP_FLOWS`, dentro del grupo `p3` (Novedades), después de `A19`:
```
{id:"A39", g:"p3", estado:"Nuevo", rol:"Freemium y Premium", plan:"both", inicio:"Inicio rediseñado",
 t:"Home rediseñada", d:"El Inicio en dos bloques: lo más urgente arriba y todas las herramientas en una rejilla, a un toque.",
 jtbd:["Cuando abro BeValk", "quiero ver qué tengo que hacer y llegar a cualquier herramienta", "para resolverlo sin buscar"],
 esc:[["Quién", "Elena"], ["Pendiente", "Contraseña de LinkedIn filtrada"], ["Herramientas", "8, en dos columnas"]],
 pasos:["Lee «Qué hacer ahora»", "Toca la tarea de LinkedIn", "Vuelve a Inicio y abre una herramienta"],
 mirar:"Que la tarea urgente se vea sin hacer scroll y que cada herramienta se reconozca por su icono y su nombre.",
 valor:"Una sola acción destacada quita la duda de por dónde empezar, y la rejilla deja todo a un toque.", ids:["Pantalla nueva"],
 casos:[]}
```
Comprueba que el id `A39` está libre y que un flujo con `casos:[]` se muestra bien (A21/A22 ya tienen 0). En el `switch` que prepara
el estado de cada flujo (junto a `case "A14"`… `case "A38"`), añade `case "A39"` con `st.scen = both("free-aldia", "prem-amitad")` y
`st.screen = "home2"`. `prem-aldia` no vale: ya tiene `li1` hecho y la tarjeta de LinkedIn contradiría a Mi huella; en `prem-amitad`
`li1` está pendiente. El flujo se comporta como sus hermanos de Novedades (mismo tratamiento de «Próximamente», chip, contadores).

## T2 La pantalla «Inicio rediseñado» (`screen === "home2"`)
Nueva sección del móvil `data-screen-label="Inicio rediseñado"`, junto a la de `Inicio`, fiel a `tasks/ref-home-redisenada.png`:
- **Cabecera:** el título centrado reutiliza `homeTitle` («BeValk Premium» o «BeValk» según el plan). A la derecha, el mismo botón de
  campana con contador que ya usa Current (mismo destino, Notificaciones). Sin avatar a la izquierda.
- **«Qué hacer ahora»:** h2 a la izquierda y enlace subrayado «Ver todo» a la derecha. Debajo, una tarjeta-botón con fondo lila
  suave y borde lila, el icono de llave en un cuadrado blanco redondeado, título «Cambia la contraseña de LinkedIn», meta
  «LinkedIn · contraseña filtrada · 2 min» y chevron. No lo escribas fijo: sale del primer paso pendiente de `FINDINGS`
  (`allSteps()` menos `done` del escenario; en `prem-amitad` es `li1`: título, `label` del hallazgo y `time`). La tarjeta abre la
  pantalla que ya usa Current para ese paso pendiente (la misma a la que se llega desde Mi huella). Con Freemium (`free-aldia`), la
  tarjeta hace lo que ya hace Current con ese paso para un usuario gratuito (bloqueo/paywall si es lo existente). «Ver todo» abre Mi
  huella. Si no hay paso pendiente, la sección «Qué hacer ahora» no se muestra. Si algún destino no existe, para y reporta.
- **«Tus herramientas»:** h2 y rejilla de 2 columnas, 8 baldosas blancas con borde lila y radio como la referencia. Cada una: icono
  en un cuadrado lila suave arriba a la izquierda y nombre debajo. Orden: Analizador de enlaces, Mi huella, Chat con MarIA, Escáner
  de QRs, Alertas, Mi Familia, ¿Cómo se usa BeValk?, Soporte técnico. Chip «NUEVO» (el mismo componente que ya usa Current) **solo**
  en Mi Familia; Mi huella sin chip. Cada baldosa abre el mismo destino que su tarjeta en el Inicio actual (`homeGroups[].cards[]`):
  reutiliza esos manejadores, no dupliques lógica. Mi Familia abre lo mismo que la tarjeta de familia del Inicio actual.
- **Barra inferior:** la de siempre (Inicio, SOS, Mi huella, MarIA, Perfil) con Inicio activo. Mientras el flujo activo sea A39,
  «Inicio» de la barra y cualquier «volver a Inicio» llevan a `home2`, no al Inicio antiguo. En los demás flujos nada cambia.
- **Estilo:** tokens y clases de Current (`odin-card`, `var(--color-*)`, `--font-sans`/`--font-display`), iconos del set de iconos que
  ya usa la plantilla (llave, enlace, huella, chat, QR, campana, usuarios, ayuda, auriculares). Tipografía y espaciado según la
  referencia. Objetivos táctiles ≥ 44 px, foco visible, `aria-label` donde el texto no baste, todo en español.
- La pantalla vale para Freemium y Premium (título según plan). El Inicio antiguo y su flujo no cambian.
- `grep -n '"home"' design/current/current.html` (≈49 sitios): revisa cada uno (retornos tempranos, `isHome`, banner sin conexión
  ~10303, volver atrás, `caseTouch`…) y decide si `home2` debe entrar en la condición para que dentro de A39 nada caiga en el Inicio
  antiguo. Lista en el informe los sitios cambiados.
- Comentarios: `src/comments/constants.ts` (`SCREEN_LABELS_BY_PROTO.current`) debe incluir «Inicio rediseñado»;
  `tests/unit/comments.test.ts:234` exige que coincida con las etiquetas de la plantilla. Es archivo compartido, no de Concept: está
  permitido. Gate: `npm test` y `e2e:review`.

## T3 Gates
- `npm run convert:current` idempotente (segunda pasada, 0 cambios).
- `npx tsc --noEmit -p .`, `npm test`, `npm run build` sin avisos, `check-login-assets`, `check-middleware-esm`.
- `e2e:current:parity` 0 diferencias (con A39), `e2e:current:geometry`, `e2e:current:a11y`, `focus` de Current, `e2e:proto-switch`,
  `e2e:review`, `npm run guard:proto -- current --base main`.
- Nuevo test e2e de Current (en el archivo de Current que mejor encaje, enlazado en `qa.yml` si es nuevo): en `/` seleccionar
  Próximamente › Novedades › «Home rediseñada»; el móvil muestra «Qué hacer ahora», la tarea de LinkedIn y las 8 herramientas en ese
  orden; «NUEVO» aparece una vez y en Mi Familia; tocar Analizador abre el analizador y «Inicio» vuelve a `home2`; la tarjeta de
  LinkedIn abre la pantalla de filtración; con Freemium el título es «BeValk».
- Concept intacto: `git diff --stat main` sin archivos de Concept.

## Paradas
Para y reporta si: la paridad deja de ser 0, el conversor de Current no regenera limpio, algún destino de T2 no existe, o hace falta
tocar algo de Concept.
Entrega: diff --stat, captura del móvil en `home2` a 1440×900 (Premium y Freemium) en `.tmp/`, y resultado de cada gate.
