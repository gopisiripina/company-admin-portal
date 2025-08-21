import React, { useState, useCallback,useEffect  } from 'react';
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
  DeleteOutlined,
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
import { supabase, supabaseAdmin } from '../../supabase/config';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { confirm } = Modal;
const { useBreakpoint } = Grid;

export default function EmployeeProfileModal({ isVisible, onClose, userData, isLoading = false,onProfileUpdate}) {
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
  const [documents, setDocuments] = useState([]);
const [documentLoading, setDocumentLoading] = useState(false);
const [uploadModalVisible, setUploadModalVisible] = useState(false);
const [uploadForm] = Form.useForm();

const DOCUMENT_TYPES = [
  { value: 'Certificate', label: 'Certificate', color: '#52c41a' },
  { value: 'Contract', label: 'Employment Contract', color: '#52c41a' },
  { value: 'Performance', label: 'Performance Review', color: '#52c41a' },
  { value: 'Offer Letter', label: 'Offer Letter', color: '#52c41a' },
  { value: 'Personal', label: 'Personal Document', color: '#52c41a' },
  { value: 'Training', label: 'Training Document', color: '#52c41a' },
  { value: 'Legal', label: 'Legal Document', color: '#52c41a' },
  { value: 'Other', label: 'Other', color: '#666' }
];
// Load documents from user data
// Replace the existing useEffect
useEffect(() => {
  if (userData?.documents) {
    // Handle both array and string cases
    let docs = userData.documents;
    if (typeof docs === 'string') {
      try {
        docs = JSON.parse(docs);
      } catch (e) {
        docs = [];
      }
    }
    setDocuments(Array.isArray(docs) ? docs : []);
  } else {
    // If no documents in userData, initialize empty array
    setDocuments([]);
  }
}, [userData]);
// Add this temporary useEffect for debugging
useEffect(() => {
  // console.log('userData received:', userData);
  // console.log('userData.documents:', userData?.documents);
}, [userData]);

// Upload document function
const handleDocumentUpload = async (values) => {
  const { file, documentType, description } = values;
  
  // Get the actual file from the upload component
  let actualFile;
  if (file?.fileList && file.fileList.length > 0) {
    actualFile = file.fileList[0].originFileObj;
  } else if (file?.originFileObj) {
    actualFile = file.originFileObj;
  } else if (file?.file) {
    actualFile = file.file.originFileObj || file.file;
  }

  if (!actualFile) {
    message.error('Please select a file');
    return;
  }

  setDocumentLoading(true);
  try {
    const fileExt = actualFile.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${employeeData.id}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, actualFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get file size in readable format
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Create document object
    const newDocument = {
      id: `doc_${Date.now()}`,
      name: actualFile.name,
      type: documentType,
      description: description || '',
      filePath: filePath,
      size: formatFileSize(actualFile.size),
      uploadDate: new Date().toISOString(),
      status: 'Active'
    };

    // Update documents array
    const updatedDocuments = [...documents, newDocument];

  // In handleDocumentUpload function, replace the database update part:
const { error: updateError } = await supabase
          .from('users')
          .update({ 
            documents: JSON.stringify(updatedDocuments), // ✅ **MODIFY THIS LINE**
            updated_at: new Date().toISOString()
          })
          .eq('employee_id', employeeData.id);

        if (updateError) throw updateError;

    // Update local state
    setDocuments(updatedDocuments);
    
    // Notify parent component if needed
    if (onProfileUpdate) {
      onProfileUpdate({ documents: updatedDocuments });
    }

    message.success('Document uploaded successfully!');
    setUploadModalVisible(false);
    uploadForm.resetFields();

  } catch (error) {
    console.error('Upload error:', error);
    message.error(`Failed to upload document: ${error.message}`);
  } finally {
    setDocumentLoading(false);
  }
};
const handleDocumentDownload = async (document) => {
  try {
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .download(document.filePath);

    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('Document downloaded successfully!');
  } catch (error) {
    console.error('Download error:', error);
    message.error(`Failed to download document: ${error.message}`);
  }
};

// View document function
const handleDocumentView = async (document) => {
  try {
    const { data } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(document.filePath);

    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    } else {
      message.error('Cannot view document');
    }
  } catch (error) {
    console.error('View error:', error);
    message.error('Failed to view document');
  }
};

// Delete document function
const handleDocumentDelete = async (documentId) => {
  Modal.confirm({
    title: 'Delete Document',
    content: 'Are you sure you want to delete this document? This action cannot be undone.',
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      try {
        const documentToDelete = documents.find(doc => doc.id === documentId);
        if (!documentToDelete) return;

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('employee-documents')
          .remove([documentToDelete.filePath]);

        if (storageError) throw storageError;

        // Update documents array
        const updatedDocuments = documents.filter(doc => doc.id !== documentId);

        // Update database
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            documents: updatedDocuments,
            updated_at: new Date().toISOString()
          })
          .eq('employee_id', employeeData.id);

        if (updateError) throw updateError;

        setDocuments(updatedDocuments);
        
        if (onProfileUpdate) {
          onProfileUpdate({ documents: updatedDocuments });
        }

        message.success('Document deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        message.error(`Failed to delete document: ${error.message}`);
      }
    }
  });
};

// Updated document columns for table
const documentColumns = [
  {
    title: 'Document Name',
    dataIndex: 'name',
    key: 'name',
    render: (text, record) => (
      <Space>
        <FileTextOutlined style={{ color: '#0D7139' }} />
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      </Space>
    )
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (type) => {
      const typeConfig = DOCUMENT_TYPES.find(t => t.value === type);
      return (
        <Tag color={typeConfig?.color || '#666'} className="document-tag">
          {typeConfig?.label || type}
        </Tag>
      );
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
    render: (date) => dayjs(date).format('MMM DD, YYYY')
  },
  // {
  //   title: 'Status',
  //   dataIndex: 'status',
  //   key: 'status',
  //   render: (status) => (
  //     <Badge 
  //       status={status === 'Active' ? 'success' : 'default'} 
  //       text={status} 
  //     />
  //   )
  // },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="View Document">
          <Button 
            type="text" 
            size="small" 
            icon={<EyeOutlined />} 
            className="action-btn"
            onClick={() => handleDocumentView(record)}
          />
        </Tooltip>
        <Tooltip title="Download">
          <Button 
            type="text" 
            size="small" 
            icon={<DownloadOutlined />} 
            className="action-btn"
            onClick={() => handleDocumentDownload(record)}
          />
        </Tooltip>
        {/* <Tooltip title="Delete">
          <Button 
            type="text" 
            size="small" 
            icon={<DeleteOutlined />} 
            className="action-btn"
            danger
            onClick={() => handleDocumentDelete(record.id)}
          />
        </Tooltip> */}
      </Space>
    ),
  }
];

