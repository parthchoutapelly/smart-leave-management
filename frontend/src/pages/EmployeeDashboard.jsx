import React, { useState, useEffect } from 'react';
import BalanceCard from '../components/BalanceCard';
import ApplyForm from '../components/ApplyForm';
import HistoryTable from '../components/HistoryTable';
import { leaveApi } from '../api';

// Maps leave_type_year key (e.g. "sick#2026") to just the leave type string.
const parseLeaveType = (leave_type_year) => (leave_type_year || '').split('#')[0];

// Visual color per leave type for the BalanceCard progress bar.
const COLOR_MAP = { sick: 'indigo', casual: 'emerald', earned: 'amber', unpaid: 'rose' };

export default function EmployeeDashboard({ user }) {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch balances and leave history from the deployed API on mount (and when
  // the logged-in employee changes, e.g. after a re-login).
  useEffect(() => {
    if (!user?.employee_id) return;

    const fetchData = async () => {
      setLoadingData(true);
      setDataError(null);
      try {
        const [balData, reqData] = await Promise.all([
          leaveApi.getBalances(user.employee_id),
          leaveApi.getRequests(user.employee_id),
        ]);
        setBalances(balData.balances || []);
        setRequests(reqData.requests || []);
      } catch (err) {
        setDataError(err.message || 'Failed to load leave data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user?.employee_id]);

  const handleApply = async (formData) => {
    setLoading(true);
    setNotification(null);

    try {
      // Build the full payload the Lambda expects:
      //   { employee_id, leave_type, start_date, end_date, manager_id, reason }
      // employee_id and manager_id come from the Cognito user session, not the form.
      const payload = {
        employee_id: user.employee_id,
        manager_id: user.manager_id,
        ...formData, // leave_type, start_date, end_date, reason
      };

      const result = await leaveApi.submitLeave(payload);

      if (result.status === 'rejected') {
        // Backend rejected before workflow start (e.g. insufficient balance, date overlap).
        // result shape: { status, request_id, reason, remaining_balance?, requested_days? }
        const detail =
          result.remaining_balance !== undefined
            ? ` Balance remaining: ${result.remaining_balance}d, requested: ${result.requested_days}d.`
            : '';
        setNotification({
          type: 'error',
          message: `Request rejected — ${result.reason}.${detail}`,
        });
      } else {
        // result shape: { status: "submitted", request_id, message }
        setNotification({ type: 'success', message: result.message || 'Leave request submitted for approval!' });
      }

      // Refresh history table for both outcomes: the backend writes a leave_requests
      // record immediately on rejection (status: "rejected") as well as on submission
      // (status: "submitted"), so the employee should see the new row in both cases.
      const reqData = await leaveApi.getRequests(user.employee_id);
      setRequests(reqData.requests || []);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Welcome back, {user?.name}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your leave balances, submit requests, and track approval status.</p>
      </div>

      {/* API load error */}
      {dataError && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          fontSize: '0.875rem'
        }}>
          {dataError}
        </div>
      )}

      {/* Submit result notification */}
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
      {loadingData ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading balances…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {balances.map((b) => {
            const leaveType = parseLeaveType(b.leave_type_year);
            return (
              <BalanceCard
                key={b.leave_type_year}
                title={leaveType}
                used={b.used ?? 0}
                remaining={b.remaining ?? 0}
                total={b.total_quota ?? 0}
                color={COLOR_MAP[leaveType] || 'indigo'}
              />
            );
          })}
        </div>
      )}

      {/* Main Grid: Form + History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>
        <ApplyForm onSubmit={handleApply} loading={loading} />
        <HistoryTable requests={loadingData ? [] : requests} />
      </div>
    </div>
  );
}
