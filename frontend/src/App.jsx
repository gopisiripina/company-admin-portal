import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/Dashboard.jsx';
import Sidebar from './pages/Sidebar.jsx';
import AnimatedBackground from './pages/AnimatedBackground';
import AdminManagement from './pages/AdminManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import { Search, Bell } from 'lucide-react';
import ProfileSection from './pages/ProfileSection';

// Protected Route component
const ProtectedRoute = ({ children, isLoggedIn }) => {
  return isLoggedIn ? children : <Navigate to="/" replace />;
};

// Generic page component for project management sections
const ProjectManagementPage = ({ title, sidebarOpen, userData }) => {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <header className="dashboard-header">
        <div className="search-container">
          <Search size={22} className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            className="search-input"
          />
        </div>
        <div className="header-right">
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>
          {/* Fixed: Pass userData to ProfileSection */}
          <ProfileSection userData={userData} />
        </div>
      </header>
      <main className="main-content">
        <div className="content-container">
          <div className="welcome-header">
            <h1 className="welcome-title">{title}</h1>
            <p className="welcome-subtitle">
              {title} content will be implemented here.
            </p>
          </div>
          {/* Add your specific component content here */}
        </div>
      </main>
    </div>
  );
};

// Layout component for dashboard pages with sidebar
const DashboardLayout = ({ children, sidebarOpen, setSidebarOpen, activeSection, setActiveSection, userData, handleLogout }) => {
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarItemClick = (itemId) => {
    if (itemId === 'logout') {
      handleLogout();
      return;
    }

    setActiveSection(itemId);
    
    // Route mapping for all sidebar items
    const routeMap = {
      'dashboard': '/dashboard',
      'admin': '/admin',
      'employee': '/employee',
      'project-timeline': '/project/timeline',
      'project-budgeting': '/project/budgeting',
      'gantt-chart': '/project/gantt-chart',
      'agile-project-plan': '/project/agile-plan',
      'project-tracker': '/project/tracker',
      'issue-tracker': '/project/issues',
      'project-risk': '/project/risk',
      'project-report': '/project/reports',
      'kt': '/project/kt'
    };

    const route = routeMap[itemId];
    if (route) {
      navigate(route);
    }
  };

  return (
    <AnimatedBackground>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          activeItem={activeSection}
          onItemClick={handleSidebarItemClick}
          userRole={userData?.role}
        />
        {children}
      </div>
    </AnimatedBackground>
  );
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

  // Update active section based on current route
  useEffect(() => {
    const path = location.pathname;
    const pathToSectionMap = {
      '/dashboard': 'dashboard',
      '/admin': 'admin',
      '/employee': 'employee',
      '/project/timeline': 'project-timeline',
      '/project/budgeting': 'project-budgeting',
      '/project/gantt-chart': 'gantt-chart',
      '/project/agile-plan': 'agile-project-plan',
      '/project/tracker': 'project-tracker',
      '/project/issues': 'issue-tracker',
      '/project/risk': 'project-risk',
      '/project/reports': 'project-report',
      '/project/kt': 'kt'
    };

    const section = pathToSectionMap[path];
    if (section) {
      setActiveSection(section);
    }
  }, [location.pathname]);

  // Check for existing session on initial load
  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData);
        setUserData(parsedData);
        setIsLoggedIn(true);
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

  const handleLoginSuccess = (user) => {
    setUserData({
      name: user.name || 'User',
      email: user.email,
      role: user.role || 'User',
      profileImage: user.profileImage || null
    });
    setIsLoggedIn(true);
    
    localStorage.setItem('userData', JSON.stringify({
      email: user.email,
      name: user.name || 'User',
      role: user.role || 'User',
      profileImage: user.profileImage || null
    }));
    
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    localStorage.removeItem('userData');
    setActiveSection('dashboard');
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
    if (itemId === 'project-timeline') {
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
        path="/dashboard" 
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