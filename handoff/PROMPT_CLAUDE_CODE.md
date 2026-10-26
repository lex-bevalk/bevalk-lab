# BeValk · Product Experience Lab · De Claude Design a código

- Repo: https://github.com/lex-bevalk/bevalk-lab (vacío al empezar)
- Producción: https://bevalk-lab.vercel.app/
- Carpeta local: `C:\Users\lexsa\Desktop\bevalk-lab` (Windows, PowerShell)

---

## Parte A · Preparar el repo (una sola vez, en PowerShell)

Requisitos: Git for Windows, Node.js 20 LTS o superior y Claude Code. No hace falta Python.

```powershell
cd C:\Users\lexsa\Desktop\bevalk-lab
git clone https://github.com/lex-bevalk/bevalk-lab.git .
Expand-Archive -Path "$env:USERPROFILE\Downloads\bevalk-lab-handoff.zip" -DestinationPath .\_tmp
Move-Item .\_tmp\bevalk-lab-handoff .\handoff
Remove-Item .\_tmp
git add handoff
git commit -m "chore: paquete de traspaso desde Claude Design (v6)"
git branch -M main
git push -u origin main
claude
```

- **Carpeta vacía:** `git clone ... .` clona dentro de la carpeta actual, que tiene que estar vacía. Si no lo está, mueve antes lo que haya dentro.
- **Ruta del zip:** si el zip no está en Descargas, cambia la ruta de `Expand-Archive`.
- **Finales de línea:** `handoff\.gitattributes` impide que Git en Windows los convierta, así la referencia se guarda byte a byte.

---

## Parte B · El prompt (pega en Claude Code desde la línea siguiente)

---

# Porte del BeValk Product Experience Lab a código

## Entorno
- Windows 11, PowerShell, carpeta `C:\Users\lexsa\Desktop\bevalk-lab`. Usa comandos de PowerShell
  o multiplataforma (node, npm, npx, git). No uses comandos de bash ni `python3`.
- Repo https://github.com/lex-bevalk/bevalk-lab, rama por defecto `main`, que ahora solo contiene `handoff/`.
- Destino: Vercel, proyecto `bevalk-lab`, producción en https://bevalk-lab.vercel.app/

## Contexto
`handoff/` es el paquete de traspaso exportado de Claude Design. Antes de nada, lee en este orden:
`handoff/README.md`, `handoff/docs/ARQUITECTURA.md`, `handoff/docs/lessons.md` y `handoff/docs/todo.md`.

- **Referencia:** `handoff/reference/` es la verdad visual y funcional. Se sirve con
  `node handoff/reference/serve.js 8765` en http://127.0.0.1:8765/project/Main.dc.html
- **El archivo del Lab:** `handoff/reference/project/Main.dc.html` es un único Design Component:
  una plantilla con `{{holes}}`, `<sc-if>` y `<sc-for>`, más una clase `Component extends DCLogic`
  con `renderVals()` y todos los datos.
- **Fuentes legibles:** `handoff/source/src/` tiene las mismas piezas separadas (datos, lógica,
  plantilla del Lab, CSS, color del anillo, regla de alineación). Úsalas para leer.
- **Batería de QA:** `handoff/qa/` ya pasa al 100 % contra la referencia: 62 casos extremos,
  baseline 62/62, 17 invariantes, 0 errores en 30 flujos × 2 planes y 0 violaciones de axe.
  Admite otra URL con la variable de entorno `LAB_URL`.

## Objetivo
Una app Vite + React + TypeScript en la raíz del repo que, desplegada en https://bevalk-lab.vercel.app/,
se vea y se comporte EXACTAMENTE igual que la referencia a todos los anchos.

Es un porte, no un rediseño: no cambies textos, colores, tamaños, espaciados, orden, animaciones
ni comportamiento. Si algo de la referencia te parece un error, apúntalo en `tasks/followups.md`
y replícalo igualmente.

## Reglas
- **Solo lectura:** nunca modifiques ni muevas `handoff/`. Única excepción: `handoff/qa/node_modules`
  y `handoff/qa/results/latest.json`, que se generan al ejecutar la batería y están en `.gitignore`.
- **Ramas:** trabaja en `feat/port`, con commits pequeños por área ("tipo: descripción").
  Nada se mezcla en `main` sin mi OK.
- **Odin:** copia los CSS de `handoff/reference/project/ds/odin` a `src/styles/odin` y úsalos tal cual.
  Nada de Tailwind ni CSS-in-JS. El CSS del Lab sale de `handoff/source/src/lab.css`.
- **Estilos en línea:** los de la plantilla pasan a `style` de JSX con los mismos valores.
- **Fuentes:** Guton desde su `.woff2`; Manrope y Geist Mono desde Google Fonts con los mismos pesos.
- **Iconos:** `lucide-react`, mismos nombres y tamaños. Sustituye el sistema `paint()` por componentes.
- **Imágenes:** copia `handoff/reference/_blob/*` a `public/assets/` con el nombre que indica
  `handoff/reference/assets-manifest.json`. No puede quedar ninguna ruta `/_blob/` en la app final.
- **Datos:** `FLOWS`, `SCEN`, `FLOW_MORE`, `LAB`, `LAB_AC_BY`, `LAB_QA`, `SCORE_*`, `FAM_*`,
  `ANALYZERS`, `LESSONS` y el resto de constantes se convierten en módulos TypeScript tipados,
  copiados literalmente.
