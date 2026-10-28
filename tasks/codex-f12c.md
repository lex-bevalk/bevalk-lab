# Codex F12c · pantallas de Mi Familia mal ensambladas: regenerar desde plantilla

Misma rama y reglas que F12. No hagas commit ni push. La lógica (`LabLogic.ts`, `family.ts`), los flujos y casos de F12/F12b
están bien y se conservan; el problema es la plantilla.

## Evidencia (capturas de Claude contra `npm run preview`, comparadas con el render real de `mi-familia-lab/Lab.dc.html`)
Todos los bloques nuevos se añadieron al final de los TSX generados, fuera de su contenedor (`.tp-scroll`/tarjeta):
- `inicio.tsx`: la tarjeta de descubrimiento (F01) flota sobre «Tu semana» y tapa contenido; la X de cerrar aparece como píldora
  de texto «Cerrar aviso» suelta abajo a la derecha en todos los Inicio con tarjeta (F05, F25, `dia1`…). En la referencia la X es un
  botón circular de 44 px con icono `x` DENTRO de la tarjeta, arriba a la derecha, y `aria-label="Cerrar aviso: …"` sin texto visible.
- F01: faltan el icono `users-round`, la etiqueta «NUEVO EN BEVALK», el texto y los 3 pasos numerados de la referencia.
- F02 (`analizador.tsx`): la nota «¿Le llegan mensajes así…?» queda fija abajo, ENCIMA del resultado. Debe ir debajo del resultado,
  dentro del scroll.
- F13 (Perfil › Gestiona tu plan): con grupo activo siguen saliendo los planes individuales («Protección básica», «MEJOR VALORADO»).
  La spec: «Que no aparezcan los planes individuales». Igual para el miembro (F22) salvo con `termina`.
- F14 (`baja`): el título de la tarjeta se solapa con la cabecera «Cancelar el plan».
- F25 y la tarjeta compacta: hueco vacío donde va el icono (`user-round-x`, `users-round`): el icono no está en el mapa estático.
- `dia1` a 375: «Tu protección» marca 45 frente a 36 en la referencia. Explica la causa; si no es intencionada, corrígela.

## Hecho verificado que cambia la vía
Tu informe decía que regenerar no era reproducible. Claude lo comprobó en un worktree limpio de HEAD: `node tools/convert-template.mjs`
contra `npm run serve:reference` da **0 diferencias de contenido** en `src/ui/generated`, `Icon.tsx` y `main.css` (solo finales de
línea; las ediciones de `ff5c304` también salen del conversor). Por tanto se usa la vía (a).

## T1 Plantilla fuente de Mi Familia
- Crea `design/familia/Main.dc.html`: copia de `handoff/reference/project/Main.dc.html` con los bloques de PLANTILLA de Mi Familia
  insertados desde `Lab.dc.html` en la estructura de Main (no en la de Lab: el Inicio de Lab es el antiguo «Tu familia / Seguridad
  digital»). Puntos: Inicio (sustituye el bloque `famHome` actual de Main, en su mismo sitio), Perfil (`famPlan` y el `sc-if` que oculta
  los planes individuales), Analizador (nota `famAn` bajo la tarjeta de resultado), pantalla Mi Familia y hoja `fam.sh` (regla de fusión:
  comportamiento/textos/elementos nuevos de Lab; estilo de lo que ya existía, de Main). La clase JS del archivo no se usa (la lógica vive
  en `LabLogic.ts`): déjala como en Main y dilo en `design/familia/README.md` (3-5 líneas: origen, qué se insertó, cómo regenerar).
  Los recursos que necesite el servidor (`support.js`, `ds/`, `_blob/`) se sirven desde `handoff/reference` sin copiarlos al repo si
  es posible (p. ej. un argumento de raíz/ruta en `tools/serve-reference.cjs`); si no, explica la alternativa mínima.
- Regenera con `convert-template.mjs <url de esa copia>`. Acepta solo diferencias en `inicio.tsx`, `perfil.tsx`, `analizador.tsx`,
  `mi-familia.tsx`, `live-preview.tsx` si lo necesita, `Icon.tsx` (iconos nuevos) y `main.css` si cambia algo de hover/active. Cualquier
  otro archivo con diferencias = parada.
- Normaliza finales de línea al estilo del repo (sin diffs de solo CRLF).

## T2 Gates automáticos que habrían detectado esto (control negativo obligatorio: deben FALLAR en el árbol actual antes de T1)
- e2e (en `tests/e2e/`, añádelo a la batería de `qa` o como script propio en `package.json` y CI): para cada flujo de familia, cada
  bloque nuevo visible (tarjeta `famHome`, su X, nota `famAn`, banners de fin de plan, vistas `baja`/`salir`/`plan`) tiene
  `closest('.tp-scroll')` no nulo y su caja está dentro del contenido; la X está dentro de la caja de su tarjeta y mide ≥ 44×44;
  en F02 `top` de la nota > `bottom` de la tarjeta de resultado; en F14 el título no se solapa con la cabecera; en F13 no existe
  «Protección básica» con grupo activo.
- unit: todo nombre de icono usado por la plantilla de familia y por `famHomeRaw`/`famPlanVals`/`famVals` (`icon:` en `LabLogic.ts`
  y `family.ts`) se resuelve en `Icon.tsx`.

## T3 Visual
- Mantén la lista explícita de exclusiones de la comparación con la referencia, pero cada entrada con su motivo. Motivo aceptado:
  la tarjeta compacta «Mi Familia · NUEVO» de Inicio para quien no tiene grupo (`famHomeRaw` rol `none`, igual que la referencia) y
  las pantallas de familia rediseñadas. Cualquier otra diferencia (p. ej. la puntuación de `dia1`) no se excluye: se corrige o se
  explica en el informe.
- `visual:own` genérico falla igual en `main` en esta máquina (verificado por Claude: 1,8-3,1 %): es del entorno; no lo toques.
- Genera las capturas propias de familia a 375 y 1440 para los 26 flujos en `tests/visual/own/family/current/`.

## Entrega
Batería completa de F12 con números + el gate nuevo + control negativo (salida del fallo antes de T1). `git diff --stat` de
`src/ui/generated`. Mismas paradas.
