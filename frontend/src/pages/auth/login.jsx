import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Eye, EyeOff, X, Sun, Moon } from 'lucide-react';
import authService from '../../supabase/authService';
import './login.css';
import '../../../src/styles/login-themes.css';
import image1 from '../../assets/image1.svg';
import image2 from '../../assets/image2.svg';
import image3 from '../../assets/image3.svg';
import logo from '../../assets/logo 1.svg';
import { useTheme } from '../../context/ThemeContext';
const Login = ({ onLoginSuccess }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  
  // Password change modal states
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [tempUserData, setTempUserData] = useState(null); // Store user data temporarily
  
  // Timer management
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

   useEffect(() => {
  // Check for stored user data on component mount
  const storedUserData = authService.getStoredUserData();
  if (storedUserData) {
    // Auto-login or redirect to dashboard
    if (onLoginSuccess) {
      onLoginSuccess(storedUserData);
    }
  }
}, [onLoginSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handlePasswordChangeInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordChangeData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (passwordChangeError) setPasswordChangeError('');
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return null;
  };

 

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordChangeLoading(true);
    setPasswordChangeError('');

    // Validate new password
    const passwordValidationError = validatePassword(passwordChangeData.newPassword);
    if (passwordValidationError) {
      setPasswordChangeError(passwordValidationError);
      setPasswordChangeLoading(false);
      return;
    }

    // Check if passwords match
    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      setPasswordChangeError('Passwords do not match');
      setPasswordChangeLoading(false);
      return;
    }

    // Check if new password is same as current password
    if (passwordChangeData.newPassword === formData.password) {
      setPasswordChangeError('New password must be different from your current password');
      setPasswordChangeLoading(false);
      return;
    }

    try {
      // Call auth service to change password
      const result = await authService.changeFirstLoginPassword(
        tempUserData.id, 
        passwordChangeData.newPassword
      );

      if (result.success) {
        // Update user data to reflect that it's no longer first login
        const updatedUserData = {
          ...tempUserData,
          isFirstLogin: false
        };

        // Store user data if remember me was checked
        authService.storeUserData(updatedUserData, rememberMe);

        // Close modal and redirect to dashboard
        setShowPasswordChangeModal(false);
        if (onLoginSuccess) {
          onLoginSuccess(updatedUserData);
        }
      } else {
        setPasswordChangeError(result.error);
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordChangeError('An unexpected error occurred. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const closePasswordChangeModal = () => {
    setShowPasswordChangeModal(false);
    setPasswordChangeData({ newPassword: '', confirmPassword: '' });
    setPasswordChangeError('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setTempUserData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use auth service for authentication
      const authResult = await authService.authenticate(formData.email, formData.password);
      
      if (authResult.success) {
        
        // --- START OF MODIFIED CODE ---
        // Check if the user has portal access before proceeding
        if (authResult.user && authResult.user.portal_access === false) {
          setError('Your portal access has been denied. Please contact an administrator.');
          setLoading(false);
          return; // Stop the login process
        }
        // --- END OF MODIFIED CODE ---
        
        // Check if this is first time login
        if (authResult.isFirstLogin) {
          // Store user data temporarily and show password change modal
          setTempUserData(authResult.user);
          setShowPasswordChangeModal(true);
          setLoading(false);
          return;
        }
        
        // Regular login - store user data and redirect
        authService.storeUserData(authResult.user, rememberMe);
        
        // Call the success callback to redirect to dashboard
        if (onLoginSuccess) {
          onLoginSuccess(authResult.user);
        }
      } else {
        // Login failed
        setError(authResult.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    
    try {
      const authResult = await authService.socialLogin(provider);
      
      if (authResult.success) {
        // Store user data if remember me is checked
        authService.storeUserData(authResult.user, rememberMe);
        
        // Call the success callback
        if (onLoginSuccess) {
          onLoginSuccess(authResult.user);
        }
      } else {
        setError(authResult.error);
      }
    } catch (error) {
      console.error('Social login error:', error);
      setError('Social login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const images = [
    {
      url: image1,
      alt: "Industrial PCB Assembly",
      title: "Automated PCB Manufacturing Process",
      description: "We specialize in high-performance embedded systems and electronic solutions, tailored for IoT, smart devices, and industrial automation. Our focus is on innovation, reliability, and scalable quality."
    },
    {
      url: image2,
      alt: "Robotics and Embedded Systems Lab",
      title: "Programmable Robotics for Smart Automation",
      description: "We develop intelligent robotic systems powered by embedded technology, designed for automation, research, and next-generation innovation."
    },
    {
      url: image3,
      // url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=350&fit=crop&crop=center",
      alt: "Business Growth",
      title: "Business Growth Tools",
      description: "Scale your business with our comprehensive suite of growth tools. From market analysis to performance optimization, we've got you covered."
    }
  ];

  // Auto-rotation logic
  const startAutoRotation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % images.length);
    }, 5000);
  };

  const stopAutoRotation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const restartAutoRotationWithDelay = () => {
    stopAutoRotation();
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      startAutoRotation();
    }, 5000);
  };

  // Initialize auto-rotation on component mount
  useEffect(() => {
    startAutoRotation();
    
    // Cleanup on unmount
    return () => {
      stopAutoRotation();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleHoverAreaEnter = (index) => {
    setCurrentImage(index);
    restartAutoRotationWithDelay();
  };

  const handlePaginationClick = (index) => {
    setCurrentImage(index);
    restartAutoRotationWithDelay();
  };

  // Pause auto-rotation when user hovers over the carousel
  const handleCarouselMouseEnter = () => {
    stopAutoRotation();
  };

  const handleCarouselMouseLeave = () => {
    startAutoRotation();
  };

  // Get demo credentials for display
  const demoCredentials = authService.getDemoCredentials();

  return (
    <div className="login-container">
      <button
        className="theme-toggle-button"
        onClick={toggleTheme}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <div className="login-card">
        <div className="login-content">
          {/* Left Side - Login Form */}
          <div className="form-section">
            <div className="form-container">
              <div className="form-header">
                <div className="logo">
                  <div className="">
                    
                  </div>
                  <img src={logo} alt="My Access Logo" className="logo-image" />
                </div>
                
                <h1 className="form-title">Sign in</h1>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {error}
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">E-mail</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={16} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="example@gmail.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="form-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="eye-button"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox"
                    />
                    Remember me
                  </label>
                  <span className="forgot-link">Forgot Password?</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="signin-button"
                  style={{
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">OR</span>
                <div className="divider-line"></div>
              </div>

              <div className="social-buttons">
                <button
                  onClick={() => handleSocialLogin('Google')}
                  className="social-button"
                  disabled={loading}
                >
                  <div className="google-icon">G</div>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialLogin('Facebook')}
                  className="social-button"
                  disabled={loading}
                >
                  <div className="facebook-icon">f</div>
                  Continue with Facebook
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Feature Showcase (Hidden on Mobile) */}
          <div className="feature-section">
            <div className="support-badge">
              <span>💬 Support</span>
            </div>
            
            <div 
              className="image-carousel"
              onMouseEnter={handleCarouselMouseEnter}
              onMouseLeave={handleCarouselMouseLeave}
            >
              <div className="carousel-wrapper">
                <div className="image-container">
                  {images.map((img, index) => (
                    <img 
                      key={index}
                      src={img.url}
                      alt={img.alt}
                      className="carousel-image"
                      style={{
                        opacity: currentImage === index ? 1 : 0,
                        transform: currentImage === index ? 'scale(1)' : 'scale(1.05)'
                      }}
                    />
                  ))}
                </div>
                
                <div className="hover-areas">
                  {images.map((_, index) => (
                    <div 
                      key={index}
                      className={`hover-area ${currentImage === index ? 'active' : ''}`}
                      onMouseEnter={() => handleHoverAreaEnter(index)}
                    >
                      <div className="hover-indicator">
                        <div className={`hover-dot ${currentImage === index ? 'active' : ''}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bottom-section">
              <h2 className="bottom-title">
                {images[currentImage].title}
              </h2>
              <p className="bottom-text">
                {images[currentImage].description}
              </p>
              <div className="pagination">
                {images.map((_, index) => (
                  <div 
                    key={index}
                    className={`pagination-dot ${currentImage === index ? 'active' : ''}`}
                    onClick={() => handlePaginationClick(index)}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Change Your Password
              </h2>
              <button
                onClick={closePasswordChangeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#6b7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Description */}
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              This is your first time logging in. For security reasons, please create a new password.
            </p>

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChangeSubmit}>
              {/* Error Message */}
              {passwordChangeError && (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {passwordChangeError}
                </div>
              )}

              {/* New Password Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  New Password
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Lock 
                    size={16} 
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#9ca3af',
                      zIndex: 1
                    }} 
                  />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordChangeData.newPassword}
                    onChange={handlePasswordChangeInputChange}
                    placeholder="Enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      paddingRight: '40px'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '2px'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Confirm New Password
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Lock 
                    size={16} 
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#9ca3af',
                      zIndex: 1
                    }} 
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordChangeData.confirmPassword}
                    onChange={handlePasswordChangeInputChange}
                    placeholder="Confirm new password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      paddingRight: '40px'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '2px'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                  margin: '0 0 8px 0'
                }}>
                  Password Requirements:
                </h4>
                <ul style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0,
                  paddingLeft: '16px',
                  lineHeight: '1.5'
                }}>
                  <li>At least 8 characters long</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One lowercase letter (a-z)</li>
                  <li>One number (0-9)</li>
                  <li>One special character (@$!%*?&)</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={closePasswordChangeModal}
                  disabled={passwordChangeLoading}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: passwordChangeLoading ? 'not-allowed' : 'pointer',
                    opacity: passwordChangeLoading ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!passwordChangeLoading) {
                      e.target.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!passwordChangeLoading) {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: passwordChangeLoading ? 'not-allowed' : 'pointer',
                    opacity: passwordChangeLoading ? 0.7 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!passwordChangeLoading) {
                      e.target.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!passwordChangeLoading) {
                      e.target.style.backgroundColor = '#3b82f6';
                    }
                  }}
                >
                  {passwordChangeLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;