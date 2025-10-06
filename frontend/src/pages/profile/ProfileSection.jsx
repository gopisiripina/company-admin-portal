import React, { useState, useEffect } from 'react';
import { ChevronDown, User, Settings, LogOut, Bell, Shield, HelpCircle } from 'lucide-react';
import authService from '../../supabase/authService';
import { useTheme } from '../../context/ThemeContext';

const ProfileSection = ({ userData, onLogout, onProfileClick }) => {
  const { isDarkMode } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  
  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check if it's a base64 image
  const isBase64Image = userData?.profileImage?.startsWith('data:image/');

  const profileMenuItems = [
    { icon: User, label: 'My Profile', id: 'profile', color: '#3b82f6' },
    { icon: Settings, label: 'Account Settings', id: 'settings', color: '#6b7280' },
    { icon: Bell, label: 'Notifications', id: 'notifications', color: '#f59e0b' },
    { icon: Shield, label: 'Privacy & Security', id: 'privacy', color: '#10b981' },
    { icon: HelpCircle, label: 'Help & Support', id: 'help', color: '#8b5cf6' },
    { icon: LogOut, label: isLoggingOut ? 'Signing Out...' : 'Sign Out', id: 'logout', color: '#ef4444' }
  ];

  const handleMenuItemClick = async (itemId) => {
    
    setIsDropdownOpen(false);
    
    if (itemId === 'logout') {
      await handleLogout();
    } else if (itemId === 'profile') {
      if (onProfileClick) {
        onProfileClick();
      }
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      localStorage.removeItem('emailCredentials');
      
      const logoutSuccess = await authService.logout(userData);
      
      if (logoutSuccess) {
        // Success handled
      } else {
        console.warn('Logout completed but there may have been issues updating Supabase');
      }
      
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Error during logout:', error);
      if (onLogout) {
        onLogout();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasProfileImage = () => {
    const profileimage = userData?.profileimage;
    const photoURL = userData?.photoURL;
    return !!(profileimage || photoURL);
  };

  const getProfileImageSrc = () => {
    const profileimage = userData?.profileimage;
    const photoURL = userData?.photoURL;
    return profileimage || photoURL;
  };

  // Responsive avatar sizes
  const getAvatarSizes = (size = 'small') => {
    const sizes = {
      mobile: {
        small: { width: '36px', height: '36px', fontSize: '11px' },
        large: { width: '56px', height: '56px', fontSize: '18px' }
      },
      tablet: {
        small: { width: '40px', height: '40px', fontSize: '12px' },
        large: { width: '60px', height: '60px', fontSize: '19px' }
      },
      desktop: {
        small: { width: '42px', height: '42px', fontSize: '12px' },
        large: { width: '64px', height: '64px', fontSize: '20px' }
      }
    };
    return sizes[screenSize][size];
  };

  const renderAvatar = (size = 'small') => {
    const initials = getInitials(userData?.name || userData?.displayName);
    const imageSource = getProfileImageSrc();
    const hasImage = hasProfileImage();
    const avatarSize = getAvatarSizes(size);

    const baseAvatarStyle = {
      width: avatarSize.width,
      height: avatarSize.height,
      borderRadius: '20%',
      objectFit: 'cover',
      border: size === 'large' ? '3px solid var(--border)' : '2px solid var(--border)',
      backgroundColor: isDarkMode ? 'var(--surface)' : '#1F4842'
    };

    const initialsStyle = {
      ...baseAvatarStyle,
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: avatarSize.fontSize,
      fontWeight: '600',
      position: 'relative',
      zIndex: 1
    };

    if (hasImage && imageSource) {
      return (
        <div style={{ 
          position: 'relative', 
          display: 'inline-block', 
          width: avatarSize.width, 
          height: avatarSize.height 
        }}>
          <img 
            src={imageSource}
            alt={userData?.name || userData?.displayName || 'User'} 
            style={baseAvatarStyle}
            onError={(e) => {
              console.error('Profile image failed to load:', e);
              e.target.style.display = 'none';
              const fallbackElement = e.target.parentNode.querySelector('.profile-avatar-fallback');
              if (fallbackElement) {
                fallbackElement.style.display = 'flex';
              }
            }}
          />
          <div 
            className="profile-avatar-fallback"
            style={{ 
              ...initialsStyle,
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
    
    return (
      <div className="profile-avatar-initials" style={initialsStyle}>
        {initials}
      </div>
    );
  };

  const renderStatusIndicator = () => {
    const isActive = userData?.isActive;
    const indicatorSize = screenSize === 'mobile' ? '6px' : '8px';
    
    const statusStyle = {
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: '50%',
      backgroundColor: isActive ? '#10b981' : '#ef4444',
      border: isDarkMode ? '2px solid var(--card-bg)' : '2px solid white',
      position: 'absolute',
      bottom: screenSize === 'mobile' ? '1px' : '2px',
      right: '0px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      zIndex: 1
    };

    return <div style={statusStyle} title={isActive ? 'Active' : 'Inactive'} />;
  };

  // Responsive styles
  const getResponsiveStyles = () => {
    const baseStyles = {
      profileSection: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      },
      
      profileTrigger: {
        display: 'flex',
        alignItems: 'center',
        gap: screenSize === 'mobile' ? '8px' : '12px',
        padding: screenSize === 'mobile' ? '6px 8px' : '8px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        backgroundColor: isDropdownOpen ? (isDarkMode ? 'var(--surface)' : '#f3f4f6') : (isHovered ? (isDarkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb') : 'transparent'),
        border: 'none',
        outline: 'none'
      },

      profileInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: 0,
        ...(screenSize === 'mobile' && { display: 'none' }) // Hide text on mobile for space
      },

      profileName: {
        fontSize: screenSize === 'mobile' ? '12px' : '14px',
        fontWeight: '600',
        color: isDarkMode ? 'var(--text-primary)' : '#1f2937',
        lineHeight: '1.2',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: screenSize === 'tablet' ? '100px' : '120px'
      },

      profileRole: {
        fontSize: screenSize === 'mobile' ? '10px' : '12px',
        color: isDarkMode ? 'var(--text-secondary)' : '#6b7280',
        lineHeight: '1.2',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: screenSize === 'tablet' ? '100px' : '120px'
      },

      employeeId: {
        fontSize: screenSize === 'mobile' ? '10px' : '12px',
        color: isDarkMode ? 'var(--text-secondary)' : '#6b7280',
        lineHeight: '1.2',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: screenSize === 'tablet' ? '100px' : '120px'
      },

      chevron: {
        color: isDarkMode ? 'var(--text-secondary)' : '#6b7280',
        transition: 'transform 0.2s ease',
        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        ...(screenSize === 'mobile' && { display: 'none' }) // Hide chevron on mobile for space
      },

      dropdown: {
        position: 'absolute',
        top: '100%',
        right: screenSize === 'mobile' ? '-10px' : '0',
        marginTop: '8px',
        backgroundColor: isDarkMode ? 'var(--card-bg)' : 'white',
        borderRadius: '12px',
        boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.6)' : '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border)',
        minWidth: screenSize === 'mobile' ? '260px' : (screenSize === 'tablet' ? '270px' : '280px'),
        maxWidth: screenSize === 'mobile' ? '90vw' : 'none',
        zIndex: 1000,
        overflow: 'hidden'
      },

      dropdownHeader: {
        padding: screenSize === 'mobile' ? '16px' : '20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: screenSize === 'mobile' ? '12px' : '16px',
        backgroundColor: isDarkMode ? 'var(--surface)' : '#f9fafb'
      },

      headerInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: 1,
        minWidth: 0
      },

      headerName: {
        fontSize: screenSize === 'mobile' ? '14px' : '16px',
        fontWeight: '600',
        color: isDarkMode ? 'var(--text-primary)' : '#1f2937',
        lineHeight: '1.2',
        marginBottom: '4px',
        wordBreak: 'break-word'
      },

      headerEmail: {
        fontSize: screenSize === 'mobile' ? '12px' : '14px',
        color: isDarkMode ? 'var(--text-secondary)' : '#6b7280',
        lineHeight: '1.2',
        wordBreak: 'break-all',
        marginBottom: '4px'
      },

      statusText: {
        fontSize: screenSize === 'mobile' ? '11px' : '12px',
        color: userData?.isActive ? '#10b981' : '#ef4444',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      },

      dropdownMenu: {
        padding: screenSize === 'mobile' ? '6px' : '8px'
      },

      menuItem: (isDisabled = false) => ({
        display: 'flex',
        alignItems: 'center',
        gap: screenSize === 'mobile' ? '10px' : '12px',
        padding: screenSize === 'mobile' ? '10px 14px' : '12px 16px',
        borderRadius: '8px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s ease',
        fontSize: screenSize === 'mobile' ? '13px' : '14px',
        color: isDisabled ? (isDarkMode ? 'var(--text-secondary)' : '#9ca3af') : (isDarkMode ? 'var(--text-primary)' : '#374151'),
        opacity: isDisabled ? 0.6 : 1
      }),

      menuIcon: (color, isDisabled = false) => ({
        width: screenSize === 'mobile' ? '32px' : '36px',
        height: screenSize === 'mobile' ? '32px' : '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDisabled ? (isDarkMode ? 'rgba(255,255,255,0.02)' : '#f3f4f6') : `${color}15`,
        color: isDisabled ? (isDarkMode ? 'var(--text-secondary)' : '#9ca3af') : color
      }),

      backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        backgroundColor: 'transparent'
      }
    };

    return baseStyles;
  };

  const styles = getResponsiveStyles();

  return (
    <div style={styles.profileSection}>
      <div 
        style={styles.profileTrigger}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ position: 'relative' }}>
          {renderAvatar('small')}
          {renderStatusIndicator()}
        </div>
        
        <div style={styles.profileInfo}>
          <span style={styles.profileName}>
            {userData?.name || userData?.displayName || 'User'}
          </span>
          <span style={styles.profileRole}>
            {userData?.department || userData?.userType || 'User'}
          </span>
          <span style={styles.employeeId}>
            {userData?.employeeId || 'N/A'}
          </span>
        </div>
        
        <ChevronDown 
          size={screenSize === 'mobile' ? 14 : 16} 
          style={styles.chevron}
        />
      </div>

      {isDropdownOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <div style={{ position: 'relative' }}>
              {renderAvatar('large')}
              {renderStatusIndicator()}
            </div>
            <div style={styles.headerInfo}>
              <span style={styles.headerName}>
                {userData?.name || userData?.displayName || 'User'}
              </span>
              <span style={styles.headerEmail}>
                {userData?.email || 'No email provided'}
              </span>
              <span style={styles.statusText}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: userData?.isActive ? '#10b981' : '#ef4444'
                }} />
                {userData?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div style={styles.dropdownMenu}>
            {profileMenuItems.map((item, index) => (
              <div
                key={item.id}
                style={styles.menuItem(isLoggingOut && item.id === 'logout')}
                onClick={() => {
                  if (!isLoggingOut || item.id !== 'logout') {
                    handleMenuItemClick(item.id);
                  }
                }}
                onMouseEnter={(e) => {
                  if (!isLoggingOut || item.id !== 'logout') {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <div style={styles.menuIcon(item.color, isLoggingOut && item.id === 'logout')}>
                  <item.icon size={screenSize === 'mobile' ? 16 : 18} />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isDropdownOpen && (
        <div 
          style={styles.backdrop}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileSection;