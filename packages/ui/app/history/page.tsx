'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TestRun {
  id: string;
  type: string;
  endpoint: string;
  method: string;
  totalRequests: number;
  status: string;
  createdAt: string;
  summary?: string;
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:7842/api/tests/history')
      .then((r) => r.json())
      .then((data) => { setRuns(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', padding: '2rem', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#a78bfa' }}>Test History</h1>
        <Link href="/" style={{ color: '#7c3aed', textDecoration: 'none' }}>← New Test</Link>
      </div>

      {loading && <div style={{ color: '#888' }}>Loading...</div>}
      {!loading && runs.length === 0 && <div style={{ color: '#888' }}>No test runs yet.</div>}

      {runs.map((run) => {
        const summary = run.summary ? JSON.parse(run.summary) : null;
        return (
          <div key={run.id} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#7c3aed', textTransform: 'uppercase', fontSize: '0.75rem', marginRight: '0.75rem' }}>{run.type}</span>
                <span style={{ color: '#fff' }}>{run.method} {run.endpoint}</span>
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem' }}>{new Date(run.createdAt).toLocaleString()}</div>
            </div>
            {summary && (
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#888' }}>Requests: {summary.totalRequests}</span>
                <span style={{ color: '#22c55e' }}>Passed: {summary.passed}</span>
                <span style={{ color: summary.violations > 0 ? '#ef4444' : '#22c55e' }}>Violations: {summary.violations}</span>
                <span style={{ color: '#888' }}>Avg: {summary.avgLatencyMs}ms</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
