# Codex F10 · v1.4.0: chevrons en /comments, borrar comentarios, botón Comentar bajo el móvil

Rama: `feat/borrar-comentarios` (ya creada desde main). No hagas commit ni push; Claude verifica y commitea.

## Reglas
- No tocar `handoff/`, `src/styles/odin/**`, `src/ui/generated/**`, `src/logic/LabLogic.ts`, `src/styles/main.css`, `src/ui/OptSelect.tsx`.
- Sin dependencias nuevas. Iconos solo de `lucide-react`. Sin Tailwind ni CSS-in-JS. Imports relativos de `api/` y `server/` con extensión `.js` (ESM).
- Sin `window.confirm`/`alert`. `localStorage` siempre en try/catch.
- Locators e2e con `exact: true`; para pasar a un mock anterior, `route.fallback()`.

## T1 Chevron (src/team/CommentsPage.tsx, src/team/team.css)
- Componente local `NativeSelect` para los 3 `<select>` (filtros Pantalla y Estado, y el de estado del owner):
  `<span class="comments-select"><select class="odin-select__trigger" ...props/><ChevronDown class="odin-select__chev" size={16} aria-hidden="true"/></span>`.
- CSS: `.comments-select{position:relative;display:block;color:var(--color-text-body)}`;
  `.comments-select select{appearance:none;-webkit-appearance:none;padding-right:36px}`;
  chevron `position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none`;
  `.comments-select select:disabled + .odin-select__chev{opacity:var(--state-disabled-opacity)}`.
- Especificidad: la regla existente `.comments-status-control .odin-select__trigger{padding:6px 10px}` pisa el padding derecho: añade ahí `padding-right:36px`. En `.comments-status-control` el wrapper va `display:inline-block`.

## T2 Servidor (server/comments.ts, api/comments.ts, tools/check-middleware-esm.mjs)
- `ensureTable`: tras el CREATE, `ALTER TABLE comments ADD COLUMN IF NOT EXISTS delete_token_hash text`.
- `CommentsStore`: `create(input, deleteTokenHash: string)`, `deleteTokenHash(id): Promise<string | null | undefined>` (undefined = no existe), `remove(id): Promise<boolean>` (hard delete, `DELETE ... RETURNING id`).
- `toCommentItem` con mapeo explícito de campos (sin spread): el hash nunca sale. Las SELECT/RETURNING de list/create/updateStatus no incluyen `delete_token_hash`.
- Exportar `UUID_PATTERN` (mover el regex de PATCH), `validateCommentDelete(value)` que devuelve `{ id, token: string | null }` (token opcional, `/^[0-9a-f]{64}$/i`; inválido: 400 `field: "token"`; id inválido: 400 `field: "id"`), y `equalHex(a, b)` en tiempo constante (comprobar longitud, XOR acumulado).
- `api/comments.ts`: extraer `sha256Hex(text)` de `writeRateLimitKey` y reutilizarlo.
  - POST: token = 32 bytes de `crypto.getRandomValues` en hex; guarda `sha256Hex(token)`; responde 201 `{ ...item, delete_token: token }`.
  - DELETE, en este orden: auth (401), `parseJson` (415/403), `validateCommentDelete` (400), team sin token 403, `takeWriteSlot` (429) antes de cualquier consulta, `deleteTokenHash(id)`: undefined 404; si team: hash null o `!equalHex(hash, sha256Hex(token))` 403; `remove(id)`; 200 `{ id }` con el helper `json()`. Owner borra cualquiera sin token. 500 genérico en excepciones.
  - Exportar `DELETE` como los demás handlers.
- `tools/check-middleware-esm.mjs`: comprobar también el export `DELETE`.

