// One-shot recovery of the delivered photography.
//
// The nine photographs were supplied as chat attachments rather than as files,
// so they exist only as base64 WebP inside the session transcript. This pulls
// them back out into assets/Frames/ under the names the site expects, matched
// by the ORDER they were sent in (see MAP below). Two of the nine are the same
// file sent twice, so the set is de-duplicated by sha1 on the way out.
//
//   node scripts/extract-frames.mjs
//
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';

const TRANSCRIPT =
  'C:/Users/MY PC/.claude/projects/C--Users-MY-PC-AI-Skills-Projects-real-esate/cdeff272-cd21-4b87-b7f9-d50180092ea1.jsonl';
const LINE = 5134;
const OUT = 'assets/Frames';

// destination for each image block, in the order they were uploaded
const MAP = [
  'amenity-gardens.webp',
  'amenity-dining.webp',
  'amenity-concierge.webp',
  'amenity-wellness.webp',
  'aerial.webp',
  null, // duplicate of block 3
  'materials.webp',
  'hero.webp',
  'interior.webp',
];

const rl = createInterface({ input: createReadStream(TRANSCRIPT, 'utf8'), crlfDelay: Infinity });
let n = 0;
let target = null;
for await (const line of rl) {
  if (++n === LINE) {
    target = line;
    break;
  }
}
rl.close();
if (!target) throw new Error(`line ${LINE} not found in transcript`);

const content = JSON.parse(target).message.content;
const images = content.filter((b) => b.type === 'image');
if (images.length !== MAP.length) {
  throw new Error(`expected ${MAP.length} image blocks, found ${images.length}`);
}

mkdirSync(OUT, { recursive: true });

const seen = new Map();
let written = 0;

images.forEach((b, i) => {
  const raw = Buffer.from(b.source.data, 'base64');
  const sha = createHash('sha1').update(raw).digest('hex');

  if (raw.subarray(0, 4).toString('ascii') !== 'RIFF') {
    throw new Error(`block ${i} is not a RIFF/WebP payload`);
  }

  const name = MAP[i];
  if (!name) {
    const first = seen.get(sha);
    console.log(`block ${i}  skipped — duplicate of ${first ?? '(unknown)'}  sha1 ${sha.slice(0, 10)}`);
    return;
  }
  if (seen.has(sha)) {
    console.log(`block ${i}  WARNING duplicate content, already written as ${seen.get(sha)}`);
  }
  seen.set(sha, name);

  writeFileSync(`${OUT}/${name}`, raw);
  written++;
  console.log(`block ${i}  -> ${name.padEnd(24)} ${(raw.length / 1024).toFixed(0)} KB  sha1 ${sha.slice(0, 10)}`);
});

console.log(`\n${written} files written to ${OUT}/`);
