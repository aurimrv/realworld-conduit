const http = require('http');
const fs = require('fs');

const OUTPUT = '/app/coverage/coverage.json';
const DOCKER_PREFIX = '/app/dist/realworld-app/browser/';
const ORIGINAL_PREFIX = '/usr/share/nginx/html/original-js/';

function loadExisting() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function normalizeBranches(data) {
  for (const key of Object.keys(data)) {
    const entry = data[key];
    const b = entry.b;
    if (!b || typeof b !== 'object') continue;
    if (Array.isArray(b)) {
      const dict = {};
      for (let i = 0; i < b.length; i++) {
        const v = b[i];
        dict[i] = Array.isArray(v) ? v.map(n => parseInt(n) || 0) : [parseInt(v) || 0, 0];
      }
      entry.b = dict;
    } else {
      for (const idx of Object.keys(b)) {
        const v = b[idx];
        b[idx] = Array.isArray(v) ? v.map(n => parseInt(n) || 0) : [parseInt(v) || 0, 0];
      }
    }
  }
  return data;
}

function mergeCoverage(existing, incoming) {
  const merged = JSON.parse(JSON.stringify(existing));
  for (const [key, value] of Object.entries(incoming)) {
    if (merged[key]) {
      const s = merged[key].s;
      const inc = value.s;
      for (const idx in inc) {
        s[idx] = (parseInt(s[idx]) || 0) + (parseInt(inc[idx]) || 0);
      }
      const f = merged[key].f;
      const incF = value.f;
      for (const idx in incF) {
        f[idx] = (parseInt(f[idx]) || 0) + (parseInt(incF[idx]) || 0);
      }
      const b = merged[key].b || {};
      const incB = value.b || {};
      for (const idx in incB) {
        b[idx] = (parseInt(b[idx]) || 0) + (parseInt(incB[idx]) || 0);
      }
      merged[key].b = b;
    } else {
      merged[key] = JSON.parse(JSON.stringify(value));
    }
  }
  return merged;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        const remapped = {};
        for (const [key, value] of Object.entries(incoming)) {
          const newKey = key.startsWith(DOCKER_PREFIX)
            ? './instrumented/' + key.slice(DOCKER_PREFIX.length)
            : key;
          value.path = newKey;
          remapped[newKey] = value;
        }
        const existing = loadExisting();
        const merged = normalizeBranches(mergeCoverage(existing, remapped));
        fs.mkdirSync('/app/coverage', { recursive: true });
        fs.writeFileSync(OUTPUT, JSON.stringify(merged));
        res.writeHead(200);
        res.end('saved');
      } catch (e) {
        res.writeHead(500);
        res.end('error: ' + e.message);
      }
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/reset') {
    try {
      fs.writeFileSync(OUTPUT, '{}');
      res.writeHead(200);
      res.end('reset');
    } catch (e) {
      res.writeHead(500);
      res.end('error');
    }
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(3000, '127.0.0.1', () =>
  console.log('coverage-collector listening on 127.0.0.1:3000')
);