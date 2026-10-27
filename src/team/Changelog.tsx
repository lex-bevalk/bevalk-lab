import { changelog, type ChangelogSection, type ChangelogVersion } from './changelog';

const sectionLabels: Record<ChangelogSection['type'], string> = {
  Added: 'Añadido',
  Changed: 'Cambiado',
  Deprecated: 'Obsoleto',
  Removed: 'Eliminado',
  Fixed: 'Corregido',
  Security: 'Seguridad'
};

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC'
});

function InlineCode({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code className="changelog-code" key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function VersionSections({ sections }: { sections: ChangelogSection[] }) {
  return (
    <div className="changelog-sections">
      {sections.map(section => (
        <section className="changelog-section" key={section.type}>
          <h3>{sectionLabels[section.type]}</h3>
          <ul>
            {section.items.map((item, index) => (
              <li key={`${section.type}-${index}`}><InlineCode text={item} /></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function VersionEntry({ version, isCurrent }: { version: ChangelogVersion; isCurrent: boolean }) {
  const isUnreleased = version.version === 'Unreleased';
  const title = isUnreleased ? 'Próxima versión' : `v${version.version}`;

  return (
    <article className="changelog-version">
      <header className="changelog-version__header">
        <h2>{title}</h2>
        {isCurrent && <span className="odin-badge odin-badge--default">Actual</span>}
        {version.date && (
          <time dateTime={version.date}>{dateFormatter.format(new Date(`${version.date}T00:00:00.000Z`))}</time>
        )}
      </header>
      <VersionSections sections={version.sections} />
    </article>
  );
}

export default function Changelog() {
  const latestPublished = changelog.find(version => version.version !== 'Unreleased')?.version;

  return (
    <>
      <header className="team-header">
        <a className="team-brand" href="/" aria-label="BeValk Product Experience Lab, inicio">
          <img src="/assets/77effca3e02e95da2e7019fa1e4a6fea.png" alt="BeValk" />
          <span>Product Experience Lab</span>
        </a>
        <a className="team-header__link" href="/">Ir al prototipo</a>
      </header>

      <main className="changelog-main">
        <div className="changelog-intro">
          <h1>Versiones</h1>
          <p>Qué cambia en cada versión del Lab.</p>
        </div>
        <div className="changelog-list">
          {changelog.map(version => (
            <VersionEntry
              key={version.version}
              version={version}
              isCurrent={version.version === latestPublished}
            />
          ))}
        </div>
      </main>
    </>
  );
}
