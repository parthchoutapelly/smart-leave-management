import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import LoginPage from './pages/LoginPage';
import { auth } from './auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('employee');

  useEffect(() => {
    const existing = auth.getUser();
    if (existing) {
      setUser(existing);
      setActiveTab(existing.role === 'manager' ? 'manager' : 'employee');
    }
  }, []);

  // Delegates fully to auth.login() so that employee_id, manager_id, and role
  // come from the Cognito session record — not from hardcoded ternaries here.
  const handleLogin = async (email, role) => {
    const loggedInUser = await auth.login(email, role);
    setUser(loggedInUser);
    setActiveTab(loggedInUser.role === 'manager' ? 'manager' : 'employee');
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main>
        {activeTab === 'employee' ? (
          <EmployeeDashboard user={user} />
        ) : (
          <ManagerDashboard user={user} />
        )}
      </main>
    </div>
  );
}
