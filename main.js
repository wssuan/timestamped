const fs = require('fs/promises')
const exifReader = require('exif-reader')
const sharp = require('sharp');

const promisify = (fn) => (...args) => new Promise((resolve, reject) => fn(...args, (error, result) => (error && reject(error) || resolve(result))));

async function addTimestamp(src, dst) {
  console.log(src);
  const img = sharp(src);

  const metadata = await img.metadata();
  const exif = exifReader(metadata.exif);
  const original = exif.exif.DateTimeOriginal || (await fs.stat(src)).mtime;
  const {width, height} = metadata;

  const timestamp = `${String(original.getUTCFullYear())}-${String(original.getUTCMonth() + 1).padStart(2, '0')}-${String(original.getUTCDate()).padStart(2, '0')}`;
  const svgProps = {
		'font-family': "'Jura'",
		'font-style': 'normal',
		'font-weight': 'normal',
		'letter-spacing': '0.2em',
		'stroke-width': '0em',
		'stroke': '#000000',
		'fill': '#FFFFFF',
		'fill-opacity': '1',
  };
  const svg = `
<svg width="${width}" height="${height}" ${Object.keys(svgProps).map(k => `${k}="${svgProps[k]}"`).join(' ')} font-size="${Math.floor(height / 40)}px">
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="2"></feGaussianBlur>
    <feMerge>
      <feMergeNode></feMergeNode>
    </feMerge>
  </filter>
	<text x="96%" y="96%" text-anchor="end" style="filter: url(#glow)" fill="${svgProps["stroke"]}">${timestamp}</text>
	<text x="96%" y="96%" text-anchor="end">${timestamp}</text>
</svg>`


  await img.withMetadata()
		.composite([{
			input: Buffer.from(svg),
			top: 0,
			left: 0,
		}])
    .toFormat(metadata.format)
		.toFile(dst);
  await fs.utimes(dst, original, original);
  console.log(dst);
}

fs.readdir('./src/')
  .then(async (files) => {
    for (file of files) {
      await addTimestamp(`./src/${file}`, `./dst/${file}`);
    }
  });
