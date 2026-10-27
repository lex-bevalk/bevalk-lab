import assert from 'node:assert/strict';
import { readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = path.join(repoRoot, '.tmp', 'middleware-esm');
const environmentKeys = ['DATABASE_URL', 'OWNER_PASSWORD', 'TEAM_PASSWORD', 'SESSION_SECRET'];
const savedEnvironment = new Map(environmentKeys.map((key) => [key, process.env[key]]));

async function findTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findTypeScriptFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(fullPath);
  }
  return files;
}

try {
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });

  const sourceFiles = [
    path.join(repoRoot, 'middleware.ts'),
    path.join(repoRoot, 'api', 'comments.ts'),
    path.join(repoRoot, 'src', 'comments', 'constants.ts'),
    ...await findTypeScriptFiles(path.join(repoRoot, 'server'))
  ];

  for (const sourcePath of sourceFiles) {
    const source = await readFile(sourcePath, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: sourcePath,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022
      }
    });
    const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length) {
      throw new Error(errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n'));
    }

    const relativePath = path.relative(repoRoot, sourcePath).replace(/\.ts$/, '.js');
    const outputPath = path.join(tempDir, relativePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, result.outputText);
  }

  await writeFile(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));

  for (const key of environmentKeys) delete process.env[key];

  const { default: middleware, config } = await import(pathToFileURL(path.join(tempDir, 'middleware.js')));
  const api = await import(pathToFileURL(path.join(tempDir, 'api', 'comments.js')));
  assert.equal(typeof middleware, 'function', 'middleware default export must be a function');
  assert.equal(config?.runtime, 'nodejs', 'middleware config.runtime must be nodejs');
  assert.equal(typeof api.GET, 'function', 'api/comments.ts must export GET');
  assert.equal(typeof api.POST, 'function', 'api/comments.ts must export POST');
  assert.equal(typeof api.PATCH, 'function', 'api/comments.ts must export PATCH');
  assert.equal(typeof api.DELETE, 'function', 'api/comments.ts must export DELETE');

  const homeResponse = await middleware(new Request('https://example.test/'));
  assert.equal(homeResponse.status, 302, 'unauthenticated / must redirect with status 302');
  assert.equal(homeResponse.headers.get('location'), '/login?next=%2F', 'unauthenticated / must redirect to /login?next=%2F');

  const loginResponse = await middleware(new Request('https://example.test/login'));
  assert.ok(loginResponse instanceof Response, 'GET /login must return next() response');
  assert.equal(loginResponse.status, 200, 'GET /login next() response must have status 200');
  assert.equal(loginResponse.headers.get('x-middleware-next'), '1', 'GET /login must return the next() response');

  console.log('Middleware and comments API ESM check passed: relative imports, exports, redirect, and public login response verified.');
} catch (error) {
  console.error(`Middleware ESM check failed: ${error?.stack ?? error}`);
  process.exitCode = 1;
} finally {
  for (const [key, value] of savedEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Middleware ESM check cleanup failed: ${error?.message ?? error}`);
    process.exitCode = 1;
  }
}
