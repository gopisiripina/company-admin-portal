import React, { useState } from 'react';
import { Home, User, ChevronLeft, ChevronRight, Zap, LogOut, UserCheck, FolderKanban, ChevronDown, ChevronUp, Calendar, DollarSign, BarChart3, GitBranch, ClipboardList, AlertTriangle, FileText, BookOpen } from 'lucide-react';
import './Sidebar.css';
import Myaccesslogo from '../../assets/Myalogobgr.svg'; // Adjust the path as necessary
const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick, userRole }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  const handleExpandToggle = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', color: '#3b82f6' },
    
    // Project Management parent with children
   // Project Management (only for superadmin and admin)
...(userRole === 'superadmin' || userRole === 'admin' ? [
  {
    icon: FolderKanban,
    label: 'Project Management',
    id: 'project-management',
    color: '#8b5cf6',
    hasChildren: true,
    children: [
      { icon: Calendar, label: 'Project Timeline', id: 'project-timeline' },
      { icon: DollarSign, label: 'Project Budgeting', id: 'project-budgeting' },
      { icon: BarChart3, label: 'Gantt Chart', id: 'gantt-chart' },
      { icon: GitBranch, label: 'Agile Project Plan', id: 'agile-project-plan' },
      { icon: ClipboardList, label: 'Project Tracker', id: 'project-tracker' },
      { icon: AlertTriangle, label: 'Issue Tracker', id: 'issue-tracker' },
      { icon: AlertTriangle, label: 'Project Risk', id: 'project-risk' },
      { icon: FileText, label: 'Project Report', id: 'project-report' },
      { icon: BookOpen, label: 'KT', id: 'kt' }
    ]
  }
] : []),
...(userRole === 'superadmin' || userRole === 'admin' ? [
  {
    icon: FolderKanban,
    label: 'Human Resource',
    id: 'Human Resource',
    color: '#8b5cf6',
    hasChildren: true,
    children: [
      { icon: Calendar, label: 'Time Sheet', id: 'Time Sheet' },
      { icon: DollarSign, label: 'Employee Attendance Tracker', id: 'Employee Attendance tracker' },
      { icon: BarChart3, label: 'Candidate Screening Test', id: 'Candidate Screening Test' },
      { icon: GitBranch, label: 'Recruitnig Plan', id: 'Recruiting Plan' },
      { icon: ClipboardList, label: 'New Hire Check List', id: 'New Hire Check List' },
      { icon: AlertTriangle, label: 'Employee Training Plan', id: 'issue-tracker' },
      { icon: AlertTriangle, label: 'Payroll', id: 'Payroll' },
      { icon: FileText, label: 'Payroll Check Template', id: 'Payroll Check Template' },
      { icon: FileText, label: 'Weekly Schedule Template', id: 'Weekly Schedule Template' },
      { icon: BookOpen, label: 'Work Schedule', id: 'Work Schedule' }
    ]
  }
] : []),
   ...(userRole === 'superadmin' || userRole === 'hr' ? [
      {
    icon: FolderKanban,
    label: 'Careers',
    id: 'Carrers',
    color: '#8b5cf6',
    hasChildren: true,
    children: [
  { icon: FileText, label: 'Job Creating', id: 'job-description', color: '#10b981' },
  { icon: FileText, label: 'Job Posting', id: 'job-post', color: '#10b981' },
  { icon: FileText, label: 'Off Campus data', id: 'job-apply', color: '#10b981' },
    { icon: FileText, label: 'Candidate Details', id: 'resume-list', color: '#10b981' },
     { icon: FileText, label: 'Interview Management', id: 'interview-management', color: '#10b981' },
      { icon: FileText, label: 'Selected List', id: 'selected-list', color: '#10b981' },
      { icon: FileText, label: 'On Campus Data', id: 'on-campus-data', color: '#10b981' },
      { icon: FileText, label: 'Exam Conduct On Campus', id: 'exam-conduct-page', color: '#10b981' },
    ]}
] : []),
    // Only show Admin button for superadmin
    ...(userRole === 'superadmin' ? [
      { icon: UserCheck, label: 'Admin', id: 'admin', color: '#06b6d4' }
    ] : []),
        ...(userRole === 'superadmin' ? [
      { icon: UserCheck, label: 'Hr', id: 'Hr', color: '#06b6d4' }
    ] : []),
    // Show Employee button for superadmin and admin
    ...(userRole === 'superadmin' ||userRole === 'hr'|| userRole === 'admin' ? [
      { icon: User, label: 'Employee', id: 'employee', color: '#f59e0b' }
    ] : []),
  ];

  // Separate logout item
  const logoutItem = { icon: LogOut, label: 'Logout', id: 'logout', color: '#ef4444' };

  const handleItemClick = (item) => {
    if (item.hasChildren) {
      handleExpandToggle(item.id);
      // If sidebar is closed, open it when clicking parent items
      if (!isOpen) {
        onToggle();
      }
    } else {
      if (onItemClick) {
        onItemClick(item.id);
      }
    }
  };

  const handleChildClick = (childItem) => {
    if (onItemClick) {
      onItemClick(childItem.id);
    }
  };

  const renderNavItem = (item, index, isChild = false) => {
    const isExpanded = expandedItems[item.id];
    const itemKey = isChild ? `child-${item.id}` : item.id;
    
    return (
      <div key={itemKey} className={`nav-item-container ${isChild ? 'child-item' : ''}`}>
        <div
          className={`nav-item ${activeItem === item.id ? 'active' : ''} ${item.hasChildren ? 'has-children' : ''}`}
          onClick={() => isChild ? handleChildClick(item) : handleItemClick(item)}
          onMouseEnter={() => setHoveredItem(isChild ? `child-${index}` : index)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Active indicator */}
          {activeItem === item.id && (
            <div className="active-indicator" />
          )}
          
          <item.icon 
            size={isChild ? 18 : 22} 
            className="nav-item-icon"
          />
          
          {isOpen && (
            <span className={`nav-item-label ${isOpen ? 'open' : 'closed'}`}>
              {item.label}
            </span>
          )}

          {/* Expand/Collapse icon for parent items */}
          {item.hasChildren && isOpen && (
            <div className="expand-icon">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          )}
          
          {/* Hover effect tooltip for collapsed sidebar */}
          {hoveredItem === (isChild ? `child-${index}` : index) && !isOpen && (
            <div className="nav-tooltip">
              {item.label}
            </div>
          )}
        </div>

        {/* Children items */}
        {item.hasChildren && isExpanded && isOpen && (
          <div className="nav-children">
            {item.children.map((child, childIndex) => 
              renderNavItem(child, childIndex, true)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">
            <img src={Myaccesslogo} alt="Logo" width={34} height={34} />
          </div>
          {isOpen && (
            <div className="logo-text">
              <span className="logo-title">
                MyAccess
              </span>
              <span className="logo-subtitle">
                Portal
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="toggle-button"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-navigation">
        {sidebarItems.map((item, index) => renderNavItem(item, index))}
      </nav>

      {/* Footer with Logout */}
      <div className="sidebar-footer">
        <div
          className={`nav-item ${activeItem === logoutItem.id ? 'active' : ''}`}
          onClick={() => handleItemClick(logoutItem)}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Active indicator */}
          {activeItem === logoutItem.id && (
            <div className="active-indicator" />
          )}
          
          <logoutItem.icon 
            size={22} 
            className="nav-item-icon"
          />
          
          {isOpen && (
            <span className={`nav-item-label ${isOpen ? 'open' : 'closed'}`}>
              {logoutItem.label}
            </span>
          )}
          
          {/* Hover effect tooltip for collapsed sidebar */}
          {hoveredItem === 'logout' && !isOpen && (
            <div className="nav-tooltip">
              {logoutItem.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;