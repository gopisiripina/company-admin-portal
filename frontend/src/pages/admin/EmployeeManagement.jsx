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
import CryptoJS from 'crypto-js';
import { supabase, supabaseAdmin } from '../../supabase/config';
import ErrorPage from '../../error/ErrorPage';
const { Title, Text } = Typography;
const { Search } = Input;
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const generateEmployeeId = async (employeeType) => {
  try {
    // Get the latest employee ID for the specific type
    let prefix = '';
    switch (employeeType) {
      case 'full-time':
        prefix = 'MYAEMP';
        break;
      case 'temporary':
        prefix = 'MYATEMP';
        break;
      case 'internship':
        prefix = 'MYAINT';
        break;
      default:
        prefix = 'MYA';
    }

    // Query to get the highest number for this type
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('employee_id')
      .like('employee_id', `${prefix}%`)
      .order('employee_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching employee IDs:', error);
      return `${prefix}001`;
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastId = data[0].employee_id;
      const numberPart = lastId.replace(prefix, '');
      nextNumber = parseInt(numberPart, 10) + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    return `MYA001`;
  }
};
const sendWelcomeEmail = async (employeeData) => {
  try {
    const response = await fetch(`${baseUrl}send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientEmail: employeeData.email,
        templateData: {
          company_name: "My Access",
          to_name: employeeData.name,
          user_role: employeeData.role,
          user_email: employeeData.email,
          user_password: employeeData.password,
          website_link: "https://hrm.myaccess.cloud/",
          from_name: "HR Team"
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
const MobileEmployeeCard = React.memo(({ employee, onEdit, onDelete, onSendCredentials, onAccessToggle }) => (
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
      <Button 
        key="credentials"
        type="default" 
        icon={<MailOutlined />} 
        size="small"
        onClick={() => onSendCredentials(employee)}
        style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
      >
        Send
      </Button>,
     // CHANGE THIS PART in MobileEmployeeCard actions array:
<Button 
  key="access"
  type={employee.portal_access ? "primary" : "default"}
  size="small"
  onClick={() => onAccessToggle(employee.id, !employee.portal_access)}
  style={{ 
    backgroundColor: employee.portal_access ? '#10b981' : '#ef4444', 
    borderColor: employee.portal_access ? '#10b981' : '#ef4444', 
    color: 'white' 
  }}
  title={employee.portal_access ? 'Click to deny access' : 'Click to grant access'}
>
  {employee.portal_access ? 'Access ✓' : 'Access ✗'}
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
    {/* Add portal access tag in the mobile card info */}
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
          {employee.mobile && (
            <Text type="secondary" style={{ 
              fontSize: '12px',
              display: 'block',
              marginBottom: '4px'
            }}>
              📱 +91 {employee.mobile}
            </Text>
          )}
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
        {/* ADD THIS NEW TAG */}
       {/* CHANGE THIS TAG in the mobile card tags section: */}
<Tag 
  color={employee.portal_access ? 'cyan' : 'volcano'} 
  size="small"
>
  {employee.portal_access ? 'Portal Access' : 'No Portal Access'}
</Tag>
      </div>
    </div>
  </Card>
));

// Employee Form Modal Component
const EmployeeFormModal = React.memo(({ isOpen, onClose, editingEmployee, onSuccess, isMobile }) => {
    const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [employeeCreationType, setEmployeeCreationType] = useState(null); // 'new' or 'existing'
const [offerLetter, setOfferLetter] = useState(null);
useEffect(() => {
  if (isOpen) {
    if (editingEmployee) {
      setTimeout(() => {
        form.setFieldsValue({
          name: editingEmployee.name,
          email: editingEmployee.email,
          mobile: editingEmployee.mobile,
          employeeId: editingEmployee.employee_id,
          department: editingEmployee.department,
          role: editingEmployee.role,
          isActive: editingEmployee.isactive !== undefined ? editingEmployee.isactive : true,
          portal_access: editingEmployee.portal_access !== undefined ? editingEmployee.portal_access : true, // ADD THIS LINE
          employeeType: editingEmployee.employee_type || 'full-time',
          startDate: editingEmployee.start_date ? dayjs(editingEmployee.start_date) : null,
          endDate: editingEmployee.end_date ? dayjs(editingEmployee.end_date) : null,
          pay: editingEmployee.payroll?.[0]?.net_pay || editingEmployee.payroll?.net_pay
        });
        setProfileImage(editingEmployee.profileimage || null);
        setFaceEmbedding(editingEmployee.face_embedding || null);
        setCurrentEmployeeType(editingEmployee.employee_type || 'full-time');
        setIsUpdatingEmail(false);
      }, 0);
    } else {
      form.resetFields();
      form.setFieldsValue({ 
        isActive: false, 
        portal_access: true, // ADD THIS LINE
        email: '' 
      });
      setProfileImage(null);
      setFaceEmbedding(null);
      setIsUpdatingEmail(false);
      setCurrentEmail('');
    }
  }
}, [editingEmployee, form, isOpen]);

useEffect(() => {
  if (isOpen && !editingEmployee) {
    setEmployeeCreationType(null);
    setOfferLetter(null);
  }
}, [isOpen, editingEmployee]);

useEffect(() => {
  if (!isOpen) {
    form.resetFields();
    setProfileImage(null);
    setFaceEmbedding(null);
    setUploadedFile(null);
    setEmployeeCreationType(null);
    setOfferLetter(null);
    // Reset to default values
    form.setFieldsValue({ 
      isActive: false,
      employeeType: 'full-time'
    });
  }
}, [isOpen, form]);

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
const handleOfferLetterUpload = useCallback(async (file) => {
  const isPdf = file.type === 'application/pdf';
  if (!isPdf) {
    message.error('You can only upload PDF files!');
    return false;
  }
  
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('File must be smaller than 5MB!');
    return false;
  }

  try {
    const fileName = `offer-letter-${Date.now()}-${Math.random().toString(36).substring(2)}.pdf`;
    const filePath = `offer-letters/${fileName}`;

    const { data, error } = await supabase.storage
      .from('employee-documents') // Changed bucket name
      .upload(filePath, file);

    if (error) throw error;

    // Helper function to format file size
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // **MODIFIED PART STARTS HERE**
    // Create a document object that matches the structure in EmployeeProfileModal
    setOfferLetter({
      id: `doc_${Date.now()}`, // A unique ID for the document
      name: file.name, // Use 'name' instead of 'fileName'
      type: 'Offer Letter', // Use a type consistent with your DOCUMENT_TYPES, e.g., 'Contract'
      description: 'Offer Letter uploaded during onboarding.', // Optional description
      filePath: filePath, // **Crucial:** Store the path for viewing/downloading later
      size: formatFileSize(file.size), // Store the formatted file size
      uploadDate: new Date().toISOString(), // Use 'uploadDate' instead of 'uploadedAt'
      status: 'Active' // Add a status field
    });
    // **MODIFIED PART ENDS HERE**

    message.success('Offer letter uploaded successfully');
  } catch (error) {
    message.error('Failed to upload offer letter');
  }

  return false;
}, []);


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

const ENCRYPTION_KEY =  'My@cCe55!2021';
const handleSubmit = useCallback(async (values) => {
  setLoading(true);
  
  let finalFaceEmbedding = faceEmbedding;
  
  // If there's a new image file, get its embedding
  if (uploadedFile && profileImage !== editingEmployee?.profileimage) {
    try {
      console.log('Getting face embedding for new image...');
      const formData = new FormData();
      formData.append('image', uploadedFile);
      
      const embeddingResponse = await fetch('https://hrm.myaccess.cloud/api/get-face-embedding/', {
        method: 'POST',
        body: formData
      });
      
      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        console.log('Raw embedding data:', embeddingData);
        
        if (embeddingData && embeddingData.embedding && Array.isArray(embeddingData.embedding)) {
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

      // Check if email is being updated or employee type changed
      let newEmployeeId = editingEmployee.employee_id;
      if ((isUpdatingEmail && values.newEmail && values.newEmail !== currentEmail) || 
          (values.employeeType !== editingEmployee.employee_type)) {
        newEmployeeId = await generateEmployeeId(values.employeeType);
      }
const updateData = {
  name: values.name,
  email: isUpdatingEmail && values.newEmail ? values.newEmail : values.email,
  mobile: values.mobile,
  department: values.department,
  role: values.role || 'employee',
  employee_id: newEmployeeId,
  isactive: values.isActive,
  portal_access: values.portal_access !== undefined ? values.portal_access : true, // ADD THIS LINE
  profileimage: profileImage,
  employee_type: values.employeeType,
  start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
  end_date: values.employeeType === 'full-time' ? null : (values.endDate ? values.endDate.format('YYYY-MM-DD') : null),
  face_embedding: finalFaceEmbedding,
  pay: values.pay ? parseFloat(values.pay) : null,
};

      // Generate new password when email is updated
      let newPlainPassword = null;
      if (isUpdatingEmail && values.newEmail && values.newEmail !== currentEmail) {
        newPlainPassword = generatePassword();
        const encryptedPassword = CryptoJS.AES.encrypt(newPlainPassword, ENCRYPTION_KEY).toString();
        updateData.password = encryptedPassword;
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', editingEmployee.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      // Send email with new credentials if email was updated
      if (newPlainPassword && isUpdatingEmail && values.newEmail && values.newEmail !== currentEmail) {
        try {
          const emailResult = await sendWelcomeEmail({
            name: values.name,
            email: values.newEmail,
            password: newPlainPassword, // Use plain password for email
            role: editingEmployee.role || 'employee'
          });

          if (emailResult.success) {
            message.success('Employee updated and new credentials sent via email!');
          } else {
            message.warning('Employee updated but email could not be sent. Please share new credentials manually.');
          }
        } catch (emailError) {
          console.error('Email send failed:', emailError);
          message.warning('Employee updated but email could not be sent.');
        }
      } else {
        message.success('Employee updated successfully');
      }

    } else {
      // Create new employee
      const password = generatePassword();
      const encryptedPassword = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
      const newEmployeeId = await generateEmployeeId(values.employeeType);
      const payAmount = values.pay ? parseFloat(values.pay) : null;

     const employeeData = {
  name: values.name,
  email: values.email,
  mobile: values.mobile,
  department: values.department,
  employee_id: newEmployeeId,
  role: 'employee',
  isactive: values.isActive !== undefined ? values.isActive : false,
  portal_access: values.portal_access !== undefined ? values.portal_access : true, // ADD THIS LINE
  isfirstlogin: true,
  profileimage: profileImage,
  password: encryptedPassword,
  employee_type: values.employeeType,
  start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
  end_date: values.employeeType === 'full-time' ? null : (values.endDate ? values.endDate.format('YYYY-MM-DD') : null),
  face_embedding: finalFaceEmbedding,
  pay: payAmount,
  documents: offerLetter ? JSON.stringify([offerLetter]) : JSON.stringify([])
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
      if (values.pay && data && data[0]) {
    const payAmount = parseFloat(values.pay);
    const currentDate = new Date();
    
    // Create basic earnings array with user's pay
    const earningsArray = [
      { type: `earning_${Date.now()}`, label: "Basic", amount: payAmount }
    ];
    
    const payrollData = {
      user_id: data[0].id,
      company_name: "My Access",
      company_address: "Your Company Address", 
      city: "Your City",
      employee_name: values.name,
      employee_id: newEmployeeId,
      email_address: values.email,
      pay_period: currentDate.toISOString().slice(0, 7) + '-01',
      pay_date: currentDate.toISOString().slice(0, 10),
      paid_days: 30,
      lop_days: 0,
      earnings: earningsArray,
      deductions: []
    };
    
    const { error: payrollError } = await supabaseAdmin
      .from('payroll')
      .insert(payrollData);

    if (payrollError) {
      console.error('Payroll creation error:', payrollError);
    }
  }
      // Send welcome email with plain password
      try {
        const emailResult = await sendWelcomeEmail({
          name: values.name,
          email: values.email,
          password: password, // Use plain password for email
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

    // Reset form and close modal
    form.resetFields();
    setProfileImage(null);
    setFaceEmbedding(null);
    setUploadedFile(null);
    setIsUpdatingEmail(false);
    setCurrentEmail('');
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
}, [editingEmployee, generatePassword, onSuccess, onClose, form, profileImage, deleteOldProfileImage, faceEmbedding, uploadedFile, isUpdatingEmail, currentEmail,offerLetter]); 

 return (
    <Modal
      title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={900}
      centered
      className="employee-form-modal"
    >
  



{!editingEmployee && !employeeCreationType ? (
  // Professional Employee Type Selection Screen
  <div style={{ 
    padding: '32px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    minHeight: '500px',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Background Pattern */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `radial-gradient(circle at 20% 20%, rgba(31, 72, 66, 0.05) 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)`,
      pointerEvents: 'none'
    }} />
    
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #1F4842 0%, #2d5a50 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 12px 40px rgba(31, 72, 66, 0.25)',
          position: 'relative'
        }}>
          <UserAddOutlined style={{ fontSize: '32px', color: 'white' }} />
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#10b981',
            border: '3px solid white',
            animation: 'pulse 2s infinite'
          }} />
        </div>
        <Title level={2} style={{ 
          marginBottom: '12px', 
          color: '#0f172a',
          fontWeight: '700',
          fontSize: '28px'
        }}>
          Create New Employee
        </Title>
        <Text style={{ 
          fontSize: '16px',
          color: '#475569',
          fontWeight: '400',
          lineHeight: '1.6'
        }}>
          Choose the appropriate employee category to begin the onboarding process
        </Text>
      </div>
      
      {/* Selection Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px', 
        marginBottom: '32px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* New Employee Card */}
        <Card
          hoverable
          onClick={() => setEmployeeCreationType('new')}
          style={{
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          }}
          bodyStyle={{ padding: '28px' }}
          className="employee-type-card"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.15)';
            e.currentTarget.style.borderColor = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          {/* Card Background Gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '0 16px 0 100px'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', // Stack vertically on mobile
              alignItems: 'flex-start', 
              gap: '20px' 
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                position: 'relative'
              }}>
                <UserAddOutlined style={{ fontSize: '24px', color: '#1d4ed8' }} />
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid white'
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ 
                  margin: 0, 
                  marginBottom: '8px', 
                  color: '#1e293b',
                  fontWeight: '600',
                  fontSize: '18px'
                }}>
                  New Employee
                </Title>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: '1.5',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Create a comprehensive profile for a fresh team member starting their journey
                </Text>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Tag color="blue" style={{ fontSize: '11px', padding: '2px 8px' }}>Full Onboarding</Tag>
                  <Tag color="green" style={{ fontSize: '11px', padding: '2px 8px' }}>Document Upload</Tag>
                </div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1F4842 0%, #2d5a50 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease',
                alignSelf: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>→</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Existing Employee Card */}
        <Card
          hoverable
          onClick={() => setEmployeeCreationType('existing')}
          style={{
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(135deg, #ffffff 0%, #fefbf3 100%)'
          }}
          bodyStyle={{ padding: '28px' }}
          className="employee-type-card"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(245, 158, 11, 0.15)';
            e.currentTarget.style.borderColor = '#f59e0b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          {/* Card Background Gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
            borderRadius: '0 16px 0 100px'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)',
                position: 'relative'
              }}>
                <TeamOutlined style={{ fontSize: '24px', color: '#d97706' }} />
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  border: '2px solid white'
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ 
                  margin: 0, 
                  marginBottom: '8px', 
                  color: '#1e293b',
                  fontWeight: '600',
                  fontSize: '18px'
                }}>
                  Existing Employee
                </Title>
                <Text style={{ 
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: '1.5',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Add someone who already has experience and history with the company
                </Text>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Tag color="orange" style={{ fontSize: '11px', padding: '2px 8px' }}>Quick Setup</Tag>
                  <Tag color="purple" style={{ fontSize: '11px', padding: '2px 8px' }}>Experienced</Tag>
                </div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1F4842 0%, #2d5a50 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease',
                alignSelf: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>→</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Button 
          type="text" 
          onClick={onClose}
          size="large"
          style={{ 
            color: '#64748b',
            fontSize: '14px',
            padding: '12px 24px',
            borderRadius: '10px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#334155';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          ← Cancel and Return
        </Button>
      </div>
    </div>
  </div>
) : (
  // Professional Form Layout
  <div style={{ 
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    minHeight: '100%',
    padding: '0',
    borderRadius: '16px',
    margin: '-24px',
    marginTop: '0',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Background Elements */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '200px',
      background: 'linear-gradient(90deg, #0D7139 0%, #52c41a 50%, #8ac185 100%)',
      clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)'
    }} />
    
    <div style={{ position: 'relative', zIndex: 1, padding: '32px' }}>
      {/* Enhanced Header Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        paddingBottom: '32px'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 12px 40px rgba(31, 72, 66, 0.2)',
          border: '4px solid rgba(255, 255, 255, 0.9)'
        }}>
          <UserAddOutlined style={{ fontSize: '32px', color: '#1F4842' }} />
        </div>
        <Title level={2} style={{ 
          marginBottom: '8px', 
          color: 'white',
          fontWeight: '700',
          fontSize: '24px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          {editingEmployee ? 'Update Employee Profile' : 
           (employeeCreationType === 'new' ? 'New Employee Registration' : 'Existing Employee Setup')}
        </Title>
        <Text style={{ 
          fontSize: '14px',
          color: 'rgba(226, 230, 231, 0.97)',
          fontWeight: '400'
        }}>
          {editingEmployee ? 'Modify employee information and settings' :
           (employeeCreationType === 'new' 
            ? 'Complete onboarding process for new team member'
            : 'Quick setup for experienced company employee'
          )}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ role: 'employee', isActive: false }}
        style={{ maxWidth: '100%' }}
      >
        {/* Enhanced Profile Section */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Section Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '28px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserOutlined style={{ fontSize: '18px', color: '#1d4ed8' }} />
              </div>
              <Title level={4} style={{ 
                margin: 0,
                color: '#1e293b',
                fontWeight: '600',
                fontSize: '18px'
              }}>
                Profile Information
              </Title>
            </div>

            {/* Enhanced Profile Image Upload */}
            <Form.Item
              label={
                <span style={{ 
                  fontWeight: '600', 
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Profile Image
                </span>
              }
              extra={
                <span style={{ color: '#6b7280', fontSize: '12px' }}>
                  JPG/PNG files, max 2MB • High quality images improve face recognition accuracy
                </span>
              }
            >
                         <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', // This is the key change
                alignItems: 'center', 
                gap: '24px',
                padding: '24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '2px dashed #cbd5e1',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ position: 'relative' }}>
                  <Avatar 
                    size={100} 
                    src={profileImage}
                    style={{ 
                      backgroundColor: '#1F4842',
                      border: '4px solid white',
                      boxShadow: '0 8px 30px rgba(31, 72, 66, 0.2)'
                    }}
                    icon={!profileImage && <UserOutlined />}
                  >
                    {!profileImage && form.getFieldValue('name')?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  {profileImage && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      border: '3px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                  <Upload
                    showUploadList={false}
                    beforeUpload={handleImageUpload}
                    accept="image/*"
                  >
                    <Button 
                      icon={<UploadOutlined />}
                      style={{
                        borderRadius: '8px',
                        marginBottom: '12px',
                        background: profileImage ? 
                          'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                          'linear-gradient(135deg, #1F4842 0%, #2d5a50 100%)',
                        border: 'none',
                        color: 'white',
                        fontWeight: '500',
                        height: '40px',
                        boxShadow: profileImage ? 
                          '0 4px 15px rgba(245, 158, 11, 0.3)' :
                          '0 4px 15px rgba(31, 72, 66, 0.3)'
                      }}
                      block
                    >
                      {profileImage ? 'Change Profile Image' : 'Upload Profile Image'}
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
                      style={{ 
                        padding: '0', 
                        height: 'auto',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      🗑️ Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </Form.Item>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Full Name
                    </span>
                  }
                  rules={[{ required: true, message: 'Please enter employee name' }]}
                >
                  <Input 
                    placeholder="Enter complete full name"
                    style={{
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      padding: '12px 16px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1F4842';
                      e.target.style.boxShadow = '0 0 0 3px rgba(31, 72, 66, 0.1)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafafa';
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="mobile"
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Mobile Number
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Please enter mobile number' },
                    { 
                      pattern: /^[6-9]\d{9}$/, 
                      message: 'Please enter a valid 10-digit mobile number' 
                    }
                  ]}
                >
                  <Input 
                    placeholder="Enter 10-digit mobile number" 
                    prefix={
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '8px',
                        paddingRight: '8px',
                        borderRight: '1px solid #e5e7eb',
                        marginRight: '8px'
                      }}>
                        <span style={{ fontSize: '16px' }}>🇮🇳</span>
                        <span style={{ color: '#6b7280', fontWeight: '600' }}>+91</span>
                      </div>
                    }
                    maxLength={10}
                    style={{
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      padding: '12px 16px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1F4842';
                      e.target.style.boxShadow = '0 0 0 3px rgba(31, 72, 66, 0.1)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafafa';
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>

        {/* Enhanced Document Section - Only for existing employees */}
        {!editingEmployee && employeeCreationType === 'existing' && (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Section Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '28px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UploadOutlined style={{ fontSize: '18px', color: '#d97706' }} />
                </div>
                <Title level={4} style={{ 
                  margin: 0,
                  color: '#1e293b',
                  fontWeight: '600',
                  fontSize: '18px'
                }}>
                  Document Upload
                </Title>
              </div>

              <Form.Item
                label={
                  <span style={{ 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Offer Letter
                  </span>
                }
                extra={
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>
                    PDF format only • Maximum 5MB file size
                  </span>
                }
              >
                <div style={{ 
                  padding: '28px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '12px',
                  border: '2px dashed #cbd5e1',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  {!offerLetter ? (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          boxShadow: '0 8px 25px rgba(245, 158, 11, 0.15)'
                        }}>
                          <UploadOutlined style={{ fontSize: '24px', color: '#d97706' }} />
                        </div>
                        <Title level={5} style={{ 
                          color: '#374151', 
                          marginBottom: '4px',
                          fontWeight: '600'
                        }}>
                          Upload Offer Letter
                        </Title>
                        <Text style={{ color: '#6b7280', fontSize: '13px' }}>
                          Drag and drop your PDF file here, or click to browse
                        </Text>
                      </div>
                      <Upload
                        showUploadList={false}
                        beforeUpload={handleOfferLetterUpload}
                        accept="application/pdf"
                      >
                        <Button 
                          size="large"
                          style={{
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1F4842 0%, #2d5a50 100%)',
                            border: 'none',
                            color: 'white',
                            fontWeight: '600',
                            height: '48px',
                            padding: '0 32px',
                            boxShadow: '0 4px 15px rgba(31, 72, 66, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(31, 72, 66, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(31, 72, 66, 0.3)';
                          }}
                        >
                          📎 Choose PDF File
                        </Button>
                      </Upload>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: '10px',
                      border: '2px solid #bbf7d0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.2)'
                        }}>
                          <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>PDF</span>
                        </div>
                        <div>
                          <Text style={{ 
                            fontWeight: '600', 
                            color: '#065f46',
                            fontSize: '14px',
                            display: 'block'
                          }}>
                            {offerLetter.name}
                          </Text>
                          <Text style={{ 
                            fontSize: '11px', 
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            📄 {offerLetter.size} • PDF Document
                          </Text>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Button 
                          type="link" 
                          size="small"
                          style={{ 
                            color: '#1F4842', 
                            fontWeight: '600',
                            background: 'rgba(31, 72, 66, 0.1)',
                            borderRadius: '6px',
                            padding: '4px 12px'
                          }}
                        >
                          👁️ Preview
                        </Button>
                        <Button 
                          type="link" 
                          danger 
                          onClick={() => setOfferLetter(null)}
                          size="small"
                          style={{
                            fontWeight: '600',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '6px',
                            padding: '4px 12px'
                          }}
                        >
                          🗑️ Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Form.Item>
            </div>
          </div>
        )}

        {/* Enhanced Contact & Employment Information */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Section Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '28px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MailOutlined style={{ fontSize: '18px', color: '#059669' }} />
              </div>
              <Title level={4} style={{ 
                margin: 0,
                color: '#1e293b',
                fontWeight: '600',
                fontSize: '18px'
              }}>
                Contact & Employment Details
              </Title>
            </div>

            {/* Enhanced Email Section */}
            {editingEmployee && !isUpdatingEmail ? (
              <Form.Item 
                label={
                  <span style={{ 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Email Address
                  </span>
                }
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MailOutlined style={{ fontSize: '14px', color: '#1d4ed8' }} />
                  </div>
                  <Input
                    value={editingEmployee.email}
                    disabled
                    style={{ 
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      flex: 1,
                      padding: '0',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  />
                  <Button 
                    type="link"
                    onClick={() => {
                      setIsUpdatingEmail(true);
                      form.setFieldsValue({ newEmail: '' });
                    }}
                    style={{ 
                      color: 'white',
                      fontWeight: '600',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #1F4842 0%, #2d5a50 100%)',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 4px 15px rgba(31, 72, 66, 0.2)'
                    }}
                  >
                    🔄 Update Email
                  </Button>
                </div>
              </Form.Item>
            ) : (
              <>
                {editingEmployee && isUpdatingEmail && (
                  <Form.Item 
                    label={
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#374151',
                        fontSize: '14px'
                      }}>
                        Current Email
                      </span>
                    }
                  >
                    <Input
                      value={currentEmail}
                      disabled
                      prefix={
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: '#fef2f2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '12px' }}>⚠️</span>
                        </div>
                      }
                      style={{ 
                        backgroundColor: '#fef2f2',
                        color: '#991b1b',
                        borderColor: '#fecaca',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontWeight: '500'
                      }}
                    />
                  </Form.Item>
                )}
                <Form.Item
                  name={editingEmployee && isUpdatingEmail ? "newEmail" : "email"}
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      {editingEmployee && isUpdatingEmail ? "New Email Address" : "Email Address"}
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter valid email' }
                  ]}
                >
                  <Input 
                    placeholder="Enter professional email address"
                    prefix={
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <MailOutlined style={{ fontSize: '12px', color: '#1d4ed8' }} />
                      </div>
                    }
                    style={{
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      padding: '12px 16px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1F4842';
                      e.target.style.boxShadow = '0 0 0 3px rgba(31, 72, 66, 0.1)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafafa';
                    }}
                  />
                </Form.Item>
                {editingEmployee && isUpdatingEmail && (
                  <Form.Item>
                    <Button 
                      type="link"
                      onClick={() => {
                        setIsUpdatingEmail(false);
                        form.setFieldsValue({ email: currentEmail, newEmail: '' });
                      }}
                      style={{ 
                        color: '#6b7280', 
                        padding: '0',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      ← Cancel Email Update
                    </Button>
                  </Form.Item>
                )}
              </>
            )}

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="department"
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Department
                    </span>
                  }
                  rules={[{ required: true, message: 'Please enter department' }]}
                >
                  <Input 
                    placeholder="e.g., Software Development, Marketing"
                    prefix={
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TeamOutlined style={{ fontSize: '12px', color: '#7c3aed' }} />
                      </div>
                    }
                    style={{
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      padding: '12px 16px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1F4842';
                      e.target.style.boxShadow = '0 0 0 3px rgba(31, 72, 66, 0.1)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafafa';
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="pay"
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Monthly Salary
                    </span>
                  }
                  rules={[
                    { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid amount' }
                  ]}
                >
                  <Input 
                    placeholder="Enter monthly compensation" 
                    prefix={
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '8px',
                        paddingRight: '8px',
                        borderRight: '1px solid #e5e7eb',
                        marginRight: '8px'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>₹</span>
                        </div>
                        <span style={{ color: '#6b7280', fontWeight: '600', fontSize: '14px' }}>INR</span>
                      </div>
                    }
                    type="number"
                    step="0.01"
                    min="0"
                    style={{
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      padding: '12px 16px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1F4842';
                      e.target.style.boxShadow = '0 0 0 3px rgba(31, 72, 66, 0.1)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafafa';
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="employeeType"
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Employment Type
                    </span>
                  }
                  rules={[{ required: true, message: 'Please select employee type' }]}
                >
                  <Select 
                    placeholder="Select employment category"
                    style={{
                      borderRadius: '10px'
                    }}
                    size="large"
                    dropdownStyle={{
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <Select.Option value="full-time">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }} />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>Full-time Employee</div>
                          
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value="temporary">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                        }} />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>Temporary Employee</div>
                          
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value="internship">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                        }} />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>Internship</div>
                          
                        </div>
                      </div>
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="employeeId"
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Employee ID
                    </span>
                  }
                >
                  <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: '10px',
                    border: '2px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135d, #22c55e 0%, #16a34a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>ID</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#065f46'
                      }}>
                        Auto-generated upon creation
                      </div>
                      <div style={{ 
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        Unique identifier will be assigned automatically
                      </div>
                    </div>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>

        {/* Enhanced Work Schedule Section */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Section Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '28px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f1f5f9'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TeamOutlined style={{ fontSize: '18px', color: '#7c3aed' }} />
              </div>
              <Title level={4} style={{ 
                margin: 0,
                color: '#1e293b',
                fontWeight: '600',
                fontSize: '18px'
              }}>
                Work Schedule & Duration
              </Title>
            </div>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="startDate"
                  label={
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: '14px'
                    }}>
                      Start Date
                    </span>
                  }
                  rules={[{ required: true, message: 'Please select start date' }]}
                >
                  <DatePicker 
                    placeholder="Select joining date"
                    style={{ 
                      width: '100%',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      padding: '12px 16px',
                      background: '#fafafa',
                      transition: 'all 0.3s ease'
                    }}
                    size="large"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1F4842';
                      e.target.style.boxShadow = '0 0 0 3px rgba(31, 72, 66, 0.1)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafafa';
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
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
                        label={
                          <span style={{ 
                            fontWeight: '600', 
                            color: '#374151',
                            fontSize: '14px'
                          }}>
                            End Date
                          </span>
                        }
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
                        <DatePicker 
                          placeholder="Select contract end date"
                          style={{ 
                            width: '100%',
                            borderRadius: '10px',
                            border: '2px solid #e5e7eb',
                            padding: '12px 16px',
                            background: '#fafafa',
                            transition: 'all 0.3s ease'
                          }}
                          size="large"
                          onFocus={(e) => {
                            e.target.style.borderColor = '#1F4842';
                            e.target.style.boxShadow = '0 0 0 3px rgba(31, 72, 66, 0.1)';
                            e.target.style.background = 'white';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.boxShadow = 'none';
                            e.target.style.background = '#fafafa';
                          }}
                        />
                      </Form.Item>
                    ) : (
                      <div style={{ marginTop: '32px' }}>
                        <div style={{ 
                          padding: '24px',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          borderRadius: '12px',
                          border: '2px solid #bbf7d0',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                          }}>
                            <span style={{ color: 'white', fontSize: '18px' }}>∞</span>
                          </div>
                          <Text style={{ 
                            color: '#065f46', 
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'block'
                          }}>
                            Permanent Position
                          </Text>
                          <Text style={{ 
                            color: '#6b7280', 
                            fontSize: '12px'
                          }}>
                            No end date required for full-time employees
                          </Text>
                        </div>
                      </div>
                    );
                  }}
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>


        {/* Enhanced Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '20px',
          paddingTop: '32px',
          borderTop: '2px solid #e2e8f0',
          marginTop: '24px'
        }}>
          <Button 
            onClick={onClose}
            size="large"
            style={{
              borderRadius: '10px',
              padding: '12px 32px',
              fontWeight: '600',
              border: '2px solid #d1d5db',
              color: '#6b7280',
              height: '52px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6b7280';
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
            style={{
              borderRadius: '10px',
              padding: '12px 48px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #1F4842 0%, #2d5a50 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(31, 72, 66, 0.3)',
              height: '52px',
              transition: 'all 0.3s ease'
            }}
             onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(31, 72, 66, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(31, 72, 66, 0.3)';
            }}
          >
            {editingEmployee ? 'Update Employee' : 'Create Employee'}
          </Button>
        </div>
      </Form>
    </div>
  </div>
)}
    </Modal>
  );
});

const ENCRYPTION_KEY = 'My@cCe55!2021';

// Main Employee Management Component
const EmployeeManagement = ({ userRole }) => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [currentEmployeeType, setCurrentEmployeeType] = useState('');
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

const handleSendCredentials = useCallback(async (employee) => {
  try {
    setLoading(true);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('password')
      .eq('id', employee.id)
      .single();

    if (error || !data) {
      message.error('Unable to fetch employee credentials');
      return;
    }

    // Decrypt password before sending email
    const decryptedPassword = CryptoJS.AES.decrypt(data.password, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);

    const emailResult = await sendWelcomeEmail({
      name: employee.name,
      email: employee.email,
      password: decryptedPassword,
      role: employee.role || 'employee'
    });

    if (emailResult.success) {
      message.success(`Credentials sent successfully to ${employee.email}`);
    } else {
      message.error(`Failed to send credentials: ${emailResult.message}`);
    }
  } catch (error) {
    console.error('Error sending credentials:', error);
    message.error('Error sending credentials');
  } finally {
    setLoading(false);
  }
}, []);

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
        mobile,
        role,
        employee_id,
        isactive,
        portal_access,
        profileimage,
        employee_type,
        start_date,
        end_date,
        created_at,
        updated_at,
        face_embedding,
        department,
        pay,
        payroll (
          id,
          basic,
          hra,
          income_tax,
          earnings,
          pf,
          pay_period,
          pay_date
        )
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
    employee.mobile?.includes(search) || // ADD THIS LINE
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
if (filterOptions.status && filterOptions.status !== '' && filterOptions.status !== undefined) {
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

  const fetchEmployees = useCallback(async (page = 1, pageSize = 5, search = '', filterOptions = {}) => {
  try {
    setLoading(true);
    
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    
    // Build query
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        mobile,
        role,
        employee_id,
        isactive,
        portal_access,
        profileimage,
        employee_type,
        start_date,
        end_date,
        created_at,
        updated_at,
        face_embedding,
        department,
        pay,
        payroll (
          id,
          basic,
          hra,
          income_tax,
          earnings,
          pf,
          pay_period,
          pay_date
        )
      `, { count: 'exact' })
      .eq('role', 'employee')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply search filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    // Apply type filter
    if (filterOptions.employeeType) {
      query = query.eq('employee_type', filterOptions.employeeType);
    }

    // Apply status filter
    if (filterOptions.status) {
      const isActive = filterOptions.status === 'active';
      query = query.eq('isactive', isActive);
    }

    const { data, error, count } = await query;
    
    if (error) {
      console.error('Fetch error:', error);
      throw error;
    }

    setEmployees(data || []);
    setPagination({
      current: page,
      pageSize: pageSize,
      total: count || 0
    });
    
  } catch (error) {
    console.error('Error fetching employees:', error);
    message.error(`Error loading employees: ${error.message}`);
  } finally {
    setLoading(false);
  }
}, []);
const refreshData = useCallback(async () => {
  try {
    await fetchEmployees(pagination.current, pagination.pageSize, searchQuery, filters);
    await fetchAllEmployees(); // Keep this only for statistics
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}, [fetchEmployees, fetchAllEmployees, pagination.current, pagination.pageSize, searchQuery, filters]);

const handleAccessToggle = useCallback(async (employeeId, hasAccess) => {
  try {
    setLoading(true);
    
    const { error } = await supabaseAdmin
      .from('users')
      .update({ portal_access: hasAccess })
      .eq('id', employeeId);

    if (error) throw error;
    
    message.success(`Portal access ${hasAccess ? 'granted' : 'denied'} successfully`);
    await refreshData();
  } catch (error) {
    console.error('Error updating portal access:', error);
    message.error('Failed to update portal access');
  } finally {
    setLoading(false);
  }
}, [refreshData]);

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
          applyFiltersAndPagination([payload.new, ...allEmployees], searchQuery, pagination.current, pagination.pageSize, filters);
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
}, [] );

