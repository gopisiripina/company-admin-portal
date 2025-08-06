import React, { useState, useEffect,useMemo  } from 'react';
import { Home, User, ChevronLeft, ChevronRight, Zap, LogOut, UserCheck, FolderKanban, ChevronDown, ChevronUp, Calendar, DollarSign, BarChart3, GitBranch, ClipboardList, AlertTriangle, FileText, BookOpen, MessageSquare } from 'lucide-react';
import './Sidebar.css';
import Myaccesslogo from '../../assets/Myalogobgr.svg'; // Adjust the path as necessary
import { InboxOutlined, EditOutlined ,SendOutlined,DeleteOutlined} from '@ant-design/icons';
import { X } from 'lucide-react';
import authService from '../../supabase/authService';
const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick, userRole, isEmailAuthenticated, userData, onLogout }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth <= 768) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
    document.body.style.overflow = 'auto';
  };
}, [isOpen]);
  const handleExpandToggle = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleOverlayClick = (e) => {
  if (window.innerWidth <= 768 && e.target === e.currentTarget) {
    onToggle();
  }
};

 const sidebarItems = () => [
  { icon: Home, label: 'Dashboard', id: 'dashboard', color: '#3b82f6' },
  {
    icon: Calendar,
    label: 'Mails',
    id: 'mails',
    color: '#10b981',
    hasChildren: isEmailAuthenticated,
    children: isEmailAuthenticated ? [
      { icon: InboxOutlined, label: 'Inbox', id: 'inbox' },
      { icon: EditOutlined, label: 'Compose', id: 'compose' },
      { icon: SendOutlined, label: 'Sent', id: 'sent' },
      { icon: DeleteOutlined, label: 'Trash', id: 'trash' }
    ] : []
  },
  // { icon: Calendar, label: 'Leave Management', id: 'leave-management' },
  
  // Feedback Form - Available to all authenticated users
  { icon: MessageSquare, label: 'Feedback', id: 'feedback', color: '#f97316' },
    
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
// Replace the existing Human Resource section with this updated code:

...(userRole === 'superadmin' || userRole === 'admin' || userRole === 'hr' || userRole === 'employee' ? [
  {
    icon: FolderKanban,
    label: 'Human Resource',
    id: 'Human Resource',
    color: '#8b5cf6',
    hasChildren: true,
    children: [
      // For superadmin, admin, and hr - show all options
      ...(userRole === 'superadmin' || userRole === 'admin' || userRole === 'hr' ? [
        { icon: DollarSign, label: 'Employee Attendance', id: 'employee-attendance' },
        { icon: AlertTriangle, label: 'Payroll', id: 'payroll' },
        { icon: DollarSign, label: 'Leaves Approval', id: 'leave-manage' },
        { icon: DollarSign, label: 'Calender And Events', id: 'company-calender' },
      ] : []),
      
      // For employee - show only leave and calendar events
      ...(userRole === 'employee' ? [
        { icon: DollarSign, label: 'leaves Apply', id: 'leave-manage' },
        { icon: DollarSign, label: 'Calender and Events', id: 'company-calender' },
      ] : [])
    ]
  }
] : []),
 // Replace the existing careers section with this updated structure:

...(userRole === 'admin' || userRole === 'superadmin' || userRole === 'hr' ? [
  {
    icon: FolderKanban,
    label: 'Careers',
    id: 'careers',
    color: '#8b5cf6',
    hasChildren: true,
    children: [
      // Off Campus parent with children
      {
        icon: FileText,
        label: 'Off Campus',
        id: 'off-campus',
        hasChildren: true,
        children: [
          { icon: FileText, label: 'Job Creating', id: 'job-description' },
          { icon: FileText, label: 'Job Posting', id: 'job-post' },
          { icon: FileText, label: 'Off Campus Data', id: 'job-apply' }
        ]
      },
      // On Campus parent with children
      {
        icon: FileText,
        label: 'On Campus',
        id: 'on-campus',
        hasChildren: true,
        children: [
          { icon: FileText, label: 'On Campus Data', id: 'on-campus-data' },
          { icon: FileText, label: 'Exam Conduct ', id: 'exam-conduct-page' }
        ]
      },
      // Selection Process parent with children
      {
        icon: FileText,
        label: 'Selection Process',
        id: 'selection-process',
        hasChildren: true,
        children: [
          { icon: FileText, label: 'Shortlisted Data', id: 'resume-list' },
          { icon: FileText, label: 'Interview Scheduled', id: 'interview-management' },
          { icon: FileText, label: 'Selected List', id: 'selected-list' }
        ]
      },
       { icon: FileText, label: 'Direct Recruitment', id: 'direct-recruitement' }
    ]
  }
] : []),
    // Only show Admin button for superadmin
    // Replace the existing role buttons section in your sidebarItems function with this:

// Role Management - Based on user role hierarchy
...(userRole === 'superadmin' || userRole === 'admin' || userRole === 'hr' ? [
  {
    icon: UserCheck,
    label: 'Roles',
    id: 'roles',
    color: '#06b6d4',
    hasChildren: true,
    children: [
      // Superadmin can see all roles
      ...(userRole === 'superadmin' ? [
        { icon: UserCheck, label: 'Admin', id: 'admin' },
        { icon: UserCheck, label: 'HR', id: 'Hr' },
        { icon: User, label: 'Employee', id: 'employee' }
      ] : []),
      // Admin can see HR and Employee
      ...(userRole === 'admin' && userRole !== 'superadmin' ? [
        { icon: UserCheck, label: 'HR', id: 'Hr' },
        { icon: User, label: 'Employee', id: 'employee' }
      ] : []),
      // HR can only see Employee
      ...(userRole === 'hr' && userRole !== 'superadmin' && userRole !== 'admin' ? [
        { icon: User, label: 'Employee', id: 'employee' }
      ] : [])
    ]
  }
] : []),
    
  ];
  
   const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  if (childItem.hasChildren) {
    handleExpandToggle(childItem.id);
    // If sidebar is closed, open it when clicking sub-parent items
    if (!isOpen) {
      onToggle();
    }
  } else {
    if (onItemClick) {
      onItemClick(childItem.id);
    }
  }
};

