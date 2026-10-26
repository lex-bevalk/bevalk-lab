// Generado por tools/convert-template.mjs. No editar a mano.
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
