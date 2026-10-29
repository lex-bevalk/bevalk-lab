import { spawnSync } from 'node:child_process';

const labUrl = process.env.LAB_URL || 'http://localhost:4173/concept.html';
function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const captureStatus = run(['tests/visual/capture.mjs', labUrl, 'tests/visual/current']);
if (captureStatus !== 0) process.exit(captureStatus);
process.exit(run(['tests/visual/compare.mjs', 'tests/visual/baseline', 'tests/visual/current']));
