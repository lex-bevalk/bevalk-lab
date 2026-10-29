# Codex F11 · v1.5.0: réplicas y estado desde el popover de /review

Rama: `feat/replicas-y-estado` (ya creada desde main). No hagas commit ni push; Claude verifica y commitea.

## Reglas
- No tocar `handoff/`, `src/styles/odin/**`, `src/ui/generated/**`, `src/logic/LabLogic.ts`, `src/styles/main.css`, `src/ui/OptSelect.tsx`, `tools/check-middleware-esm.mjs`.
- Sin dependencias nuevas. Iconos solo de `lucide-react`. Sin Tailwind ni CSS-in-JS. Imports relativos de `api/` y `server/` con extensión `.js` (ESM). Sin archivos nuevos en `api/`.
- Sin `window.confirm`/`alert`. `localStorage` siempre en try/catch.
- Locators e2e con `exact: true`; para pasar a un mock anterior, `route.fallback()`. aria-label nunca distinto del texto visible.
- Decisiones del usuario: el estado lo cambia solo el owner (PATCH no cambia). En el popover, el badge es un `<select>` nativo con los 4 estados y "Eliminar" es un botón aparte con confirmación inline. `/comments` mantiene su control de estado actual; solo gana réplicas.

## T1 Servidor (server/comments.ts)
- Tipos: `ReplyRecord`, `ReplyItem { id, comment_id, created_at: string, author, body }`, `ReplyCreateInput { comment_id, author, body }`. `CommentItem.replies: ReplyItem[]`. `CommentsStore.createReply(input): Promise<ReplyItem | null>` (null = padre inexistente).
- Extraer `validateAuthor` y `validateBody` de `validateCommentCreate` (mismos límites: author trim 1..60 sin control; body trim 1..2000, regex actual) y reutilizarlos. Exportar `validateReplyCreate(value)`: `comment_id` debe cumplir `UUID_PATTERN` (si no 400 `field:'comment_id'`), luego author, luego body.
- `ensureTable`, encadenado tras el ALTER:
  `CREATE TABLE IF NOT EXISTS comment_replies (id uuid primary key default gen_random_uuid(), comment_id uuid not null references comments(id) on delete cascade, created_at timestamptz not null default now(), author text not null, body text not null)` y `CREATE INDEX IF NOT EXISTS comment_replies_comment_id_idx ON comment_replies (comment_id, created_at)`.
- Helper privado `attachReplies(items)`: si vacío, no consulta; si no, una sola consulta `SELECT id, comment_id, created_at, author, body FROM comment_replies WHERE comment_id = ANY(${ids}::uuid[]) ORDER BY created_at ASC` y agrupa con `Map`. Lo usan `list` y `updateStatus` (PATCH devuelve `replies`). `create` devuelve `replies: []`. No cambies el texto de la consulta de comentarios.
- `createReply`: `INSERT INTO comment_replies (comment_id, author, body) SELECT ${comment_id}::uuid, ${author}, ${body} WHERE EXISTS (SELECT 1 FROM comments WHERE id = ${comment_id}::uuid) RETURNING id, comment_id, created_at, author, body`. Cero filas → null.
- `toReplyItem` con mapeo explícito de campos.

## T2 API (api/comments.ts, solo POST)
Orden: auth (401) → env (500) → `parseJson` (415/403/400) → si el body es objeto y `comment_id` no es undefined ni null: `validateReplyCreate` (400), si no `validateCommentCreate` actual → `takeWriteSlot` (429, mismo cupo) → insert. Réplica: null → 404 `not_found`; ok → 201 `{ id, comment_id, created_at, author, body }` sin `delete_token`. PATCH y DELETE sin cambios de contrato.

## T3 Módulos compartidos de cliente (src/comments/)
- `authorName.ts`: `NAME_STORAGE_KEY = 'bevalk-comment-author'`, `readStoredName`, `writeStoredName`, movidos desde `Review.tsx` (borra las copias).
- `NativeSelect.tsx` + `select.css`: mueve `NativeSelect` de `CommentsPage.tsx` y las reglas `.comments-select*` de `team.css`; el componente importa su CSS para que funcione en ambos bundles (/review y /comments). Acepta `className` extra en el wrapper o el select según necesites para el estilo badge.
- `Replies.tsx` + `replies.css`: `Replies({ commentId, replies, onReplied })`.
  - Lista `<ul className="replies" aria-label="Respuestas">` (no renderizar si vacía): autor en `<strong>`, `<time dateTime>` con el mismo formato de fecha, cuerpo `white-space: pre-wrap`.
  - Formulario en `<details className="replies__form"><summary>Responder</summary>`: `<label>Tu nombre</label>` input maxLength 60 required (inicial `readStoredName`, escribe al cambiar), `<label>Respuesta</label>` textarea maxLength 2000 required, botón `odin-btn odin-btn--primary odin-btn--sm` "Responder", disabled si vacío o enviando. Usa clases Odin de campos como el diálogo de Review.
  - POST `{ comment_id, author, body }`. Errores `role="alert"`: 401 sesión caducada, 429 muchos envíos, 404 "Este comentario ya no existe", otro genérico (mismos textos que existen donde aplique).
  - Tras 201: `onReplied(reply)`, limpia textarea, cierra details, foco al summary, aviso visualmente oculto `role="status"` "Respuesta enviada".
  - Textarea `onKeyDown`: Escape con texto → `stopPropagation()` (no cerrar el popover y perder el borrador).

