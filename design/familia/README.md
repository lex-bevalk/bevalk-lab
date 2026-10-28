Origen: `handoff/reference/project/Main.dc.html`; la copia de trabajo es `design/familia/Main.dc.html`.
Se integraron Inicio, el plan compartido de Perfil, las notas del Analizador y los bloques de Mi Familia desde `mi-familia-lab/Lab.dc.html`.
La clase JavaScript permanece como en Main; la lógica de esta rama vive en `src/logic/LabLogic.ts`.
Regenera con `npm run serve:reference -- 8765 design/familia/Main.dc.html` y `node tools/convert-template.mjs http://127.0.0.1:8765/project/Main.dc.html`.
