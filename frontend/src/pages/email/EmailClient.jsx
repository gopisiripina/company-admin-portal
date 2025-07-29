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
  Affix,
  Upload
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
  LogoutOutlined,
  UploadOutlined
} from '@ant-design/icons';
import axios from 'axios';
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
  const [attachments, setAttachments] = useState([]);
const [lastFetchTime, setLastFetchTime] = useState(0);
const [sentEmails, setSentEmails] = useState([]);
const [composeForm] = Form.useForm(); // Add form instance
const [inboxOffset, setInboxOffset] = useState(0);
const [trashEmails, setTrashEmails] = useState([]);
const [showReply, setShowReply] = useState(false);
  const [showForward, setShowForward] = useState(false);

  const [trashOffset, setTrashOffset] = useState(0);
const [sentOffset, setSentOffset] = useState(0);



const handleLogout = () => {
  // Clear all email-related states
  setIsAuthenticated(false);
  setEmailCredentials({ email: '', password: '' });
  setEmails([]);
  setSentEmails([]);
  setTrashEmails([]);
  setSelectedEmail(null);
  setComposeData({ to: '', subject: '', body: '' });
  setAttachments([]);
  setLastFetchTime(0);
  setInboxOffset(0);
  setEmailDetailVisible(false);
  setActiveFolder('inbox'); // Reset to default folder
  
  // Clear localStorage
  localStorage.removeItem('emailCredentials');
  
  // Reset form
  if (composeForm) {
    composeForm.resetFields();
  }
  
  // Call parent logout handler
  if (onLogout) {
    onLogout();
  }
  
  message.success('Logged out successfully');
};

useEffect(() => {
  const stored = localStorage.getItem('emailCredentials');
  if (stored) {
    const creds = JSON.parse(stored);
    setEmailCredentials(creds);
    setIsAuthenticated(true);
    onAuthSuccess?.();
    // ❌ REMOVE THIS LINE - Don't fetch on initial load
    // fetchEmails('INBOX', 10, 0);
  }
}, [onAuthSuccess]);



  const API_BASE = 'https://cap.myaccessio.com:5000/api/email';

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

// EmailClient.jsx
useEffect(() => {
  // We only run this logic when the user becomes authenticated
  if (isAuthenticated && emailCredentials.email) {
    
    // 1. Fetch Inbox immediately and set it as the active folder
    message.info('Fetching Inbox...');
    fetchEmails('INBOX', 10, 0).then(() => {
        setActiveFolder('inbox');
    });

    // 2. Fetch Sent emails after 4 seconds to reduce server load
    const sentTimeout = setTimeout(() => {
      message.info('Fetching Sent folder...');
      fetchEmails('sent', 10, 0);
    }, 4000);

    // 3. Fetch Trash emails after 8 seconds
    const trashTimeout = setTimeout(() => {
      message.info('Fetching Trash folder...');
      fetchEmails('trash', 10, 0);
    }, 8000);

    // This is a cleanup function to prevent memory leaks
    // It will clear the timers if the component unmounts
    return () => {
      clearTimeout(sentTimeout);
      clearTimeout(trashTimeout);
    };
  }
}, [isAuthenticated, emailCredentials.email]); 
const handleEmailAuth = async (values) => {
  setLoading(true);
  
  try {
    const { data: result } = await axios.post(`${API_BASE}/test-connection`, values);

    
    if (result.success) {
      setIsAuthenticated(true);
      setEmailCredentials(values);
      localStorage.setItem('emailCredentials', JSON.stringify(values));
      if (onAuthSuccess) onAuthSuccess();
      
      // ❌ REMOVE THE SETTIMEOUT BLOCK FROM HERE
      /*
      setTimeout(() => {
        fetchEmails('INBOX', 10, 0);
        setActiveFolder('inbox');
      }, 1000);
      */

    } else {
      message.error('Authentication failed: ' + result.error);
    }
  } catch (error) {
    message.error('Connection error: ' + error.message);
  } finally {
    setLoading(false);
  }
};
const handleManualRefresh = async () => {
  switch (activeFolder) {
    case 'sent':
    case 'SENT':
      await fetchEmails('sent', 10, 0);
      break;
    case 'trash':
      await fetchEmails('trash', 10, 0);
      break;
    case 'inbox':
    default:
      setInboxOffset(0);
      await fetchEmails('INBOX', 10, 0);
      break;
  }
};


