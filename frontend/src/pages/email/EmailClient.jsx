import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Form, 
  Input, 
  Button, 
  Card, 
  List, 
  Typography, 
  Space, 
  Drawer, 
  Modal, 
  Badge,
  Spin,
  Menu,
  Avatar,
  Divider,
  message,
  Row,
  Col,
  Affix
} from 'antd';
import { 
  MailOutlined, 
  SendOutlined, 
  InboxOutlined, 
  DeleteOutlined, 
  ReloadOutlined, 
  EditOutlined,
  UserOutlined,
  CloseOutlined,
  MenuOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const EmailClient = ({ userRole, activeFolder, onFolderChange, onAuthSuccess, onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailCredentials, setEmailCredentials] = useState({ email: '', password: '' });
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [emailDetailVisible, setEmailDetailVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

  const handleLogout = () => {
  setIsAuthenticated(false);
  setEmailCredentials({ email: '', password: '' });
  setEmails([]);
  setSelectedEmail(null);
  setComposeData({ to: '', subject: '', body: '' });
  localStorage.removeItem('emailCredentials');
  
  // Add this line to notify parent component
  if (onLogout) {
    onLogout();
  }
};

useEffect(() => {
  const storedCreds = localStorage.getItem('emailCredentials');
  if (storedCreds) {
    const creds = JSON.parse(storedCreds);
    setEmailCredentials(creds);
    setIsAuthenticated(true);
    
    // IMPORTANT: Call onAuthSuccess here too for stored credentials
    if (onAuthSuccess) {
      onAuthSuccess();
    }
    
    fetchEmails();
  }
}, [onAuthSuccess]);

  const API_BASE = 'http://192.210.241.34:5000/api/email';

  useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    setIsMobile(width <= 768);
    // Add tablet-specific state if needed
    setIsTablet(width > 768 && width <= 1024);
  };
  
  window.addEventListener('resize', handleResize);
  handleResize(); // Call immediately
  return () => window.removeEventListener('resize', handleResize);
}, []);

