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
    .employee-management-container {
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
    
    .mobile-employee-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 4px !important;
    }
    
    .mobile-employee-main {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    .mobile-employee-details {
      font-size: 11px !important;
    }
    
    .mobile-employee-tags {
      display: flex !important;
      gap: 4px !important;
      flex-wrap: wrap !important;
      margin-top: 4px !important;
    }
    
    .mobile-employee-tags .ant-tag {
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
  .employee-management-wrapper {
    width: 100%;
    overflow-x: auto;
    min-width: 320px;
  }
  
  .employee-management-content {
    min-width: 800px;
    width: 100%;
  }
  
  @media (max-width: 768px) {
    .employee-management-content {
      min-width: 100%;
    }
  }
  
  /* Custom scrollbar for better UX */
  .employee-management-wrapper::-webkit-scrollbar {
    height: 8px;
  }
  
  .employee-management-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .employee-management-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .employee-management-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('employee-management-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleSheet = document.createElement("style");
  styleSheet.id = 'employee-management-styles';
  styleSheet.innerText = enhancedStyles;
  document.head.appendChild(styleSheet);
}

// Enhanced Employee Card Component for Mobile
const MobileEmployeeCard = ({ employee, onEdit, onDelete, loading }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Employee',
      icon: <EditOutlined />,
      onClick: () => {
        onEdit(employee);
        setIsDrawerOpen(false);
      }
    },
    {
      key: 'delete',
      label: 'Delete Employee',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        setIsDrawerOpen(false);
        // Show confirmation
        Modal.confirm({
          title: 'Delete Employee',
          content: 'Are you sure you want to delete this employee?',
          okText: 'Yes',
          cancelText: 'No',
          onOk: () => onDelete(employee.id)
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
            onClick={() => onEdit(employee)}
            style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
          >
            Edit
          </Button>,
          <Popconfirm
            key="delete"
            title="Delete Employee"
            description="Are you sure you want to delete this employee?"
            onConfirm={() => onDelete(employee.id)}
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
          <div className="mobile-employee-main">
            <Avatar 
              style={{ backgroundColor: '#1F4842' }}
              size="large"
            >
              {employee.name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{employee.name}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <MailOutlined /> {employee.email}
              </Text>
            </div>
          </div>
          <div className="mobile-employee-tags">
            <Tag color="orange" size="small">{employee.role}</Tag>
            <Tag color={employee.isActive ? 'green' : 'red'} size="small">
              {employee.isActive ? 'Active' : 'Inactive'}
            </Tag>
            {employee.createdAt && (
              <Tag color="blue" size="small">
                {employee.createdAt?.toDate ? employee.createdAt.toDate().toLocaleDateString() : 'Unknown'}
              </Tag>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

// Add/Edit Employee Modal Component (unchanged)
const EmployeeFormModal = ({ isOpen, onClose, editingEmployee, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    if (editingEmployee) {
      form.setFieldsValue({
        name: editingEmployee.name,
        email: editingEmployee.email,
        role: editingEmployee.role,
        isActive: editingEmployee.isActive !== undefined ? editingEmployee.isActive : true
      });
    } else {
      form.resetFields();
    }
  }, [editingEmployee, form]);

  

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
    
    console.log('Form values:', values);
    console.log('Database instance:', db);
    console.log('Collection reference:', collection(db, 'users'));
    
    try {
      if (editingEmployee) {
        console.log('Updating employee:', editingEmployee.id);
        const docRef = doc(db, 'users', editingEmployee.id);
        const updateData = {
          name: values.name,
          email: values.email,
          role: values.role || 'employee',
          isActive: values.isActive !== undefined ? values.isActive : true,
          updatedAt: new Date()
        };
        console.log('Update data:', updateData);
        
        await updateDoc(docRef, updateData);
        console.log('Employee updated successfully');
        message.success('Employee updated successfully');
      } else {
        const password = generatePassword();
        const employeeData = {
          name: values.name,
          email: values.email,
          role: 'employee',
          isActive: values.isActive !== undefined ? values.isActive : true,
          password,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('Adding new employee data:', employeeData);
        
        const docRef = await addDoc(collection(db, 'users'), employeeData);
        console.log('Document written with ID: ', docRef.id);
        message.success('Employee created successfully!');
        const emailResult = await sendEmployeeWelcomeEmail({
  name: values.name,
  email: values.email,
  password: password,
  role: 'employee'
});

if (emailResult.success) {
  message.success('Welcome email sent to employee!');
} else {
  message.warning('Employee created but email could not be sent. Please share credentials manually.');
  console.error('Email send failed:', emailResult.error);
}
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Detailed error saving employee:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        message.error('Permission denied. Check your Firestore security rules.');
      } else if (error.code === 'unavailable') {
        message.error('Firebase service is currently unavailable. Please try again.');
      } else if (error.code === 'invalid-argument') {
        message.error('Invalid data provided. Please check your inputs.');
      } else {
        message.error(`Error saving employee: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'employee', isActive: true }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter employee name' }]}
        >
          <Input placeholder="Enter employee name" />
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
              style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
            >
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main Employee Management Component
const EmployeeManagement = ({ userRole }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [inactiveEmployees, setInactiveEmployees] = useState(0);
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

  // Get total count of employees
  const getTotalCount = async () => {
    try {
      console.log('Getting total employee count...');
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'employee')
      );
      const snapshot = await getCountFromServer(q);
      const count = snapshot.data().count;
      console.log('Total employees count:', count);
      setTotalEmployees(count);

      const activeQuery = query(
        collection(db, 'users'),
        where('role', '==', 'employee'),
        where('isActive', '==', true)
      );
      const activeSnapshot = await getCountFromServer(activeQuery);
      const activeCount = activeSnapshot.data().count;
      setActiveEmployees(activeCount);
      setInactiveEmployees(count - activeCount);

    } catch (error) {
      console.error('Error getting total count:', error);
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'employee')
        );
        const querySnapshot = await getDocs(q);
        const count = querySnapshot.size;
        console.log('Fallback count:', count);
        setTotalEmployees(count);

        let activeCount = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isActive === true) {
            activeCount++;
          }
        });
        setActiveEmployees(activeCount);
        setInactiveEmployees(count - activeCount);

      } catch (fallbackError) {
        console.error('Fallback count error:', fallbackError);
      }
    }
  };

  // Fetch employees with pagination
  const fetchEmployees = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      console.log('Fetching employees - Page:', page, 'PageSize:', pageSize, 'Search:', search);
      
      let q;
      if (search) {
        console.log('Building search query...');
        q = query(
          collection(db, 'users'),
          where('role', '==', 'employee'),
          orderBy('createdAt', 'desc')
        );
      } else {
        if (page === 1) {
          console.log('Building first page query...');
          q = query(
            collection(db, 'users'),
            where('role', '==', 'employee'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          );
        } else {
          console.log('Building next page query...');
          q = query(
            collection(db, 'users'),
            where('role', '==', 'employee'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          );
        }
      }

      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      let employeeList = [];
      let lastDocument = null;

      console.log('Query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Document:', doc.id, data);
        employeeList.push({ id: doc.id, ...data });
        lastDocument = doc;
      });

      if (search) {
        console.log('Filtering search results...');
        employeeList = employeeList.filter(employee =>
          employee.name.toLowerCase().includes(search.toLowerCase()) ||
          employee.email.toLowerCase().includes(search.toLowerCase())
        );
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedList = employeeList.slice(startIndex, endIndex);
        
        console.log('Search results:', paginatedList.length, 'of', employeeList.length);
        setEmployees(paginatedList);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: employeeList.length
        });
      } else {
        console.log('Setting employees:', employeeList.length);
        setEmployees(employeeList);
        setLastDoc(lastDocument);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: totalEmployees
        });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      message.error(`Error loading employees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (userRole === 'superadmin' || userRole === 'admin') {
    // Initialize EmailJS first
    const emailInitialized = initEmailJS();
    if (!emailInitialized) {
      console.warn('EmailJS initialization failed - emails may not work');
    }
    
    getTotalCount();
    fetchEmployees();
  }
}, [userRole]);

  const handleTableChange = (paginationInfo) => {
    fetchEmployees(paginationInfo.current, paginationInfo.pageSize, searchQuery);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    fetchEmployees(1, pagination.pageSize, value);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowFormModal(true);
  };

  const handleDelete = async (employeeId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', employeeId));
      message.success('Employee deleted successfully');
      fetchEmployees(pagination.current, pagination.pageSize, searchQuery);
      getTotalCount();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Error deleting employee');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingEmployee(null);
  };

  const handleFormSuccess = () => {
    fetchEmployees(pagination.current, pagination.pageSize, searchQuery);
    getTotalCount();
  };

  // Enhanced table columns with better mobile handling
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: isMobile ? 200 : 250,
      render: (text, record) => (
        <div className="mobile-employee-info">
          <div className="mobile-employee-main">
            <Avatar 
              style={{ backgroundColor: '#1F4842' }}
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
                <div className="mobile-employee-tags">
                  <Tag color="orange" size="small">{record.role}</Tag>
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
        <Tag color="orange">{role}</Tag>
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
            style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
          />
          <Popconfirm
            title="Delete Employee"
            description="Are you sure you want to delete this employee?"
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
  if (userRole !== 'superadmin' && userRole !== 'admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <TeamOutlined style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
        <Title level={3}>Access Denied</Title>
        <Text type="secondary">You don't have permission to view employee management.</Text>
      </div>
    );
  }

  return (
    <div className="employee-management-wrapper">
      <div className="employee-management-content">
        <div className={`employee-management-container ${isMobile ? 'mobile-table' : ''}`} style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }} className="animated-card">
            <div className={`${isMobile ? 'mobile-header' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Title level={2} style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>Employee Management</Title>
                <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>Manage your team members and their access levels</Text>
              </div>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setShowFormModal(true)}
                style={{ backgroundColor: '#1F4842' }}
                size={isMobile ? "middle" : "large"}
              >
                Add Employee
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} className={isMobile ? 'mobile-stats' : ''}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed">
                <Statistic
                  title="Total Employees"
                  value={totalEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1F4842', fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-2">
                <Statistic
                  title="Active Employees"
                  value={activeEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#10b981', fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-3">
                <Statistic
                  title="Inactive Employees"
                  value={inactiveEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#ef4444', fontSize: isMobile ? '20px' : '24px' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Search Bar */}
          <Card style={{ marginBottom: '24px' }} className={`animated-card-delayed ${isMobile ? 'mobile-search' : ''}`}>
            <Search
              placeholder="Search employees by name or email..."
              allowClear
              enterButton={
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
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

          {/* Employee List - Mobile Cards or Table */}
          {isMobile ? (
            <Card className="animated-card-delayed-2" style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0 }}>Employee List</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {employees.length} of {pagination.total} employees
                </Text>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text>Loading employees...</Text>
                </div>
              ) : (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {employees.map((employee) => (
                    <MobileEmployeeCard
                      key={employee.id}
                      employee={employee}
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
                    onClick={() => fetchEmployees(pagination.current - 1, pagination.pageSize, searchQuery)}
                  >
                    Previous
                  </Button>
                  <Text style={{ fontSize: '12px' }}>
                    Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
                  </Text>
                  <Button 
                    size="small"
                    disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                    onClick={() => fetchEmployees(pagination.current + 1, pagination.pageSize, searchQuery)}
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
                dataSource={employees}
                rowKey="id"
                loading={loading}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} employees`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
                scroll={{ x: 800 }}
                size="middle"
              />
            </Card>
          )}

          {/* Form Modal */}
          <EmployeeFormModal
            isOpen={showFormModal}
            onClose={handleFormClose}
            editingEmployee={editingEmployee}
            onSuccess={handleFormSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;