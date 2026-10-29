import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetPath, currentSourcePath, fontFaceAssets, headerStyles, replaceDataUris } from './assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = await readFile(currentSourcePath(), 'utf8');
const styles = headerStyles(html);
if (styles.length < 2) throw new Error(`Se esperaban los estilos de cabecera del export; se encontraron ${styles.length}.`);

// El primer style es el reset del visor (safe area, márgenes por defecto e imágenes); no forma parte del diseño Odin.
const designStyles = styles.slice(1);
const fonts = new Map(fontFaceAssets(designStyles.map(style => style.css).join('\n')).map(font => [
  font.uri,
  font.filename === 'Guton-600.woff2' ? 'Guton-SemiBold.woff2' : font.filename
]));
const css = designStyles.map(({ css: sourceCss }) => replaceDataUris(sourceCss, (uri, entry) => {
  if (entry.mime === 'font/woff2') {
    const filename = fonts.get(uri);
    if (!filename) throw new Error(`Falta el nombre de fuente para ${entry.hash}.woff2.`);
    return `./fonts/${filename}`;
  }
  return assetPath(uri);
})).join('\n\n').trim() + '\n';

const output = path.join(root, 'src/current/styles/odin.css');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, css, 'utf8');
console.log(`Current: ${designStyles.length} estilos de cabecera extraídos a src/current/styles/odin.css.`);
