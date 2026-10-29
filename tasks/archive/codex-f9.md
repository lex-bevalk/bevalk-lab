# Codex · F3 · Comentarios: `/review`, `/comments` y `api/comments`

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/comments` (desde `main`, ya con passwall y `/changelog`). No cambies de rama, no hagas
commit ni push. Sin red y sin dependencias nuevas (`@neondatabase/serverless`, `@vercel/functions` y `@types/node` ya están). No escribas en
`dist/` (compila con `npx vite build --outDir <tmp fuera del repo>`). No toques Vercel ni GitHub. No ejecutes servidores ni la batería
e2e/visual: Claude la corre. Lee `tasks/plan-equipo.md` (F3), `tasks/lessons.md` (ESM en Vercel), `middleware.ts`, `server/*`, `team.html`,
`src/team/*` y `tests/unit/passwall.test.ts` antes de empezar.

Uso (usuario): los compañeros reciben enlace y contraseña, sin registro. En `/review` marcan una zona del móvil y dejan nombre y comentario;
el dueño (rol `owner`) cambia estados en `/comments`. Todo con marca BeValk y tokens/componentes Odin, sin Tailwind ni CSS-in-JS, sin
`dangerouslySetInnerHTML`.

## Regla de oro
`/` no cambia: no toques `index.html`, `src/main.tsx`, `src/Host.tsx`, `src/styles/main.css`, `src/logic/**`, `src/ui/**`, `src/data/**`, los
generadores, `login.html`, `src/login/**` ni `middleware.ts`. `/review` reutiliza el prototipo tal cual (mismo `src/main.tsx`) y añade una
segunda raíz React encima; lee el estado solo a través de `window.__lab` (lo usan ya los tests de `tests/e2e`).

## Hechos verificados por Claude
- Funciones Vercel en `api/*.ts` para proyectos sin framework: exporta handlers web estándar con nombre de método,
  `export async function GET(request: Request): Promise<Response>` (igual `POST`, `PATCH`). Node.js por defecto.
- Vercel compila cada archivo por separado y el repo es ESM: imports relativos con extensión `.js` (`../server/session.js`). Lección en
  `tasks/lessons.md`; amplía `tools/check-middleware-esm.mjs` (o un script hermano `check-api-esm`) para que también importe `api/comments.ts`
  transpilado y falle si un import relativo no resuelve. Añade el script a `package.json` y Claude lo meterá en la CI.
- El middleware ya exige sesión en todo salvo `/login`: sin cookie, `/api/*` da 401 y el resto 302 a `/login`. Las funciones igualmente
  revalidan la cookie (defensa en profundidad) con `verifySession` de `server/session.ts` y `SESSION_SECRET`.

## Tareas
1. Datos (Neon, `DATABASE_URL`). Módulo `server/comments.ts` con lógica pura y SQL inyectable (mismo patrón que `server/neon-rate-limit.ts`):
   tabla creada de forma perezosa con `CREATE TABLE IF NOT EXISTS comments (id uuid primary key default gen_random_uuid(), created_at
   timestamptz not null default now(), updated_at timestamptz not null default now(), author text not null, body text not null, screen text
   not null, tpl text, x real not null, y real not null, flow text, plan text, status text not null default 'todo' check (status in
   ('todo','in_progress','done','wont_do')))`. Consultas siempre parametrizadas con el template de `neon`. Listado con `LIMIT 500`, orden
   `created_at desc`, filtros opcionales `screen`, `status`, `author`.
2. Validación en servidor (función pura testeable): `author` 1-60 y `body` 1-2000 tras `trim`; sin caracteres de control (en `body` se permite
   `\n`); `x`,`y` números finitos en [0,1]; `screen` dentro de la lista blanca de etiquetas `data-screen-label` del prototipo (constante
   exportada, extraída de `src/ui/generated/**`; si se puede, un test comprueba que la lista coincide con lo que hay en esos archivos);
   `tpl`, `flow`, `plan` cadenas cortas opcionales (`plan` en `free|premium` o los valores reales que use el Lab); `status` en la lista blanca.
   Campos desconocidos se ignoran. Errores → 400 `{"error":"invalid","field":"…"}`.
3. `api/comments.ts`: `GET` → `{ role, items }`; `POST` crea (team u owner) → 201 con el item; `PATCH` `{id, status}` solo owner (team → 403)
   → 200 con el item o 404. En `POST`/`PATCH`: exige `Content-Type: application/json` (415 si no) y `Origin` igual al origen de la petición
   (403 si falta o no coincide). Límite de escritura por IP (reusa `RateLimitStore`/Neon con prefijo de clave propio, 30 escrituras / 10 min,
   429 al superarlo). Sin sesión válida → 401. Falta de env vars → 500 genérico. Respuestas JSON con `Cache-Control: no-store`. Nunca
   devuelvas detalles internos de errores de base de datos.
4. `/review`: `review.html` (raíz, entrada `review` en `rollupOptions.input`) = mismo `<head>`/`<body>` que `index.html` + un segundo
   `<script type="module" src="/src/review/main.tsx">` y un contenedor propio fuera de `#root`. `vercel.json`: rewrite `/review` →
   `/review.html`. UI (`src/review/*`):
   - Botón flotante abajo a la derecha, fuera de `.lab`, "Comentar" (icono de lucide-react ya instalado), que activa el modo comentario
     (estado visible en el botón: "Cancelar"). En modo comentario, una capa sobre `.tp-phone` con cursor de cruz; clic dentro de la pantalla
     visible (`[data-screen-label]` visible dentro de `.tp-phone`) guarda `(x,y)` como fracción de su rectángulo, la etiqueta, `data-dc-tpl` si
     existe, y el flujo y plan actuales leídos de `window.__lab`. Escape sale del modo.
   - Modal Odin (los componentes de overlays de `src/styles/odin/components/**`; `role="dialog"`, `aria-modal`, foco atrapado, Escape y
     "Cancelar" cierran, foco vuelve al botón): campo "Tu nombre" (recordado en `localStorage` con try/catch), textarea "Comentario", botón
     "Enviar" deshabilitado mientras envía; errores del servidor visibles en `role="alert"` (401 → "Tu sesión ha caducado. Vuelve a entrar.",
     429 → "Has enviado muchos comentarios seguidos. Espera unos minutos.", otro → "No se pudo guardar el comentario. Inténtalo de nuevo.").
   - Pins numerados de los comentarios de la pantalla visible, posicionados con las fracciones y recalculados con `ResizeObserver` y al cambiar
     de pantalla; color por estado con tokens Odin; clic en un pin abre un popover con autor, fecha, texto, estado (solo lectura) y enlace
     "Ver todos" a `/comments`. Al cargar, `?c=<id>` resalta ese pin; `?flow=…&plan=…` selecciona ese flujo y plan con la API de
     `window.__lab` (`labSelect` u homóloga, descúbrela en `src/logic/LabLogic.ts`).
   - El prototipo debe verse y funcionar igual que en `/` cuando el modo comentario está apagado (la capa no intercepta clics).
5. `/comments`: en `team.html`/`src/team/main.tsx`, si `location.pathname` empieza por `/comments` se renderiza la vista de comentarios; si
   no, el changelog (sin cambiar el changelog). `vercel.json`: rewrite `/comments` → `/team.html`. Misma cabecera que el changelog, con
   enlaces "Versiones" y "Comentarios". Lista con filtros por pantalla, estado y autor; cada comentario muestra autor, fecha, pantalla, flujo y
   plan, texto y estado; "Ir" enlaza a `/review?flow=…&plan=…&c=<id>`. Si `role === 'owner'`, un select Odin de estado por comentario
   (Por hacer, En curso, Hecho, No se hará) que hace `PATCH` y muestra error si falla; para `team`, el estado es un badge. Estados vacío,
   cargando y error.
6. `CHANGELOG.md`: nueva versión `## [1.3.0] - 2026-10-27` con `### Added` (comentarios en `/review` y `/comments`); `package.json` 1.3.0. Si
   al integrar ya existe 1.2.x, mantén el orden SemVer (el test lo comprueba).
7. Tests:
   - Vitest `tests/unit/comments.test.ts`: validación (límites, control chars, x/y fuera de rango, screen fuera de lista, status inválido);
     handlers con SQL y sesión simulados: 401 sin cookie, 415 sin JSON, 403 por `Origin`, 403 PATCH con team, 200 PATCH con owner, 404 id
     inexistente, 429 al superar el límite, 201 POST válido, GET con filtros parametrizados (sin interpolar texto en el SQL).
   - E2E `tests/e2e/review.js` (CommonJS, como los demás de esa carpeta; script `e2e:review`): contra `vite preview` en `/review.html`,
     intercepta `/api/comments` con `page.route` (GET devuelve una lista fija, POST devuelve 201) y comprueba: el botón activa el modo, clic en
     el móvil abre el modal con foco en el nombre, envío llama a POST con `x,y` en [0,1] y la etiqueta de pantalla visible, aparece un pin,
     Escape cierra, axe sin violaciones en el botón, modal y pins, 0 errores de consola. Para `/comments`, sirve `team.html` en la ruta
     `/comments` interceptando la navegación con `page.route` y comprueba el render de la lista, el select de estado con `role: owner` y su
     ausencia con `team`.

## Gate (pega los números)
- `npx tsc --noEmit -p .` 0; `npm test` verde (139 previos + nuevos); `check-middleware-esm` y el chequeo ESM de `api/` OK.
- Build temporal sin avisos; `node tools/check-login-assets.mjs <tmp>` OK; qué assets referencia cada HTML (`index`, `login`, `team`, `review`)
  y si cambia algún hash de `index-*`/`react-vendor-*` respecto a `main` (si cambia, explica por qué).
- `git diff --stat` sin cambios en archivos de la regla de oro.

## Para y reporta si
Hace falta una dependencia, tocar la regla de oro, o la API de `window.__lab` no permite leer pantalla/flujo/plan sin modificar el prototipo.

## Entregable
Archivos, números del gate, desviaciones y dudas. Sin commits.
