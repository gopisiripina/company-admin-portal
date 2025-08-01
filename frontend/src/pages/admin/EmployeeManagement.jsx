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
  Upload,
  Select, DatePicker
} from 'antd';
import dayjs from 'dayjs';
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
import './Employee Management.css';
import ErrorPage from '../../error/ErrorPage';
const { Title, Text } = Typography;
const { Search } = Input;

const generateEmployeeId = (name) => {
  // Extract first and last word
  const words = name.trim().split(/\s+/);
  const firstWord = words[0];
  const lastWord = words.length > 1 ? words[words.length - 1] : words[0];
  
  // Get initials
  const initials = (firstWord.charAt(0) + lastWord.charAt(0)).toUpperCase();
  
  // Create hash from name + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const hashInput = name + timestamp;
  
  // Generate hash (you can use crypto-js library or this simple hash)
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Get last 3 characters equivalent
  const hashSuffix = Math.abs(hash).toString(16).slice(-3).toUpperCase();
  
  return `EMP${initials}${hashSuffix}`;
};
const sendWelcomeEmail = async (employeeData) => {
  try {
    const response = await fetch('https://ksvreddy4.pythonanywhere.com/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderEmail: "suryavenkatareddy90@gmail.com",
        senderPassword: "vrxftrjsiekrxdnf",
        recipientEmail: employeeData.email,
        subject: "Welcome - Your Account Credentials",
        smtpServer: "smtp.gmail.com",
        smtpPort: 587,
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
};

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
          {employee.employee_id && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {employee.employee_id}
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
    {employee.employee_id && (
      <Tag color="geekblue" size="small">{employee.employee_id}</Tag>
    )}
    {employee.created_at && (
      <Tag color="purple" size="small">
        {new Date(employee.created_at).toLocaleDateString()}
      </Tag>
    )}
    <Tag 
      color={employee.isactive ? 'green' : 'red'} 
      size="small"
    >
      {employee.isactive ? 'Active' : 'Inactive'}
    </Tag>
  </div>
    </div>
  </Card>
));

// Employee Form Modal Component
const EmployeeFormModal = React.memo(({ isOpen, onClose, editingEmployee, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
  if (isOpen) {
    if (editingEmployee) {
      setTimeout(() => {
        form.setFieldsValue({
  name: editingEmployee.name,
  email: editingEmployee.email,
  employeeId: editingEmployee.employee_id,
  department: editingEmployee.department, // Add this line
  role: editingEmployee.role,
  isActive: editingEmployee.isactive !== undefined ? editingEmployee.isactive : true,
  employeeType: editingEmployee.employee_type || 'full-time',
  startDate: editingEmployee.start_date ? dayjs(editingEmployee.start_date) : null,
  endDate: editingEmployee.end_date ? dayjs(editingEmployee.end_date) : null
});
        setProfileImage(editingEmployee.profileimage || null);
        setFaceEmbedding(editingEmployee.face_embedding || null);
      }, 0);
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: false });
      setProfileImage(null);
      setFaceEmbedding(null);
    }
  }
}, [editingEmployee, form, isOpen])

  useEffect(() => {
  if (!isOpen) {
    form.resetFields();
    setProfileImage(null);
    setFaceEmbedding(null);
    setUploadedFile(null); // ADD THIS LINE
    // Reset to default values
    form.setFieldsValue({ 
      isActive: false,
      employeeType: 'full-time'
    });
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

  const handleImageUpload = useCallback(async (file) => {
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

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload image');
      return false;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    setProfileImage(publicUrl);
    setUploadedFile(file); // Store the file for face embedding processing
    message.success('Image uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    message.error('Failed to upload image');
  }

  return false;
}, []);

const deleteOldProfileImage = useCallback(async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('profile-images')) return;
  
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `profile-images/${fileName}`;

    const { error } = await supabase.storage
      .from('profile-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting old image:', error);
    }
  } catch (error) {
    console.error('Error deleting old image:', error);
  }
}, []);
const handleSubmit = useCallback(async (values) => {
  setLoading(true);
  
  let finalFaceEmbedding = faceEmbedding;
  
  // If there's a new image file, get its embedding
  if (uploadedFile && profileImage !== editingEmployee?.profileimage) {
    try {
      console.log('Getting face embedding for new image...');
      const formData = new FormData();
      formData.append('image', uploadedFile);
      
      const embeddingResponse = await fetch('https://cap.myaccessio.com/api/get-face-embedding/', {
        method: 'POST',
        body: formData
      });
      
      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        console.log('Raw embedding data:', embeddingData);
        
        // Check if embedding exists and is an array
        if (embeddingData && embeddingData.embedding && Array.isArray(embeddingData.embedding)) {
          // CONVERT STRING ARRAY TO NUMERIC ARRAY
          finalFaceEmbedding = embeddingData.embedding.map(value => parseFloat(value));
          console.log('Face embedding received (converted to numbers):', finalFaceEmbedding);
          console.log('First few values:', finalFaceEmbedding.slice(0, 5));
        } else {
          console.error('Invalid embedding data structure:', embeddingData);
          finalFaceEmbedding = null;
        }
      } else {
        const errorText = await embeddingResponse.text();
        console.error('Failed to get face embedding:', embeddingResponse.status, errorText);
        finalFaceEmbedding = null;
      }
    } catch (error) {
      console.error('Face embedding API error:', error);
      finalFaceEmbedding = null;
    }
  }
  
  try {
    if (editingEmployee) {
      // If updating and there's a new image, delete the old one
      if (profileImage && profileImage !== editingEmployee.profileimage) {
        await deleteOldProfileImage(editingEmployee.profileimage);
      }

      // Update existing employee
      const updateData = {
  name: values.name,
  email: values.email,
  department: values.department, // Add this line
  role: values.role || 'employee',
  employee_id: editingEmployee.employee_id, // Keep existing ID
  isactive: values.isActive,
  profileimage: profileImage,
  employee_type: values.employeeType,
  start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
  end_date: values.employeeType === 'full-time' ? null : (values.endDate ? values.endDate.format('YYYY-MM-DD') : null),
  face_embedding: finalFaceEmbedding
};
      
      console.log('Updating employee with data:', updateData);
      
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
  department: values.department, // Add this line
  employee_id: generateEmployeeId(values.name), // Auto-generate ID
  role: 'employee',
  isactive: values.isActive !== undefined ? values.isActive : false,
  isfirstlogin: true,
  profileimage: profileImage,
  password: password,
  employee_type: values.employeeType,
  start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
  end_date: values.employeeType === 'full-time' ? null : (values.endDate ? values.endDate.format('YYYY-MM-DD') : null),
  face_embedding: finalFaceEmbedding
};
      
      console.log('Creating employee with data:', employeeData);
      
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
        const emailResult = await sendWelcomeEmail({
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
    setFaceEmbedding(null);
    setUploadedFile(null);
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
}, [editingEmployee, generatePassword, onSuccess, onClose, form, profileImage, deleteOldProfileImage, faceEmbedding, uploadedFile]);

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
    onClick={async () => {
      if (profileImage.includes('profile-images')) {
        await deleteOldProfileImage(profileImage);
      }
      setProfileImage(null);
    }}
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
  name="employeeType"
  label="Employee Type"
  rules={[{ required: true, message: 'Please select employee type' }]}
>
  <Select placeholder="Select employee type">
    <Select.Option value="full-time">Full-time</Select.Option>
    <Select.Option value="temporary">Temporary</Select.Option>
    <Select.Option value="internship">Internship</Select.Option>
  </Select>
</Form.Item>

<Form.Item
  name="startDate"
  label="Start Date"
  rules={[{ required: true, message: 'Please select start date' }]}
>
  <DatePicker style={{ width: '100%' }} />
</Form.Item>

<Form.Item
  shouldUpdate={(prevValues, currentValues) => 
    prevValues.employeeType !== currentValues.employeeType
  }
>
  {({ getFieldValue }) => {
    const employeeType = getFieldValue('employeeType');
    const showEndDate = employeeType === 'temporary' || employeeType === 'internship';
    
    return showEndDate ? (
      <Form.Item
        name="endDate"
        label="End Date"
        rules={[
          { required: true, message: 'Please select end date' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              const startDate = getFieldValue('startDate');
              if (!value || !startDate) return Promise.resolve();
              if (value.isAfter(startDate)) return Promise.resolve();
              return Promise.reject(new Error('End date must be after start date'));
            },
          }),
        ]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    ) : null;
  }}
</Form.Item>

        <Form.Item
  name="department"
  label="Department"
  rules={[{ required: true, message: 'Please enter department' }]}
>
  <Input placeholder="Enter department (e.g., Software Engineer)" />
</Form.Item>

<Form.Item
  name="employeeId"
  label="Employee ID"
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
const [filters, setFilters] = useState({
  employeeType: '',
  status: ''
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
    employee_id,
    isactive,
    profileimage,
    employee_type,
    start_date,
    end_date,
    created_at,
    updated_at,
    face_embedding,
    department
  `)
  .eq('role', 'employee')
  .order('created_at', { ascending: false });
      
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

  const applyFiltersAndPagination = useCallback((employeeList, search = '', page = 1, pageSize = 10, filterOptions = {}) => {
  let filteredEmployees = [...employeeList];
  
  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredEmployees = filteredEmployees.filter(employee =>
      employee.name?.toLowerCase().includes(searchLower) ||
      employee.email?.toLowerCase().includes(searchLower) ||
      (employee.employee_id && employee.employee_id.toLowerCase().includes(searchLower))
    );
  }
  
  // Employee Type filter
  if (filterOptions.employeeType) {
    filteredEmployees = filteredEmployees.filter(employee => 
      employee.employee_type === filterOptions.employeeType
    );
  }
  
  // Status filter
  if (filterOptions.status !== '') {
    const isActive = filterOptions.status === 'active';
    filteredEmployees = filteredEmployees.filter(employee => 
      employee.isactive === isActive
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

  const fetchEmployees = useCallback(async (page = 1, pageSize = 10, search = '', filterOptions = {}) => {
  try {
    setLoading(true);
    
    let employeeList = allEmployees;
    if (employeeList.length === 0) {
      employeeList = await fetchAllEmployees();
      setAllEmployees(employeeList);
    }
    
    applyFiltersAndPagination(employeeList, search, page, pageSize, filterOptions);
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
    applyFiltersAndPagination(employeeList, searchQuery, 1, pagination.pageSize, filters);
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    setLoading(false);
  }
}, [fetchAllEmployees, applyFiltersAndPagination, searchQuery, pagination.pageSize, filters]);

useEffect(() => {
  const subscription = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: 'role=eq.employee'
      },
      (payload) => {
        console.log('Real-time update received:', payload);
        
        if (payload.eventType === 'UPDATE') {
          setAllEmployees(prev => 
            prev.map(employee => 
              employee.id === payload.new.id ? payload.new : employee
            )
          );
          
          setEmployees(prev => 
            prev.map(employee => 
              employee.id === payload.new.id ? payload.new : employee
            )
          );
        } else if (payload.eventType === 'INSERT') {
          setAllEmployees(prev => [payload.new, ...prev]);
          refreshData();
        } else if (payload.eventType === 'DELETE') {
          setAllEmployees(prev => prev.filter(employee => employee.id !== payload.old.id));
          setEmployees(prev => prev.filter(employee => employee.id !== payload.old.id));
        }
      }
    )
    .subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [refreshData]);

  useEffect(() => {
  if (userRole === 'superadmin' || userRole === 'admin' || userRole === 'hr') {
    fetchEmployees(1, 10, '', {});
  }
}, [userRole, fetchEmployees]);
useEffect(() => {
  if (userRole === 'superadmin' || userRole === 'admin' || userRole === 'hr') {
    const initializeData = async () => {
      try {
        setLoading(true);
        const employeeList = await fetchAllEmployees();
        applyFiltersAndPagination(employeeList, '', 1, 10, {});
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }
}, [userRole]);
const handleEmployeeTypeFilter = useCallback((value) => {
  const newFilters = { ...filters, employeeType: value };
  setFilters(newFilters);
  applyFiltersAndPagination(allEmployees, searchQuery, 1, pagination.pageSize, newFilters);
}, [allEmployees, searchQuery, pagination.pageSize, applyFiltersAndPagination, filters]);

const handleStatusFilter = useCallback((value) => {
  const newFilters = { ...filters, status: value };
  setFilters(newFilters);
  applyFiltersAndPagination(allEmployees, searchQuery, 1, pagination.pageSize, newFilters);
}, [allEmployees, searchQuery, pagination.pageSize, applyFiltersAndPagination, filters]);

const handleClearFilters = useCallback(() => {
  const clearedFilters = { employeeType: '', status: '' };
  setFilters(clearedFilters);
  setSearchQuery('');
  applyFiltersAndPagination(allEmployees, '', 1, pagination.pageSize, clearedFilters);
}, [allEmployees, pagination.pageSize, applyFiltersAndPagination]);

  const handleTableChange = useCallback((paginationInfo) => {
  applyFiltersAndPagination(allEmployees, searchQuery, paginationInfo.current, paginationInfo.pageSize, filters);
}, [allEmployees, searchQuery, applyFiltersAndPagination, filters]);

  const handleSearch = useCallback((value) => {
  setSearchQuery(value);
  applyFiltersAndPagination(allEmployees, value, 1, pagination.pageSize, filters);
}, [allEmployees, pagination.pageSize, applyFiltersAndPagination, filters]);

  const handleEdit = useCallback((employee) => {
    setEditingEmployee(employee);
    setShowFormModal(true);
  }, []);

  const handleDelete = useCallback(async (employeeId) => {
  try {
    setLoading(true);
    
    // First, delete all attendance records for this employee
    const { error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('user_id', employeeId);

    if (attendanceError) {
      console.error('Delete attendance error:', attendanceError);
      throw attendanceError;
    }

    // Then delete the employee
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', employeeId)
      .eq('role', 'employee');

    if (error) {
      console.error('Delete employee error:', error);
      throw error;
    }
    
    message.success('Employee and all related records deleted successfully');
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
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employeeId',
      width: 120,
      render: (employeeId) => (
        <Tag color="geekblue">{employeeId || 'N/A'}</Tag>
      ),
      responsive: ['md'],
    },
    {
  title: 'Employee Type',
  dataIndex: 'employee_type',
  key: 'employeeType',
  width: 120,
  render: (type) => {
    const colors = {
      'full-time': 'green',
      'temporary': 'orange',
      'internship': 'blue'
    };
    return <Tag color={colors[type]}>{type}</Tag>;
  },
  responsive: ['lg'],
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
    return <ErrorPage errorType="403" />;
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
  <div style={{ 
    display: 'flex', 
    flexDirection: isMobile ? 'column' : 'row', 
    gap: '16px',
    alignItems: isMobile ? 'stretch' : 'flex-end'
  }}>
    <div style={{ flex: 1 }}>
      <Search
        placeholder="Search employees by name, email or employee ID..."
        allowClear
        value={searchQuery}
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
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
    
    <div style={{ 
      display: 'flex', 
      gap: '12px',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      <Select
        placeholder="Employee Type"
        allowClear
        value={filters.employeeType || undefined}
        onChange={handleEmployeeTypeFilter}
        style={{ width: isMobile ? '100%' : '150px' }}
        size={isMobile ? "middle" : "large"}
      >
        <Select.Option value="full-time">Full-time</Select.Option>
        <Select.Option value="temporary">Temporary</Select.Option>
        <Select.Option value="internship">Internship</Select.Option>
      </Select>
      
      <Select
        placeholder="Status"
        allowClear
        value={filters.status || undefined}
        onChange={handleStatusFilter}
        style={{ width: isMobile ? '100%' : '120px' }}
        size={isMobile ? "middle" : "large"}
      >
        <Select.Option value="active">Active</Select.Option>
        <Select.Option value="inactive">Inactive</Select.Option>
      </Select>
      
      <Button 
        onClick={handleClearFilters}
        size={isMobile ? "middle" : "large"}
        disabled={!searchQuery && !filters.employeeType && !filters.status}
      >
        Clear All
      </Button>
    </div>
  </div>
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
