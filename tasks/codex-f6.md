# Codex · F1 · Passwall con pantalla de login de BeValk

## Contexto
Worktree `C:\Users\lexsa\Desktop\bevalk-lab-passwall`, rama `feat/passwall` (desde `main`). No cambies de rama, no hagas commit ni push. Sin red:
Claude ya instaló y fijó `@vercel/functions@3.9.11`, `@neondatabase/serverless@1.2.0` y `@types/node@24.19.2` (dev). Ninguna otra dependencia.
No escribas en `dist/` (compila con `npx vite build --outDir <tmp fuera del repo>`). No toques Vercel ni GitHub. No añadas
`--configLoader runner` a `package.json`. No ejecutes servidores ni la batería e2e/visual (el equipo anda corto de memoria): Claude la corre.
Lee `tasks/plan-equipo.md` (F1) y `tasks/todo.md` (autorizaciones 12-14). Hechos verificados por Claude en la documentación de Vercel:
Routing Middleware está en todos los planes, vale para proyectos no Next con el archivo `middleware.ts` en la raíz, usa Node.js y con la
convención de archivo hay que exportar `config.runtime = 'nodejs'`; para dejar pasar la petición se usa `next()` de `@vercel/functions`.

## Objetivo
Passwall simple contra miradas indiscretas para todo el sitio: los compañeros reciben enlace y contraseña; sin registro. Dos contraseñas en env
vars Sensitive de Vercel (las introduce el usuario): `TEAM_PASSWORD` → `role=team`, `OWNER_PASSWORD` → `role=owner`; `SESSION_SECRET` firma la
cookie. `DATABASE_URL` (Neon) ya existe en el proyecto.

## Regla de oro
`/` no cambia: no toques `index.html`, `src/main.tsx`, `src/Host.tsx`, `src/styles/main.css`, `src/logic/**`, `src/ui/**`, `src/data/**` ni los
generadores. La CI corre contra `vite preview`, donde el middleware no existe: la paridad debe seguir al 100%.

## Tareas
1. `middleware.ts` (raíz): `export const config = { runtime: 'nodejs' }`. Lógica en módulos puros y testeables bajo `server/` (p. ej.
   `server/session.ts`, `server/passwall.ts`, `server/rate-limit.ts`), el middleware solo los compone.
   - Sesión: cookie `bvl_session` = payload `{role, exp}` + firma HMAC-SHA256 con `crypto.subtle` y `SESSION_SECRET`; `HttpOnly; Secure;
     SameSite=Lax; Path=/; Max-Age=2592000` (30 días). Verificación en tiempo constante; firma o `exp` inválidos = sin sesión.
   - Rutas públicas (sin sesión): `GET/HEAD /login` y SOLO los recursos que usa la página de login (su JS/CSS de Vite, la fuente Guton y el logo
     `/assets/77effca3e02e95da2e7019fa1e4a6fea.png`). Nunca el JS del prototipo. Define la allowlist de forma explícita y comprobable.
   - `POST /login` (form urlencoded, campo `password`, campo oculto `next`): compara en tiempo constante con `OWNER_PASSWORD` y `TEAM_PASSWORD`
     (owner primero). Correcta → 303 a `next` (solo rutas relativas que empiezan por `/` y no por `//`; si no, `/`) con la cookie. Incorrecta →
     espera 1,5 s y 303 a `/login?error=1&next=…`. Si falta alguna env var → 500 con texto genérico (nunca filtres nombres ni valores).
   - Límite de intentos: por IP (`x-forwarded-for`, primer valor; si no, `x-real-ip`), 10 fallos / 10 min en Neon, tabla
     `rate_limit(key text primary key, hits int not null, reset_at timestamptz not null)` creada de forma perezosa con `CREATE TABLE IF NOT EXISTS`
     la primera vez. Superado → 303 a `/login?error=rate&next=…` sin comprobar la contraseña. Un acierto borra el contador. El almacén se inyecta
     (interfaz pequeña) para poder testearlo en memoria. Marca con `ponytail:` el techo (sin reglas WAF en Hobby).
   - Sin sesión: peticiones a `/api/*` → 401 JSON `{"error":"unauthorized"}`; el resto → 302 a `/login?next=<ruta original>`.
   - Con sesión: `next()`. Añade la cabecera de petición `x-bvl-role` solo si es trivial con `next({ request: { headers } })`; si no, omítelo.
