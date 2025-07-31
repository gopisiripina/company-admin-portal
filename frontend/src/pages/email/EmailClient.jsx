import React, { useState, useEffect,useRef } from 'react';
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
  const [showReplyAll, setShowReplyAll] = useState(false);

  const [trashOffset, setTrashOffset] = useState(0);
const [sentOffset, setSentOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [searchDropdownVisible, setSearchDropdownVisible] = useState(false);
const [searchResults, setSearchResults] = useState([]);
// In EmailClient.jsx, add this state variable near the others
const [showCcBcc, setShowCcBcc] = useState(false);
// In EmailClient.jsx, near your other state variables

const [replyAttachments, setReplyAttachments] = useState([]);
const [replyAllAttachments, setReplyAllAttachments] = useState([]);
const [forwardAttachments, setForwardAttachments] = useState([]);
const ws = useRef(null);
const activeFolderRef = useRef(activeFolder);
useEffect(() => { activeFolderRef.current = activeFolder; }, [activeFolder]);

// In EmailClient.jsx, replace the handleLogout function

// In EmailClient.jsx

const handleLogout = () => {
  // Clear all email-related states
   if (ws.current) {
    ws.current.close(); // <-- ADD THIS LINE
    ws.current = null;
  }
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
  setSentOffset(0); // Also reset sent offset
  setTrashOffset(0); // Also reset trash offset
  setEmailDetailVisible(false);
  
  // ✅ FIXED: Use the onFolderChange prop to reset the active folder
  if (onFolderChange) {
    onFolderChange('inbox');
  }
  
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
// In EmailClient.jsx, add this new useEffect hook

// In EmailClient.jsx

useEffect(() => {
  // 1. Don't run if the user is not authenticated
  if (!isAuthenticated || !emailCredentials.email) {
    return;
  }

  // 2. A custom cleanup function to be called ONLY on logout or true unmount
  const cleanup = () => {
    if (ws.current) {
      console.log('[WebSocket] Cleanup: Closing connection.');
      ws.current.close();
      ws.current = null;
    }
  };

  // 3. Create the connection
  const socket = new WebSocket('wss://cap.myaccessio.com/api/ws');
  ws.current = socket;

  socket.onopen = () => {
    console.log('[WebSocket] Connection established.');
    socket.send(JSON.stringify({
      type: 'auth',
      email: emailCredentials.email,
      password: emailCredentials.password,
    }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'new_mail') {
      console.log('New mail notification received!');
      message.info('You have new mail!', 2);
      
      // 4. Use the ref to get the LATEST activeFolder value
      if (activeFolderRef.current === 'inbox') {
        handleManualRefresh();
      }
    }
  };

  socket.onclose = () => {
    console.log('[WebSocket] Connection closed.');
    ws.current = null; // Clear the ref on close
  };

  socket.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
    ws.current = null;
  };

  // 5. Return the cleanup function. React will call this when isAuthenticated
  // or emailCredentials change (i.e., on logout). StrictMode will still
  // call it, but our handleLogout function ensures a clean state.
  return cleanup;

}, [isAuthenticated, emailCredentials.email]); // Dependencies are correct



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

// In EmailClient.jsx, replace the main useEffect hook

// In EmailClient.jsx, replace the main useEffect hook

useEffect(() => {
  // We only run this logic when the user becomes authenticated
  if (isAuthenticated && emailCredentials.email && lastFetchTime === 0) {
    
    const fetchAllFolders = async () => {
        message.loading({ content: 'Loading Inbox...', key: 'loading' });
        // Fetch Inbox first and set the active folder
        const inboxEmails = await fetchEmails('INBOX', 10, 0);
        
        // ✅ FIX: Use the onFolderChange prop instead of the non-existent setActiveFolder
        if (onFolderChange) {
          onFolderChange('inbox');
        }

        setLastFetchTime(Date.now());
        setHasMore(inboxEmails.length === 10);
        message.success({ content: 'Inbox loaded!', key: 'loading', duration: 2 });

        // Now that the crash is fixed, these will run correctly.
        setTimeout(async () => {
            // message.loading({ content: 'Getting Sent items...', key: 'sent' });
            await fetchEmails('sent', 10, 0);
            //  message.success({ content: 'Sent items loaded!', key: 'sent', duration: 2 });
        }, 1000);

        setTimeout(async () => {
            //  message.loading({ content: 'Getting Trash items...', key: 'trash' });
            await fetchEmails('trash', 10, 0);
            //  message.success({ content: 'Trash items loaded!', key: 'trash', duration: 2 });
        }, 2000);
    };
    
    fetchAllFolders();
  }
}, [isAuthenticated, emailCredentials.email, lastFetchTime, onFolderChange]); // Added onFolderChange to dependency array


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
// In EmailClient.jsx, replace the existing handleManualRefresh function

const handleManualRefresh = async () => {
  switch (activeFolder) {
    case 'sent':
    case 'SENT':
      setSentOffset(0); // ✅ ADDED: Reset pagination for sent folder
      await fetchEmails('sent', 10, 0);
      break;
    case 'trash':
      setTrashOffset(0); // ✅ ADDED: Reset pagination for trash folder
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

// In EmailClient.jsx, replace the fetchEmails function

const fetchEmails = async (folder = 'INBOX', limit = 10, offset = 0) => {
  setLoading(true);
  
  let endpoint = '/fetch';
  let folderDisplayName = 'Inbox';
  // Define a key to identify the folder being fetched, matching 'activeFolder' state
  let fetchedFolderKey = 'inbox'; 
  
  try {
    let requestBody = { ...emailCredentials, limit, offset };
    
    if (folder === 'SENT' || folder === 'sent') {
      endpoint = '/fetch-sent';
      folderDisplayName = 'Sent';
      fetchedFolderKey = 'sent';
    } else if (folder === 'trash') {
      endpoint = '/fetch-trash';
      folderDisplayName = 'Trash';
      fetchedFolderKey = 'trash';
    } else {
      requestBody.folder = folder;
      // fetchedFolderKey is already 'inbox'
    }

    const { data: result } = await axios.post(`${API_BASE}${endpoint}`, requestBody);
    
    if (result.success) {
      const fetchedEmails = result.emails || [];
      
      // Update the correct email list based on the fetched folder
      if (fetchedFolderKey === 'sent') {
        setSentEmails(fetchedEmails);
      } else if (fetchedFolderKey === 'trash') {
        setTrashEmails(fetchedEmails);
      } else {
        setEmails(fetchedEmails);
      }
      
      // ✅ THE FIX: Only update pagination status if the fetched folder
      // is the one currently being viewed by the user.
      if (fetchedFolderKey === activeFolder) {
        setHasMore(fetchedEmails.length === limit);
      }

      return fetchedEmails;

    } else {
      message.error(`Error fetching ${folderDisplayName}: ${result.error || 'Request failed'}`);
      // Also check here to disable the button on error for the active folder
      if (fetchedFolderKey === activeFolder) {
        setHasMore(false);
      }
      return [];
    }
  } catch (error) {
    message.error('Network error: ' + error.message);
    if (fetchedFolderKey === activeFolder) {
      setHasMore(false);
    }
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
    
    // ✅ ADDED: Append cc and bcc if they exist
    if (values.cc) formData.append('cc', values.cc);
    if (values.bcc) formData.append('bcc', values.bcc);

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
      setShowCcBcc(false); // ✅ ADDED: Hide CC/BCC fields after sending

      setTimeout(() => {
        fetchEmails('sent', 10, 0);
      }, 2000);

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
// In EmailClient.jsx, replace the menuItems array

// In EmailClient.jsx, replace the menuItems array

const menuItems = [
 {
    key: 'inbox',
    icon: <InboxOutlined />,
    label: 'Inbox',
    onClick: async () => {
      if (activeFolder === 'inbox') return; 
      // ✅ FIX: Use the onFolderChange prop
      if (onFolderChange) onFolderChange('inbox');
      setInboxOffset(0);
      await fetchEmails('INBOX', 10, 0);
      setMobileDrawerVisible(false);
    }
  },
  {
    key: 'compose',
    icon: <EditOutlined />,
    label: 'Compose',
    onClick: () => {
      // ✅ FIX: Use the onFolderChange prop
      if (onFolderChange) onFolderChange('compose');
      setMobileDrawerVisible(false);
    }
  },
 {
    key: 'sent',
    icon: <SendOutlined />,
    label: 'Sent',
    onClick: async () => {
      if (activeFolder === 'sent') return;
      // ✅ FIX: Use the onFolderChange prop
      if (onFolderChange) onFolderChange('sent');
      setSentOffset(0); // Also reset pagination
      await fetchEmails('sent', 10, 0); // Fetch first page of sent
      setMobileDrawerVisible(false);
    }
  },
  {
    key: 'trash',
    icon: <DeleteOutlined />,
    label: 'Trash',
    onClick: async () => {
      if (activeFolder === 'trash') return;
      // ✅ FIX: Use the onFolderChange prop
      if (onFolderChange) onFolderChange('trash');
      setTrashOffset(0); // Also reset pagination
      await fetchEmails('trash', 10, 0); // Fetch first page of trash
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
// In EmailClient.jsx, replace the renderEmailList function
const renderEmailList = () => {
    let currentEmails = [];
    let folderTitle = '';
    let folderIcon = null;

    switch (activeFolder) {
        case 'sent': case 'SENT':
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
            title={ <Space> {folderIcon} <span>{folderTitle}</span> <Badge count={currentEmails.length} style={{ backgroundColor: '#52c41a' }} /> </Space> }
            extra={ <Button icon={<ReloadOutlined />} onClick={handleManualRefresh} loading={loading} type="text"> {!isMobile && 'Refresh'} </Button> }
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
                                            e.stopPropagation();
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {fromOrTo}
                                            </Text>
                                            {/* ✅ REMOVED: The date is no longer displayed here */}
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
// In EmailClient.jsx, add this new function

const validateEmails = (message = 'One or more emails are invalid') => ({
  validator(_, value) {
    if (!value) {
      // If the field is optional and empty, it's valid.
      return Promise.resolve();
    }
    const emails = value.split(',').map(e => e.trim()).filter(e => e);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return Promise.reject(new Error(message));
      }
    }
    return Promise.resolve();
  },
});
// In EmailClient.jsx, replace the entire renderCompose function
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
      form={composeForm}
      name="compose-email"
      layout="vertical"
      onFinish={sendEmail}
      initialValues={composeData}
    >
      <Row gutter={16}>
          <Col span={24}>
              <Form.Item
                  label="To"
                  name="to"
                  rules={[
                      { required: true, message: 'Please input at least one recipient email!' },
                      // ✅ UPDATED: Use the custom validator for multiple emails
                      validateEmails('A recipient email is invalid.')
                  ]}
              >
                  <Input placeholder="recipient@example.com, another@example.com" size="large" />
              </Form.Item>
          </Col>
          <Col span={24} style={{ textAlign: 'right', marginBottom: 8 }}>
              <Button type="link" size="small" onClick={() => setShowCcBcc(!showCcBcc)}>
                  {showCcBcc ? 'Hide Cc/Bcc' : 'Show Cc/Bcc'}
              </Button>
          </Col>
      </Row>
      
      {showCcBcc && (
          <Row gutter={16}>
              <Col span={12}>
                  <Form.Item 
                    label="Cc" 
                    name="cc"
                    // ✅ UPDATED: Use the custom validator for multiple emails
                    rules={[validateEmails('A Cc email is invalid.')]}
                  >
                      <Input placeholder="cc@example.com" size="large" />
                  </Form.Item>
              </Col>
              <Col span={12}>
                  <Form.Item 
                    label="Bcc" 
                    name="bcc"
                    // ✅ UPDATED: Use the custom validator for multiple emails
                    rules={[validateEmails('A Bcc email is invalid.')]}
                  >
                      <Input placeholder="bcc@example.com" size="large" />
                  </Form.Item>
              </Col>
          </Row>
      )}

      <Form.Item
        label="Subject"
        name="subject"
        rules={[{ required: true, message: 'Please input email subject!' }]}
      >
        <Input placeholder="Email subject" size="large" />
      </Form.Item>

      <Form.Item
        label="Message"
        name="body"
      >
        <TextArea 
          placeholder="Write your email here..."
          rows={isMobile ? 8 : isTablet ? 10 : 12}
          size="large"
        />
      </Form.Item>

      <Form.Item label="Attachments">
        <Upload
          beforeUpload={(file) => { setAttachments((prev) => [...prev, file]); return false; }}
          fileList={attachments}
          onRemove={(file) => { setAttachments((prev) => prev.filter((f) => f.uid !== file.uid)); }}
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
// In EmailClient.jsx, replace the renderEmailDetail function
// In EmailClient.jsx, replace the entire renderEmailDetail function

const renderEmailDetail = () => {
  if (!selectedEmail) return null;

  const getReplyAllRecipients = (email) => {
    const currentUserEmail = emailCredentials.email.toLowerCase();
    const from = extractEmailOnly(email.from).toLowerCase();
    const toList = (email.to || '').split(',').map(e => extractEmailOnly(e).toLowerCase());
    const ccList = (email.cc || '').split(',').map(e => extractEmailOnly(e).toLowerCase());
    const allRecipients = new Set([from, ...toList, ...ccList]);
    allRecipients.delete(currentUserEmail);
    allRecipients.delete('');
    return Array.from(allRecipients);
  };

  // Generic function to handle sending replies/forwards with attachments
  const handleSendWithAttachments = async (values, attachments, type) => {
    const formData = new FormData();
    formData.append('email', emailCredentials.email);
    formData.append('password', emailCredentials.password);
    formData.append('to', values.to);
    formData.append('subject', values.subject);
    
    let body = values.body || '';

    // Append original message context
    if (type === 'reply' || type === 'replyAll') {
      body += `<br><br>--- Original Message ---<br>${selectedEmail.body}`;
    } else if (type === 'forward') {
      body += `<br><br>--- Forwarded Message ---<br>From: ${selectedEmail.from}<br>To: ${selectedEmail.to}<br>Date: ${selectedEmail.date}<br><br>${selectedEmail.body}`;
    }
    formData.append('body', body);
    
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        message.success('Email sent successfully!');
        // Reset and close the specific form
        if (type === 'reply') { setShowReply(false); setReplyAttachments([]); }
        if (type === 'replyAll') { setShowReplyAll(false); setReplyAllAttachments([]); }
        if (type === 'forward') { setShowForward(false); setForwardAttachments([]); }
        // Refresh sent items
        setTimeout(() => fetchEmails('sent', 10, 0), 1000);
      } else {
        message.error('Failed to send email: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      message.error('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
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
      {selectedEmail.cc && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Cc: </Text>
          <Text>{selectedEmail.cc}</Text>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Date: </Text>
        <Text>{selectedEmail.date}</Text>
      </div>
      <Divider />
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="default" onClick={() => { setShowReply(true); setShowReplyAll(false); setShowForward(false); }}>Reply</Button>
          {selectedEmail.cc && (
            <Button type="default" onClick={() => { setShowReplyAll(true); setShowReply(false); setShowForward(false); }}>Reply All</Button>
          )}
          <Button type="default" onClick={() => { setShowForward(true); setShowReply(false); setShowReplyAll(false); }}>Forward</Button>
        </Space>
      </div>
      <div style={{ maxHeight: '40vh', overflow: 'auto', lineHeight: '1.6', marginBottom: 16, padding: 16, backgroundColor: '#f9f9f9', border: '1px solid #f0f0f0', borderRadius: 4 }}
        dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
      />
      
      {showReply && (
        <Card title="Reply" extra={<Button type="text" icon={<CloseOutlined />} onClick={() => { setShowReply(false); setReplyAttachments([]); }} />} style={{ marginBottom: 16 }} >
          <Form onFinish={(values) => handleSendWithAttachments(values, replyAttachments, 'reply')}>
            <Form.Item label="To"><Input disabled value={extractEmailOnly(selectedEmail.from)} /></Form.Item>
            <Form.Item name="to" initialValue={extractEmailOnly(selectedEmail.from)} hidden><Input /></Form.Item>
            <Form.Item label="Subject" name="subject" initialValue={selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`}><Input /></Form.Item>
            <Form.Item name="body"><TextArea rows={4} placeholder="Your reply..." /></Form.Item>
            <Form.Item>
              <Upload beforeUpload={(file) => { setReplyAttachments(prev => [...prev, file]); return false; }} fileList={replyAttachments} onRemove={(file) => setReplyAttachments(prev => prev.filter(f => f.uid !== file.uid))} multiple>
                <Button icon={<UploadOutlined />}>Attach Files</Button>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Send Reply</Button>
          </Form>
        </Card>
      )}

      {showReplyAll && (
        <Card title="Reply to All" extra={<Button type="text" icon={<CloseOutlined />} onClick={() => { setShowReplyAll(false); setReplyAllAttachments([]); }} />} style={{ marginBottom: 16 }}>
          <Form onFinish={(values) => handleSendWithAttachments(values, replyAllAttachments, 'replyAll')}>
             <Form.Item label="To" name="to" initialValue={getReplyAllRecipients(selectedEmail).join(', ')}>
                <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} />
             </Form.Item>
            <Form.Item label="Subject" name="subject" initialValue={selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`}><Input /></Form.Item>
            <Form.Item name="body"><TextArea rows={4} placeholder="Your reply..." /></Form.Item>
            <Form.Item>
              <Upload beforeUpload={(file) => { setReplyAllAttachments(prev => [...prev, file]); return false; }} fileList={replyAllAttachments} onRemove={(file) => setReplyAllAttachments(prev => prev.filter(f => f.uid !== file.uid))} multiple>
                <Button icon={<UploadOutlined />}>Attach Files</Button>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Send Reply to All</Button>
          </Form>
        </Card>
      )}
      
      {showForward && (
        <Card title="Forward" extra={<Button type="text" icon={<CloseOutlined />} onClick={() => { setShowForward(false); setForwardAttachments([]); }} />} style={{ marginBottom: 16 }}>
          <Form onFinish={(values) => handleSendWithAttachments(values, forwardAttachments, 'forward')}>
            <Form.Item name="to" rules={[{ required: true, message: 'Please enter recipient email' }, validateEmails()]}><Input placeholder="recipient@example.com" /></Form.Item>
            <Form.Item label="Subject" name="subject" initialValue={selectedEmail.subject.startsWith('Fwd:') ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`}><Input /></Form.Item>
            <Form.Item name="body"><TextArea rows={4} /></Form.Item>
            <Form.Item>
              <Upload beforeUpload={(file) => { setForwardAttachments(prev => [...prev, file]); return false; }} fileList={forwardAttachments} onRemove={(file) => setForwardAttachments(prev => prev.filter(f => f.uid !== file.uid))} multiple>
                <Button icon={<UploadOutlined />}>Attach Files</Button>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Send Forward</Button>
          </Form>
        </Card>
      )}
    </div>
  );
};

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
          // ✅ FIXED: Use the calculated prevOffset here
          fetchEmails('trash', 10, prevOffset);
        }
      }}
      disabled={
        (activeFolder === 'inbox' && inboxOffset === 0) ||
        (activeFolder === 'sent' && sentOffset === 0) ||
        (activeFolder === 'trash' && trashOffset === 0) ||
        loading
      }
      title="Previous"
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
      title="Next"
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
    // ✅ ADD THESE LINES TO RESET ALL STATES
    setShowReply(false);
    setShowForward(false);
    setShowReplyAll(false);
    setReplyAttachments([]);    // <-- ADD THIS
    setReplyAllAttachments([]); // <-- ADD THIS
    setForwardAttachments([]);   // <-- ADD THIS
  }}
  footer={null}
      // ... rest of the modal props
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
