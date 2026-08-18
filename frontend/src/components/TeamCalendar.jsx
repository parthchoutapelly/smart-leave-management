import React from 'react';

export default function TeamCalendar({ approvedLeaves }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Team Absence Calendar</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>August 2026</span>
      </div>

      {(!approvedLeaves || approvedLeaves.length === 0) ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No approved leaves scheduled for the team this month.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {approvedLeaves.map((item) => (
            <div
              key={item.request_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--color-indigo)'
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.employee_id}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '8px' }}>
                  ({item.leave_type})
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                {item.start_date} &rarr; {item.end_date} ({item.num_days}d)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