useEffect(() => {
  if (userRole === 'superadmin' || userRole === 'admin' || userRole === 'hr') {
    fetchEmployees(1, 5);
    fetchAllEmployees(); // Keep this for statistics
  }
}, [userRole, fetchEmployees,fetchAllEmployees]);


const handleEmployeeTypeFilter = useCallback((value) => {
  const newFilters = { ...filters, employeeType: value };
  setFilters(newFilters);
  fetchEmployees(1, pagination.pageSize, searchQuery, newFilters);
}, [fetchEmployees, searchQuery, pagination.pageSize, filters]);

const handleStatusFilter = useCallback((value) => {
  const newFilters = { ...filters, status: value };
  setFilters(newFilters);
  fetchEmployees(1, pagination.pageSize, searchQuery, newFilters);
}, [fetchEmployees, searchQuery, pagination.pageSize, filters]);

const handleClearFilters = useCallback(() => {
  const clearedFilters = { employeeType: '', status: '' };
  setFilters(clearedFilters);
  setSearchQuery('');
  fetchEmployees(1, pagination.pageSize, '', clearedFilters);
}, [fetchEmployees, pagination.pageSize]);

const handleTableChange = useCallback((paginationInfo) => {
  fetchEmployees(paginationInfo.current, paginationInfo.pageSize, searchQuery, filters);
}, [fetchEmployees, searchQuery, filters]);

  const handleSearch = useCallback((value) => {
  setSearchQuery(value);
  fetchEmployees(1, pagination.pageSize, value, filters);
}, [fetchEmployees, pagination.pageSize, filters]);

  const handleEdit = useCallback((employee) => {
    setEditingEmployee(employee);
    setShowFormModal(true);
  }, []);

