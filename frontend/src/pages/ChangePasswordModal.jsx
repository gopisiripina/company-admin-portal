import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography, Space } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const { Title, Text } = Typography;

const ChangePasswordModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onPasswordChanged 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Update user password and set isFirstLogin to false
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        password: values.newPassword,
        isFirstLogin: false,
        updatedAt: new Date()
      });

      message.success('Password changed successfully!');
      form.resetFields();
      
      // Call the callback to redirect to dashboard
      if (onPasswordChanged) {
        onPasswordChanged({
          ...user,
          isFirstLogin: false
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      message.error('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please enter your new password'));
    }
    if (value.length < 8) {
      return Promise.reject(new Error('Password must be at least 8 characters long'));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject(new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number'));
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please confirm your password'));
    }
    if (value !== form.getFieldValue('newPassword')) {
      return Promise.reject(new Error('Passwords do not match'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      closable={false}
      maskClosable={false}
      width={500}
      className="change-password-modal"
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          background: '#f0f9ff', 
          borderRadius: '50%', 
          width: '64px', 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <LockOutlined style={{ fontSize: '24px', color: '#1F4842' }} />
        </div>
        
        <Title level={3} style={{ margin: '0 0 8px 0', color: '#1F4842' }}>
          Change Your Password
        </Title>
        
        <Text type="secondary">
          This is your first login. Please change your temporary password to continue.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="currentPassword"
          label="Current Password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your current password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[{ validator: validatePassword }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your new password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          rules={[{ validator: validateConfirmPassword }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm your new password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            size="large"
          />
        </Form.Item>

        <div style={{ 
          background: '#f8fafc', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <Text strong style={{ fontSize: '14px', color: '#374151' }}>
            Password Requirements:
          </Text>
          <ul style={{ 
            margin: '8px 0 0 0', 
            paddingLeft: '20px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <li>At least 8 characters long</li>
            <li>Contains at least one uppercase letter</li>
            <li>Contains at least one lowercase letter</li>
            <li>Contains at least one number</li>
          </ul>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              style={{ 
                backgroundColor: '#1F4842',
                borderColor: '#1F4842',
                minWidth: '120px'
              }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;