// Upload validation rules
const uploadValidation = (file) => {
  const validTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (!validTypes.includes(file.type)) {
    message.error('Please upload PDF, Image, Word, or Text files only!');
    return false;
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    message.error('File size must be less than 10MB!');
    return false;
  }
  
  return true;
};


  // Enhanced employee data with more professional structure
  const employeeData = {
    id: userData?.employeeId || userData?.id || 'EMP-001',
    name: userData?.name || 'John Doe',
    position: userData?.role || 'employee',
    department: userData?.department || 'Not specified',
    email: userData?.email || 'employee@company.com',
    mobile: userData?.mobile || 'Not provided',
    workPhone: userData?.work_phone || 'Not provided',
    address: userData?.address || 'Not provided',
    joinDate: userData?.created_at || userData?.createdAt || userData?.start_date,
    birthDate: userData?.birth_date || userData?.birthDate,
    employeeType: userData?.employee_type || 'full-time',
    status: userData?.isActive ? 'Active' : 'Inactive',
    salary: userData?.pay || 'Not specified',
    avatar: userData?.profileimage || null,
    band: userData?.band || 'L5',
    location: userData?.address || 'Not specified',
    timezone: userData?.timezone || 'EST (UTC-5)',
    skills: userData?.technical_skills || ['No Skills Provided'],
    experience: userData?.total_experience || 'Not specified',
    education: userData?.education || 'Master of Computer Science',
    certifications: userData?.certifications || ['No Certifications Provided'],
    languages: userData?.languages || ['No Languages Provided'],
    emergencyContact: userData?.emergencyContact || {
      name: 'Jone jackson',
      relationship: 'Spouse',
      phone: '+91 95554567890'
    },
    socialLinks: userData?.socialLinks || {
      linkedin: userData?.linkedin_url || 'https://www.linkedin.com/in/',
      github: userData?.github_url || 'https://github.com/',
      twitter: userData?.twitter_url || 'https://x.com/'
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

  // Enhanced timeline data with beautiful cards
  const timelineData = [
    {
      children: (
        <Card 
          size="small" 
          className="timeline-card promotion"
          bodyStyle={{ padding: '16px' }}
        >
          <div className="timeline-content">
            <Text strong className="timeline-title">Promoted to Senior Software Engineer</Text>
            <Text className="timeline-description">Recognition for outstanding performance and leadership</Text>
            <Text className="timeline-date">January 2024</Text>
          </div>
        </Card>
      ),
      dot: <div className="timeline-dot promotion"><TrophyOutlined /></div>,
    },
    {
      children: (
        <Card 
          size="small" 
          className="timeline-card certification"
          bodyStyle={{ padding: '16px' }}
        >
          <div className="timeline-content">
            <Text strong className="timeline-title">AWS Solutions Architect Certification</Text>
            <Text className="timeline-description">Professional certification in cloud architecture</Text>
            <Text className="timeline-date">October 2023</Text>
          </div>
        </Card>
      ),
      dot: <div className="timeline-dot certification"><SafetyCertificateOutlined /></div>,
    },
    {
      children: (
        <Card 
          size="small" 
          className="timeline-card project"
          bodyStyle={{ padding: '16px' }}
        >
          <div className="timeline-content">
            <Text strong className="timeline-title">Led Enterprise Platform Project</Text>
            <Text className="timeline-description">Successfully delivered $2.5M platform modernization</Text>
            <Text className="timeline-date">January 2023</Text>
          </div>
        </Card>
      ),
      dot: <div className="timeline-dot project"><ProjectOutlined /></div>,
    },
    {
      children: (
        <Card 
          size="small" 
          className="timeline-card start"
          bodyStyle={{ padding: '16px' }}
        >
          <div className="timeline-content">
            <Text strong className="timeline-title">Joined as Software Engineer</Text>
            <Text className="timeline-description">Started career journey at the company</Text>
            <Text className="timeline-date">March 2021</Text>
          </div>
        </Card>
      ),
      dot: <div className="timeline-dot start"><UserOutlined /></div>,
    }
  ];

  



  const handleEdit = useCallback(() => {
    setIsEditModalVisible(true);
    
    // Initialize main form
    form.setFieldsValue({
      ...employeeData,
      joinDate: employeeData.joinDate ? dayjs(employeeData.joinDate) : null,
      birthDate: employeeData.birthDate ? dayjs(employeeData.birthDate) : null,
      education: employeeData.education,
      totalExperience: employeeData.experience,
      technicalSkills: employeeData.skills,
      certifications: employeeData.certifications,
      languages: employeeData.languages,
      linkedinUrl: employeeData.socialLinks.linkedin,
      githubUrl: employeeData.socialLinks.github,
      twitterUrl: employeeData.socialLinks.twitter
    });
    
    // Initialize personal form
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
      const updatedFields = {
        education: values.education,
        total_experience: values.totalExperience,
        technical_skills: values.technicalSkills,
        certifications: values.certifications,
        languages: values.languages,
        linkedin_url: values.linkedinUrl,
        github_url: values.githubUrl,
        twitter_url: values.twitterUrl,
        profileimage: profileImagePreview || employeeData.avatar
      };
      const { data, error } = await supabase
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
        .eq('employee_id', employeeData.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      message.success('Skills & Education updated successfully');
        if (onProfileUpdate) {
        onProfileUpdate(updatedFields);
      }
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Full error:', error);
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
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('employee_id', employeeData.id);

      if (error) throw error;
      
      message.success('Personal information updated successfully');
       if (onProfileUpdate) {
        onProfileUpdate(updateData);
      }
      setIsEditPersonalVisible(false);
    } catch (error) {
      console.error('Full error:', error);
      message.error(`Failed to update personal information: ${error.message}`);
    }
  };
const uploadProps = {
  multiple: false,
  maxCount: 1,
  accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt",
  beforeUpload: uploadValidation,
  onChange(info) {
    if (info.file.status === "removed") {
      message.info(`${info.file.name} removed`);
    }
  },
};
  const handlePrintProfile = useCallback(() => {
    window.print();
  }, []);

  const handleExportProfile = useCallback(() => {
    message.info('Export functionality will be implemented');
  }, []);
  {/* Document Upload Modal */}
<Modal
  title={
    <Space style={{color: '#ffffff', fontSize: '18px', fontWeight: '700'}}>
      <UploadOutlined style={{color: '#ffffff'}} />
      Upload Document
    </Space>
  }
  open={uploadModalVisible}
  onCancel={() => {
    setUploadModalVisible(false);
    uploadForm.resetFields();
  }}
  footer={[
    <Button 
      key="cancel" 
      onClick={() => {
        setUploadModalVisible(false);
        uploadForm.resetFields();
      }}
      className="action-button secondary"
      size="large"
    >
      Cancel
    </Button>,
    <Button 
      key="upload" 
      type="primary" 
      onClick={() => uploadForm.submit()}
      loading={documentLoading}
      className="action-button primary"
      size="large"
    >
      Upload Document
    </Button>
  ]}
  className="professional-modal"
>
  <Form 
    form={uploadForm} 
    layout="vertical"
    onFinish={handleDocumentUpload}
  >
    <Form.Item
      name="file"
      label="Select Document"
      rules={[{ required: true, message: 'Please select a file to upload' }]}
    >
      <Upload
        {...uploadProps}
        listType="text"
        maxCount={1}
      >
        <Button icon={<UploadOutlined />} block size="large">
          Click to Select File
        </Button>
      </Upload>
    </Form.Item>
    
    <Form.Item
      name="documentType"
      label="Document Type"
      rules={[{ required: true, message: 'Please select document type' }]}
    >
      <Select placeholder="Select document type" size="large">
        {DOCUMENT_TYPES.map(type => (
          <Option key={type.value} value={type.value}>
            <Tag color={type.color} style={{ marginRight: 8 }}>
              {type.label}
            </Tag>
          </Option>
        ))}
      </Select>
    </Form.Item>
    
    <Form.Item
      name="description"
      label="Description (Optional)"
    >
      <Input.TextArea 
        placeholder="Brief description of the document" 
        rows={3}
        size="large"
      />
    </Form.Item>
  </Form>
</Modal>



  const headerActions = (
    <Space size="middle">
      <Tooltip title="Print Profile">
        <Button 
          icon={<PrinterOutlined />} 
          onClick={handlePrintProfile}
          className="action-button secondary"
        />
      </Tooltip>
      <Tooltip title="Export Profile">
        <Button 
          icon={<DownloadOutlined />} 
          onClick={handleExportProfile}
          className="action-button secondary"
        />
      </Tooltip>
      <Tooltip title="Share Profile">
        <Button 
          icon={<ShareAltOutlined />} 
          className="action-button secondary"
        />
      </Tooltip>
      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={handleEdit}
        className="action-button primary"
        size="large"
      >
        Edit Profile
      </Button>
    </Space>
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading employee profile..." />
      </div>
    );
  }

  return (
    <div className="employee-profile-container">
      <style>{`
        .employee-profile-container {
          padding: 32px;
          
          min-height: 100vh;
          font-family: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif';
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .profile-header-card {
          background: rgba(255, 255, 255, 0.95);
          backdropFilter: blur(10px);
          border: none;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          margin-bottom: 32px;
          overflow: hidden;
          position: relative;
        }

        .profile-header-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #0D7139 0%, #52c41a 50%, #8ac185 100%);
        }

        .profile-avatar-container {
          position: relative;
        }

        .profile-avatar {
          width: 160px !important;
          height: 160px !important;
          border: 6px solid #ffffff;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
        }

        .profile-status-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: #0D7139;
          border: 4px solid #ffffff;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .profile-name {
          color: #1e293b !important;
          font-weight: 800 !important;
          font-size: 32px !important;
          margin: 0 0 8px 0 !important;
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .profile-position {
          font-size: 20px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .profile-tag {
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          border: none;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          border: none;
          border-radius: 12px;
          height: 48px;
          padding: 0 24px;
          font-weight: 600;
          box-shadow: 0 8px 16px rgba(13, 113, 57, 0.3);
          transition: all 0.3s ease;
          color: #ffffff;
        }

        .action-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(13, 113, 57, 0.4);
          background: linear-gradient(135deg, #0a5a2e 0%, #3a9a3a 100%);
          color: #ffffff;
        }

        .action-button.secondary {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          height: 44px;
          width: 44px;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .action-button.secondary:hover {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          color: #ffffff;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(13, 113, 57, 0.2);
        }

        .main-content-card {
          background: rgba(255, 255, 255, 0.95);
          backdropFilter: blur(10px);
          border: none;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .ant-tabs-tab {
          font-weight: 600;
          font-size: 16px;
          padding: 16px 24px;
          margin: 0 8px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .ant-tabs-tab-active {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          color: #ffffff !important;
        }

        .ant-tabs-tab:hover {
          color: #0D7139;
        }

        .ant-tabs-ink-bar {
          display: none;
        }

        .ant-tabs-content-holder {
          padding: 32px;
        }

        .info-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.95);
          backdropFilter: blur(10px);
          transition: all 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
        }

        .info-card .ant-card-head {
          border-bottom: 2px solid #f1f5f9;
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          color: #ffffff;
          border-radius: 20px 20px 0 0;
        }

        .info-card .ant-card-head-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 18px;
        }

        .ant-descriptions-item-label {
          font-weight: 700 !important;
          color: #374151 !important;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
        }

        .ant-descriptions-item-content {
          color: #64748b;
          font-weight: 500;
        }

        .skills-section {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .skill-tag, .cert-tag, .lang-tag {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
          margin: 4px;
          border: none;
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          color: #ffffff;
          transition: all 0.3s ease;
        }

        .skill-tag:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(13, 113, 57, 0.3);
        }

        .cert-tag {
          background: linear-gradient(135deg, #52c41a 0%, #8ac185 100%);
        }

        .lang-tag {
          background: linear-gradient(135deg, #13c2c2 0%, #52c41a 100%);
        }

        .stat-card {
          border: none;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdropFilter: blur(10px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          margin-bottom: 16px;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
        }

        .stat-card .ant-statistic-title {
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .stat-card .ant-statistic-content {
          color: #1e293b;
          font-weight: 800;
          font-size: 28px;
        }

        .timeline-card {
          border: none;
          border-radius: 16px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          margin-bottom: 8px;
        }

        .timeline-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .timeline-card.promotion {
          background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
          border-left: 4px solid #0D7139;
        }

        .timeline-card.certification {
          background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
          border-left: 4px solid #1890ff;
        }

        .timeline-card.project {
          background: linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%);
          border-left: 4px solid #faad14;
        }

        .timeline-card.start {
          background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
          border-left: 4px solid #722ed1;
        }

        .timeline-content {
          display: flex;
          flex-direction: column;
        }

        .timeline-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .timeline-description {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .timeline-date {
          color: #9ca3af;
          font-size: 12px;
          font-weight: 600;
        }

        .timeline-dot {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .timeline-dot.promotion {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
        }

        .timeline-dot.certification {
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
        }

        .timeline-dot.project {
          background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
        }

        .timeline-dot.start {
          background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
        }

        .professional-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          font-weight: 700;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .professional-table .ant-table-tbody > tr:hover > td {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .document-tag {
          border: none;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .action-btn {
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          color: #ffffff;
          transform: scale(1.1);
        }

        .performance-table .ant-rate {
          color: #faad14;
        }

        .ant-progress-bg {
          background: linear-gradient(90deg, #0D7139 0%, #52c41a 100%);
        }

        /* Modal Styles */
        .ant-modal-header {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          border-radius: 8px 8px 0 0;
        }

        .ant-modal-title {
          color: #ffffff;
        }

        .ant-modal-close-x {
          color: #ffffff;
        }

        .ant-form-item-label > label {
          color: #0D7139;
          font-weight: 600;
        }

        .ant-btn-primary {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          border: none;
          color: #ffffff;
        }

        .ant-btn-primary:hover,
        .ant-btn-primary:focus {
          background: linear-gradient(135deg, #0a5a2e 0%, #3a9a3a 100%);
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(13, 113, 57, 0.3);
        }

        .ant-select-selector {
          border-color: #0D7139 !important;
        }

        .ant-select-focused .ant-select-selector,
        .ant-select-selector:focus,
        .ant-select-selector:hover {
          border-color: #0D7139 !important;
          box-shadow: 0 0 0 2px rgba(13, 113, 57, 0.1) !important;
        }

        .ant-input:focus,
        .ant-input-focused {
          border-color: #0D7139;
          box-shadow: 0 0 0 2px rgba(13, 113, 57, 0.1);
        }

        .ant-input:hover {
          border-color: #0D7139;
        }

        .ant-picker:hover,
        .ant-picker-focused {
          border-color: #0D7139;
          box-shadow: 0 0 0 2px rgba(13, 113, 57, 0.1);
        }

        /* Breadcrumb styling */
        .ant-breadcrumb a {
          color: #0D7139;
        }

        /* Social media icons hover effects */
        .linkedin-icon:hover {
          color: #0077b5;
          transform: scale(1.1);
        }

        .github-icon:hover {
          color: #333;
          transform: scale(1.1);
        }

        .twitter-icon:hover {
          color: #1da1f2;
          transform: scale(1.1);
        }

        /* Enhanced statistic styling */
        .green-statistic .ant-statistic-content {
          background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Upload button styling */
        .ant-upload .ant-btn {
          border-color: #0D7139;
          color: #0D7139;
        }

        .ant-upload .ant-btn:hover {
          border-color: #52c41a;
          color: #52c41a;
        }

        /* Alert styling */
        .ant-alert-info {
          border-color: #0D7139;
          background-color: rgba(13, 113, 57, 0.05);
        }

        .ant-alert-info .ant-alert-icon {
          color: #0D7139;
        }

        /* Tag hover effects */
        .profile-tag:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Calendar cell styling */
        .ant-picker-cell-selected .ant-picker-cell-inner,
        .ant-picker-cell-range-start .ant-picker-cell-inner,
        .ant-picker-cell-range-end .ant-picker-cell-inner {
          background: #0D7139 !important;
        }

        .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
          border-color: #0D7139;
        }

        /* Progress bar styling */
        .ant-progress-bg {
          background: linear-gradient(to right, #0D7139, #52c41a) !important;
        }

        .ant-progress-success-bg {
          background: #0D7139 !important;
        }

        /* Dropdown and select styling */
        .ant-select-dropdown {
          border: 1px solid #0D7139;
        }

        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background-color: rgba(13, 113, 57, 0.1);
          color: #0D7139;
        }

        .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background-color: rgba(13, 113, 57, 0.05);
        }

        /* Responsive design improvements */
        @media (max-width: 768px) {
          .employee-profile-container {
            padding: 16px;
          }
          
          .profile-name {
            font-size: 24px !important;
          }
          
          .profile-position {
            font-size: 16px;
          }
          
          .profile-avatar {
            width: 120px !important;
            height: 120px !important;
          }

          .action-button.primary {
            width: 100%;
            margin-top: 16px;
          }

          .headerActions {
            flex-direction: column;
            align-items: stretch;
          }
        }

        @media (max-width: 480px) {
          .ant-tabs-content-holder {
            padding: 16px;
          }

          .skills-section {
            padding: 16px;
          }

          .timeline-dot {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
        }
          /* Enhanced Modal Styles */
.professional-modal .ant-modal-content {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.professional-modal .ant-modal-header {
  background: linear-gradient(135deg, #0D7139 0%, #52c41a 100%);
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
  border-bottom: none;
}

.professional-modal .ant-modal-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
}

.professional-modal .ant-modal-close {
  color: #ffffff;
  top: 16px;
  right: 16px;
}

.professional-modal .ant-modal-close:hover {
  color: rgba(255, 255, 255, 0.8);
}

.professional-modal .ant-modal-body {
  padding: 32px 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.professional-modal .ant-modal-footer {
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  background: #f8fafc;
}

.form-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.form-section-title {
  color: #0D7139;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Enhanced Responsive Design */
@media (max-width: 768px) {
  .employee-profile-container {
    padding: 12px;
    overflow-x: hidden;
  }
  
  .profile-header-card {
    border-radius: 16px;
    margin-bottom: 20px;
  }
  
  .profile-header-card .ant-card-body {
    padding: 20px 16px;
  }
  
  .profile-name {
    font-size: 24px !important;
    text-align: center;
  }
  
  .profile-position {
    font-size: 16px;
    text-align: center;
    margin-bottom: 20px;
  }
  
  .profile-avatar {
    width: 100px !important;
    height: 100px !important;
  }
  
  .profile-avatar-container {
    text-align: center;
    margin-bottom: 16px;
  }

  /* Mobile Header Actions */
  .mobile-header-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin-top: 20px;
  }

  .mobile-header-actions .action-button.primary {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
  }

  .mobile-secondary-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
  }

  .mobile-secondary-actions .action-button.secondary {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  /* Mobile Tabs */
  .ant-tabs-nav {
    margin-bottom: 16px;
  }
  
  .ant-tabs-tab {
    padding: 12px 16px !important;
    margin: 0 4px !important;
    font-size: 14px !important;
    border-radius: 8px !important;
  }
  
  .ant-tabs-content-holder {
    padding: 16px 12px !important;
  }

  /* Mobile Cards */
  .info-card {
    border-radius: 12px;
    margin-bottom: 16px;
  }
  
  .info-card .ant-card-head {
    padding: 16px;
    border-radius: 12px 12px 0 0;
  }
  
  .info-card .ant-card-body {
    padding: 16px;
  }

  /* Mobile Descriptions */
  .ant-descriptions {
    font-size: 14px;
  }
  
  .ant-descriptions-item-label {
    padding: 12px 8px !important;
    font-size: 13px !important;
  }
  
  .ant-descriptions-item-content {
    padding: 12px 8px !important;
    font-size: 14px !important;
  }

  /* Mobile Skills Section */
  .skills-section {
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 12px;
  }

  .skill-tag, .cert-tag, .lang-tag {
    margin: 3px 2px;
    padding: 6px 12px;
    font-size: 12px;
  }

  /* Mobile Statistics */
  .stat-card {
    margin-bottom: 12px;
    border-radius: 12px;
  }
  
  .stat-card .ant-card-body {
    padding: 16px;
  }
  
  .ant-statistic-title {
    font-size: 13px !important;
  }
  
  .ant-statistic-content {
    font-size: 24px !important;
  }

  /* Mobile Timeline */
  .timeline-card {
    border-radius: 12px;
    margin-bottom: 12px;
  }
  
  .timeline-card .ant-card-body {
    padding: 12px;
  }
  
  .timeline-title {
    font-size: 14px !important;
  }
  
  .timeline-description {
    font-size: 13px !important;
  }
  
  .timeline-dot {
    width: 40px !important;
    height: 40px !important;
    font-size: 16px !important;
  }

  /* Mobile Tables */
  .professional-table {
    font-size: 13px;
  }
  
  .professional-table .ant-table-thead > tr > th {
    padding: 8px;
    font-size: 12px;
  }
  
  .professional-table .ant-table-tbody > tr > td {
    padding: 8px;
    font-size: 13px;
  }

  /* Mobile Horizontal Scroll for Tables */
  .table-scroll-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-scroll-container table {
    min-width: 600px;
  }

  /* Mobile Modal Styles */
  .professional-modal {
    width: 95% !important;
    max-width: none !important;
    margin: 10px auto !important;
  }
  
  .professional-modal .ant-modal-content {
    border-radius: 12px;
  }
  
  .professional-modal .ant-modal-header {
    padding: 16px;
    border-radius: 12px 12px 0 0;
  }
  
  .professional-modal .ant-modal-title {
    font-size: 18px;
  }
  
  .professional-modal .ant-modal-body {
    padding: 16px;
    max-height: 60vh;
  }
  
  .professional-modal .ant-modal-footer {
    padding: 12px 16px;
  }

  /* Mobile Form Improvements */
  .ant-form-item {
    margin-bottom: 16px;
  }
  
  .ant-form-item-label {
    padding-bottom: 4px;
  }
  
  .ant-form-item-label > label {
    font-size: 14px;
    height: auto;
  }

  .form-section {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 8px;
  }
  
  .form-section-title {
    font-size: 15px;
    margin-bottom: 12px;
  }

  /* Mobile Upload Section */
  .ant-upload {
    width: 100%;
  }
  
  .ant-upload .ant-btn {
    width: 100%;
    height: 44px;
    font-size: 14px;
  }

  /* Mobile Social Links */
  .linkedin-icon, .github-icon, .twitter-icon {
    font-size: 20px !important;
  }

  /* Mobile Breadcrumb */
  .ant-breadcrumb {
    margin-bottom: 12px;
    font-size: 13px;
  }

  /* Mobile Progress Bars */
  .ant-progress {
    margin-bottom: 8px;
  }

  /* Mobile Badge and Tag Adjustments */
  .profile-tag {
    margin: 2px;
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 8px;
  }

  .document-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .employee-profile-container {
    padding: 8px;
  }
  
  .profile-name {
    font-size: 20px !important;
  }
  
  .profile-position {
    font-size: 14px;
  }
  
  .profile-avatar {
    width: 80px !important;
    height: 80px !important;
  }

  .ant-tabs-tab {
    padding: 8px 12px !important;
    font-size: 13px !important;
    margin: 0 2px !important;
  }
  
  .ant-tabs-content-holder {
    padding: 12px 8px !important;
  }

  .info-card .ant-card-head,
  .info-card .ant-card-body {
    padding: 12px;
  }

  .skills-section {
    padding: 12px;
  }

  .timeline-dot {
    width: 36px !important;
    height: 36px !important;
    font-size: 14px !important;
  }

  .professional-modal {
    width: 100% !important;
    margin: 0 !important;
    top: 0 !important;
    height: 100vh;
  }
  
  .professional-modal .ant-modal-content {
    height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;
  }
  
  .professional-modal .ant-modal-body {
    flex: 1;
    max-height: none;
    overflow-y: auto;
    padding: 12px;
  }

  .form-section {
    padding: 12px;
    margin-bottom: 12px;
  }
}

/* Enhanced Alert Styles */
.professional-alert {
  border-radius: 12px;
  border: 1px solid rgba(13, 113, 57, 0.2);
  background: linear-gradient(135deg, rgba(13, 113, 57, 0.05) 0%, rgba(82, 196, 26, 0.05) 100%);
}

.professional-alert .ant-alert-icon {
  color: #0D7139;
}

/* Enhanced Button Hover States for Mobile */
@media (hover: hover) {
  .action-button:hover {
    transform: translateY(-2px);
  }
}

/* Touch-friendly tap targets */
@media (pointer: coarse) {
  .action-btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .ant-tabs-tab {
    min-height: 44px !important;
  }
}
      `}</style>
      

     <Breadcrumb
  style={{ marginBottom: '16px' }}
  items={[{ title: employeeData.name }]}
/>


      {/* Profile Header */}
      <Card className="profile-header-card">
        <Row align="middle" gutter={[32, 24]}>
          <Col xs={24} lg={16}>
            <Row align="middle" gutter={[32, 16]}>
              <Col>
                <div className="profile-avatar-container">
                  <Avatar 
                    size={160} 
                    src={employeeData.avatar || "/api/placeholder/140/140"} 
                    icon={<UserOutlined />} 
                    className="profile-avatar"
                  />
                  {employeeData.status === 'Active' && (
                    <div className="profile-status-badge" />
                  )}
                </div>
              </Col>
              <Col flex={1}>
                <Title className="profile-name">{employeeData.name}</Title>
                {/* <div className="profile-position">
                  {employeeData.position} & {employeeData.department}
                </div> */}
                <Space wrap size={[8, 8]} style={{ marginBottom: '16px' }}>
                  <Tag className="profile-tag" color="#52c41a">
                    <UserOutlined /> ID: {employeeData.id}
                  </Tag>
                  <Tag className="profile-tag" color="#52c41a">
                    <TeamOutlined /> {employeeData.employeeType}
                  </Tag>
                  
                  <Tag 
                    className="profile-tag"
                    color={employeeData.status === 'Active' ? '#52c41a' : 'default'}
                  >
                    {employeeData.status}
                  </Tag>
                </Space>

                <Space size="large">
                  <Tooltip title="LinkedIn Profile">
                    <LinkedinOutlined 
                      className="linkedin-icon"
                      style={{ fontSize: '24px', color: '#0077b5', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                      onClick={() => window.open(employeeData.socialLinks.linkedin, '_blank')}
                    />
                  </Tooltip>
                  <Tooltip title="GitHub Profile">
                    <GithubOutlined 
                      className="github-icon"
                      style={{ fontSize: '24px', color: '#333', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onClick={() => window.open(employeeData.socialLinks.github, '_blank')}
                    />
                  </Tooltip>
                  <Tooltip title="Twitter Profile">
                    <TwitterOutlined 
                      className="twitter-icon"
                      style={{ fontSize: '24px', color: '#1da1f2', cursor: 'pointer', transition: 'all 0.3s ease' }}
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
          <Col xs={24} lg={8} style={{ textAlign: screens.lg ? 'right' : 'center' }}>
            <div className="headerActions">
              {headerActions}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Card className="main-content-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <Tabs.TabPane tab={<Space><UserOutlined />Overview</Space>} key="overview">
            <Row gutter={[24, 24]}>
              {/* Personal Information */}
              <Col xs={24} lg={12}>
                <Card 
                  className="info-card" 
                  title={
                    <Space>
                      <InfoCircleOutlined />
                      Personal Information
                      <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => setIsEditPersonalVisible(true)}
                        style={{ marginLeft: 'auto', color: '#ffffff' }}
                      >
                        Edit
                      </Button>
                    </Space>
                  }
                >
                  <Descriptions column={1} layout="horizontal" bordered size="middle">
                    <Descriptions.Item label="Email">
                      <Space><MailOutlined style={{color: '#0D7139'}} />{employeeData.email}</Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mobile">
                      <Space><PhoneOutlined style={{color: '#52c41a'}} />+91 {employeeData.mobile}</Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Work Phone">
                      <Space><PhoneOutlined style={{color: '#13c2c2'}} />{employeeData.workPhone}</Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      <Space><HomeOutlined style={{color: '#faad14'}} />{employeeData.address}</Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Birth Date">
                      <Space>
                        <CalendarOutlined style={{color: '#ff4d4f'}} />
                        {employeeData.birthDate ? dayjs(employeeData.birthDate).format('MMM DD, YYYY') : 'Not provided'}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              
              {/* Employment Details */}
              <Col xs={24} lg={12}>
                <Card className="info-card" title={<Space><BankOutlined />Employment Details</Space>}>
                  <Descriptions column={1} layout="horizontal" bordered size="middle">
                    <Descriptions.Item label="Position">
                      <Text strong>{employeeData.position}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Department">
                      <Tag color="#0D7139" icon={<BankOutlined />}>
                        {employeeData.department}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Employee Type">
                      <Tag color="#52c41a">{employeeData.employeeType}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Join Date">
                      <Space>
                        <CalendarOutlined style={{color: '#faad14'}} />
                        {dayjs(employeeData.joinDate).format('MMM DD, YYYY')}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Badge 
                        status={employeeData.status === 'Active' ? 'success' : 'error'} 
                        text={employeeData.status} 
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Salary">
                      <Space>
                        <DollarOutlined style={{color: '#0D7139'}} />
                        <Text strong style={{ color: '#0D7139' }}>{employeeData.salary}</Text>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              {/* Skills & Expertise */}
              <Col span={24}>
                <Card className="info-card" title={<Space><StarOutlined />Skills & Expertise</Space>}>
                  <div className="skills-section">
                    <Text strong style={{fontSize: '16px', color: '#374151'}}>Technical Skills</Text>
                    <div style={{marginTop: '12px'}}>
                      {employeeData.skills.map(skill => 
                        <Tag key={skill} className="skill-tag">{skill}</Tag>
                      )}
                    </div>
                  </div>

                  <div className="skills-section">
                    <Text strong style={{fontSize: '16px', color: '#374151'}}>Certifications</Text>
                    <div style={{marginTop: '12px'}}>
                      {employeeData.certifications.map(cert => 
                        <Tag key={cert} className="cert-tag" icon={<SafetyCertificateOutlined />}>{cert}</Tag>
                      )}
                    </div>
                  </div>

                  <div className="skills-section">
                    <Text strong style={{fontSize: '16px', color: '#374151'}}>Languages</Text>
                    <div style={{marginTop: '12px'}}>
                      {employeeData.languages.map(lang => 
                        <Tag key={lang} className="lang-tag">{lang}</Tag>
                      )}
                    </div>
                  </div>

                  <div className="skills-section">
                    <Text strong style={{fontSize: '16px', color: '#374151'}}>Education</Text>
                    <Paragraph style={{marginTop: '8px', color: '#64748b', fontSize: '15px'}}>
                      <BookOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                      {employeeData.education}
                    </Paragraph>
                  </div>

                  <div className="skills-section">
                    <Text strong style={{fontSize: '16px', color: '#374151'}}>Emergency Contact</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Text style={{ display: 'block', fontSize: '15px', marginBottom: '4px' }}>
                        {employeeData.emergencyContact.name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        {employeeData.emergencyContact.relationship} â€¢ {employeeData.emergencyContact.phone}
                      </Text>
                    </div>
                  </div>

                  <Row gutter={16} style={{ marginTop: '24px' }}>
                    <Col span={12}>
                      <Card className="stat-card">
                        <div className="green-statistic">
                          <Statistic 
                            title="Total Experience" 
                            value={employeeData.experience}
                            valueStyle={{ 
                              background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }} 
                          />
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card className="stat-card">
                        <div className="green-statistic">
                          <Statistic 
                            title="Time at Company" 
                            value={dayjs().diff(dayjs(employeeData.joinDate), 'year', true).toFixed(1)}
                            suffix="years"
                            valueStyle={{ 
                              background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }} 
                          />
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab={<Space><TrophyOutlined />Performance</Space>} key="performance">
            <Row gutter={[24, 24]}>
              <Col xs={24} xl={16}>
                <Card 
                  className="info-card" 
                  title="Performance History"
                  bodyStyle={{padding: '24px'}}
                >
                  <Table 
                    dataSource={performanceData.map(d => ({...d, key: d.quarter}))} 
                    pagination={false} 
                    size="middle"
                    className="performance-table"
                    expandable={{ 
                      expandedRowRender: record => (
                        <div style={{padding: '16px', background: '#f8fafc', borderRadius: '12px'}}>
                          <Text strong>Feedback: </Text>
                          <Text>{record.feedback}</Text>
                          <br />
                          <Text strong>Reviewer: </Text>
                          <Text>{record.reviewer}</Text>
                        </div>
                      )
                    }}
                  >
                    <Table.Column 
                      title="Period" 
                      dataIndex="quarter" 
                      key="quarter" 
                      render={(text) => <Text strong style={{color: '#374151'}}>{text}</Text>} 
                    />
                    <Table.Column 
                      title="Rating" 
                      dataIndex="rating" 
                      key="rating" 
                      render={(rating) => (
                        <Space>
                          <Rate disabled defaultValue={rating} style={{fontSize: '16px'}} />
                          <Text strong style={{color: '#faad14'}}>{rating}</Text>
                        </Space>
                      )} 
                    />
                    <Table.Column 
                      title="Goal Achievement" 
                      key="goals" 
                      render={(_, record) => {
                        const percentage = Math.round((record.achieved / record.goals) * 100);
                        return (
                          <div>
                            <Progress 
                              percent={percentage} 
                              size="small" 
                              strokeColor={{
                                '0%': '#0D7139',
                                '100%': '#52c41a',
                              }}
                            />
                            <Text style={{fontSize: '12px', color: '#64748b'}}>
                              {record.achieved} of {record.goals} goals
                            </Text>
                          </div>
                        );
                      }} 
                    />
                  </Table>
                </Card>
              </Col>
              
              <Col xs={24} xl={8}>
                <Space direction="vertical" style={{width: '100%'}} size="large">
                  <Card className="stat-card">
                    <div className="green-statistic">
                      <Statistic 
                        title="Average Rating" 
                        value={4.75} 
                        precision={2} 
                        suffix="/ 5.0" 
                        valueStyle={{ 
                          background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }} 
                        prefix={<StarOutlined style={{color: '#faad14'}} />} 
                      />
                    </div>
                  </Card>
                  
                  <Card className="stat-card">
                    <div className="green-statistic">
                      <Statistic 
                        title="Goal Achievement Rate" 
                        value={89.5} 
                        precision={1} 
                        suffix="%" 
                        valueStyle={{ 
                          background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }} 
                        prefix={<TrophyOutlined style={{color: '#0D7139'}} />} 
                      />
                    </div>
                  </Card>

                  <Card className="stat-card">
                    <div className="green-statistic">
                      <Statistic 
                        title="Total Goals Completed" 
                        value={38} 
                        suffix="goals" 
                        valueStyle={{ 
                          background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }} 
                        prefix={<ProjectOutlined style={{color: '#0D7139'}} />} 
                      />
                    </div>
                  </Card>
                </Space>
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab={<Space><ClockCircleOutlined />Career Journey</Space>} key="timeline">
            <Card className="info-card" title="Professional Timeline">
              <Timeline 
                mode="alternate" 
                items={timelineData} 
                style={{padding: '32px 16px'}} 
              />
              
              <Divider />
              
            </Card>
          </Tabs.TabPane>

         <Tabs.TabPane tab={<Space><FileTextOutlined />Documents</Space>} key="documents">
            <Card className="info-card" title="Document Management">
            <div style={{marginBottom: '24px'}}>
  <Button 
    type="primary" 
    icon={<UploadOutlined />} 
    onClick={() => setUploadModalVisible(true)}
    size="large"
    className="action-button primary"
    loading={documentLoading}
  >
    Upload New Document
  </Button>
</div>
              
              {/* Mobile: Add horizontal scroll container */}
              <div className="table-scroll-container">
            
<Table 
  dataSource={documents.map((doc, index) => ({
    ...doc,
    key: doc.id || `doc-${index}` // Ensure unique key
  }))} 
  columns={documentColumns} 
  className="professional-table"
  scroll={screens.xs ? { x: 800 } : undefined}
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: !screens.xs,
    showTotal: (total, range) => 
      `${range[0]}-${range[1]} of ${total} documents`,
    simple: screens.xs
  }}
/>
              </div>
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Card>
{/* Document Upload Modal */}
<Modal
  title={
    <Space style={{color: '#ffffff', fontSize: '18px', fontWeight: '700'}}>
      <UploadOutlined style={{color: '#ffffff'}} />
      Upload Document
    </Space>
  }
  open={uploadModalVisible}
  onCancel={() => {
    setUploadModalVisible(false);
    uploadForm.resetFields();
  }}
  footer={[
    <Button 
      key="cancel" 
      onClick={() => {
        setUploadModalVisible(false);
        uploadForm.resetFields();
      }}
      className="action-button secondary"
      size="large"
    >
      Cancel
    </Button>,
    <Button 
      key="upload" 
      type="primary" 
      onClick={() => uploadForm.submit()}
      loading={documentLoading}
      className="action-button primary"
      size="large"
    >
      Upload Document
    </Button>
  ]}
  className="professional-modal"
>
  <Form 
    form={uploadForm} 
    layout="vertical"
    onFinish={handleDocumentUpload}
  >
    <Form.Item
      name="file"
      label="Select Document"
      rules={[{ required: true, message: 'Please select a file to upload' }]}
    >
      <Upload
        {...uploadProps}
        listType="text"
        maxCount={1}
      >
        <Button icon={<UploadOutlined />} block size="large">
          Click to Select File
        </Button>
      </Upload>
    </Form.Item>
    
    <Form.Item
      name="documentType"
      label="Document Type"
      rules={[{ required: true, message: 'Please select document type' }]}
    >
      <Select placeholder="Select document type" size="large">
        {DOCUMENT_TYPES.map(type => (
          <Option key={type.value} value={type.value}>
            <Tag color={type.color} style={{ marginRight: 8 }}>
              {type.label}
            </Tag>
          </Option>
        ))}
      </Select>
    </Form.Item>
    
    <Form.Item
      name="description"
      label="Description (Optional)"
    >
      <Input.TextArea 
        placeholder="Brief description of the document" 
        rows={3}
        size="large"
      />
    </Form.Item>
  </Form>
</Modal>
      {/* Enhanced Edit Profile Modal */}
<Modal
  title={null}
  open={isEditModalVisible}
  onCancel={() => setIsEditModalVisible(false)}
  footer={null}
  width={screens.xs ? '95%' : '85%'}
  destroyOnHidden   // instead of destroyOnClose
  className="professional-edit-modal"
  style={{ top: screens.xs ? '10px' : '20px' }}
  styles={{
    body: {
      padding: '0',
      maxHeight: screens.xs ? '85vh' : '80vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)'
    },
    mask: {
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)'
    }
  }}
>

  {/* Custom Header */}
  <div style={{
    background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
    padding: '24px 32px',
    borderRadius: '12px 12px 0 0',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      opacity: 0.3
    }} />
    <Space style={{color: '#ffffff', fontSize: '22px', fontWeight: '600', position: 'relative', zIndex: 1}}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <EditOutlined style={{color: '#ffffff', fontSize: '24px'}} />
      </div>
      <div>
        <div style={{fontSize: '22px', fontWeight: '700', marginBottom: '4px'}}>
          Edit Professional Profile
        </div>
        <div style={{fontSize: '14px', opacity: '0.9', fontWeight: '400'}}>
          Update your skills, education, and professional information
        </div>
      </div>
    </Space>
  </div>

  {/* Content Area */}
  <div style={{
    background: '#ffffff',
    padding: '32px',
    borderRadius: '0 0 12px 12px'
  }}>
    {/* Enhanced Alert */}

    
    <Form
      form={form}
      layout="vertical"
      onFinish={handleEditSubmit}
    >
      {/* Profile Image Section */}
      <div className="professional-form-section" style={{
        background: 'linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e8eaf6',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          opacity: '0.1'
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserOutlined style={{color: '#ffffff', fontSize: '18px'}} />
          </div>
          <div>
            <div style={{fontSize: '18px', fontWeight: '700', color: '#2c3e50'}}>
              Profile Picture
            </div>
            <div style={{fontSize: '14px', color: '#6c757d'}}>
              Upload a professional headshot
            </div>
          </div>
        </div>
        <Form.Item style={{position: 'relative', zIndex: 1}}>
          <Space align="center" size="large" direction={screens.xs ? 'vertical' : 'horizontal'}>
            <div style={{position: 'relative'}}>
              <Avatar 
                size={screens.xs ? 100 : 140} 
                src={profileImagePreview || employeeData.avatar} 
                icon={<UserOutlined />}
                style={{
                  border: '4px solid #ffffff',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: '#4caf50',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                border: '3px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleOutlined style={{color: '#ffffff', fontSize: '12px'}} />
              </div>
            </div>
            <Upload 
              showUploadList={false} 
              beforeUpload={handleImageUpload} 
              accept="image/*"
            >
              <Button 
                icon={<UploadOutlined />}
                size={screens.xs ? 'middle' : 'large'}
                style={{
                  width: screens.xs ? '200px' : 'auto',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                Change Photo
              </Button>
            </Upload>
          </Space>
        </Form.Item>
      </div>

      {/* Education & Experience Section */}
      <div className="professional-form-section" style={{
        background: 'linear-gradient(135deg, #fff8e1 0%, #f3e5f5 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #ffecb3',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          borderRadius: '50%',
          opacity: '0.1'
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOutlined style={{color: '#ffffff', fontSize: '18px'}} />
          </div>
          <div>
            <div style={{fontSize: '18px', fontWeight: '700', color: '#2c3e50'}}>
              Education & Experience
            </div>
            <div style={{fontSize: '14px', color: '#6c757d'}}>
              Academic background and professional experience
            </div>
          </div>
        </div>
        <Row gutter={screens.xs ? [0, 16] : [24, 16]} style={{position: 'relative', zIndex: 1}}>
          <Col xs={24} md={12}>
            <Form.Item name="education" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>Education</span>}>
              <Input.TextArea 
                rows={3} 
                placeholder="Enter highest education qualification"
                style={{
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #ff9800';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="totalExperience" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>Total Experience</span>}>
              <Input 
                placeholder="e.g., 5 years"
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #ff9800';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Skills Section */}
      <div className="professional-form-section" style={{
        background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f4ff 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #c8e6c9',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
          borderRadius: '50%',
          opacity: '0.1'
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <StarOutlined style={{color: '#ffffff', fontSize: '18px'}} />
          </div>
          <div>
            <div style={{fontSize: '18px', fontWeight: '700', color: '#2c3e50'}}>
              Skills & Certifications
            </div>
            <div style={{fontSize: '14px', color: '#6c757d'}}>
              Technical expertise and professional certifications
            </div>
          </div>
        </div>
        <div style={{position: 'relative', zIndex: 1}}>
          <Form.Item name="technicalSkills" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>Technical Skills</span>}>
            <Select
              mode="tags"
              placeholder="Add technical skills (press Enter or comma to add)"
              style={{ 
                width: '100%',
              }}
              tokenSeparators={[',']}
              dropdownStyle={{
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            />
          </Form.Item>

          <Form.Item name="certifications" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>Certifications</span>}>
            <Select
              mode="tags"
              placeholder="Add certifications (press Enter or comma to add)"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
              dropdownStyle={{
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            />
          </Form.Item>

          <Form.Item name="languages" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>Languages</span>}>
            <Select
              mode="tags"
              placeholder="Add languages with proficiency (press Enter or comma to add)"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
              dropdownStyle={{
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}
            />
          </Form.Item>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="professional-form-section" style={{
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e8f5e8 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #b3e5fc',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #03a9f4 0%, #0277bd 100%)',
          borderRadius: '50%',
          opacity: '0.1'
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #03a9f4 0%, #0277bd 100%)',
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShareAltOutlined style={{color: '#ffffff', fontSize: '18px'}} />
          </div>
          <div>
            <div style={{fontSize: '18px', fontWeight: '700', color: '#2c3e50'}}>
              Social Media Links
            </div>
            <div style={{fontSize: '14px', color: '#6c757d'}}>
              Professional networking and portfolio links
            </div>
          </div>
        </div>
        <Row gutter={screens.xs ? [0, 16] : [24, 16]} style={{position: 'relative', zIndex: 1}}>
          <Col xs={24} md={8}>
            <Form.Item name="linkedinUrl" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>LinkedIn Profile</span>}>
              <Input 
                prefix={<LinkedinOutlined style={{color: '#0077b5', fontSize: '16px'}} />} 
                placeholder="https://linkedin.com/in/username"
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #0077b5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 119, 181, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="githubUrl" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>GitHub Profile</span>}>
              <Input 
                prefix={<GithubOutlined style={{color: '#333', fontSize: '16px'}} />} 
                placeholder="https://github.com/username"
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #333';
                  e.target.style.boxShadow = '0 0 0 3px rgba(51, 51, 51, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="twitterUrl" label={<span style={{fontWeight: '600', color: '#2c3e50'}}>Twitter Profile</span>}>
              <Input 
                prefix={<TwitterOutlined style={{color: '#1da1f2', fontSize: '16px'}} />} 
                placeholder="https://twitter.com/username"
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #1da1f2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(29, 161, 242, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Action Buttons */}
      <div style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <Row justify="end" gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Button 
              size="large" 
              onClick={() => setIsEditModalVisible(false)}
              block={screens.xs}
              style={{
                height: '48px',
                borderRadius: '12px',
                border: '2px solid #6c757d',
                color: '#6c757d',
                fontWeight: '600',
                background: '#ffffff',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#6c757d';
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.color = '#6c757d';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Cancel
            </Button>
          </Col>
          <Col xs={24} sm={6}>
            <Button 
              onClick={() => form.resetFields()}
              size="large"
              block={screens.xs}
              style={{
                height: '48px',
                borderRadius: '12px',
                border: '2px solid #ffc107',
                color: '#ffc107',
                fontWeight: '600',
                background: '#ffffff',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ffc107';
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.color = '#ffc107';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Reset
            </Button>
          </Col>
          <Col xs={24} sm={8}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<CheckCircleOutlined />}
              size="large"
              block={screens.xs}
              style={{
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';
              }}
            >
              Save Changes
            </Button>
          </Col>
        </Row>
      </div>
    </Form>
  </div>
</Modal>
      {/* Personal Information Edit Modal */}
      <Modal
        title={
          <Space style={{color: '#ffffff', fontSize: '18px', fontWeight: '700'}}>
            <EditOutlined style={{color: '#ffffff'}} />
            Edit Personal Information
          </Space>
        }open={isEditPersonalVisible}
        onCancel={() => setIsEditPersonalVisible(false)}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setIsEditPersonalVisible(false)}
            className="action-button secondary"
            size="large"
          >
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={handlePersonalInfoSave}
            className="action-button primary"
            size="large"
          >
            Save Changes
          </Button>
        ]}
      >
        <Form form={personalForm} layout="vertical">
          <Form.Item name="workPhone" label="Work Phone">
            <Input prefix={<PhoneOutlined />} placeholder="Enter work phone number" />
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
