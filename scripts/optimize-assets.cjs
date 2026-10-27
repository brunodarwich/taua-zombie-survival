// Run with SHARP_PACKAGE pointing to an existing Sharp installation if needed.
const sharp = require(process.env.SHARP_PACKAGE || 'sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
(async () => {
  let before = 0, after = 0;
  const names = (await fs.readdir('public/assets')).filter(name => name.endsWith('.png'));
  names.sort((a, b) => Number(b === 'taua-promotional.png') - Number(a === 'taua-promotional.png'));
  for (const name of names) {
    const source = path.join('public/assets', name);
    const output = source.replace(/\.png$/, '.webp');
    const promotional = name === 'taua-promotional.png';
    await sharp(source).resize({ width: promotional ? 1600 : 512, height: promotional ? undefined : 512, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: promotional ? 85 : 88, alphaQuality: 100, effort: 3 }).toFile(output);
    before += (await fs.stat(source)).size;
    after += (await fs.stat(output)).size;
  }
  console.log(JSON.stringify({ originalBytes: before, optimizedBytes: after, reductionPercent: Math.round((1 - after / before) * 100) }));
})().catch(error => { console.error(error); process.exitCode = 1; });
