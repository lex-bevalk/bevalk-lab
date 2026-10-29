# Plan · changelog, acceso por contraseña y comentarios (blueprint de Fable, validado por Claude 26 oct 2026)

Decisiones del usuario: dependencias y Neon aprobados, seguir en Hobby, modo comentario en `/review` (ver `tasks/todo.md`, autorización 14).

## Principio
Alcance: este principio rige solo para changelog, acceso y comentarios. El dropdown de los selectores (`tasks/archive/codex-f5.md`) es otro cambio aprobado que sí modifica `/` mediante divergencias declaradas en los generadores.
`/` no se toca: ni `index.html`, `main.tsx`, `Host.tsx`, `main.css`, `LabLogic.ts`, el conversor ni `src/ui/generated/**`. Todo lo nuevo son archivos
nuevos (`middleware.ts`, `api/`, `review.html`, `team.html`, `src/review/`, `src/team/`, `CHANGELOG.md`) más ediciones mínimas en `vercel.json`,
`vite.config.ts` (`rollupOptions.input`, `define`), `tsconfig.json` (`include`) y `package.json`. La CI corre contra `vite preview`, donde
`middleware.ts` y `api/*` no existen: su gate es un Preview de Vercel.

## F1 · Acceso
- Routing Middleware (`middleware.ts`, Node.js; verificado en docs: todos los planes, frameworks no Next, `next()` de `@vercel/functions`)
  protegiendo todo el sitio, incluidos `/assets/*` y `/api/*`. Excepción: `GET/POST /login`, servido por el propio middleware (un campo, sin JS).
- Uso (usuario, 26 oct 22:55): passwall simple contra miradas indiscretas. Los compañeros reciben enlace + contraseña; sin registro, sin
  miembros en Vercel, sin cambiar de plan. Comentarios también sin registro (solo nombre en el modal).
- Pantalla `/login` con marca BeValk (petición del usuario): dos columnas 50/50. Izquierda: "BeValk · Product Experience Lab", bullets de
  valor (hechos del producto, sin claims inventados; el usuario revisa el copy) y algo más de contexto. Derecha: logo
  (`public/assets/77effca3e02e95da2e7019fa1e4a6fea.png`, el de la bienvenida), "Introduce la contraseña", input y CTA "Acceder". Tokens Odin y
  Guton; en móvil se apila. Estados: error "Contraseña incorrecta" (y aviso de demasiados intentos), envío deshabilitando el botón, `label`
  accesible, `autocomplete="current-password"`, foco inicial en el input, contraste AA. El middleware deja pasar solo los recursos que usa el
  login (CSS, fuente y logo), nunca el JS del prototipo. Revisión de diseño con capturas a 1440/1024/375 antes del merge.
- Cookie `HttpOnly; Secure; SameSite=Lax`, HMAC con `crypto.subtle`, 30 días. `TEAM_PASSWORD` → `role=team`; `OWNER_PASSWORD` → `role=owner`;
  `SESSION_SECRET` firma (rotarlo invalida sesiones). Env vars Sensitive, nunca en el repo.
- Fuerza bruta: passphrase de 24+ caracteres, comparación en tiempo constante, 1,5 s de espera en fallo, contador por IP en Neon
  (`rate_limit`, 10 intentos / 10 min). Las funciones `api/*` revalidan la cookie y comprueban `Origin` en mutaciones.
- Gate en Preview (curl): sin cookie 302 a `/login` en `/`, `/assets/*`, `/api/*`; contraseña mala 401 con retardo; buena 303 + cookie.
  Merge y **después** Deployment Protection a Standard (al revés habría una ventana con el sitio abierto). Rollback: All Deployments.

## F2 · Changelog
- `CHANGELOG.md` (Keep a Changelog + SemVer; `## [1.0.0] - 2026-10-26` = porte con paridad verificada), `?raw` + parser propio del subconjunto
  (`## [x.y.z] - fecha`, `### Added/Changed/Fixed`, `- item`). `team.html` + `src/team/main.tsx` elige por `location.pathname` entre `/changelog`,
  `/comments` y 404. `vercel.json` rewrites `/changelog`, `/comments` → `/team.html`, `/review` → `/review.html`. `package.json` 1.0.0 y
  `__APP_VERSION__`. Test Vitest: la primera versión del changelog = `package.json`.
- Proceso: cada PR de producto añade su línea bajo `## [Unreleased]`.
- Gate: build sin avisos, tsc, Vitest, `/changelog` en Preview y CI `qa` completa al 100% en `/`.

## F3 · Comentarios
- Neon Postgres vía `vercel integration add neon`. Tablas `comments(id uuid pk, created_at, updated_at, author ≤60, body ≤2000, screen, tpl,
  x real, y real, flow, plan, status in ('todo','in_progress','done','wont_do') default 'todo')` y `rate_limit(key pk, hits, reset_at)`.
- `api/comments.ts`: GET `{role, items}` con filtros; POST crea (team u owner); PATCH `status` solo owner (403 si team). Validación en servidor
  (longitudes, `x,y` en [0,1], status en lista blanca, `screen` dentro de las 28 etiquetas, sin caracteres de control). Sin `dangerouslySetInnerHTML`.
- `review.html` = `/src/main.tsx` tal cual + `/src/review/main.tsx` en un segundo root. Botón flotante fuera de `.lab`; capa sobre `.tp-phone`;
  `(x,y)` como fracción del `[data-screen-label]` visible; guarda `label + data-dc-tpl`, `flow` y `plan`. Modal Odin (nombre recordado en
  localStorage, textarea, Enviar). Pins recalculados con ResizeObserver, color por estado.
- `/comments`: filtros por pantalla, estado y autor; "Ir" con `labSelect(flow)`; select de estado solo para owner.
- Gate: el de F2 + prueba en Preview con los dos roles, 403/400 esperados, 0 errores de consola en `/review`. Sale como 1.1.0.

## Riesgos
CSRF con cookie Lax (mitigado con `Origin` + JSON); desfase de pins si cambia el layout (se guarda `tpl` y versión); nuevas entradas de Vite
pueden crear un chunk compartido (cambia hashes, no el DOM); `vite preview` sirve `/team.html`, no `/changelog`.
