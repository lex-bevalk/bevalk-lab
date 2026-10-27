# Codex · F2 · Página `/changelog`

## Contexto
Repo `C:\Users\lexsa\Desktop\bevalk-lab`, rama `feat/changelog` (desde `main`). No cambies de rama, no hagas commit ni push. Sin red y sin
dependencias nuevas. No escribas en `dist/` (compila con `npx vite build --outDir <tmp fuera del repo>`). No toques Vercel ni GitHub. No
ejecutes servidores ni la batería e2e/visual: Claude la corre. Lee `tasks/plan-equipo.md` (F2) y `CHANGELOG.md` (lo escribió Claude; es
contenido, no lo cambies salvo error de formato que rompa el parser, y en ese caso dilo).

## Regla de oro
`/` no cambia: no toques `index.html`, `src/main.tsx`, `src/Host.tsx`, `src/styles/main.css`, `src/logic/**`, `src/ui/**`, `src/data/**`, los
generadores, `login.html`, `src/login/**`, `middleware.ts` ni `server/**`. El middleware ya protege toda ruta salvo `/login` y sus recursos, así
que `/changelog` y sus assets exigen sesión sin tocar nada.

## Tareas
1. `team.html` (raíz, nueva entrada `team` en `rollupOptions.input`) + `src/team/main.tsx` + `src/team/Changelog.tsx` + `src/team/changelog.ts`
   + `src/team/team.css`. `team.html`: `lang="es"`, `<meta name="robots" content="noindex">`, `theme-color` `#4900AC`, `<title>Versiones · BeValk
   Product Experience Lab</title>`. En F3 esta misma página servirá `/comments`; por ahora `main.tsx` renderiza siempre el changelog (sin router).
2. `vercel.json`: añade el rewrite `/changelog` → `/team.html`; conserva lo existente.
3. `src/team/changelog.ts`: importa `CHANGELOG.md` con `?raw` y exporta un parser puro del subconjunto que usa el archivo: `## [Unreleased]`,
   `## [x.y.z] - AAAA-MM-DD`, `### Added|Changed|Deprecated|Removed|Fixed|Security`, `- item`; ignora el título `#`, el párrafo de cabecera y
   líneas en blanco. Cualquier otra línea dentro de una versión lanza un error con el número de línea (así un changelog mal escrito rompe el
   test, no la página). Devuelve `{ version, date, sections: { type, items }[] }[]` en el orden del archivo; `Unreleased` sin items se omite.
   Tipo para `?raw` si `tsc` lo pide (`vite/client` ya da `*?raw`; compruébalo antes de añadir nada).
4. `Changelog.tsx` + `team.css`, diseño con marca BeValk coherente con `/login` (mismos tokens Odin de `src/styles/odin/tokens/*`, Guton para
   títulos con el mismo `@font-face` que `src/login/login.css`; puedes importar `src/styles/odin/components/display/display.css` para
   `.odin-badge`). Sin Tailwind, sin CSS-in-JS, sin `dangerouslySetInnerHTML`:
   - Cabecera: logo `/assets/77effca3e02e95da2e7019fa1e4a6fea.png` (alt "BeValk", ~28 px de alto) + "Product Experience Lab"; a la derecha
     enlace "Ir al prototipo" a `/`.
   - `<main>` de ancho máximo ~720 px centrado: `h1` "Versiones" (Guton) y entradilla "Qué cambia en cada versión del Lab.".
   - Una `<article>` por versión: `h2` "v1.1.0" (Guton), `<time dateTime="2026-10-27">` con la fecha en español ("27 oct 2026", con
     `Intl.DateTimeFormat('es-ES', { timeZone: 'UTC' })`), y en la más reciente publicada un `.odin-badge .odin-badge--default` "Actual".
     `Unreleased`, si tiene items, se titula "Próxima versión" sin fecha. Secciones con `h3`: Added "Añadido", Changed "Cambiado",
     Deprecated "Obsoleto", Removed "Eliminado", Fixed "Corregido", Security "Seguridad". Items en `<ul>`; el texto entre backticks se
     pinta como `<code>`. Separación clara entre versiones.
   - 16 px de margen lateral en móvil, sin scroll horizontal a 320 px, contraste AA, foco visible en el enlace con los tokens de Odin.
5. `package.json`: `"version": "1.1.0"`.
6. Test Vitest `tests/unit/changelog.test.ts`: el `CHANGELOG.md` real parsea; la primera versión publicada (no `Unreleased`) es igual a la
   `version` de `package.json`; versiones en orden SemVer descendente sin duplicados; fechas ISO válidas y no crecientes; cada versión publicada
   tiene al menos un item. Más casos del parser con texto de ejemplo: línea inválida lanza error con su número; `Unreleased` vacío se omite;
   tipo de sección desconocido lanza error.

## Gate (pega los números)
- `npx tsc --noEmit -p .` 0; `npm test` verde (132 previos + los nuevos); `npm run check-middleware-esm` OK.
- Build temporal sin avisos; `node tools/check-login-assets.mjs <tmp>` OK; lista de archivos de `<tmp>/assets` y, comparado con `main`
  (`index-DgUVklkV.js`, `index-CvLjGx0_.css`, `react-vendor-BdZgHC1P.js`, `login-BdGQudE4.js`, `login-BXKGB0Lv.css`), di si algún nombre cambia
  y por qué. Si cambia `index-*.js`, para y reporta.
- `git diff --stat` sin cambios en los archivos de la regla de oro.

## Para y reporta si
Hace falta una dependencia, tocar la regla de oro, o el hash de `index-*.js` cambia.

## Entregable
Archivos, números del gate, desviaciones y dudas. Sin commits.
