import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Switch
} from 'antd';
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  TeamOutlined,
  MailOutlined,
   UploadOutlined, UserOutlined
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
  orderBy
} from 'firebase/firestore';
import { sendEmployeeWelcomeEmail, initEmailJS } from './EmailService';
import '../styles/Employee Management.css';
import { Upload, message as antMessage } from 'antd';
const { Title, Text } = Typography;
const { Search } = Input;

// Mobile Employee Card Component
const MobileEmployeeCard = React.memo(({ employee, onEdit, onDelete }) => (
  <Card 
    size="small" 
    className="mobile-employee-card"
    actions={[
      <Button 
        key="edit"
        type="primary" 
        icon={<EditOutlined />} 
        size="small"
        onClick={() => onEdit(employee)}
        className="brand-primary"
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
          src={employee.profileImage}
          icon={!employee.profileImage && <UserOutlined />}
        >
          {!employee.profileImage && employee.name.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{employee.name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {employee.email}
          </Text>
        </div>
      </div>
      <div className="mobile-employee-tags">
        <Tag color="blue" size="small">{employee.role}</Tag>
        <Tag color={employee.isActive ? 'green' : 'red'} size="small">
          {employee.isActive ? 'Active' : 'Inactive'}
        </Tag>
        {employee.createdAt && (
          <Tag color="geekblue" size="small">
            {employee.createdAt?.toDate ? employee.createdAt.toDate().toLocaleDateString() : 'Unknown'}
          </Tag>
        )}
      </div>
    </div>
  </Card>
));

// Employee Form Modal Component
const EmployeeFormModal = React.memo(({ isOpen, onClose, editingEmployee, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (editingEmployee) {
        setTimeout(() => {
          form.setFieldsValue({
            name: editingEmployee.name,
            email: editingEmployee.email,
            role: editingEmployee.role,
            isActive: editingEmployee.isActive !== undefined ? editingEmployee.isActive : true
          });
          setProfileImage(editingEmployee.profileImage || null);
        }, 0);
      } else {
        form.resetFields();
        setProfileImage(null);
      }
    }
  }, [editingEmployee, form, isOpen]);

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
    
    return false; // Prevent default upload
  }, []);

  const handleSubmit = useCallback(async (values) => {
    setLoading(true);
    
    try {
      if (editingEmployee) {
        const docRef = doc(db, 'users', editingEmployee.id);
        const updateData = {
          name: values.name,
          email: values.email,
          role: values.role || 'employee',
          isActive: values.isActive !== undefined ? values.isActive : true,
          profileImage: profileImage,
          updatedAt: new Date()
        };
        
        await updateDoc(docRef, updateData);
        message.success('Employee updated successfully');
      } else {
        const password = generatePassword();
        const employeeData = {
          name: values.name,
          email: values.email,
          role: 'employee',
          isActive: values.isActive !== undefined ? values.isActive : true,
          profileImage: profileImage,
          password,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), employeeData);
        message.success('Employee created successfully!');
        
        try {
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
          }
        } catch (emailError) {
          console.error('Email send failed:', emailError);
          message.warning('Employee created but email could not be sent.');
        }
      }

      form.resetFields();
      setProfileImage(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      
      const errorMessages = {
        'permission-denied': 'Permission denied. Check your Firestore security rules.',
        'unavailable': 'Firebase service is currently unavailable. Please try again.',
        'invalid-argument': 'Invalid data provided. Please check your inputs.'
      };
      
      message.error(errorMessages[error.code] || `Error saving employee: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [editingEmployee, generatePassword, onSuccess, onClose, form, profileImage]);

  return (
    <Modal
      title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
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
        initialValues={{ role: 'employee', isActive: true }}
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
              className="brand-primary"
            >
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
});

// Main Employee Management Component
const EmployeeManagement = ({ userRole }) => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Use useMemo for calculations
  const { totalEmployees, activeEmployees, inactiveEmployees } = useMemo(() => {
    const total = allEmployees.length;
    const active = allEmployees.filter(employee => employee.isActive === true).length;
    const inactive = total - active;
    
    return { totalEmployees: total, activeEmployees: active, inactiveEmployees: inactive };
  }, [allEmployees]);

  // Check if mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all employees
  const fetchAllEmployees = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'employee'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const employeeList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setAllEmployees(employeeList);
      return employeeList;
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error(`Error loading employees: ${error.message}`);
      return [];
    }
  }, []);

  // Apply filters and pagination
  const applyFiltersAndPagination = useCallback((employeeList, search = '', page = 1, pageSize = 10) => {
    let filteredEmployees = [...employeeList];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(employee =>
        employee.name.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower)
      );
    }
    
    const total = filteredEmployees.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + pageSize);
    
    setEmployees(paginatedEmployees);
    setPagination({
      current: page,
      pageSize: pageSize,
      total: total
    });
    
    return paginatedEmployees;
  }, []);

  // Fetch employees with pagination
  const fetchEmployees = useCallback(async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      
      let employeeList = allEmployees;
      if (employeeList.length === 0) {
        employeeList = await fetchAllEmployees();
      }
      
      applyFiltersAndPagination(employeeList, search, page, pageSize);
    } catch (error) {
      console.error('Error in fetchEmployees:', error);
      message.error(`Error loading employees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [allEmployees, fetchAllEmployees, applyFiltersAndPagination]);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const employeeList = await fetchAllEmployees();
      applyFiltersAndPagination(employeeList, searchQuery, 1, pagination.pageSize);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAllEmployees, applyFiltersAndPagination, searchQuery, pagination.pageSize]);

  // Initialize component
  useEffect(() => {
    if (userRole === 'superadmin' || userRole === 'admin') {
      const emailInitialized = initEmailJS();
      if (!emailInitialized) {
        console.warn('EmailJS initialization failed - emails may not work');
      }
      
      fetchEmployees();
    }
  }, [userRole, fetchEmployees]);

  // Event handlers
  const handleTableChange = useCallback((paginationInfo) => {
    applyFiltersAndPagination(allEmployees, searchQuery, paginationInfo.current, paginationInfo.pageSize);
  }, [allEmployees, searchQuery, applyFiltersAndPagination]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    applyFiltersAndPagination(allEmployees, value, 1, pagination.pageSize);
  }, [allEmployees, pagination.pageSize, applyFiltersAndPagination]);

  const handleEdit = useCallback((employee) => {
    setEditingEmployee(employee);
    setShowFormModal(true);
  }, []);

  const handleDelete = useCallback(async (employeeId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', employeeId));
      message.success('Employee deleted successfully');
      await refreshData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Error deleting employee');
    } finally {
      setLoading(false);
    }
  }, [refreshData]);

  const handleFormClose = useCallback(() => {
    setShowFormModal(false);
    setEditingEmployee(null);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  // Table columns with memoization
const columns = useMemo(() => [
  {
    title: 'Employee',
    dataIndex: 'name',
    key: 'name',
    fixed: 'left',
    width: isMobile ? 200 : 250,
    render: (text, record) => (
      <div className={isMobile ? 'mobile-employee-info' : 'employee-info'}>
        <div className={isMobile ? 'mobile-employee-main' : 'employee-main'}>
          <Avatar 
            style={{ backgroundColor: '#1F4842' }}
            size={isMobile ? "default" : "large"}
            src={record.profileImage}
            icon={!record.profileImage && <UserOutlined />}
          >
            {!record.profileImage && text.charAt(0).toUpperCase()}
          </Avatar>
          <div className="employee-details">
            <div style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '14px' }}>{text}</div>
            <Text type="secondary" style={{ fontSize: isMobile ? '10px' : '12px' }}>
              <MailOutlined /> {record.email}
            </Text>
            {isMobile && (
              <div className="mobile-employee-tags">
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
  ], [isMobile, handleEdit, handleDelete]);

  // Permission check - Allow both superadmin and admin
  if (userRole !== 'superadmin' && userRole !== 'admin') {
    return (
      <div className="access-denied">
        <TeamOutlined className="access-denied-icon" />
        <Title level={3}>Access Denied</Title>
        <Text type="secondary">You don't have permission to view employee management.</Text>
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
                  Employee Management
                </Title>
                <Text type="secondary" className={isMobile ? 'responsive-subtitle' : ''}>
                  Manage employee users and their access levels
                </Text>
              </div>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setShowFormModal(true)}
                className="brand-primary"
                size={isMobile ? "middle" : "large"}
              >
                Add Employee
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} className={isMobile ? 'mobile-stats' : ''}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed stats-card">
                <Statistic
                  title="Total Employees"
                  value={totalEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1F4842' }}
                  className={isMobile ? 'responsive-stat-value' : ''}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-2 stats-card">
                <Statistic
                  title="Active Employees"
                  value={activeEmployees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#10b981' }}
                  className={isMobile ? 'responsive-stat-value' : ''}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="animated-card-delayed-3 stats-card">
                <Statistic
                  title="Inactive Employees"
                  value={inactiveEmployees}
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
              placeholder="Search employees by name or email..."
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