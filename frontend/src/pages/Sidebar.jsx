import React, { useState } from 'react';
import { Home, BarChart3, User, Settings, ChevronLeft, ChevronRight, FileText, Calendar, MessageSquare, Zap, Shield, Folder, Target, TrendingUp, LogOut } from 'lucide-react';
const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

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
    { icon: Settings, label: 'Settings', id: 'settings', color: '#6b7280' },
    { icon: Settings, label: 'Settings', id: 'settings', color: '#6b7280' },
  { icon: LogOut, label: 'Logout', id: 'logout', color: '#ef4444' } 
  ];

  const getSidebarStyle = () => ({
    width: isOpen ? '300px' : '80px',
    height: '100vh',
    background: 'rgba(31, 72, 66, 0.98)',
    backdropFilter: 'blur(25px)',
    borderRight: '1px solid rgba(188, 244, 157, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
    boxShadow: isOpen ? '8px 0 32px rgba(31, 72, 66, 0.3)' : '4px 0 20px rgba(31, 72, 66, 0.2)',
    display: 'flex',
    flexDirection: 'column'
  });

  const getHeaderStyle = () => ({
    padding: '24px 20px',
    borderBottom: '1px solid rgba(188, 244, 157, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(188, 244, 157, 0.05)',
    backdropFilter: 'blur(10px)'
  });

  const getLogoStyle = () => ({
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  });

  const getLogoIconStyle = () => ({
    width: '45px',
    height: '45px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #BCF49D 0%, #86efac 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1F4842',
    boxShadow: '0 4px 15px rgba(188, 244, 157, 0.3)',
    position: 'relative'
  });

  const getToggleButtonStyle = () => ({
    background: 'rgba(188, 244, 157, 0.1)',
    border: '1px solid rgba(188, 244, 157, 0.2)',
    color: '#BCF49D',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)'
  });

  const getNavigationStyle = () => ({
    padding: '24px 0',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden'
  });

  const getNavItemStyle = (item, index) => {
    const isActive = activeItem === item.id;
    const isHovered = hoveredItem === index;
    
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '14px 20px',
      margin: '6px 16px',
      borderRadius: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      color: isActive ? '#1F4842' : '#BCF49D',
      backgroundColor: isActive 
        ? 'rgba(188, 244, 157, 0.95)' 
        : isHovered 
          ? 'rgba(188, 244, 157, 0.15)' 
          : 'transparent',
      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
      boxShadow: isActive ? '0 4px 20px rgba(188, 244, 157, 0.3)' : 'none',
      position: 'relative',
      overflow: 'hidden'
    };
  };

  const getNavIconStyle = (item, index) => {
    const isActive = activeItem === item.id;
    const isHovered = hoveredItem === index;
    
    return {
      minWidth: '22px',
      height: '22px',
      transition: 'all 0.3s ease',
      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      filter: isActive ? 'none' : isHovered ? 'brightness(1.2)' : 'none'
    };
  };

  const getNavLabelStyle = (item, index) => {
    const isActive = activeItem === item.id;
    
    return {
      fontSize: '15px',
      fontWeight: isActive ? '600' : '500',
      opacity: isOpen ? 1 : 0,
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap'
    };
  };

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item.id);
    }
  };

  return (
    <div style={getSidebarStyle()}>
      {/* Sidebar Header */}
      <div style={getHeaderStyle()}>
        <div style={getLogoStyle()}>
          <div style={getLogoIconStyle()}>
            <Zap size={24} />
          </div>
          {isOpen && (
            <div style={{
              animation: 'fadeInUp 0.5s ease-out',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{
                color: '#BCF49D',
                fontSize: '20px',
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                ProDash
              </span>
              <span style={{
                color: 'rgba(188, 244, 157, 0.7)',
                fontSize: '12px',
                fontWeight: '400'
              }}>
                Professional Suite
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          style={getToggleButtonStyle()}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(188, 244, 157, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(188, 244, 157, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav style={getNavigationStyle()}>
        {sidebarItems.map((item, index) => (
          <div
            key={item.id}
            style={getNavItemStyle(item, index)}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => setHoveredItem(index)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {/* Active indicator */}
            {activeItem === item.id && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: 'linear-gradient(180deg, #1F4842 0%, #0f766e 100%)',
                borderRadius: '0 4px 4px 0'
              }} />
            )}
            
            <item.icon 
              size={22} 
              style={getNavIconStyle(item, index)}
            />
            
            {isOpen && (
              <span style={getNavLabelStyle(item, index)}>
                {item.label}
              </span>
            )}
            
            {/* Hover effect overlay */}
            {hoveredItem === index && !isOpen && (
              <div style={{
                position: 'absolute',
                left: '70px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(31, 72, 66, 0.95)',
                color: '#BCF49D',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                zIndex: 1001,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(188, 244, 157, 0.2)',
                animation: 'fadeInUp 0.2s ease-out'
              }}>
                {item.label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(188, 244, 157, 0.2)',
        background: 'rgba(188, 244, 157, 0.05)'
      }}>
        {isOpen && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(188, 244, 157, 0.7)',
            fontSize: '12px',
            animation: 'fadeInUp 0.5s ease-out'
          }}>
            © 2025 ProDash v2.1
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;