// TTF → typeface JSON для three.js FontLoader (как facetype.js)
const opentype = require('opentype.js'), fs = require('fs');
const [src, out, family] = process.argv.slice(2);
const f = opentype.loadSync(src), scale = 1000 / f.unitsPerEm, r = (v) => Math.round(v * scale);
const glyphs = {};
const chars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
for (const ch of chars) {
  const g = f.charToGlyph(ch); if (!g || g.index === 0) continue;
  let o = '';
  for (const c of g.path.commands) {
    if (c.type === 'M') o += `m ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'L') o += `l ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'Q') o += `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} `;
    else if (c.type === 'C') o += `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} `;
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.trim() };
}
const json = { glyphs, familyName: family, ascender: r(f.ascender), descender: r(f.descender), underlinePosition: r(f.tables.post.underlinePosition), underlineThickness: r(f.tables.post.underlineThickness),
  boundingBox: { yMin: r(f.tables.head.yMin), xMin: r(f.tables.head.xMin), yMax: r(f.tables.head.yMax), xMax: r(f.tables.head.xMax) }, resolution: 1000,
  original_font_information: { font_family_name: family, license_description: 'SIL Open Font License 1.1' }, cssFontWeight: 'bold', cssFontStyle: 'normal' };
fs.writeFileSync(out, JSON.stringify(json)); console.log(Object.keys(glyphs).length, 'glyphs', fs.statSync(out).size, 'bytes');
