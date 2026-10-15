import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
test('Pages project subpath serves HTML, stylesheet and ES modules', async () => {
  const allowed = ['index.html', 'app.js', 'geometry.js', 'style.css'];
  const server = http.createServer(async (req, res) => {
    const file = req.url === '/wafer-simulator-demo/' ? 'index.html' : req.url.replace('/wafer-simulator-demo/', '');
    if (!allowed.includes(file)) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(await readFile(`docs/${file}`));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/wafer-simulator-demo/`;
    const html = await (await fetch(base)).text();
    assert.match(html, /src="app.js"/);
    assert.match(html, /href="style.css"/);
    for (const file of allowed) {
      const response = await fetch(new URL(file, base));
      assert.equal(response.status, 200);
      assert.ok((await response.text()).length > 0);
      if (file.endsWith('.js')) assert.match(response.headers.get('content-type'), /javascript/);
    }
    assert.match(await readFile('docs/app.js', 'utf8'), /from'\.\/geometry.js'/);
    for (const file of allowed) assert.deepEqual(await readFile(`src/${file}`), await readFile(`docs/${file}`));
    assert.equal((await readFile('docs/.nojekyll')).length, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
