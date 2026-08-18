import React from 'react';

export default function Navbar({ user, onLogout, activeTab, setActiveTab }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#fff',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
        }}>
          L
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>LeaveFlow</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Serverless Leave Management</span>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('employee')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'employee' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            color: activeTab === 'employee' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Employee Dashboard
        </button>
        <button
          onClick={() => setActiveTab('manager')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'manager' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            color: activeTab === 'manager' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Manager / HR Portal
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'Priya Sharma'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {user?.employee_id || 'EMP001'} • <span style={{ textTransform: 'capitalize' }}>{user?.role || 'Employee'}</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
