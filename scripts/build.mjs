// Сборка: сайт статичный, без бандлера. Файлы копируются в out/, её выкладывает deploy-kit.
// Все ресурсы (js, vendor, fonts, music, world, video) лежат в папке out/a-<хэш>/ и кэшируются на год (immutable):
// index.html получает <base href="/a-<хэш>/">, поэтому относительные пути в коде не меняются.
// Новая выкладка — новая папка, и браузер гостя берёт только изменившиеся файлы по новому пути.
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const OUT = 'out';
let hash = process.env.GITHUB_SHA?.slice(0, 8);
if (!hash) { try { hash = execSync('git rev-parse --short=8 HEAD').toString().trim(); } catch { hash = Date.now().toString(36); } }
const A = `a-${hash}`;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/${A}`, { recursive: true });
for (const p of ['.htaccess', 'robots.txt', 'og.jpg', 'favicon.svg']) if (existsSync(p)) cpSync(p, `${OUT}/${p}`);
for (const p of ['js', 'vendor', 'fonts', 'music', 'world', 'video', 'favicon.svg']) {
  if (existsSync(p)) cpSync(p, `${OUT}/${A}/${p}`, { recursive: true, filter: (s) => !s.endsWith('README.md') });
}
const html = readFileSync('index.html', 'utf8').replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<base href="/${A}/">`);
if (!html.includes('<base ')) throw new Error('index.html: не найден <meta charset="utf-8"> для вставки <base>');
writeFileSync(`${OUT}/index.html`, html);
// кэш на год для папки версии
writeFileSync(`${OUT}/${A}/.htaccess`, `<IfModule mod_headers.c>\n  Header set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresDefault "access plus 1 year"\n</IfModule>\n`);
console.log(`out/ готов: ${A}`);
