import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentSourcePath, dataUriEntries, fontFaceAssets, headerStyles } from './assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = await readFile(currentSourcePath(), 'utf8');
const entries = dataUriEntries(html);
const images = new Map();
for (const entry of entries) {
  if (!entry.mime.startsWith('image/')) continue;
  images.set(`${entry.hash}.${entry.extension}`, entry);
}

const styles = headerStyles(html);
if (styles.length < 2) throw new Error(`Se esperaban los estilos de cabecera del export; se encontraron ${styles.length}.`);
const fonts = fontFaceAssets(styles.slice(1).map(style => style.css).join('\n'));
const fontUris = new Set(fonts.map(font => font.uri));
const embeddedFonts = new Set(entries.filter(entry => entry.mime === 'font/woff2').map(entry => entry.uri));
for (const uri of embeddedFonts) {
  if (!fontUris.has(uri)) throw new Error('Hay una fuente woff2 que no pertenece a ningún @font-face de cabecera.');
}
for (const font of fonts) {
  if (!embeddedFonts.has(font.uri)) throw new Error(`No se encontró la fuente ${font.filename} en el export.`);
}

const imageDir = path.join(root, 'public/assets/current');
const fontDir = path.join(root, 'src/current/styles/fonts');
await mkdir(imageDir, { recursive: true });
await mkdir(fontDir, { recursive: true });
await Promise.all([
  ...[...images].map(([filename, entry]) => writeFile(path.join(imageDir, filename), entry.bytes)),
  ...fonts.map(font => writeFile(path.join(fontDir, font.filename), font.bytes))
]);

console.log(`Current: ${images.size} imágenes únicas, ${fonts.length} fuentes woff2.`);