const handleDelete = useCallback(async (employeeId) => {
  try {
    setLoading(true);
    
    // Delete leave applications first
    const { error: leaveError } = await supabaseAdmin
      .from('leave_applications')
      .delete()
      .eq('user_id', employeeId);

    if (leaveError) {
      console.error('Delete leave applications error:', leaveError);
      throw leaveError;
    }

    // Delete payroll records
    const { error: payrollError } = await supabaseAdmin
      .from('payroll')
      .delete()
      .eq('user_id', employeeId);

    if (payrollError) {
      console.error('Delete payroll error:', payrollError);
      throw payrollError;
    }
    
    // Delete attendance records
    const { error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('user_id', employeeId);
      
    if (attendanceError) {
      console.error('Delete attendance error:', attendanceError);
      throw attendanceError;
    }

    // Finally delete the employee
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
  title: 'Pay',
  render: (text, record) => {
    
    
    // Check if employee has payroll records
    if (!record.payroll || !Array.isArray(record.payroll) || record.payroll.length === 0) {
      return 'No Payroll';
    }
    
    // Get the first payroll record
    const payrollRecord = record.payroll[0];
    const earnings = payrollRecord.earnings;
    
    if (!earnings || !Array.isArray(earnings)) {
      return 'N/A';
    }
    
    // Find the earning with label "basic" or "Basic" (case-insensitive)
    const basicEarning = earnings.find(earning => 
      earning.label && earning.label.toLowerCase() === "basic"
    );
    
    if (basicEarning && basicEarning.amount) {
      return `₹${parseFloat(basicEarning.amount).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
    
    return 'N/A';
  },
},
    // {
    //   title: 'Created Date',
    //   dataIndex: 'created_at',
    //   key: 'createdAt',
    //   width: 120,
    //   render: (date) => (
    //     date ? new Date(date).toLocaleDateString() : 'Unknown'
    //   ),
    //   responsive: ['xl'],
    // },
    {
  title: 'Actions',
  key: 'actions',
  fixed: 'right',
  width: isMobile ? 160 : 200, // Increased width to accommodate new button
  render: (_, record) => (
    <div className={isMobile ? 'mobile-actions' : 'actions-container'} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      <Button
        type="primary"
        icon={<EditOutlined />}
        size={isMobile ? "small" : "middle"}
        onClick={() => handleEdit(record)}
        className="brand-primary"
        title="Edit Employee"
      />
      <Button
        type="default"
        icon={<MailOutlined />}
        size={isMobile ? "small" : "middle"}
        onClick={() => handleSendCredentials(record)}
        style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
        title="Send Credentials"
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
          title="Delete Employee"
        />
      </Popconfirm>
    </div>
  ),
},
  ], [isMobile, handleEdit, handleDelete, handleSendCredentials, handleAccessToggle, loading]);

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
                      onSendCredentials={handleSendCredentials}
                      onAccessToggle={handleAccessToggle}
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
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showQuickJumper: true,
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
            isMobile={isMobile} // Add this prop
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