## T3 Cliente borrado
- Nuevo `src/comments/deleteTokens.ts`: `rememberDeleteToken(id, token)`, `deleteTokenFor(id)`, `forgetDeleteToken(id)`; clave `bevalk-comment-delete-tokens`, objeto JSON, todo en try/catch.
- `src/review/Review.tsx` `submitComment`: separa `delete_token` del item, `rememberDeleteToken(item.id, delete_token)` y guarda el item sin token.
- `CommentsPage`: `canDelete = owner || Boolean(deleteTokenFor(item.id))`. En el footer de la tarjeta, botón "Eliminar" (`odin-btn odin-btn--outline odin-btn--sm`, icono `Trash2`, texto visible "Eliminar"; no pongas un aria-label distinto del texto visible; si hace falta distinguir tarjetas, `aria-describedby` hacia el autor).
  - Confirmación inline en la tarjeta: texto "¿Eliminar este comentario?" + "Sí, eliminar" (`odin-btn odin-btn--destructive odin-btn--sm`) + "No" (outline, devuelve el foco a "Eliminar"). Al abrir, foco en "No".
  - DELETE `/api/comments` con JSON `{ id, token }` (token solo si existe). 200 o 404: quitar de la lista, `forgetDeleteToken`, aviso `role="status"` "Comentario eliminado" en `.comments-notice`, foco al aviso. 403/429/500: error inline en la tarjeta.

## T4 Toggle "Comentar" bajo el móvil (src/review/Review.tsx, src/review/review.css)
- `labFit` escala el móvil a la altura del stage, sin hueco debajo. Reserva espacio solo en review.css:
  `@media (min-width:1280px){ #root .lab-c > :has(.tp-phone){ margin-bottom:64px } }` (index.html no carga review.css; la paridad no cambia). El ResizeObserver de `labStage` reescala. Verifica en el DOM real que ese selector apunta al stage observado; si no, elige el contenedor correcto y explícalo.
- `useVisibleScreen` (ya mide `.tp-phone`) expone además `phoneLeft`, `phoneWidth`, `phoneBottom`.
- En 1280 px o más, si `phoneWidth > 0` y `phoneBottom + 56 <= innerHeight`: style inline `left: phoneLeft + phoneWidth/2`, `top: phoneBottom + 8` y clase `review-toggle--anchored{bottom:auto;transform:translateX(-50%)}`. Si no, el fallback actual sin style inline.
- 1024-1279 px: el pill pasa de `left:16px` a `right:16px` para no pisar `.lab-a`. Menos de 1024 px sin cambios.
- Sin cambios en z-index, `toggleRef`, etiquetas "Comentar"/"Cancelar" ni retorno de foco.

## T5 Tests y versión
- `tests/unit/comments.test.ts`: el harness SQL responde a `ALTER TABLE` ([]), `SELECT delete_token_hash` (hash conocido; [] para un id inexistente) y `DELETE FROM comments`; INSERT devuelve fila con `delete_token_hash` para probar que el 201 no lo incluye. DELETE: 401, 415, 403 origen, 400 id, 400 token, team sin token 403, token erróneo 403, token correcto 200, owner sin token 200, 404, 429 (sin SQL DELETE ejecutado). POST 201 incluye `delete_token` de 64 hex y no `delete_token_hash`. GET: JSON sin `delete_token_hash`. `validateCommentDelete`, `equalHex`.
- `tests/e2e/review.js`: el mock POST devuelve `delete_token`; DELETE en el mock (comprueba token o rol); siembra un segundo comentario de "Luis" con otro id antes de ir a /comments.
  - Team: "Eliminar" solo en la tarjeta propia (locators dentro de `[data-comment-id="..."]`), abre confirmación, axe sobre la tarjeta con la confirmación abierta, confirma, la tarjeta desaparece y aparece "Comentario eliminado".
  - Owner: "Eliminar" visible en ambas tarjetas.
  - /review a 1440x1000: la caja del toggle queda bajo la del móvil (`toggle.y >= phone.y + phone.height`), solapa horizontalmente con el móvil y no intersecta `aside[aria-label="Flujos del prototipo"]`.
- `CHANGELOG.md`: `## [1.4.0] - 2026-10-27` con Added "Borrar comentarios: el autor los suyos desde su navegador y el owner cualquiera.", Changed "El botón Comentar está bajo el móvil del prototipo.", Fixed "Los selectores de `/comments` muestran el chevron con su margen." `package.json` y `package-lock.json` a 1.4.0.

## Entrega
Ejecuta y reporta números: `npx tsc --noEmit -p .`, `npm test`, `npm run check-middleware-esm`, `npm run build`, y con `npm run preview` en marcha `npm run e2e:review`. Lista de archivos tocados. Si algo del plan choca con el código real, para y explícalo en vez de improvisar.
