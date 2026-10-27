import { readdir, readFile, mkdir, writeFile, lstat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { zipSync } from 'fflate';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = ['src', 'site', 'public', 'tests', 'scripts', '.github', 'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'vitest.config.js', '.gitignore', '.nvmrc', 'README.md', 'LICENSE', 'CONTRIBUTING.md', 'ROADMAP.md', 'docs', '.env.example'];
const credential = /AIza[\w-]{30,}|ya29\.[\w-]{20,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/;
async function collect(paths) {
  const out = {};
  async function visit(path) {
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw Error('Refusing to package a symbolic link: ' + relative(root, path));
    if (info.isDirectory()) { for (const entry of (await readdir(path)).sort()) await visit(resolve(path, entry)); return; }
    const bytes = await readFile(path); if (credential.test(bytes.toString('utf8'))) throw Error('Possible credential found: ' + relative(root, path));
    out[relative(root, path)] = [bytes, { mtime: new Date('2000-01-01T00:00:00Z') }];
  }
  for (const path of paths) await visit(resolve(root, path));
  return out;
}
const src = await collect(source), built = await collect(['dist']);
if (!built['dist/index.html']) throw Error('Run npm run build before packaging.');
const site = Object.fromEntries(Object.entries(built).map(([key, value]) => [key.slice(5), value]));
await mkdir(resolve(root, 'release'), { recursive: true });
const checksums = {};
for (const [name, data] of [['slateory-source.zip', src], ['slateory-dist.zip', site]]) {
  const bytes = zipSync(data, { level: 9 }); await writeFile(resolve(root, 'release', name), bytes);
  checksums[name] = createHash('sha256').update(bytes).digest('hex');
  console.log(name + ': ' + Object.keys(data).length + ' files, ' + bytes.length + ' bytes');
}
await writeFile(resolve(root, 'release/checksums.json'), JSON.stringify(checksums, null, 2) + '\n');
