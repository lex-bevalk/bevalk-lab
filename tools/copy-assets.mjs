import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'handoff/reference/_blob');
const outputDir = path.join(root, 'public/assets');
const manifest = JSON.parse(await readFile(path.join(root, 'handoff/reference/assets-manifest.json'), 'utf8'));
const images = manifest.filter(asset => asset.type === 'image/png');
if (images.length !== 27) throw new Error(`Se esperaban 27 PNG; el manifest contiene ${images.length}`);

await mkdir(outputDir, { recursive: true });
for (const asset of images) {
  await copyFile(path.join(sourceDir, asset.id), path.join(outputDir, asset.suggestedName));
}
console.log(`Copiados ${images.length} PNG a public/assets.`);
