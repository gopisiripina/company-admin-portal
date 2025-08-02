import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/auth/login';
import Dashboard from './pages/dashboard/Dashboard';
import Sidebar from './pages/dashboard/Sidebar';
import AnimatedBackground from './pages/dashboard/AnimatedBackground';
import CampusJobViewPage from './pages/job/CampusJobViewPage';
import ExamTakePage from './pages/job/ExamTakePage';

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
  const [isEmailAuthenticated, setIsEmailAuthenticated] = useState(false);
  const [activeEmailFolder, setActiveEmailFolder] = useState('inbox');

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check for existing session on initial load
  useEffect(() => {
    const savedUserData = sessionStorage.getItem('userData');
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
        sessionStorage.removeItem('userData');
      }
    }
    setCheckingAuth(false);
  }, [location.pathname, navigate]);

  useEffect(() => {
    // Handle URL-based navigation
    const path = location.pathname;
    
    // Skip navigation logic for public job application pages
    if (path.startsWith('/job-application') && !isLoggedIn) {
      setActiveSection('job-application');
      return;
    }else if (path.includes('/payroll')) {
      setActiveSection('payroll');
       }else if (path.includes('/leave-management')) {
      setActiveSection('leave-management');
    } else if (path.includes('/employee-attendance')) {
      setActiveSection('employee-attendance');
    } else if (path.includes('/mails')) {
      setActiveSection('mails');
    } else if (path.includes('/exam-conduct-page')) {
      setActiveSection('exam-conduct-page');
    } else if (path.includes('/on-campus-data')) {
      setActiveSection('on-campus-data');
    } else if (path.includes('/selected-list')) {
      setActiveSection('selected-list');
    } else if (path.includes('/job-application')) {
      setActiveSection('job-application');
    } else if (path.includes('/interview-management')) {
      setActiveSection('interview-management');
    } else if (path.includes('/resume-list')) {
      setActiveSection('resume-list');
    } else if (path.includes('/job-apply')) {
      setActiveSection('job-apply');
    } else if (path.includes('/job-post')) {
      setActiveSection('job-post');
    } else if (path.includes('/job-description')) {
      setActiveSection('job-description');
    } else if (path.includes('/hr')) {
      setActiveSection('Hr');
    } else if (path.includes('/project-budgeting')) {
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
  }, [location.pathname, isLoggedIn]); 

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
      profileImage: user.profileImage,
      photoURL: user.photoURL,
      isActive: user.isActive,
      employeeId: user.employeeId,
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
      sessionStorage.setItem('userData', JSON.stringify(completeUserData));
      
      // Verify storage
      const storedData = sessionStorage.getItem('userData');
      const parsedStoredData = JSON.parse(storedData);
      console.log('Verified sessionStorage data:', parsedStoredData);
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
    sessionStorage.removeItem('userData');
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
     if (itemId === 'exam-conduct-page') {
      navigate('/dashboard/exam-conduct-page', { replace: true });
    } else if (['inbox', 'compose', 'sent', 'trash'].includes(itemId)) {
  setActiveSection('mails'); // This makes Dashboard show EmailClient
  setActiveEmailFolder(itemId); // This tells EmailClient which folder to open
  navigate('/dashboard/mails', { replace: true });
}
else if (itemId === 'on-campus-data') {
      navigate('/dashboard/on-campus-data', { replace: true });
}else if (itemId === 'payroll') {
      navigate('/dashboard/payroll', { replace: true });
    } else if (itemId === 'leave-management') {
      navigate('/dashboard/leave-management', { replace: true });
        } else if (itemId === 'selected-list') {
      navigate('/dashboard/selected-list', { replace: true });
    } else if (itemId === 'job-application') {
      navigate('/dashboard/job-application', { replace: true });
    } else if (itemId === 'interview-management') {
      navigate('/dashboard/interview-management', { replace: true });
    } else if (itemId === 'resume-list') {
      navigate('/dashboard/resume-list', { replace: true });
    } else if (itemId === 'job-apply') {
      navigate('/dashboard/job-apply', { replace: true });
    } else if (itemId === 'job-post') {
      navigate('/dashboard/job-post', { replace: true });
    } else if (itemId === 'job-description') {
      navigate('/dashboard/job-description', { replace: true });
    } else if (itemId === 'Hr') {
      navigate('/dashboard/hr', { replace: true });
    } else if (itemId === 'project-budgeting') {
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
      <Route path="/campus-job-view" element={ 
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          width: '100vw'
        }}>
          <CampusJobViewPage />
        </div>
      } />
      
      <Route 
        path="/exam/:linkId" 
        element={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            width: '100vw'
          }}>
            <ExamTakePage />
          </div>
        } 
      />
      
      <Route path='/job-apply' element={<Navigate to='/dashboard/job-apply' replace />} />
      
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
      
      <Route 
        path="/job-application/*" 
        element={
          <AnimatedBackground>
            <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
              <Dashboard
                sidebarOpen={false}
                activeSection="job-application"
                userData={null}
                onLogout={null}
                isPublicAccess={true}
                onSectionChange={handleSidebarItemClick}
              />
            </div>
          </AnimatedBackground>
        } 
      />
      
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
                  isEmailAuthenticated={isEmailAuthenticated}
                />
                <Dashboard
                  sidebarOpen={sidebarOpen}
                  activeSection={activeSection}
                  activeEmailFolder={activeEmailFolder}
                  userData={userData}
                  onLogout={handleLogout}
                  onSectionChange={handleSidebarItemClick}
                  onToggleSidebar={handleToggleSidebar}
                  isEmailAuthenticated={isEmailAuthenticated}
                  setIsEmailAuthenticated={setIsEmailAuthenticated}
                />
              </div>
            </AnimatedBackground>
          </ProtectedRoute>
        } 
      />
      
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