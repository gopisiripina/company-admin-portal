import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col, 
  Table, 
  Switch, 
  Space, 
  Typography, 
  Divider, 
  Modal,
  Tag,
  message,
  Statistic,
  
  Checkbox,
  Tooltip,
  Alert,
  Badge,
  Avatar,
  Timeline,
  Descriptions,
  List,
  Popconfirm
} from 'antd';
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  TeamOutlined,
  MailOutlined,
  UploadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { supabase, supabaseAdmin } from '../../supabase/config';
import './AdminManagement.css';
import ErrorPage from '../../error/ErrorPage';
import CryptoJS from 'crypto-js';
import { Upload, message as antMessage } from 'antd';
const { Title, Text } = Typography;
const { Search } = Input;


// Add this function before handleSubmit
 
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const sendWelcomeEmail = async (employeeData) => {
  try {
    const response = await fetch(`${baseUrl}send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientEmail: employeeData.email,
        subject: "Welcome - Your Account Credentials",
        templateData: {
          company_name: "My Access",
          to_name: employeeData.name,
          user_role: employeeData.role,
          user_email: employeeData.email,
          user_password: employeeData.password,
          website_link: "http://cap.myaccessio.com/",
          from_name: "Admin Team"
        }
      })
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true, message: 'Email sent successfully' };
    } else {
      return { success: false, message: result.message || 'Failed to send email' };
    }
  } catch (error) {
    console.error('Email API Error:', error);
    return { success: false, message: 'Network error while sending email' };
  }
}

// Mobile Admin Card Component
const MobileAdminCard = React.memo(({ admin, onEdit, onDelete}) => (
  <Card 
    size="small" 
    className="mobile-admin-card"
    actions={[
      <Button 
        key="edit"
        type="primary" 
        icon={<EditOutlined />} 
        size="small"
        onClick={() => onEdit(admin)}
        className="brand-primary"
      >
        Edit
      </Button>,
      <Popconfirm
        key="delete"
        title="Delete Admin"
        description="Are you sure you want to delete this admin?"
        onConfirm={() => onDelete(admin.id)}
        okText="Yes"
        cancelText="No"
      >
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          size="small"
        >
          Delete
        </Button>
      </Popconfirm>
    ]}
  >
    <div className="mobile-admin-info">
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <Avatar 
  style={{ 
    backgroundColor: '#1F4842',
    flexShrink: 0
  }}
  size="large"
  src={admin.profileimage}  // Changed from admin.profileImage to admin.profileimage
  icon={!admin.profileimage && <UserOutlined />}  // Changed condition too
>
  {!admin.profileimage && admin.name.charAt(0).toUpperCase()} 
</Avatar>
        <div style={{ 
          flex: 1,
          textAlign: 'left'
        }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            marginBottom: '4px'
          }}>
            {admin.name}
          </div>
          <Text type="secondary" style={{ 
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            <MailOutlined /> {admin.email}
          </Text>
          {admin.adminId && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {admin.adminId}
            </Text>
          )}
        </div>
      </div>
      <div style={{ 
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
  <div style={{ 
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  justifyContent: 'flex-start'
}}>
  <Tag color="blue" size="small">{admin.role}</Tag>
  {admin.adminId && (
    <Tag color="geekblue" size="small">{admin.adminId}</Tag>
  )}
  {admin.createdat && (
    <Tag color="purple" size="small">
      {new Date(admin.createdat).toLocaleDateString()} 
    </Tag>
  )}
  <Tag 
    color={admin.isactive ? 'green' : 'red'} 
    size="small"
  >
    {admin.isactive ? 'Active' : 'Inactive'}
  </Tag>
</div>
</div>
    </div>
  </Card>
));

// Admin Form Modal Component
const AdminFormModal = React.memo(({ isOpen, onClose, editingAdmin, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  useEffect(() => {
    if (isOpen) {
      if (editingAdmin) {
        setTimeout(() => {
          form.setFieldsValue({
            name: editingAdmin.name,
            email: editingAdmin.email,
            role: editingAdmin.role
          });
          setProfileImage(editingAdmin.profileimage || null);
        }, 0);
      } else {
        form.resetFields();
        setProfileImage(null);
      }
    }
  }, [editingAdmin, form, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      setProfileImage(null);
    }
  }, [isOpen, form]);

  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }, []);


  const generateAdminId = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('employee_id')
        .eq('role', 'admin')
        .like('employee_id', 'MYADIR%')
        .order('employee_id', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastId = data[0].employee_id;
        const numberPart = parseInt(lastId.replace('MYADIR', ''));
        nextNumber = numberPart + 1;
      }

      return `MYADIR${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating admin ID:', error);
      return `MYADIR001`;
    }
  }, []);

  // Image upload handler
  const handleImageUpload = useCallback((file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target.result);
    };
    reader.readAsDataURL(file);
    
    return false; // Prevent default upload
  }, []);

  const handleSubmit = useCallback(async (values) => {
  setLoading(true);
  
  try {
    if (editingAdmin) {
      // Update existing admin
      const updateData = {
        name: values.name,
        email: values.email,
        role: values.role || 'admin',
        employee_id: values.adminId,
        isactive: false,
        profileimage: profileImage,
        updatedat: new Date().toISOString()
      };
      
      // Use regular supabase instead of supabaseAdmin
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', editingAdmin.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      message.success('Admin updated successfully');
    } else {
      // Create new admin
      const password = generatePassword();
const ENCRYPTION_KEY = 'My@cCe55!2021';
const encryptedPassword = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
const generatedAdminId = await generateAdminId();

const adminData = {
  name: values.name,
  email: values.email,
  employee_id: generatedAdminId,
  role: 'admin',
  isactive: false,
  isfirstlogin: true,
  profileimage: profileImage,
  password: encryptedPassword, // ← Use encrypted password
  // created_at: new Date().toISOString(),
  // updatedat: new Date().toISOString()
};
      
      // Use regular supabase instead of supabaseAdmin
      const { data, error } = await supabase
        .from('users')
        .insert([adminData])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      message.success('Admin created successfully!');
      
      // Send welcome email
      try {
        const emailResult = await sendWelcomeEmail({
          name: values.name,
          email: values.email,
          password: password,
          role: 'admin'
        });

        if (emailResult.success) {
          message.success('Welcome email sent to admin!');
        } else {
          message.warning('Admin created but email could not be sent. Please share credentials manually.');
          console.error('Email send failed:', emailResult.message);
        }
      } catch (emailError) {
        console.error('Email send failed:', emailError);
        message.warning('Admin created but email could not be sent.');
      }
    }

    form.resetFields();
    setProfileImage(null);
    onSuccess();
    onClose();
  } catch (error) {
    console.error('Error saving admin:', error);
    
    if (error.code === '23505') {
      message.error('An admin with this email already exists.');
    } else {
      message.error(`Error saving admin: ${error.message || 'Unknown error'}`);
    }
  } finally {
    setLoading(false);
  }
}, [editingAdmin, generatePassword, onSuccess, onClose, form, profileImage,generateAdminId]);

  return (
     <Modal
  title={editingAdmin ? 'Edit Admin' : 'Add New Admin'}
  open={isOpen}
  onCancel={onClose}
  footer={null}
  destroyOnHidden  // Changed from destroyOnHidden to destroyOnClose
  className="admin-form-modal"
>
  <Form
    form={form}  // This line should already be present - ensure it's there
    layout="vertical"
    onFinish={handleSubmit}
    initialValues={{ role: 'admin' }}
    preserve={false}  // Add this to prevent form state persistence
  >
        {/* Profile Image Upload */}
        <Form.Item
          label="Profile Image"
          extra="Upload JPG/PNG files, max 2MB"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar 
              size={64} 
              src={profileImage}
              style={{ backgroundColor: '#1F4842' }}
              icon={!profileImage && <UserOutlined />}
            >
              {!profileImage && form.getFieldValue('name')?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Upload
              showUploadList={false}
              beforeUpload={handleImageUpload}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>
                {profileImage ? 'Change Image' : 'Upload Image'}
              </Button>
            </Upload>
            {profileImage && (
              <Button 
                type="link" 
                danger 
                onClick={() => setProfileImage(null)}
                size="small"
              >
                Remove
              </Button>
            )}
          </div>
        </Form.Item>

        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter admin name' }]}
        >
          <Input placeholder="Enter admin name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter valid email' }
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
  name="employeeId"
  label="Admin ID"
>
  <Input 
    placeholder="Auto-generated on save"
    disabled
    style={{ 
      backgroundColor: '#f5f5f5',
      color: '#666'
    }}
  />
</Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="brand-primary"
            >
              {editingAdmin ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
});

// Main Admin Management Component
const AdminManagement = ({ userRole }) => {
  const [admins, setAdmins] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Use useMemo for calculations
  const { totalAdmins, activeAdmins, inactiveAdmins } = useMemo(() => {
    const total = allAdmins.length;
    const active = allAdmins.filter(admin => admin.isactive === true).length;
    const inactive = total - active;
    
    return { totalAdmins: total, activeAdmins: active, inactiveAdmins: inactive };
  }, [allAdmins]);

  // Check if mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
  const checkMobile = () => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    
    // Prevent horizontal scroll on mobile
    if (mobile) {
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowX = 'auto';
      document.documentElement.style.overflowX = 'auto';
    }
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  
  return () => {
    window.removeEventListener('resize', checkMobile);
    // Cleanup overflow styles
    document.body.style.overflowX = 'auto';
    document.documentElement.style.overflowX = 'auto';
  };
}, []);
useEffect(() => {
  // Prevent horizontal scroll on mobile
  if (isMobile) {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }
}, [isMobile]);
  // Fetch all admins
  const fetchAllAdmins = useCallback(async () => {
  try {
    setLoading(true);
   
    
    // Use only regular supabase client
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        employee_id,
        isactive,
        profileimage,
        created_at,
        updated_at
      `)
      .eq('role', 'admin')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    setAllAdmins(data || []);
    return data || [];
  } catch (error) {
    console.error('Error fetching admins:', error);
    message.error(`Error loading admins: ${error.message}`);
    return [];
  } finally {
    setLoading(false);
  }
}, []);
  // Apply filters and pagination
  const applyFiltersAndPagination = useCallback((adminList, search = '', page = 1, pageSize = 10, status = 'all') => {
  let filteredAdmins = [...adminList];

  if (status !== 'all') {
  filteredAdmins = filteredAdmins.filter(admin => {
    if (status === 'active') return admin.isactive === true;
    if (status === 'inactive') return admin.isactive === false;
    return true;
  });
}
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredAdmins = filteredAdmins.filter(admin =>
      admin.name.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower) ||
      (admin.employee_id && admin.employee_id.toLowerCase().includes(searchLower))  // Changed from adminId to employeeid
    );
  }
  
  const total = filteredAdmins.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + pageSize);
  
  setAdmins(paginatedAdmins);
  setPagination({
    current: page,
    pageSize: pageSize,
    total: total
  });
  
  return paginatedAdmins;
}, [statusFilter]);

  // Fetch admins with pagination
 const fetchAdmins = useCallback(async (page = 1, pageSize = 10, search = '') => {
  try {
   
    
    let adminList = allAdmins;
    if (adminList.length === 0) {
      adminList = await fetchAllAdmins();
    }
    
    applyFiltersAndPagination(adminList, search, page, pageSize, statusFilter);
    
  } catch (error) {
    console.error('Error in fetchAdmins:', error);
    message.error(`Error loading admins: ${error.message}`);
  }
}, [allAdmins, fetchAllAdmins, applyFiltersAndPagination]);
useEffect(() => {
 
  fetchAdmins();
}, []);
useEffect(() => {
  const loadInitialData = async () => {
    try {
     
      setLoading(true);
      
      // Direct fetch without going through fetchAdmins
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });
      
     
      
      if (error) {
        console.error('Direct fetch error:', error);
        message.error('Failed to load admins');
        return;
      }
      
      const adminData = data || [];
     
      
      setAllAdmins(adminData);
      setAdmins(adminData.slice(0, 10)); // Show first 10
      setPagination({
        current: 1,
        pageSize: 10,
        total: adminData.length
      });
      
    } catch (error) {
      console.error('Error in loadInitialData:', error);
      message.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };
  
  loadInitialData();
}, []);


  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const adminList = await fetchAllAdmins();
      applyFiltersAndPagination(adminList, searchQuery, 1, pagination.pageSize,statusFilter);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllAdmins, applyFiltersAndPagination, searchQuery, pagination.pageSize]);

  useEffect(() => {
  const subscription = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'users',
        filter: 'role=eq.admin'
      },
      (payload) => {
       
        
        if (payload.eventType === 'UPDATE') {
          // Update the specific admin in state
          setAllAdmins(prev => 
            prev.map(admin => 
              admin.id === payload.new.id ? payload.new : admin
            )
          );
          
          setAdmins(prev => 
            prev.map(admin => 
              admin.id === payload.new.id ? payload.new : admin
            )
          );
        } else if (payload.eventType === 'INSERT') {
          // Add new admin
          setAllAdmins(prev => [payload.new, ...prev]);
          refreshData(); // Refresh to maintain pagination
        } else if (payload.eventType === 'DELETE') {
          // Remove deleted admin
          setAllAdmins(prev => prev.filter(admin => admin.id !== payload.old.id));
          setAdmins(prev => prev.filter(admin => admin.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [refreshData]);
  // Event handlers
  // const handleTableChange = useCallback((paginationInfo) => {
  //   applyFiltersAndPagination(allAdmins, searchQuery, paginationInfo.current, paginationInfo.pageSize,statusFilter);
  // }, [allAdmins, searchQuery, applyFiltersAndPagination]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    applyFiltersAndPagination(allAdmins, value, 1, pagination.pageSize,statusFilter);
  }, [allAdmins, pagination.pageSize, applyFiltersAndPagination]);

  const handleEdit = useCallback((admin) => {
    setEditingAdmin(admin);
    setShowFormModal(true);
  }, []);

  const handleDelete = useCallback(async (adminId) => {
  try {
    setLoading(true);
    
    // Use regular supabase instead of supabaseAdmin
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', adminId)
      .eq('role', 'admin');

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    
    message.success('Admin deleted successfully');
    await refreshData();
  } catch (error) {
    console.error('Error deleting admin:', error);
    message.error('Error deleting admin: ' + (error.message || 'Unknown error'));
  } finally {
    setLoading(false);
  }
}, [refreshData]);

  const handleFormClose = useCallback(() => {
    setShowFormModal(false);
    setEditingAdmin(null);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  // Table columns with memoization
  const columns = useMemo(() => [
  {
    title: 'Admin',
    dataIndex: 'name',
    key: 'name',
    fixed: isMobile ? false : 'left', // Remove fixed positioning on mobile
    width: isMobile ? 180 : 250,
    render: (text, record) => (
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        gap: isMobile ? '8px' : '12px',
        width: '100%',
        overflow: 'hidden' // Prevent overflow
      }}>
        <Avatar 
          style={{ 
            backgroundColor: '#1F4842',
            flexShrink: 0
          }}
          size={isMobile ? "small" : "large"}
          src={record.profileimage}
          icon={!record.profileimage && <UserOutlined />}
        >
          {!record.profileimage && text.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ 
          flex: 1,
          minWidth: 0, // Allow shrinking
          overflow: 'hidden'
        }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: isMobile ? '11px' : '14px',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {text}
          </div>
          <div style={{ 
            fontSize: isMobile ? '9px' : '12px',
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <MailOutlined style={{ marginRight: '4px' }} /> 
            {record.email}
          </div>
          {isMobile && (
            <div style={{ 
              marginTop: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2px'
            }}>
              <Tag color="blue" size="small" style={{ fontSize: '10px' }}>
                {record.role}
              </Tag>
              {record.employee_id && (
                <Tag color="geekblue" size="small" style={{ fontSize: '10px' }}>
                  {record.employee_id}
                </Tag>
              )}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    title: 'Admin ID',
    dataIndex: 'employee_id',
    key: 'adminId',
    width: isMobile ? 80 : 120,
    render: (adminId) => (
      <Tag color="geekblue" style={{ fontSize: isMobile ? '10px' : '12px' }}>
        {adminId || 'N/A'}
      </Tag>
    ),
    responsive: ['md'],
  },
  {
  title: 'Status',
  dataIndex: 'isactive',
  key: 'isActive',
  width: isMobile ? 70 : 100,
  render: (isActive) => (
    <Tag 
      color={isActive ? 'green' : 'red'} 
      style={{ fontSize: isMobile ? '10px' : '12px' }}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Tag>
  ),
  responsive: ['md'],
},
  {
    title: 'Created',
    dataIndex: 'created_at',
    key: 'createdAt',
    width: isMobile ? 80 : 120,
    render: (date) => (
      <span style={{ fontSize: isMobile ? '10px' : '12px' }}>
        {date ? new Date(date).toLocaleDateString() : 'Unknown'}
      </span>
    ),
    responsive: ['xl'],
  },
  {
    title: 'Actions',
    key: 'actions',
    fixed: isMobile ? false : 'right', // Remove fixed positioning on mobile
    width: isMobile ? 80 : 140,
    render: (_, record) => (
      <div className={isMobile ? 'mobile-actions' : 'actions-container'}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => handleEdit(record)}
          className="brand-primary"
          style={{ minWidth: isMobile ? '28px' : '32px' }}
        />
        <Popconfirm
          title="Delete Admin"
          description="Are you sure you want to delete this admin?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ minWidth: isMobile ? '28px' : '32px' }}
          />
        </Popconfirm>
      </div>
    ),
  },
], [isMobile, handleEdit, handleDelete]);


  // Permission check
  if (userRole !== 'superadmin') {
    return <ErrorPage errorType="403" />;
  }


  return (
  <div className="admin-management-wrapper">
    <div className="admin-management-content">
      <div className={`admin-management-container ${isMobile ? 'mobile-table' : ''}`}>
        {/* Header */}
        <div className="animated-card" style={{ marginBottom: '24px' }}>
          <div 
            className={`${isMobile ? 'mobile-header' : ''}`} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center', 
              marginBottom: '16px',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '12px' : '0'
            }}
          >
            <div style={{ width: isMobile ? '100%' : 'auto' }}>
              <Title level={2} className={isMobile ? 'responsive-title' : ''} style={{ margin: 0 }}>
                Admin Management
              </Title>
              <Text type="secondary" className={isMobile ? 'responsive-subtitle' : ''}>
                Manage admin users and their access levels
              </Text>
            </div>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setShowFormModal(true)}
              className="brand-primary"
              size={isMobile ? "middle" : "large"}
              style={{ width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '200px' : 'none' }}
            >
              Add Admin
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[8, 8]} style={{ marginBottom: '24px' }} className={isMobile ? 'mobile-stats' : ''}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="animated-card-delayed stats-card">
              <Statistic
                title="Total Admins"
                value={totalAdmins}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1F4842' }}
                className={isMobile ? 'responsive-stat-value' : ''}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="animated-card-delayed-2 stats-card">
              <Statistic
                title="Active Admins"
                value={activeAdmins}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#10b981' }}
                className={isMobile ? 'responsive-stat-value' : ''}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card className="animated-card-delayed-3 stats-card">
              <Statistic
                title="Inactive Admins"
                value={inactiveAdmins}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#ef4444' }}
                className={isMobile ? 'responsive-stat-value' : ''}
              />
            </Card>
          </Col>
        </Row>

        {/* Search Bar */}
        {/* Search and Filters */}
<Card style={{ marginBottom: '24px' }} className={`animated-card-delayed ${isMobile ? 'mobile-search' : ''}`}>
  <Row gutter={[16, 16]} align="middle">
    <Col xs={24} sm={24} md={14} lg={16}>
      <Search
        placeholder="Search admins by name, email or admin ID..."
        allowClear
        enterButton={
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            className="brand-primary"
            style={{ backgroundColor: '#1F4842', borderColor: '#1F4842' }}
          >
            {isMobile ? '' : 'Search'}
          </Button>
        }
        size={isMobile ? "middle" : "large"}
        onSearch={handleSearch}
      />
    </Col>
    <Col xs={24} sm={24} md={10} lg={8}>
      <Space size="middle" style={{ width: '100%', justifyContent: isMobile ? 'center' : 'flex-end' }}>
        <Select
          placeholder="Filter by Status"
          value={statusFilter}
          onChange={(value) => {
  setStatusFilter(value);
  applyFiltersAndPagination(allAdmins, searchQuery, 1, pagination.pageSize, value);
}}
          style={{ width: 140 }}
          size={isMobile ? "middle" : "large"}
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="inactive">Inactive</Select.Option>
        </Select>
        <Button 
          onClick={() => {
            setStatusFilter('all');
            setSearchQuery('');
            applyFiltersAndPagination(allAdmins, '', 1, pagination.pageSize,'all');
          }}
          size={isMobile ? "middle" : "large"}
        >
          Clear
        </Button>
      </Space>
    </Col>
  </Row>
</Card>

        {/* Admin List - Mobile Cards or Table */}
        {isMobile ? (
          <Card className="animated-card-delayed-2" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4} style={{ margin: 0 }}>Admin List</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {admins.length} of {pagination.total} admins
              </Text>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>Loading admins...</Text>
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'hidden' }}>
                {admins.map((admin) => (
                  <MobileAdminCard
                    key={admin.id}
                    admin={admin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={loading}
                  />
                ))}
              </div>
            )}
            
            {/* Mobile Pagination */}
<div style={{ 
  textAlign: 'center', 
  marginTop: '16px', 
  paddingTop: '16px', 
  borderTop: '1px solid #f0f0f0' 
}}>
  <Space>
    <Button 
      size="small"
      disabled={pagination.current === 1}
      onClick={() => applyFiltersAndPagination(allAdmins, searchQuery, pagination.current - 1, pagination.pageSize, statusFilter)}
      style={{
        borderColor: '#0D7139',
        color: '#0D7139'
      }}
    >
      Previous
    </Button>
    <Text style={{ 
      fontSize: '12px',
      padding: '4px 12px',
      backgroundColor: '#f6ffed',
      border: '1px solid #0D7139',
      borderRadius: '6px',
      color: '#0D7139',
      fontWeight: 600
    }}>
      {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
    </Text>
    <Button 
      size="small"
      disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
      onClick={() => applyFiltersAndPagination(allAdmins, searchQuery, pagination.current + 1, pagination.pageSize, statusFilter)}
      style={{
        borderColor: '#0D7139',
        color: '#0D7139'
      }}
    >
      Next
    </Button>
  </Space>
  <div style={{ marginTop: '8px' }}>
    <Text type="secondary" style={{ fontSize: '11px' }}>
      Showing {((pagination.current - 1) * pagination.pageSize) + 1}-{Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total} admins
    </Text>
  </div>
</div>
          </Card>
        ) : (
          /* Desktop Table */
          <Card className="animated-card-delayed-2">
            <Table
              columns={columns}
              dataSource={admins}
              rowKey="id"
              loading={loading}
              pagination={{
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) =>
    `${range[0]}-${range[1]} of ${total} admins`,
  pageSizeOptions: ['5', '10', '20', '50'],
  onChange: (page, size) => {
    applyFiltersAndPagination(allAdmins, searchQuery, page, size, statusFilter);
  },
  onShowSizeChange: (current, size) => {
    applyFiltersAndPagination(allAdmins, searchQuery, 1, size, statusFilter);
  },
  itemRender: (current, type, originalElement) => {
    if (type === 'page') {
      return (
        <a style={{
          color: current === pagination.current ? '#0D7139' : '#666',
          backgroundColor: current === pagination.current ? '#f6ffed' : 'white',
          border: `1px solid ${current === pagination.current ? '#0D7139' : '#d9d9d9'}`,
          borderRadius: '6px',
          fontWeight: current === pagination.current ? 600 : 400,
          padding: '0px 8px',
          textDecoration: 'none'
        }}>
          {current}
        </a>
      );
    }
    return originalElement;
  }
}}
              onChange={(paginationInfo) => {
  applyFiltersAndPagination(allAdmins, searchQuery, paginationInfo.current, paginationInfo.pageSize, statusFilter);
}}
              scroll={{ x: 'max-content' }} // Changed from fixed width to max-content
              size="middle"
            />
          </Card>
        )}

        {/* Form Modal */}
        <AdminFormModal
          isOpen={showFormModal}
          onClose={handleFormClose}
          editingAdmin={editingAdmin}
          onSuccess={handleFormSuccess}
        />
      </div>
    </div>
  </div>
  );
};

export default AdminManagement;