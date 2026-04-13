'use client';

import { useState } from 'react';
import { useTestResults } from '../lib/socket';
import { StatsRow } from './StatsRow';
import { ResultsTimeline } from './ResultsTimeline';
import { ViolationCard } from './ViolationCard';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const TEST_TYPES = ['idempotency', 'invariant', 'flaky'];

export function TestBuilder() {
  const { state, reset } = useTestResults();
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('');
  const [testType, setTestType] = useState('idempotency');
  const [concurrency, setConcurrency] = useState(10);
  const [totalRequests, setTotalRequests] = useState(20);
  const [invariantRule, setInvariantRule] = useState('');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('');
  const [userTokens, setUserTokens] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async () => {
    if (!url) { setError('URL is required'); return; }
    setError('');
    setLoading(true);
    reset();

    try {
      const payload: any = { method, endpoint: url, totalRequests };
      if (body) { try { payload.body = JSON.parse(body); } catch { setError('Invalid JSON body'); setLoading(false); return; } }
      if (headers) { try { payload.headers = JSON.parse(headers); } catch { setError('Invalid JSON headers'); setLoading(false); return; } }
      if (userTokens) { payload.userTokens = userTokens.split('\n').map((t) => t.trim()).filter(Boolean); }
      if (testType === 'invariant') { payload.concurrency = concurrency; payload.invariantRule = invariantRule; }

      const res = await fetch(`http://localhost:7842/api/tests/${testType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Engine returned ${res.status}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const summary = state.summary;
  const passed = summary?.passed ?? 0;
  const violations = summary?.violations ?? 0;
  const avgLatencyMs = summary?.avgLatencyMs ?? 0;

  return (
    <div style={{ display: 'flex', gap: '2rem', minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '2rem', fontFamily: 'monospace' }}>
      {/* Left sidebar — form */}
      <div style={{ width: '320px', flexShrink: 0 }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#a78bfa' }}>RaceGuard</h2>

        <label style={labelStyle}>URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:3000/api/orders" style={inputStyle} />

        <label style={labelStyle}>Method</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {METHODS.map((m) => (
            <button key={m} onClick={() => setMethod(m)} style={{ ...btnStyle, background: method === m ? '#7c3aed' : '#1a1a1a' }}>{m}</button>
          ))}
        </div>

        <label style={labelStyle}>Test Type</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {TEST_TYPES.map((t) => (
            <button key={t} onClick={() => setTestType(t)} style={{ ...btnStyle, background: testType === t ? '#7c3aed' : '#1a1a1a', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        <label style={labelStyle}>Total Requests</label>
        <input type="number" value={totalRequests} onChange={(e) => setTotalRequests(Number(e.target.value))} style={inputStyle} />

        {testType === 'invariant' && (
          <>
            <label style={labelStyle}>Concurrency</label>
            <input type="range" min={2} max={200} value={concurrency} onChange={(e) => setConcurrency(Number(e.target.value))} style={{ width: '100%', marginBottom: '0.25rem' }} />
            <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '1rem' }}>{concurrency} concurrent</div>

            <label style={labelStyle}>Invariant Rule</label>
            <textarea value={invariantRule} onChange={(e) => setInvariantRule(e.target.value)} placeholder="return response.data.quantity >= 0" style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
          </>
        )}

        <label style={labelStyle}>Request Body (JSON)</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"productId": "123"}' style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />

        <label style={labelStyle}>Headers (JSON) — for JWT auth</label>
        <textarea value={headers} onChange={(e) => setHeaders(e.target.value)} placeholder='{"Authorization": "Bearer <token>"}' style={{ ...inputStyle, height: '60px', resize: 'vertical' }} />

        <label style={labelStyle}>User Tokens (one per line) — simulates multiple users</label>
        <textarea value={userTokens} onChange={(e) => setUserTokens(e.target.value)} placeholder={'token_user1\ntoken_user2\ntoken_user3'} style={{ ...inputStyle, height: '70px', resize: 'vertical' }} />

        {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}

        <button onClick={handleRun} disabled={loading} style={{ width: '100%', padding: '0.75rem', background: loading ? '#4c1d95' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
          {loading ? 'Running...' : 'Run Test'}
        </button>
      </div>

      {/* Right main area — results */}
      <div style={{ flex: 1 }}>
        {state.testRunId && (
          <>
            <StatsRow total={state.totalRequests} passed={passed} violations={violations} avgLatencyMs={avgLatencyMs} />
            <ResultsTimeline requests={state.requests} totalRequests={state.totalRequests} />
            {state.violations.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Violations</h3>
                {state.violations.map((v, i) => <ViolationCard key={i} violation={v} />)}
              </div>
            )}
            {state.completed && violations === 0 && (
              <div style={{ marginTop: '2rem', color: '#22c55e', fontSize: '1.25rem' }}>✓ No violations found</div>
            )}
          </>
        )}
        {!state.testRunId && (
          <div style={{ color: '#444', marginTop: '4rem', textAlign: 'center' }}>
            Configure a test and click Run to start
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle: React.CSSProperties = { width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff', padding: '0.5rem', marginBottom: '1rem', fontFamily: 'monospace', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { border: 'none', borderRadius: '4px', color: '#fff', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' };
