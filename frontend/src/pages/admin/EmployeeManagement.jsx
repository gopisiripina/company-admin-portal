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
  Switch,
  Upload
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
import { sendEmployeeWelcomeEmail, initEmailJS } from '../email/EmailService';
import './Employee Management.css';

const { Title, Text } = Typography;
const { Search } = Input;

// Mobile Employee Card Component
const MobileEmployeeCard = React.memo(({ employee, onEdit, onDelete }) => (
  <Card 
    size="small" 
    className="mobile-employee-card"
    style={{ marginBottom: '12px' }}
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
          src={employee.profileimage}
          icon={!employee.profileimage && <UserOutlined />}
        >
          {!employee.profileimage && employee.name?.charAt(0)?.toUpperCase()}
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
            {employee.name}
          </div>
          <Text type="secondary" style={{ 
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            <MailOutlined /> {employee.email}
          </Text>
          {employee.employeeid && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {employee.employeeid}
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
        <Tag color="blue" size="small">{employee.role}</Tag>
        <Tag color={employee.isactive ? 'green' : 'red'} size="small">
          {employee.isactive ? 'Active' : 'Inactive'}
        </Tag>
        {employee.employeeid && (
          <Tag color="geekblue" size="small">{employee.employeeid}</Tag>
        )}
        {employee.createdat && (
          <Tag color="purple" size="small">
            {new Date(employee.createdat).toLocaleDateString()}
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
            employeeId: editingEmployee.employeeid,
            role: editingEmployee.role,
            isActive: editingEmployee.isactive !== undefined ? editingEmployee.isactive : true
          });
          setProfileImage(editingEmployee.profileimage || null);
        }, 0);
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: false });
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }, []);

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
      if (editingEmployee) {
        // Update existing employee
        const updateData = {
          name: values.name,
          email: values.email,
          role: values.role || 'employee',
          employeeid: values.employeeId,
          isactive: values.isActive,
          profileimage: profileImage,
          updatedat: new Date().toISOString()
        };
        
        const { data, error } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', editingEmployee.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        
        message.success('Employee updated successfully');
      } else {
        // Create new employee
        const password = generatePassword();
        const employeeData = {
          name: values.name,
          email: values.email,
          employeeid: values.employeeId,
          role: 'employee',
          isactive: values.isActive !== undefined ? values.isActive : false,
          isfirstlogin: true,
          profileimage: profileImage,
          password: password, // In production, hash this password
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        };
        
        const { data, error } = await supabaseAdmin
          .from('users')
          .insert([employeeData])
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        
        message.success('Employee created successfully!');
        
        // Send welcome email
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
      
      if (error.code === '23505') {
        message.error('An employee with this email already exists.');
      } else {
        message.error(`Error saving employee: ${error.message || 'Unknown error'}`);
      }
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
      destroyOnHidden
      className="employee-form-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'employee', isActive: false }}
      >
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
          name="employeeId"
          label="Employee ID"
          rules={[
            { required: true, message: 'Please enter employee ID' },
            { pattern: /^[A-Z0-9]+$/, message: 'Employee ID should contain only uppercase letters and numbers' }
          ]}
        >
          <Input 
            placeholder="Enter employee ID (e.g., EMP001)" 
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
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

  const { totalEmployees, activeEmployees, inactiveEmployees } = useMemo(() => {
    const total = allEmployees.length;
    const active = allEmployees.filter(employee => employee.isactive === true).length;
    const inactive = total - active;
    
    return { totalEmployees: total, activeEmployees: active, inactiveEmployees: inactive };
  }, [allEmployees]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchAllEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          employeeid,
          isactive,
          profileimage,
          createdat,
          updatedat
        `)
        .eq('role', 'employee')
        .order('createdat', { ascending: false });
      
      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      
      setAllEmployees(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error(`Error loading employees: ${error.message}`);
      return [];
    }
  }, []);

  const applyFiltersAndPagination = useCallback((employeeList, search = '', page = 1, pageSize = 10) => {
    let filteredEmployees = [...employeeList];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(employee =>
        employee.name?.toLowerCase().includes(searchLower) ||
        employee.email?.toLowerCase().includes(searchLower) ||
        (employee.employeeid && employee.employeeid.toLowerCase().includes(searchLower))
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

  useEffect(() => {
    if (userRole === 'superadmin' || userRole === 'admin') {
      const emailInitialized = initEmailJS();
      if (!emailInitialized) {
        console.warn('EmailJS initialization failed - emails may not work');
      }
      
      fetchEmployees();
    }
  }, [userRole, fetchEmployees]);

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
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', employeeId)
        .eq('role', 'employee');

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      message.success('Employee deleted successfully');
      await refreshData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Error deleting employee: ' + (error.message || 'Unknown error'));
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

  const columns = useMemo(() => [
    {
      title: 'Employee',
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
            {!record.profileimage && text?.charAt(0)?.toUpperCase()}
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
                <Tag color="blue" size="small">{record.role}</Tag>
                <Tag color={record.isactive ? 'green' : 'red'} size="small">
                  {record.isactive ? 'Active' : 'Inactive'}
                </Tag>
                {record.employeeid && (
                  <Tag color="geekblue" size="small">{record.employeeid}</Tag>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Employee ID',
      dataIndex: 'employeeid',
      key: 'employeeId',
      width: 120,
      render: (employeeId) => (
        <Tag color="geekblue">{employeeId || 'N/A'}</Tag>
      ),
      responsive: ['md'],
    },
    {
      title: 'Status',
      dataIndex: 'isactive',
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
      dataIndex: 'createdat',
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

  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'hr') {
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

          <Card style={{ marginBottom: '24px' }} className={`animated-card-delayed ${isMobile ? 'mobile-search' : ''}`}>
            <Search
              placeholder="Search employees by name, email or employee ID..."
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