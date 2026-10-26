# Revisión visual por áreas del móvil (Fase 2.4)

Referencia: http://127.0.0.1:8765/project/Main.dc.html  
App: http://localhost:4173/  
Viewport: 375 × 812 (pestaña «phone»)  
Pixelmatch: umbral 0.1; máximo 0.50%.

Estructura del runtime: **28 etiquetas únicas** en **29 nodos de pantalla**; etiquetas incluidas en las áreas: **todas**.

Comparaciones: **86** · PASS **86** · FAIL **0** · pantallas únicas **28**.

| Área | Pantallas únicas | Estados por plan | PASS | Máxima diferencia |
|---|---:|---:|---:|---:|
| Acceso y onboarding | 4 | 6 × 2 planes | 12/12 | 0.00% |
| Inicio y semana | 6 | 7 × 2 planes | 14/14 | 0.00% |
| Comprobar y analizador | 4 | 6 × 2 planes | 12/12 | 0.00% |
| Mi huella y borrado | 3 | 3 × 2 planes | 6/6 | 0.00% |
| Aprende | 3 | 3 × 2 planes | 6/6 | 0.00% |
| Ayuda y SOS | 4 | 6 × 2 planes | 12/12 | 0.00% |
| Perfil y Premium | 3 | 3 × 2 planes | 6/6 | 0.00% |
| Familia | 1 | 9 × 2 planes | 18/18 | 0.00% |

La revisión aplica los estados de móvil en referencia y app y compara la captura en memoria; no guarda PNG adicionales.

El inventario de 'tasks/todo.md' menciona 32 instancias. El parser del runtime devuelve 29 nodos con 'data-screen-label' (28 etiquetas únicas); las tres coincidencias adicionales del recuento literal son selectores de lógica para Acceso, SOS y Mi Familia, no nodos de pantalla.

### Acceso y onboarding

Acceso, Bienvenida, Notificaciones, Bloqueo. Estados comparados: acceso-intro, acceso-login, acceso-signup, bienvenida, notificaciones, bloqueo.

### Inicio y semana

Inicio, Hitos, Desglose, Acciones, Alertas, Aviso. Estados comparados: inicio, hitos, desglose, acciones, alertas-lista, alertas-detalle, aviso.

### Comprobar y analizador

Comprobar, Analizador, Subida, Pasos. Estados comparados: comprobar, analizador-inicio, analizador-principal, analizador-resultado, subida, pasos.

### Mi huella y borrado

Mi huella, Mi huella · flujo, Borrar mis datos. Estados comparados: mi-huella, mi-huella-flujo, borrar-mis-datos.

### Aprende

Aprende, Lección, Cómo se usa BeValk. Estados comparados: aprende, leccion-sms, como-se-usa.

### Ayuda y SOS

Ayuda, SOS, MarIA, Soporte técnico. Estados comparados: ayuda, sos-aviso, sos-formulario, maria-inicio, maria-chat, soporte-tecnico.

### Perfil y Premium

Perfil, Perfil · flujo, Premium. Estados comparados: perfil, perfil-flujo, premium.

### Familia

Mi Familia. Estados comparados: familia-oferta, familia-crear, familia-responder, familia-avisar, familia-ficha, familia-ajustes, familia-invitacion, familia-miembro, familia-ayuda.
