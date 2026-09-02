// Re-encode the delivered photography in assets/Frames/ into the webp frames
// the site actually serves.
//
// The amenity plates render at roughly 26-41 cqw, so shipping them at the full
// 1536 px source width is wasted bytes; they are capped. The full-bleed stages
// (hero, interior, aerial) and the large material plate keep their native width.
//
// CROP handles sources that arrive letterboxed — flat black bars baked into the
// pixels, which is what once made the amenities grid read as misaligned. The
// current set is clean, so it is empty; the mechanism stays for the next batch.
//
//   node scripts/frames.mjs
//
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';

const SRC = 'assets/Frames';
const OUT = 'public/frames';

// measured content boxes for any letterboxed source, e.g.
//   'amenity-concierge.jpg': { left: 0, top: 308, width: 819, height: 512 },
const CROP = {};

// max delivered width per frame; anything absent keeps its native width
const MAX_WIDTH = {
  'amenity-wellness.webp': 1200,
  'amenity-concierge.webp': 1200,
  'amenity-dining.webp': 1200,
  'amenity-gardens.webp': 1000,
};

// dense foliage costs far more per pixel than architecture; these two carry the
// most of it, so they take a slightly lower quality nobody can see at render size
const QUALITY = { 'aerial.webp': 76, 'amenity-gardens.webp': 78 };

mkdirSync(OUT, { recursive: true });

let before = 0;
let after = 0;
const rows = [];

for (const file of readdirSync(SRC)) {
  const name = file.replace(/\.(png|jpe?g|webp)$/i, '.webp');
  let pipe = sharp(`${SRC}/${file}`);

  const crop = CROP[file];
  if (crop) pipe = pipe.extract(crop);

  const cap = MAX_WIDTH[name];
  if (cap) pipe = pipe.resize({ width: cap, withoutEnlargement: true });

  const info = await pipe.webp({ quality: QUALITY[name] ?? 82, effort: 6 }).toFile(`${OUT}/${name}`);

  before += statSync(`${SRC}/${file}`).size;
  after += info.size;

  rows.push([
    name,
    `${info.width}x${info.height}`,
    `${(info.size / 1024).toFixed(0)} KB`,
    [crop ? 'letterbox cut' : '', cap ? `capped ${cap}px` : ''].filter(Boolean).join(', '),
  ]);
}

for (const [a, b, c, d] of rows) {
  console.log(a.padEnd(26), b.padEnd(11), c.padStart(8), d ? `  (${d})` : '');
}
console.log(`\n${(before / 1e6).toFixed(2)} MB source -> ${(after / 1e6).toFixed(2)} MB served`);
