import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/auth/login';
import Dashboard from './pages/dashboard/Dashboard';
import Sidebar from './pages/dashboard/Sidebar';
import AnimatedBackground from './pages/dashboard/AnimatedBackground';
import CampusJobViewPage from './pages/job/CampusJobViewPage';
import ExamTakePage from './pages/job/ExamTakePage';

import authService from './supabase/authService';

import CandidateApplicationForm from './pages/job/CandidateApplicationForm';

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
  // Check for stored user data from authService (handles both localStorage and sessionStorage)
  const savedUserData = authService.getStoredUserData();
  
  if (savedUserData) {
    try {
      
      setUserData(savedUserData);
      setIsLoggedIn(true);
      
      // If user is on login page but authenticated, redirect to dashboard
      if (location.pathname === '/') {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error with stored user data:', error);
      authService.clearStoredUserData();
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
    }
     else if (path.includes('/direct-recruitement')) {
      setActiveSection('direct-recruitement');
       }
        else if (path.includes('/employee-information')) {
      setActiveSection('employee-information');
       }
        else if (path.includes('/company-calender')) {
      setActiveSection('company-calender');
       }
        else if (path.includes('/leave-manage')) {
      setActiveSection('leave-manage');
       }
       else if (path.includes('/employee-profile')) {
  setActiveSection('employee-profile');
}
   else if (path.includes('/payroll')) {
      setActiveSection('payroll');
       }else if (path.includes('/leave-management')) {
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
  console.log('Login successful, user data:', user);
  
  // Store the COMPLETE user object
 const completeUserData = {
  id: user.id,
  name: user.name || 'User',
  email: user.email,
  role: user.role || 'User',
  profileimage: user.profileimage, // ✅ lowercase
  mobile: user.mobile,
  work_phone:user.work_phone,
  department: user.department,
  education:user.education,
  address:user.address,
  technical_skills:user.technical_skills,
  total_experience:user.total_experience,
  languages:user.languages,
  certifications:user.certifications,
  github_url:user.github_url,
  linkedin_url:user.linkedin_url,
  pay: user.pay,
  twitter_url:user.twitter_url,
  birth_date:user.birth_date,
  start_date: user.start_date,
  isActive: user.isActive,
  employeeId: user.employeeId,
  createdAt: user.createdAt,
  created_at: user.created_at || null,
  updatedAt: user.updatedAt,
  displayName: user.displayName,
  userType: user.userType
};

  
  setUserData(completeUserData);
  setIsLoggedIn(true);
  
  // Don't store here - authService already handled storage in login component
  // Just verify what's stored
  const storedData = authService.getStoredUserData();
  console.log('Stored user data after login:', storedData);
  
  // Navigate to dashboard after successful login
  navigate('/dashboard', { replace: true });
};

  const handleLogout = async () => {
  try {
    console.log('Logout initiated for user:', userData);
    
    // Call authService logout to handle database updates and storage cleanup
    const success = await authService.logout(userData);
    
    if (success) {
      console.log('Logout successful');
      
      // Clear local state
      setIsLoggedIn(false);
      setUserData(null);
      setActiveSection('dashboard');
      
      // Navigate to login page
      navigate('/', { replace: true });
    } else {
      console.error('Logout failed, but clearing local data anyway');
      // Even if logout fails, clear local data for security
      setIsLoggedIn(false);
      setUserData(null);
      sessionStorage.removeItem('userData');
      localStorage.removeItem('userData');
      navigate('/', { replace: true });
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Clear local data even if there's an error
    setIsLoggedIn(false);
    setUserData(null);
    sessionStorage.removeItem('userData');
    localStorage.removeItem('userData');
    navigate('/', { replace: true });
  }
};

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarItemClick = (itemId) => {
  if (itemId === 'logout') {
    handleLogout();
  } else {
    setActiveSection(itemId);
    
     if (itemId === 'exam-conduct-page') {
      navigate('/dashboard/exam-conduct-page', { replace: true });
    } else if (['inbox', 'compose', 'sent', 'trash'].includes(itemId)) {
  setActiveSection('mails'); 
  setActiveEmailFolder(itemId); 
  navigate('/dashboard/mails', { replace: true });
}
else if (itemId === 'on-campus-data') {
      navigate('/dashboard/on-campus-data', { replace: true });
}else if (itemId === 'payroll') {
      navigate('/dashboard/payroll', { replace: true });
    
    }else if (itemId === 'employee-information') {
      navigate('/dashboard/employee-information', { replace: true });
    }
    else if (itemId === 'employee-profile') {
  navigate('/dashboard/employee-profile', { replace: true });
}
    else if (itemId === 'employee-attendance') {
      navigate('/dashboard/employee-attendance', { replace: true });
    }
    
         else if (itemId === 'company-calender') {
      navigate('/dashboard/company-calender', { replace: true });
        } 
        else if (itemId === 'direct-recruitement') {
      navigate('/dashboard/direct-recruitement', { replace: true });
        }
         else if (itemId === 'leave-manage') {
      navigate('/dashboard/leave-manage', { replace: true });
        }
     else if (itemId === 'leave-management') {
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
      <Route path="/campus-job-view" 
      element={ 
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
  path="/direct-apply/:jobId" 
  element={ 
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          width: '100vw'
        }}>
          <CandidateApplicationForm />
        </div>
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
                  userData={userData} // Add this line
                  onLogout={handleLogout}
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