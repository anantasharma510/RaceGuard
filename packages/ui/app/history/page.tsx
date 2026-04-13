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

interface RequestEvent {
  id: string;
  requestNumber: number;
  statusCode?: number;
  latencyMs?: number;
  isViolation: boolean;
  responseBody?: string;
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selected, setSelected] = useState<TestRun | null>(null);
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    fetch('http://localhost:7842/api/tests/history')
      .then((r) => r.json())
      .then((data) => { setRuns(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openRun = async (run: TestRun) => {
    setSelected(run);
    setLoadingEvents(true);
    try {
      const res = await fetch(`http://localhost:7842/api/tests/${run.id}/events`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
    setLoadingEvents(false);
  };

  const summary = selected?.summary ? JSON.parse(selected.summary) : null;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', padding: '2rem', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#a78bfa' }}>Test History</h1>
        <Link href="/" style={{ color: '#7c3aed', textDecoration: 'none' }}>← New Test</Link>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Run list */}
        <div style={{ width: '380px', flexShrink: 0 }}>
          {loading && <div style={{ color: '#888' }}>Loading...</div>}
          {!loading && runs.length === 0 && <div style={{ color: '#888' }}>No test runs yet.</div>}
          {runs.map((run) => {
            const s = run.summary ? JSON.parse(run.summary) : null;
            return (
              <div
                key={run.id}
                onClick={() => openRun(run)}
                style={{ background: selected?.id === run.id ? '#1e1040' : '#1a1a1a', border: `1px solid ${selected?.id === run.id ? '#7c3aed' : '#333'}`, borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.5rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7c3aed', textTransform: 'uppercase', fontSize: '0.7rem' }}>{run.type}</span>
                  <span style={{ color: '#888', fontSize: '0.7rem' }}>{new Date(run.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ color: '#fff', fontSize: '0.875rem', marginTop: '0.25rem' }}>{run.method} {run.endpoint}</div>
                {s && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                    <span style={{ color: '#22c55e' }}>✓ {s.passed}</span>
                    <span style={{ color: s.violations > 0 ? '#ef4444' : '#888' }}>⚠ {s.violations}</span>
                    <span style={{ color: '#888' }}>{s.avgLatencyMs}ms</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail view */}
        {selected && (
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#a78bfa', marginBottom: '1rem' }}>{selected.method} {selected.endpoint}</h2>
            {summary && (
              <div style={{ display: 'flex', gap: '2rem', background: '#1a1a1a', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <Stat label="Total" value={summary.totalRequests} />
                <Stat label="Passed" value={summary.passed} color="#22c55e" />
                <Stat label="Failed" value={summary.failed} color={summary.failed > 0 ? '#f59e0b' : '#888'} />
                <Stat label="Violations" value={summary.violations} color={summary.violations > 0 ? '#ef4444' : '#22c55e'} />
                <Stat label="Avg Latency" value={`${summary.avgLatencyMs}ms`} />
              </div>
            )}
            {loadingEvents && <div style={{ color: '#888' }}>Loading events...</div>}
            {!loadingEvents && events.length > 0 && (
              <>
                <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{events.length} requests</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {events.map((e) => (
                    <div
                      key={e.id}
                      title={`#${e.requestNumber} — ${e.statusCode ?? 'err'} — ${e.latencyMs}ms${e.isViolation ? ' ⚠ VIOLATION' : ''}`}
                      style={{ width: '12px', height: '32px', borderRadius: '2px', background: e.isViolation ? '#ef4444' : (e.statusCode && e.statusCode >= 400) ? '#f59e0b' : '#22c55e', cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: color ?? '#fff' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#888' }}>{label}</div>
    </div>
  );
}