const handleEmailAuth = async (values) => {
  setLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    
    const result = await response.json();
    
    if (result.success) {
      setIsAuthenticated(true);
      setEmailCredentials(values);
      message.success('Successfully connected to email!');
      localStorage.setItem('emailCredentials', JSON.stringify(values));
       if (onAuthSuccess) {
    onAuthSuccess();
  }
      fetchEmails();
    } else {
      message.error('Authentication failed: ' + result.error);
    }
  } catch (error) {
    message.error('Connection error: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const fetchEmails = async (folder = 'INBOX') => {
  setLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...emailCredentials,
        folder,
        limit: 100 // Increased limit to get more emails
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setEmails(result.emails);
      message.success(`Loaded ${result.emails.length} emails`);
    } else {
      message.error('Failed to fetch emails: ' + result.error);
    }
  } catch (error) {
    message.error('Error fetching emails: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const sendEmail = async (values) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailCredentials,
          ...values
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('Email sent successfully!');
        setComposeData({ to: '', subject: '', body: '' });
        setActiveFolder('inbox');
        fetchEmails();
      } else {
        message.error('Failed to send email: ' + result.error);
      }
    } catch (error) {
      message.error('Error sending email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

 const handleEmailClick = (email) => {
  setSelectedEmail(email);
  setEmailDetailVisible(true); // Always show modal for all devices
};

  const menuItems = [
    {
      key: 'inbox',
      icon: <InboxOutlined />,
      label: 'Inbox',
      onClick: () => {
        setActiveFolder('inbox');
        setMobileDrawerVisible(false);
      }
    },
    {
      key: 'compose',
      icon: <EditOutlined />,
      label: 'Compose',
      onClick: () => {
        setActiveFolder('compose');
        setMobileDrawerVisible(false);
      }
    }
  ];

  const renderAuthForm = () => (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
     
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 400, 
          margin: '0 16px',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={64} icon={<MailOutlined />} style={{ backgroundColor: '#0d7139' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            Connect to Your Email
          </Title>
          <Text type="secondary">Enter your Hostinger email credentials</Text>
        </div>
        
        <Form
          name="email-auth"
          layout="vertical"
          onFinish={handleEmailAuth}
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />}
              placeholder="your-email@domain.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password 
              placeholder="Your email password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
              style={{ borderRadius: 6 , backgroundColor:"#0d7139"}}
            >
              Connect Email
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const renderEmailList = () => (
    <Card 
      title={
        <Space>
          <InboxOutlined />
          <span>Inbox</span>
          <Badge count={emails.length} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      }
      extra={
        <Button 
          icon={<ReloadOutlined />}
          onClick={() => fetchEmails()}
          loading={loading}
          type="text"
        >
          {!isMobile && 'Refresh'}
        </Button>
      }
      style={{ height: '100%' }}
bodyStyle={{ 
  height: 'calc(100% - 57px)', 
  overflow: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none'
  }
}}

   >
      <Spin spinning={loading}>
        <List
          itemLayout="horizontal"
          dataSource={emails}
          renderItem={(email, index) => (
          <List.Item
  onClick={() => handleEmailClick(email)}
  style={{
    cursor: 'pointer',
    padding: isTablet ? '16px 20px' : '12px 16px',
    backgroundColor: selectedEmail === email ? '#f0f2ff' : 'white',
    borderBottom: '1px solid #f0f0f0'
  }}
  actions={!isMobile && !isTablet ? [
    <Button 
      type="text" 
      icon={<DeleteOutlined />} 
      size="small"
      danger
    />
  ] : undefined}
>
             <List.Item.Meta
  avatar={<Avatar icon={<UserOutlined />} size={isTablet ? 'large' : 'default'} />}
  title={
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text strong style={{ fontSize: isMobile ? 14 : isTablet ? 15 : 16 }}>
        {email.from}
      </Text>
      <Text type="secondary" style={{ fontSize: isTablet ? 13 : 12 }}>
        {email.date}
      </Text>
    </div>
  }
  description={
    <div>
      <Text style={{ fontSize: isMobile ? 13 : isTablet ? 14 : 14 }}>
        {email.subject}
      </Text>
    </div>
  }
/>
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );

  const renderCompose = () => (
    <Card 
      title={
        <Space>
          <EditOutlined />
          <span>Compose Email</span>
        </Space>
      }
      style={{ height: '100%' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      <Form
        name="compose-email"
        layout="vertical"
        onFinish={sendEmail}
        initialValues={composeData}
      >
        <Form.Item
          label="To"
          name="to"
          rules={[
            { required: true, message: 'Please input recipient email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input 
            placeholder="recipient@example.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Subject"
          name="subject"
          rules={[{ required: true, message: 'Please input email subject!' }]}
        >
          <Input 
            placeholder="Email subject"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Message"
          name="body"
          rules={[{ required: true, message: 'Please input email body!' }]}
        >
         <TextArea 
  placeholder="Write your email here..."
  rows={isMobile ? 8 : isTablet ? 10 : 12}
  size="large"
/>

        </Form.Item>

        <Form.Item>
          <Button 
  type="primary" 
  htmlType="submit" 
  loading={loading}
  size="large"
  icon={<SendOutlined />}
  block={isMobile || isTablet}
  style={{ 
    borderRadius: 6,
    height: isTablet ? 44 : 40
  }}
>
  Send Email
</Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderEmailDetail = () => (
    <Card
      title={selectedEmail?.subject}
      style={{ height: '100%' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        isMobile && (
          <Button 
            type="text" 
            icon={<CloseOutlined />}
            onClick={() => setEmailDetailVisible(false)}
          />
        )
      }
    >
      {selectedEmail && (
        <div>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>From: </Text>
              <Text>{selectedEmail.from}</Text>
            </div>
            <div>
              <Text strong>Date: </Text>
              <Text>{selectedEmail.date}</Text>
            </div>
            <Divider />
            <div 
              dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              style={{ 
                lineHeight: 1.6,
                wordBreak: 'break-word'
              }}
            />
          </Space>
        </div>
      )}
    </Card>
  );

  const renderSidebar = () => (
    <Menu
      mode="inline"
      selectedKeys={[activeFolder]}
      items={menuItems}
      style={{ height: '100%', borderRight: 0 }}
    />
  );

  const renderEmailInterface = () => (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Space>
            <Avatar icon={<MailOutlined />} style={{ backgroundColor: '#0D7139' }} />
            <Title level={4} style={{ margin: 0 }}>
              {isTablet ? 'Email' : 'Email Client'}
            </Title>
          </Space>
        </div>
        <Text type="secondary" style={{ 
          fontSize: isTablet ? 14 : 16,
          display: isMobile ? 'none' : 'block'
        }}>
          {emailCredentials.email}
        </Text>
        <Button 
    type="text" 
    onClick={handleLogout}
    icon={<LogoutOutlined />}
  >
    Logout
  </Button>
      </Header>

      {/* Remove the Sider component completely */}
      
      <Content style={{ 
        padding: isTablet ? 12 : 16, 
        background: '#f0f2f5',
        height: 'calc(100vh - 64px)', 
        overflow: 'hidden'
      }}>
        <div style={{ height: '100%', overflow: 'hidden' }}>
          {/* Use activeFolder prop instead of state */}
          {activeFolder === 'inbox' && renderEmailList()}
          {activeFolder === 'compose' && renderCompose()}
        </div>
      </Content>

      {/* Remove the mobile drawer completely */}

      {/* Keep the email detail modal */}
      <Modal
        title={selectedEmail?.subject}
        open={emailDetailVisible}
        onCancel={() => {
          setEmailDetailVisible(false);
          setSelectedEmail(null);
        }}
        footer={null}
        width={isMobile ? "95%" : isTablet ? "90%" : "70%"}
        style={{ top: isMobile ? 20 : isTablet ? 40 : 50 }}
        bodyStyle={{ 
          padding: isMobile ? 16 : isTablet ? 20 : 24,
          maxHeight: isMobile ? '80vh' : isTablet ? '70vh' : '75vh',
          overflow: 'auto'
        }}
      >
        {selectedEmail && renderEmailDetail()}
      </Modal>
    </Layout>
  );

  // Update the return statement
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {!isAuthenticated ? renderAuthForm() : renderEmailInterface()}
    </div>
  );
};

export default EmailClient;
