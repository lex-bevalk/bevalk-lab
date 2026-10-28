# Codex F14 · CI ágil: visual proporcional (decisión 23 de `tasks/todo.md`)

Misma rama (`feat/mi-familia-flujos`), encima de F13 ya verificada. No hagas commit ni push.
Objetivo: una PR de interfaz pasa el CI en ~10-12 min (hoy ~50 min: 43 son capturas contra `handoff`), sin perder la detección de
regresiones visuales de render (fuente, tokens, CSS global, z-index).

## T1 `qa.yml` (PR)
- El paso «Detect code changes» añade la salida `ui=true` si cambia alguno de: `src/ui/**`, `src/styles/**`, `src/logic/**`,
  `src/data/**`, `design/**`, `index.html`, `vite.config.ts`, `package-lock.json`, `tests/visual/**`. Se mantiene `code` como está.
- Fuera de la PR: «Capture visual baseline», «Visual comparison», «Upload visual comparison summary» y «E2E baseline» (dependen de
  `handoff`). Se quedan: tipos, unit, middleware, build, e2e, invariants, sweep, a11y, focus, review, select, `e2e:family-layout`.
- Nuevo paso «Visual smoke» solo si `ui == 'true'` (ver T2). Si la PR tiene la etiqueta `cambio-visual`, el paso no bloquea
  (`continue-on-error`) pero siempre sube las diferencias como artefacto y las resume en `$GITHUB_STEP_SUMMARY`.
- `visual:own` (desplegables y familia) se integra en el humo para no duplicar capturas; quita el paso «Own visual» si queda cubierto.

## T2 `npm run visual:smoke` (`tests/visual/smoke.mjs`, reutiliza `capture.mjs`/`compare.mjs`, sin dependencias nuevas)
- Compara la rama contra su base, no contra `handoff` ni contra una línea base versionada (evita la deriva Windows/Linux que hace fallar
  `visual:own` en local): en CI hace `git worktree add` de `origin/${BASE_REF}`, `npm run build` allí, sirve los dos `dist` en dos puertos
  y captura el mismo conjunto en ambos. En local, `LAB_BASE_URL` permite apuntar a un servidor ya levantado.
- Conjunto fijo y explícito (~40 capturas) a 375×812 y 1440×900: portada; un flujo representativo de cada grupo no familiar (`nuevo`,
  `bienvenida`, `dia1`, `aldia`, `comprobar`, `pzlink`, `ayuda`, `nvaviso`, `nvborrar`, `premmitad`); Perfil, SOS y Soporte con
  desplegable abierto (lo de `visual:own`); familia: `famdescubre`, `famcalma`, `famadmin` (hoja de respuesta), `famplan`, `fambaja`,
  `faminvite`, `fammember`, `famsalir`, `famcerrar` y dos flujos de la fase B. Movimiento reducido y encuadre instantáneo (lo de F12e).
- Mismo umbral que hoy. Resumen: lista de capturas con diferencia y ruta del PNG de diff.
- Control negativo: un cambio de 1 px en un token de color en la rama hace fallar el humo (en una copia temporal, no en el código).

## T3 Comparación completa fuera de la PR
- Nuevo `.github/workflows/visual-full.yml` con `workflow_dispatch` y `schedule` nocturno (03:00 UTC) sobre `main`: lo que hoy hace la
  PR contra `handoff` (baseline + comparación con máscaras de F12e + `e2e:baseline`), con `actions/cache` para las capturas de la
  referencia (clave: `hashFiles('handoff/**', 'tests/visual/capture.mjs')`). Sube el resumen como artefacto. No bloquea nada.

## T4 Documentación mínima
- 5-8 líneas en `tasks/todo.md` bajo la decisión 23: qué corre en cada PR, cuándo corre el humo, cómo marcar `cambio-visual`, cómo lanzar
  la completa a mano. Añade la lección en `tasks/lessons.md`: «La comparación píxel contra `handoff` valía para el porte; con `src/` como
  fuente, compara rama contra base y solo cuando cambia la UI».

## Entrega
`actionlint` si está disponible (si no, revisión YAML manual). `npm run visual:smoke` local contra base `main` con números y tiempo total.
Control negativo. Tiempo estimado del job de PR con y sin cambios de UI. Mismas paradas que F12.
