export function printProgress(data: any): void {
  if (!data) return;
  const { completed, total, violations } = data;
  if (completed !== undefined && total !== undefined) {
    const pct = Math.round((completed / total) * 100);
    console.log(`Progress: ${completed}/${total} requests (${pct}%) — Violations: ${violations ?? 0}`);
  }
}

export function printSummary(data: any): void {
  if (!data?.summary) return;
  const s = data.summary;
  console.log('\n─────────────────────────────────────');
  console.log('  RaceGuard Summary');
  console.log('─────────────────────────────────────');
  console.log(`  Total requests : ${s.totalRequests ?? '-'}`);
  console.log(`  Passed         : ${s.passed ?? '-'}`);
  console.log(`  Failed         : ${s.failed ?? '-'}`);
  console.log(`  Violations     : ${s.violations ?? 0}`);
  console.log(`  Avg latency    : ${s.avgLatencyMs ?? '-'}ms`);
  console.log('─────────────────────────────────────\n');

  if (s.violations > 0) {
    console.error('\x1b[31m⚠ Race condition detected! Check the UI or run with --ui for details.\x1b[0m\n');
  } else {
    console.log('\x1b[32m✓ No violations found.\x1b[0m\n');
  }
}

export function printError(message: string): void {
  console.error(`\x1b[31mError: ${message}\x1b[0m`);
}
