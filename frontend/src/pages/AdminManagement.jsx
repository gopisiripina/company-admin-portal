import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Popconfirm, 
  Card, 
  Statistic, 
  Row, 
  Col,
  message,
  Avatar,
  Tag,
  Typography,
  Switch,
  Drawer,
  Dropdown
} from 'antd';
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  TeamOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  UserOutlined
} from '@ant-design/icons';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter,
  getCountFromServer
} from 'firebase/firestore';
import { sendEmployeeWelcomeEmail, initEmailJS } from './EmailService';
const { Title, Text } = Typography;
const { Search } = Input;

// Enhanced CSS for mobile responsiveness
const enhancedStyles = `
  @keyframes slideUpFromBottom {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animated-card {
    animation: slideUpFromBottom 0.5s ease-out;
  }

  .animated-card-delayed {
    animation: slideUpFromBottom 0.5s ease-out 0.1s both;
  }

  .animated-card-delayed-2 {
    animation: slideUpFromBottom 0.5s ease-out 0.2s both;
  }

  .animated-card-delayed-3 {
    animation: slideUpFromBottom 0.5s ease-out 0.3s both;
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .admin-management-container {
      padding: 12px !important;
    }
    
    .mobile-header {
      flex-direction: column !important;
      gap: 16px !important;
    }
    
    .mobile-header .ant-btn {
      width: 100% !important;
      justify-content: center !important;
    }
    
    .mobile-stats {
      margin-bottom: 16px !important;
    }
    
    .mobile-stats .ant-col {
      margin-bottom: 8px !important;
    }
    
    .mobile-search {
      margin-bottom: 16px !important;
    }
    
    .mobile-search .ant-input-search {
      max-width: 100% !important;
    }
    
    /* Mobile table styles */
    .mobile-table .ant-table {
      font-size: 12px !important;
    }
    
    .mobile-table .ant-table-tbody > tr > td {
      padding: 8px 4px !important;
      border-bottom: 1px solid #f0f0f0 !important;
    }
    
    .mobile-table .ant-table-thead > tr > th {
      padding: 8px 4px !important;
      font-size: 12px !important;
    }
    
    .mobile-admin-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 4px !important;
    }
    
    .mobile-admin-main {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    .mobile-admin-details {
      font-size: 11px !important;
    }
    
    .mobile-admin-tags {
      display: flex !important;
      gap: 4px !important;
      flex-wrap: wrap !important;
      margin-top: 4px !important;
    }
    
    .mobile-admin-tags .ant-tag {
      font-size: 10px !important;
      padding: 2px 6px !important;
      margin: 0 !important;
    }
    
    .mobile-actions {
      display: flex !important;
      gap: 4px !important;
    }
    
    .mobile-actions .ant-btn {
      padding: 4px 8px !important;
      font-size: 12px !important;
      height: auto !important;
    }
  }
  
  /* Ensure horizontal scroll for the entire page content */
  .admin-management-wrapper {
    width: 100%;
    overflow-x: auto;
    min-width: 320px;
  }
  
  .admin-management-content {
    min-width: 800px;
    width: 100%;
  }
  
  @media (max-width: 768px) {
    .admin-management-content {
      min-width: 100%;
    }
  }
  
  /* Custom scrollbar for better UX */
  .admin-management-wrapper::-webkit-scrollbar {
    height: 8px;
  }
  
  .admin-management-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .admin-management-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .admin-management-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('admin-management-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleSheet = document.createElement("style");
  styleSheet.id = 'admin-management-styles';
  styleSheet.innerText = enhancedStyles;
  document.head.appendChild(styleSheet);
}

// Enhanced Admin Card Component for Mobile
const MobileAdminCard = ({ admin, onEdit, onDelete, loading }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Admin',
      icon: <EditOutlined />,
      onClick: () => {
        onEdit(admin);
        setIsDrawerOpen(false);
      }
    },
    {
      key: 'delete',
      label: 'Delete Admin',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        setIsDrawerOpen(false);
        // Show confirmation
        Modal.confirm({
          title: 'Delete Admin',
          content: 'Are you sure you want to delete this admin?',
          okText: 'Yes',
          cancelText: 'No',
          onOk: () => onDelete(admin.id)
        });
      }
    }
  ];

  return (
    <>
      <Card 
        size="small" 
        style={{ marginBottom: '8px' }}
        actions={[
          <Button 
            key="edit"
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => onEdit(admin)}
            style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
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
              style={{ backgroundColor: '#3b82f6' }}
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
    </>
  );
};

// Add/Edit Admin Modal Component
const AdminFormModal = ({ isOpen, onClose, editingAdmin, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingAdmin) {
      form.setFieldsValue({
        name: editingAdmin.name,
        email: editingAdmin.email,
        role: editingAdmin.role,
        isActive: editingAdmin.isActive !== undefined ? editingAdmin.isActive : true
      });
    } else {
      form.resetFields();
    }
  }, [editingAdmin, form]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (values) => {
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
        
        const docRef = await addDoc(collection(db, 'users'), adminData);
        message.success('Admin created successfully!');
        
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
          console.error('Email send failed:', emailResult.error);
        }
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Detailed error saving admin:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        message.error('Permission denied. Check your Firestore security rules.');
      } else if (error.code === 'unavailable') {
        message.error('Firebase service is currently unavailable. Please try again.');
      } else if (error.code === 'invalid-argument') {
        message.error('Invalid data provided. Please check your inputs.');
      } else {
        message.error(`Error saving admin: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingAdmin ? 'Edit Admin' : 'Add New Admin'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
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
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              {editingAdmin ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main Admin Management Component
const AdminManagement = ({ userRole }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [activeAdmins, setActiveAdmins] = useState(0);
  const [inactiveAdmins, setInactiveAdmins] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get total count of admins
  const getTotalCount = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      const snapshot = await getCountFromServer(q);
      const count = snapshot.data().count;
      setTotalAdmins(count);

      const activeQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        where('isActive', '==', true)
      );
      const activeSnapshot = await getCountFromServer(activeQuery);
      const activeCount = activeSnapshot.data().count;
      setActiveAdmins(activeCount);
      setInactiveAdmins(count - activeCount);

    } catch (error) {
      console.error('Error getting total count:', error);
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'admin')
        );
        const querySnapshot = await getDocs(q);
        const count = querySnapshot.size;
        setTotalAdmins(count);

        let activeCount = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isActive === true) {
            activeCount++;
          }
        });
        setActiveAdmins(activeCount);
        setInactiveAdmins(count - activeCount);

      } catch (fallbackError) {
        console.error('Fallback count error:', fallbackError);
      }
    }
  };

  // Fetch admins with pagination
  const fetchAdmins = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      
      let q;
      if (search) {
        q = query(
          collection(db, 'users'),
          where('role', '==', 'admin'),
          orderBy('createdAt', 'desc')
        );
      } else {
        if (page === 1) {
          q = query(
            collection(db, 'users'),
            where('role', '==', 'admin'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          );
        } else {
          q = query(
            collection(db, 'users'),
            where('role', '==', 'admin'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          );
        }
      }

      const querySnapshot = await getDocs(q);
      let adminList = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        adminList.push({ id: doc.id, ...data });
        lastDocument = doc;
      });

      if (search) {
        adminList = adminList.filter(admin =>
          admin.name.toLowerCase().includes(search.toLowerCase()) ||
          admin.email.toLowerCase().includes(search.toLowerCase())
        );
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedList = adminList.slice(startIndex, endIndex);
        
        setAdmins(paginatedList);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: adminList.length
        });
      } else {
        setAdmins(adminList);
        setLastDoc(lastDocument);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: totalAdmins
        });
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      message.error(`Error loading admins: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'superadmin') {
      // Initialize EmailJS first
      const emailInitialized = initEmailJS();
      if (!emailInitialized) {
        console.warn('EmailJS initialization failed - emails may not work');
      }
      
      getTotalCount();
      fetchAdmins();
    }
  }, [userRole]);

  const handleTableChange = (paginationInfo) => {
    fetchAdmins(paginationInfo.current, paginationInfo.pageSize, searchQuery);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    fetchAdmins(1, pagination.pageSize, value);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setShowFormModal(true);
  };

  const handleDelete = async (adminId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', adminId));
      message.success('Admin deleted successfully');
      fetchAdmins(pagination.current, pagination.pageSize, searchQuery);
      getTotalCount();
    } catch (error) {
      console.error('Error deleting admin:', error);
      message.error('Error deleting admin');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingAdmin(null);
  };

  const handleFormSuccess = () => {
    fetchAdmins(pagination.current, pagination.pageSize, searchQuery);
    getTotalCount();
  };

  // Enhanced table columns with better mobile handling
  const columns = [
    {
      title: 'Admin',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: isMobile ? 200 : 250,
      render: (text, record) => (
        <div className="mobile-admin-info">
          <div className="mobile-admin-main">
            <Avatar 
              style={{ backgroundColor: '#3b82f6' }}
              size={isMobile ? "default" : "large"}
            >
              {text.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
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
      render: (role) => (
        <Tag color="blue">{role}</Tag>
      ),
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
        <div className="mobile-actions">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size={isMobile ? "small" : "middle"}
            onClick={() => handleEdit(record)}
            style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
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
  ];

  // Check if user has permission
  if (userRole !== 'superadmin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <TeamOutlined style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
        <Title level={3}>Access Denied</Title>
        <Text type="secondary">You don't have permission to view admin management.</Text>
      </div>
    );
  }

  return (
    <div className="admin-management-wrapper">
      <div className="admin-management-content">
        <div className={`admin-management-container ${isMobile ? 'mobile-table' : ''}`} style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }} className="animated-card">
            <div className={`${isMobile ? 'mobile-header' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Title level={2} style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>Admin Management</Title>
                <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>Manage admin users and their access levels</Text>
              </div>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setShowFormModal(true)}
                style={{ backgroundColor: '#3b82f6' }}
                size={isMobile ? "middle" : "large"}
              >
                Add Admin
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} className={isMobile ? 'mobile-stats' : ''}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed">
                <Statistic
                  title="Total Admins"
                  value={totalAdmins}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3b82f6', fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-2">
                <Statistic
                  title="Active Admins"
                  value={activeAdmins}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#10b981', fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-3">
                <Statistic
                  title="Inactive Admins"
                  value={inactiveAdmins}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#ef4444', fontSize: isMobile ? '20px' : '24px' }}
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
                  style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
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