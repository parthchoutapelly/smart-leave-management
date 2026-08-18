import React, { useState } from 'react';
import PendingApprovals from '../components/PendingApprovals';
import TeamCalendar from '../components/TeamCalendar';

export default function ManagerDashboard({ user }) {
  const [pending, setPending] = useState([
    {
      request_id: 'REQ-20260818-002',
      employee_id: 'EMP001',
      leave_type: 'casual',
      start_date: '2026-08-28',
      end_date: '2026-08-28',
      num_days: 1,
      reason: 'Personal errand',
      status: 'submitted'
    },
    {
      request_id: 'REQ-20260818-005',
      employee_id: 'EMP004',
      leave_type: 'earned',
      start_date: '2026-09-01',
      end_date: '2026-09-07',
      num_days: 6,
      reason: 'Family vacation (requires HR co-approval)',
      status: 'submitted'
    }
  ]);

  const [approvedLeaves, setApprovedLeaves] = useState([
    {
      request_id: 'REQ-20260817-001',
      employee_id: 'EMP001',
      leave_type: 'sick',
      start_date: '2026-08-20',
      end_date: '2026-08-21',
      num_days: 2
    },
    {
      request_id: 'REQ-20260815-099',
      employee_id: 'EMP002',
      leave_type: 'casual',
      start_date: '2026-08-25',
      end_date: '2026-08-26',
      num_days: 2
    }
  ]);

  const [processingId, setProcessingId] = useState(null);

  const handleApprove = (req) => {
    setProcessingId(req.request_id);
    setTimeout(() => {
      setPending(pending.filter(p => p.request_id !== req.request_id));
      setApprovedLeaves([...approvedLeaves, req]);
      setProcessingId(null);
    }, 500);
  };

  const handleReject = (req) => {
    setProcessingId(req.request_id);
    setTimeout(() => {
      setPending(pending.filter(p => p.request_id !== req.request_id));
      setProcessingId(null);
    }, 500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Manager & HR Operations</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Review pending team leave submissions and track overall absence schedules.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        <PendingApprovals
          requests={pending}
          onApprove={handleApprove}
          onReject={handleReject}
          processingId={processingId}
        />
        <TeamCalendar approvedLeaves={approvedLeaves} />
      </div>
    </div>
  );
}
