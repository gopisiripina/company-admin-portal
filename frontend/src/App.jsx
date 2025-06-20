import React, { useState, useEffect } from 'react';
import Login from './pages/login';
import Dashboard from './pages/Dashboard.jsx';
import Sidebar from './pages/Sidebar.jsx';
import AnimatedBackground from './pages/AnimatedBackground';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check for existing session on initial load
  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData);
        setUserData(parsedData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('userData');
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setUserData({
      name: user.name || 'User',
      email: user.email,
      role: user.role || 'User'
    });
    setIsLoggedIn(true);
    
    // Store minimal user data in localStorage
    localStorage.setItem('userData', JSON.stringify({
      email: user.email,
      name: user.name || 'User'
    }));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    localStorage.removeItem('userData');
    setActiveSection('dashboard'); // Reset to default section
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarItemClick = (itemId) => {
    if (itemId === 'logout') {
      handleLogout();
    } else {
      setActiveSection(itemId);
    }
  };

  // Show nothing while checking auth state to prevent flash
  if (checkingAuth) {
    return null;
  }

  // Show login page WITHOUT animated background
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show dashboard WITH animated background if authenticated
  return (
    <AnimatedBackground>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          activeItem={activeSection}
          onItemClick={handleSidebarItemClick}
        />
        <Dashboard
          sidebarOpen={sidebarOpen}
          activeSection={activeSection}
          userData={userData}
          onLogout={handleLogout}
        />
      </div>
    </AnimatedBackground>
  );
};

export default App;