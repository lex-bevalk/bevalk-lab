# Codex F12 · v1.6.0 fase A: los 26 flujos de Mi Familia en el Lab

Rama: `feat/mi-familia-flujos` (ya creada). No hagas commit ni push; Claude verifica y commitea.

## Objetivo
El Lab actual muestra los 26 flujos de `mi-familia-lab/Lab.dc.html` (`LAB_GROUPS` l. 4126, `LAB_FLOWS` l. 4136-4416) dentro de su
navegación de siempre, y cada flujo arranca el móvil en la pantalla y el estado que define `famApplyFlow` (l. 6497-6547) de ese archivo.
Las pantallas de Mi Familia del prototipo pasan a ser las de `Lab.dc.html`.

## Contexto verificado (léelo antes de tocar nada)
- `src/` es la fuente. `src/ui/generated/**` y `src/logic/LabLogic.ts` salieron de `handoff/reference/project/Main.dc.html` con
  `tools/convert-template.mjs` / `extract-logic.mjs` / `extract-data.mjs`, y después se editaron a mano (commits `ff5c304`, `800b3e8`).
- `Lab.dc.html` parte de un prototipo ANTERIOR al de `handoff` (tiene «Escáner»; no tiene Aprende, Lección, Ayuda, Aviso, Comprobar,
  Borrar mis datos). No lo conviertas entero ni lo uses como base: solo se trae lo de Mi Familia.
- Puntos de contacto en la plantilla de `Lab.dc.html`:
  1. Pantalla Mi Familia, l. 3230-3819 (vistas nuevas `fam.isBaja`, `fam.isSalir`; banners `fam.hub.ending`, `fam.member.ending`;
     `fam.member.avisoMoney`; etc.).
  2. Hoja `fam.sh.visible`, l. ~3903-4114 (50 líneas distintas de la actual).
  3. Inicio: tarjeta `famHome.*` (`isDiscover`, `isCompact`, `close`, `closeAria`, `discoverGo`, `discoverLater`, `hasIcon`, `badgeBg`).
  4. Perfil › Gestiona tu plan: `famPlan.*` (`show`, `isAdmin`, `isMember`, `ending`, `notEnding`, `seats`, `feats`, `store`,
     `reactivate`, `cancel`, `toFamily`), l. ~1077-1200.
  5. Analizador, resultado: `famAn.nudge`, `famAn.nudgeOpen` (Basic con riesgo medio/alto) además del botón de miembro actual.
- Lógica (clase desde l. 5117): `famHomeClose`, `famCancelConfirm`, `famReactivate`, `famLeaveGroup`, `famHomeVals`, `famHomeRaw`,
  `famPlanVals`, el getter `famAn` (l. ~7642), cambios en `famVals` (l. 6570) y en `FAM0()` (l. 5083), y los campos nuevos
  (`fam.ending`, `fam.left`, `fam.discover`, `fam.hidden`, `fam.mem.{ending,aviso,avisoMsg}`, `offHidden`). `showToast(text, act)`
  con acción `{label, fn}` ya existe en los dos.
- Datos nuevos: `FAM_MEMBERS_CALM`, `FAM_LOSE_MEMBER`, `FAM_LOSE_ADMIN` → `src/data/family.ts`. Compara el resto de constantes `FAM_*`
  y `FAM_SENT0`/`FAM0` entre `handoff/.../Main.dc.html` y `Lab.dc.html`; si alguna cambia, gana `Lab.dc.html` y lo listas.

## Reglas
- No tocar `handoff/`, `mi-familia-lab/` (solo lectura), `src/styles/odin/**`, `api/`, `server/`, `middleware.ts`, `src/review/**`,
  `src/team/**`, `src/comments/**`. Sin dependencias nuevas. Iconos solo de `lucide-react@0.544.0` (si `Lab.dc.html` usa un icono que
  `src/ui/Icon.tsx` no mapea, añádelo al mapa).
