'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Reproducer {
  id: string;
  testRunId: string;
  code: string;
  framework: string;
  createdAt: string;
  testRun?: {
    endpoint: string;
    method: string;
    type: string;
  };
}

export default function ReproducersPage() {
  const [reproducers, setReproducers] = useState<Reproducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:7842/api/reproducers')
      .then((r) => r.json())
      .then((data) => { setReproducers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const download = (code: string, id: string) => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raceguard-reproducer-${id.slice(0, 8)}.test.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', padding: '2rem', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#a78bfa' }}>Reproducers</h1>
        <Link href="/" style={{ color: '#7c3aed', textDecoration: 'none' }}>← New Test</Link>
      </div>

      {loading && <div style={{ color: '#888' }}>Loading...</div>}
      {!loading && reproducers.length === 0 && <div style={{ color: '#888' }}>No reproducers saved yet. Run a test that detects a violation.</div>}

      {reproducers.map((r) => (
        <div key={r.id} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ color: '#7c3aed', fontSize: '0.75rem', marginRight: '0.75rem', textTransform: 'uppercase' }}>{r.framework}</span>
              {r.testRun && <span style={{ color: '#fff' }}>{r.testRun.method} {r.testRun.endpoint}</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => copyToClipboard(r.code, r.id)} style={btnStyle}>
                {copied === r.id ? '✓ Copied' : 'Copy'}
              </button>
              <button onClick={() => download(r.code, r.id)} style={btnStyle}>Download</button>
            </div>
          </div>
          <pre style={{ background: '#0a0a0a', padding: '0.75rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.75rem', color: '#a3e635', maxHeight: '200px' }}>
            {r.code}
          </pre>
          <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.5rem' }}>{new Date(r.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = { background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem' };
