# Codex G6b · Corrección: no regenerar las pantallas de Concept

Rama `feat/proto-layout`, encima del trabajo de G6 sin commit. No hagas commit ni push.

## Problema (verificado por Claude)
`e2e:family-layout` da 7 fallos en la rama y 0 en `main`. No es una expectativa obsoleta: ejecutar `npm run convert-template` sobre
`main` limpio reproduce los 7 fallos. Los TSX generados de Concept que hay en `main` (v1.6.0, commit b8a9024) no coinciden con lo que
produce hoy `tools/convert-template.mjs` desde `design/familia/Main.dc.html`: además de los `data-dc-tpl`, cambia contenido en
`screens/inicio.tsx`, `screens/mi-familia.tsx`, `screens/perfil.tsx`, `screens/perfil-flujo.tsx`, `screens/analizador.tsx` y
`live-preview.tsx` (p. ej. `famHome.show` → `showFamHome`, desaparece `fam.isPendingPurchase`, `famplan` muestra «Protección básica»).
Lo aceptado es lo que hay en `main`. La deriva plantilla ↔ generado es previa y queda fuera de esta tarea.

## Qué hacer
1. `git checkout main -- src/ui/generated src/ui/Icon.tsx` (todo lo generado de Concept vuelve a `main`).
2. `src/ui/generated/navigation.tsx`: sobre la versión de `main`, aplica solo lo que el conversor de G6 inyecta: el import de
   `ProtoSwitch` y `<ProtoSwitch />` justo después del `</div>` de la fila título (la que contiene `{{ lab.nav.count }}` y el botón
   «Volver a la portada del Lab»). Nada más cambia en ese archivo.
3. `src/styles/main.css`: debe quedar como `main` más únicamente el cambio de geometría de G6 (ya es así; confírmalo).
4. Conserva la inyección en `tools/convert-template.mjs`, pero el test de idempotencia del conversor de Concept no puede exigir
   igualdad con los archivos versionados mientras exista la deriva: si algún test o gate de G6 lo hace, limítalo a «dos pasadas
   seguidas producen la misma salida» y añade un comentario de una línea que remita a `tasks/todo.md`.
5. `tasks/todo.md`, al final de la sección v2.0.0, una línea de deuda: «Deriva en Concept: regenerar desde `design/familia/Main.dc.html`
   pisa contenido de v1.6.0 (inicio, mi-familia, perfil, perfil-flujo, analizador, live-preview). No ejecutar `convert-template` hasta
   reconciliar la plantilla.» `tasks/lessons.md`: añade (no reescribas) una lección comprobable: antes de aceptar la regeneración de un
   conversor, comparar el generado contra `main` ignorando ids de plantilla y ejecutar `e2e:family-layout`.

## Gates
`npx tsc --noEmit -p .`, `npm test`, `npm run build` sin avisos, `npm run e2e:family-layout` **0 fallos**, `npm run e2e:baseline`,
`npm run invariants`, `npm run e2e:proto-switch` (incluido el gate de geometría), focus de Concept (`npm run focus`) y `e2e:review`.
Comprueba con un diff normalizado (sin `__scopeN`/`__indexN`/`data-dc-tpl`) que en `src/ui/**` el único cambio de contenido frente a
`main` es la inserción de `ProtoSwitch` en `navigation.tsx`.

## Paradas
Si `e2e:family-layout` no vuelve a 0 con lo generado de `main` restaurado, para y reporta.
