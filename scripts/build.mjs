// Сборка: сайт статичный, без бандлера. Копируем нужные файлы в out/ — её выкладывает deploy-kit.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
const OUT = 'out';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const p of ['index.html', '.htaccess', 'robots.txt', 'og.jpg', 'favicon.svg', 'js', 'vendor', 'fonts', 'music', 'world', 'video']) {
  if (existsSync(p)) cpSync(p, `${OUT}/${p}`, { recursive: true, filter: (s) => !s.endsWith('README.md') });
}
console.log('out/ готов');