// In EmailClient.jsx, replace the existing fetchEmails function with this updated version.

const fetchEmails = async (folder = 'INBOX', limit = 10, offset = 0) => {
  setLoading(true);
  
  try {
    let endpoint = '/fetch';
    let folderDisplayName = 'Inbox';
    
    // Standardize the request body for all folder types
    let requestBody = {
      ...emailCredentials,
      limit,
      offset
    };
    
    if (folder === 'SENT' || folder === 'sent') {
      endpoint = '/fetch-sent';
      folderDisplayName = 'Sent';
    } else if (folder === 'trash') {
      endpoint = '/fetch-trash';
      folderDisplayName = 'Trash';
    } else {
      requestBody.folder = folder; // For INBOX
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    
    if (result.success) {
      const fetchedEmails = result.emails || [];
      if (folder === 'SENT' || folder === 'sent') {
        setSentEmails(fetchedEmails);
      } else if (folder === 'trash') {
        setTrashEmails(fetchedEmails); // Replace existing trash emails with the newly fetched ones
      } else {
        if (offset === 0) {
          setEmails(fetchedEmails); // Fresh load for inbox
        } else {
          setEmails(prev => [...prev, ...fetchedEmails]); // Pagination for inbox
        }
      }
      message.success(`Loaded ${fetchedEmails.length} emails from ${folderDisplayName}`);
      return fetchedEmails;
    } else {
      // Display the specific error message from the server
      message.error(`Error fetching ${folderDisplayName}: ${result.error || 'Request failed'}`);
      return [];
    }
  } catch (error) {
    message.error('Network error while fetching emails: ' + error.message);
    return [];
  } finally {
    setLoading(false);
  }
};// Updated sendEmail function in EmailClient.jsx
const sendEmail = async (values) => {
  setLoading(true);

  try {
    const formData = new FormData();
    formData.append('email', emailCredentials.email);
    formData.append('password', emailCredentials.password);
    formData.append('to', values.to);
    formData.append('subject', values.subject);
    formData.append('body', values.body || '');
    formData.append('saveSent', 'true'); // ✅ Add flag to save to sent folder

    attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      message.success('Email sent successfully!');
      composeForm.resetFields();
      setComposeData({ to: '', subject: '', body: '' });
      setAttachments([]);

      // ✅ Only refresh sent folder if user is viewing it
      if (activeFolder === 'sent') {
        setTimeout(async () => {
          await fetchEmails('sent', 100, 0);
        }, 2000);
      }
    } else {
      message.error('Failed to send email: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    message.error('Network error: ' + error.message);
  } finally {
    setLoading(false);
  }
};
 const handleEmailClick = (email) => {
  setSelectedEmail(email);
  setEmailDetailVisible(true); // Always show modal for all devices
};
const handleDeleteEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE}/move-to-trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailCredentials.email,
        password: emailCredentials.password,
        uid: email.uid
      })
    });

    const result = await response.json();
    if (result.success) {
      message.success('Email moved to trash');
      // Refresh inbox
      await fetchEmails('INBOX', 10, inboxOffset);
    } else {
      message.error('Delete failed: ' + result.error);
    }
  } catch (err) {
    message.error('Error deleting email: ' + err.message);
  }
};