2. Página `login.html` (raíz, nueva entrada de Vite en `rollupOptions.input` junto a `index.html`) + `src/login/main.ts` + `src/login/login.css`.
   `vercel.json`: rewrite `/login` → `/login.html` (y conserva cabeceras existentes). Formulario `method="post" action="/login"` que funciona sin
   JS; el JS solo lee `?error` y `?next` (rellena el campo oculto), muestra el mensaje y deshabilita el botón al enviar.
   Diseño (petición del usuario): dos columnas 50/50 a pantalla completa, marca BeValk con tokens Odin (`src/styles/odin/tokens/*`, fuente Guton
   para títulos), sin Tailwind ni CSS-in-JS:
   - Izquierda (fondo de marca, p. ej. `--color-primary` o su degradado con los tokens existentes): eyebrow "BEVALK · PRODUCT EXPERIENCE LAB",
     título "El prototipo de BeValk, listo para revisar", párrafo "Navega los flujos de la app, compara Freemium y Premium y pon a prueba
     cada caso antes de construirlo." y 3 bullets con icono: "30 flujos en 8 grupos funcionales, de la primera apertura a Mi Familia",
     "Freemium y Premium, lado a lado", "62 casos extremos ejecutables". Pie pequeño: "Acceso restringido al equipo de BeValk".
   - Derecha (fondo claro): logo (`/assets/77effca3e02e95da2e7019fa1e4a6fea.png`, alt "BeValk", ~120 px de ancho), título
     "Introduce la contraseña", `<label>` "Contraseña" asociado al `<input type="password" autocomplete="current-password" required autofocus>`,
     botón primario "Acceder" a ancho completo (≥44 px de alto). Errores en `role="alert"`: `error=1` → "Contraseña incorrecta. Inténtalo de
     nuevo."; `error=rate` → "Demasiados intentos. Espera unos minutos y vuelve a probar.". Foco visible con los tokens de foco de Odin.
   - Responsive: <900 px se apila (marca arriba, compacta; formulario debajo), sin scroll horizontal a 320 px. Contraste AA.
   - `<meta name="robots" content="noindex">`, `<title>Acceso · BeValk Product Experience Lab</title>`, `lang="es"`.
3. `tsconfig.json`: incluye `middleware.ts` y `server` (y tipos de Node solo donde hagan falta); `tsc --noEmit -p .` debe cubrirlos.
4. Tests Vitest en `tests/unit/passwall.test.ts`: firma y verificación (válida, manipulada, caducada, secreto distinto); `next` seguro (`//evil`,
   `https://…`, vacío); allowlist (login y sus assets públicos; `/`, `/assets/index-*.js`, `/api/x` protegidos); rate limit en memoria (10 fallos
   bloquean, acierto resetea, ventana caduca); POST correcto/incorrecto para team y owner con env simulado (sin esperar 1,5 s reales: inyecta el
   retardo). Además, un test que lea el `dist` de un build temporal NO es necesario; en su lugar, un script `tools/check-login-assets.mjs` que,
   dado un directorio de build, compruebe que todo recurso referenciado por `login.html` y su CSS está en la allowlist y que ningún JS de
   `index.html` lo está. Script `check-login-assets` en `package.json`.

## Gate (pega los números)
- `npx tsc --noEmit -p .` 0; `npm test` verde (los 118 previos + los nuevos); build temporal sin avisos; `node tools/check-login-assets.mjs <tmp>`
  OK; el `index.html` del build sigue referenciando los mismos nombres de chunk o, si cambian por la nueva entrada, dilo y explica por qué.
- `git diff --stat` sin cambios en los archivos de la regla de oro.

## Para y reporta si
Hace falta otra dependencia, tocar algo de la regla de oro, o la convención `middleware.ts` no encaja con Vite según los tipos de
`@vercel/functions`.

## Entregable
Archivos, números del gate, desviaciones y dudas. Sin commits.
