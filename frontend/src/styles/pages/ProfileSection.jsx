import React, { useState } from 'react';
import { ChevronDown, User, Settings, LogOut, Bell, Shield, HelpCircle } from 'lucide-react';
import '../styles/ProfileSection.css';

const ProfileSection = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const profileMenuItems = [
    { icon: User, label: 'My Profile', id: 'profile', color: '#3b82f6' },
    { icon: Settings, label: 'Account Settings', id: 'settings', color: '#6b7280' },
    { icon: Bell, label: 'Notifications', id: 'notifications', color: '#f59e0b' },
    { icon: Shield, label: 'Privacy & Security', id: 'privacy', color: '#10b981' },
    { icon: HelpCircle, label: 'Help & Support', id: 'help', color: '#8b5cf6' },
    { icon: LogOut, label: 'Sign Out', id: 'logout', color: '#ef4444' }
  ];

  const handleMenuItemClick = (itemId) => {
    console.log('Menu item clicked:', itemId);
    setIsDropdownOpen(false);
    // Add your navigation logic here
  };

  return (
    <div className="profile-section">
      <div 
        className="profile-trigger"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="profile-avatar">
          JD
        </div>
        <div className="profile-info">
          <span className="profile-name">John Doe</span>
          <span className="profile-role">Administrator</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`profile-chevron ${isDropdownOpen ? 'rotated' : ''}`}
        />
      </div>

      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div className="profile-avatar-large">
              JD
            </div>
            <div className="profile-header-info">
              <span className="profile-header-name">John Doe</span>
              <span className="profile-header-email">john.doe@company.com</span>
            </div>
          </div>
          
          <div className="profile-dropdown-menu">
            {profileMenuItems.map((item, index) => (
              <div
                key={item.id}
                className="profile-menu-item"
                onClick={() => handleMenuItemClick(item.id)}
              >
                <div 
                  className="profile-menu-icon"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  <item.icon size={18} />
                </div>
                <span className="profile-menu-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isDropdownOpen && (
        <div 
          className="profile-dropdown-backdrop"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileSection;