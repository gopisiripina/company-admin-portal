import React, { useState } from 'react';
import { ChevronDown, User, Settings, LogOut, Bell, Shield, HelpCircle } from 'lucide-react';
import '../styles/ProfileSection.css';

const ProfileSection = ({ userData, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Enhanced debug logging
  console.log('=== ProfileSection Debug ===');
  console.log('userData:', userData);
  console.log('userData type:', typeof userData);
  console.log('userData keys:', Object.keys(userData || {}));
  console.log('userData.profileImage:', userData?.profileImage);
  console.log('userData.photoURL:', userData?.photoURL);
  console.log('profileImage type:', typeof userData?.profileImage);
  console.log('profileImage length:', userData?.profileImage?.length);
  console.log('profileImage first 50 chars:', userData?.profileImage?.substring(0, 50));
  
  // Check if it's a base64 image
  const isBase64Image = userData?.profileImage?.startsWith('data:image/');
  console.log('Is base64 image:', isBase64Image);

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
    
    if (itemId === 'logout' && onLogout) {
      onLogout();
    }
    // Add your navigation logic here for other menu items
  };

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Enhanced function to check if user has a profile image
  const hasProfileImage = () => {
    const profileImage = userData?.profileImage;
    const photoURL = userData?.photoURL;
    
    console.log('Checking for profile image...');
    console.log('profileImage exists:', !!profileImage);
    console.log('photoURL exists:', !!photoURL);
    
    return !!(profileImage || photoURL);
  };

  // Enhanced function to get the profile image source
  const getProfileImageSrc = () => {
    // Prioritize profileImage over photoURL
    const profileImage = userData?.profileImage;
    const photoURL = userData?.photoURL;
    
    console.log('Getting profile image source...');
    console.log('Using profileImage:', !!profileImage);
    console.log('Using photoURL:', !!photoURL);
    
    return profileImage || photoURL;
  };

  // Enhanced function to render avatar (image or initials)
  const renderAvatar = (size = 'small') => {
    const initials = getInitials(userData?.name || userData?.displayName);
    const imageSource = getProfileImageSrc();
    const hasImage = hasProfileImage();
    
    console.log(`Rendering avatar (${size}):`, {
      hasImage,
      imageSource: imageSource ? imageSource.substring(0, 50) + '...' : null,
      initials
    });
    
    if (hasImage && imageSource) {
      return (
        <div className="profile-avatar-wrapper">
          <img 
            src={imageSource}
            alt={userData?.name || userData?.displayName || 'User'} 
            className={size === 'large' ? 'profile-avatar-image-large' : 'profile-avatar-image'}
            onError={(e) => {
              // If image fails to load, hide image and show initials fallback
              console.error('Profile image failed to load:', e);
              e.target.style.display = 'none';
              const fallbackElement = e.target.parentNode.querySelector('.profile-avatar-fallback');
              if (fallbackElement) {
                fallbackElement.style.display = 'flex';
              }
            }}
            onLoad={() => {
              console.log('Profile image loaded successfully');
            }}
          />
          <div 
            className={`profile-avatar-fallback ${size === 'large' ? 'profile-avatar-large' : 'profile-avatar'}`}
            style={{ display: 'none' }}
          >
            {initials}
          </div>
        </div>
      );
    }
    
    // Show initials if no image
    console.log('No image found, showing initials:', initials);
    return (
      <div className={size === 'large' ? 'profile-avatar-large' : 'profile-avatar'}>
        {initials}
      </div>
    );
  };

  return (
    <div className="profile-section">
      <div 
        className="profile-trigger"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="profile-avatar-container">
          {renderAvatar('small')}
        </div>
        <div className="profile-info">
          <span className="profile-name">
            {userData?.name || userData?.displayName || 'User'}
          </span>
          <span className="profile-role">
            {userData?.role || userData?.userType || 'User'}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`profile-chevron ${isDropdownOpen ? 'rotated' : ''}`}
        />
      </div>

      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div className="profile-avatar-container-large">
              {renderAvatar('large')}
            </div>
            <div className="profile-header-info">
              <span className="profile-header-name">
                {userData?.name || userData?.displayName || 'User'}
              </span>
              <span className="profile-header-email">
                {userData?.email || 'No email provided'}
              </span>
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