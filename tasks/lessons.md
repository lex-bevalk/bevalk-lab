# Lessons

- `npm install` dentro de `handoff/qa` crea `package-lock.json` y rompe la regla de solo lectura de `handoff/`. Usar `npm install --no-package-lock`.
- Cada push a cualquier rama despliega en Vercel (`product-lab`): no pushear sin OK del usuario.
- La batería cuenta warnings de consola como error: verificar contra `npm run preview`, nunca contra `dev`.