- No partir ni refactorizar `LabLogic.ts` ni `lab.ts` aunque pasen de 800 líneas. Cambios mínimos y localizados.
- **Fusión por bloque** (decisión 14 de `tasks/todo.md`): comportamiento, textos y elementos nuevos vienen de `Lab.dc.html`; el estilo de
  elementos que ya existen en `src/` se queda como está (p. ej. avatares de 48 px en `src/` frente a 44 px en `Lab.dc.html`, `fam.canBack`).
  Si un hunk mezcla ambas cosas y no está claro, aplica la regla y apúntalo en la lista «Dudas de fusión» del informe.
- **No portar el shell de `Lab.dc.html`**: nada de `state.lab.{cur,rol,caso,run}`, `labGo`, `labOpen`, `labVals` ni filtros por rol.
  **No portar `famApplyFlow`** como switch imperativo: cada rama se traduce a los campos declarativos que ya usa `FLOWS`
  (`start`, `screen`, `famView`, `mid`, `famPatch`, `famSheet`, `patch`, `scen`, `fam`, `an*`…) y a `LAB[id].cases[].prep`. Si algún
  estado no se puede expresar con los campos existentes, añade el mínimo soporte en el código que hoy aplica esos campos y explícalo.
- Plantilla: elige la vía con menos riesgo y justifícala en el informe.
  (a) Preferida si es determinista: genera con `convert-template.mjs` una copia temporal de la plantilla de `handoff` con los bloques de
  familia sustituidos (en `.tmp/`, nunca en `handoff/`), comprueba antes que regenerar SIN cambios reproduce `src/ui/generated` salvo
  las ediciones de `ff5c304`, y vuelve a aplicar esas ediciones después. (b) Si no es determinista: edita a mano solo las pantallas
  generadas afectadas, conservando los helpers de `runtime.tsx`.
- Accesibilidad (público 50+): objetivos táctiles de 44 px como mínimo, nombre accesible que contenga el texto visible (WCAG 2.5.3),
  la X de los avisos de Inicio con `aria-label` propio, sin depender solo del color en los interruptores.

## T1 Datos y lógica
Porta los datos y métodos listados arriba a `src/data/family.ts` y `src/logic/LabLogic.ts`, con la regla de fusión.

## T2 Plantilla
Los 5 puntos de contacto, con la regla de fusión. Las pantallas no familiares no cambian.

## T3 Flujos del Lab (`src/data/flows.ts`, `src/data/lab.ts`)
Sustituye los dos grupos de familia por estos 8 y ordena los flujos F01…F26. Los ids existentes se conservan:

| Grupo nuevo | Flujos (id · origen) |
|---|---|
| Mi Familia · descubrir y contratar | `famdescubre` F01 · `famdescubrean` F02 · `famoferta` F03 · `famcrear` F04 |
| Mi Familia · quien gestiona, día a día | `famcalma` F05 · `famadmin` F06 · `famficha` F07 · `famavisar` F08 · `famfichapep` F09 |
| Mi Familia · quien gestiona, el grupo | `faminvitar` F10 · `famajustes` F11 · `famretirar` F12 |
| Mi Familia · quien gestiona, plan y baja | `famplan` F13 · `fambaja` F14 · `famcancelado` F15 |
| Mi Familia · persona invitada | `faminvite` F16 |
| Mi Familia · miembro, día a día | `fammember` F17 · `famayuda` F18 · `famayudaan` F19 · `famcomparto` F20 · `famverlucia` F21 |
| Mi Familia · miembro, plan y salida | `famplanmiembro` F22 · `famsalir` F23 · `famtermina` F24 · `famfuera` F25 |
| Mi Familia · avisos de Inicio | `famcerrar` F26 |

Para cada flujo, en `FLOWS`: `label` = `t`, `sub` = `inicio` (+ rol si ayuda), `tip` = `d` + `mirar`; los campos de arranque equivalentes
a su rama de `famApplyFlow`. En `LAB[id]` sigue la forma de las entradas actuales (`plans`, `role`, `stage`, `desc`, `story`, `ctx`,
`value`, `plan`, `ac`, `cases`):
- `story` desde `jtbd` (as/want/so), `ctx` desde `esc`, `value.why` desde `valor`, `role` desde `rol`.
- `ac` (Dado/Cuando/Entonces): redáctalos desde `pasos` + `mirar`, 2-4 por flujo, verificables en el prototipo. `st:"impl"` solo si lo
  comprobaste en el prototipo.
