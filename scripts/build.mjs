import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
function expand(file, kind, stack = []) {
  file = resolve(file);
  if (stack.includes(file)) throw new Error('Inclusão circular: ' + file);
  const srcRoot = resolve(root, 'src');
  const rel = relative(srcRoot, file);
  if (rel.startsWith('..') || rel.startsWith('/')) throw new Error('Inclusão fora de src: ' + file);
  const source = readFileSync(file, 'utf8');
  const pattern = kind === 'js'
    ? /^\/\/ @include "([^"\r\n]+)"\r?\n/gm
    : /^@import "([^"\r\n]+)";\r?\n/gm;
  return source.replace(pattern, (_, path) => expand(resolve(dirname(file), path), kind, [...stack, file]));
}
for (const kind of ['js', 'css']) {
  const result = expand(resolve(root, 'src', kind, 'main.' + kind), kind);
  if (kind === 'js') new Script(result, { filename: 'crp-form.js' });
  const destination = resolve(root, 'producao', 'forms', 'zeev-default.' + kind);
  if (check) {
    if (readFileSync(destination, 'utf8') !== result) throw new Error('Dist desatualizado: ' + destination);
  } else {
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, result);
  }
  console.log((check ? 'Verificado: ' : 'Gerado: ') + relative(root, destination));
}
