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
  Upload,
   Dropdown,

  
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
  UploadOutlined,
  
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
const [hasMore, setHasMore] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
const [searchResults, setSearchResults] = useState([]);


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
    // ✅ ONLY set lastFetchTime to prevent re-fetch, don't fetch here
    setLastFetchTime(1); // Set to 1 to prevent the fetch in the next useEffect
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
// In EmailClient.jsx

useEffect(() => {
  // We only run this logic when the user becomes authenticated
  if (isAuthenticated && emailCredentials.email && lastFetchTime === 0) {
    
    // 1. Fetch Inbox immediately and set it as the active folder
    message.info('Loading...');
    fetchEmails('INBOX', 10, 0).then((fetchedEmails) => {
        setActiveFolder('inbox');
        setLastFetchTime(Date.now());
        // ✅ Initialize hasMore based on fetched emails
        setHasMore(fetchedEmails.length === 10);
    });

    // 2. Fetch Sent emails after 4 seconds to reduce server load
    const sentTimeout = setTimeout(() => {
      // message.info('Loading...');
      fetchEmails('sent', 10, 0);
    }, 4000);

    // 3. Fetch Trash emails after 8 seconds
    const trashTimeout = setTimeout(() => {
      // message.info('Loading...');
      fetchEmails('trash', 10, 0);
    }, 8000);

    // This is a cleanup function to prevent memory leaks
    return () => {
      clearTimeout(sentTimeout);
      clearTimeout(trashTimeout);
    };
  }
}, [isAuthenticated, emailCredentials.email, lastFetchTime]);
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

// In EmailClient.jsx, replace the existing fetchEmails function

