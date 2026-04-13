interface StatsRowProps {
  total: number;
  passed: number;
  violations: number;
  avgLatencyMs: number;
}

export function StatsRow({ total, passed, violations, avgLatencyMs }: StatsRowProps) {
  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: '#1a1a1a', borderRadius: '8px', marginBottom: '1rem' }}>
      <Stat label="Total" value={total} />
      <Stat label="Passed" value={passed} color="#22c55e" />
      <Stat label="Violations" value={violations} color={violations > 0 ? '#ef4444' : '#22c55e'} />
      <Stat label="Avg Latency" value={`${avgLatencyMs}ms`} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color ?? '#fff' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#888' }}>{label}</div>
    </div>
  );
}
