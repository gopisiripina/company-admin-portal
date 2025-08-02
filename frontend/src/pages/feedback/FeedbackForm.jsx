import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Alert } from 'antd';
import { MessageSquare, Send, User } from 'lucide-react';
import { supabase } from '../../supabase/config';
const { Title, Text } = Typography;
const { TextArea } = Input;

const FeedbackForm = ({ userData, onSubmitSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  

  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Simulate API call - replace with actual submission logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const feedbackData = {
        title: values.title,
        description: values.description,
        employee_id: userData?.id,
        employee_name: userData?.name || userData?.displayName,
        employee_email: userData?.email,
        submitted_at: new Date().toISOString(),
        status: 'pending'
      };

      console.log('Feedback submitted:', feedbackData);
      
      // Reset form and show success
      form.resetFields();
      setSubmitted(true);
      message.success('Feedback submitted successfully!');
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess(feedbackData);
      }

      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}>
            <MessageSquare size={36} color="white" />
          </div>
          
          <Title level={2} style={{ 
            margin: '0 0 8px 0', 
            color: '#1e293b',
            fontWeight: '700'
          }}>
            Employee Feedback
          </Title>
          
          <Text style={{ 
            fontSize: '16px', 
            color: '#64748b',
            lineHeight: '1.6'
          }}>
            Share your thoughts, suggestions, or concerns with the management team
          </Text>
        </div>

        {/* Employee Info */}
        <Card 
          size="small"
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            marginBottom: '24px'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <Space align="center">
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} color="white" />
            </div>
            <div>
              <Text strong style={{ display: 'block', fontSize: '14px' }}>
                {userData?.name || userData?.displayName || 'Employee'}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {userData?.email || 'employee@company.com'}
              </Text>
            </div>
          </Space>
        </Card>

        {/* Success Alert */}
        {submitted && (
          <Alert
            message="Feedback Submitted Successfully!"
            description="Thank you for your feedback. The management team will review it shortly."
            type="success"
            showIcon
            style={{ 
              marginBottom: '24px',
              borderRadius: '8px'
            }}
          />
        )}

        {/* Feedback Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="title"
            label={
              <Text strong style={{ fontSize: '14px', color: '#374151' }}>
                Feedback Title
              </Text>
            }
            rules={[
              { required: true, message: 'Please enter a title for your feedback' },
              { min: 5, message: 'Title must be at least 5 characters long' },
              { max: 100, message: 'Title cannot exceed 100 characters' }
            ]}
          >
            <Input
              placeholder="Enter a brief title for your feedback..."
              size="large"
              style={{
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '14px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <Text strong style={{ fontSize: '14px', color: '#374151' }}>
                Detailed Description
              </Text>
            }
            rules={[
              { required: true, message: 'Please provide a detailed description' },
              { min: 20, message: 'Description must be at least 20 characters long' },
              { max: 1000, message: 'Description cannot exceed 1000 characters' }
            ]}
          >
            <TextArea
              placeholder="Please provide detailed feedback, suggestions, or concerns..."
              rows={6}
              showCount
              maxLength={1000}
              style={{
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '14px',
                resize: 'vertical'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              icon={<Send size={18} />}
              style={{
                height: '50px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              {loading ? 'Submitting Feedback...' : 'Submit Feedback'}
            </Button>
          </Form.Item>
        </Form>

        {/* Footer Note */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px'
        }}>
          <Text style={{ 
            fontSize: '12px', 
            color: '#64748b',
            lineHeight: '1.5'
          }}>
            💡 Your feedback is valuable to us and helps improve our workplace. 
            All submissions are reviewed by the management team and treated confidentially.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackForm;