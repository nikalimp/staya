const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [id, out] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => m.type() === 'error' && console.log('C', m.text()));
  await p.goto(`http://localhost:8766/dev/export.html?scene=${id}`);
  await p.waitForFunction(() => window.__export, null, { timeout: 120000 });
  const r = await p.evaluate(() => window.__export);
  fs.writeFileSync(`${out}/${id}_src.glb`, Buffer.from(r.glb, 'base64')); fs.writeFileSync(`${out}/${id}_lights.json`, JSON.stringify({ lights: r.lights, fog: r.fog }, null, 1));
  console.log(id, 'glb', fs.statSync(`${out}/${id}_src.glb`).size, 'lights', r.lights.length); await b.close();
})();
