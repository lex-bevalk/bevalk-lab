# Arquitectura del Lab

## Layout

| Ancho | Comportamiento |
|---|---|
| ≥ 1280 px | Tres columnas: navegación `minmax(248px, 20fr)` · ficha `minmax(0, 50fr)` · móvil `minmax(360px, 30fr)` |
| 900–1279 px | Dos columnas; el móvil se abre en un drawer lateral (`data-pv="open"`) |
| < 900 px | Pestañas Flujos / Ficha / Móvil (`data-tab`); las tres vistas siguen montadas |

- **Móvil:** el original de 393×852 se escala con `transform: scale()`. Un `ResizeObserver` mide la zona
  del móvil (`labFit`): escala = mín(1, ancho−16 / 393, alto−8 / 852).
- **Paneles:** cada uno tiene su propio scroll (`.lab-scroll`). El móvil nunca se desmonta al cambiar de
  vista, así que conserva su estado.

## Las cinco dimensiones de estado

| Dimensión | Dónde vive | Quién la cambia |
|---|---|---|
| Flujo | `state.flow` | navegación (`labSelect`) |
| Plan | `world().plan`; preferencia en `state.labPlan`; arranque en `state.simPlan` | selector, compra en el móvil, plan familiar |
| Entorno | `offline`, `bio`, `camPerm`, `notiPerm`, `labFail` | panel «Entorno de prueba» o un caso |
| Caso extremo | `state.lab.case`, `reached`, `armed`, `snap` | tarjetas de casos |
| Rol familiar | `state.fam.role` | definición del flujo (`f.fam`, `famByPlan`) |

### Reglas que no se pueden romper

1. **Elegir un flujo no cambia la preferencia de plan.** Los flujos de un solo plan fijan el plan del
   simulador y lo explican; al volver a un flujo de ambos planes, la preferencia vuelve.
   - Solo Freemium: F01–F05 y F08.
   - Solo Premium: F17, F19–F21, F23–F27, F29 y F30.
2. **Componer el plan, no duplicar flujos.** `world() = planWorld(scenWorld(SCEN[k]), simPlan)`.
   - Pasar a Premium pone `alertsLeft = 99` y no activa vigilancia de datos, igual que `activatePremium`.
   - Volver a Freemium restaura `alertsLeft = 4`.
   - `alt` (F07) y `famByPlan` (F15) cambian el punto de partida y reinician el flujo con aviso.
3. **Premium no implica ser administradora familiar.** Sí al revés: el plan familiar incluye Premium.
   `famBuy` y `famJoin` pasan a Premium; salir del grupo pasa a Freemium.
4. **Un caso no contamina otros flujos.** Al empezar se guarda una foto del entorno (`snap`) y al salir
   se restaura.
5. **Ningún paso se marca solo por cargar la pantalla inicial.** `labTrack` marca el paso *k* solo si:
   el paso *k−1* ya está hecho, su predicado se ha visto falso al menos una vez (`armed`) y ahora es
   verdadero.
6. **`SCEN` nunca se muta.** La prueba de invariantes lo comprueba.

## Contrato de un caso extremo

```ts
{
  id, t, d, cat, sev: "critical"|"high"|"medium"|"low", plans?: ("free"|"premium")[], obs?: boolean,
  scen, trig, exp, rec, end, ac: string[],
  prep(c),                       // se ejecuta tras reiniciar el flujo
  fire?: {label, run(c)},        // simula un evento externo o un atajo de datos de prueba
  steps: {l, ok(state, c) => boolean}[]
}
```

## Cambios en la app que exigieron los casos extremos

- **Sin conexión:** login, registro, prueba del onboarding, Borrar mis datos, SOS, MarIA, y responder,
  pedir ayuda o avisar en Familia. Ninguna de estas acciones finge un envío sin red y todas conservan
  lo escrito.
- **Límite de análisis:** al comprar Premium desde la pantalla de límite, se vuelve al analizador con
  el mismo enlace.
- **Onboarding:** desmarcar todos los temas se respeta y se le explica a la persona.
- **Familia:** las peticiones repetidas se agrupan y se responden una vez. El motivo «Me piden dinero»
  pone primero las respuestas urgentes.
- **Avisos automáticos:** si se activan con las notificaciones del móvil apagadas, se avisa de ello.
- **Errores corregidos:**
  - Texto roto del aviso sin conexión en Inicio cuando la última revisión era «hace 2 meses».
  - Los toasts no desaparecían al cambiar de flujo.
- **Diseño:** el anillo de protección se colorea por tramos y las filas horizontales se centran en su
  elemento más alto.

## Supuestos pendientes de validar con producto

- El plan familiar incluye Premium para quien gestiona y para los miembros. Lo apoya el propio texto de
  la app: «deja de tener Premium del grupo», «pasa a Basic».
- `levelOf` (85 / 60) sigue gobernando los textos y la urgencia de Inicio; solo el color usa los tramos
  nuevos. Conviene alinearlos.
