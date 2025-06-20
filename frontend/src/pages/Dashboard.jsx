import React, { useState } from 'react';
import { Search, Bell, Users, DollarSign, ShoppingCart, TrendingUp, Calendar, Clock, Star, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-react';

const Dashboard = ({ sidebarOpen, activeSection = 'dashboard' }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getMainContentStyle = () => ({
    marginLeft: sidebarOpen ? '300px' : '80px',
    transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'relative'
  });

  const getHeaderStyle = () => ({
    height: '85px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(25px)',
    borderBottom: '1px solid rgba(188, 244, 157, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 35px',
    boxShadow: '0 4px 25px rgba(31, 72, 66, 0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  });

  const getSearchContainerStyle = () => ({
    position: 'relative',
    maxWidth: '450px',
    width: '100%'
  });

  const getSearchInputStyle = () => ({
    width: '100%',
    padding: '14px 18px 14px 50px',
    border: '1px solid rgba(188, 244, 157, 0.4)',
    borderRadius: '14px',
    fontSize: '15px',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(15px)',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontWeight: '500'
  });

  const getMainContentAreaStyle = () => ({
    flex: 1,
    padding: '35px',
    overflow: 'auto',
    background: 'rgba(255, 255, 255, 0.02)'
  });

  const getContainerStyle = () => ({
    maxWidth: '1400px',
    margin: '0 auto'
  });

  const getWelcomeHeaderStyle = () => ({
    marginBottom: '35px',
    animation: 'fadeInUp 0.6s ease-out'
  });

  const getStatsGridStyle = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '25px',
    marginBottom: '35px'
  });

  const getStatsCardStyle = (index) => ({
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(25px)',
    borderRadius: '20px',
    padding: '30px',
    border: '1px solid rgba(188, 244, 157, 0.3)',
    boxShadow: '0 8px 32px rgba(31, 72, 66, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
    position: 'relative',
    overflow: 'hidden'
  });

  const getActivityCardStyle = () => ({
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(25px)',
    borderRadius: '20px',
    padding: '30px',
    border: '1px solid rgba(188, 244, 157, 0.3)',
    boxShadow: '0 8px 32px rgba(31, 72, 66, 0.1)',
    animation: 'fadeInUp 0.6s ease-out 0.4s both'
  });

  const getQuickActionsStyle = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '35px'
  });

  const getQuickActionCardStyle = (index) => ({
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(188, 244, 157, 0.1) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '25px',
    border: '1px solid rgba(188, 244, 157, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    animation: `fadeInUp 0.6s ease-out ${index * 0.1 + 0.2}s both`
  });

  const statsData = [
    { 
      title: 'Total Users', 
      value: '12,543', 
      change: '+12.5%', 
      trend: 'up', 
      icon: Users, 
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    { 
      title: 'Revenue', 
      value: '$89,231', 
      change: '+8.2%', 
      trend: 'up', 
      icon: DollarSign, 
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    { 
      title: 'Orders', 
      value: '3,847', 
      change: '+23.1%', 
      trend: 'up', 
      icon: ShoppingCart, 
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    { 
      title: 'Conversion Rate', 
      value: '4.7%', 
      change: '-2.3%', 
      trend: 'down', 
      icon: TrendingUp, 
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    }
  ];

  const quickActions = [
    { title: 'Create New Project', icon: Zap, color: '#8b5cf6' },
    { title: 'Schedule Meeting', icon: Calendar, color: '#06b6d4' },
    { title: 'View Reports', icon: Activity, color: '#10b981' },
    { title: 'Manage Team', icon: Users, color: '#f59e0b' }
  ];

  const recentActivities = [
    { 
      action: 'New user registration', 
      detail: 'sarah.johnson@company.com', 
      time: '2 minutes ago',
      type: 'user'
    },
    { 
      action: 'Order completed', 
      detail: 'Order #ORD-2024-1847 - $299.00', 
      time: '5 minutes ago',
      type: 'order'
    },
    { 
      action: 'Payment received', 
      detail: 'Stripe payment - $1,247.50', 
      time: '12 minutes ago',
      type: 'payment'
    },
    { 
      action: 'New message', 
      detail: 'Customer support inquiry', 
      time: '18 minutes ago',
      type: 'message'
    },
    { 
      action: 'System backup', 
      detail: 'Database backup completed successfully', 
      time: '25 minutes ago',
      type: 'system'
    }
  ];

  const handleSearchFocus = (e) => {
    e.target.style.borderColor = '#BCF49D';
    e.target.style.boxShadow = '0 0 0 4px rgba(188, 244, 157, 0.15)';
    e.target.style.background = 'rgba(255, 255, 255, 1)';
  };

  const handleSearchBlur = (e) => {
    e.target.style.borderColor = 'rgba(188, 244, 157, 0.4)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
  };

  const handleCardHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-8px)';
    e.currentTarget.style.boxShadow = '0 16px 48px rgba(31, 72, 66, 0.15)';
  };

  const handleCardLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(31, 72, 66, 0.1)';
  };

  const handleQuickActionHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
    e.currentTarget.style.boxShadow = '0 12px 32px rgba(31, 72, 66, 0.15)';
  };

  const handleQuickActionLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={getMainContentStyle()}>
      {/* Header */}
      <header style={getHeaderStyle()}>
        {/* Search Bar */}
        <div style={getSearchContainerStyle()}>
          <Search 
            size={22} 
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}
          />
          <input
            type="text"
            placeholder="Search projects, users, or documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={getSearchInputStyle()}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
        </div>

        {/* Header Right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Notifications */}
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '14px',
            color: '#6b7280',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(188, 244, 157, 0.15)';
            e.target.style.color = '#1F4842';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#6b7280';
          }}>
            <Bell size={22} />
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              border: '2px solid white'
            }}></span>
          </button>

          {/* Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '10px 15px',
            borderRadius: '14px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(188, 244, 157, 0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1F4842 0%, #BCF49D 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '700',
              boxShadow: '0 4px 15px rgba(31, 72, 66, 0.3)'
            }}>
              JD
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1F4842'
              }}>
                John Doe
              </span>
              <span style={{
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Administrator
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={getMainContentAreaStyle()}>
        <div style={getContainerStyle()}>
          {/* Welcome Header */}
          <div style={getWelcomeHeaderStyle()}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#1F4842',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #1F4842 0%, #0f766e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Welcome back, John! 👋
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              fontWeight: '500',
              lineHeight: '1.6'
            }}>
              Here's what's happening with your business today. You have 3 new notifications.
            </p>
          </div>

          {/* Statistics Cards */}
          <div style={getStatsGridStyle()}>
            {statsData.map((stat, index) => (
              <div
                key={index}
                style={getStatsCardStyle(index)}
                onMouseEnter={handleCardHover}
                onMouseLeave={handleCardLeave}
              >
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: `${stat.bgGradient}`,
                  opacity: 0.1,
                  borderRadius: '50%',
                  transform: 'translate(30px, -30px)'
                }} />
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '55px',
                    height: '55px',
                    borderRadius: '16px',
                    background: stat.bgGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${stat.color}30`
                  }}>
                    <stat.icon size={26} color="white" />
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: stat.trend === 'up' ? '#10b981' : '#ef4444'
                  }}>
                    {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {stat.change}
                  </div>
                </div>
                
                <h3 style={{
                  fontSize: '15px',
                  color: '#6b7280',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {stat.title}
                </h3>
                
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#1F4842',
                  lineHeight: '1.2'
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F4842',
              marginBottom: '20px'
            }}>
              Quick Actions
            </h2>
            <div style={getQuickActionsStyle()}>
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  style={getQuickActionCardStyle(index)}
                  onMouseEnter={handleQuickActionHover}
                  onMouseLeave={handleQuickActionLeave}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '12px',
                      backgroundColor: action.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 15px ${action.color}30`
                    }}>
                      <action.icon size={22} color="white" />
                    </div>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1F4842'
                    }}>
                      {action.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={getActivityCardStyle()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '25px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1F4842'
              }}>
                Recent Activity
              </h2>
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Last 24 hours
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {recentActivities.map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '18px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(188, 244, 157, 0.08)',
                  border: '1px solid rgba(188, 244, 157, 0.2)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(188, 244, 157, 0.15)';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(188, 244, 157, 0.08)';
                  e.target.style.transform = 'translateX(0)';
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: activity.type === 'user' ? '#3b82f6' : 
                                   activity.type === 'order' ? '#10b981' :
                                   activity.type === 'payment' ? '#f59e0b' :
                                   activity.type === 'message' ? '#8b5cf6' : '#6b7280',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1F4842',
                      marginBottom: '4px'
                    }}>
                      {activity.action}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {activity.detail}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    <Clock size={14} />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;