import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { assetPath, currentSourcePath, fontFaceAssets, headerStyles, replaceDataUris } from './assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = path.join(root, 'src', 'current', 'ui', 'generated');
const referenceUrl = process.argv[2] || 'http://127.0.0.1:8766/project/Main.dc.html';
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
  : {};

const browser = await chromium.launch(launchOptions);
let template;
try {
  const page = await browser.newPage();
  await page.goto(referenceUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => {
    const name = window.__dcRootName?.();
    return !!name && !!window.__dcAnnotatedTemplate?.(name);
  }, null, { timeout: 30000 });
  const annotated = await page.evaluate(() => {
    const name = window.__dcRootName();
    return { name, html: window.__dcAnnotatedTemplate(name) };
  });
  template = await page.evaluate(({ name, html }) => {
    const parsed = document.createElement('template');
    parsed.innerHTML = html;
    const convert = node => {
      if (node.nodeType === Node.TEXT_NODE) return { type: 'text', value: node.nodeValue || '' };
      if (node.nodeType === Node.COMMENT_NODE) return { type: 'comment' };
      if (node.nodeType !== Node.ELEMENT_NODE) return null;
      return {
        type: 'element',
        tag: node.localName,
        attributes: [...node.attributes].map(attribute => [attribute.name, attribute.value]),
        children: [...node.childNodes].map(convert).filter(Boolean),
      };
    };
    const rootNode = parsed.content.querySelector('.lab');
    const helmetStyle = parsed.content.querySelector('sc-helmet style');
    if (!rootNode || !helmetStyle) throw new Error('No se encontró .lab o el <style> de <helmet> en la plantilla compilada.');
    return {
      name,
      root: convert(rootNode),
      globalCss: helmetStyle.textContent || '',
    };
  }, annotated);
} finally {
  await browser.close();
}

const attr = (node, name) => node.attributes?.find(([key]) => key === name)?.[1];
const walk = (node, visit) => {
  visit(node);
  for (const child of node.children || []) walk(child, visit);
};
const nodes = [];
walk(template.root, node => { if (node.type === 'element') nodes.push(node); });
const optionTriggerNodes = nodes.filter(node => node.tag === 'button' && attr(node, 'aria-haspopup') === 'dialog');
if (optionTriggerNodes.length !== 1) {
  throw new Error('La plantilla Current contiene ' + optionTriggerNodes.length + ' botones aria-haspopup="dialog"; se esperaba 1.');
}
const findNode = predicate => nodes.find(predicate);
const hasClass = (node, value) => (attr(node, 'class') || '').split(/\s+/).includes(value);
const gridNode = findNode(node => hasClass(node, 'lab-grid'));
const navigationNode = findNode(node => node.tag === 'nav' && hasClass(node, 'lab-col'));
const mainNode = findNode(node => node.tag === 'main' && hasClass(node, 'lab-col'));
const previewNode = findNode(node => node.tag === 'aside' && hasClass(node, 'lab-pv'));
const modalNode = findNode(node => attr(node, 'data-lab-modal') !== undefined);
if (![gridNode, navigationNode, mainNode, previewNode, modalNode].every(Boolean)) {
  throw new Error('La estructura de Current cambió: se esperaban .lab-grid, nav/main.lab-col, aside.lab-pv y [data-lab-modal].');
}

const labelGroups = new Map();
for (const node of nodes) {
  const label = attr(node, 'data-screen-label');
  if (!label) continue;
  const group = labelGroups.get(label) || [];
  group.push(node);
  labelGroups.set(label, group);
}
if (labelGroups.size !== 29) {
  throw new Error('La plantilla contiene ' + labelGroups.size + ' etiquetas de pantalla; se esperaban 29.');
}

const sourceHtml = await readFile(currentSourcePath(), 'utf8');
const fontNames = new Map(fontFaceAssets(headerStyles(sourceHtml).slice(1).map(style => style.css).join('\n'))
  .map(font => [font.uri, font.filename]));
