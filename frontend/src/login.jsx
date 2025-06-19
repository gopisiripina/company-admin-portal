import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

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

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-content">
          {/* Left Side - Login Form */}
          <div className="form-section">
            <div className="form-container">
              <div className="form-header">
                <div className="logo">
                  <div className="logo-icon">
                    <div className="logo-grid">
                      <div className="logo-dot"></div>
                      <div className="logo-dot"></div>
                      <div className="logo-dot"></div>
                      <div className="logo-dot"></div>
                    </div>
                  </div>
                  <span className="logo-text">My Access</span>
                </div>
                
                <h1 className="form-title">Sign in</h1>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
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
                      placeholder="6u#**%"
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
                >
                  <div className="google-icon">G</div>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialLogin('Facebook')}
                  className="social-button"
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
            
            <div className="image-carousel">
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
              {/* hi */}
              <p className="bottom-text">
                {images[currentImage].description}
              </p>
              <div className="pagination">
                {images.map((_, index) => (
                  <div 
                    key={index}
                    className={`pagination-dot ${currentImage === index ? 'active' : ''}`}
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