# Semántica de la plantilla BeValk Lab

Fuente de verdad: `handoff/reference/project/support.js`. El archivo está minificado; las referencias a continuación apuntan a sus líneas 349–350 y nombran la función para localizar cada regla.

## Parser y expresiones

- `Xt()` (línea 349) aplica el preproceso antes del parser HTML: normaliza etiquetas de `x-import`/`dc-import`, cambia `helmet` por `sc-helmet`, protege atributos camelCase con `sc-camel-*` y sustituye `select`/`table` y sus descendientes por etiquetas `sc-raw-*`. `ge()` parsea el resultado dentro de un `<template>` del navegador y marca elementos con `data-dc-tpl`.
- `P()` delega en `D()` las expresiones. Si todo el atributo es `{{…}}`, conserva el valor original (incluido objeto, booleano, `null` o `undefined`). En texto mixto concatena segmentos y convierte `null`/`undefined` a cadena vacía.
- `D()` y `Bt()` resuelven literales, `!`, rutas con punto/corchetes y `===`, `!==`, `==`, `!=`; el acceso a propiedades es tolerante a `undefined` y `null`. No evalúan JavaScript arbitrario ni llamadas.

## Renderizado

- Host (`__setLogicState` y el host de plantilla, líneas 350): `__setLogicState` fusiona superficialmente el objeto nuevo con `logic.state` y fuerza un render; el host combina props con `logic.renderVals()` antes de renderizar la plantilla. En el porte solo se reemplaza el destino de `Host.render()` por `GeneratedRoot` y se le pasan esos mismos `renderVals()`.
- Texto: `be()` (línea 349) conserva texto literal. Cada interpolación resuelta como valor escalar se envuelve en `<span class="sc-interp">`; `null` y booleanos no producen nodo, y elementos/arrays se insertan directamente. Un `undefined` normal se representa vacío y emite un aviso una sola vez. En modo streaming/editor hay marcadores distintos.
- `sc-if`: `we()` (línea 349) usa la truthiness de JavaScript. `hint-placeholder-val` solo sustituye un resultado `undefined` durante streaming; fuera de streaming no crea placeholder.
- `sc-for`: `ye()` (línea 349) itera arrays. Otro valor no nulo produce aviso y lista vacía; `null`/`undefined` dan lista vacía sin aviso. El scope de cada fila es `{...scope, [as]: item, $index: index}` (`as` por defecto `item`). Las claves de los fragments de fila son el índice.
- Atributos: `V()` (línea 349) mapea `class` a `className`, `for` a `htmlFor`, `on*` a eventos React y `sc-camel-*` al nombre camelCase. Los atributos booleanos vacíos reconocidos se convierten en `true`. Un `checked` estático vacío en `<input>` se convierte en `defaultChecked`; el dinámico queda controlado. Si `value` o `checked` dinámicos resuelven a `undefined`, el valor por defecto es `""` o `false`.
- `style`: `st()` separa declaraciones por `;` y por el primer `:`, recorta nombre/valor, convierte propiedades CSS normales a camelCase y conserva literalmente las custom properties `--*`. `Le()` conserva el texto CSS original; `Re()` lo aplica a `node.style.cssText`, quita la prioridad `!important` de las declaraciones inline y restaura los valores administrados por React. La plantilla tiene 0 declaraciones inline con `!important` entre 2.637 atributos `style`.
- `style-hover` / `style-active`: `V()` los deriva al generador `sn()` (líneas 349–350), que añade una clase `scpN` e inserta una regla en un `<style>` del documento. `on()` añade `!important` a cada declaración que aún no lo tenga. El conversor mantiene ese orden de precedencia.
- `ref`: `Te()`/`Me()` (línea 349) crea un callback que llama a refs función o asigna `ref.current`; si hay estilo string, compone esa asignación con la aplicación de `cssText`.

## Odin Design System

`handoff/reference/project/ds/odin/_ds_bundle.js` no inyecta CSS global ni cambia el DOM de la aplicación al cargarse. La comprobación aislada en Chromium observó la creación de `window.OdinDesignSystem_1d3e6e` con 74 exports y ningún `<style>`/`<link>` ni mutación de contenido. Por eso se copian y cargan los CSS Odin desde `src/styles/odin/`; el bundle no forma parte del porte.
