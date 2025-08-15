import React, { useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Descriptions,
  Tag,
  Button,
  Tabs,
  Progress,
  Timeline,
  Rate,
  Table,
  List,
  Statistic,
  Badge,
  Space,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Tooltip,
  Alert,
  Spin,
  Empty,
  Drawer,
  Switch,
  Breadcrumb,
  Grid 
  // Removed PageHeader - it's deprecated in Ant Design v5
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CalendarOutlined,
  BankOutlined,
  TrophyOutlined,
  BookOutlined,
  TeamOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UploadOutlined,
  LinkedinOutlined,
  GithubOutlined,
  TwitterOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  MoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase,supabaseAdmin  } from '../../supabase/config'; // Add this line

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { confirm } = Modal;
const { useBreakpoint } = Grid;
export default function EmployeeProfileModal({ isVisible, onClose, userData, isLoading = false }) {
    
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isViewMode, setIsViewMode] = useState(true);
  const [form] = Form.useForm();
  const [documentForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [isEditPersonalVisible, setIsEditPersonalVisible] = useState(false);
const [personalForm] = Form.useForm();
const [profileImagePreview, setProfileImagePreview] = useState(null);
const screens = useBreakpoint();



const handleProfileClick = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, name, email, role, profileimage, mobile, department, start_date, end_date, isactive, pay,
      payroll ( net_pay )
    `)
    .eq('id', userData.id) // use logged-in user's id or selected employee id
    .single();

  if (!error && data) {
    setUserData(data); // Now EmployeeProfileModal will get full DB data
    setShowProfileModal(true);
  } else {
    console.error('Error fetching profile:', error);
  }
};


  // Enhanced employee data with more professional structure
  const employeeData = {
  id: userData?.employeeId || userData?.id || 'EMP-001',
  name: userData?.name || 'John Doe',
  position: userData?.role || 'employee',
  department: userData?.department || 'Not specified',
  email: userData?.email || 'employee@company.com',
  mobile: userData?.mobile || 'Not provided', // Using mobile instead of phone
  workPhone: userData?.work_phone || 'Not provided',
  address: userData?.address || 'Not provided',
  joinDate: userData?.start_date || userData?.joinDate, // Using start_date from your DB
  birthDate: userData?.birth_date || userData?.birthDate,
  employeeType: userData?.employee_type || 'full-time',
  status: userData?.isActive ? 'Active' : 'Inactive',
  // salary: userData?.payroll?.[0]?.net_pay
  // ? `₹${userData.payroll[0].net_pay}`
  // : userData?.pay
  //   ? `₹${userData.pay}`
  //   : 'Not specified',
  salary:userData?.pay || 'Not specified',
  avatar: userData?.profileimage || null,
    band: userData?.band || 'L5',
    location: userData?.location || 'New York Office',
    timezone: userData?.timezone || 'EST (UTC-5)',
    skills: userData?.technical_skills || ['No Skills Provided'],
    experience: userData?.total_experience || 'Not specified',

    education: userData?.education || 'Master of Computer Science',
    certifications: userData?.certifications || ['No Certifications Provided'],
    languages: userData?.languages || ['No Languages Provided'],
    emergencyContact: userData?.emergencyContact || {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1 (555) 456-7890'
    },
    socialLinks: userData?.socialLinks || {
      linkedin: userData?.linkedin_url ||'https://www.linkedin.com/in/',
      github: userData?.github_url || 'https://github.com/',
      twitter: userData?.twitter_url || 'https://x.com/' // Default to a placeholder
    },
    
    lastActive: userData?.lastActive || '2024-01-15 09:30:00',
    workAnniversary: userData?.workAnniversary || '2024-03-15'
  };

  // Enhanced performance data
  const performanceData = [
    { 
      quarter: 'Q4 2024', 
      rating: 4.9, 
      goals: 12, 
      achieved: 11, 
      feedback: 'Exceptional performance in leading critical projects',
      reviewer: 'Sarah Wilson'
    },
    { 
      quarter: 'Q3 2024', 
      rating: 4.6, 
      goals: 9, 
      achieved: 8, 
      feedback: 'Strong technical leadership and mentoring skills',
      reviewer: 'Sarah Wilson'
    },
    { 
      quarter: 'Q2 2024', 
      rating: 4.8, 
      goals: 10, 
      achieved: 9, 
      feedback: 'Outstanding contribution to platform architecture',
      reviewer: 'Sarah Wilson'
    },
    { 
      quarter: 'Q1 2024', 
      rating: 4.5, 
      goals: 8, 
      achieved: 7, 
      feedback: 'Consistent high-quality deliverables',
      reviewer: 'Sarah Wilson'
    }
  ];

  // Enhanced projects data
  const projectsData = [
    {
      key: '1',
      project: 'Enterprise Platform Modernization',
      role: 'Technical Lead',
      status: 'Completed',
      priority: 'High',
      startDate: '2023-01-15',
      endDate: '2023-12-20',
      completion: 100,
      team: 8,
      budget: '$2.5M',
      client: 'Internal - Platform Team'
    },
    {
      key: '2',
      project: 'Mobile Banking Application',
      role: 'Senior Developer',
      status: 'In Progress',
      priority: 'Critical',
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      completion: 78,
      team: 12,
      budget: '$1.8M',
      client: 'Banking Division'
    },
    {
      key: '3',
      project: 'API Gateway Implementation',
      role: 'Architecture Consultant',
      status: 'Planning',
      priority: 'Medium',
      startDate: '2024-03-01',
      endDate: '2024-08-15',
      completion: 15,
      team: 6,
      budget: '$800K',
      client: 'Infrastructure Team'
    }
  ];

  // Enhanced timeline data
  const timelineData = [
    {
      children: (
        <div>
          <Text strong>Promoted to Senior Software Engineer</Text>
          <br />
          <Text type="secondary">Recognition for outstanding performance and leadership</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>January 2024</Text>
        </div>
      ),
      dot: <TrophyOutlined style={{ color: '#52c41a', fontSize: '16px' }} />,
      color: 'green'
    },
    {
      children: (
        <div>
          <Text strong>AWS Solutions Architect Certification</Text>
          <br />
          <Text type="secondary">Professional certification in cloud architecture</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>October 2023</Text>
        </div>
      ),
      dot: <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: '16px' }} />,
      color: 'blue'
    },
    {
      children: (
        <div>
          <Text strong>Led Enterprise Platform Project</Text>
          <br />
          <Text type="secondary">Successfully delivered $2.5M platform modernization</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>January 2023</Text>
        </div>
      ),
      dot: <ProjectOutlined style={{ color: '#faad14', fontSize: '16px' }} />,
      color: 'orange'
    },
    {
      children: (
        <div>
          <Text strong>Joined as Software Engineer</Text>
          <br />
          <Text type="secondary">Started career journey at the company</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>March 2021</Text>
        </div>
      ),
      dot: <UserOutlined style={{ color: '#722ed1', fontSize: '16px' }} />,
      color: 'purple'
    }
  ];

  // Documents data
  const documentsData = [
    {
      key: '1',
      name: 'Employment_Contract_2024.pdf',
      type: 'Contract',
      size: '2.1 MB',
      uploadDate: '2024-01-15',
      status: 'Active'
    },
    {
      key: '2',
      name: 'Performance_Review_Q4_2023.pdf',
      type: 'Performance',
      size: '1.5 MB',
      uploadDate: '2024-01-02',
      status: 'Archived'
    },
    {
      key: '3',
      name: 'AWS_Certification.pdf',
      type: 'Certification',
      size: '856 KB',
      uploadDate: '2023-10-20',
      status: 'Valid'
    },
    {
      key: '4',
      name: 'Emergency_Contacts.pdf',
      type: 'Personal',
      size: '245 KB',
      uploadDate: '2023-03-15',
      status: 'Current'
    }
  ];

  // Enhanced table columns
  const projectColumns = [
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: '25%',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: '15%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status) => {
        const statusConfig = {
          'Completed': { color: 'success', icon: <CheckCircleOutlined /> },
          'In Progress': { color: 'processing', icon: <ClockCircleOutlined /> },
          'Planning': { color: 'warning', icon: <ExclamationCircleOutlined /> }
        };
        const config = statusConfig[status] || { color: 'default', icon: null };
        return <Badge status={config.color} text={status} />;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: '10%',
      render: (priority) => {
        const colors = {
          'Critical': 'red',
          'High': 'orange',
          'Medium': 'blue',
          'Low': 'green'
        };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      }
    },
    {
      title: 'Progress',
      dataIndex: 'completion',
      key: 'completion',
      width: '15%',
      render: (completion) => (
        <Progress 
          percent={completion} 
          size="small" 
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      ),
    },
    {
      title: 'Team Size',
      dataIndex: 'team',
      key: 'team',
      width: '8%',
      render: (team) => <Text>{team} members</Text>
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: '10%',
      render: (budget) => <Text strong style={{ color: '#52c41a' }}>{budget}</Text>
    }
  ];

  const documentColumns = [
    {
      title: 'Document Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <FileTextOutlined />
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          'Contract': 'blue',
          'Performance': 'green',
          'Certification': 'gold',
          'Personal': 'purple'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Active': 'success',
          'Archived': 'default',
          'Valid': 'processing',
          'Current': 'success'
        };
        return <Badge status={colors[status]} text={status} />;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Document">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Download">
            <Button type="text" size="small" icon={<DownloadOutlined />} />
          </Tooltip>
        </Space>
      ),
    }
  ];

  const handleEdit = useCallback(() => {
  setIsEditModalVisible(true);
  
  // Initialize main form
  form.setFieldsValue({
    ...employeeData,
    joinDate: employeeData.joinDate ? dayjs(employeeData.joinDate) : null,
    birthDate: employeeData.birthDate ? dayjs(employeeData.birthDate) : null
  });
  
  // ADD THIS: Initialize personal form when modal opens
  personalForm.setFieldsValue({
    workPhone: employeeData.workPhone,
    address: employeeData.address,
    birthDate: employeeData.birthDate ? dayjs(employeeData.birthDate) : null
  });
}, [employeeData, form, personalForm]);
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

    setProfileImagePreview(publicUrl);
    message.success('Image uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    message.error('Failed to upload image');
  }

  return false;
}, []);
 const handleEditSubmit = async () => {
  try {
    const values = await form.validateFields();
    
    const { data, error } = await supabase // Make sure using supabase, not supabaseAdmin
      .from('users')
      .update({
        education: values.education,
        total_experience: values.totalExperience,
        technical_skills: values.technicalSkills,
        certifications: values.certifications,
        languages: values.languages,
        linkedin_url: values.linkedinUrl,
        github_url: values.githubUrl,
        twitter_url: values.twitterUrl,
        profileimage: profileImagePreview || employeeData.avatar
      })
      .eq('employee_id', employeeData.id); // Change from 'id' to 'employee_id' (or whatever column contains MYAEMP005)

    if (error) {
      console.error('Supabase error:', error); // Add error logging
      throw error;
    }
    
    message.success('Skills & Education updated successfully');
    setIsEditModalVisible(false);
    // Refresh employee data here
  } catch (error) {
    console.error('Full error:', error); // Add error logging
    message.error(`Failed to update skills & education: ${error.message}`);
  }
};
const handlePersonalInfoSave = async () => {
  try {
    const values = await personalForm.validateFields();
    
    const updateData = {
      work_phone: values.workPhone,
      address: values.address,
      birth_date: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null
    };
    
    // Change this line - use the correct column name
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('employee_id', employeeData.id); // or .eq('emp_code', employeeData.id)

    if (error) throw error;
    
    message.success('Personal information updated successfully');
    setIsEditPersonalVisible(false);
  } catch (error) {
    console.error('Full error:', error);
    message.error(`Failed to update personal information: ${error.message}`);
  }
};
  const handlePrintProfile = useCallback(() => {
    window.print();
  }, []);

  const handleExportProfile = useCallback(() => {
    message.info('Export functionality will be implemented');
  }, []);

  const uploadProps = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
      authorization: 'authorization-text',
    },
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type.startsWith('image/') ||
                         file.type.includes('document');
      if (!isValidType) {
        message.error('You can only upload PDF, image, or document files!');
        return false;
      }
      const isValidSize = file.size / 1024 / 1024 < 10;
      if (!isValidSize) {
        message.error('File must be smaller than 10MB!');
        return false;
      }
      return true;
    },
    onChange(info) {
      if (info.file.status === 'uploading') {
        setUploading(true);
      } else if (info.file.status === 'done') {
        setUploading(false);
        message.success(`${info.file.name} uploaded successfully`);
      } else if (info.file.status === 'error') {
        setUploading(false);
        message.error(`${info.file.name} upload failed.`);
      }
    },
  };

  const headerActions = (
    <Space>
      <Tooltip title="Print Profile">
        <Button icon={<PrinterOutlined />} onClick={handlePrintProfile} />
      </Tooltip>
      <Tooltip title="Export Profile">
        <Button icon={<ShareAltOutlined />} onClick={handleExportProfile} />
      </Tooltip>
      <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
        Edit Profile
      </Button>
    </Space>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading employee profile..." />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item>HR Management</Breadcrumb.Item>
        <Breadcrumb.Item>Employees</Breadcrumb.Item>
        <Breadcrumb.Item>{employeeData.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Profile Header */}
      <Card 
        style={{ 
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col xs={24} sm={24} md={18} lg={18} xl={18}>
            <Row  align="middle" gutter={[16, 16]}>
              <Col xs={24} sm={8} md={6} lg={4}>
                <div style={{ position: 'relative' }}>
                  <Avatar 
                    size={120} 
                    src={employeeData.avatar || "/api/placeholder/140/140"} 
                    icon={<UserOutlined />}
                    style={{ 
                      border: '4px solid #fff',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Badge 
                    status={employeeData.status === 'Active' ? 'success' : 'default'} 
                    style={{ 
                      position: 'absolute', 
                      bottom: '10px', 
                      right: '10px',
                      // backgroundColor: '#fff',
                      borderRadius: '5\0%',
                      padding: '4px'
                    }} 
                  />
                </div>
              </Col>
              <Col xs={24} sm={16} md={18} lg={20}>
                <Title level={2} style={{ margin: 0, color: '#1f2937',fontSize: { xs: '20px', sm: '24px', md: '30px' } }}>
                  {employeeData.name}
                </Title>
                <Text 
                  style={{ 
                    fontSize: '18px', 
                    color: '#6b7280', 
                    display: 'block', 
                    marginBottom: '12px',
                    fontWeight: 500
                  }}
                >
                  {employeeData.position} • {employeeData.department}
                </Text>
                
                <Space size="middle" wrap style={{ marginBottom: '16px' }}>
                  <Tag color="blue" icon={<UserOutlined />} style={{ fontSize: '13px', padding: '4px 12px' }}>
                    {employeeData.id}
                  </Tag>
                  <Tag color="green" icon={<CalendarOutlined />} style={{ fontSize: '13px', padding: '4px 12px' }}>
                    {employeeData.employeeType}
                  </Tag>
                  <Tag color="gold" style={{ fontSize: '13px', padding: '4px 12px' }}>
                    Band {employeeData.band}
                  </Tag>
                  <Tag 
                    color={employeeData.status === 'Active' ? 'success' : 'default'}
                    style={{ fontSize: '13px', padding: '4px 12px' }}
                  >
                    {employeeData.status}
                  </Tag>
                </Space>

                <Space size="large">
                  <Tooltip title="LinkedIn Profile">
                    <LinkedinOutlined 
                      style={{ fontSize: '24px', color: '#0077b5', cursor: 'pointer' }} 
                      onClick={() => window.open(employeeData.socialLinks.linkedin, '_blank')}
                    />
                  </Tooltip>
                  <Tooltip title="GitHub Profile">
                    <GithubOutlined 
                      style={{ fontSize: '24px', color: '#333', cursor: 'pointer' }}
                      onClick={() => window.open(employeeData.socialLinks.github, '_blank')}
                    />
                  </Tooltip>
                  <Tooltip title="Twitter Profile">
                    <TwitterOutlined 
                      style={{ fontSize: '24px', color: '#1da1f2', cursor: 'pointer' }}
                      onClick={() => window.open(employeeData.socialLinks.twitter, '_blank')}
                    />
                  </Tooltip>
                </Space>

                <div style={{ marginTop: '16px' }}>
                  <Space split={<Divider type="vertical" />}>
                    <Text type="secondary">
                      <CalendarOutlined /> Joined {dayjs(employeeData.joinDate).format('MMM DD, YYYY')}
                    </Text>
                    <Text type="secondary">
                      <ClockCircleOutlined /> {employeeData.timezone}
                    </Text>
                    <Text type="secondary">
                      <HomeOutlined /> {employeeData.location}
                    </Text>
                  </Space>
                </div>
              </Col>
            </Row>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6} xl={6}>
            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              {headerActions}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          style={{ minHeight: '500px' }}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <UserOutlined />
                  Overview
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  {/* Personal Information */}
              {/* Personal Information - UPDATE THIS SECTION */}
<Col xs={24} sm={24} md={12} lg={12} xl={12}>
  <Card 
    title={
      <Space>
        <UserOutlined style={{ color: '#1890ff' }} />
        Personal Information
        <Button 
          type="link" 
          icon={<EditOutlined />} 
          onClick={() => setIsEditPersonalVisible(true)}
          style={{ marginLeft: 'auto' }}
        >
          Edit
        </Button>
      </Space>
    }
    size="small"
    style={{ height: '100%' }}
  >
    <Descriptions 
  column={1} 
  size="small" 
  layout={screens.md ? "horizontal" : "vertical"}
  labelStyle={screens.md ? { 
    width: '140px', 
    fontWeight: 600 
  } : { 
    fontWeight: 600,
    fontSize: '13px',
    color: '#8c8c8c',
    marginBottom: '4px'
  }}
  contentStyle={!screens.md ? {
    fontSize: '15px',
    marginBottom: '12px'
  } : {}}
>
      <Descriptions.Item label="Full Name">
        <Text strong>{employeeData.name}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="Employee ID">
        <Text code>{employeeData.id}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="Email">
        <Text copyable={{ text: employeeData.email }}>
          <MailOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          {employeeData.email}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Mobile">
        <Text copyable={{ text: employeeData.mobile }}>
          <PhoneOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
          +91 {employeeData.mobile}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Work Phone">
        <Text copyable={{ text: employeeData.workPhone }}>
          <PhoneOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
          {employeeData.workPhone}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Address">
        <Text>
          <HomeOutlined style={{ marginRight: '8px', color: '#fa541c' }} />
          {employeeData.address}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Birth Date">
        <Text>{employeeData.birthDate ? dayjs(employeeData.birthDate).format('MMM DD, YYYY') : 'Not provided'}</Text>
      </Descriptions.Item>
    </Descriptions>
  </Card>
</Col>

                  {/* Employment Details */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
  <Card 
    title={
      <Space>
        <BankOutlined style={{ color: '#52c41a' }} />
        Employment Details
      </Space>
    }
    size="small"
    style={{ height: '100%' }}
  >
    <Descriptions 
  column={1} 
  size="small" 
  layout={screens.md ? "horizontal" : "vertical"}
  labelStyle={screens.md ? { 
    width: '140px', 
    fontWeight: 600 
  } : { 
    fontWeight: 600,
    fontSize: '13px',
    color: '#8c8c8c',
    marginBottom: '4px'
  }}
  contentStyle={!screens.md ? {
    fontSize: '15px',
    marginBottom: '12px'
  } : {}}
>
      <Descriptions.Item label="Position">
        <Text strong>{employeeData.position}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="Department">
        <Tag color="blue" icon={<BankOutlined />}>
          {employeeData.department}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Employee Type">
        <Tag color="green">{employeeData.employeeType}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Join Date">
        <Text>
          <CalendarOutlined style={{ marginRight: '8px', color: '#fa541c' }} />
          {dayjs(employeeData.joinDate).format('MMM DD, YYYY')}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={employeeData.status === 'Active' ? 'success' : 'error'}>
          {employeeData.status}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Salary">
        <Text strong style={{ color: '#52c41a' }}>
          <DollarOutlined style={{ marginRight: '8px' }} />
          {employeeData.salary}
        </Text>
      </Descriptions.Item>
    </Descriptions>
  </Card>
</Col>

                  {/* Skills & Expertise */}
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Card 
  title={
    <Space>
      <StarOutlined style={{ color: '#faad14' }} />
      Skills & Expertise
    </Space>
  }
  size="small"
  style={{ height: '100%' }}
>
  <div style={{ marginBottom: '16px' }}>
    <Text strong style={{ 
      display: 'block', 
      marginBottom: screens.md ? '8px' : '6px',
      fontSize: screens.md ? '14px' : '13px',
      color: screens.md ? 'inherit' : '#8c8c8c'
    }}>
      Technical Skills
    </Text>
    <Space size={[4, 8]} wrap>
      {employeeData.skills.map(skill => (
        <Tag 
          key={skill} 
          color="geekblue" 
          style={{ 
            fontSize: screens.md ? '12px' : '13px',
            padding: screens.md ? '2px 8px' : '4px 10px'
          }}
        >
          {skill}
        </Tag>
      ))}
    </Space>
  </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Certifications</Text>
                        <Space size={[4, 8]} wrap>
                          {employeeData.certifications.map(cert => (
                            <Tag key={cert} color="gold" icon={<SafetyCertificateOutlined />} style={{ fontSize: '12px' }}>
                              {cert}
                            </Tag>
                          ))}
                        </Space>
                      </div>

                      <div>
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Languages</Text>
                        <Space size={[4, 8]} wrap>
                          {employeeData.languages.map(lang => (
                            <Tag key={lang} color="purple" style={{ fontSize: '12px' }}>
                              {lang}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </Card>
                  </Col>

                  {/* Quick Stats */}
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Card 
                      title={
                        <Space>
                          <TrophyOutlined style={{ color: '#fa541c' }} />
                          Professional Summary
                        </Space>
                      }
                      size="small"
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic 
                            title="Total Experience" 
                            value={employeeData.experience}
                            valueStyle={{ color: '#1890ff', fontWeight: 600 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="Time at Company" 
                            value={dayjs().diff(dayjs(employeeData.joinDate), 'year', true).toFixed(1)}
                            suffix="years"
                            valueStyle={{ color: '#52c41a', fontWeight: 600 }}
                          />
                        </Col>
                      </Row>
                      <Divider />
                      <div style={{ marginBottom: '16px' }}>
  <Text strong style={{ 
    display: 'block', 
    marginBottom: screens.md ? '8px' : '4px',
    fontSize: screens.md ? '14px' : '13px',
    color: screens.md ? 'inherit' : '#8c8c8c'
  }}>
    Education
  </Text>
  <Text style={{ fontSize: screens.md ? '14px' : '15px' }}>
    <BookOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
    {employeeData.education}
  </Text>
</div>
                      <Divider />
                      <div>
  <Text strong style={{ 
    display: 'block', 
    marginBottom: screens.md ? '8px' : '4px',
    fontSize: screens.md ? '14px' : '13px',
    color: screens.md ? 'inherit' : '#8c8c8c'
  }}>
    Emergency Contact
  </Text>
  <div style={{ marginBottom: screens.md ? '0' : '12px' }}>
    <Text style={{ 
      display: 'block',
      fontSize: screens.md ? '14px' : '15px',
      marginBottom: '4px'
    }}>
      {employeeData.emergencyContact.name}
    </Text>
    <Text type="secondary" style={{ 
      fontSize: screens.md ? '12px' : '13px',
      lineHeight: '1.4'
    }}>
      {employeeData.emergencyContact.relationship} • {employeeData.emergencyContact.phone}
    </Text>
  </div>
</div>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: 'performance',
              label: (
                <span>
                  <TrophyOutlined />
                  Performance
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={18} lg={18} xl={18}>
                    <Card title="Performance History" style={{ height: '100%' }}>
                      <Table
                        dataSource={performanceData.map((item, index) => ({ ...item, key: index }))}
                        columns={[
                          { 
                            title: 'Period', 
                            dataIndex: 'quarter', 
                            key: 'quarter',
                            render: (text) => <Text strong>{text}</Text>
                          },
                          { 
                            title: 'Rating', 
                            dataIndex: 'rating', 
                            key: 'rating',
                            render: (rating) => (
                              <Space>
                                <Rate disabled defaultValue={rating} style={{ fontSize: '14px' }} />
                                <Text strong>({rating}/5)</Text>
                              </Space>
                            )
                          },
                          { 
                            title: 'Goals', 
                            key: 'goals',
                            render: (_, record) => (
                              <Text>{record.achieved}/{record.goals}</Text>
                            )
                          },
                          {
                            title: 'Achievement',
                            key: 'percentage',
                            render: (_, record) => (
                              <Progress 
                                percent={Math.round((record.achieved / record.goals) * 100)} 
                                size="small"
                                strokeColor={{
                                  '0%': '#ff4d4f',
                                  '50%': '#faad14',
                                  '100%': '#52c41a',
                                }}
                              />
                            )
                          },
                          {
                            title: 'Reviewer',
                            dataIndex: 'reviewer',
                            key: 'reviewer'
                          }
                        ]}
                        pagination={false}
                        size="small"
                        expandable={{
                          expandedRowRender: (record) => (
                            <div style={{ padding: '12px', backgroundColor: '#fafafa' }}>
                              <Text strong>Feedback: </Text>
                              <Paragraph style={{ margin: 0 }}>{record.feedback}</Paragraph>
                            </div>
                          ),
                        }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Card title="Performance Summary" size="small">
                        <Statistic 
                          title="Average Rating" 
                          value={4.7} 
                          precision={1}
                          suffix="/ 5.0"
                          valueStyle={{ color: '#52c41a', fontWeight: 600 }}
                          prefix={<StarOutlined />}
                        />
                        <Divider />
                        <Statistic 
                          title="Goal Achievement" 
                          value={89.7} 
                          precision={1}
                          suffix="%"
                          valueStyle={{ color: '#1890ff', fontWeight: 600 }}
                          prefix={<TrophyOutlined />}
                        />
                        <Divider />
                        <Statistic 
                          title="Goals Completed" 
                          value={35} 
                          suffix="/ 39"
                          valueStyle={{ color: '#722ed1', fontWeight: 600 }}
                          prefix={<CheckCircleOutlined />}
                        />
                      </Card>

                      <Card title="Performance Trend" size="small">
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <Progress
                            type="dashboard"
                            percent={94}
                            strokeColor={{
                              '0%': '#108ee9',
                              '100%': '#87d068',
                            }}
                            format={percent => `${percent}%`}
                          />
                          <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                            Overall Performance Score
                          </Text>
                        </div>
                      </Card>
                    </Space>
                  </Col>
                </Row>
              )
            },
            {
              key: 'projects',
              label: (
                <span>
                  <ProjectOutlined />
                  Projects
                </span>
              ),
              children: (
                <Card title="Current & Recent Projects">
                  <Table
                    dataSource={projectsData}
                    columns={projectColumns}
                    pagination={{ pageSize: 5, showSizeChanger: true }}
                    scroll={{ x: 1200 }}
                    size="small"
                    expandable={{
                      expandedRowRender: (record) => (
                        <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                          <Row gutter={24}>
                            <Col span={8}>
                              <Text strong>Project Timeline:</Text>
                              <br />
                              <Text>Start: {dayjs(record.startDate).format('MMM DD, YYYY')}</Text>
                              <br />
                              <Text>End: {dayjs(record.endDate).format('MMM DD, YYYY')}</Text>
                            </Col>
                            <Col span={8}>
                              <Text strong>Client/Department:</Text>
                              <br />
                              <Text>{record.client}</Text>
                            </Col>
                            <Col span={8}>
                              <Text strong>Budget Allocation:</Text>
                              <br />
                              <Text style={{ color: '#52c41a', fontWeight: 600 }}>{record.budget}</Text>
                            </Col>
                          </Row>
                        </div>
                      ),
                    }}
                  />
                </Card>
              )
            },
            {
              key: 'timeline',
              label: (
                <span>
                  <ClockCircleOutlined />
                  Career Timeline
                </span>
              ),
              children: (
                <Card title="Professional Journey">
                  <Timeline 
                    mode="left" 
                    items={timelineData}
                    style={{ padding: '24px' }}
                  />
                  
                  <Divider />
                  
                  <Row gutter={24}>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Card size="small" title="Milestones">
                        <Statistic 
                          title="Years of Service" 
                          value={dayjs().diff(dayjs(employeeData.joinDate), 'year', true).toFixed(1)}
                          suffix="years"
                          valueStyle={{ color: '#1890ff' }}
                        />
                        <Divider />
                        <Statistic 
                          title="Promotions" 
                          value={2}
                          valueStyle={{ color: '#52c41a' }}
                        />
                        <Divider />
                        <Statistic 
                          title="Certifications" 
                          value={employeeData.certifications.length}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                      <Card size="small" title="Upcoming Events">
                        <List
                          size="small"
                          dataSource={[
                            {
                              title: 'Annual Performance Review',
                              date: '2024-03-15',
                              type: 'review'
                            },
                            {
                              title: 'Work Anniversary',
                              date: employeeData.workAnniversary,
                              type: 'anniversary'
                            },
                            {
                              title: 'AWS Certification Renewal',
                              date: '2024-10-20',
                              type: 'certification'
                            }
                          ]}
                          renderItem={item => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={
                                  item.type === 'review' ? <TrophyOutlined style={{ color: '#1890ff' }} /> :
                                  item.type === 'anniversary' ? <CalendarOutlined style={{ color: '#52c41a' }} /> :
                                  <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                                }
                                title={item.title}
                                description={dayjs(item.date).format('MMM DD, YYYY')}
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                  </Row>
                </Card>
              )
            },
            {
              key: 'documents',
              label: (
                <span>
                  <FileTextOutlined />
                  Documents
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Document Management">
                      <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col>
                          <Upload {...uploadProps} showUploadList={false}>
                            <Button 
                              type="primary" 
                              icon={<UploadOutlined />} 
                              loading={uploading}
                            >
                              Upload Document
                            </Button>
                          </Upload>
                        </Col>
                        <Col>
                          <Button icon={<FileTextOutlined />}>
                            Generate Report
                          </Button>
                        </Col>
                      </Row>
                      
                      <Table
                        dataSource={documentsData}
                        columns={documentColumns}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        size="small"
                      />
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Card>

      {/* Enhanced Edit Profile Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Edit Employee Profile
          </Space>
        }
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width="90%"  // Responsive width
  style={{ maxWidth: '900px' }}
        destroyOnClose
      >
        <Alert
          message="Profile Update"
          description="Make changes to employee information. All changes will be logged for audit purposes."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Tabs defaultActiveKey="personal" size="small">
         
          <TabPane tab="Skills & Education" key="skills">
  <Form.Item name="profileImage" label="Profile Image">
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Avatar size={{ xs: 80, sm: 100, md: 120, lg: 140 }} src={profileImagePreview} icon={<UserOutlined />} />
      <Upload
        showUploadList={false}
        beforeUpload={handleImageUpload}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />}>
          Upload Image
        </Button>
      </Upload>
    </div>
  </Form.Item>

  <Form.Item name="education" label="Education">
    <Input placeholder="Enter highest education qualification" />
  </Form.Item>

  <Form.Item name="totalExperience" label="Total Experience">
    <Input placeholder="e.g., 5 years" />
  </Form.Item>

  <Form.Item name="technicalSkills" label="Technical Skills">
    <Select
      mode="tags"
      placeholder="Add technical skills"
      style={{ width: '100%' }}
      tokenSeparators={[',']}
    />
  </Form.Item>

  <Form.Item name="certifications" label="Certifications">
    <Select
      mode="tags"
      placeholder="Add certifications"
      style={{ width: '100%' }}
      tokenSeparators={[',']}
    />
  </Form.Item>

  <Form.Item name="languages" label="Languages">
    <Select
      mode="tags"
      placeholder="Add languages with proficiency"
      style={{ width: '100%' }}
      tokenSeparators={[',']}
    />
  </Form.Item>

  <Divider>Social Links</Divider>

  <Form.Item name="linkedinUrl" label="LinkedIn Profile">
    <Input prefix={<LinkedinOutlined />} placeholder="https://linkedin.com/in/username" />
  </Form.Item>

  <Form.Item name="githubUrl" label="GitHub Profile">
    <Input prefix={<GithubOutlined />} placeholder="https://github.com/username" />
  </Form.Item>

  <Form.Item name="twitterUrl" label="Twitter Profile">
    <Input prefix={<TwitterOutlined />} placeholder="https://twitter.com/username" />
  </Form.Item>
</TabPane>
          </Tabs>

          <Divider />
          
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setIsEditModalVisible(false)}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="default" onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                Save Changes
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
      {/* Personal Information Edit Modal - ADD THIS */}
<Modal
  title="Edit Personal Information"
  open={isEditPersonalVisible}
  onCancel={() => setIsEditPersonalVisible(false)}
  footer={[
    <Button key="cancel" onClick={() => setIsEditPersonalVisible(false)}>
      Cancel
    </Button>,
    <Button key="save" type="primary" onClick={handlePersonalInfoSave}>
      Save Changes
    </Button>
  ]}
>
  <Form form={personalForm} layout="vertical">
    <Form.Item name="workPhone" label="Work Phone">
      <Input placeholder="Enter work phone number" />
    </Form.Item>
    <Form.Item name="address" label="Address">
      <Input.TextArea placeholder="Enter complete address" rows={3} />
    </Form.Item>
    <Form.Item name="birthDate" label="Birth Date">
      <DatePicker style={{ width: '100%' }} />
    </Form.Item>
  </Form>
</Modal>
    </div>
  );
} 
                  