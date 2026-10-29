import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const buildArgument = process.argv[2];
if (!buildArgument) {
  console.error('Usage: node tools/check-login-assets.mjs <build-directory>');
  process.exit(2);
}

const buildDirectory = path.resolve(buildArgument);
const allowedPath = pathname => (
  pathname === '/assets/77effca3e02e95da2e7019fa1e4a6fea.png' ||
  /^\/assets\/login-[A-Za-z0-9_-]+\.(?:js|css)$/.test(pathname) ||
  /^\/assets\/Guton-SemiBold-[A-Za-z0-9_-]+\.woff2$/.test(pathname)
);

function references(markup, attributeNames) {
  const values = [];
  const attributePattern = new RegExp(`\\b(?:${attributeNames.join('|')})\\s*=\\s*(["'])(.*?)\\1`, 'gi');
  for (const match of markup.matchAll(attributePattern)) values.push(match[2]);
  return values;
}

function localPath(reference) {
  if (/^#/.test(reference)) return null;
  if (/^(?:data:|https?:|\/\/)/i.test(reference)) {
    throw new Error(`Resource must be served from the protected build: ${reference}`);
  }
  const url = new URL(reference, 'https://bevalk.invalid');
  return decodeURIComponent(url.pathname);
}

async function assertAllowedResource(reference, source) {
  const pathname = localPath(reference);
  if (pathname === null) return;
  if (!allowedPath(pathname)) throw new Error(`${source} references a path outside the login allowlist: ${pathname}`);
  const target = path.resolve(buildDirectory, `.${pathname}`);
  const relative = path.relative(buildDirectory, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Resource escapes the build directory: ${pathname}`);
  await access(target);
}

async function main() {
  const loginHtml = await readFile(path.join(buildDirectory, 'login.html'), 'utf8');
  const appHtmlFiles = ['index.html', 'concept.html'];
  const appHtml = await Promise.all(appHtmlFiles.map(async file => [file, await readFile(path.join(buildDirectory, file), 'utf8')]));
  if (/modulepreload-polyfill/i.test(loginHtml)) {
    throw new Error('login.html references the Vite modulepreload polyfill.');
  }
  const loginReferences = references(loginHtml, ['src', 'href']);
  if (!loginReferences.some(reference => localPath(reference)?.endsWith('.js'))) {
    throw new Error('login.html does not reference its Vite JavaScript entry.');
  }
  if (!loginReferences.some(reference => localPath(reference)?.endsWith('.css'))) {
    throw new Error('login.html does not reference its Vite stylesheet.');
  }

  for (const reference of loginReferences) await assertAllowedResource(reference, 'login.html');

  const stylesheetPaths = loginReferences
    .map(localPath)
    .filter(pathname => pathname && pathname.endsWith('.css'));
  for (const stylesheetPath of stylesheetPaths) {
    const stylesheet = await readFile(path.join(buildDirectory, `.${stylesheetPath}`), 'utf8');
    for (const match of stylesheet.matchAll(/@import\s+(?:url\()?\s*(["'])(.*?)\1\s*\)?\s*;/gi)) {
      await assertAllowedResource(match[2].trim(), stylesheetPath);
    }
    for (const match of stylesheet.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
      await assertAllowedResource(match[2].trim(), stylesheetPath);
    }
  }

  for (const [file, markup] of appHtml) {
    for (const reference of references(markup, ['src', 'href'])) {
      const pathname = localPath(reference);
      if (pathname && pathname.endsWith('.js') && allowedPath(pathname)) {
        throw new Error(`${file} unexpectedly references a public login JavaScript asset: ${pathname}`);
      }
    }
  }

  console.log(`OK: checked ${loginReferences.length} login HTML resources, ${stylesheetPaths.length} stylesheet(s), and ${appHtmlFiles.join(' + ')} JavaScript isolation.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
