import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { foreignPaths, matchesPath } from '../../tools/check-proto-guard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const guard = path.join(root, 'tools/check-proto-guard.mjs');

describe('prototype path rules', () => {
  it('matches recursive and single-level asset patterns', () => {
    expect(matchesPath('src/ui/**', 'src/ui/generated/flow.tsx')).toBe(true);
    expect(matchesPath('public/assets/*', 'public/assets/logo.png')).toBe(true);
    expect(matchesPath('public/assets/*', 'public/assets/current/logo.png')).toBe(false);
  });

  it('classifies only paths owned by the other prototype as conflicts', () => {
    expect(foreignPaths('current', ['index.html', 'src/current/App.tsx', 'src/Host.tsx'])).toEqual(['src/Host.tsx']);
    expect(foreignPaths('concept', ['concept.html', 'src/ui/generated/flow.tsx', 'design/current/README.md'])).toEqual(['design/current/README.md']);
  });
});

describe('prototype guard CLI', () => {
  function run(proto: string, files: string[]) {
    return spawnSync(process.execPath, [guard, proto], { cwd: root, encoding: 'utf8', input: files.join('\n') });
  }

  it('rejects a change owned by the other prototype', () => {
    const result = run('current', ['src/Host.tsx']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('src/Host.tsx');
  });

  it('allows own and shared paths', () => {
    const result = run('current', ['index.html', 'src/proto-switch/ProtoSwitch.tsx']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK: current guard');
  });
});
