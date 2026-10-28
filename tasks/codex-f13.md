# Codex F13 · v1.6.0 fase B: los flujos de Mi Familia que faltan

Rama: `feat/mi-familia-flujos`, encima de la fase A (`tasks/codex-f12.md`) ya verificada. No hagas commit ni push.
Mismas reglas, regla de fusión, paradas y formato de entrega que F12. Diseño de Claude (decisión 17 de `tasks/todo.md`).

## Vía obligatoria (aprendida en F12-F12e)
- Toda la UI nueva se escribe en `design/familia/Main.dc.html` y se regenera con `tools/convert-template.mjs` (ver
  `design/familia/README.md`). Prohibido editar a mano `src/ui/generated/**`. Solo pueden cambiar las pantallas tocadas e `Icon.tsx`.
- Si la conversión agota tiempos, reinicia los servidores que lanzaste tú y reintenta: no es parada.
- Amplía `tests/e2e/family-layout.js` a los 10 flujos nuevos (bloques dentro de `.tp-scroll`, X ≥ 44 px CSS dentro de su tarjeta,
  sin solapes con la cabecera) y `tests/unit/family-icons.test.ts` a sus iconos, con control negativo.
- La comparación visual con máscaras de F12e debe seguir en 0 FAIL fuera de `scroll-nav`.

## T0 Cerrar la comparación visual de la fase A (antes de nada)
Revisado por Claude sobre el resultado de F12e: los 686 PASS cubren todo lo no familiar; los 178 FAIL y 432 MISSING son flujos y casos
de familia (rediseñados a propósito: su fuente visual es `Lab.dc.html`, no `handoff`); los 4 MISSING de `pzlink` son páginas de scroll
extra del móvil por la nota `famAn` (categoría con máscara de móvil).
- `compare.mjs`: los flujos de los grupos «Mi Familia · …» (y sus casos) quedan fuera de la comparación con la referencia por pertenencia
  al grupo, no por lista de nombres, con el motivo en el resumen. Su cobertura visual es `visual:own` familia (375 y 1440) +
  `e2e:family-layout`.
- Cuando el par lleva máscara de móvil, una diferencia en el número de páginas `scroll-phone` no cuenta como MISSING.
- Objetivo: `visual` con 0 FAIL y 0 MISSING; el resumen muestra cuántas capturas se excluyeron por cada motivo.
- `visual:own` familia: guarda su baseline (como el genérico) para que CI compare contra él.

## Criterios de diseño (público 50+, válido para todos)
- Una acción principal por pantalla (`odin-btn--primary`), como mucho una secundaria (`odin-btn--outline`) y un enlace de texto para salir.
- Frases cortas en segunda persona, sin jerga («tienda» y no «store»; «Basic» como ya usa la app). Siempre: qué ha pasado, qué
  significa para ti y qué puedes hacer. Nunca culpar a nadie.
- Reutiliza solo patrones que ya existen en Mi Familia tras la fase A: banner `role="status"` amarillo de fin de plan (icono 24 px,
  título 600 1.0625rem, cuerpo 400 0.9375rem, botón outline), tarjeta `odin-card`, hoja `fam.sh`, tarjeta `famHome` de Inicio con X
  cerrable y toast «Deshacer». Sin colores, radios ni tamaños nuevos. Objetivos táctiles ≥ 44 px; estados nunca solo por color.
- Toda simulación del prototipo (aprobar compra, llegar la fecha) se dispara desde el Lab con `fire`, nunca con UI falsa en el móvil.

## Flujos nuevos (10)
Añádelos al final de su grupo de F12, con `FLOWS` + `LAB[id]` completos (story, ctx, value, ac, cases) como en F12.

### N1 `famtienda` · «La tienda no responde» · Basic · grupo descubrir y contratar
- Estado `fam.offer.err = "store"` en la vista `oferta`. En el sitio de los precios, banner amarillo con icono `circle-alert`:
  título «No podemos mostrar los precios ahora», cuerpo «La tienda de tu móvil no responde. No se te ha cobrado nada.», botón outline
  «Reintentar». «Continuar a la tienda» deshabilitado (`aria-disabled`) con la línea «Elige tamaño cuando se vean los precios».
- «Reintentar»: spinner Odin existente ~1,2 s y aparecen los precios. Caso ejecutable c1 «Reintenta y funciona». Obs. c2 «Sigue sin
  responder»: mismo banner, sin bucles ni contadores.

### N2 `fampendiente` · «La compra queda pendiente de aprobación» · Basic · descubrir y contratar
- Tras la hoja de la tienda con resultado pendiente, vista nueva `pendiente`: `odin-card` con icono `clock`, título «Tu compra está
  pendiente de aprobación», cuerpo «La persona que aprueba las compras de tu cuenta en la tienda tiene que aceptarla. Te avisaremos en
  cuanto lo haga. No tienes que volver a pagar.» Botón principal «Volver a Inicio».
- Inicio: `famHome` sin insignia: «Plan familiar pendiente de aprobación» / «Te avisaremos cuando se apruebe.» Cerrable (reglas F26).
- `fire` «Simular aprobación» → toast «Compra aprobada» y la vista `crear` (F04). Caso ejecutable c1 «Se aprueba».
  Obs. c2 «Se rechaza»: vuelve a la oferta con «La compra no se ha aprobado. No se te ha cobrado nada.»

