import React, { useState, useEffect, useRef } from 'react';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Login attempt:', formData);
      setLoading(false);
    }, 1000);
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
  };

  const images = [
    {
      url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&h=350&fit=crop&crop=center",
      alt: "Financial Dashboard",
      title: "Smart Financial Dashboard",
      description: "Monitor your financial performance with our intuitive dashboard. Track expenses, income, and investment returns in real-time with beautiful visualizations."
    },
    {
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=350&fit=crop&crop=center",
      alt: "Analytics Chart",
      title: "Advanced Analytics",
      description: "Leverage powerful analytics to make data-driven decisions. Our advanced charting tools help you identify trends and opportunities for growth."
    },
    {
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=350&fit=crop&crop=center",
      alt: "Business Growth",
      title: "Business Growth Tools",
      description: "Scale your business with our comprehensive suite of growth tools. From market analysis to performance optimization, we've got you covered."
    }
  ];

  // Auto-cycle images when hovering over carousel
  useEffect(() => {
    if (isHovering) {
      intervalRef.current = setInterval(() => {
        setCurrentImage(prev => (prev + 1) % images.length);
      }, 5000); // Change every 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering, images.length]);

  const handleCarouselMouseEnter = () => {
    setIsHovering(true);
  };

  const handleCarouselMouseLeave = () => {
    setIsHovering(false);
  };

  const handleHoverAreaEnter = (index) => {
    setCurrentImage(index);
    // Temporarily pause auto-cycling when hovering specific area
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleHoverAreaLeave = () => {
    // Resume auto-cycling if still hovering the carousel
    if (isHovering) {
      intervalRef.current = setInterval(() => {
        setCurrentImage(prev => (prev + 1) % images.length);
      }, 5000); // Change every 5 seconds
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.content}>
          {/* Left Side - Login Form */}
          <div style={styles.formSection}>
            <div style={styles.header}>
              <div style={styles.logo}>
                <div style={styles.logoIcon}>
                  <div style={styles.logoGrid}>
                    <div style={styles.logoDot}></div>
                    <div style={styles.logoDot}></div>
                    <div style={styles.logoDot}></div>
                    <div style={styles.logoDot}></div>
                  </div>
                </div>
                <span style={styles.logoText}>My Access</span>
              </div>
              
              <h1 style={styles.title}>Sign in</h1>
              
            </div>

            <div style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>E-mail</label>
                <div style={styles.inputWrapper}>
                  <UserOutlined style={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <LockOutlined style={styles.inputIcon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="6u#**%"
                    style={styles.input}
                    required
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              <div style={styles.formOptions}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={styles.checkbox}
                  />
                  Remember me
                </label>
                <span style={styles.forgotLink}>Forgot Password?</span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  ...styles.signInButton,
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div style={styles.divider}>
                <span style={styles.dividerText}>OR</span>
              </div>

              <button
                onClick={() => handleSocialLogin('Google')}
                style={styles.socialButton}
              >
                <div style={styles.googleIcon}>G</div>
                Continue with Google
              </button>

              <button
                onClick={() => handleSocialLogin('Facebook')}
                style={styles.socialButton}
              >
                <div style={styles.facebookIcon}>f</div>
                Continue with Facebook
              </button>
            </div>
          </div>

          {/* Right Side - Feature Showcase */}
          <div style={styles.featureSection}>
            <div style={styles.supportBadge}>
              <span>💬 Support</span>
            </div>
            
            <div 
              style={styles.imageCarousel}
              onMouseEnter={handleCarouselMouseEnter}
              onMouseLeave={handleCarouselMouseLeave}
            >
              <div style={styles.carouselWrapper}>
                <div style={styles.imageContainer}>
                  {images.map((img, index) => (
                    <img 
                      key={index}
                      src={img.url}
                      alt={img.alt}
                      style={{
                        ...styles.carouselImage,
                        opacity: currentImage === index ? 1 : 0,
                        transform: currentImage === index ? 'scale(1)' : 'scale(1.05)'
                      }}
                    />
                  ))}
                </div>
                
                {/* Enhanced hover areas with visual feedback */}
                <div style={styles.hoverAreas}>
                  {images.map((_, index) => (
                    <div 
                      key={index}
                      style={{
                        ...styles.hoverArea,
                        backgroundColor: currentImage === index ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                      onMouseEnter={() => handleHoverAreaEnter(index)}
                      onMouseLeave={handleHoverAreaLeave}
                    >
                      <div style={{
                        ...styles.hoverIndicator,
                        opacity: isHovering ? 1 : 0
                      }}>
                        <div style={{
                          ...styles.hoverDot,
                          backgroundColor: currentImage === index ? 'white' : 'rgba(255, 255, 255, 0.5)'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-cycle indicator */}
                {isHovering && (
                  <div style={styles.autoCycleIndicator}>
                    <div style={styles.autoCycleText}>Auto-cycling...</div>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.bottomSection}>
              <h2 style={styles.bottomTitle}>
                {images[currentImage].title}
              </h2>
              <p style={styles.bottomText}>
                {images[currentImage].description}
              </p>
              <div style={styles.pagination}>
                {images.map((_, index) => (
                  <div 
                    key={index}
                    style={currentImage === index ? styles.paginationDotActive : styles.paginationDot}
                    onClick={() => setCurrentImage(index)}
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

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'auto',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    maxWidth: '1200px',
    width: '100%',
    minHeight: '700px',
    maxHeight: 'calc(100vh - 40px)',
    display: 'flex',
    flexDirection: 'column'
  },
  content: {
    display: 'flex',
    minHeight: '700px',
    flex: 1,
    overflow: 'hidden'
  },
  formSection: {
    flex: 1,
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'white',
    overflow: 'auto',
    minWidth: '400px'
  },
  header: {
    marginBottom: '40px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '40px'
  },
  logoIcon: {
    marginRight: '8px'
  },
  logoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2px',
    width: '16px',
    height: '16px'
  },
  logoDot: {
    backgroundColor: '#2d5a4a',
    borderRadius: '2px'
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2d5a4a'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: '0 0 8px 0'
  },
  subtitle: {
    color: '#666',
    fontSize: '14px',
    margin: 0
  },
  link: {
    color: '#2d5a4a',
    textDecoration: 'underline',
    cursor: 'pointer'
  },
  form: {
    maxWidth: '400px',
    width: '100%'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#999',
    fontSize: '16px',
    zIndex: 1
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '2px solid #e1e8ed',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    fontSize: '16px',
    padding: '4px'
  },
  formOptions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer'
  },
  checkbox: {
    marginRight: '8px',
    width: '16px',
    height: '16px'
  },
  forgotLink: {
    fontSize: '14px',
    color: '#666',
    textDecoration: 'underline',
    cursor: 'pointer'
  },
  signInButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#2d5a4a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'background-color 0.3s ease'
  },
  divider: {
    textAlign: 'center',
    margin: '20px 0',
    position: 'relative'
  },
  dividerText: {
    backgroundColor: 'white',
    padding: '0 16px',
    color: '#999',
    fontSize: '14px'
  },
  socialButton: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e1e8ed',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.3s ease'
  },
  googleIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#4285f4',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  facebookIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#1877f2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  featureSection: {
    flex: 1,
    background: 'linear-gradient(135deg, #2d5a4a 0%, #1e3d2f 100%)',
    padding: '40px',
    color: 'white',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minWidth: '500px'
  },
  supportBadge: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px'
  },
  imageCarousel: {
    marginBottom: '40px',
    marginTop: '60px',
    position: 'relative'
  },
  carouselWrapper: {
    width: '400px',
    height: '250px',
    borderRadius: '16px',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a'
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  carouselImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '16px'
  },
  hoverAreas: {
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'flex',
    width: '100%',
    height: '100%'
  },
  hoverArea: {
    flex: 1,
    height: '100%',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  hoverIndicator: {
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  hoverDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    transition: 'all 0.3s ease'
  },
  autoCycleIndicator: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '4px 8px',
    borderRadius: '12px',
    opacity: 0,
    animation: 'fadeInOut 0.5s ease-in-out'
  },
  autoCycleText: {
    fontSize: '10px',
    color: 'white',
    fontWeight: '500'
  },
  bottomSection: {
    marginTop: 'auto',
    minHeight: '120px'
  },
  bottomTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    transition: 'all 0.5s ease',
    minHeight: '35px'
  },
  bottomText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '24px',
    transition: 'all 0.5s ease',
    minHeight: '50px'
  },
  pagination: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  paginationDot: {
    width: '10px',
    height: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  paginationDotActive: {
    width: '24px',
    height: '10px',
    backgroundColor: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

export default Login;