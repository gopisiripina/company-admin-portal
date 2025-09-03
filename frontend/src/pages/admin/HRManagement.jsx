import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Card, Statistic, Row, Col, message, Avatar, Tag, Typography, Switch,Select } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, SearchOutlined, TeamOutlined, MailOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { supabase, supabaseAdmin } from '../../supabase/config';
import './Employee Management.css';
import CryptoJS from 'crypto-js';
import { Upload, message as antMessage } from 'antd';
const { Title, Text } = Typography;
const { Search } = Input;
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
          website_link: "http://hrm.myaccess.cloud/",
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
// Mobile HR Card Component
const MobileHRCard = React.memo(({ hr, onEdit, onDelete }) => (
  <Card 
    size="small" 
    className="mobile-employee-card"
    actions={[
      <Button 
        key="edit"
        type="primary" 
        icon={<EditOutlined />} 
        size="small"
        onClick={() => onEdit(hr)}
        className="brand-primary"
      >
        Edit
      </Button>,
      <Popconfirm
        key="delete"
        title="Delete HR"
        description="Are you sure you want to delete this HR?"
        onConfirm={() => onDelete(hr.id)}
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
    <div className="mobile-employee-info">
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
          src={hr.profileimage}
          icon={!hr.profileimage && <UserOutlined />}
        >
          {!hr.profileimage && hr.name.charAt(0).toUpperCase()}
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
            {hr.name}
          </div>
          <Text type="secondary" style={{ 
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            <MailOutlined /> {hr.email}
          </Text>
          {hr.mobile && (
            <Text type="secondary" style={{ 
              fontSize: '12px',
              display: 'block',
              marginBottom: '4px'
            }}>
              📱 {hr.mobile}
            </Text>
          )}
          {hr.employee_id && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {hr.employee_id}
            </Text>
          )}
          {hr.employee_id && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {hr.employee_id}
            </Text>
          )}
        </div>
      </div>
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        justifyContent: 'flex-start'
      }}>
        <Tag color="orange" size="small">{hr.role}</Tag>
          {hr.employee_id && (
            <Tag color="geekblue" size="small">{hr.employee_id}</Tag>
          )}
          {hr.created_at && (
            <Tag color="purple" size="small">
              {new Date(hr.created_at).toLocaleDateString()}
            </Tag>
          )}
          <Tag 
            color={hr.isactive ? 'green' : 'red'} 
            size="small"
          >
            {hr.isactive ? 'Active' : 'Inactive'}
          </Tag>
        </div>
    </div>
  </Card>
));

