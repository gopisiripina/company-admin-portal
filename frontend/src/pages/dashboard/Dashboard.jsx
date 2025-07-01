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
import ResumeListPage from '../job/ResumeListPage';
import InterviewManagementPage from '../job/InterviewManagementPage';// Import ResumeListPage
import JobApplicationPage from '../job/JobApplicationPage';
import SelectedCandidatePage from '../job/SelectedCandidatespage'; // Import SelectedListPage
import SelectedCandidatesPage from '../job/SelectedCandidatespage';




const Dashboard = ({ sidebarOpen, activeSection, userData, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');

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
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
if (activeSection === 'job-application') {
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
            onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Profile Section */}
          <ProfileSection userData={userData} onLogout={onLogout}/>
        </div>
      </header>

      {/* Job Description Content */}
      <main className="main-content">
        <JobApplicationPage userRole={userData?.role} />
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
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

if (activeSection === 'project-timeline') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <header className="dashboard-header">
        {/* Search Bar */}
        <div className="search-container">
          <Search size={22} className="search-icon" />
          <input
            type="text"
            placeholder="Search project timeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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