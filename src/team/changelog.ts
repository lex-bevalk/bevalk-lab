import changelogMarkdown from '../../CHANGELOG.md?raw';

export type ChangelogSectionType = 'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security';

export interface ChangelogSection {
  type: ChangelogSectionType;
  items: string[];
}

export interface ChangelogVersion {
  version: string;
  date: string | null;
  sections: ChangelogSection[];
}

const sectionTypes = new Set<ChangelogSectionType>([
  'Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'
]);

function isIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
}

function lineError(lineNumber: number, message: string): Error {
  return new Error(`CHANGELOG.md, línea ${lineNumber}: ${message}`);
}

export function parseChangelog(markdown: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = [];
  let current: ChangelogVersion | null = null;
  let currentSection: ChangelogSection | null = null;

  const finishVersion = () => {
    if (!current) return;
    const hasItems = current.sections.some(section => section.items.length > 0);
    if (current.version !== 'Unreleased' || hasItems) versions.push(current);
  };

  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    if (line.trim() === '') continue;

    let heading = /^## \[Unreleased\]$/.exec(line);
    if (heading) {
      finishVersion();
      current = { version: 'Unreleased', date: null, sections: [] };
      currentSection = null;
      continue;
    }

    const releaseHeading = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/.exec(line);
    if (releaseHeading) {
      finishVersion();
      const [, version, date] = releaseHeading;
      if (!isIsoDate(date)) throw lineError(lineNumber, `fecha no válida: ${date}`);
      current = { version, date, sections: [] };
      currentSection = null;
      continue;
    }

    if (!current) continue;

    heading = /^### (.+)$/.exec(line);
    if (heading) {
      const type = heading[1] as ChangelogSectionType;
      if (!sectionTypes.has(type)) throw lineError(lineNumber, `tipo de sección desconocido: ${heading[1]}`);
      currentSection = { type, items: [] };
      current.sections.push(currentSection);
      continue;
    }

    const item = /^- (.+)$/.exec(line);
    if (item && currentSection) {
      const text = item[1].trim();
      if (text) currentSection.items.push(text);
      else throw lineError(lineNumber, 'el elemento de lista está vacío');
      continue;
    }

    throw lineError(lineNumber, `contenido no válido dentro de [${current.version}]: ${line}`);
  }

  finishVersion();
  return versions;
}

export const changelog = parseChangelog(changelogMarkdown);
