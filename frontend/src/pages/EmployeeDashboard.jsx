import React, { useState } from 'react';
import BalanceCard from '../components/BalanceCard';
import ApplyForm from '../components/ApplyForm';
import HistoryTable from '../components/HistoryTable';

export default function EmployeeDashboard({ user }) {
  const [balances, setBalances] = useState([
    { leave_type: 'sick', used: 2, remaining: 10, total_quota: 12, color: 'indigo' },
    { leave_type: 'casual', used: 1, remaining: 11, total_quota: 12, color: 'emerald' },
    { leave_type: 'earned', used: 0, remaining: 18, total_quota: 18, color: 'amber' },
  ]);

  const [requests, setRequests] = useState([
    {
      request_id: 'REQ-20260817-001',
      leave_type: 'sick',
      start_date: '2026-08-20',
      end_date: '2026-08-21',
      num_days: 2,
      reason: 'Medical checkup',
      status: 'approved'
    },
    {
      request_id: 'REQ-20260818-002',
      leave_type: 'casual',
      start_date: '2026-08-28',
      end_date: '2026-08-28',
      num_days: 1,
      reason: 'Personal errand',
      status: 'submitted'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleApply = async (formData) => {
    setLoading(true);
    setNotification(null);

    try {
      // Mock submit simulation or API call
      const newReq = {
        request_id: `REQ-${Date.now()}`,
        ...formData,
        num_days: 2,
        status: 'submitted'
      };

      setRequests([newReq, ...requests]);
      setNotification({ type: 'success', message: 'Leave application submitted for approval!' });
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Welcome back, {user?.name || 'Priya'}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your leave balances, submit requests, and track approval status.</p>
      </div>

      {notification && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: notification.type === 'success' ? '#34d399' : '#fb7185',
          fontSize: '0.875rem'
        }}>
          {notification.message}
        </div>
      )}

      {/* Leave Balances Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {balances.map((b) => (
          <BalanceCard
            key={b.leave_type}
            title={b.leave_type}
            used={b.used}
            remaining={b.remaining}
            total={b.total_quota}
            color={b.color}
          />
        ))}
      </div>

      {/* Main Grid: Form + History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>
        <ApplyForm onSubmit={handleApply} loading={loading} />
        <HistoryTable requests={requests} />
      </div>
    </div>
  );
}