// HR Form Modal Component
const HRFormModal = React.memo(({ isOpen, onClose, editingHR, onSuccess,generateHRId  }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  

  useEffect(() => {
    if (isOpen) {
      if (editingHR) {
        setTimeout(() => {
          form.setFieldsValue({
            name: editingHR.name,
            email: editingHR.email,
             mobile: editingHR.mobile,
            role: editingHR.role,
            isactive: editingHR.isactive !== undefined ? editingHR.isactive : false
          });
          setProfileImage(editingHR.profileimage || null);
        }, 0);
      } else {
        form.resetFields();
        setProfileImage(null);
      }
    }
  }, [editingHR, form, isOpen]);

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
    
    return false;
  }, []);

  const handleSubmit = useCallback(async (values) => {
    setLoading(true);
    
    try {
      if (editingHR) {
        const updateData = {
          name: values.name,
          email: values.email,
           mobile: values.mobile,
          role: values.role || 'hr',
          employee_id: values.employeeId,
          isactive: values.isActive !== undefined ? values.isActive : false,
          profileimage: profileImage,
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', editingHR.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        
        message.success('HR updated successfully');
      } else {
        const password = generatePassword();
        const generatedHRId = await generateHRId();
const ENCRYPTION_KEY = 'My@cCe55!2021'; // Same key as in authService.jsx
const encryptedPassword = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();

const hrData = {
  name: values.name,
  email: values.email,
  mobile: values.mobile,
  employee_id: generatedHRId,
  role: 'hr',
  isactive: values.isActive !== undefined ? values.isActive : false,
  profileimage: profileImage,
  password: encryptedPassword, // ← Use encrypted password
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
        
        const { data, error } = await supabaseAdmin
          .from('users')
          .insert([hrData])
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        
        message.success('HR created successfully!');
        
        try {
  const emailResult = await sendWelcomeEmail({
    name: values.name,
    email: values.email,
    password: password,
    role: 'hr'
  });

  if (emailResult.success) {
    message.success('Welcome email sent to HR!');
  } else {
    message.warning('HR created but email could not be sent. Please share credentials manually.');
  }
} catch (emailError) {
  console.error('Email send failed:', emailError);
  message.warning('HR created but email could not be sent.');
}
      }

      form.resetFields();
      setProfileImage(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving HR:', error);
      
      if (error.code === '23505') {
        message.error('An HR with this email already exists.');
      } else {
        message.error(`Error saving HR: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [editingHR, generatePassword, onSuccess, onClose, form,generateHRId, profileImage]);

  return (
   <Modal
  title={editingHR ? 'Edit HR' : 'Add New HR'}
  open={isOpen}
  onCancel={onClose}
  footer={null}
  destroyOnHidden  // ✅ Use this instead
  className="employee-form-modal"
>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'hr', isActive: false }}
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
          rules={[{ required: true, message: 'Please enter HR name' }]}
        >
          <Input placeholder="Enter HR name" />
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
          name="mobile"
          label="Phone Number"
          rules={[
            { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number' }
          ]}
        >
          <Input placeholder="Enter phone number" maxLength={10} />
        </Form.Item>

        <Form.Item
  name="employeeId"
  label="HR ID"
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
              {editingHR ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
});

// Main HR Management Component
const HRManagement = ({ userRole }) => {
  const [hrs, setHRs] = useState([]);
  const [allHRs, setAllHRs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingHR, setEditingHR] = useState(null);
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  

const generateHRId = useCallback(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('employee_id')
      .eq('role', 'hr')
      .like('employee_id', 'MYAHR%')
      .order('employee_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastId = data[0].employee_id;
      const numberPart = parseInt(lastId.replace('MYAHR', ''));
      nextNumber = numberPart + 1;
    }

    return `MYAHR${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating HR ID:', error);
    return `MYAHR001`;
  }
}, []);

  // Use useMemo for calculations
  const { totalHRs, activeHRs, inactiveHRs } = useMemo(() => {
    const total = allHRs.length;
    const active = allHRs.filter(hr => hr.isactive === true).length;
    const inactive = total - active;
    
    return { totalHRs: total, activeHRs: active, inactiveHRs: inactive };
  }, [allHRs]);

  // Check if mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  

  // Fetch all HRs
  const fetchAllHRs = useCallback(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        mobile,
        role,
        employee_id,
        isactive,
        profileimage,
        created_at,
        updated_at
      `)
      .eq('role', 'hr')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }
    
    setAllHRs(data || []);
    setInitialFetchComplete(true); // Add this line
    return data || [];
  } catch (error) {
    console.error('Error fetching HRs:', error);
    message.error(`Error loading HRs: ${error.message}`);
    setInitialFetchComplete(true); // Add this line even on error
    return [];
  }
}, []);

const applyFiltersAndPagination = useCallback((hrList, search = '', page = 1, pageSize = 10, status = 'all') => {
    let filteredHRs = [...hrList];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredHRs = filteredHRs.filter(hr =>
        hr.name?.toLowerCase().includes(searchLower) ||
        hr.email?.toLowerCase().includes(searchLower) ||
        hr.mobile?.toLowerCase().includes(searchLower) ||
        (hr.employee_id && hr.employee_id.toLowerCase().includes(searchLower))
      );
    }
    
    // Add status filtering
    if (status !== 'all') {
      filteredHRs = filteredHRs.filter(hr => {
        if (status === 'active') return hr.isactive === true;
        if (status === 'inactive') return hr.isactive === false;
        return true;
      });
    }
    
    const total = filteredHRs.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedHRs = filteredHRs.slice(startIndex, startIndex + pageSize);
    
    setHRs(paginatedHRs);
    setPagination({
      current: page,
      pageSize: pageSize,
      total: total
    });
    
    return paginatedHRs;
  }, [statusFilter]); // Add statusFilter to dependency array


const fetchHRs = useCallback(async (page = 1, pageSize = 10, search = '') => {
  try {
    setLoading(true);
    const hrList = await fetchAllHRs();
    applyFiltersAndPagination(hrList, search, page, pageSize,statusFilter);
  } catch (error) {
    console.error('Error fetching HRs:', error);
  } finally {
    setLoading(false);
  }
}, [fetchAllHRs, applyFiltersAndPagination]);

// Initialize component
useEffect(() => {
  if (userRole === 'superadmin' || userRole === 'admin') {
    fetchHRs();
  }
}, [userRole, fetchHRs]);


  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const hrList = await fetchAllHRs();
      applyFiltersAndPagination(hrList, searchQuery, 1, pagination.pageSize, statusFilter);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllHRs, applyFiltersAndPagination, searchQuery, pagination.pageSize]);

  useEffect(() => {
  const subscription = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'users',
        filter: 'role=eq.hr'
      },
      (payload) => {
        console.log('Real-time update received:', payload);
        
        if (payload.eventType === 'UPDATE') {
          // Update the specific HR in state
          setAllHRs(prev => 
            prev.map(hr => 
              hr.id === payload.new.id ? payload.new : hr
            )
          );
          
          setHRs(prev => 
            prev.map(hr => 
              hr.id === payload.new.id ? payload.new : hr
            )
          );
        } else if (payload.eventType === 'INSERT') {
          // Add new HR
          setAllHRs(prev => [payload.new, ...prev]);
          refreshData(); // Refresh to maintain pagination
        } else if (payload.eventType === 'DELETE') {
          // Remove deleted HR
          setAllHRs(prev => prev.filter(hr => hr.id !== payload.old.id));
          setHRs(prev => prev.filter(hr => hr.id !== payload.old.id));
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
  //   applyFiltersAndPagination(allHRs, searchQuery, paginationInfo.current, paginationInfo.pageSize,statusFilter);
  // }, [allHRs, searchQuery, applyFiltersAndPagination]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    applyFiltersAndPagination(allHRs, value, 1, pagination.pageSize,statusFilter);
  }, [allHRs, pagination.pageSize, applyFiltersAndPagination]);

  const handleEdit = useCallback((hr) => {
    setEditingHR(hr);
    setShowFormModal(true);
  }, []);

const handleDelete = useCallback(async (hrId) => {
  try {
    setLoading(true);
    
    // First, check if HR has any attendance records
    const { data: attendanceData, error: attendanceCheckError } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('user_id', hrId)
      .limit(1);

    if (attendanceCheckError) {
      console.error('Attendance check error:', attendanceCheckError);
      throw attendanceCheckError;
    }

    // If HR has attendance records, show confirmation dialog
    if (attendanceData && attendanceData.length > 0) {
      Modal.confirm({
        title: 'Delete HR with Attendance Records',
        content: 'This HR has attendance records. Deleting will also remove all associated attendance data. Do you want to proceed?',
        okText: 'Yes, Delete All',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            // Delete attendance records first
            const { error: deleteAttendanceError } = await supabaseAdmin
              .from('attendance')
              .delete()
              .eq('user_id', hrId);

            if (deleteAttendanceError) {
              console.error('Delete attendance error:', deleteAttendanceError);
              throw deleteAttendanceError;
            }

            // Then delete the HR
            const { error: deleteUserError } = await supabaseAdmin
              .from('users')
              .delete()
              .eq('id', hrId)
              .eq('role', 'hr');

            if (deleteUserError) {
              console.error('Delete HR error:', deleteUserError);
              throw deleteUserError;
            }
            
            message.success('HR and all associated records deleted successfully');
            await refreshData();
          } catch (error) {
            console.error('Error in cascade delete:', error);
            message.error('Error deleting HR: ' + (error.message || 'Unknown error'));
          }
        }
      });
    } else {
      // No attendance records, safe to delete directly
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', hrId)
        .eq('role', 'hr');

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      message.success('HR deleted successfully');
      await refreshData();
    }
    
  } catch (error) {
    console.error('Error deleting HR:', error);
    
    // Handle specific foreign key constraint error
    if (error.code === '23503' || error.message.includes('foreign key constraint')) {
      message.error('Cannot delete HR: This HR has associated records. Please remove related attendance records first or contact administrator.');
    } else {
      message.error('Error deleting HR: ' + (error.message || 'Unknown error'));
    }
  } finally {
    setLoading(false);
  }
}, [refreshData]);
  const handleFormClose = useCallback(() => {
    setShowFormModal(false);
    setEditingHR(null);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  

  // Table columns with memoization
  const columns = useMemo(() => [
    {
      title: 'HR',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: isMobile ? 200 : 250,
      render: (text, record) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          gap: '12px',
          width: '100%'
        }}>
          <Avatar 
            style={{ 
              backgroundColor: '#1F4842',
              flexShrink: 0
            }}
            size={isMobile ? "default" : "large"}
            src={record.profileimage}
            icon={!record.profileimage && <UserOutlined />}
          >
            {!record.profileimage && text.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ 
            flex: 1,
            minWidth: 0,
            textAlign: 'left'
          }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: isMobile ? '12px' : '14px',
              marginBottom: '4px',
              textAlign: 'left'
            }}>
              {text}
            </div>
            <div style={{ 
              fontSize: isMobile ? '10px' : '12px',
              color: '#666',
              textAlign: 'left'
            }}>
              <MailOutlined style={{ marginRight: '4px' }} /> 
              {record.email}
            </div>
            {isMobile && (
              <div style={{ 
                marginTop: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                justifyContent: 'flex-start'
              }}>
                <Tag color="orange" size="small">{record.role}</Tag>
                <Tag color={record.isactive ? 'green' : 'red'} size="small">
                  {record.isactive ? 'Active' : 'Inactive'}
                </Tag>
                {record.employee_id && (
                  <Tag color="geekblue" size="small">{record.employee_id}</Tag>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'HR ID',
      dataIndex: 'employee_id',
      key: 'employeeId',
      width: 120,
      render: (employeeId) => (
        <Tag color="geekblue">{employeeId || 'N/A'}</Tag>
      ),
      responsive: ['md'],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => <Tag color="orange">{role}</Tag>,
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
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        date ? new Date(date).toLocaleDateString() : 'Unknown'
      ),
      responsive: ['xl'],
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: isMobile ? 120 : 140,
      render: (_, record) => (
        <div className={isMobile ? 'mobile-actions' : 'actions-container'}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size={isMobile ? "small" : "middle"}
            onClick={() => handleEdit(record)}
            className="brand-primary"
          />
          <Popconfirm
            title="Delete HR"
            description="Are you sure you want to delete this HR?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size={isMobile ? "small" : "middle"}
            />
          </Popconfirm>
        </div>
      ),
    },
  ], [isMobile, handleEdit, handleDelete]);

  // Permission check - Allow both superadmin and admin
  if (userRole !== 'superadmin' && userRole !== 'admin') {
    return (
      <div className="access-denied">
        <TeamOutlined className="access-denied-icon" />
        <Title level={3}>Access Denied</Title>
        <Text type="secondary">You don't have permission to view HR management.</Text>
      </div>
    );
  }

  return (
    <div className="employee-management-wrapper">
      <div className="employee-management-content">
        <div className={`employee-management-container ${isMobile ? 'mobile-table' : ''}`}>
          {/* Header */}
          <div className="animated-card" style={{ marginBottom: '24px' }}>
            <div className={`${isMobile ? 'mobile-header' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Title level={2} className={isMobile ? 'responsive-title' : ''} style={{ margin: 0 }}>
                  HR Management
                </Title>
                <Text type="secondary" className={isMobile ? 'responsive-subtitle' : ''}>
                  Manage HR users and their access levels
                </Text>
              </div>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setShowFormModal(true)}
                className="brand-primary"
                size={isMobile ? "middle" : "large"}
              >
                Add HR
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} className={isMobile ? 'mobile-stats' : ''}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed stats-card">
                <Statistic
                  title="Total HRs"
                  value={totalHRs}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1F4842' }}
                  className={isMobile ? 'responsive-stat-value' : ''}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-2 stats-card">
                <Statistic
                  title="Active HRs"
                  value={activeHRs}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#10b981' }}
                  className={isMobile ? 'responsive-stat-value' : ''}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-3 stats-card">
                <Statistic
                  title="Inactive HRs"
                  value={inactiveHRs}
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
        placeholder="Search HRs by name, email, phone or HR ID..."
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
            applyFiltersAndPagination(allHRs, searchQuery, 1, pagination.pageSize, value);
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
            applyFiltersAndPagination(allHRs, '', 1, pagination.pageSize, 'all');
          }}
          size={isMobile ? "middle" : "large"}
        >
          Clear
        </Button>
      </Space>
    </Col>
  </Row>
</Card>

          {/* HR List - Mobile Cards or Table */}
          {isMobile ? (
            <Card className="animated-card-delayed-2" style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0 }}>HR List</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {hrs.length} of {pagination.total} HRs
                </Text>
              </div>
              {loading ? (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <Text>Loading HRs...</Text>
  </div>
) : hrs.length === 0 ? (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <Text type="secondary">No HRs found</Text>
  </div>
) : (
  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
    {hrs.map((hr) => (
      <MobileHRCard
        key={hr.id}
        hr={hr}
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
      onClick={() => applyFiltersAndPagination(allHRs, searchQuery, pagination.current - 1, pagination.pageSize, statusFilter)}
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
      onClick={() => applyFiltersAndPagination(allHRs, searchQuery, pagination.current + 1, pagination.pageSize, statusFilter)}
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
  dataSource={hrs}
  rowKey="id"
  loading={loading}
  locale={{ emptyText: 'No HRs found' }}
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
    applyFiltersAndPagination(allHRs, searchQuery, page, size, statusFilter);
  },
  onShowSizeChange: (current, size) => {
    applyFiltersAndPagination(allHRs, searchQuery, 1, size, statusFilter);
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
  applyFiltersAndPagination(allHRs, searchQuery, paginationInfo.current, paginationInfo.pageSize, statusFilter);
}}
  scroll={{ x: 800 }}
  size="middle"
/>
            </Card>
          )}

          {/* Form Modal */}
          <HRFormModal
            isOpen={showFormModal}
            onClose={handleFormClose}
            editingHR={editingHR}
            onSuccess={handleFormSuccess}
            generateHRId={generateHRId}
          />
        </div>
      </div>
    </div>
  );
};

export default HRManagement;