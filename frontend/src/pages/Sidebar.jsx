import React, { useState } from 'react';
import { Home, User,  ChevronLeft, ChevronRight, Zap, LogOut, UserCheck } from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick, userRole }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', color: '#3b82f6' },
   
    // Only show Admin button for superadmin
    ...(userRole === 'superadmin' ? [
      { icon: UserCheck, label: 'Admin', id: 'admin', color: '#06b6d4' }
    ] : []),
    // Show Employee button for superadmin and admin
    ...(userRole === 'superadmin' || userRole === 'admin' ? [
      { icon: User, label: 'Employee', id: 'employee', color: '#f59e0b' }
    ] : []),
    { icon: LogOut, label: 'Logout', id: 'logout', color: '#ef4444' }
  ];

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

      {/* Footer */}
      <div className="sidebar-footer">
        {isOpen && (
          <div className="footer-text">
            © 2025 ProDash v2.1
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;