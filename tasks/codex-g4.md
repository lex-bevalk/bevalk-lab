# Codex G4 · Tier 4: comentarios por prototipo

Rama `feat/proto-selector`, encima de G1-G3 verificados. No hagas commit ni push.
Objetivo: Current tiene el mismo modo comentario (`/review`) y la misma gestión (`/comments`: owner borra, cambia estado y responde;
equipo crea, responde y borra los suyos) que Concept, con los comentarios de cada prototipo separados.
Hoy los comentarios no tienen prototipo: todos los existentes son de Concept.

## Prohibido
Paths de `concept` y de `current` en `tools/proto-paths.json` (este tier es solo compartido: `server/**`, `api/**`, `src/comments/**`,
`src/review/**`, `src/team/**`, tests). Sin dependencias nuevas. No cambiar permisos ni cupos actuales.

## T1 Modelo y API (`server/comments.ts`, `src/comments/constants.ts`)
- `PROTOS = ['current', 'concept'] as const`; `SCREEN_LABELS_BY_PROTO`: `concept` = la lista actual de 28 (sin tocarla);
  `current` = `Acceso, Acciones, Alertas, Analizador, Aprende, Aviso, Avisos automáticos, Bienvenida, Bloqueo, Borrar mis datos,
  Cómo se usa BeValk, Desglose, Escáner, Hitos, Inicio, MarIA, Mi Familia, Mi huella · flujo, Mi huella, Notificaciones, Pasos,
  Perfil · flujo, Perfil, Plan paso a paso, Premium, Próximamente, SOS, Soporte técnico, Subida` (29). Contrasta esta lista con los
  `data-screen-label` reales de `src/current/ui/generated/**` y para si no coinciden. `SCREEN_LABELS` se mantiene exportado como la
  lista de concept para no romper importadores; añade la unión para filtros sin prototipo.
- `ensureTable()`: `ALTER TABLE comments ADD COLUMN IF NOT EXISTS proto text NOT NULL DEFAULT 'concept'` y un índice
  `(proto, created_at)`. Los comentarios existentes quedan en concept.
- Crear: `proto` obligatorio en el cuerpo nuevo pero, por compatibilidad con clientes en caché, ausente → `'concept'`; valor fuera de
  `PROTOS` → 400 `proto`; `screen` se valida contra la lista de ESE prototipo (pantalla de current en concept → 400 `screen`).
- Listar: `?proto=current|concept` filtra; sin `proto` devuelve ambos; `screen` se valida contra la lista del `proto` o, sin él,
  contra la unión. `CommentItem` incluye `proto`. Respuestas, estado y borrado no cambian (actúan por id).

## T2 Overlay de review (`src/review/Review.tsx`, `src/review/bridges.ts`)
- El prototipo sale del puente (`bridge.proto`, que lee `data-proto`). GET con `?proto=`; POST con `proto`; los pines y la lista solo
  muestran comentarios de ese prototipo aunque compartan nombre de pantalla («Inicio», «Mi Familia»).
- Enlace profundo `?flow=&plan=&c=` funciona en los dos (`/review` para current, `/concept-review.html` / `/concept/review` para concept).
- Verifica el puente de current contra `src/current/logic/LabLogic.ts` real (no el HTML): flujo actual, plan y selección de flujo.

## T3 `/comments` (`src/team/CommentsPage.tsx`)
- Selector «Prototipo» con «Current version» (por defecto), «Concept» y «Todos», en la URL (`?proto=`) para poder compartir el enlace.
- Las opciones de «Pantalla» dependen del prototipo (unión con «Todos»); si la pantalla elegida no existe en el nuevo prototipo, se limpia.
- Cada tarjeta muestra el prototipo (etiqueta pequeña, texto visible, sin `aria-label` distinto del texto) y `reviewHref` lleva a
  `/review?…` (current) o `/concept/review?…` (concept).
- Mismo estilo y componentes actuales (`NativeSelect`, `team.css`); contraste AA y foco visible como el resto.

## T4 Pruebas
- `tests/unit/comments.test.ts`: proto ausente → concept; proto inválido → 400; pantalla ajena al prototipo → 400; filtro por proto;
  filtros sin proto con pantalla de la unión; `ensureTable` emite el `ALTER` (con el cliente falso que ya usa el archivo).
- `tests/e2e/review.js`: el flujo actual corre sobre concept (`/concept-review.html`) y sobre current (`/review.html`); un comentario
  creado en current no aparece en concept y viceversa (con los mocks que ya usa el test, sin base real).
- Prueba de `/comments` (en `review.js` o la que ya cubra la página): por defecto filtra current, cambiar a Concept y a Todos,
  `href` de «Ver en el prototipo» según el prototipo.

## Entrega y paradas
`npx tsc --noEmit -p .`, `npm test`, `npm run build`, `npm run check-middleware-esm`, `e2e:review`, `e2e:proto-switch`, `a11y`.
Describe la migración (orden: el código nuevo crea la columna antes de que nadie la envíe; rollback: el código anterior no lee `proto`).
Para si: necesitas cambiar permisos/cupos o tocar paths de un prototipo.
