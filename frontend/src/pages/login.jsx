import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import authService from '../firebase/authService'; // Import the auth service
import '../styles/login.css';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  
  // Timer management
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use auth service for authentication
      const authResult = await authService.authenticate(formData.email, formData.password);
      
      if (authResult.success) {
        // Login successful
        console.log('Login successful:', authResult.user);
        
        // Store user data if remember me is checked
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
      url: "/src/assets/image1.webp",
      alt: "Industrial PCB Assembly",
      title: "Automated PCB Manufacturing Process",
      description: "We specialize in high-performance embedded systems and electronic solutions, tailored for IoT, smart devices, and industrial automation. Our focus is on innovation, reliability, and scalable quality."
    },
    {
      url: "/src/assets/image2.webp",
      alt: "Robotics and Embedded Systems Lab",
      title: "Programmable Robotics for Smart Automation",
      description: "We develop intelligent robotic systems powered by embedded technology, designed for automation, research, and next-generation innovation."
    },
    {
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=350&fit=crop&crop=center",
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
      {/* Demo Credentials Info */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        fontSize: '12px',
        zIndex: 1000,
        border: '1px solid #e5e7eb'
      }}>
        <strong>Demo Credentials:</strong><br/>
        {demoCredentials.map((cred, index) => (
          <div key={index}>
            {cred.email} / {cred.password}<br/>
          </div>
        ))}
        <br/>
        <strong>Or use Firestore credentials</strong>
      </div>

      <div className="login-card">
        <div className="login-content">
          {/* Left Side - Login Form */}
          <div className="form-section">
            <div className="form-container">
              <div className="form-header">
                <div className="logo">
                  <div className="">
                    
                  </div>
                  <img src="src/assets/logo.png" alt="My Access Logo" className="logo-image" />
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
    </div>
  );
};

export default Login;