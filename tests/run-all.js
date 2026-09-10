'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TESTS_DIR = __dirname;
const files = fs.readdirSync(TESTS_DIR)
  .filter(f => f.endsWith('.test.js'))
  .sort();

console.log(`\n================================================================`);
console.log(`  KOSINT26 Comprehensive Forensic Test Suite Runner`);
console.log(`  Executing ${files.length} test suites...`);
console.log(`================================================================\n`);

const results = [];
const startTime = Date.now();

async function runTest(file, index) {
  const filePath = path.join(TESTS_DIR, file);
  const suiteName = file.replace('.test.js', '');

  return new Promise((resolve) => {
    const start = Date.now();
    const env = { ...process.env, NODE_ENV: 'test' };
    const child = spawn(process.execPath, [filePath], {
      cwd: path.join(__dirname, '..'),
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });

    child.on('close', (code) => {
      const duration = Date.now() - start;
      const passed = code === 0;
      results.push({ file, suiteName, passed, code, duration, stdout, stderr });

      const tag = passed ? ' \x1b[32mPASS\x1b[0m' : ' \x1b[31mFAIL\x1b[0m';
      const num = `[${String(index + 1).padStart(2, ' ')}/${files.length}]`;
      console.log(`${num} ${tag} ${file} (${duration}ms)`);

      if (!passed) {
        console.error(`\n--- FAILURE in ${file} ---`);
        if (stdout) console.log(stdout.trim());
        if (stderr) console.error(stderr.trim());
        console.error(`--------------------------------\n`);
      }

      resolve();
    });
  });
}

async function main() {
  for (let i = 0; i < files.length; i++) {
    await runTest(files[i], i);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`\n================================================================`);
  console.log(`  Test Execution Summary (${totalTime}s)`);
  console.log(`  Total Test Suites: ${results.length}`);
  console.log(`  Passed: \x1b[32m${passedCount}\x1b[0m`);
  console.log(`  Failed: ${failedCount > 0 ? `\x1b[31m${failedCount}\x1b[0m` : '0'}`);
  console.log(`================================================================\n`);

  if (failedCount > 0) {
    console.error(`❌ ${failedCount} test suite(s) failed.`);
    process.exit(1);
  } else {
    console.log(`✅ All ${passedCount} test suites passed cleanly (100% pass rate).`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
