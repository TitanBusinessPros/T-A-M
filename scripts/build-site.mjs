import { cpSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(projectRoot, 'dist');
if (dirname(output) !== projectRoot) throw new Error('Unexpected output directory');

rmSync(output, { recursive: true, force: true });
mkdirSync(output);

for (const file of ['index.html', 'admin.html', 'terms.html', 'privacy.html', 'space-game.html', 'checkers-game.html', 'chess-game.html', 'pinball-game.html', 'qr-maker.html', 'website-maker.html', 'invoice-generator.html', 'match-3-game.html', 'follow-along-game.html', 'manifest.webmanifest', 'sw.js']) {
  copyFileSync(join(projectRoot, file), join(output, file));
}
for (const directory of ['assets', 'src']) {
  cpSync(join(projectRoot, directory), join(output, directory), { recursive: true });
}

console.log(`Prepared PWA in ${output}`);
