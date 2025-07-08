import React, { useState } from 'react';
import { Search, Bell, Users, DollarSign, ShoppingCart, TrendingUp, Calendar, Clock, Star, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-react';
import './Dashboard.css';
import ProfileSection from '../profile/ProfileSection';
import AdminManagement from '../admin/AdminManagement';
import EmployeeManagement from '../admin/EmployeeManagement';
import ProjectTimeline from '../project/ProjectTimeline';
import ProjectBudgeting from '../project/ProjectBudgeting';
import HRManagement from '../admin/HRManagement';
import JobDescriptionPage from '../job/JobDescriptionPage';
import JobPostPage from '../job/JobPostPage';
import JobApplyPage from '../job/JobApplyPage';
import ResumeListPage from '../job/ResumeListpage';
import InterviewManagementPage from '../job/InterviewManagementPage';// Import ResumeListPage
import JobApplicationPage from '../job/JobApplicationPage'
import SelectedCandidatesPage from '../job/SelectedCandidatespage';
import CampusJobViewPage from '../job/CampusJobViewPage'; // Import CampusJobViewPage
import CampusJobApplyPage from '../job/CampusJobApplyPage'; // Import CampusJobApplyPage





const Dashboard = ({ sidebarOpen, activeSection, userData, onLogout, onSectionChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentJobId, setCurrentJobId] = useState(2);
  const fuzzySearch = (query, options) => {
  if (!query) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return options
    .map(option => {
      const normalizedName = option.name.toLowerCase();
      const keywords = option.keywords || [];
      let score = 0;
      
      // Check exact match with name
      if (normalizedName === normalizedQuery) {
        score = 100;
      }
      // Check if name starts with query
      else if (normalizedName.startsWith(normalizedQuery)) {
        score = 90;
      }
      // Check if name contains query
      else if (normalizedName.includes(normalizedQuery)) {
        score = 80;
      }
      
      // Check keywords for exact matches
      for (const keyword of keywords) {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedKeyword === normalizedQuery) {
          score = Math.max(score, 95); // High score for exact keyword match
        }
        else if (normalizedKeyword.startsWith(normalizedQuery)) {
          score = Math.max(score, 85);
        }
        else if (normalizedKeyword.includes(normalizedQuery)) {
          score = Math.max(score, 75);
        }
      }
      
      // Fuzzy matching - check if all characters exist in order (only if no other matches)
      if (score === 0) {
        let queryIndex = 0;
        for (let i = 0; i < normalizedName.length && queryIndex < normalizedQuery.length; i++) {
          if (normalizedName[i] === normalizedQuery[queryIndex]) {
            queryIndex++;
          }
        }
        if (queryIndex === normalizedQuery.length) {
          score = 40;
        }
      }
      
      return { ...option, score };
    })
    .filter(option => option.score > 0)
    .sort((a, b) => b.score - a.score);
};
const searchableSections = [
  { 
    name: 'admin', 
    section: 'admin', 
    keywords: ['admin', 'administrator', 'management', 'manage admin'] 
  },
  { 
    name: 'employee', 
    section: 'employee', 
    keywords: ['employee', 'staff', 'worker', 'manage employee'] 
  },
  { 
    name: 'hr', 
    section: 'Hr', 
    keywords: ['hr', 'human resources', 'recruitment', 'hiring'] 
  },
  { 
    name: 'job description', 
    section: 'job-description', 
    keywords: ['job description', 'jd', 'description', 'job desc'] 
  },
  { 
    name: 'job post', 
    section: 'job-post', 
    keywords: ['job post', 'posting', 'vacancy', 'post job', 'job posting'] 
  },
  { 
    name: 'job application', 
    section: 'job-application', 
    keywords: ['job application', 'application', 'apply job', 'applications'] 
  },
  { 
    name: 'job apply', 
    section: 'job-apply', 
    keywords: ['job apply', 'apply', 'apply for job', 'job applications'] 
  },
  { 
    name: 'interview', 
    section: 'interview-management', 
    keywords: ['interview', 'screening', 'interview management', 'interviews'] 
  },
  { 
    name: 'resume', 
    section: 'resume-list', 
    keywords: ['resume', 'cv', 'curriculum', 'resume list', 'resumes'] 
  },
  { 
    name: 'project timeline', 
    section: 'project-timeline', 
    keywords: ['project timeline', 'timeline', 'schedule', 'project schedule'] 
  },
  { 
    name: 'project budget', 
    section: 'project-budgeting', 
    keywords: ['project budget', 'budget', 'budgeting', 'finance', 'project finance'] 
  }
];
const handleSearch = (e) => {
  if (e.key === 'Enter' && searchQuery.trim()) {
    console.log('Searching for:', searchQuery);
    
    const results = fuzzySearch(searchQuery, searchableSections);
    console.log('Search results:', results);
    
    if (results.length > 0) {
      console.log('Navigating to:', results[0].section);
      console.log('Match details:', {
        name: results[0].name,
        section: results[0].section,
        score: results[0].score
      });
      
      // Use the onSectionChange prop passed from App.jsx
      if (onSectionChange) {
        onSectionChange(results[0].section);
      }
      setSearchQuery(''); // Clear search after navigation
    } else {
      console.log('No results found for:', searchQuery);
      // Optional: Show user feedback
      alert(`No results found for "${searchQuery}"`);
    }
  }
};
const [searchSuggestions, setSearchSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);

const handleSearchInputChange = (e) => {
  const value = e.target.value;
  setSearchQuery(value);
  
  if (value.trim()) {
    const suggestions = fuzzySearch(value, searchableSections).slice(0, 5);
    setSearchSuggestions(suggestions);
    setShowSuggestions(true);
  } else {
    setShowSuggestions(false);
  }
};

const handleSuggestionClick = (section) => {
  if (onSectionChange) {
    onSectionChange(section);
  }
  setSearchQuery('');
  setShowSuggestions(false);
};
const handleSidebarItemClick = (itemId) => {
  // This function should be passed from App.jsx or use the existing navigation logic
  // For now, we'll use a workaround with the existing navigation
  if (typeof window !== 'undefined' && window.location) {
    // Navigate using window.location as a fallback
    if (itemId === 'admin') {
      window.history.pushState(null, '', '/dashboard/admin');
    } else if (itemId === 'employee') {
      window.history.pushState(null, '', '/dashboard/employee');
    } else if (itemId === 'Hr') {
      window.history.pushState(null, '', '/dashboard/hr');
    } else if (itemId === 'job-description') {
      window.history.pushState(null, '', '/dashboard/job-description');
    } else if (itemId === 'job-post') {
      window.history.pushState(null, '', '/dashboard/job-post');
    } else if (itemId === 'job-application') {
      window.history.pushState(null, '', '/dashboard/job-application');
    } else if (itemId === 'interview-management') {
      window.history.pushState(null, '', '/dashboard/interview-management');
    } else if (itemId === 'resume-list') {
      window.history.pushState(null, '', '/dashboard/resume-list');
    } else if (itemId === 'project-timeline') {
      window.history.pushState(null, '', '/dashboard/project-timeline');
    } else if (itemId === 'project-budgeting') {
      window.history.pushState(null, '', '/dashboard/project-budgeting');
    } else {
      window.history.pushState(null, '', '/dashboard');
    }
    // Trigger a page refresh to update the route
    window.location.reload();
  }
};
  const statsData = [
    { 
      title: 'Total Users', 
      value: '12,543', 
      change: '+12.5%', 
      trend: 'up', 
      icon: Users, 
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    { 
      title: 'Revenue', 
      value: '$89,231', 
      change: '+8.2%', 
      trend: 'up', 
      icon: DollarSign, 
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    { 
      title: 'Orders', 
      value: '3,847', 
      change: '+23.1%', 
      trend: 'up', 
      icon: ShoppingCart, 
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    { 
      title: 'Conversion Rate', 
      value: '4.7%', 
      change: '-2.3%', 
      trend: 'down', 
      icon: TrendingUp, 
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    }
  ];

  const quickActions = [
    { title: 'Create New Project', icon: Zap, color: '#8b5cf6' },
    { title: 'Schedule Meeting', icon: Calendar, color: '#06b6d4' },
    { title: 'View Reports', icon: Activity, color: '#10b981' },
    { title: 'Manage Team', icon: Users, color: '#f59e0b' }
  ];

  const recentActivities = [
    { 
      action: 'New user registration', 
      detail: 'sarah.johnson@company.com', 
      time: '2 minutes ago',
      type: 'user'
    },
    { 
      action: 'Order completed', 
      detail: 'Order #ORD-2024-1847 - $299.00', 
      time: '5 minutes ago',
      type: 'order'
    },
    { 
      action: 'Payment received', 
      detail: 'Stripe payment - $1,247.50', 
      time: '12 minutes ago',
      type: 'payment'
    },
    { 
      action: 'New message', 
      detail: 'Customer support inquiry', 
      time: '18 minutes ago',
      type: 'message'
    },
    { 
      action: 'System backup', 
      detail: 'Database backup completed successfully', 
      time: '25 minutes ago',
      type: 'system'
    }
  ];

  // Render Admin Management if admin section is active
  if (activeSection === 'admin') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="dashboard-header">
          {/* Search Bar */}
          <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search projects, users, or documents..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {/* Add search suggestions dropdown */}
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

          {/* Header Right */}
          <div className="header-right">
            {/* Notifications */}
            <button className="notification-button">
              <Bell size={22} />
              <span className="notification-badge"></span>
            </button>

            {/* Profile Section */}
            <ProfileSection userData={userData} onLogout={onLogout}/>
          </div>
        </header>

        {/* Admin Management Content */}
        <main className="main-content">
          <AdminManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }
if (activeSection === 'project-budgeting') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search project budgeting..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection />
        </div>
      </header>

      {/* Project Budgeting Content */}
      <main className="main-content">
        <ProjectBudgeting userRole={userData?.role} />
      </main>
    </div>
  );
}
  // Render Employee Management if employee section is active
  if (activeSection === 'employee') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="dashboard-header">
          {/* Search Bar */}
          <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search employees..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

          {/* Header Right */}
          <div className="header-right">
            {/* Notifications */}
            <button className="notification-button">
              <Bell size={22} />
              <span className="notification-badge"></span>
            </button>

            {/* Profile Section */}
            <ProfileSection userData={userData} onLogout={onLogout}/>
          </div>
        </header>

        {/* Employee Management Content */}
        <main className="main-content">
          <EmployeeManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }
  if (activeSection === 'Hr') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search HR data..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* HR Management Content */}
      <main className="main-content">
        <HRManagement userRole={userData?.role} />
      </main>
    </div>
  );
}
if (activeSection === 'job-description') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search job descriptions..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <JobDescriptionPage userRole={userData?.role} />
      </main>
    </div>
  );
}
if (activeSection === 'campus-job-view') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search job descriptions..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <CampusJobViewPage userRole={userData?.role} />
      </main>
    </div>
  );
}
if (activeSection === 'on-campus-data') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search job descriptions..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <CampusJobApplyPage userRole={userData?.role} />
      </main>
    </div>
  );
}

