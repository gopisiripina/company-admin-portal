import React, { useState } from 'react';
import { Home, BarChart3, User, Settings, ChevronLeft, ChevronRight, FileText, Calendar, MessageSquare, Zap, Shield, Folder, Target, TrendingUp, LogOut } from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  // Remove LogOut from main navigation items
  const sidebarItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', color: '#3b82f6' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics', color: '#8b5cf6' },
    { icon: TrendingUp, label: 'Reports', id: 'reports', color: '#10b981' },
    { icon: User, label: 'Users', id: 'users', color: '#f59e0b' },
    { icon: Folder, label: 'Projects', id: 'projects', color: '#ef4444' },
    { icon: Calendar, label: 'Calendar', id: 'calendar', color: '#06b6d4' },
    { icon: MessageSquare, label: 'Messages', id: 'messages', color: '#84cc16' },
    { icon: FileText, label: 'Documents', id: 'documents', color: '#6366f1' },
    { icon: Target, label: 'Goals', id: 'goals', color: '#ec4899' },
    { icon: Shield, label: 'Security', id: 'security', color: '#64748b' },
    { icon: Settings, label: 'Settings', id: 'settings', color: '#6b7280' }
  ];

  // Separate logout item
  const logoutItem = { icon: LogOut, label: 'Logout', id: 'logout', color: '#ef4444' };

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item.id);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">
            <Zap size={24} />
          </div>
          {isOpen && (
            <div className="logo-text">
              <span className="logo-title">
                ProDash
              </span>
              <span className="logo-subtitle">
                Professional Suite
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
        {sidebarItems.map((item, index) => (
          <div
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => setHoveredItem(index)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {/* Active indicator */}
            {activeItem === item.id && (
              <div className="active-indicator" />
            )}
            
            <item.icon 
              size={22} 
              className="nav-item-icon"
            />
            
            {isOpen && (
              <span className={`nav-item-label ${isOpen ? 'open' : 'closed'}`}>
                {item.label}
              </span>
            )}
            
            {/* Hover effect tooltip for collapsed sidebar */}
            {hoveredItem === index && !isOpen && (
              <div className="nav-tooltip">
                {item.label}
              </div>
            )}
          </div>
        ))}
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