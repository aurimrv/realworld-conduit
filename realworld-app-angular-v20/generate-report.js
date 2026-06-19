#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const coverageJsonPath = 'coverage/coverage.json';
const reportDir = 'coverage/frontend';
const instrumentedSrc = 'coverage/original-js';  // JS limpos (sem instrumentação)
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

const context = new Context({
  dir: reportDir,
  coverageMap,
  defaultSummarizer: 'pkg',
  watermarks: { statements: [50,80], functions: [50,80], branches: [50,80], lines: [50,80] },
  sourceFinder: (fp) => (fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : null)
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