if (activeSection === 'job-post') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search job page..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>


        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <JobPostPage userRole={userData?.role} />
      </main>
    </div>
  );
}
if (activeSection === 'selected-list') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search job page..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>


        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <SelectedCandidatesPage userRole={userData?.role} />
      </main>
    </div>
  );
}

if (activeSection === 'job-application') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <main className="main-content">
        <JobApplicationPage userRole={userData?.role} jobId={currentJobId} />
      </main>
    </div>
  );
}
if (activeSection === 'interview-management') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search interview management page..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <InterviewManagementPage userRole={userData?.role} />
      </main>
    </div>
  );
}
if (activeSection === 'job-apply') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search job apply..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <JobApplyPage userRole={userData?.role} />
      </main>
    </div>
  );
}

if (activeSection === 'resume-list') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22} className="search-icon" />
  <input
    type="text"
    placeholder="Search resume list..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <ResumeListPage userRole={userData?.role} />
      </main>
    </div>
  );
}
if (activeSection === 'campus-job-view') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22}ClassName="search-icon" />
  <input
    type="text"
    placeholder="Search project timeline..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Project Timeline Content */}
      <main className="main-content">
        <campusjobview userRole={userData?.role} />
      </main>
    </div>
  );
}

if (activeSection === 'project-timeline') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
  <Search size={22}ClassName="search-icon" />
  <input
    type="text"
    placeholder="Search project timeline..."
    value={searchQuery}
    onChange={handleSearchInputChange}
    onKeyPress={handleSearch}
    className="search-input"
  />
  
  {showSuggestions && searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(suggestion.section)}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Project Timeline Content */}
      <main className="main-content">
        <ProjectTimeline userRole={userData?.role} />
      </main>
    </div>
  );
}
  // Default dashboard content
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
          <Search size={22} className="search-icon" />
          <input
  type="text"
  placeholder="Search projects, users, or documents..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyPress={handleSearch}
  className="search-input"
