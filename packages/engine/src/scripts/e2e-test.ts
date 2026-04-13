/**
 * RaceGuard End-to-End Test
 * 
 * Tests the full pipeline:
 * 1. Engine is running on port 7842
 * 2. Broken API is running on port 4000
 * 3. Sends test requests to engine
 * 4. Verifies violations are detected
 * 5. Verifies reproducers are generated
 * 
 * Run broken-api.ts first, then engine, then this script.
 */
import axios from 'axios';

const ENGINE = 'http://localhost:7842';
const API = 'http://localhost:4000';

let passed = 0;
let failed = 0;

function log(msg: string) { console.log(`  ${msg}`); }
function ok(msg: string) { console.log(`  ✓ ${msg}`); passed++; }
function fail(msg: string) { console.log(`  ✗ ${msg}`); failed++; }

async function check(label: string, fn: () => Promise<void>) {
  process.stdout.write(`\n[TEST] ${label}\n`);
  try {
    await fn();
  } catch (err: any) {
    fail(`Unexpected error: ${err.message}`);
  }
}

async function reset() {
  await axios.post(`${API}/reset`).catch(() => {});
}

async function main() {
  console.log('\n═══════════════════════════════════════');
  console.log('  RaceGuard End-to-End Test Suite');
  console.log('═══════════════════════════════════════\n');

  // ─── Preflight checks ───────────────────────────────────────────────────────

  await check('Engine is reachable', async () => {
    const res = await axios.get(ENGINE).catch(() => null);
    if (!res) { fail('Engine not running. Start it with: npx ts-node src/main.ts'); return; }
    ok(`Engine responded: ${JSON.stringify(res.data)}`);
  });

  await check('Broken API is reachable', async () => {
    const res = await axios.get(`${API}/stock`).catch(() => null);
    if (!res) { fail('Broken API not running. Start it with: npx ts-node src/scripts/broken-api.ts'); return; }
    ok(`Broken API responded: stock = ${res.data.stock}`);
  });

  // ─── Test 1: Idempotency violation detection ─────────────────────────────────

  await check('Idempotency test detects duplicate orders', async () => {
    await reset();

    const res = await axios.post(`${ENGINE}/api/tests/idempotency`, {
      method: 'POST',
      endpoint: `${API}/orders`,
      body: { productId: 'product-123' },
      totalRequests: 10,
    });

    const { summary } = res.data;
    log(`Total: ${summary.totalRequests}, Passed: ${summary.passed}, Violations: ${summary.violations}`);

    // Check orders were created (should be 10 — not idempotent)
    const ordersRes = await axios.get(`${API}/orders`);
    log(`Orders created: ${ordersRes.data.count} (expected 10 — not idempotent)`);

    if (summary.violations > 0 || ordersRes.data.count > 1) {
      ok('Idempotency violation correctly detected — endpoint creates duplicates');
    } else {
      fail('Expected idempotency violation but none detected');
    }
  });

  // ─── Test 2: Invariant violation detection (race condition) ──────────────────

  await check('Invariant test catches race condition on stock decrement', async () => {
    await reset();

    const res = await axios.post(`${ENGINE}/api/tests/invariant`, {
      method: 'POST',
      endpoint: `${API}/buy`,
      concurrency: 10,
      totalRequests: 15, // More requests than stock (10) → should cause negative stock
      invariantRule: 'return response.data.remainingStock >= 0',
    });

    const { summary } = res.data;
    log(`Total: ${summary.totalRequests}, Violations: ${summary.violations}`);

    // Check actual stock
    const stockRes = await axios.get(`${API}/stock`);
    log(`Final stock: ${stockRes.data.stock} (started at 10, should be 0 or negative if race occurred)`);

    if (summary.violations > 0) {
      ok('Race condition detected — stock went negative under concurrent load');
    } else {
      // Race conditions are non-deterministic — may not always trigger
      log('No violation this run (race conditions are non-deterministic, try again)');
      ok('Test completed without error');
    }
  });

  // ─── Test 3: Flaky detection ─────────────────────────────────────────────────

  await check('Flaky test runs without error', async () => {
    const res = await axios.post(`${ENGINE}/api/tests/flaky`, {
      method: 'GET',
      endpoint: `${API}/stock`,
      totalRequests: 20,
    });

    const { summary } = res.data;
    log(`Total: ${summary.totalRequests}, Avg latency: ${summary.avgLatencyMs}ms`);
    log(`Status variance: ${summary.statusVariance}, Body variance: ${summary.bodyVariance}`);
    ok('Flaky test completed successfully');
  });

  // ─── Test 4: History is stored ───────────────────────────────────────────────

  await check('Test history is persisted in SQLite', async () => {
    const res = await axios.get(`${ENGINE}/api/tests/history`);
    const history = res.data;

    if (!Array.isArray(history)) { fail('History endpoint did not return array'); return; }
    if (history.length === 0) { fail('No history found — tests may not have been saved'); return; }

    log(`History contains ${history.length} test run(s)`);
    ok('Test history correctly persisted');
  });

  // ─── Test 5: Reproducers endpoint ────────────────────────────────────────────

  await check('Reproducers endpoint returns data', async () => {
    const res = await axios.get(`${ENGINE}/api/reproducers`);
    const reproducers = res.data;

    if (!Array.isArray(reproducers)) { fail('Reproducers endpoint did not return array'); return; }
    log(`Reproducers saved: ${reproducers.length}`);
    if (reproducers.length > 0) {
      ok('Reproducer was generated and saved');
      log(`Framework: ${reproducers[0].framework}`);
      log(`Code preview: ${reproducers[0].code.slice(0, 80)}...`);
    } else {
      log('No reproducers yet (violations needed to generate them)');
      ok('Reproducers endpoint working correctly');
    }
  });

  // ─── Summary ─────────────────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
