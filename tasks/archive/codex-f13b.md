# Codex F13b · coherencia de la fase B (revisión de Claude con capturas)

Misma rama y reglas, vía obligatoria (plantilla `design/familia/Main.dc.html` + conversor). No hagas commit ni push.

1. `fameliminar`: el bloque de familia contradice la línea existente «Cancelamos tu suscripción…» del mismo flujo. Quita del bloque la
   viñeta de la suscripción y el botón «Cancelar en la tienda». El bloque queda: icono de aviso del patrón existente del flujo, título
   «Familia Navarro se deshará en ese momento» y una línea «Mamá, Abuelo Pep y Marcos pasarán a Basic al momento.» Sin viñetas de texto
   «•» (usa el patrón de lista del propio flujo si hace falta). No toques el resto del flujo de borrado.
2. `famterminado`: estado coherente con un grupo ya deshecho: sin peticiones (`reqs: []`), sin miembros ni avatares; la tarjeta de Inicio
   usa el patrón de `famfuera`/`famretirado` (icono `calendar-x`, sin avatares) con título «Tu plan familiar terminó el 14 de noviembre» y
   cuerpo «Mamá, Abuelo Pep y Marcos están ahora en Basic. Ya no veis lo que compartíais.». «Tu semana» no puede mencionar a Mamá.
3. `famunido`: sin peticiones pendientes (`reqs: []`): «Tu semana» no debe mostrar «Mamá te pide ayuda».
4. `famlleno`: el flujo arranca con la hoja «No quedan plazas» ya abierta (`famSheet`), como F10 arranca con su hoja.
5. `famterminadomiembro`: mismo patrón con icono (`calendar-x`) en lugar del avatar «L», título «El plan familiar de Lucía ha terminado».
Revisa con el mismo criterio los 10 flujos de la fase B: ningún dato del estado inicial puede contradecir lo que cuenta el flujo. Lista lo
que cambies. Ajusta `steps`/e2e/capturas propias de familia afectadas y vuelve a pasar `tsc`, `npm test`, `e2e`, `e2e:family-layout`,
`a11y`, `sweep`.

Al terminar F13b, ejecuta `tasks/codex-f14.md` (CI ágil) completo.