function replaceEmbeddedAssets(value) {
  return replaceDataUris(value, (uri, entry) => {
    if (entry.mime === 'font/woff2') {
      const filename = fontNames.get(uri);
      if (!filename) throw new Error(`No se encontró el nombre de fuente para ${entry.hash}.woff2.`);
      return `/src/current/styles/fonts/${filename}`;
    }
    return assetPath(uri);
  });
}
function replaceAssets(node) {
  if (node.type === 'text') node.value = replaceEmbeddedAssets(node.value);
  if (node.type === 'element') {
    node.attributes = node.attributes.map(([name, value]) => [name, replaceEmbeddedAssets(value)]);
  }
  for (const child of node.children || []) replaceAssets(child);
}
replaceAssets(template.root);
template.globalCss = replaceEmbeddedAssets(template.globalCss);

const pseudoNames = new Map();
for (const node of nodes) {
  for (const [name, value] of node.attributes || []) {
    if (name !== 'style-hover' && name !== 'style-active') continue;
    const pseudo = name.slice('style-'.length);
    const key = pseudo + '|' + value;
    if (!pseudoNames.has(key)) pseudoNames.set(key, 'scp' + pseudoNames.size.toString(36));
  }
}

function cssUrlEnd(css, start) {
  if (!/^url\(/i.test(css.slice(start)) || /[a-z0-9_-]/i.test(css[start - 1] || '')) return -1;
  let cursor = start + 4;
  while (cursor < css.length && /\s/.test(css[cursor])) cursor += 1;
  if (css[cursor] === '"' || css[cursor] === "'") return -1;
  for (; cursor < css.length && css[cursor] !== ')'; cursor += 1) {
    if (css[cursor] === '\\') cursor += 1;
  }
  return cursor < css.length ? cursor + 1 : css.length;
}
function stripCssComments(css) {
  let result = '';
  let quote = '';
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    if (quote) {
      if (char === '\\') {
        result += char + (css[index + 1] || '');
        index += 1;
        continue;
      }
      if (char === quote) quote = '';
      result += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      result += char;
    } else if (char === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2);
      index = end === -1 ? css.length : end + 1;
      result += ' ';
    } else {
      const end = cssUrlEnd(css, index);
      if (end === -1) result += char;
      else {
        result += css.slice(index, end);
        index = end - 1;
      }
    }
  }
  return result;
}
function importantify(css) {
  const input = stripCssComments(css);
  const declarations = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '(') depth += 1;
    else if (char === ')') depth = Math.max(0, depth - 1);
    else if (char === ';' && depth === 0) {
      declarations.push(input.slice(start, index));
      start = index + 1;
    } else {
      const end = cssUrlEnd(input, index);
      if (end !== -1) index = end - 1;
    }
  }
  declarations.push(input.slice(start));
  return declarations.map(value => value.trim()).filter(Boolean).map(value =>
    /!\s*important$/i.test(value) ? value : value + ' !important'
  ).join(';');
}
const pseudoCss = [...pseudoNames.entries()].map(([key, className]) => {
  const separator = key.indexOf('|');
  const pseudo = key.slice(0, separator);
  const rawCss = key.slice(separator + 1);
  const selector = '.' + className + ':' + pseudo;
  const staticCss = rawCss.includes('{{')
    ? rawCss.split(';').filter(declaration => !declaration.includes('{{')).join(';')
    : rawCss;
  return selector + '{' + importantify(staticCss) + '}';
}).join('\n');
const mainCss = template.globalCss.trimEnd() + (pseudoCss ? '\n\n/* Pseudoclases style-hover/style-active generadas por convert-template.mjs. */\n' + pseudoCss + '\n' : '\n');

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function pascal(value) {
  return value.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join('');
}
function iconExportName(value) {
  return pascal(value);
}
const iconNames = new Set();
const iconCandidates = new Set();
for (const node of nodes) {
  if (node.tag !== 'i') continue;
  const name = attr(node, 'data-icon');
  if (name && !name.includes('{{')) iconNames.add(name);
}
for (const filename of [path.join(root, 'src', 'current', 'data.ts'), path.join(root, 'src', 'current', 'logic', 'LabLogic.ts')]) {
  const source = await readFile(filename, 'utf8');
  for (const match of source.matchAll(/\b[\w$]*icon[\w$]*\s*:\s*(['"])([^'"]+)\1/gi)) {
    if (!match[2].startsWith('var(')) iconNames.add(match[2]);
  }
  for (const match of source.matchAll(/["']([a-z][a-z0-9]*(?:-[a-z0-9]+)*)["']/g)) iconCandidates.add(match[1]);
  for (const match of source.matchAll(/\b[\w$]*icon[\w$]*\s*:\s*([^,\n}]+)/gi)) {
    for (const literal of match[1].matchAll(/['"]([a-z][a-z0-9]*(?:-[a-z0-9]+)*)['"]/g)) iconCandidates.add(literal[1]);
  }
}
const lucideTypes = await readFile(path.join(root, 'node_modules', 'lucide-react', 'dist', 'lucide-react.d.ts'), 'utf8');
const exportBody = lucideTypes.match(/export\s*\{([\s\S]*?)\};\s*$/)?.[1];
if (!exportBody) throw new Error('No se pudo leer el catálogo de exportaciones de lucide-react.');
const lucideExports = new Set();
for (const item of exportBody.split(',')) {
  const parts = item.trim().split(/\s+as\s+/);
  if (parts[0]) lucideExports.add(parts[0]);
  if (parts[1]) lucideExports.add(parts[1]);
}
for (const name of iconCandidates) {
  if (lucideExports.has(iconExportName(name))) iconNames.add(name);
}
const iconMap = new Map();
const missingIcons = [];
for (const name of [...iconNames].sort()) {
  const exported = iconExportName(name);
  if (lucideExports.has(exported)) iconMap.set(name, exported);
  else missingIcons.push(name);
}

const screenFiles = new Map();
const screenReplacements = new Map();
for (const [label, group] of labelGroups) {
  const filename = 'screens/' + slug(label) + '.tsx';
  const componentName = 'Screen' + pascal(label);
  screenFiles.set(label, { filename, componentName, nodes: group });
  group.forEach((node, variant) => {
    screenReplacements.set(attr(node, 'data-dc-tpl'), {
      name: componentName,
      ...(group.length > 1 ? { variant } : {}),
    });
  });
}

const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const booleanProps = new Set([
  'allowFullScreen', 'async', 'autoFocus', 'autoPlay', 'checked', 'controls', 'default', 'defer', 'disabled',
  'disablePictureInPicture', 'disableRemotePlayback', 'formNoValidate', 'hidden', 'itemScope', 'loop', 'multiple',
  'muted', 'noModule', 'noValidate', 'open', 'playsInline', 'readOnly', 'required', 'reversed', 'scoped',
  'seamless', 'selected',
]);
const rawTags = new Map([
  ['sc-raw-select', 'select'], ['sc-raw-table', 'table'], ['sc-raw-tbody', 'tbody'], ['sc-raw-thead', 'thead'],
  ['sc-raw-tfoot', 'tfoot'], ['sc-raw-tr', 'tr'], ['sc-raw-td', 'td'], ['sc-raw-th', 'th'], ['sc-raw-caption', 'caption'],
]);
function camelCase(value) {
  return value.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}
function runtimePropName(name) {
  let prop = name;
  if (prop.startsWith('sc-camel-')) prop = camelCase(prop.slice('sc-camel-'.length));
  if (prop === 'class') return 'className';
  if (prop === 'for') return 'htmlFor';
  if (prop.startsWith('on')) return 'on' + prop[2].toUpperCase() + prop.slice(3);
  return prop;
}
function getPseudoClasses(node) {
  const classes = [];
  for (const [name, value] of node.attributes || []) {
    if (name === 'style-hover' || name === 'style-active') {
      classes.push(pseudoNames.get(name.slice('style-'.length) + '|' + value));
    }
  }
  return classes.filter(Boolean);
}
function expressionForAttribute(scope, value) {
  return '__templateValue(' + scope + ', ' + JSON.stringify(value) + ')';
}
function renderNode(node, scope, replacements = new Map()) {
  if (node.type === 'text') return '{__renderText(' + scope + ', ' + JSON.stringify(node.value) + ')}';
  if (node.type !== 'element') return '';
  const id = attr(node, 'data-dc-tpl');
  const replacement = id && replacements.get(id);
  if (replacement) {
    const variant = replacement.variant === undefined ? '' : ' variant={' + replacement.variant + '}';
    return '<' + replacement.name + ' vals={' + scope + '}' + variant + ' />';
  }
  if (node.tag === 'sc-helmet') return '';
  if (node.tag === 'sc-if') {
    const value = attr(node, 'value') || '';
    return '{__renderIf(' + scope + ', ' + JSON.stringify(value) + ', () => <Fragment>' +
      node.children.map(child => renderNode(child, scope, replacements)).join('') + '</Fragment>)}';
  }
  if (node.tag === 'sc-for') {
    const list = attr(node, 'list') || '';
    const itemName = attr(node, 'as') || 'item';
    const childScope = '__scope' + id;
    const indexName = '__index' + id;
    return '{__renderFor(' + scope + ', ' + JSON.stringify(list) + ', ' + JSON.stringify(itemName) +
      ', (' + childScope + ', ' + indexName + ') => <Fragment key={' + indexName + '}>' +
      node.children.map(child => renderNode(child, childScope, replacements)).join('') + '</Fragment>)}';
  }

  const isIcon = node.tag === 'i' && node.attributes.some(([name]) => name === 'data-icon');
  const tag = isIcon ? 'Icon' : (rawTags.get(node.tag) || node.tag);
  const props = [];
  const pseudoClasses = getPseudoClasses(node);
  let classAttribute;
  let styleAttribute;
  let refAttribute;
  for (const [name, value] of node.attributes) {
    if (name === 'style-hover' || name === 'style-active' || name === 'hint-size') continue;
    if (name === 'style') {
      styleAttribute = value;
      continue;
    }
    if (name === 'ref') {
      refAttribute = value;
      continue;
    }
    if (name === 'class') {
      classAttribute = value;
      continue;
    }
    const prop = runtimePropName(name);
    if (name === 'checked' && node.tag === 'input' && !value.includes('{{')) {
      props.push(JSON.stringify('defaultChecked') + ': true');
    } else if (name === 'checked') {
      props.push(JSON.stringify(prop) + ': __attributeOrDefault(' + scope + ', ' + JSON.stringify(value) + ', false)');
    } else if (name === 'value') {
      props.push(JSON.stringify(prop) + ': __attributeOrDefault(' + scope + ', ' + JSON.stringify(value) + ', \"\")');
    } else if (value === '' && booleanProps.has(prop)) {
      props.push(JSON.stringify(prop) + ': true');
    } else {
      props.push(JSON.stringify(prop) + ': ' + expressionForAttribute(scope, value));
    }
  }
  if (classAttribute !== undefined || pseudoClasses.length) {
    if (pseudoClasses.length) {
      props.push(JSON.stringify('className') + ': __className(' + scope + ', ' +
        (classAttribute === undefined ? 'undefined' : JSON.stringify(classAttribute)) + ', ' + JSON.stringify(pseudoClasses) + ')');
    } else {
      props.push(JSON.stringify('className') + ': ' + expressionForAttribute(scope, classAttribute));
    }
  }
  const propExpression = props.length ? '{' + props.join(', ') + '}' : '{}';
  const styleProps = styleAttribute !== undefined || refAttribute !== undefined
    ? ' {...__styleProps(' + scope + ', ' + (styleAttribute === undefined ? 'false, undefined' : 'true, ' + JSON.stringify(styleAttribute)) +
      ', ' + (refAttribute === undefined ? 'false, undefined' : 'true, ' + JSON.stringify(refAttribute)) + ')}'
    : '';
  const children = node.children.map(child => renderNode(child, scope, replacements)).join('');
  const rendered = voidTags.has(tag.toLowerCase())
    ? '<' + tag + ' {...' + propExpression + '}' + styleProps + ' />'
    : '<' + tag + ' {...' + propExpression + '}' + styleProps + '>' + children + '</' + tag + '>';
  return rendered;
}

const runtimeSource = String.raw`// Generado por tools/current/convert-template.mjs. No editar a mano.
import { Fragment, isValidElement, type ReactNode } from 'react';

const missingBindings = new Set<string>();
const invalidLists = new Set<string>();
const inlineCssCallbacks = new Map<string, (node: HTMLElement | null) => void>();
const inlineCssRefs = new WeakMap<object, Map<string, (node: HTMLElement | null) => void>>();
const identifier = /^[A-Za-z_$][\w$]*/;
const numberLiteral = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/;

function matchingOuterParens(value: string) {
  if (value[0] !== '(' || value[value.length - 1] !== ')') return false;
  let depth = 0;
  for (let i = 0; i < value.length - 1; i += 1) {
    if (value[i] === '(') depth += 1;
    else if (value[i] === ')' && --depth === 0) return false;
  }
  return true;
}

function findComparison(value: string) {
  let depth = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (depth === 0 && (char === '=' || char === '!') && value[i + 1] === '=') {
      if ((value[i - 1] === '=' || value[i - 1] === '!') || !value.slice(0, i).trim()) continue;
      const operator = char + (value[i + 2] === '=' ? '==' : '=');
      return { index: i, operator };
    }
  }
  return null;
}

function readPath(scope: any, path: string): any {
  const first = path.match(identifier);
  if (!first) return undefined;
  let value = scope?.[first[0]];
  let index = first[0].length;
  while (index < path.length) {
    if (path[index] === '.') {
      const property = path.slice(index + 1).match(identifier) || path.slice(index + 1).match(/^\d+/);
      if (!property) return undefined;
      value = value?.[property[0]];
      index += property[0].length + 1;
    } else if (path[index] === '[') {
      let depth = 1;
      let end = index + 1;
      for (; end < path.length && depth > 0; end += 1) {
        if (path[end] === '[') depth += 1;
        else if (path[end] === ']') depth -= 1;
      }
      if (depth !== 0) return undefined;
      const key = resolveExpression(scope, path.slice(index + 1, end - 1));
      value = value?.[key];
      index = end;
    } else return undefined;
  }
  return value;
}

function resolveExpression(scope: any, source: string): any {
  const expression = String(source).trim();
  if (!expression) return undefined;
  if (matchingOuterParens(expression)) return resolveExpression(scope, expression.slice(1, -1));
  const comparison = findComparison(expression);
  if (comparison) {
    const left = resolveExpression(scope, expression.slice(0, comparison.index));
    const right = resolveExpression(scope, expression.slice(comparison.index + comparison.operator.length));
    if (comparison.operator === '===') return left === right;
    if (comparison.operator === '!==') return left !== right;
    if (comparison.operator === '==') return left == right;
    return left != right;
  }
  if (expression[0] === '!') return !resolveExpression(scope, expression.slice(1));
  if (expression === 'true') return true;
  if (expression === 'false') return false;
  if (expression === 'null') return null;
  if (expression === 'undefined') return undefined;
  if (numberLiteral.test(expression)) return Number(expression);
  if (expression.length >= 2 && (expression[0] === '"' || expression[0] === "'") && expression[expression.length - 1] === expression[0]) {
    return expression.slice(1, -1);
  }
  return readPath(scope, expression);
}

export function __templateValue(scope: any, source: string): any {
  const exact = source.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (exact) return resolveExpression(scope, exact[1]);
  if (!source.includes('{{')) return source;
  return source.split(/\{\{([\s\S]+?)\}\}/g).map((part, index) => {
    if (!(index & 1)) return part;
    return resolveExpression(scope, part) ?? '';
  }).join('');
}

export function __attributeOrDefault(scope: any, source: string, fallback: any) {
  const value = __templateValue(scope, source);
  return value === undefined ? fallback : value;
}

function reportOnce(collection: Set<string>, key: string, method: 'warn' | 'error', message: string) {
  if (collection.has(key)) return;
  collection.add(key);
  console[method](message);
}

export function __renderText(scope: any, source: string): ReactNode {
  if (!source.includes('{{')) return !source.trim() && !source.includes(' ') ? null : source;
  const parts = source.split(/\{\{([\s\S]+?)\}\}/g);
  return <Fragment>{parts.map((part, index) => {
    if (!(index & 1)) return part;
    const expression = part.trim();
    const value = resolveExpression(scope, expression);
    if (value === undefined) {
      reportOnce(missingBindings, expression, 'warn', '[dc-runtime] Main: {{ ' + expression + ' }} never resolved — rendered as empty');
      return null;
    }
    if (isValidElement(value) || Array.isArray(value)) return <Fragment key={index}>{value}</Fragment>;
    if (value === null || typeof value === 'boolean') return null;
    return <span key={index} className="sc-interp">{String(value)}</span>;
  })}</Fragment>;
}

export function __renderIf(scope: any, source: string, render: () => ReactNode): ReactNode {
  return __templateValue(scope, source) ? render() : null;
}

export function __renderFor(scope: any, source: string, as: string, render: (scope: any, index: number) => ReactNode): ReactNode {
  const list = __templateValue(scope, source);
  if (!Array.isArray(list)) {
    if (list != null) reportOnce(invalidLists, source, 'warn', '[dc-runtime] Main: sc-for list=\"' + source + '\" is not an array (' + typeof list + ')');
    return null;
  }
  return <Fragment>{list.map((item, index) => <Fragment key={index}>{render({ ...scope, [as]: item, $index: index }, index)}</Fragment>)}</Fragment>;
}

export function __className(scope: any, source: string | undefined, additions: string[]) {
  const values = [source === undefined ? undefined : __templateValue(scope, source), ...additions];
  return values.filter(Boolean).join(' ');
}

function camelCase(value: string) {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function toStyle(value: any) {
  if (typeof value !== 'string') return value == null ? undefined : value;
  const style: Record<string, string> = {};
  for (const declaration of value.split(';')) {
    const separator = declaration.indexOf(':');
    if (separator < 0) continue;
    const name = declaration.slice(0, separator).trim();
    style[name.startsWith('--') ? name : camelCase(name)] = declaration.slice(separator + 1).trim();
  }
  return style;
}

function setRef(ref: any, node: HTMLElement | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref && typeof ref === 'object') ref.current = node;
}

function styleCallback(cssText: string, ref: any) {
  const validRef = typeof ref === 'function' || (ref && typeof ref === 'object') ? ref : null;
  const cacheKey = cssText + '\\u0000' + (validRef ? '' : 'no-ref');
  if (!validRef) {
    const cached = inlineCssCallbacks.get(cacheKey);
    if (cached) return cached;
    const callback = (node: HTMLElement | null) => {
      if (node) applyCssText(node, cssText);
    };
    inlineCssCallbacks.set(cacheKey, callback);
    return callback;
  }
  let cache = inlineCssRefs.get(validRef);
  if (!cache) {
    cache = new Map();
    inlineCssRefs.set(validRef, cache);
  }
  const cached = cache.get(cssText);
  if (cached) return cached;
  const callback = (node: HTMLElement | null) => {
    if (node) applyCssText(node, cssText);
    setRef(validRef, node);
  };
  cache.set(cssText, callback);
  return callback;
}

function applyCssText(node: HTMLElement, cssText: string) {
  const style = node.style;
  const preserved = Array.from(style).map(property => [property, style.getPropertyValue(property)] as const);
  style.cssText = cssText;
  for (let index = style.length - 1; index >= 0; index -= 1) {
    const property = style[index];
    if (!style.getPropertyPriority(property)) continue;
    const value = style.getPropertyValue(property);
    if (value) style.setProperty(property, value);
    if (style.getPropertyPriority(property)) style.removeProperty(property);
  }
  for (const [property, value] of preserved) if (value) style.setProperty(property, value);
}

export function __styleProps(scope: any, hasStyle: boolean, styleSource: string | undefined, hasRef: boolean, refSource: string | undefined) {
  const props: Record<string, any> = {};
  const style = hasStyle ? __templateValue(scope, styleSource || '') : undefined;
  const ref = hasRef ? __templateValue(scope, refSource || '') : undefined;
  if (hasStyle) props.style = toStyle(style);
  if (hasRef || (hasStyle && typeof style === 'string')) {
    props.ref = hasStyle && typeof style === 'string' ? styleCallback(style, ref) : ref;
  }
  return props;
}
`;

const runtimeHelpers = ['__className', '__renderFor', '__renderIf', '__renderText', '__styleProps', '__templateValue', '__attributeOrDefault'];
function generatedImports(body, runtimePath, iconPath) {
  const imports = ["import { Fragment } from 'react';"];
  const usedHelpers = runtimeHelpers.filter(helper => body.includes(helper + '('));
  if (usedHelpers.length) imports.push("import { " + usedHelpers.join(', ') + " } from '" + runtimePath + "';");
  if (/<Icon\s/.test(body)) imports.push("import { Icon } from '" + iconPath + "';");
  return imports;
}
function screenSource(screen) {
  let body;
  if (screen.nodes.length === 1) {
    body = renderNode(screen.nodes[0], 'v0');
  } else {
    body = '{(() => { switch (variant) {\n' +
      screen.nodes.map((node, index) => '      case ' + index + ': return (' + renderNode(node, 'v0') + ');').join('\n') +
      '\n      default: return null;\n    } })()}';
  }
  const imports = generatedImports(body, '../runtime', '../../Icon');
  const variantParam = screen.nodes.length > 1 ? ', variant = 0' : '';
  const variantType = screen.nodes.length > 1 ? '; variant?: number' : '';
  return '// Generado por tools/current/convert-template.mjs. No editar a mano.\n' + imports.join('\n') +
    '\n\nexport function ' + screen.componentName + '({ vals' + variantParam + ' }: { vals: any' + variantType + ' }) {\n' +
    '  const v0 = vals;\n  return (\n    <Fragment>' + body + '</Fragment>\n  );\n}\n';
}

const componentFiles = [...screenFiles.values()].map(screen => [screen.filename, screenSource(screen)]);
const rootBody = renderNode(template.root, 'v0', screenReplacements);
const rootImports = generatedImports(rootBody, './runtime', '../Icon');
for (const screen of screenFiles.values()) {
  if (rootBody.includes('<' + screen.componentName + ' ')) {
    rootImports.push("import { " + screen.componentName + " } from './" + screen.filename.replace('.tsx', '') + "';");
  }
}
const rootSource = '// Generado por tools/current/convert-template.mjs. No editar a mano.\n' + rootImports.join('\n') + '\n\n' +
  'export function GeneratedRoot({ vals }: { vals: any }) {\n  const v0 = vals;\n  return (\n    <Fragment>' + rootBody + '</Fragment>\n  );\n}\n';

const lucideImports = [...new Set(iconMap.values())].sort();
const iconObject = [...iconMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, component]) =>
  '  ' + JSON.stringify(name) + ': ' + component
).join(',\n');
const iconSource = '// Generado por tools/current/convert-template.mjs. No editar a mano.\n' +
  "import { forwardRef, type ComponentPropsWithoutRef } from 'react';\n" +
  "import { " + lucideImports.join(', ') + ", type LucideIcon } from 'lucide-react';\n\n" +
  'const ICONS: Record<string, LucideIcon> = Object.assign(Object.create(null), {\n' + iconObject + '\n});\n' +
  'const reportedMissing = new Set<string>();\n\n' +
  "type IconProps = ComponentPropsWithoutRef<'i'> & { 'data-icon'?: string; 'data-size'?: string | number };\n\n" +
  'export const Icon = forwardRef<HTMLElement, IconProps>(function Icon(props, ref) {\n' +
  "  const nameValue = props['data-icon'];\n  const sizeValue = props['data-size'];\n" +
  "  const name = typeof nameValue === 'string' ? nameValue : '';\n  const size = sizeValue || '20';\n" +
  '  const IconView = ICONS[name];\n' +
  "  if (name && !IconView && !reportedMissing.has(name)) {\n    reportedMissing.add(name);\n    console.error('[Icon] Icono lucide no incluido en el mapa estático:', name);\n  }\n" +
  '  const { children: _children, ...attributes } = props;\n' +
  '  return (\n    <i {...attributes} ref={ref} data-icon={nameValue} data-size={sizeValue} data-painted={name + String.fromCharCode(58) + size}>\n' +
  "      {IconView ? <IconView width={size} height={size} style={{ display: 'block' }} /> : null}\n" +
  '    </i>\n  );\n});\n';

await mkdir(path.join(outputRoot, 'screens'), { recursive: true });
await mkdir(path.join(root, 'src', 'current', 'ui'), { recursive: true });
await mkdir(path.join(root, 'src', 'current', 'styles'), { recursive: true });
await writeFile(path.join(outputRoot, 'runtime.tsx'), runtimeSource, 'utf8');
await writeFile(path.join(outputRoot, 'Root.tsx'), rootSource, 'utf8');
for (const [filename, source] of componentFiles) {
  const output = path.join(outputRoot, filename);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, source, 'utf8');
}
await writeFile(path.join(root, 'src', 'current', 'ui', 'Icon.tsx'), iconSource, 'utf8');
await writeFile(path.join(root, 'src', 'current', 'styles', 'lab.css'), mainCss, 'utf8');

if (missingIcons.length) console.warn('Iconos sin export de lucide-react; se dejará el error ruidoso en tiempo de ejecución:', missingIcons.join(', '));
const generatedScreens = componentFiles.filter(([filename]) => filename.startsWith('screens/')).length;
console.log('Current: ' + generatedScreens + ' archivos de pantalla y Root.tsx; shell nav/main/aside/modal validado.');
console.log('Iconos mapeados estáticamente: ' + iconMap.size + (missingIcons.length ? ' · faltan ' + missingIcons.length : ''));
console.log('CSS global: src/current/styles/lab.css · ' + pseudoNames.size + ' reglas style-hover/style-active.');
