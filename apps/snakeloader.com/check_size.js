const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '_templates', '_data', 'pages');
const downloaders = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());

const langsToCheck = ['ms', 'pt', 'it', 'en'];

for (const dl of downloaders) {
  for (const lang of langsToCheck) {
    const file = path.join(baseDir, dl, `${lang}.json`);
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`${dl}/${lang}.json: ${stats.size} bytes`);
    }
  }
  console.log('---');
}
