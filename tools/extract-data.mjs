import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'handoff/reference/project/Main.dc.html');
const manifestPath = path.join(root, 'handoff/reference/assets-manifest.json');
const outputDir = path.join(root, 'src/data');
const firstLine = 4683;
const lastLine = 6714;

const explicitGroups = {
  BASE: 'scenarios', VIG: 'scenarios', FINDINGS: 'scenarios', ACT: 'scenarios', SCEN: 'scenarios',
  FLOWS: 'flows', FLOW_MORE: 'flows',
  LESSON_PTS: 'lessons', LESSONS: 'lessons', GUIDE: 'lessons',
  ALERTS: 'alerts', ALERT_TYPES: 'alerts', BR_SITES0: 'alerts', BR0: 'alerts', ALERT_INFO: 'alerts', NOTIS: 'alerts', AL_ITEMS: 'alerts',
  MARIA_FEATURES: 'maria', MARIA_L3: 'maria', MARIA_L2: 'maria', MARIA_TOPICS: 'maria', MARIA_CHATS: 'maria', MARIA_TRANSCRIPT: 'maria',
  ANALYZERS: 'analyzer', AN_RECENTS: 'analyzer', VERDICTS: 'analyzer', AN_LEGEND: 'analyzer',
  HU_BULLETS: 'huella', HU_KINDS: 'huella', HU_LEAKS: 'huella',
  AU0: 'onboarding', OB0: 'onboarding', OB_ZONAS: 'onboarding', OB_EDADES: 'onboarding', OB_TEMAS: 'onboarding', OB_INTRO: 'onboarding', OB_QS: 'onboarding', OB_FINAL: 'onboarding',
  richSegs: 'family',
  PW_COMMON: 'score', PR_PW_RULES: 'score', pwCommon: 'score', pwScore: 'score', pwOk: 'score', okLab: 'score', okHex: 'score', scoreColor: 'score',
  labTxt: 'lab', labAuth: 'lab', labLearned: 'lab', labNoOff: 'lab'
};

function groupFor(name) {
  if (explicitGroups[name]) return explicitGroups[name];
  if (/^MARIA_/.test(name)) return 'maria';
  if (/^PZ_/.test(name)) return 'analyzer';
  if (/^PF_|^PR_|^PW_/.test(name) && name !== 'PR_PW_RULES' && name !== 'PW_COMMON' || name === 'SOS_HELP' || name === 'SOP_ASUNTOS') return 'perfil';
  if (/^FAM_/.test(name) || name === 'FAM0') return 'family';
  if (/^SCORE_/.test(name)) return 'score';
  if (/^LAB/.test(name)) return 'lab';
  if (/^AMBER/.test(name)) return 'analyzer';
  throw new Error(`Falta asignar un dominio de datos a ${name}`);
}

function replaceAssetPaths(source, manifest) {
  for (const asset of manifest) {
    if (asset.type !== 'image/png') continue;
    source = source.replaceAll(`/_blob/${asset.id}`, `/assets/${asset.suggestedName}`);
  }
  return source;
}

function maskStringsAndComments(source) {
  const chars = [...source];
  let i = 0;
  while (i < chars.length) {
    if (chars[i] === '/' && chars[i + 1] === '/') {
      while (i < chars.length && chars[i] !== '\n') chars[i++] = ' ';
      continue;
    }
    if (chars[i] === '/' && chars[i + 1] === '*') {
      chars[i++] = ' ';
      chars[i++] = ' ';
      while (i < chars.length && !(chars[i] === '*' && chars[i + 1] === '/')) chars[i++] = chars[i] === '\n' ? '\n' : ' ';
      if (i < chars.length) { chars[i++] = ' '; chars[i++] = ' '; }
      continue;
    }
    if (chars[i] === '"' || chars[i] === "'" || chars[i] === '`') {
      const quote = chars[i];
      chars[i++] = ' ';
      while (i < chars.length) {
        if (chars[i] === '\\') { chars[i++] = ' '; if (i < chars.length) chars[i++] = ' '; continue; }
        const current = chars[i];
        chars[i++] = current === '\n' ? '\n' : ' ';
        if (current === quote) break;
      }
      continue;
    }
    i++;
  }
  return chars.join('');
}

const html = await readFile(sourcePath, 'utf8');
const lines = html.split(/\r?\n/);
const sourceBlock = lines.slice(firstLine - 1, lastLine).join('\n');
const starts = [...sourceBlock.matchAll(/^const\s+([A-Za-z_$][\w$]*)\s*=/gm)];
if (starts.length !== 103) throw new Error(`Se esperaban 103 declaraciones de datos; se encontraron ${starts.length}`);

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const declarations = starts.map((match, index) => {
  const start = match.index;
  const end = starts[index + 1]?.index ?? sourceBlock.length;
  const name = match[1];
  const domain = groupFor(name);
  let code = replaceAssetPaths(sourceBlock.slice(start, end).trimEnd(), manifest);
  const annotations = {
    SCEN: ': Record<string, Escenario>',
    FLOWS: ': Flujo[]',
    LAB: ': Record<string, DatosFlujoLab>'
  };
  code = code.replace(`const ${name} =`, `export const ${name}${annotations[name] || ''} =`);
  return { name, domain, code };
});

