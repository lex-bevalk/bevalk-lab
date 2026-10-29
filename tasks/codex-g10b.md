# Codex G10b · Corrección: el banner tapa el contenido de un flujo ojeado

Rama `current/vistazo-proximamente`, encima de G10 sin commit. No hagas commit ni push. Mismas reglas que `tasks/codex-g10.md`.

## Problema (visto por Claude en `.tmp/soon-peek-unblurred-1440x900.png`)
El banner de Próximamente (`design/current/current.html` ~964, contenedor `position:sticky;top:72px;height:0`) flota encima del
contenido. Con el contenido difuminado no importaba; en un flujo ojeado tapa el chip «Próximamente» y parte del H1.

## Qué hacer
Solo cuando el flujo está ojeado (`peeked`), el banner ocupa su propio sitio en el flujo del documento: contenedor sin sticky y sin
`height:0`, con padding `16px 24px 0` y el botón alineado a la izquierda, antes del bloque de contenido. Sin ojear, todo igual que hoy
(paridad 0). Usa un valor nuevo de `lab.soon` (p. ej. `bannerPos`/`bannerH`) en vez de duplicar el marcado. Regenera con
`npm run convert:current`.

## Gates
`convert:current` idempotente, `tsc`, `npm test`, build, `e2e:current:parity` 0, `e2e:current:peek` (añade: en el flujo ojeado el
rectángulo del banner no se solapa con el del H1 ni con el chip de estado), `e2e:current:a11y`, `e2e:current:geometry`,
`guard:proto -- current --base main`. Rehaz la captura `.tmp/soon-peek-unblurred-1440x900.png`.
