import React from 'react';

export default function PendingApprovals({ requests, onApprove, onReject, processingId }) {
  if (!requests || requests.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No pending leave requests requiring action.
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Pending Team Approvals</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px' }}>Employee</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Duration</th>
              <th style={{ padding: '12px 16px' }}>Reason</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.request_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{req.employee_id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{req.request_id}</div>
                </td>
                <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{req.leave_type}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div>{req.num_days} day(s)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.start_date} to {req.end_date}</div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{req.reason || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onApprove(req)}
                      disabled={processingId === req.request_id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'var(--color-emerald)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(req)}
                      disabled={processingId === req.request_id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'var(--color-rose)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
