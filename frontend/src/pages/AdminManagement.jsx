import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Card, Statistic, Row, Col,message,Avatar,Tag,Typography,Switch} from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, SearchOutlined,TeamOutlined,MailOutlined,} from '@ant-design/icons';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy} from 'firebase/firestore';
import { sendEmployeeWelcomeEmail, initEmailJS } from './EmailService';
import '../styles/AdminManagement.css';

const { Title, Text } = Typography;
const { Search } = Input;

// Mobile Admin Card Component
const MobileAdminCard = React.memo(({ admin, onEdit, onDelete }) => (
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
      <div className="mobile-admin-main">
        <Avatar 
          style={{ backgroundColor: '#1F4842' }}
          size="large"
        >
          {admin.name.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{admin.name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {admin.email}
          </Text>
        </div>
      </div>
      <div className="mobile-admin-tags">
        <Tag color="blue" size="small">{admin.role}</Tag>
        <Tag color={admin.isActive ? 'green' : 'red'} size="small">
          {admin.isActive ? 'Active' : 'Inactive'}
        </Tag>
        {admin.createdAt && (
          <Tag color="geekblue" size="small">
            {admin.createdAt?.toDate ? admin.createdAt.toDate().toLocaleDateString() : 'Unknown'}
          </Tag>
        )}
      </div>
    </div>
  </Card>
));

// Admin Form Modal Component
const AdminFormModal = React.memo(({ isOpen, onClose, editingAdmin, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingAdmin) {
        setTimeout(() => {
          form.setFieldsValue({
            name: editingAdmin.name,
            email: editingAdmin.email,
            role: editingAdmin.role,
            isActive: editingAdmin.isActive !== undefined ? editingAdmin.isActive : true
          });
        }, 0);
      } else {
        form.resetFields();
      }
    }
  }, [editingAdmin, form, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
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

  const handleSubmit = useCallback(async (values) => {
    setLoading(true);
    
    try {
      if (editingAdmin) {
        const docRef = doc(db, 'users', editingAdmin.id);
        const updateData = {
          name: values.name,
          email: values.email,
          role: values.role || 'admin',
          isActive: values.isActive !== undefined ? values.isActive : true,
          updatedAt: new Date()
        };
        
        await updateDoc(docRef, updateData);
        message.success('Admin updated successfully');
      } else {
        const password = generatePassword();
        const adminData = {
          name: values.name,
          email: values.email,
          role: 'admin',
          isActive: values.isActive !== undefined ? values.isActive : true,
          password,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), adminData);
        message.success('Admin created successfully!');
        
        try {
          const emailResult = await sendEmployeeWelcomeEmail({
            name: values.name,
            email: values.email,
            password: password,
            role: 'admin'
          });

          if (emailResult.success) {
            message.success('Welcome email sent to admin!');
          } else {
            message.warning('Admin created but email could not be sent. Please share credentials manually.');
          }
        } catch (emailError) {
          console.error('Email send failed:', emailError);
          message.warning('Admin created but email could not be sent.');
        }
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving admin:', error);
      
      const errorMessages = {
        'permission-denied': 'Permission denied. Check your Firestore security rules.',
        'unavailable': 'Firebase service is currently unavailable. Please try again.',
        'invalid-argument': 'Invalid data provided. Please check your inputs.'
      };
      
      message.error(errorMessages[error.code] || `Error saving admin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [editingAdmin, generatePassword, onSuccess, onClose, form]);

  return (
    <Modal
      title={editingAdmin ? 'Edit Admin' : 'Add New Admin'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      className="admin-form-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'admin', isActive: true }}
      >
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Use useMemo for calculations
  const { totalAdmins, activeAdmins, inactiveAdmins } = useMemo(() => {
    const total = allAdmins.length;
    const active = allAdmins.filter(admin => admin.isActive === true).length;
    const inactive = total - active;
    
    return { totalAdmins: total, activeAdmins: active, inactiveAdmins: inactive };
  }, [allAdmins]);

  // Check if mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all admins
  const fetchAllAdmins = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const adminList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setAllAdmins(adminList);
      return adminList;
    } catch (error) {
      console.error('Error fetching admins:', error);
      message.error(`Error loading admins: ${error.message}`);
      return [];
    }
  }, []);

  // Apply filters and pagination
  const applyFiltersAndPagination = useCallback((adminList, search = '', page = 1, pageSize = 10) => {
    let filteredAdmins = [...adminList];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAdmins = filteredAdmins.filter(admin =>
        admin.name.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower)
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
  }, []);

  // Fetch admins with pagination
  const fetchAdmins = useCallback(async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      
      let adminList = allAdmins;
      if (adminList.length === 0) {
        adminList = await fetchAllAdmins();
      }
      
      applyFiltersAndPagination(adminList, search, page, pageSize);
    } catch (error) {
      console.error('Error in fetchAdmins:', error);
      message.error(`Error loading admins: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [allAdmins, fetchAllAdmins, applyFiltersAndPagination]);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const adminList = await fetchAllAdmins();
      applyFiltersAndPagination(adminList, searchQuery, 1, pagination.pageSize);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllAdmins, applyFiltersAndPagination, searchQuery, pagination.pageSize]);

  // Initialize component
  useEffect(() => {
    if (userRole === 'superadmin') {
      const emailInitialized = initEmailJS();
      if (!emailInitialized) {
        console.warn('EmailJS initialization failed - emails may not work');
      }
      
      fetchAdmins();
    }
  }, [userRole, fetchAdmins]);

  // Event handlers
  const handleTableChange = useCallback((paginationInfo) => {
    applyFiltersAndPagination(allAdmins, searchQuery, paginationInfo.current, paginationInfo.pageSize);
  }, [allAdmins, searchQuery, applyFiltersAndPagination]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    applyFiltersAndPagination(allAdmins, value, 1, pagination.pageSize);
  }, [allAdmins, pagination.pageSize, applyFiltersAndPagination]);

  const handleEdit = useCallback((admin) => {
    setEditingAdmin(admin);
    setShowFormModal(true);
  }, []);

  const handleDelete = useCallback(async (adminId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', adminId));
      message.success('Admin deleted successfully');
      await refreshData();
    } catch (error) {
      console.error('Error deleting admin:', error);
      message.error('Error deleting admin');
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
      fixed: 'left',
      width: isMobile ? 200 : 250,
      render: (text, record) => (
        <div className={isMobile ? 'mobile-admin-info' : 'admin-info'}>
          <div className={isMobile ? 'mobile-admin-main' : 'admin-main'}>
            <Avatar 
              style={{ backgroundColor: '#1F4842' }}
              size={isMobile ? "default" : "large"}
            >
              {text.charAt(0).toUpperCase()}
            </Avatar>
            <div className="admin-details">
              <div style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '14px' }}>{text}</div>
              <Text type="secondary" style={{ fontSize: isMobile ? '10px' : '12px' }}>
                <MailOutlined /> {record.email}
              </Text>
              {isMobile && (
                <div className="mobile-admin-tags">
                  <Tag color="blue" size="small">{record.role}</Tag>
                  <Tag color={record.isActive ? 'green' : 'red'} size="small">
                    {record.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      responsive: ['lg'],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => <Tag color="blue">{role}</Tag>,
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
            title="Delete Admin"
            description="Are you sure you want to delete this admin?"
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

  // Permission check
  if (userRole !== 'superadmin') {
    return (
      <div className="access-denied">
        <TeamOutlined className="access-denied-icon" />
        <Title level={3}>Access Denied</Title>
        <Text type="secondary">You don't have permission to view admin management.</Text>
      </div>
    );
  }

  return (
    <div className="admin-management-wrapper">
      <div className="admin-management-content">
        <div className={`admin-management-container ${isMobile ? 'mobile-table' : ''}`}>
          {/* Header */}
          <div className="animated-card" style={{ marginBottom: '24px' }}>
            <div className={`${isMobile ? 'mobile-header' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
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
              >
                Add Admin
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} className={isMobile ? 'mobile-stats' : ''}>
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
          <Card style={{ marginBottom: '24px' }} className={`animated-card-delayed ${isMobile ? 'mobile-search' : ''}`}>
            <Search
              placeholder="Search admins by name or email..."
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
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
              <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                <Space>
                  <Button 
                    size="small"
                    disabled={pagination.current === 1}
                    onClick={() => fetchAdmins(pagination.current - 1, pagination.pageSize, searchQuery)}
                  >
                    Previous
                  </Button>
                  <Text style={{ fontSize: '12px' }}>
                    Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
                  </Text>
                  <Button 
                    size="small"
                    disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                    onClick={() => fetchAdmins(pagination.current + 1, pagination.pageSize, searchQuery)}
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
                dataSource={admins}
                rowKey="id"
                loading={loading}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} admins`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
                scroll={{ x: 800 }}
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