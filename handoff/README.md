# BeValk · Product Experience Lab · Paquete de traspaso a código

Material para portar el prototipo de Claude Design a una app desplegable en Vercel
**sin perder nada de lo diseñado**. Exportado el 26 oct 2026 desde la versión 6 del canvas.

## Qué hay dentro

```
bevalk-lab-handoff/
├── README.md                  este archivo
├── PROMPT_CLAUDE_CODE.md      prompt listo para pegar en Claude Code
├── reference/                 LA VERDAD VISUAL · solo lectura
│   ├── serve.js               servidor local que reproduce el canvas (Node, sin dependencias)
│   ├── serve.py               el mismo servidor en Python (alternativa)
│   ├── project/
│   │   ├── Main.dc.html       el Lab completo (plantilla + lógica + datos)
│   │   ├── canvas.json        metadatos del canvas (1680×916, expand fill)
│   │   ├── support.js         runtime de Design (React incluido) · solo para render local
│   │   └── ds/odin/           sistema de diseño Odin: tokens, componentes CSS, fuente Guton
│   ├── _blob/                 28 archivos subidos al canvas, con su id original y sin extensión
│   ├── assets-manifest.json   id → tipo, tamaño, sha256, nombre sugerido y dónde se usa
│   └── original-pre-lab/      el prototipo «Tu protección» antes del Lab (para comparar)
├── source/                    fuentes con las que se genera Main.dc.html
│   ├── build.py               aplica todos los parches sobre orig/ y escribe project/
│   ├── orig/                  prototipo original
│   └── src/
│       ├── lab-data.js        contenido de los 30 flujos: historias, planes, criterios, 64 casos
│       ├── lab-logic.js       motor del Lab: estado, composición de planes, casos, render
│       ├── lab-shell-open.html  plantilla de las tres columnas
│       ├── lab.css            layout y responsive del Lab
│       ├── score-color.js     color del anillo de protección por tramos (OKLab)
│       ├── align_rows.py      regla de diseño: filas centradas en su elemento más alto
│       └── lab-qa.json        resultados de QA que muestra el propio Lab
├── qa/                        batería de pruebas que ya pasa al 100 % contra reference/
│   ├── package.json
│   ├── qa.js                  62 casos extremos de principio a fin (+ modo --baseline)
│   ├── inv.js                 17 invariantes de estado
│   ├── sweep.js               30 flujos × 2 planes sin errores
│   ├── axe.js                 accesibilidad con axe-core
│   ├── run.js                 utilidad para capturas guiadas por pasos
│   └── results/               resultados de referencia (la ejecución local escribe latest.json, ignorado en git)
└── docs/
    ├── ARQUITECTURA.md        contrato de estado, decisiones y supuestos
    ├── todo.md                plan y resultados
    ├── lessons.md             reglas de diseño acordadas
    └── capturas/              antes/después y responsive
```

## Ver la referencia en local (2 minutos)

```powershell
node reference/serve.js 8765
# abre http://127.0.0.1:8765/project/Main.dc.html
```

`serve.js` sirve `/_blob/<id>` con su tipo correcto, como hace el canvas.
Necesita conexión para las fuentes Manrope y Geist Mono (Google Fonts); Guton va incluida.

> En la consola verás algunos 404 de rutas tipo `{{ pr.avatar }}`: es el navegador
> pre-cargando imágenes de la plantilla oculta antes de que el runtime la pinte.
> Pasa igual en el canvas y no afecta a nada.

## Ejecutar la batería de QA

```powershell
# terminal 1 (desde la carpeta handoff)
node reference/serve.js 8765
# terminal 2
cd qa; npm install; npx playwright install chromium
npm run qa            # 62 casos extremos · esperado: 62 / 62 passed
npm run qa:baseline   # ningún caso se marca solo al prepararlo · 62 / 62
npm run invariants    # 17 PASS
npm run sweep         # TOTAL ERRORS 0
npm run a11y          # no violations
```

Para probar otra URL (por ejemplo, la app portada), en PowerShell: `$env:LAB_URL="http://localhost:4173/"; npm run qa`.
En macOS/Linux: `LAB_URL=http://localhost:4173/ npm run qa`.

**Importante para el porte:** las pruebas acceden a la lógica buscando la instancia del
componente a través de React (`stateNode.logic`). En la app nueva habrá que exponer un
equivalente (por ejemplo `window.__lab` en desarrollo) o cambiar esas llamadas por clics
en la interfaz. Las aserciones (qué paso del caso debe completarse) no cambian.

## Cómo usarlo con Claude Code

Sigue `PROMPT_CLAUDE_CODE.md`: incluye la preparación del repo en Windows y el prompt único
para pegar en Claude Code. El paquete vive en `handoff/` dentro del repo y la app en la raíz.

## Límites conocidos

- `support.js` es el runtime del tipo Design. Sirve para reproducir la referencia en local;
  no está pensado como dependencia de producción y su licencia de uso fuera de Design no
  está verificada. La app portada no debe depender de él.
- Todo el contenido del prototipo es simulado: análisis, filtraciones, familia y pagos.
- El comportamiento en el editor real de Design no se probó desde aquí; la referencia
  local usa el mismo runtime y los mismos archivos.
