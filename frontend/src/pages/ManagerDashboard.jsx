import React, { useState, useEffect } from 'react';
import PendingApprovals from '../components/PendingApprovals';
import TeamCalendar from '../components/TeamCalendar';
import { leaveApi } from '../api';

export default function ManagerDashboard({ user }) {
  const [pending, setPending] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Fetch pending requests and approved team calendar from the deployed API on mount.
  // Approval/rejection actions are handled entirely via HMAC-signed email links
  // sent by the backend (notifyManagerWithToken Lambda) — there are no inline
  // approve/reject actions in this UI.
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setDataError(null);
      try {
        const [pendData, approvedData] = await Promise.all([
          leaveApi.getPendingApprovals(user.employee_id),
          leaveApi.getApprovedLeaves(),
        ]);
        setPending(pendData.pending || []);
        setApprovedLeaves(approvedData.approved_leaves || []);
      } catch (err) {
        setDataError(err.message || 'Failed to load manager data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user?.employee_id]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Manager & HR Operations</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Review pending team leave submissions and track overall absence schedules.
          Approval and rejection actions are completed via the secure links sent to your inbox.
        </p>
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

      {loadingData ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading team data…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
          <PendingApprovals requests={pending} />
          <TeamCalendar approvedLeaves={approvedLeaves} />
        </div>
      )}
    </div>
  );
}