const names = new Set(declarations.map(({ name }) => name));
const domainByName = new Map(declarations.map(({ name, domain }) => [name, domain]));
const byDomain = new Map();
for (const declaration of declarations) {
  if (!byDomain.has(declaration.domain)) byDomain.set(declaration.domain, []);
  byDomain.get(declaration.domain).push(declaration);
}
const noCheckDomains = new Set(['alerts', 'family', 'lab', 'score']);

const types = `export type Plan = "free" | "premium";\n\nexport interface Escenario {\n  plan?: Plan;\n  alertsLeft?: number;\n  [key: string]: unknown;\n}\n\nexport interface Flujo {\n  id: string;\n  label: string;\n  group?: string;\n  sub?: string;\n  scen?: string;\n  fam?: string;\n  [key: string]: unknown;\n}\n\nexport interface PasoCaso {\n  l: string;\n  ok(state: any, context: any): boolean;\n}\n\nexport interface CasoExtremo {\n  id: string;\n  t: string;\n  d: string;\n  cat: string;\n  sev: "critical" | "high" | "medium" | "low";\n  plans?: Plan[];\n  obs?: boolean;\n  scen: string;\n  trig: string;\n  exp: string;\n  rec: string;\n  end: string;\n  ac: string[];\n  prep(context: any): void;\n  fire?: { label: string; run(context: any): void };\n  steps?: PasoCaso[];\n  [key: string]: unknown;\n}\n\nexport interface DatosFlujoLab {\n  plans?: Plan[];\n  cases?: CasoExtremo[];\n  [key: string]: unknown;\n}\n`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'types.ts'), types, 'utf8');

const propsAttribute = html.match(/data-props="([^"]+)"/);
if (!propsAttribute) throw new Error('No se encontró data-props en Main.dc.html');
const propsJson = propsAttribute[1]
  .replaceAll('&quot;', '"')
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');
const propsMetadata = JSON.parse(propsJson);
const defaults = Object.fromEntries(Object.entries(propsMetadata)
  .filter(([name, value]) => name !== '$preview' && value && Object.hasOwn(value, 'default'))
  .map(([name, value]) => [name, value.default]));
await writeFile(path.join(root, 'src/props.ts'),
  `// Generated by tools/extract-data.mjs from the data-props metadata in Main.dc.html.\nexport const defaultProps = ${JSON.stringify(defaults, null, 2)} as const;\nexport type LabProps = { [Key in keyof typeof defaultProps]: typeof defaultProps[Key] extends string ? string : typeof defaultProps[Key] };\n`,
  'utf8');

for (const [domain, group] of byDomain) {
  const bodyText = group.map(({ code }) => code).join('\n\n');
  const masked = maskStringsAndComments(bodyText);
  const imports = declarations
    .filter(({ name, domain: dependencyDomain }) => dependencyDomain !== domain && new RegExp(`\\b${name}\\b`).test(masked))
    .reduce((result, { name, domain: dependencyDomain }) => {
      if (!result.has(dependencyDomain)) result.set(dependencyDomain, []);
      result.get(dependencyDomain).push(name);
      return result;
    }, new Map());
  const importLines = [...imports]
    .map(([dependencyDomain, dependencyNames]) => `import { ${dependencyNames.join(', ')} } from './${dependencyDomain}';`)
    .join('\n');
  const needsTypes = ['scenarios', 'flows', 'lab'].includes(domain);
  const typeImport = needsTypes ? `import type { ${domain === 'scenarios' ? 'Escenario' : domain === 'flows' ? 'Flujo' : 'DatosFlujoLab'} } from './types';` : '';
  const header = `${noCheckDomains.has(domain) ? '// @ts-nocheck\n' : ''}// Generated by tools/extract-data.mjs from Main.dc.html lines ${firstLine}-${lastLine}.\n${typeImport}${importLines ? `${typeImport ? '\n' : ''}${importLines}` : ''}\n`;
  await writeFile(path.join(outputDir, `${domain}.ts`), `${header}\n${bodyText}\n`, 'utf8');
}

const index = [...byDomain.keys()].map(domain => `export * from './${domain}';`).join('\n');
await writeFile(path.join(outputDir, 'index.ts'), `// Generated by tools/extract-data.mjs.\n${index}\n`, 'utf8');
console.log(`Generadas ${declarations.length} declaraciones de datos en ${byDomain.size} dominios.`);
