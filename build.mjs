import { mkdir, copyFile, writeFile } from 'node:fs/promises';
const files = ['index.html', 'app.js', 'geometry.js', 'style.css'];
await mkdir('docs', { recursive: true });
for (const file of files) await copyFile(`src/${file}`, `docs/${file}`);
await writeFile('docs/.nojekyll', '');
console.log('GitHub Pages output: docs/ (5 files)');
