import React from 'react';

export default function HistoryTable({ requests }) {
  if (!requests || requests.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No leave applications found.
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Application History</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px' }}>Request ID</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Dates</th>
              <th style={{ padding: '12px 16px' }}>Days</th>
              <th style={{ padding: '12px 16px' }}>Reason</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.request_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#a5b4fc' }}>{req.request_id}</td>
                <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{req.leave_type}</td>
                <td style={{ padding: '12px 16px' }}>{req.start_date} to {req.end_date}</td>
                <td style={{ padding: '12px 16px' }}>{req.num_days}d</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{req.reason || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`badge badge-${req.status}`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
