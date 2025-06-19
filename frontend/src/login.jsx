import React, { useState } from 'react';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

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
            
            <div style={styles.featureCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Reach financial goals faster</h3>
                <p style={styles.cardSubtitle}>
                  Use your Venus card around the world with no hidden fees. Hold, transfer and spend money.
                </p>
                <button style={styles.learnMoreBtn}>Learn more</button>
              </div>
              
              <div style={styles.cardVisual}>
                <div style={styles.creditCard}>
                  <div style={styles.cardChip}></div>
                  <div style={styles.cardNumber}>1012 2349 6829 XXXX</div>
                  <div style={styles.cardDetails}>
                    <div style={styles.cardName}>Sahra</div>
                    <div style={styles.cardExpiry}>04/26</div>
                  </div>
                </div>
                <div style={styles.earningsCard}>
                  <div style={styles.earningsIcon}>📊</div>
                  <div>
                    <div style={styles.earningsLabel}>Earnings</div>
                    <div style={styles.earningsAmount}>$350.40</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.bottomSection}>
              <h2 style={styles.bottomTitle}>Introducing new features</h2>
              <p style={styles.bottomText}>
                Analyzing previous trends ensures that businesses always make the right decision. And as the scale of the decision and it's impact magnifies...
              </p>
              <div style={styles.pagination}>
                <div style={styles.paginationDot}></div>
                <div style={styles.paginationDot}></div>
                <div style={styles.paginationDotActive}></div>
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
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    maxWidth: '1000px',
    width: '100%',
    minHeight: '600px'
  },
  content: {
    display: 'flex',
    minHeight: '600px'
  },
  formSection: {
    flex: 1,
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'white'
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
    maxWidth: '400px'
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
    transition: 'border-color 0.3s ease'
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
    flexDirection: 'column'
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
  featureCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    color: '#333',
    marginBottom: '40px',
    marginTop: '60px'
  },
  cardHeader: {
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 12px 0',
    color: '#1a1a1a'
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    margin: '0 0 16px 0'
  },
  learnMoreBtn: {
    backgroundColor: '#2d5a4a',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  cardVisual: {
    position: 'relative',
    height: '120px'
  },
  creditCard: {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '160px',
    height: '100px',
    background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
    borderRadius: '12px',
    padding: '12px',
    color: 'white',
    fontSize: '10px'
  },
  cardChip: {
    width: '20px',
    height: '16px',
    backgroundColor: '#ffd700',
    borderRadius: '4px',
    marginBottom: '8px'
  },
  cardNumber: {
    fontSize: '11px',
    letterSpacing: '1px',
    marginBottom: '8px'
  },
  cardDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px'
  },
  cardName: {
    fontWeight: 'bold'
  },
  cardExpiry: {},
  earningsCard: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    minWidth: '120px'
  },
  earningsIcon: {
    marginRight: '8px',
    fontSize: '16px'
  },
  earningsLabel: {
    fontSize: '12px',
    color: '#666'
  },
  earningsAmount: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  bottomSection: {
    marginTop: 'auto'
  },
  bottomTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 16px 0'
  },
  bottomText: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '20px'
  },
  pagination: {
    display: 'flex',
    gap: '8px'
  },
  paginationDot: {
    width: '8px',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '50%'
  },
  paginationDotActive: {
    width: '8px',
    height: '8px',
    backgroundColor: 'white',
    borderRadius: '50%'
  }
};

export default Login;