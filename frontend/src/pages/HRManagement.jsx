import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Card, Statistic, Row, Col, message, Avatar, Tag, Typography, Switch } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, SearchOutlined, TeamOutlined, MailOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { db } from '../supabase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { sendEmployeeWelcomeEmail, initEmailJS } from './EmailService';
import '../styles/Employee Management.css'; // Reusing the same CSS
import { Upload, message as antMessage } from 'antd';
const { Title, Text } = Typography;
const { Search } = Input;

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
          src={hr.profileImage}
          icon={!hr.profileImage && <UserOutlined />}
        >
          {!hr.profileImage && hr.name.charAt(0).toUpperCase()}
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
          {hr.employeeId && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {hr.employeeId}
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
        <Tag color={hr.isActive ? 'green' : 'red'} size="small">
          {hr.isActive ? 'Active' : 'Inactive'}
        </Tag>
        {hr.employeeId && (
          <Tag color="geekblue" size="small">{hr.employeeId}</Tag>
        )}
        {hr.createdAt && (
          <Tag color="purple" size="small">
            {hr.createdAt?.toDate ? hr.createdAt.toDate().toLocaleDateString() : 'Unknown'}
          </Tag>
        )}
      </div>
    </div>
  </Card>
));

// HR Form Modal Component
const HRFormModal = React.memo(({ isOpen, onClose, editingHR, onSuccess }) => {
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
            employeeId: editingHR.employeeId,
            role: editingHR.role,
            isActive: editingHR.isActive !== undefined ? editingHR.isActive : true
          });
          setProfileImage(editingHR.profileImage || null);
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
        const docRef = doc(db, 'users', editingHR.id);
        const updateData = {
          name: values.name,
          email: values.email,
          role: values.role || 'hr',
          employeeId: values.employeeId,
          isActive: values.isActive !== undefined ? values.isActive : true,
          profileImage: profileImage,
          updatedAt: new Date()
        };
        
        await updateDoc(docRef, updateData);
        message.success('HR updated successfully');
      } else {
        const password = generatePassword();
        const hrData = {
          name: values.name,
          email: values.email,
          employeeId: values.employeeId,
          role: 'hr',
          isActive: values.isActive !== undefined ? values.isActive : true,
          profileImage: profileImage,
          password,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), hrData);
        message.success('HR created successfully!');
        
        try {
          const emailResult = await sendEmployeeWelcomeEmail({
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
      
      const errorMessages = {
        'permission-denied': 'Permission denied. Check your Firestore security rules.',
        'unavailable': 'Firebase service is currently unavailable. Please try again.',
        'invalid-argument': 'Invalid data provided. Please check your inputs.'
      };
      
      message.error(errorMessages[error.code] || `Error saving HR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [editingHR, generatePassword, onSuccess, onClose, form, profileImage]);

  return (
    <Modal
      title={editingHR ? 'Edit HR' : 'Add New HR'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      className="employee-form-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'hr', isActive: true }}
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
          name="employeeId"
          label="HR ID"
          rules={[
            { required: true, message: 'Please enter HR ID' },
            { pattern: /^[A-Z0-9]+$/, message: 'HR ID should contain only uppercase letters and numbers' }
          ]}
        >
          <Input 
            placeholder="Enter HR ID (e.g., HR001)" 
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Active Status"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive"
            defaultChecked={true}
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Use useMemo for calculations
  const { totalHRs, activeHRs, inactiveHRs } = useMemo(() => {
    const total = allHRs.length;
    const active = allHRs.filter(hr => hr.isActive === true).length;
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
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'hr'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const hrList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setAllHRs(hrList);
      return hrList;
    } catch (error) {
      console.error('Error fetching HRs:', error);
      message.error(`Error loading HRs: ${error.message}`);
      return [];
    }
  }, []);

  // Apply filters and pagination
  const applyFiltersAndPagination = useCallback((hrList, search = '', page = 1, pageSize = 10) => {
    let filteredHRs = [...hrList];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredHRs = filteredHRs.filter(hr =>
        hr.name.toLowerCase().includes(searchLower) ||
        hr.email.toLowerCase().includes(searchLower) ||
        (hr.employeeId && hr.employeeId.toLowerCase().includes(searchLower))
      );
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
  }, []);

  // Fetch HRs with pagination
  const fetchHRs = useCallback(async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      
      let hrList = allHRs;
      if (hrList.length === 0) {
        hrList = await fetchAllHRs();
      }
      
      applyFiltersAndPagination(hrList, search, page, pageSize);
    } catch (error) {
      console.error('Error in fetchHRs:', error);
      message.error(`Error loading HRs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [allHRs, fetchAllHRs, applyFiltersAndPagination]);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const hrList = await fetchAllHRs();
      applyFiltersAndPagination(hrList, searchQuery, 1, pagination.pageSize);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllHRs, applyFiltersAndPagination, searchQuery, pagination.pageSize]);

  // Initialize component
  useEffect(() => {
    if (userRole === 'superadmin' || userRole === 'admin') {
      const emailInitialized = initEmailJS();
      if (!emailInitialized) {
        console.warn('EmailJS initialization failed - emails may not work');
      }
      
      fetchHRs();
    }
  }, [userRole, fetchHRs]);

  // Event handlers
  const handleTableChange = useCallback((paginationInfo) => {
    applyFiltersAndPagination(allHRs, searchQuery, paginationInfo.current, paginationInfo.pageSize);
  }, [allHRs, searchQuery, applyFiltersAndPagination]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    applyFiltersAndPagination(allHRs, value, 1, pagination.pageSize);
  }, [allHRs, pagination.pageSize, applyFiltersAndPagination]);

  const handleEdit = useCallback((hr) => {
    setEditingHR(hr);
    setShowFormModal(true);
  }, []);

  const handleDelete = useCallback(async (hrId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', hrId));
      message.success('HR deleted successfully');
      await refreshData();
    } catch (error) {
      console.error('Error deleting HR:', error);
      message.error('Error deleting HR');
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
            src={record.profileImage}
            icon={!record.profileImage && <UserOutlined />}
          >
            {!record.profileImage && text.charAt(0).toUpperCase()}
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
                <Tag color={record.isActive ? 'green' : 'red'} size="small">
                  {record.isActive ? 'Active' : 'Inactive'}
                </Tag>
                {record.employeeId && (
                  <Tag color="geekblue" size="small">{record.employeeId}</Tag>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'HR ID',
      dataIndex: 'employeeId',
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
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      responsive: ['md'],
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        date?.toDate ? date.toDate().toLocaleDateString() : 'Unknown'
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
          <Card style={{ marginBottom: '24px' }} className={`animated-card-delayed ${isMobile ? 'mobile-search' : ''}`}>
            <Search
              placeholder="Search HRs by name or email..."
              allowClear
              enterButton={
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  className="brand-primary"
                  style={{ backgroundColor: '#1F4842', borderColor: '#1F4842' }}
                >
                  Search
                </Button>
              }
              size={isMobile ? "middle" : "large"}
              onSearch={handleSearch}
              style={{ maxWidth: isMobile ? '100%' : '400px' }}
            />
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
              <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                <Space>
                  <Button 
                    size="small"
                    disabled={pagination.current === 1}
                    onClick={() => fetchHRs(pagination.current - 1, pagination.pageSize, searchQuery)}
                  >
                    Previous
                  </Button>
                  <Text style={{ fontSize: '12px' }}>
                    Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
                  </Text>
                  <Button 
                    size="small"
                    disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                    onClick={() => fetchHRs(pagination.current + 1, pagination.pageSize, searchQuery)}
                  >
                    Next
                  </Button>
                </Space>
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
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} HRs`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
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
          />
        </div>
      </div>
    </div>
  );
};

export default HRManagement;