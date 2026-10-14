const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const allFiles = getFiles('public');
const baseWebpFiles = allFiles.filter(f => 
  f.endsWith('.webp') && 
  !f.includes('-320w') && 
  !f.includes('-640w') && 
  !f.includes('-960w') && 
  !f.includes('-1280w') && 
  !f.includes('-blur')
);

console.log(`Found ${baseWebpFiles.length} base webp images.`);

for (const f of baseWebpFiles) {
  const dir = path.dirname(f);
  const baseName = path.basename(f, '.webp');
  
  const w320 = path.join(dir, `${baseName}-320w.webp`);
  const w640 = path.join(dir, `${baseName}-640w.webp`);
  const w960 = path.join(dir, `${baseName}-960w.webp`);
  const blur = path.join(dir, `${baseName}-blur.webp`);

  if (!fs.existsSync(w320)) {
    execSync(`convert "${f}" -resize 320x "${w320}"`);
  }
  if (!fs.existsSync(w640)) {
    execSync(`convert "${f}" -resize 640x "${w640}"`);
  }
  if (!fs.existsSync(w960)) {
    execSync(`convert "${f}" -resize 960x "${w960}"`);
  }
  if (!fs.existsSync(blur)) {
    execSync(`convert "${f}" -resize 24x -quality 20 "${blur}"`);
  }
}

console.log('All missing responsive variants successfully generated.');
