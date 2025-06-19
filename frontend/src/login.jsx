import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleHoverAreaEnter = (index) => {
    setCurrentImage(index);
  };

  const getResponsiveStyles = () => {
    const baseStyles = {
      container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: isMobile ? '#2d5a4a' : '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'auto',
        boxSizing: 'border-box'
      },
      card: {
        backgroundColor: 'white',
        borderRadius: isMobile ? '0' : '16px',
        boxShadow: isMobile ? 'none' : '0 4px 24px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        maxWidth: isMobile ? '100%' : '1200px',
        width: '100%',
        minHeight: isMobile ? '100vh' : '700px',
        display: 'flex'
      },
      content: {
        display: 'flex',
        width: '100%',
        minHeight: isMobile ? '100vh' : '700px'
      },
      formSection: {
        width: isMobile ? '100%' : '45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '20px' : '20px',
        backgroundColor: 'white'
      },
      formContainer: {
        width: '100%',
        maxWidth: isMobile ? '100%' : '400px',
        padding: isMobile ? '20px' : '0 20px'
      },
      featureSection: {
        width: '55%',
        background: 'linear-gradient(135deg, #2d5a4a 0%, #1e3d2f 100%)',
        padding: '40px',
        color: 'white',
        position: 'relative',
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column'
      }
    };

    return baseStyles;
  };

  const styles = getResponsiveStyles();

  const additionalStyles = {
    header: {
      marginBottom: isMobile ? '30px' : '40px',
      textAlign: isMobile ? 'center' : 'left'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMobile ? 'center' : 'flex-start',
      marginBottom: isMobile ? '30px' : '40px'
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
      fontSize: isMobile ? '20px' : '24px',
      fontWeight: 'bold',
      color: '#2d5a4a'
    },
    title: {
      fontSize: isMobile ? '28px' : '32px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      margin: '0'
    },
    form: {
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
      zIndex: 1
    },
    input: {
      width: '100%',
      padding: isMobile ? '14px 12px 14px 40px' : '12px 12px 12px 40px',
      border: '2px solid #e1e8ed',
      borderRadius: '8px',
      fontSize: isMobile ? '16px' : '14px', // Prevents zoom on iOS
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
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    formOptions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '15px' : '0'
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
      padding: isMobile ? '18px' : '16px',
      backgroundColor: '#2d5a4a',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: isMobile ? '18px' : '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
      gap: '16px'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#e1e8ed'
    },
    dividerText: {
      color: '#999',
      fontSize: '14px',
      fontWeight: '500'
    },
    socialButtons: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    socialButton: {
      width: '100%',
      padding: isMobile ? '14px' : '12px',
      border: '2px solid #e1e8ed',
      borderRadius: '8px',
      backgroundColor: 'white',
      fontSize: isMobile ? '16px' : '14px',
      color: '#666',
      cursor: 'pointer',
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
      opacity: 0.7,
      transition: 'opacity 0.3s ease'
    },
    hoverDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      transition: 'all 0.3s ease'
    },
    bottomSection: {
      marginTop: 'auto'
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.content}>
          {/* Left Side - Login Form */}
          <div style={styles.formSection}>
            <div style={styles.formContainer}>
              <div style={additionalStyles.header}>
                <div style={additionalStyles.logo}>
                  <div style={additionalStyles.logoIcon}>
                    <div style={additionalStyles.logoGrid}>
                      <div style={additionalStyles.logoDot}></div>
                      <div style={additionalStyles.logoDot}></div>
                      <div style={additionalStyles.logoDot}></div>
                      <div style={additionalStyles.logoDot}></div>
                    </div>
                  </div>
                  <span style={additionalStyles.logoText}>My Access</span>
                </div>
                
                <h1 style={additionalStyles.title}>Sign in</h1>
              </div>

              <div style={additionalStyles.form}>
                <div style={additionalStyles.inputGroup}>
                  <label style={additionalStyles.label}>E-mail</label>
                  <div style={additionalStyles.inputWrapper}>
                    <User style={additionalStyles.inputIcon} size={16} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="example@gmail.com"
                      style={additionalStyles.input}
                      required
                    />
                  </div>
                </div>

                <div style={additionalStyles.inputGroup}>
                  <label style={additionalStyles.label}>Password</label>
                  <div style={additionalStyles.inputWrapper}>
                    <Lock style={additionalStyles.inputIcon} size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="6u#**%"
                      style={additionalStyles.input}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={additionalStyles.eyeButton}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={additionalStyles.formOptions}>
                  <label style={additionalStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={additionalStyles.checkbox}
                    />
                    Remember me
                  </label>
                  <span style={additionalStyles.forgotLink}>Forgot Password?</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    ...additionalStyles.signInButton,
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              <div style={additionalStyles.divider}>
                <div style={additionalStyles.dividerLine}></div>
                <span style={additionalStyles.dividerText}>OR</span>
                <div style={additionalStyles.dividerLine}></div>
              </div>

              <div style={additionalStyles.socialButtons}>
                <button
                  onClick={() => handleSocialLogin('Google')}
                  style={additionalStyles.socialButton}
                >
                  <div style={additionalStyles.googleIcon}>G</div>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialLogin('Facebook')}
                  style={additionalStyles.socialButton}
                >
                  <div style={additionalStyles.facebookIcon}>f</div>
                  Continue with Facebook
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Feature Showcase (Hidden on Mobile) */}
          <div style={styles.featureSection}>
            <div style={additionalStyles.supportBadge}>
              <span>💬 Support</span>
            </div>
            
            <div style={additionalStyles.imageCarousel}>
              <div style={additionalStyles.carouselWrapper}>
                <div style={additionalStyles.imageContainer}>
                  {images.map((img, index) => (
                    <img 
                      key={index}
                      src={img.url}
                      alt={img.alt}
                      style={{
                        ...additionalStyles.carouselImage,
                        opacity: currentImage === index ? 1 : 0,
                        transform: currentImage === index ? 'scale(1)' : 'scale(1.05)'
                      }}
                    />
                  ))}
                </div>
                
                <div style={additionalStyles.hoverAreas}>
                  {images.map((_, index) => (
                    <div 
                      key={index}
                      style={{
                        ...additionalStyles.hoverArea,
                        backgroundColor: currentImage === index ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                      }}
                      onMouseEnter={() => handleHoverAreaEnter(index)}
                    >
                      <div style={additionalStyles.hoverIndicator}>
                        <div style={{
                          ...additionalStyles.hoverDot,
                          backgroundColor: currentImage === index ? 'white' : 'rgba(255, 255, 255, 0.5)'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={additionalStyles.bottomSection}>
              <h2 style={additionalStyles.bottomTitle}>
                {images[currentImage].title}
              </h2>
              <p style={additionalStyles.bottomText}>
                {images[currentImage].description}
              </p>
              <div style={additionalStyles.pagination}>
                {images.map((_, index) => (
                  <div 
                    key={index}
                    style={currentImage === index ? additionalStyles.paginationDotActive : additionalStyles.paginationDot}
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

export default Login;