### N3 `famlleno` · «No quedan plazas» · Quien gestiona · el grupo
- Con todas las plazas ocupadas o reservadas, «Invitar a alguien» del panel abre la hoja `kind:"lleno"`: título «No quedan plazas»,
  cuerpo «Tu plan es para 6 personas y ya están todas ocupadas o reservadas.» Debajo, cada invitación pendiente con «Anular invitación»
  (la misma acción de F10) y un botón outline «Cambiar el tamaño en la tienda». Cerrar con la X de la hoja.
- Al anular, la hoja pasa sola al paso 1 de invitar («¿Cómo quieres llamarle?»). Caso ejecutable c1 «Anula la de Ana e invita».

### N4 `famunido` · «Mamá ha aceptado mi invitación» · Quien gestiona · día a día
- Inicio, `famHome` con el avatar de Mamá: «Mamá se ha unido a Familia Navarro» / «Ya podéis avisaros y pedir ayuda. Comparte
  contigo: Huella y Enlaces analizados.» Toca → panel, con «Se ha unido hoy» en su fila. Cerrable (reglas F26).
- Caso ejecutable c1 «No comparte nada»: el cuerpo dice «Mamá no comparte nada contigo, pero podéis avisaros.»

### N5 `famterminado` · «Mi plan familiar ha terminado» · Quien gestiona · plan y baja
- Pasada la fecha (`fam.ended`): Inicio, `famHome`: «Tu plan familiar terminó el 14 de noviembre» / «Mamá, Abuelo Pep y Marcos están
  ahora en Basic. Ya no veis lo que compartíais.» Toca → oferta de F03 (sin tamaño marcado) con una línea encima «Si vuelves a
  contratar, tendrás que invitar de nuevo a tu familia.» Cerrable.
- `fire` «Llegar al 14 de noviembre» desde F15 lleva aquí; caso ejecutable c1 en F15 con ese `fire`.

### N6 `famterminadomiembro` · «El plan de mi familia ha terminado» · Miembro · plan y salida
- Inicio, `famHome`: «El plan familiar de Lucía ha terminado» / «Desde hoy tu cuenta está en Basic. Lucía ya no ve lo que compartías.»
  Toca → Gestiona tu plan con los Premium individuales (lo que ya muestra F22 con `termina`). Cerrable.

### N7 `famcaducada` · «Mi invitación ya no sirve» · Invitada
- Vista `unirse` con `fam.inv.state = "caducada" | "anulada"`: en lugar del formulario, `odin-card` con icono `calendar-x`, título
  «Esta invitación ya no sirve» y cuerpo según la causa: «Caducó el 4 de noviembre. Por seguridad, las invitaciones duran 7 días.» o
  «Lucía la ha anulado.» Siempre: «Si quieres unirte, pídele a Lucía que te envíe otra.» Botón principal «Entendido» → Inicio sin tarjeta.
- Caso ejecutable c1 «Anulada» (variante del texto). Nunca se ofrece reenviar desde aquí: quien invita es quien decide.

### N8 `fampremiumpropio` · «Me invitan y ya pago mi Premium» · Invitada
- Escenario Premium propio + `invited`. En `unirse`, banner amarillo antes del botón: «Ya tienes Premium, que se renueva el 3 de
  diciembre» / «Al unirte usarás el del grupo. Cancela la renovación en la tienda para no pagar dos veces. El tiempo ya pagado no se
  devuelve.» Botón outline «Ir a la tienda». El botón de unirse no cambia.

### N9 `famretirado` · «Me han retirado del grupo» · Basic · miembro, plan y salida
- Variante de F25 con `fam.left = "removed"`: «Lucía te ha retirado de Familia Navarro» / «Tu cuenta está en Basic desde hoy. Lucía ya
  no ve lo que compartías.» Toca → planes Premium. Cerrable.

### N10 `fameliminar` · «Gestiono un grupo y elimino mi cuenta» · Quien gestiona · plan y baja
- En el flujo actual de Perfil › Eliminar cuenta, si el rol es admin, bloque destructivo en el primer paso (patrón de aviso existente
  del flujo, sin colores nuevos): «Familia Navarro se deshará en ese momento», viñetas «Mamá, Abuelo Pep y Marcos pasarán a Basic al
  momento.» y «La suscripción no se cancela sola: cancélala en la tienda para que no te cobren.» Botón outline «Cancelar en la tienda».
  El resto del flujo de borrado no cambia. Caso ejecutable c1 «Ve el aviso y llega a la confirmación».

## Casos que pasan a ejecutables (UI ya existente)
En los flujos de F12, convierte en ejecutables (con `prep` + `steps`) si la UI ya lo permite; si no, déjalos como observación y dilo:
- `faminvite`: no marca «Tengo 18 años o más» → `ageErr`; «Ahora no» → la tarjeta de Inicio queda y la invitación sigue válida.
- `fammember`: «Silenciar notificaciones de Lucía» (C2 de F17).
- `famayuda`: pedir ayuda sin conexión (C1 de F18).
- `famajustes` / `famcomparto`: falla el guardado → el interruptor vuelve y aparece «Reintentar» (C1 de F11), con `labFail` si ya existe.

## Pruebas y versión
- Guiones de `qa.js` para cada caso ejecutable nuevo; los 10 flujos fuera de `e2e:baseline` y de la comparación visual con la
  referencia, dentro de `visual:own` a 375 px; `a11y` sobre cada estado nuevo; test unitario de arranque ampliado a 36 flujos.
- Añade al CHANGELOG 1.6.0: «10 flujos nuevos de Mi Familia para los casos límite: tienda sin respuesta, compra pendiente, grupo lleno,
  invitación aceptada, caducada o anulada, Premium propio, fin del plan para quien gestiona y para el miembro, retirada del grupo y
  eliminar la cuenta gestionando un grupo.»
