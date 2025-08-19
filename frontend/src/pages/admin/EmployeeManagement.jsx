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
    const response = await fetch('https://cap.myaccessio.com/api/send-email', {
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
          website_link: "https://cap.myaccessio.com/",
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
const MobileEmployeeCard = React.memo(({ employee, onEdit, onDelete, onSendCredentials  }) => (
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
    onClick={() => onSendCredentials(employee)} // You'll need to pass this prop
    style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
  >
    Send
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
          employeeType: editingEmployee.employee_type || 'full-time',
          startDate: editingEmployee.start_date ? dayjs(editingEmployee.start_date) : null,
          endDate: editingEmployee.end_date ? dayjs(editingEmployee.end_date) : null,
          pay: editingEmployee.payroll?.[0]?.net_pay || editingEmployee.payroll?.net_pay
        });
        setProfileImage(editingEmployee.profileimage || null);
        setFaceEmbedding(editingEmployee.face_embedding || null);
        // ADD THESE LINES:
        setCurrentEmployeeType(editingEmployee.employee_type || 'full-time');
        setIsUpdatingEmail(false);
      }, 0);
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: false,email: '' });
      setProfileImage(null);
      setFaceEmbedding(null);
      // ADD THESE LINES:
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
    setEmployeeCreationType(null); // ADD THIS
    setOfferLetter(null); // ADD THIS
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
      .from('profile-images') // Using existing bucket
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    setOfferLetter(publicUrl);
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
      
      const embeddingResponse = await fetch('https://cap.myaccessio.com/api/get-face-embedding/', {
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

      // Update payroll record
      if (values.pay) {
        const currentDate = new Date();
        const currentMonth = currentDate.toISOString().slice(0, 7) + '-01';
        const payAmount = parseFloat(values.pay);
        
        const { error: payrollError } = await supabaseAdmin
          .from('payroll')
          .upsert({
            user_id: editingEmployee.id,
            company_name: "My Access",
            company_address: "Your Company Address",
            city: "Your City", 
            employee_name: values.name,
            employee_id: newEmployeeId,
            email_address: isUpdatingEmail && values.newEmail ? values.newEmail : values.email,
            pay_period: currentMonth,
            pay_date: currentDate.toISOString().slice(0, 10),
            paid_days: 30,
            lop_days: 0,
            basic: payAmount,
            hra: 0,
            income_tax: 0,
            pf: 0
          }, {
            onConflict: 'employee_id,pay_period'
          });
          
        if (payrollError) {
          console.error('Payroll update error:', payrollError);
          message.warning('Employee updated but payroll update failed');
        }
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
        isfirstlogin: true,
        profileimage: profileImage,
        password: encryptedPassword, // Store encrypted password
        employee_type: values.employeeType,
        start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        end_date: values.employeeType === 'full-time' ? null : (values.endDate ? values.endDate.format('YYYY-MM-DD') : null),
        face_embedding: finalFaceEmbedding,
        pay: payAmount
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

      // Create payroll record
      if (values.pay && data && data[0]) {
        const currentDate = new Date();
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
          basic: payAmount,
          hra: 0,
          income_tax: 0,
          pf: 0
        };
        
        const { error: payrollError } = await supabaseAdmin
          .from('payroll')
          .insert(payrollData);
          
        if (payrollError) {
          console.error('Payroll creation error:', payrollError);
          message.warning('Employee created but payroll setup failed');
        }
      }
      
      message.success('Employee created successfully!');
      
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
}, [editingEmployee, generatePassword, onSuccess, onClose, form, profileImage, deleteOldProfileImage, faceEmbedding, uploadedFile, isUpdatingEmail, currentEmail]); 

  return (
    <Modal
      title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      className="employee-form-modal"
    >
        {!editingEmployee && !employeeCreationType ? (
      // Employee Type Selection Screen
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Title level={4} style={{ marginBottom: '24px' }}>Select Employee Type</Title>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            onClick={() => setEmployeeCreationType('new')}
            style={{ width: '200px', height: '50px', fontSize: '16px' }}
            className="brand-primary"
          >
            New Employee
          </Button>
          <Button
            type="default"
            size="large"
            onClick={() => setEmployeeCreationType('existing')}
            style={{ width: '200px', height: '50px', fontSize: '16px' }}
          >
            Existing Employee
          </Button>
        </Space>
        <Button 
          type="text" 
          onClick={onClose}
          style={{ marginTop: '20px' }}
        >
          Cancel
        </Button>
      </div>
    ) : (
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
{/* ADD THIS AFTER PROFILE IMAGE SECTION */}
        {!editingEmployee && employeeCreationType === 'existing' && (
          <Form.Item
            label="Offer Letter"
            extra="Upload PDF file, max 5MB"
            style={{ marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Upload
                showUploadList={false}
                beforeUpload={handleOfferLetterUpload}
                accept="application/pdf"
              >
                <Button icon={<UploadOutlined />}>
                  {offerLetter ? 'Change Offer Letter' : 'Upload Offer Letter'}
                </Button>
              </Upload>
              {offerLetter && (
                <>
                  <Button 
                    type="link" 
                    onClick={() => window.open(offerLetter, '_blank')}
                    size="small"
                  >
                    View PDF
                  </Button>
                  <Button 
                    type="link" 
                    danger 
                    onClick={() => setOfferLetter(null)}
                    size="small"
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          </Form.Item>
        )}

        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter employee name' }]}
        >
          <Input placeholder="Enter employee name" />
        </Form.Item>

        {/* Email Section - REPLACE THE EXISTING EMAIL FORM ITEM WITH THIS */}
{editingEmployee && !isUpdatingEmail ? (
  <Form.Item label="Email">
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Input
        value={editingEmployee.email}
        disabled
        style={{ 
          backgroundColor: '#f5f5f5',
          color: '#666',
          flex: 1
        }}
      />
      <Button 
        type="link"
        onClick={() => {
          setIsUpdatingEmail(true);
          form.setFieldsValue({ newEmail: '' });
        }}
        style={{ color: '#1F4842' }}
      >
        Update
      </Button>
    </div>
  </Form.Item>
) : (
  <>
    {editingEmployee && isUpdatingEmail && (
      <Form.Item label="Current Email">
        <Input
          value={currentEmail}
          disabled
          style={{ 
            backgroundColor: '#f5f5f5',
            color: '#666'
          }}
        />
      </Form.Item>
    )}
    <Form.Item
      name={editingEmployee && isUpdatingEmail ? "newEmail" : "email"}
      label={editingEmployee && isUpdatingEmail ? "New Email" : "Email"}
      rules={[
        { required: true, message: 'Please enter email' },
        { type: 'email', message: 'Please enter valid email' }
      ]}
    >
      <Input placeholder="Enter email address" />
    </Form.Item>
    {editingEmployee && isUpdatingEmail && (
      <Form.Item>
        <Button 
          type="link"
          onClick={() => {
            setIsUpdatingEmail(false);
            form.setFieldsValue({ email: currentEmail, newEmail: '' });
          }}
          style={{ color: '#666', padding: 0 }}
        >
          Cancel Update
        </Button>
      </Form.Item>
    )}
  </>
)}
{/* ADD MOBILE NUMBER FIELD AFTER EMAIL SECTION */}
<Form.Item
  name="mobile"
  label="Mobile Number"
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
    prefix="+91"
    maxLength={10}
  />
</Form.Item>
{/* ADD PAY FIELD AFTER DEPARTMENT FIELD */}
<Form.Item
  name="pay"
  label="Pay/Salary"
  rules={[
    { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid amount (max 2 decimal places)' }
  ]}
>
  <Input 
    placeholder="Enter salary amount" 
    prefix="₹"
    type="number"
    step="0.01"
    min="0"
  />
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
    )}
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
    profileimage,
    employee_type,
    start_date,
    end_date,
    created_at,
    updated_at,
    face_embedding,
    department,
    pay,
    payroll(
      id,
      basic,
      hra,
      gross_earnings,
      income_tax,
      pf,
      total_deductions,
      net_pay,
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
    const initializeData = async () => {
      try {
        setLoading(true);
        const employeeList = await fetchAllEmployees();
        setAllEmployees(employeeList);
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
  title: 'Pay',
  dataIndex: ['pay'],
  key: 'pay',
  width: 120,
  render: (pay) => (
    pay ? `₹${parseFloat(pay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'
  ),
  responsive: ['lg'],
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
                      onSendCredentials={handleSendCredentials}
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
                     itemRender: (current, type, originalElement) => {
    if (type === 'page') {
      return (
        <a style={{ 
          color: '#000000d9', 
          backgroundColor: 'white',
          border: '1px solid #d9d9d9'
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
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
