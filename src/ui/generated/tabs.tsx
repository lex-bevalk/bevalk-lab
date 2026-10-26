// Generado por tools/convert-template.mjs. No editar a mano.
import { Fragment } from 'react';
import { __renderFor, __renderText, __styleProps, __templateValue } from './runtime';
import { Icon } from '../Icon';

export function Tabs({ vals }: { vals: any }) {
  const v0 = vals;
  return (
    <Fragment><nav {...{"aria-label": __templateValue(v0, "Vistas del Lab"), "data-dc-tpl": __templateValue(v0, "3"), "className": __templateValue(v0, "lab-tabs")}} {...__styleProps(v0, true, "flex-direction:row;gap:4px;padding:4px;background:var(--white);border:1px solid var(--neutral-200);border-radius:12px", false, undefined)}>{__renderText(v0, "\n  ")}{__renderFor(v0, "{{ lab.tabs }}", "t", (__scope4, __index4) => <Fragment key={__index4}>{__renderText(__scope4, "\n    ")}<button {...{"type": __templateValue(__scope4, "button"), "onClick": __templateValue(__scope4, "{{ t.pick }}"), "aria-pressed": __templateValue(__scope4, "{{ t.on }}"), "data-dc-tpl": __templateValue(__scope4, "5")}} {...__styleProps(__scope4, true, "flex:1;min-height:44px;border:0;border-radius:8px;cursor:pointer;background:{{ t.bg }};color:{{ t.fg }};font:600 0.875rem/1.25rem var(--font-sans);display:flex;align-items:center;justify-content:center;gap:6px", false, undefined)}><Icon {...{"data-icon": __templateValue(__scope4, "{{ t.icon }}"), "data-size": __templateValue(__scope4, "16"), "aria-hidden": __templateValue(__scope4, "true"), "data-dc-tpl": __templateValue(__scope4, "6")}}></Icon>{__renderText(__scope4, "{{ t.label }}")}</button>{__renderText(__scope4, "\n  ")}</Fragment>)}{__renderText(v0, "\n")}</nav></Fragment>
  );
}