## T4 /review (src/review/Review.tsx, review.css)
- Guarda `role` del GET (hoy se descarta). `ReviewComment.replies`; lee `item.replies ?? []`.
- Sustituye la copia `activeComment` por `activeId` y deriva `activeComment` de `comments`, para que PATCH/réplica se reflejen.
- Popover, orden DOM: cerrar, autor, fecha, cuerpo, fila de estado, `<Replies/>`, fila de acciones (Eliminar a la izquierda, Ver todos a la derecha, `flex-wrap`).
  - Estado: owner → `NativeSelect` estilo badge (conserva colores `review-popover__status--{status}`, chevron con margen, `:focus-visible` visible) con `aria-label={`Estado de ${author}`}`, disabled mientras guarda; PATCH ok → actualiza `comments` (el pin cambia de clase al instante); error → `role="alert"` en el popover. Team → `StatusLine` actual.
  - Eliminar si `role === 'owner' || deleteTokenFor(id)`: botón `odin-btn odin-btn--outline odin-btn--sm` con `Trash2` + "Eliminar". Confirmación inline como en `/comments`: "¿Eliminar este comentario?", "Sí, eliminar" (destructive), "No" (foco inicial; devuelve foco a Eliminar). DELETE `{id, token?}`; 200/404: quitar del array, `forgetDeleteToken`, cerrar popover, limpiar `highlightId` si coincide, anunciar "Comentario eliminado" en un `role="status"` visualmente oculto fuera del aside, foco al toggle. 403/429/otro: alert en el popover con los textos de `CommentsPage`.
- `popoverPosition`: el popover debe caber entero en el viewport (incluido 375x812): limita `top` y devuelve `maxHeight` inline; `.review-popover` con `overflow-y:auto`. Sin cambios de z-index.

## T5 /comments (src/team/CommentsPage.tsx, team.css)
- `CommentItem.replies`; importa `NativeSelect` del módulo compartido; `<Replies/>` tras el cuerpo de la tarjeta y antes del footer; `onReplied` actualiza el estado del padre. Quita de `team.css` las reglas movidas.

## T6 Tests y versión
- `tests/unit/comments.test.ts`: harness responde a CREATE TABLE/INDEX de comment_replies, `INSERT INTO comment_replies` (vacío para id inexistente) y `FROM comment_replies WHERE`. Casos: `validateReplyCreate` (ok, comment_id, author 61, body 2001, control char); CREATE con `on delete cascade` e índice; POST réplica team y owner 201 sin `delete_token`; 404 id inexistente (no 500); 429 sin INSERT; body con `comment_id` y `screen/x/y` se trata como réplica; GET con `replies`, una sola consulta a comment_replies con `ANY(` y sin ids literales; GET vacío sin consulta a comment_replies; PATCH devuelve `replies`.
- `tests/e2e/review.js`: fixture con `replies: []`; mock POST ramifica por `comment_id` (404 si no hay padre). Añade:
  1. Team en /review: abre el pin, popover `complementary` "Comentario de Ana"; combobox "Estado de Ana" count 0; "Eliminar" count 1. Responder: summary, textarea "Respuesta", botón "Responder"; texto de la réplica visible; `postPayload.comment_id === createdId`; axe sobre `.review-popover`. Escape cierra.
  2. 375x812: abrir pin, bbox del popover dentro del viewport. Vuelve a 1440x1000. Control negativo antes de dar por bueno el assert.
  3. Owner en `/review.html?c=<id>`: `selectOption('done')` en "Estado de Ana"; el pin pasa a `review-pin--done`.
  4. /comments (flujo actual intacto) + responder en la tarjeta de Luis como owner, axe sobre la tarjeta.
  5. Owner en /review: Eliminar → foco en "No" → "Sí, eliminar" → popover y pin desaparecen, status "Comentario eliminado", foco en "Comentar".
- `CHANGELOG.md`: `## [1.5.0] - 2026-10-27`, Added: "Respuestas a comentarios desde el popover de `/review` y desde `/comments`, para owner y equipo." y "Cambiar el estado y eliminar un comentario desde su propio popover en `/review`." `package.json` y `package-lock.json` a 1.5.0.

## Entrega
Ejecuta y reporta números: `npx tsc --noEmit -p .`, `npm test`, `npm run check-middleware-esm`, `npm run build`, y con `npm run preview` en marcha `npm run e2e:review` (si falta Chromium de Playwright usa `LAB_CHROMIUM_EXECUTABLE`). Lista de archivos tocados. Si algo del plan choca con el código real, para y explícalo en vez de improvisar.
