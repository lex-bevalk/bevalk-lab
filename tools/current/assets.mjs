import { createHash } from 'node:crypto';

const DATA_URI_RE = /data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)/g;
const EXTENSIONS = new Map([
  ['image/png', 'png'],
  ['image/gif', 'gif'],
  ['font/woff2', 'woff2']
]);

export function dataUriEntries(source) {
  return [...source.matchAll(DATA_URI_RE)].map(match => describeDataUri(match[0], match[1], match[2]));
}

export function describeDataUri(uri, mime, payload) {
  const extension = EXTENSIONS.get(mime);
  if (!extension) throw new Error(`MIME de data URI no previsto en Current: ${mime}`);
  const bytes = Buffer.from(payload.replace(/[\r\n]/g, ''), 'base64');
  return {
    uri,
    mime,
    extension,
    bytes,
    hash: createHash('md5').update(bytes).digest('hex')
  };
}

export function assetPath(uri) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(uri);
  if (!match) throw new Error(`Data URI inválida: ${uri.slice(0, 48)}`);
  const entry = describeDataUri(uri, match[1], match[2]);
  if (!entry.mime.startsWith('image/')) {
    throw new Error(`assetPath solo resuelve imágenes (recibido ${entry.mime})`);
  }
  return `/assets/current/${entry.hash}.${entry.extension}`;
}

export function replaceDataUris(source, replacement) {
  return source.replace(DATA_URI_RE, (uri, mime, payload) => replacement(uri, describeDataUri(uri, mime, payload)));
}

export function fontFaceAssets(css) {
  const result = [];
  const byUri = new Map();
  const byFilename = new Map();
  for (const match of css.matchAll(/@font-face\s*\{([^{}]*)\}/gi)) {
    const declarations = match[1];
    const uriEntries = dataUriEntries(declarations);
    if (!uriEntries.length) continue;
    if (uriEntries.length !== 1 || uriEntries[0].mime !== 'font/woff2') {
      throw new Error('Cada @font-face de Current debe contener una única fuente font/woff2.');
    }
    const familyMatch = /font-family\s*:\s*(?:"([^"]+)"|'([^']+)'|([^;]+))/i.exec(declarations);
    if (!familyMatch) throw new Error('No se encontró font-family en un @font-face de Current.');
    const family = (familyMatch[1] || familyMatch[2] || familyMatch[3]).trim();
    const weightMatch = /font-weight\s*:\s*([^;]+)/i.exec(declarations);
    const styleMatch = /font-style\s*:\s*([^;]+)/i.exec(declarations);
    const weight = (weightMatch?.[1] || '400').trim();
    const style = (styleMatch?.[1] || 'normal').trim().toLowerCase();
    const safeFamily = family.replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '');
    const safeWeight = weight.replace(/[^A-Za-z0-9_-]/g, '');
    const safeStyle = style === 'normal' ? '' : `-${style.replace(/[^A-Za-z0-9_-]/g, '')}`;
    const filename = `${safeFamily}-${safeWeight}${safeStyle}.woff2`;
    const entry = { ...uriEntries[0], family, weight, style, filename };
    const priorUri = byUri.get(entry.uri);
    if (priorUri && priorUri.filename !== filename) {
      throw new Error(`Una fuente Current se declara con dos nombres: ${priorUri.filename}, ${filename}`);
    }
    const priorFilename = byFilename.get(filename);
    if (priorFilename && priorFilename.hash !== entry.hash) {
      throw new Error(`Colisión de nombres de fuente Current: ${filename}`);
    }
    byUri.set(entry.uri, entry);
    byFilename.set(filename, entry);
  }
  return [...byUri.values()];
}

export function headerStyles(html) {
  const boundary = html.indexOf('<x-dc');
  if (boundary < 0) throw new Error('No se encontró <x-dc> en design/current/current.html.');
  return [...html.slice(0, boundary).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => ({ offset: match.index, css: match[1] }));
}

export function currentSourcePath() {
  return new URL('../../design/current/current.html', import.meta.url);
}