const renderNavItem = (item, index, isChild = false, parentId = '') => {
  const isExpanded = expandedItems[item.id];
  const itemKey = isChild ? `${parentId}-${item.id}` : item.id;
  
  return (
    <div key={itemKey} className={`nav-item-container ${isChild ? 'child-item' : ''}`}>
      <div
        className={`nav-item ${activeItem === item.id ? 'active' : ''} ${item.hasChildren ? 'has-children' : ''}`}
        onClick={() => isChild ? handleChildClick(item) : handleItemClick(item)}
        onMouseEnter={() => setHoveredItem(isChild ? `child-${parentId}-${index}` : index)}
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
        {hoveredItem === (isChild ? `child-${parentId}-${index}` : index) && !isOpen && (
          <div className="nav-tooltip">
            {item.label}
          </div>
        )}
      </div>

      {/* Children items - This now handles nested children */}
      {item.hasChildren && isExpanded && isOpen && (
        <div className="nav-children">
          {item.children.map((child, childIndex) => 
            renderNavItem(child, childIndex, true, item.id)
          )}
        </div>
      )}
    </div>
  );
};

// Remove the duplicate sidebar div and fix the JSX structure
// Replace the return statement in your Sidebar.jsx with this:

return (
  <>
    {/* Mobile overlay */}
    {isMobile && isOpen && (
      <div 
        className="sidebar-overlay"
        onClick={onToggle}
      />
    )}

    <div 
      className={`sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">
            <img src={Myaccesslogo} alt="Logo" width={34} height={34} />
          </div>
          {isOpen && (
            <div className="logo-text">
              <span className="logo-title">MyAccess</span>
              <span className="logo-subtitle">Portal</span>
            </div>
          )}
        </div>
        
        {/* Show X (close) icon on mobile when open */}
        {isMobile && isOpen ? (
          <button onClick={onToggle} className="toggle-button">
            <X size={20} />
          </button>
        ) : (
          <button onClick={onToggle} className="toggle-button">
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-navigation">
        {sidebarItems().map((item, index) => renderNavItem(item, index))}
      </nav>

{/* Footer with Logout */}
<div className="sidebar-footer">
  <div
    className={`nav-item ${activeItem === logoutItem.id ? 'active' : ''}`}
    onClick={async () => {
      try {
        console.log('Sidebar logout initiated for user:', userData);
        
        // Remove email credentials like ProfileSection does
        localStorage.removeItem('emailCredentials');
        
        // Call authService logout to handle database updates and storage cleanup
        const logoutSuccess = await authService.logout(userData);
        
        if (logoutSuccess) {
          console.log('Sidebar logout successful');
        } else {
          console.warn('Sidebar logout completed but there may have been issues updating Supabase');
        }
        
        // Call the parent component's logout handler
        if (onLogout) {
          onLogout();
        }
      } catch (error) {
        console.error('Error during sidebar logout:', error);
        // Still proceed with logout even if there's an error
        if (onLogout) {
          onLogout();
        }
      }
    }}
    onMouseEnter={() => setHoveredItem('logout')}
    onMouseLeave={() => setHoveredItem(null)}
  >
    {/* Active indicator */}
    {activeItem === logoutItem.id && (
      <div className="active-indicator" />
    )}
    
    {/* Fix: Properly render the LogOut icon */}
    <LogOut 
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
  </>
);};

export default Sidebar;