const fetchEmails = async (folder = 'INBOX', limit = 10, offset = 0) => {
  setLoading(true);
  
  try {
    let endpoint = '/fetch';
    let folderDisplayName = 'Inbox';
    
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
      requestBody.folder = folder;
    }

    const { data: result } = await axios.post(`${API_BASE}${endpoint}`, requestBody);
    
    if (result.success) {
      const fetchedEmails = result.emails || [];
      
      // Always replace the email list for pagination view
      if (folder === 'SENT' || folder === 'sent') {
        setSentEmails(fetchedEmails);
      } else if (folder === 'trash') {
        setTrashEmails(fetchedEmails);
      } else {
        setEmails(fetchedEmails);
      }
      
      // ✅ FIXED: Set hasMore based on actual fetched email count
      // If we got exactly the limit, there might be more
      // If we got less than limit, there are no more
      setHasMore(fetchedEmails.length === limit);
      
      if (offset === 0) {
          // message.success(`Refreshed ${folderDisplayName}`);
      }
      
      return fetchedEmails;
    } else {
      message.error(`Error fetching ${folderDisplayName}: ${result.error || 'Request failed'}`);
      setHasMore(false);
      return [];
    }
  } catch (error) {
    message.error('Network error while fetching emails: ' + error.message);
    setHasMore(false);
    return [];
  } finally {
    setLoading(false);
  }
};
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
// ✅ NEW: Function to move an email from Inbox or Sent to Trash
// ✅ NEW: Function to move an email from Inbox or Sent to Trash
// ✅ IMPROVED: Function to move email to trash with optimistic UI update
const handleMoveToTrash = async (email, sourceFolder) => {
    // We keep the Modal.confirm for safety
    Modal.confirm({
        title: 'Move to Trash?',
        content: 'Are you sure you want to move this email to the trash?',
        okText: 'Move',
        okType: 'danger',
        onOk: async () => {
            // Send the request to the server in the background
            try {
                const response = await fetch(`${API_BASE}/move-to-trash`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...emailCredentials,
                        uid: email.uid,
                        sourceFolder: sourceFolder,
                    }),
                });

                const result = await response.json();
                if (!result.success) {
                    // If the server fails, show an error and stop.
                    message.error('Move to trash failed: ' + result.error);
                    return; 
                }

            } catch (err) {
                message.error('Error moving email: ' + err.message);
                return;
            }

            // --- Optimistic UI Update ---
            // This code runs immediately after the server call starts,
            // assuming it will be successful.

            message.success('Email moved to trash');

            // 1. Remove the email from its original folder's state
            if (sourceFolder === 'inbox') {
                setEmails(prevEmails => prevEmails.filter(e => e.uid !== email.uid));
            } else if (sourceFolder === 'sent') {
                setSentEmails(prevEmails => prevEmails.filter(e => e.uid !== email.uid));
            }

            // 2. Add the email to the beginning of the trash folder's state
            setTrashEmails(prevTrash => [email, ...prevTrash]);

            // 3. Close the email detail modal if it's open
            if (selectedEmail?.uid === email.uid) {
                setEmailDetailVisible(false);
                setSelectedEmail(null);
            }
        },
    });
};// ✅ NEW: Function to permanently delete an email from the Trash folder
const handlePermanentDelete = async (email) => {
    Modal.confirm({
        title: 'Permanently Delete?',
        content: 'This action is irreversible. Are you sure you want to permanently delete this email?',
        okText: 'Delete Forever',
        okType: 'danger',
        onOk: async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE}/delete-permanently`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...emailCredentials,
                        uid: email.uid,
                    }),
                });

                const result = await response.json();
                if (result.success) {
                    message.success('Email permanently deleted');
                    await handleManualRefresh(); // Refresh the trash folder
                } else {
                    message.error('Permanent delete failed: ' + result.error);
                }
            } catch (err) {
                message.error('Error deleting email: ' + err.message);
            } finally {
                setLoading(false);
            }
        },
    });
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

// ✅ UPDATED: Function to render the list of emails with mobile-friendly UI and delete functionality
const renderEmailList = () => {
    let currentEmails = [];
    let folderTitle = '';
    let folderIcon = null;

    switch (activeFolder) {
        case 'sent':
        case 'SENT':
            currentEmails = sentEmails;
            folderTitle = 'Sent';
            folderIcon = <SendOutlined />;
            break;
        case 'trash':
            currentEmails = trashEmails;
            folderTitle = 'Trash';
            folderIcon = <DeleteOutlined />;
            break;
        default:
            currentEmails = emails;
            folderTitle = 'Inbox';
            folderIcon = <InboxOutlined />;
    }

    return (
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
            bodyStyle={{ height: 'calc(100% - 57px)', overflowY: 'auto', padding: '0' }}
        >
            <Spin spinning={loading && currentEmails.length === 0}>
                <List
                    itemLayout="horizontal"
                    dataSource={currentEmails}
                    renderItem={(email) => {
                        const isSentFolder = activeFolder === 'sent' || activeFolder === 'SENT';
                        const fromOrTo = isSentFolder ? `To: ${email.to}` : email.from;

                        return (
                            <List.Item
                                style={{
                                    cursor: 'pointer',
                                    padding: '12px 16px',
                                    backgroundColor: selectedEmail?.uid === email.uid ? '#e6f7ff' : 'white',
                                    borderBottom: '1px solid #f0f0f0',
                                }}
                                actions={!loading ? [
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent modal from opening
                                            if (activeFolder === 'trash') {
                                                handlePermanentDelete(email);
                                            } else {
                                                handleMoveToTrash(email, activeFolder);
                                            }
                                        }}
                                    />
                                ] : []}
                                onClick={() => handleEmailClick(email)}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} style={{ marginTop: '4px' }} />}
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <Text strong style={{ flex: '1 1 auto', marginRight: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {fromOrTo}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                                                {email.date}
                                            </Text>
                                        </div>
                                    }
                                    description={
                                        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 14 }}>
                                            {email.subject}
                                        </Paragraph>
                                    }
                                />
                            </List.Item>
                        );
                    }}
                />
            </Spin>
        </Card>
    );
};
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
// In EmailClient.jsx, replace the existing renderEmailInterface function
const handleSearch = async (query) => {
  setSearchQuery(query);
  
  if (!query.trim()) {
    setSearchDropdownVisible(false);
    setSearchResults([]);
    return;
  }
  
  setIsSearching(true);
  
  try {
    let currentEmails = [];
    
    // Get current folder emails
    switch (activeFolder) {
      case 'sent':
        currentEmails = sentEmails.length > 0 ? sentEmails : await fetchEmails('sent', 100, 0);
        break;
      case 'trash':
        currentEmails = trashEmails.length > 0 ? trashEmails : await fetchEmails('trash', 50, 0);
        break;
      default:
        currentEmails = emails.length > 0 ? emails : await fetchEmails('INBOX', 50, 0);
    }
    
    // Fuzzy search with scoring
    const scoredResults = currentEmails
      .map(email => ({
        ...email,
        score: calculateFuzzyScore(email, query)
      }))
      .filter(email => email.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Limit to 8 results for dropdown
    
    setSearchResults(scoredResults);
    setSearchDropdownVisible(scoredResults.length > 0);
    
  } catch (error) {
    console.error('Search failed:', error);
    setSearchResults([]);
    setSearchDropdownVisible(false);
  } finally {
    setIsSearching(false);
  }
};
const calculateFuzzyScore = (email, query) => {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Subject matching (highest priority)
  if (email.subject) {
    const subject = email.subject.toLowerCase();
    if (subject.includes(queryLower)) {
      score += 10;
    } else if (fuzzyMatch(subject, queryLower)) {
      score += 6;
    }
  }
  
  // From/To matching
  if (email.from && email.from.toLowerCase().includes(queryLower)) {
    score += 8;
  } else if (email.from && fuzzyMatch(email.from.toLowerCase(), queryLower)) {
    score += 4;
  }
  
  if (email.to && email.to.toLowerCase().includes(queryLower)) {
    score += 8;
  } else if (email.to && fuzzyMatch(email.to.toLowerCase(), queryLower)) {
    score += 4;
  }
  
  // Body matching (lowest priority)
  if (email.body) {
    const bodyText = email.body.replace(/<[^>]*>/g, '').toLowerCase();
    if (bodyText.includes(queryLower)) {
      score += 3;
    } else if (fuzzyMatch(bodyText, queryLower)) {
      score += 1;
    }
  }
  
  return score;
};

// 4. Add this function to handle search result selection
const handleSearchResultSelect = (email) => {
  setSelectedEmail(email);
  setEmailDetailVisible(true);
  setSearchDropdownVisible(false);
  setSearchQuery('');
};

const fuzzyMatch = (text, query) => {
  if (!text || !query) return false;
  
  text = text.toLowerCase();
  query = query.toLowerCase();
  
  // Exact match gets highest priority
  if (text.includes(query)) return true;
  
  // Fuzzy matching - check if all characters of query exist in text in order
  let textIndex = 0;
  let queryIndex = 0;
  
  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      queryIndex++;
    }
    textIndex++;
  }
  
  return queryIndex === query.length;
};

const renderEmailInterface = () => (
  
  <Layout style={{ height: '100vh', overflow: 'hidden', background: 'transparent' }}>
<Header style={{
  background: '#fff',
  padding: '0 16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center', // ✅ This ensures vertical centering
  justifyContent: 'space-between',
  height: 64,
  minHeight: 64 // ✅ Add minHeight for consistency
}}>
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', // ✅ Ensure items are vertically centered
    flex: 1,
    maxWidth: 'calc(100% - 200px)',
    gap: 12 // ✅ Add consistent gap instead of margin
  }}>
    <Avatar 
      icon={<MailOutlined />} 
      style={{ 
        backgroundColor: '#0D7139',
        flexShrink: 0 // ✅ Prevent avatar from shrinking
      }} 
    />
    <Input.Search
      placeholder="Search emails..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onSearch={handleSearch}
      style={{ 
        width: isMobile ? 200 : 300,
        flexShrink: 0 // ✅ Prevent search from shrinking
      }}
      loading={isSearching}
    />
  </div>
      {/* Professional Pagination and Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Pagination Buttons */}

{/* Pagination Buttons */}
{(['inbox', 'sent', 'trash'].includes(activeFolder)) && (
  <Space size={8}>
    <Button
      size={isMobile ? "middle" : "small"}
      onClick={() => {
        if (activeFolder === 'inbox') {
          const prevOffset = Math.max(0, inboxOffset - 10);
          setInboxOffset(prevOffset);
          fetchEmails('INBOX', 10, prevOffset);
        } else if (activeFolder === 'sent') {
          const prevOffset = Math.max(0, sentOffset - 10);
          setSentOffset(prevOffset);
          fetchEmails('sent', 10, prevOffset);
        } else if (activeFolder === 'trash') {
          const prevOffset = Math.max(0, trashOffset - 10);
          setTrashOffset(prevOffset);
          fetchEmails('trash', 10, trashOffset);
        }
      }}
      disabled={
        (activeFolder === 'inbox' && inboxOffset === 0) ||
        (activeFolder === 'sent' && sentOffset === 0) ||
        (activeFolder === 'trash' && trashOffset === 0) ||
        loading
      }
      title="Previous" // This shows on hover
      style={{ minWidth: 32 }}
    >
      ←
    </Button>
    <Button
      size={isMobile ? "middle" : "small"}
      onClick={() => {
        if (activeFolder === 'inbox') {
          const nextOffset = inboxOffset + 10;
          setInboxOffset(nextOffset);
          fetchEmails('INBOX', 10, nextOffset);
        } else if (activeFolder === 'sent') {
          const nextOffset = sentOffset + 10;
          setSentOffset(nextOffset);
          fetchEmails('sent', 10, nextOffset);
        } else if (activeFolder === 'trash') {
          const nextOffset = trashOffset + 10;
          setTrashOffset(nextOffset);
          fetchEmails('trash', 10, nextOffset);
        }
      }}
      disabled={!hasMore || loading}
      title="Next" // This shows on hover
      style={{ minWidth: 32 }}
    >
      →
    </Button>
  </Space>
)}
        <Button
          type="text"
          onClick={handleLogout}
          icon={<LogoutOutlined />}
          size={isMobile ? "middle" : "small"}
        >
          {!isMobile && 'Logout'}
        </Button>
      </div>
    </Header>
    <Content
      style={{
        padding: isTablet ? 12 : 16,
        background: 'transparent',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden'
      }}
    >

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
);  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {!isAuthenticated ? renderAuthForm() : renderEmailInterface()}
    </div>
  );
};

export default EmailClient;
