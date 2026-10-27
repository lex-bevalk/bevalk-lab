# Lessons

- `npm install` dentro de `handoff/qa` crea `package-lock.json` y rompe la regla de solo lectura de `handoff/`. Usar `npm install --no-package-lock`.
- Cada push a cualquier rama despliega en Vercel (`product-lab`): no pushear sin OK del usuario.
- La batería cuenta warnings de consola como error: verificar contra `npm run preview`, nunca contra `dev`.
- `.gitignore` con `fonts/` (sin `/` inicial) ignora todas las carpetas `fonts/` del árbol, no solo la de la raíz: dejó Guton fuera del repo y Vercel/CI compilaron sin ella. Anclar a la raíz (`/fonts/`) y comprobar con `git check-ignore -v` los assets que el build referencia.
- Verificar que el build de Vercel coincide con el local comparando los hashes de contenido de Vite en el log de Vercel con un build de `git archive` (el árbol local en Windows tiene CRLF y archivos no versionados).
- Vercel Authentication en `all_except_custom_domains` NO protege el alias de producción `<proyecto>.vercel.app`: responde 200 público. Comprobar la cobertura con `curl -sI` sobre cada alias, no deducirla de `ssoProtection`.
- Routing Middleware de Vercel sin framework: el `package.json` raíz debe declarar `"type": "module"` o el `middleware.js` compilado falla al cargar (500 MIDDLEWARE_INVOCATION_FAILED). Vitest y `vite preview` no lo detectan: el middleware solo se prueba de verdad en un Preview de Vercel. Los scripts CommonJS quedan aislados con `tests/e2e/package.json` `{"type":"commonjs"}`.
- Con `"type": "module"` en la raíz, `handoff/reference/serve.js` (CommonJS, solo lectura) se arranca con `node tools/serve-reference.cjs 8765` (`npm run serve:reference`), no directamente.
