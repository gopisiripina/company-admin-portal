import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/Dashboard.jsx';
import Sidebar from './pages/Sidebar.jsx';
import AnimatedBackground from './pages/AnimatedBackground';

// Protected Route component
const ProtectedRoute = ({ children, isLoggedIn }) => {
  return isLoggedIn ? children : <Navigate to="/" replace />;
};

// Main App component wrapped with router logic
const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check for existing session on initial load
  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData);
        console.log('Loading saved user data:', parsedData);
        console.log('Saved profileImage:', parsedData.profileImage);
        
        setUserData(parsedData);
        setIsLoggedIn(true);
        // If user is on login page but authenticated, redirect to dashboard
        if (location.pathname === '/') {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('userData');
      }
    }
    setCheckingAuth(false);
  }, [location.pathname, navigate]);

  useEffect(() => {
    // Handle URL-based navigation
    const path = location.pathname;
    if (path.includes('/project-timeline')) {
      setActiveSection('project-timeline');
    } else if (path.includes('/admin')) {
      setActiveSection('admin');
    } else if (path.includes('/employee')) {
      setActiveSection('employee');
    } else if (path === '/dashboard') {
      setActiveSection('dashboard');
    }
  }, [location.pathname]);
  useEffect(() => {
  // Handle URL-based navigation
  const path = location.pathname;
  if (path.includes('/project-budgeting')) {
    setActiveSection('project-budgeting');
  } else if (path.includes('/project-timeline')) {
    setActiveSection('project-timeline');
  } else if (path.includes('/admin')) {
    setActiveSection('admin');
  } else if (path.includes('/employee')) {
    setActiveSection('employee');
  } else if (path === '/dashboard') {
    setActiveSection('dashboard');
  }
}, [location.pathname]);

  const handleLoginSuccess = (user) => {
    console.log('=== Login Success Debug ===');
    console.log('Received user object:', user);
    console.log('User profileImage:', user.profileImage);
    console.log('User object keys:', Object.keys(user || {}));
    
    // Store the COMPLETE user object, not just selected fields
    const completeUserData = {
      id: user.id,
      name: user.name || 'User',
      email: user.email,
      role: user.role || 'User',
      profileImage: user.profileImage, // CRITICAL: Include profile image
      photoURL: user.photoURL,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.displayName,
      userType: user.userType
    };
    
    console.log('Setting complete user data:', completeUserData);
    console.log('Profile image in complete data:', completeUserData.profileImage);
    
    setUserData(completeUserData);
    setIsLoggedIn(true);
    
    // Store complete user data in localStorage
    try {
      localStorage.setItem('userData', JSON.stringify(completeUserData));
      
      // Verify storage
      const storedData = localStorage.getItem('userData');
      const parsedStoredData = JSON.parse(storedData);
      console.log('Verified localStorage data:', parsedStoredData);
      console.log('Verified profileImage in storage:', parsedStoredData.profileImage);
    } catch (error) {
      console.error('Error storing user data:', error);
    }
    
    // Navigate to dashboard after successful login
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    console.log('Logging out user');
    setIsLoggedIn(false);
    setUserData(null);
    localStorage.removeItem('userData');
    setActiveSection('dashboard'); // Reset to default section
    // Navigate to login page after logout
    navigate('/', { replace: true });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarItemClick = (itemId) => {
  if (itemId === 'logout') {
    handleLogout();
  } else {
    setActiveSection(itemId);
    // Update URL for specific sections
    if (itemId === 'project-budgeting') {
      navigate('/dashboard/project-budgeting', { replace: true });
    } else if (itemId === 'project-timeline') {
      navigate('/dashboard/project-timeline', { replace: true });
    } else if (itemId === 'admin') {
      navigate('/dashboard/admin', { replace: true });
    } else if (itemId === 'employee') {
      navigate('/dashboard/employee', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }
};

  // Show loading while checking auth state
  if (checkingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f0f0f0'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/" 
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )
        } 
      />
      
      {/* Dashboard Route */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <AnimatedBackground>
              <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
                <Sidebar
                  isOpen={sidebarOpen}
                  onToggle={toggleSidebar}
                  activeItem={activeSection}
                  onItemClick={handleSidebarItemClick}
                  userRole={userData?.role}
                />
                <Dashboard
                  sidebarOpen={sidebarOpen}
                  activeSection={activeSection}
                  userData={userData}
                  onLogout={handleLogout}
                />
              </div>
            </AnimatedBackground>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route - redirect to appropriate page */}
      <Route 
        path="*" 
        element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />} 
      />
    </Routes>
  );
};

// Main App component with Router wrapper
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;