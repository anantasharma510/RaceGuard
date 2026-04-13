import { ViolationEvent } from '../lib/socket';

interface ViolationCardProps {
  violation: ViolationEvent;
  onSaveReproducer?: () => void;
}

export function ViolationCard({ violation, onSaveReproducer }: ViolationCardProps) {
  return (
    <div style={{ background: '#2a0a0a', border: '1px solid #ef4444', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
      <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        ⚠ Violation detected — Request #{violation.requestNumber}
      </div>
      {violation.rule && (
        <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
          Rule: <code style={{ color: '#fbbf24' }}>{violation.rule}</code>
        </div>
      )}
      {violation.actualValue && (
        <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          Actual: <code style={{ color: '#f87171' }}>{violation.actualValue}</code>
        </div>
      )}
      {onSaveReproducer && (
        <button
          onClick={onSaveReproducer}
          style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Save Reproducer
        </button>
      )}
    </div>
  );
}