const menuItems = [
 {
    key: 'inbox',
    icon: <InboxOutlined />,
    label: 'Inbox',
    onClick: async () => {
      if (activeFolder === 'inbox') return; // ✅ Prevent reload if already active
      setActiveFolder('inbox');
      setInboxOffset(0);
      await fetchEmails('INBOX', 10, 0);
      if (onFolderChange) onFolderChange('inbox');
      setMobileDrawerVisible(false);
    }
  },
  {
    key: 'compose',
    icon: <EditOutlined />,
    label: 'Compose',
    onClick: () => {
      setActiveFolder('compose');
      if (onFolderChange) onFolderChange('compose');
      setMobileDrawerVisible(false);
      // Remove any email fetching from here
    }
  },
 {
    key: 'sent',
    icon: <SendOutlined />,
    label: 'Sent',
    onClick: async () => {
      if (activeFolder === 'sent') return; // ✅ Prevent reload if already active
      setActiveFolder('sent');
      await fetchEmails('sent', 100, 0);
      if (onFolderChange) onFolderChange('sent');
      setMobileDrawerVisible(false);
    }
  },
  {
    key: 'trash',
    icon: <DeleteOutlined />,
    label: 'Trash',
    onClick: async () => {
      if (activeFolder === 'trash') return; // ✅ Prevent reload if already active
      setActiveFolder('trash');
      await fetchEmails('trash', 10, 0);
      if (onFolderChange) onFolderChange('trash');
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

const renderEmailList = () => {
  let currentEmails = [];
  let folderTitle = '';
  let folderIcon = null;
  let showLoadMore = false;
  
  switch (activeFolder) {
    case 'sent':
    case 'SENT':
      currentEmails = sentEmails;
      folderTitle = 'Sent';
      folderIcon = <SendOutlined />;
      showLoadMore = sentEmails.length >= 100 && sentEmails.length % 100 === 0;
      break;
    case 'trash':
      currentEmails = trashEmails;
      folderTitle = 'Trash';
      folderIcon = <DeleteOutlined />;
      showLoadMore = trashEmails.length >= 100 && trashEmails.length % 100 === 0;
      break;
    default:
      currentEmails = emails;
      folderTitle = 'Inbox';
      folderIcon = <InboxOutlined />;
      showLoadMore = emails.length > 0;
  }
  
  return (
    <>
      <Card 
        title={
          <Space>
            {folderIcon}
            <span>{folderTitle}</span>
            <Badge count={currentEmails.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleManualRefresh}
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
            dataSource={currentEmails}
            renderItem={(email, index) => (
              <List.Item
                onClick={() => handleEmailClick(email)}
                style={{
                  cursor: 'pointer',
                  padding: isTablet ? '16px 20px' : '12px 16px',
                  backgroundColor: selectedEmail === email ? '#f0f2ff' : 'white',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} size={isTablet ? 'large' : 'default'} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: isMobile ? 14 : isTablet ? 15 : 16 }}>
                        {(activeFolder === 'sent' || activeFolder === 'SENT') ? `To: ${email.to}` : email.from}
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
      
      {/* ✅ NEW: Universal Load More Button */}
    
    </>
  );
};// Update renderCompose to use form instance
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
      form={composeForm} // Add form instance
      name="compose-email"
      layout="vertical"
      onFinish={sendEmail}
      initialValues={composeData}
    >
      {/* Rest of the form remains the same */}
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
        rules={[{ required: false, message: 'Please input email body!' }]}
      >
        <TextArea 
          placeholder="Write your email here..."
          rows={isMobile ? 8 : isTablet ? 10 : 12}
          size="large"
        />
      </Form.Item>

      <Form.Item label="Attachments">
        <Upload
          beforeUpload={(file) => {
            setAttachments((prev) => [...prev, file]);
            return false;
          }}
          fileList={attachments}
          onRemove={(file) => {
            setAttachments((prev) => prev.filter((f) => f.uid !== file.uid));
          }}
          multiple
        >
          <Button icon={<UploadOutlined />}>Attach Files</Button>
        </Upload>
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
const extractEmailOnly = (text) => {
  if (!text) return '';
  // Handle cases like "John Doe <john@example.com>"
  const match = text.match(/<([^>]+)>/);
  if (match) return match[1];
  // Handle cases where it's just the email
  if (text.includes('@')) return text;
  return text;
};
const renderEmailDetail = () => {
  if (!selectedEmail) return null;
  
  // New state for reply/forward visibility
  
  
  // Extract just the email address from "Name <email@example.com>" format
  const extractEmail = (str) => {
    const match = str?.match(/<([^>]+)>/);
    return match ? match[1] : str;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text strong>From: </Text>
        <Text>{selectedEmail.from}</Text>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong>To: </Text>
        <Text>{selectedEmail.to}</Text>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong>Date: </Text>
        <Text>{selectedEmail.date}</Text>
      </div>
      <Divider />
      
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="default"
            onClick={() => {
              setShowReply(true);
              setShowForward(false);
            }}
          >
            Reply
          </Button>
          <Button 
            type="default"
            onClick={() => {
              setShowForward(true);
              setShowReply(false);
            }}
          >
            Forward
          </Button>
        </Space>
      </div>

      {/* Original Message */}
      <div 
        style={{ 
          maxHeight: '40vh', 
          overflow: 'auto',
          lineHeight: '1.6',
          marginBottom: 16,
          padding: 16,
          backgroundColor: '#f9f9f9',
          border: '1px solid #f0f0f0',
          borderRadius: 4
        }}
        dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
      />
      
      {/* Reply Form */}
      {showReply && (
        <Card 
          title="Reply"
          extra={
            <Button 
              type="text" 
              icon={<CloseOutlined />}
              onClick={() => setShowReply(false)}
            />
          }
          style={{ marginBottom: 16 }}
        >
          <Form
            onFinish={(values) => {
              sendEmail({
                ...values,
                to: extractEmail(selectedEmail.from),
                subject: selectedEmail.subject.startsWith('Re:') ? 
                  selectedEmail.subject : `Re: ${selectedEmail.subject}`,
                body: `${values.body}<br><br>--- Original Message ---<br>${selectedEmail.body}`
              });
              setShowReply(false);
            }}
          >
            <Form.Item
              name="to"
              initialValue={extractEmail(selectedEmail.from)}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="subject"
              initialValue={selectedEmail.subject.startsWith('Re:') ? 
                selectedEmail.subject : `Re: ${selectedEmail.subject}`}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="body"
            >
              <TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Send Reply
            </Button>
          </Form>
        </Card>
      )}
      
      {/* Forward Form */}
      {showForward && (
        <Card 
          title="Forward"
          extra={
            <Button 
              type="text" 
              icon={<CloseOutlined />}
              onClick={() => setShowForward(false)}
            />
          }
          style={{ marginBottom: 16 }}
        >
          <Form
            onFinish={(values) => {
              sendEmail({
                ...values,
                subject: selectedEmail.subject.startsWith('Fwd:') ? 
                  selectedEmail.subject : `Fwd: ${selectedEmail.subject}`,
                body: `${values.body}<br><br>--- Forwarded Message ---<br>
                  From: ${selectedEmail.from}<br>
                  To: ${selectedEmail.to}<br>
                  Date: ${selectedEmail.date}<br><br>
                  ${selectedEmail.body}`
              });
              setShowForward(false);
            }}
          >
            <Form.Item
              name="to"
              rules={[{ required: true, message: 'Please enter recipient email' }]}
            >
              <Input placeholder="recipient@example.com" />
            </Form.Item>
            <Form.Item
              name="subject"
              initialValue={selectedEmail.subject.startsWith('Fwd:') ? 
                selectedEmail.subject : `Fwd: ${selectedEmail.subject}`}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="body"
            >
              <TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Send Forward
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
};// Update the main render to handle sent folder
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
  
  {/* ✅ FIX: Add pagination beside logout */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <Text type="secondary" style={{ 
      fontSize: isTablet ? 14 : 16,
      display: isMobile ? 'none' : 'block'
    }}>
      {emailCredentials.email}
    </Text>
    
    {/* ✅ NEW: Pagination controls */}
    {(['inbox', 'sent', 'trash'].includes(activeFolder)) && (
<Button
  type="primary"
  size="small"
  onClick={async () => {
    if (activeFolder === 'inbox') {
      const nextOffset = inboxOffset + 10;
      const result = await fetchEmails('INBOX', 10, nextOffset);
      if (result?.length) setInboxOffset(nextOffset);
    } else if (activeFolder === 'sent') {
      const nextOffset = sentOffset + 10;
      const result = await fetchEmails('sent', 10, nextOffset);
      if (result?.length) {
        setSentEmails(prev => [...prev, ...result]);
        setSentOffset(nextOffset);
      }
    } else if (activeFolder === 'trash') {
      const nextOffset = trashOffset + 10;
      const result = await fetchEmails('trash', 10, nextOffset);
      if (result?.length) {
        setTrashEmails(prev => [...prev, ...result]);
        setTrashOffset(nextOffset);
      }
    }
  }}
  loading={loading}
  style={{ display: isMobile ? 'none' : 'block' }}
>
  Load More
</Button>
    )}
    
    <Button 
      type="text" 
      onClick={handleLogout}
      icon={<LogoutOutlined />}
    >
      Logout
    </Button>
  </div>
</Header>    
    <Content style={{ 
      padding: isTablet ? 12 : 16, 
      background: '#f0f2f5',
      height: 'calc(100vh - 64px)', 
      overflow: 'hidden'
    }}>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        {(['inbox', 'sent', 'trash'].includes(activeFolder)) && renderEmailList()}
        {activeFolder === 'compose' && renderCompose()}

      </div>
    </Content>

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
);  // Update the return statement
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {!isAuthenticated ? renderAuthForm() : renderEmailInterface()}
    </div>
  );
};

export default EmailClient;
