import React, { useState } from 'react';
import { ChevronDown, User, Settings, LogOut, Bell, Shield, HelpCircle } from 'lucide-react';

const ProfileSection = ({ userData, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Enhanced debug logging
  console.log('=== ProfileSection Debug ===');
  console.log('userData:', userData);
  console.log('userData.profileImage:', userData?.profileImage);
  console.log('userData.photoURL:', userData?.photoURL);
  
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

    // Define inline styles for proper sizing
    const smallAvatarStyle = {
      width: '42px',
      height: '42px',
      borderRadius: '20%',
      objectFit: 'cover',
      border: '2px solid #e5e7eb',
      backgroundColor: 'black'
    };

    const largeAvatarStyle = {
      width: '64px',
      height: '64px',
      borderRadius: '20%',
      objectFit: 'cover',
      border: '3px solid #e5e7eb',
      backgroundColor: '#1F4842'
    };

    const smallInitialsStyle = {
      width: '42px',
      height: '42px',
      borderRadius: '20%',
      backgroundColor: '#1F4842',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      border: '2px solid #e5e7eb'
    };

    const largeInitialsStyle = {
      width: '64px',
      height: '64px',
      borderRadius: '20%',
      backgroundColor: '#1F4842',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: '600',
      border: '3px solid #e5e7eb'
    };
    
    if (hasImage && imageSource) {
      return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img 
            src={imageSource}
            alt={userData?.name || userData?.displayName || 'User'} 
            style={size === 'large' ? largeAvatarStyle : smallAvatarStyle}
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
            className="profile-avatar-fallback"
            style={{ 
              ...(size === 'large' ? largeInitialsStyle : smallInitialsStyle),
              display: 'none',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            {initials}
          </div>
        </div>
      );
    }
    
    // Show initials if no image
    console.log('No image found, showing initials:', initials);
    return (
      <div style={size === 'large' ? largeInitialsStyle : smallInitialsStyle}>
        {initials}
      </div>
    );
  };

  // Inline styles for the component
  const profileSectionStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const profileTriggerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    backgroundColor: isDropdownOpen ? '#f3f4f6' : 'transparent',
    border: 'none',
    outline: 'none'
  };

  const profileInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0
  };

  const profileNameStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '120px'
  };

  const profileRoleStyle = {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '120px'
  };

  const chevronStyle = {
    color: '#6b7280',
    transition: 'transform 0.2s ease',
    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '8px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    minWidth: '280px',
    zIndex: 1000,
    overflow: 'hidden'
  };

  const dropdownHeaderStyle = {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#f9fafb'
  };

  const headerInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0
  };

  const headerNameStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: '1.2',
    marginBottom: '4px',
    wordBreak: 'break-word'
  };

  const headerEmailStyle = {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.2',
    wordBreak: 'break-all'
  };

  const dropdownMenuStyle = {
    padding: '8px'
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontSize: '14px',
    color: '#374151'
  };

  const menuIconStyle = (color) => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${color}15`,
    color: color
  });

  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'transparent'
  };

  return (
    <div style={profileSectionStyle}>
      <div 
        style={profileTriggerStyle}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onMouseEnter={(e) => {
          if (!isDropdownOpen) {
            e.target.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDropdownOpen) {
            e.target.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div>
          {renderAvatar('small')}
        </div>
        <div style={profileInfoStyle}>
          <span style={profileNameStyle}>
            {userData?.name || userData?.displayName || 'User'}
          </span>
          <span style={profileRoleStyle}>
            {userData?.role || userData?.userType || 'User'}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          style={chevronStyle}
        />
      </div>

      {isDropdownOpen && (
        <div style={dropdownStyle}>
          <div style={dropdownHeaderStyle}>
            <div>
              {renderAvatar('large')}
            </div>
            <div style={headerInfoStyle}>
              <span style={headerNameStyle}>
                {userData?.name || userData?.displayName || 'User'}
              </span>
              <span style={headerEmailStyle}>
                {userData?.email || 'No email provided'}
              </span>
            </div>
          </div>
          
          <div style={dropdownMenuStyle}>
            {profileMenuItems.map((item, index) => (
              <div
                key={item.id}
                style={menuItemStyle}
                onClick={() => handleMenuItemClick(item.id)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <div style={menuIconStyle(item.color)}>
                  <item.icon size={18} />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isDropdownOpen && (
        <div 
          style={backdropStyle}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileSection;