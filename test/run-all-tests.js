'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const testSuites = [
  { name: '1. Authentication, Sessions & RBAC Security', file: 'auth-security.test.js' },
  { name: '2. XSS Sanitization & URL Scheme Defense', file: 'xss-defense.test.js' },
  { name: '3. SQLite ACID Persistence & Concurrency Integrity', file: 'persistence-integrity.test.js' },
  { name: '4. Multi-Domain Threat Scoring & Confidence Engine', file: 'threat-scoring.test.js' },
  { name: '5. End-to-End API Security, CSRF & Helmet CSP', file: 'api-security-e2e.test.js' },
  { name: '6. Wildfire Regression & FIRMS Pipeline', file: 'wildfire-regression.test.js' },
  { name: '7. Adversarial Audit Regression & Server Crash Resistance', file: 'adversarial-audit-verification.test.js' }
];

console.log('============================================================');
console.log('   SENTINEL / KOSINT26 — OSCE TEST & VERIFICATION SUITE');
console.log('============================================================\n');

let passedCount = 0;
let failedCount = 0;
const failures = [];

for (const suite of testSuites) {
  const filePath = path.join(__dirname, suite.file);
  console.log(`▶ Running Suite: ${suite.name}...`);
  const result = spawnSync('node', [filePath], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' }
  });

  if (result.status === 0) {
    passedCount++;
    console.log(`  ✔ PASSED: ${suite.name}\n`);
  } else {
    failedCount++;
    failures.push({ name: suite.name, stdout: result.stdout, stderr: result.stderr });
    console.error(`  ✖ FAILED: ${suite.name}`);
    console.error(result.stdout);
    console.error(result.stderr);
    console.error('\n');
  }
}

console.log('============================================================');
console.log(`TOTAL SUITES: ${testSuites.length}`);
console.log(`PASSED:       ${passedCount}`);
console.log(`FAILED:       ${failedCount}`);
console.log('============================================================');

if (failedCount > 0) {
  console.error(`\n[FATAL] ${failedCount} test suite(s) failed. Aborting.`);
  process.exit(1);
} else {
  console.log('\n[SUCCESS] All test suites passed without error.\n');
  process.exit(0);
}