- **Estado:** respeta las 5 dimensiones y las 6 reglas de `ARQUITECTURA.md`. `planWorld`, `labTrack`,
  `scoreColor` y los predicados de los casos son funciones puras con tests unitarios (Vitest).
- **Reglas de diseño (`lessons.md`):** filas horizontales centradas en su elemento más alto,
  y anillo de protección por tramos de color.
- **Sin runtime de Design:** la app no depende de `support.js`.
- **Dependencias:** solo `react`, `react-dom` y `lucide-react`. En desarrollo: `vite`, `typescript`,
  `@vitejs/plugin-react`, `vitest`, `playwright`, `axe-core`, `pixelmatch` y `pngjs`.
  Cualquier otra, justifícala y espera mi respuesta.
- **Vercel:** no despliegues ni toques su configuración sin mi confirmación explícita.

## Fase 0 · Inventario (para y enséñamelo)
1. Comprueba el estado del repo: ramas, archivos fuera de `handoff/` y si hay un proyecto de Vercel enlazado.
2. Sirve la referencia y ejecuta la batería contra ella. Desde `handoff/qa`: `npm install`,
   `npx playwright install chromium` y después `npm run qa`, `npm run qa:baseline`, `npm run invariants`,
   `npm run sweep` y `npm run a11y`. Esperado: 62/62, 62/62, 17 PASS, 0 errores y 0 violaciones.
   Si algo falla, para y dime por qué.
3. Inventaria las pantallas del móvil (`data-screen-label`) y las secciones del Lab.
4. Escribe en `tasks/todo.md` el plan por fases: archivos, riesgos y cómo se verifica cada una.

## Fase 1 · Red de seguridad (antes de portar)
1. **Baseline visual** en `tests/visual`: captura la referencia con Playwright a 1920×1080, 1680×916,
   1440×900, 1280×800, 1024×768, 768×1024 y 375×812.
   - Qué capturar: la portada, la ficha de los 30 flujos en Freemium y en Premium, un caso activo por
     grupo, el drawer a 1024 y las tres pestañas a 375.
   - Cómo: desactiva las animaciones y espera a que termine la cuenta del anillo antes de cada captura.
   - Guarda el resultado en `tests/visual/baseline`.
2. **Pruebas contra la app nueva:** copia `handoff/qa` a `tests/e2e` y adáptalo para que apunte a la app
   con `LAB_URL`. Solo en desarrollo, expón la lógica como `window.__lab` con los mismos métodos que usan
   las pruebas, en lugar de buscarla con `stateNode.logic`.
3. **Scripts en `package.json`:** `dev`, `build`, `preview`, `test` (Vitest), `e2e`, `e2e:baseline`,
   `invariants`, `sweep`, `a11y` y `visual`, todos multiplataforma.

## Fase 2 · Porte por áreas (commits separados por área)
Orden:
1. Datos.
2. Motor de estado.
3. Shell del Lab: 3 columnas, drawer, pestañas y escalado del móvil con `ResizeObserver`.
4. Pantallas del móvil por área: acceso y onboarding, inicio y semana, comprobar y analizador,
   mi huella y borrado, aprende, ayuda y SOS, perfil y Premium, familia.

Después de cada área: `npm run build`, pruebas e2e contra `npm run preview` (http://localhost:4173/)
y comparación de capturas con el baseline. Enséñame el resumen y las capturas que difieran.

## Criterios de aceptación
Se comprueban contra `npm run preview` y, después, contra producción.
- Diferencia visual ≤ 0,5 % de píxeles por captura y anchura (pixelmatch, umbral 0.1).
- `e2e`: 62/62 · `e2e:baseline`: 62/62 · `invariants`: 17 PASS · `sweep`: 0 errores · `a11y`: 0 violaciones.
- El orden de foco con teclado en el Lab coincide con la referencia.
- `npm run build` termina sin avisos.
- Ningún 404 en red, salvo los que también tenga la referencia (los de plantilla `{{ ... }}`).
- Tests unitarios en verde para `planWorld`, `labTrack`, `scoreColor` y la alineación de filas.

## Fase 3 · Vercel (solo tras mi OK)
1. **`vercel.json`:** framework `vite`, `buildCommand` "npm run build", `outputDirectory` "dist" y la
   cabecera `X-Robots-Tag: noindex`. Añade también `<meta name="robots" content="noindex">` en `index.html`.
2. **Nombre del proyecto:** enlázalo como `bevalk-lab` para que la producción sea
   https://bevalk-lab.vercel.app/. Si el nombre está ocupado, para y dímelo; no aceptes otro.
3. **Despliegues automáticos:** conecta el repo para que cada PR tenga su Preview y `main` despliegue
   a producción.
4. **Acceso:** explícame qué protección de acceso permite mi plan de Vercel y espera mi decisión
   antes de activarla.
5. **CI:** crea `.github/workflows/qa.yml` que, en cada PR, ejecute build, e2e y visual contra
   `vite preview` sobre ubuntu-latest. Si falla, el PR no se puede mezclar.
6. **Comprobación final:** tras el primer despliegue, ejecuta e2e, sweep, a11y y visual contra
   https://bevalk-lab.vercel.app/ y adjunta los resultados.

## Informe al cerrar cada fase
Qué cambió · qué verificaste (con números) · qué no pudiste verificar · riesgos · siguiente decisión.
No digas "listo" sin esos resultados.
