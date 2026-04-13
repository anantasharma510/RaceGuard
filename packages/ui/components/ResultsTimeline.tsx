import { RequestEvent } from '../lib/socket';

interface ResultsTimelineProps {
  requests: RequestEvent[];
  totalRequests: number;
}

export function ResultsTimeline({ requests, totalRequests }: ResultsTimelineProps) {
  return (
    <div>
      <div style={{ marginBottom: '0.5rem', color: '#888', fontSize: '0.875rem' }}>
        {requests.length} / {totalRequests} requests
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        {requests.map((r, i) => (
          <div
            key={i}
            title={`#${r.requestNumber} — ${r.statusCode ?? 'err'} — ${r.latencyMs}ms${r.isViolation ? ' ⚠ VIOLATION' : ''}`}
            style={{
              width: '12px',
              height: '32px',
              borderRadius: '2px',
              background: r.isViolation ? '#ef4444' : (r.statusCode && r.statusCode >= 400) ? '#f59e0b' : '#22c55e',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}