/>
        </div>

        {/* Header Right */}
        <div className="header-right">
          {/* Notifications */}
          <button className="notification-button">
            <Bell size={22} />
            <span className="notification-badge"></span>
          </button>

          {/* Profile Section - Pass userData and onLogout */}
          <ProfileSection userData={userData} onLogout={onLogout} />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {/* Welcome Header */}
          <div className="welcome-header">
            <h1 className="welcome-title">
              Welcome back, {userData?.name || userData?.displayName || 'User'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Here's what's happening with your business today. You have 3 new notifications.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            {statsData.map((stat, index) => (
              <div
                key={index}
                className={`stats-card animate-${index + 1}`}
              >
                {/* Background decoration */}
                <div 
                  className="stats-bg-decoration"
                  style={{ background: stat.bgGradient }}
                />
                
                <div className="stats-header">
                  <div 
                    className="stats-icon"
                    style={{
                      background: stat.bgGradient,
                      boxShadow: `0 8px 24px ${stat.color}30`
                    }}
                  >
                    <stat.icon size={26} color="white" />
                  </div>
                  <div className={`stats-change ${stat.trend}`}>
                    {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {stat.change}
                  </div>
                </div>
                
                <h3 className="stats-title">
                  {stat.title}
                </h3>
                
                <div className="stats-value">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">
              Quick Actions
            </h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className={`quick-action-card animate-${index + 1}`}
                >
                  <div className="quick-action-content">
                    <div 
                      className="quick-action-icon"
                      style={{
                        backgroundColor: action.color,
                        boxShadow: `0 4px 15px ${action.color}30`
                      }}
                    >
                      <action.icon size={22} color="white" />
                    </div>
                    <span className="quick-action-title">
                      {action.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <div className="activity-header">
              <h2 className="section-title">
                Recent Activity
              </h2>
              <span className="activity-subtitle">
                Last 24 hours
              </span>
            </div>
            
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-dot ${activity.type}`} />
                  <div className="activity-content">
                    <div className="activity-action">
                      {activity.action}
                    </div>
                    <div className="activity-detail">
                      {activity.detail}
                    </div>
                  </div>
                  <div className="activity-time">
                    <Clock size={14} />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
