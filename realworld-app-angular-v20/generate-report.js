#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const coverageJsonPath = 'coverage/coverage.json';
const reportDir = 'coverage/frontend';
const instrumentedSrc = 'coverage/instrumented';
const instrumentedDst = 'instrumented';

if (!fs.existsSync(coverageJsonPath)) {
  console.error(`ERRO: ${coverageJsonPath} nao encontrado.`);
  process.exit(1);
}
const coverage = JSON.parse(fs.readFileSync(coverageJsonPath, 'utf-8'));
const fileCount = Object.keys(coverage).length;
if (fileCount === 0) { console.log('Nenhum dado de cobertura.'); process.exit(0); }
console.log(`Carregado coverage.json com ${fileCount} arquivos.`);

if (fs.existsSync(instrumentedSrc)) {
  fs.rmSync(instrumentedDst, { recursive: true, force: true });
  fs.mkdirSync(instrumentedDst, { recursive: true });
  for (const f of fs.readdirSync(instrumentedSrc))
    fs.copyFileSync(path.join(instrumentedSrc, f), path.join(instrumentedDst, f));
  console.log(`Copiados fontes para ${instrumentedDst}/`);
}

const libCoverage = require('istanbul-lib-coverage');
const reports = require('istanbul-reports');
const Context = require('istanbul-lib-report/lib/context');
const SummarizerFactory = require('istanbul-lib-report/lib/summarizer-factory');

const coverageMap = libCoverage.createCoverageMap();
for (const [fp, data] of Object.entries(coverage)) {
  const fc = libCoverage.createFileCoverage(fp);
  fc.data = data;
  coverageMap.addFileCoverage(fc);
}

// ── Beautifier O(n) para JS minificado ──────────────────
function beautifyJS(code) {
  const out = [];
  let indent = 0;
  let current = '';
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === '{') {
      current += ch;
      out.push('  '.repeat(indent) + current.trim());
      current = '';
      indent++;
    } else if (ch === '}') {
      if (current.trim()) {
        out.push('  '.repeat(indent) + current.trim());
        current = '';
      }
      indent = Math.max(0, indent - 1);
      current += ch;
      // pega o próximo não-espaço para decidir se fecha a linha
      let j = i + 1;
      while (j < code.length && code[j] === ' ') j++;
      if (j < code.length) {
        const next = code[j];
        if (next === ';' || next === '}') {
          current += next;
          out.push('  '.repeat(indent) + current.trim());
          current = '';
          i = next === ';' ? j : j - 1;
          if (next === '}') i = j - 1;
          else i = j;
        }
      }
      if (current.trim()) {
        out.push('  '.repeat(indent) + current.trim());
        current = '';
      }
    } else if (ch === ';') {
      current += ch;
      out.push('  '.repeat(indent) + current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push('  '.repeat(indent) + current.trim());
  return out.join('\n');
}

const context = new Context({
  dir: reportDir,
  coverageMap,
  defaultSummarizer: 'pkg',
  watermarks: { statements: [50,80], functions: [50,80], branches: [50,80], lines: [50,80] },
  sourceFinder: (fp) => {
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, 'utf-8');
    const lines = raw.split('\n');
    return lines.length < 20 ? beautifyJS(raw) : raw;
  }
});

const sf = new SummarizerFactory(coverageMap, 'pkg');
const method = sf._createPkg ? '_createPkg' : (sf._createNested ? '_createNested' : null);
if (!method) {
  // Fallback: usa o getter .pkg que chama _createPkg internamente
  const tree = sf.pkg;
  tree.visit(reports.create('html', { maxCols: 120 }), context);
  tree.visit(reports.create('text', { maxCols: 120 }), context);
  tree.visit(reports.create('text-summary'), context);
} else {
  const tree = sf[method]();
  tree.visit(reports.create('html', { maxCols: 120 }), context);
  tree.visit(reports.create('text', { maxCols: 120 }), context);
  tree.visit(reports.create('text-summary'), context);
}
console.log(`\nRelatorio: ${reportDir}/index.html`);
