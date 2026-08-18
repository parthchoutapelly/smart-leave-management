import React from 'react';

export default function BalanceCard({ title, used, remaining, total, color = 'indigo' }) {
  const percentage = Math.min(100, Math.round((remaining / (total || 1)) * 100));

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{title} Leave</h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quota: {total}d</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '1rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{remaining}</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>days left</span>
      </div>

      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color === 'emerald' ? 'var(--color-emerald)' : color === 'amber' ? 'var(--color-amber)' : 'var(--color-indigo)',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        <span>Used: {used}d</span>
        <span>{percentage}% remaining</span>
      </div>
    </div>
  );
}