- `cases`: cada caso con `caso` (Ejecutable) → `prep` + `steps` con predicados `ok` que `labTrack` pueda alcanzar; cada caso sin `caso`
  (Observación) → `obs:true` con `scen/trig/exp/rec/end/ac` derivados de su `d`. Mantén `c1`, `c2`… como ids.
- Flujos existentes: actualiza arranque, textos y casos al nuevo comportamiento sin perder casos que sigan siendo válidos; si un caso
  existente deja de tener sentido, dilo en el informe en vez de borrarlo en silencio. Revisa que todos los `steps[].ok` actuales siguen
  alcanzables con el nuevo estado.
- Actualiza `LAB_AC_BY`. En `LAB_QA` no marques como verificado nada que no hayas ejecutado.
- «Nuevo»/«Rediseñado»: si la navegación actual ya tiene un campo para etiquetar un flujo, úsalo; si no, NO añadas UI al shell
  (decisión 13): guárdalo como dato (`estado`) y dilo en el informe.

## T4 Pruebas
- `tests/e2e/qa.js`: un guion por cada caso ejecutable nuevo o cambiado; todos los casos de familia llegan al final de sus pasos.
- `e2e:baseline` corre contra la referencia de `handoff`, que no tiene los flujos nuevos: que se salten de forma explícita (lista en el
  código), sin afectar al resto.
- Visual: los estados de familia que cambian a propósito (Mi Familia, tarjeta de Inicio, Gestiona tu plan, nota del analizador) salen de
  la comparación con la referencia mediante una lista explícita y pasan a `visual:own` con capturas a 375 px. El resto sigue a 0 px.
- `tests/visual/review-areas.mjs`: área Familia con los 26 flujos.
- Unit (`tests/unit/data.test.ts` y compañía): actualiza las expectativas de `FLOWS`/familia con la lista de cambios intencionados;
  añade un test que recorra los 26 flujos de familia y compruebe que cada uno arranca con `screen`/`fam.role`/`fam.view` esperados.
- `invariants`, `sweep` (0 errores, contra `preview`), `a11y` y `focus` en verde; añade a `a11y` las vistas nuevas (oferta, Gestiona tu
  plan admin y miembro, baja, salir, tarjeta de descubrimiento, Inicio tras salir).

## T5 Versión
`CHANGELOG.md` `## [1.6.0] - 2026-10-28`, Added: «Mi Familia completo en el Lab: 26 flujos en 8 grupos (descubrir y contratar, día a día,
grupo, plan y baja, invitación, miembro y salida, avisos de Inicio) con sus casos.» `package.json` y `package-lock.json` a 1.6.0.

## Paradas
Para y explica (sin improvisar) si: regenerar sin cambios no es reproducible y la vía (b) implica tocar más de las 4 pantallas afectadas;
un flujo necesita un estado que no existe en `Lab.dc.html`; el cambio afecta a pantallas no familiares; algún gate no pasa tras dos intentos
con hipótesis distintas.

## Entrega
Ejecuta y reporta números: `npx tsc --noEmit -p .`, `npm test`, `npm run build`, y con `npm run preview` y `npm run serve:reference` en
marcha: `npm run e2e`, `npm run e2e:baseline`, `npm run invariants`, `npm run sweep`, `npm run a11y`, `npm run focus`, `npm run visual:baseline`,
`npm run visual`, `npm run visual:own` (si falta Chromium de Playwright usa `LAB_CHROMIUM_EXECUTABLE`). Lista de archivos tocados, vía de
plantilla elegida, «Dudas de fusión», casos existentes cambiados o retirados, y constantes `FAM_*` que cambiaron.
