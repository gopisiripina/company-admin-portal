import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Typography, 
  Space, 
  Alert, 
  Select, 
  Checkbox, 
  List, 
  Avatar, 
  Tag, 
  Drawer, 
  Badge,
  Tooltip,
  Divider,
  Empty,
  Spin,
  Modal,
  Progress,
  Tabs,
  FloatButton,
  Collapse,
  Row,
  Col
} from 'antd';
import { 
  MessageSquare, 
  Send, 
  User, 
  Reply, 
  Eye, 
  MessageCircle, 
  Clock, 
  Filter,
  Search,
  Plus,
  Settings,
  Bell,
  ChevronRight,
  Menu,
  X,
  Home,
  BarChart,
  FileText,
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Edit,
  Share2,
  Download,
  Calendar,
  Globe
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ProfessionalFeedbackForm = ({ userData, onSubmitSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('submit');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Enhanced mock data with more variety
  const [feedbackList, setFeedbackList] = useState([
    {
      id: 1,
      title: "Performance issue with dashboard loading",
      description: "The main dashboard takes too long to load during peak hours. This affects productivity significantly. Users are experiencing 15+ second load times which is unacceptable for a business application.",
      feedback_type: "performance",
      priority: "high",
      status: "in_progress",
      employee_name: "John Smith",
      employee_role: "Senior Developer",
      department: "Engineering",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      reply_count: 3,
      view_count: 24,
      likes: 8,
      anonymous_submission: false,
      tags: ["urgent", "dashboard", "performance"],
      estimated_resolution: "2024-08-10",
      assigned_to: "Tech Team",
      feedback_replies: [
        {
          id: 1,
          reply_text: "We're investigating this issue. Can you provide more details about the browser you're using and the time of day when this occurs most frequently?",
          user_name: "Sarah Wilson",
          user_role: "Tech Lead",
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          likes: 2
        },
        {
          id: 2,
          reply_text: "I've identified the bottleneck in our database queries. Working on optimization now. Should have a fix deployed by end of week.",
          user_name: "Mike Chen",
          user_role: "Backend Developer",
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          likes: 5
        }
      ]
    },
    {
      id: 2,
      title: "Feature request: Dark mode for the application",
      description: "Many users would benefit from a dark mode option, especially for extended work sessions. This would reduce eye strain and improve user experience during late hours.",
      feedback_type: "feature_request",
      priority: "medium",
      status: "planned",
      employee_name: "Sarah Johnson",
      employee_role: "UX Designer",
      department: "Design",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      reply_count: 6,
      view_count: 45,
      likes: 23,
      anonymous_submission: false,
      tags: ["ui", "accessibility", "user-experience"],
      estimated_resolution: "2024-09-15",
      assigned_to: "Design Team",
      feedback_replies: [
        {
          id: 1,
          reply_text: "Great suggestion! We're actually planning to implement this in our next major release. I'll add you to the beta testing list.",
          user_name: "Emma Davis",
          user_role: "Product Manager",
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          likes: 12
        }
      ]
    },
    {
      id: 3,
      title: "Critical bug in expense reporting module",
      description: "Unable to submit expense reports when uploading receipts larger than 2MB. Error message is unclear and users are losing their work. This is blocking our monthly expense submissions.",
      feedback_type: "bug_report",
      priority: "critical",
      status: "resolved",
      employee_name: "Anonymous",
      employee_role: "Employee",
      department: "Finance",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      reply_count: 5,
      view_count: 67,
      likes: 15,
      anonymous_submission: true,
      tags: ["critical", "expenses", "file-upload"],
      estimated_resolution: "2024-08-05",
      assigned_to: "Backend Team",
      resolution_notes: "Increased file upload limit to 10MB and improved error handling.",
      feedback_replies: []
    },
    {
      id: 4,
      title: "Security concern: Password reset process",
      description: "The current password reset process seems vulnerable. Users can reset passwords without proper verification steps.",
      feedback_type: "security_concern",
      priority: "high",
      status: "under_review",
      employee_name: "Alex Thompson",
      employee_role: "Security Analyst",
      department: "IT Security",
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      reply_count: 2,
      view_count: 12,
      likes: 4,
      anonymous_submission: false,
      tags: ["security", "authentication", "urgent"],
      estimated_resolution: "2024-08-08",
      assigned_to: "Security Team",
      feedback_replies: []
    }
  ]);

  const [statistics] = useState({
    total_feedback: 156,
    resolved: 89,
    in_progress: 31,
    open: 36,
    average_resolution_time: "4.2 days",
    user_satisfaction: 87
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Simulate API call with progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        // You could update a progress state here if needed
      }
      
      console.log('Feedback submitted:', values);
      
      // Add new feedback to list (simulate)
      const newFeedback = {
        id: Date.now(),
        title: values.title,
        description: values.description,
        feedback_type: values.feedback_type,
        priority: values.priority,
        status: "open",
        employee_name: userData?.name || "Current User",
        employee_role: userData?.role || "Employee",
        department: userData?.department || "General",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_count: 0,
        view_count: 1,
        likes: 0,
        anonymous_submission: values.anonymous_submission || false,
        tags: [],
        assigned_to: "Pending Assignment",
        feedback_replies: []
      };
      
      setFeedbackList(prev => [newFeedback, ...prev]);
      
      form.resetFields();
      setSubmitted(true);
      setCurrentStep(0);
      setAttachments([]);
      
      const trackingId = Math.floor(Math.random() * 10000);
      message.success({
        content: `Feedback submitted successfully! Tracking ID: #${trackingId}`,
        duration: 5,
        style: { marginTop: '20px' }
      });
      
      if (onSubmitSuccess) {
        onSubmitSuccess(values);
      }

      // Auto switch to feedback list on mobile
      if (isMobile) {
        setTimeout(() => setActiveTab('list'), 1000);
      }

      setTimeout(() => setSubmitted(false), 8000);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (feedbackId) => {
    if (!replyText.trim()) return;
    
    setReplyLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add reply to the selected feedback
      const newReply = {
        id: Date.now(),
        reply_text: replyText,
        user_name: userData?.name || "Current User",
        user_role: userData?.role || "Employee",
        created_at: new Date().toISOString(),
        likes: 0
      };
      
      setFeedbackList(prev => prev.map(item => 
        item.id === feedbackId 
          ? { 
              ...item, 
              feedback_replies: [...(item.feedback_replies || []), newReply],
              reply_count: (item.reply_count || 0) + 1,
              updated_at: new Date().toISOString()
            }
          : item
      ));
      
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback(prev => ({
          ...prev,
          feedback_replies: [...(prev.feedback_replies || []), newReply],
          reply_count: (prev.reply_count || 0) + 1
        }));
      }
      
      setReplyText('');
      message.success('Reply added successfully!');
      
    } catch (error) {
      console.error('Error adding reply:', error);
      message.error('Failed to add reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const getFilteredFeedback = () => {
    let filtered = feedbackList;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.feedback_type === filterType);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === filterPriority);
    }

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#8ac185',
      high: '#8ac185',
      medium: '#8ac185',
      low: '#8ac185'
    };
    return colors[priority] || '#d9d9d9';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#8ac185',
      in_progress: '#8ac185',
      under_review: '#8ac185',
      planned: '#8ac185',
      resolved: '#8ac185',
      closed: '#8ac185'
    };
    return colors[status] || '#d9d9d9';
  };

  const getTypeIcon = (type) => {
    const icons = {
      bug_report: '🐛',
      feature_request: '✨',
      ui_ux_issue: '🎨',
      performance: '⚡',
      security_concern: '🔒',
      data_issue: '📊',
      access_permission: '🔑',
      integration_issue: '🔌',
      project_related: '📋',
      portal_issue: '🌐',
      general_feedback: '💬',
      other: '📝'
    };
    return icons[type] || '📝';
  };

  const handleLikeFeedback = (feedbackId) => {
    setFeedbackList(prev => prev.map(item => 
      item.id === feedbackId 
        ? { ...item, likes: (item.likes || 0) + 1 }
        : item
    ));
    message.success('Thank you for your feedback!');
  };

  const getFormSteps = () => [
    {
      title: 'Basic Info',
      description: 'Title and category'
    },
    {
      title: 'Details',
      description: 'Description and priority'
    },
    {
      title: 'Settings',
      description: 'Visibility and options'
    }
  ];

  // Mobile-First Form Component
  const renderMobileForm = () => (
  <div style={{ padding: '16px' }}>
    {/* Mobile Header with integrated tabs */}
      <div>

      {/* Progress Steps */}
      <div style={{ marginBottom: '24px' }}>
        <Progress 
          percent={(currentStep + 1) * 33.33} 
          showInfo={false}
          strokeColor={{
            '0%': '#8ac185',
            '100%': '#0D7139',
          }}
          style={{ marginBottom: '16px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
          {getFormSteps().map((step, index) => (
            <div key={index} style={{ 
              textAlign: 'center',
              color: index <= currentStep ? '#0D7139' : '#999'
            }}>
              <div style={{ fontWeight: index <= currentStep ? '600' : '400' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '10px' }}>{step.description}</div>
            </div>
          ))}
        </div>
      </div>
      </div>
      {/* User Card */}
      <Card 
        size="small"
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          background: 'linear-gradient(45deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={48}
            style={{
              background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)',
              marginRight: '12px'
            }}
          >
            {(userData?.name || 'User').charAt(0)}
          </Avatar>
          <div>
            <Text strong>{userData?.name || 'John Doe'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {userData?.role || 'Employee'} • {userData?.department || 'General'}
            </Text>
          </div>
        </div>
      </Card>

      {/* Success Alert */}
      {submitted && (
        <Alert
          message="🎉 Feedback Submitted!"
          description="Your feedback has been received and assigned a tracking ID."
          type="success"
          showIcon
          style={{ marginBottom: '24px', borderRadius: '8px' }}
          action={
            <Button size="small" onClick={() => setActiveTab('list')}>
              View List
            </Button>
          }
        />
      )}

      {/* Multi-Step Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <div>
            <Title level={5} style={{ marginBottom: '16px', color: '#374151' }}>
              📝 Basic Information
            </Title>
            
            <Form.Item
              name="title"
              label="Title"
              rules={[
                { required: true, message: 'Please enter a title' },
                { min: 5, message: 'Title must be at least 5 characters' },
                { max: 100, message: 'Title cannot exceed 100 characters' }
              ]}
            >
              <Input
                placeholder="Brief description of your feedback..."
                size="large"
                style={{ borderRadius: '8px' }}
                showCount
                maxLength={100}
              />
            </Form.Item>

            <Form.Item
              name="feedback_type"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select
                placeholder="Select category"
                size="large"
                style={{ borderRadius: '8px' }}
                options={[
                  { value: 'bug_report', label: '🐛 Bug Report' },
                  { value: 'feature_request', label: '✨ Feature Request' },
                  { value: 'ui_ux_issue', label: '🎨 UI/UX Issue' },
                  { value: 'performance', label: '⚡ Performance' },
                  { value: 'security_concern', label: '🔒 Security Concern' },
                  { value: 'data_issue', label: '📊 Data Issue' },
                  { value: 'general_feedback', label: '💬 General Feedback' },
                  { value: 'other', label: '📝 Other' }
                ]}
              />
            </Form.Item>
          </div>
        )}

        {/* Step 2: Detailed Information */}
        {currentStep === 1 && (
          <div>
            <Title level={5} style={{ marginBottom: '16px', color: '#374151' }}>
              📋 Detailed Information
            </Title>
            
            <Form.Item
              name="priority"
              label="Priority Level"
              rules={[{ required: true, message: 'Please select priority' }]}
              initialValue="medium"
            >
              <Select
                size="large"
                style={{ borderRadius: '8px' }}
                options={[
                  { value: 'critical', label: '🔴 Critical - Needs immediate attention' },
                  { value: 'high', label: '🟠 High - Important issue' },
                  { value: 'medium', label: '🟡 Medium - Standard priority' },
                  { value: 'low', label: '🟢 Low - Minor issue' }
                ]}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Detailed Description"
              rules={[
                { required: true, message: 'Please provide details' },
                { min: 20, message: 'Description must be at least 20 characters' }
              ]}
            >
              <TextArea
                placeholder="Provide detailed information about your feedback or issue..."
                rows={6}
                showCount
                maxLength={1000}
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          </div>
        )}

        {/* Step 3: Settings and Options */}
        {currentStep === 2 && (
          <div>
            <Title level={5} style={{ marginBottom: '16px', color: '#374151' }}>
              ⚙️ Visibility & Settings
            </Title>
            
            <Card 
              size="small" 
              style={{ 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ color: '#374151' }}>Sharing Options</Text>
                <Form.Item name="visible_to_developers" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>👩‍💻 Share with Development Team</Checkbox>
                </Form.Item>
                <Form.Item name="visible_to_hr" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>👥 Share with HR Team</Checkbox>
                </Form.Item>
                <Form.Item name="visible_to_all_staff" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>🌐 Make visible to all staff</Checkbox>
                </Form.Item>
                <Divider style={{ margin: '12px 0' }} />
                <Form.Item name="anonymous_submission" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>🕶️ Submit anonymously</Checkbox>
                </Form.Item>
                <Form.Item name="email_notifications" valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox>📧 Receive email notifications</Checkbox>
                </Form.Item>
              </Space>
            </Card>

            {/* Preview Button */}
            <Button
              type="dashed"
              onClick={() => setShowPreview(true)}
              style={{ width: '100%', marginBottom: '16px', borderRadius: '8px' }}
              icon={<Eye size={16} />}
            >
              Preview Feedback
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '24px',
          gap: '12px'
        }}>
          {currentStep > 0 && (
            <Button
              size="large"
              onClick={() => setCurrentStep(currentStep - 1)}
              style={{ flex: 1, borderRadius: '8px' }}
            >
              Previous
            </Button>
          )}
          
          {currentStep < 2 ? (
            <Button
              type="primary"
              size="large"
              onClick={() => setCurrentStep(currentStep + 1)}
              style={{ 
                flex: 1, 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)',
                border: 'none'
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              icon={<Send size={18} />}
              style={{
                flex: 1,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          )}
        </div>
      </Form>
    </div>
  );

  // Desktop Form (existing layout with improvements)
  const renderDesktopForm = () => (
    <div style={{
      width: '45%',
      padding: '24px',
      borderRight: '1px solid #e8eaed',
      backgroundColor: '#ffffff',
      overflowY: 'auto',
      maxHeight: '100vh'
    }}>
      {/* Enhanced Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px'
            }}>
              <MessageSquare size={24} color="white" />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: '#0D7139' }}>
                Submit Feedback
              </Title>
              <Text type="secondary">Share your thoughts and report issues</Text>
            </div>
          </div>
          <Badge count={notifications} style={{ backgroundColor: '#8ac185' }}>
            <Bell size={20} color="#0D7139" />
          </Badge>
        </div>
        
        {/* Statistics Cards */}
        <Row gutter={[12, 12]} style={{ marginTop: '20px' }}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Text style={{ fontSize: '20px', fontWeight: '600', color: '#667eea' }}>
                {statistics.total_feedback}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>Total</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Text style={{ fontSize: '20px', fontWeight: '600', color: '#52c41a' }}>
                {statistics.resolved}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>Resolved</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: '8px' }}>
              <Text style={{ fontSize: '20px', fontWeight: '600', color: '#faad14' }}>
                {statistics.average_resolution_time}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>Avg Time</Text>
            </Card>
          </Col>
        </Row>
      </div>

      {/* User Info Card with enhanced design */}
      <Card 
        size="small"
        style={{
          background: 'linear-gradient(45deg, #f8fafc 0%, #e2e8f0 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          marginBottom: '24px'
        }}
      >
        <Space align="center">
          <Avatar 
            size={48}
            style={{
              background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)',
              fontSize: '18px',
              fontWeight: '600'
            }}
          >
            {(userData?.name || 'User').charAt(0)}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: '16px' }}>
              {userData?.name || 'John Doe'}
            </Text>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {userData?.role || 'Employee'} • {userData?.department || 'Development'}
            </Text>
          </div>
        </Space>
      </Card>

      {/* Success Alert */}
      {submitted && (
        <Alert
          message="🎉 Feedback Submitted Successfully!"
          description="Your feedback has been submitted and assigned a tracking ID. You'll receive notifications about updates."
          type="success"
          showIcon
          style={{ 
            marginBottom: '24px',
            borderRadius: '8px'
          }}
          action={
            <Space>
              <Button size="small" type="primary" onClick={() => setActiveTab('list')}>
                View Feedback
              </Button>
              <Button size="small" onClick={() => setSubmitted(false)}>
                Close
              </Button>
            </Space>
          }
          closable
        />
      )}

      {/* Enhanced Feedback Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="title"
          label={<Text strong style={{ color: '#374151' }}>📝 Feedback Title</Text>}
          rules={[
            { required: true, message: 'Please enter a title' },
            { min: 5, message: 'Title must be at least 5 characters' },
            { max: 100, message: 'Title cannot exceed 100 characters' }
          ]}
        >
          <Input
            placeholder="Brief description of your feedback..."
            size="large"
            style={{ borderRadius: '8px' }}
            showCount
            maxLength={100}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="feedback_type"
              label={<Text strong style={{ color: '#374151' }}>🏷️ Category</Text>}
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select
                placeholder="Select category"
                size="large"
                style={{ borderRadius: '8px' }}
                options={[
                  { value: 'bug_report', label: '🐛 Bug Report' },
                  { value: 'feature_request', label: '✨ Feature Request' },
                  { value: 'ui_ux_issue', label: '🎨 UI/UX Issue' },
                  { value: 'performance', label: '⚡ Performance' },
                  { value: 'security_concern', label: '🔒 Security Concern' },
                  { value: 'data_issue', label: '📊 Data Issue' },
                  { value: 'access_permission', label: '🔑 Access/Permission' },
                  { value: 'integration_issue', label: '🔌 Integration' },
                  { value: 'general_feedback', label: '💬 General Feedback' },
                  { value: 'other', label: '📝 Other' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label={<Text strong style={{ color: '#374151' }}>⚡ Priority</Text>}
              rules={[{ required: true, message: 'Please select priority' }]}
              initialValue="medium"
            >
              <Select
                size="large"
                style={{ borderRadius: '8px' }}
                options={[
                  { value: 'critical', label: '🔴 Critical' },
                  { value: 'high', label: '🟠 High' },
                  { value: 'medium', label: '🟡 Medium' },
                  { value: 'low', label: '🟢 Low' }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label={<Text strong style={{ color: '#374151' }}>📄 Detailed Description</Text>}
          rules={[
            { required: true, message: 'Please provide details' },
            { min: 20, message: 'Description must be at least 20 characters' }
          ]}
        >
          <TextArea
            placeholder="Provide detailed information about your feedback or issue..."
            rows={6}
            showCount
            maxLength={1000}
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        {/* Enhanced Visibility Options */}
        <Form.Item label={<Text strong style={{ color: '#374151' }}>🔗 Visibility & Sharing Options</Text>}>
          <Card 
            size="small" 
            style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          >
            <Collapse ghost>
              <Panel header="Sharing Settings" key="1">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Form.Item name="visible_to_developers" valuePropName="checked" style={{ margin: 0 }}>
                        <Checkbox>👩‍💻 Development Team</Checkbox>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="visible_to_hr" valuePropName="checked" style={{ margin: 0 }}>
                        <Checkbox>👥 HR Team</Checkbox>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="visible_to_all_staff" valuePropName="checked" style={{ margin: 0 }}>
                        <Checkbox>🌐 All Staff</Checkbox>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="anonymous_submission" valuePropName="checked" style={{ margin: 0 }}>
                        <Checkbox>🕶️ Anonymous</Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '12px 0' }} />
                  <Form.Item name="email_notifications" valuePropName="checked" style={{ margin: 0 }}>
                    <Checkbox>📧 Email me updates on this feedback</Checkbox>
                  </Form.Item>
                  <Form.Item name="urgent_notification" valuePropName="checked" style={{ margin: 0 }}>
                    <Checkbox>🚨 Mark as urgent (notify immediately)</Checkbox>
                  </Form.Item>
                </Space>
              </Panel>
            </Collapse>
          </Card>
        </Form.Item>

        {/* Action Buttons */}
        <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
          <Space style={{ width: '100%' }} size="middle">
            <Button
              size="large"
              onClick={() => setShowPreview(true)}
              icon={<Eye size={18} />}
              style={{ borderRadius: '8px' }}
            >
              Preview
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              icon={<Send size={18} />}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );

  // Enhanced Feedback List Component
  const renderFeedbackList = () => (
    <div style={{
      flex: 1,
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      minHeight: isMobile ? 'calc(100vh - 60px)' : 'auto'
    }}>
      {/* Enhanced Header */}
      <div style={{
        padding: isMobile ? '16px' : '24px 24px 16px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: '12px'
        }}>
          <div>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0, color: '#0D7139' }}>
              💬 Feedback Discussion
            </Title>
            <Text type="secondary">Recent feedback and conversations</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Badge count={getFilteredFeedback().length} style={{ backgroundColor: '#8ac185' }}>
              <MessageCircle size={24} color="#0D7139" />
            </Badge>
            {!isMobile && (
              <Tooltip title="Satisfaction Rate">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} color="#faad14" />
                  <Text strong style={{ color: '#0D7139' }}>{statistics.user_satisfaction}%</Text>
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <Input
            placeholder="Search feedback, users, or keywords..."
            prefix={<Search size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1,
              borderRadius: '8px'
            }}
            size={isMobile ? 'large' : 'middle'}
          />
          <Space size="small" style={{ flexWrap: 'wrap' }}>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: isMobile ? 120 : 140 }}
              placeholder="Type"
              size={isMobile ? 'large' : 'middle'}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'bug_report', label: '🐛 Bugs' },
                { value: 'feature_request', label: '✨ Features' },
                { value: 'performance', label: '⚡ Performance' },
                { value: 'security_concern', label: '🔒 Security' }
              ]}
            />
            <Select
              value={filterPriority}
              onChange={setFilterPriority}
              style={{ width: isMobile ? 100 : 120 }}
              placeholder="Priority"
              size={isMobile ? 'large' : 'middle'}
              options={[
                { value: 'all', label: 'All' },
                { value: 'critical', label: '🔴 Critical' },
                { value: 'high', label: '🟠 High' },
                { value: 'medium', label: '🟡 Medium' },
                { value: 'low', label: '🟢 Low' }
              ]}
            />
          </Space>
        </div>

        {/* Quick Stats */}
        {!isMobile && (
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1890ff' }}></div>
              <Text style={{ fontSize: '12px' }}>Open: {feedbackList.filter(f => f.status === 'open').length}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#faad14' }}></div>
              <Text style={{ fontSize: '12px' }}>In Progress: {feedbackList.filter(f => f.status === 'in_progress').length}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
              <Text style={{ fontSize: '12px' }}>Resolved: {feedbackList.filter(f => f.status === 'resolved').length}</Text>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Feedback List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '12px' : '16px 24px'
      }}>
        {getFilteredFeedback().length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div style={{ textAlign: 'center' }}>
                <Text>No feedback found</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Try adjusting your search or filters
                </Text>
              </div>
            }
            style={{ marginTop: '60px' }}
          />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? "small" : "middle"}>
            {getFilteredFeedback().map((item) => (
              <Card
                key={item.id}
                hoverable
                style={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
                }}
                bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
                onClick={() => {
                  setSelectedFeedback(item);
                  setShowDiscussion(true);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {/* Header Row */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>
                        {getTypeIcon(item.feedback_type)}
                      </span>
                      <Text strong style={{ 
                        fontSize: isMobile ? '14px' : '15px', 
                        color: '#1a202c',
                        flex: 1,
                        minWidth: 0
                      }}>
                        {item.title}
                      </Text>
                      {item.estimated_resolution && (
                        <Tooltip title={`Estimated resolution: ${new Date(item.estimated_resolution).toLocaleDateString()}`}>
                          <Calendar size={14} color="#0D7139" />
                        </Tooltip>
                      )}
                    </div>
                    
                    {/* Description */}
                    <Paragraph 
                      style={{ 
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '12px',
                        lineHeight: '1.4'
                      }}
                      ellipsis={{ rows: 2, expandable: false }}
                    >
                      {item.description}
                    </Paragraph>

                    {/* User Info */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px',
                      gap: '8px'
                    }}>
                      <Avatar 
                        size="small" 
                        style={{ 
                          backgroundColor: item.anonymous_submission ? '#d9d9d9' : '#0D7139',
                          fontSize: '10px'
                        }}
                      >
                        {item.anonymous_submission ? '?' : item.employee_name?.charAt(0)}
                      </Avatar>
                      <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                        {item.anonymous_submission ? 'Anonymous' : item.employee_name}
                        {!item.anonymous_submission && (
                          <> • {item.employee_role} • {item.department}</>
                        )}
                      </Text>
                    </div>

                    {/* Tags and Metadata */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <Space size="small" wrap>
                        <Tag 
                          color={getPriorityColor(item.priority)} 
                          style={{ margin: 0, fontSize: '10px', borderRadius: '4px' }}
                        >
                          {item.priority.toUpperCase()}
                        </Tag>
                        <Tag 
                          color={getStatusColor(item.status)}
                          style={{ margin: 0, fontSize: '10px', borderRadius: '4px' }}
                        >
                          {item.status.replace('_', ' ').toUpperCase()}
                        </Tag>
                        {item.assigned_to && (
                          <Tag style={{ margin: 0, fontSize: '10px', borderRadius: '4px' }}>
                            👥 {item.assigned_to}
                          </Tag>
                        )}
                      </Space>

                      <Space size="small" style={{ fontSize: '11px', color: '#6b7280' }}>
                        <Clock size={11} />
                        <Text style={{ fontSize: '11px', color: '#6b7280' }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                        {item.reply_count > 0 && (
                          <>
                            <MessageCircle size={11} />
                            <Text style={{ fontSize: '11px', color: '#6b7280' }}>
                              {item.reply_count}
                            </Text>
                          </>
                        )}
                        {item.likes > 0 && (
                          <>
                            <Star size={11} />
                            <Text style={{ fontSize: '11px', color: '#6b7280' }}>
                              {item.likes}
                            </Text>
                          </>
                        )}
                        <Eye size={11} />
                        <Text style={{ fontSize: '11px', color: '#6b7280' }}>
                          {item.view_count || 0}
                        </Text>
                      </Space>
                    </div>

                    {/* Action Bar */}
                    <div style={{ 
                      marginTop: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Space size="small">
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<Star size={12} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeFeedback(item.id);
                          }}
                          style={{ fontSize: '11px', height: '24px' }}
                        >
                          Like
                        </Button>
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<Share2 size={12} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`Feedback #${item.id}: ${item.title}`);
                            message.success('Link copied!');
                          }}
                          style={{ fontSize: '11px', height: '24px' }}
                        >
                          Share
                        </Button>
                      </Space>
                      
                      <ChevronRight size={14} color="#9ca3af" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </div>
    </div>
  );

  // Mobile Tab Layout
  const renderMobileLayout = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Mobile Navigation */}
      <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      marginBottom: '24px',
      margin: '16px',
      padding: '16px',
      background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)',
      borderRadius: '12px',
      color: 'white'
    }}>
      {/* Header content */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <MessageSquare size={24} style={{ marginRight: '12px' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: 'white' }}>
              {activeTab === 'submit' ? 'Submit Feedback' : 
               activeTab === 'list' ? 'Feedback Discussion' : 
               'Feedback Statistics'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              {activeTab === 'submit' ? 'Share your thoughts with us' : 
               activeTab === 'list' ? 'Recent feedback and conversations' : 
               'Analytics and insights'}
            </Text>
          </div>
        </div>
        <Badge count={notifications} size="small">
          <Bell size={20} color="white" />
        </Badge>
      </div>
      {/* Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        centered
        size="small"
        style={{
          height: '44px',
          minHeight: '44px',
        }}
        tabBarStyle={{
    borderBottom: '2px solid white', // Blue line at bottom
    marginBottom: 0,
  }}
        items={[
          {
            key: 'submit',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color:"white" }}>
                <Plus size={16} />
                Submit
              </span>
            )
          },
          {
            key: 'list',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px',color:"white" }}>
                <MessageCircle size={16} />
                Feedback
                <Badge count={getFilteredFeedback().length} size="small" />
              </span>
            )
          },
          {
            key: 'stats',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px',color:"white" }}>
                <BarChart size={16} />
                Stats
              </span>
            )
          }
        ]}
      />
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 'calc(100vh - 60px)' }}>
        {activeTab === 'submit' && renderMobileForm()}
        {activeTab === 'list' && renderFeedbackList()}
        {activeTab === 'stats' && (
          <div style={{ padding: '16px' }}>
            <Title level={4} style={{ textAlign: 'center', marginBottom: '24px' }}>
              📊 Feedback Statistics
            </Title>
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                    {statistics.total_feedback}
                  </Text>
                  <br />
                  <Text type="secondary">Total Feedback</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {statistics.resolved}
                  </Text>
                  <br />
                  <Text type="secondary">Resolved</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                    {statistics.average_resolution_time}
                  </Text>
                  <br />
                  <Text type="secondary">Avg Resolution</Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                    {statistics.user_satisfaction}%
                  </Text>
                  <br />
                  <Text type="secondary">Satisfaction</Text>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity */}
            <Card 
              title="📋 Recent Activity" 
              style={{ marginTop: '24px', borderRadius: '12px' }}
            >
              <List
                size="small"
                dataSource={feedbackList.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: '13px' }}>
                          {getTypeIcon(item.feedback_type)} {item.title}
                        </Text>
                        <Tag size="small" color={getStatusColor(item.status)}>
                          {item.status}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {new Date(item.created_at).toLocaleDateString()} • {item.employee_name}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  // Desktop Layout
  const renderDesktopLayout = () => (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      display: 'flex'
    }}>
      {renderDesktopForm()}
      {renderFeedbackList()}
    </div>
  );

  return (
    <>
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}

      {/* Enhanced Discussion Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>
              {selectedFeedback && getTypeIcon(selectedFeedback.feedback_type)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text strong style={{ fontSize: '16px' }}>
                {selectedFeedback?.title}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: #{selectedFeedback?.id} • {selectedFeedback?.status?.replace('_', ' ')}
              </Text>
            </div>
          </div>
        }
        placement="right"
        width={isMobile ? '100vw' : 700}
        open={showDiscussion}
        onClose={() => setShowDiscussion(false)}
        bodyStyle={{ padding: 0 }}
        extra={
          <Space>
            <Button 
              type="text" 
              icon={<Star size={16} />}
              onClick={() => selectedFeedback && handleLikeFeedback(selectedFeedback.id)}
            >
              Like
            </Button>
            <Button 
              type="text" 
              icon={<Share2 size={16} />}
              onClick={() => {
                if (selectedFeedback) {
                  navigator.clipboard.writeText(`Feedback #${selectedFeedback.id}: ${selectedFeedback.title}`);
                  message.success('Link copied to clipboard!');
                }
              }}
            >
              Share
            </Button>
          </Space>
        }
      >
        {selectedFeedback && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Enhanced Original Feedback */}
            <div style={{ 
              padding: '24px', 
              borderBottom: '1px solid #f0f0f0',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* User and Meta Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Space align="start">
                    <Avatar 
                      size={48}
                      style={{ 
                        backgroundColor: selectedFeedback.anonymous_submission ? '#d9d9d9' : getPriorityColor(selectedFeedback.priority),
                        color: 'white'
                      }}
                    >
                      {selectedFeedback.anonymous_submission ? '?' : selectedFeedback.employee_name?.charAt(0)}
                    </Avatar>
                    <div>
                      <Text strong style={{ fontSize: '16px' }}>
                        {selectedFeedback.anonymous_submission ? 'Anonymous User' : selectedFeedback.employee_name}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        {selectedFeedback.employee_role}
                        {!selectedFeedback.anonymous_submission && (
                          <> • {selectedFeedback.department}</>
                        )}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Created: {new Date(selectedFeedback.created_at).toLocaleString()}
                        {selectedFeedback.updated_at !== selectedFeedback.created_at && (
                          <> • Updated: {new Date(selectedFeedback.updated_at).toLocaleString()}</>
                        )}
                      </Text>
                    </div>
                  </Space>
                  
                  <Space direction="vertical" align="end" size="small">
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      👁️ {selectedFeedback.view_count || 0} views
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ⭐ {selectedFeedback.likes || 0} likes
                    </Text>
                  </Space>
                </div>
                
                {/* Description */}
                <Card size="small" style={{ backgroundColor: '#f8fafc', border: 'none' }}>
                  <Paragraph style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    {selectedFeedback.description}
                  </Paragraph>
                </Card>
                
                {/* Tags and Status */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Space wrap>
                    <Tag color={getPriorityColor(selectedFeedback.priority)} style={{ borderRadius: '6px' }}>
                      🚨 {selectedFeedback.priority.toUpperCase()}
                    </Tag>
                    <Tag color={getStatusColor(selectedFeedback.status)} style={{ borderRadius: '6px' }}>
                      📋 {selectedFeedback.status.replace('_', ' ').toUpperCase()}
                    </Tag>
                    <Tag style={{ borderRadius: '6px' }}>
                      🏷️ {selectedFeedback.feedback_type.replace('_', ' ')}
                    </Tag>
                    {selectedFeedback.assigned_to && (
                      <Tag color="blue" style={{ borderRadius: '6px' }}>
                        👥 {selectedFeedback.assigned_to}
                      </Tag>
                    )}
                  </Space>
                  
                  {selectedFeedback.estimated_resolution && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#667eea" />
                      <Text style={{ fontSize: '12px', color: '#667eea' }}>
                        Est. Resolution: {new Date(selectedFeedback.estimated_resolution).toLocaleDateString()}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Resolution Notes (if resolved) */}
                {selectedFeedback.status === 'resolved' && selectedFeedback.resolution_notes && (
                  <Alert
                    message="✅ Resolution Notes"
                    description={selectedFeedback.resolution_notes}
                    type="success"
                    showIcon
                    style={{ borderRadius: '8px' }}
                  />
                )}
              </Space>
            </div>

            {/* Enhanced Replies Section */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <Title level={5} style={{ margin: 0 }}>
                    💬 Discussion ({selectedFeedback.feedback_replies?.length || 0})
                  </Title>
                  {selectedFeedback.feedback_replies?.length > 0 && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Last updated: {new Date(selectedFeedback.updated_at).toLocaleDateString()}
                    </Text>
                  )}
                </div>
                
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {selectedFeedback.feedback_replies?.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No replies yet"
                      style={{ padding: '40px 0' }}>
                      <Text type="secondary">Be the first to reply to this feedback!</Text>
                    </Empty>
                  ) : (
                    selectedFeedback.feedback_replies?.map((reply, index) => (
                      <Card 
                        key={index} 
                        size="small" 
                        style={{ 
                          backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}
                        bodyStyle={{ padding: '16px' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Space align="start">
                              <Avatar 
                                size="small" 
                                style={{ 
                                  backgroundColor: '#0D7139',
                                  fontSize: '12px'
                                }}
                              >
                                {reply.user_name?.charAt(0) || 'U'}
                              </Avatar>
                              <div>
                                <Text strong style={{ fontSize: '14px' }}>
                                  {reply.user_name}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                                  ({reply.user_role})
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  {new Date(reply.created_at).toLocaleString()}
                                </Text>
                              </div>
                            </Space>
                            
                            <Space size="small">
                              <Button 
                                type="text" 
                                size="small" 
                                icon={<Star size={12} />}
                                style={{ fontSize: '11px' }}
                              >
                                {reply.likes || 0}
                              </Button>
                              <Button 
                                type="text" 
                                size="small" 
                                icon={<Reply size={12} />}
                                style={{ fontSize: '11px' }}
                              >
                                Reply
                              </Button>
                            </Space>
                          </div>
                          
                          <Paragraph style={{ 
                            fontSize: '13px', 
                            margin: '8px 0 0 32px',
                            lineHeight: '1.5'
                          }}>
                            {reply.reply_text}
                          </Paragraph>
                        </Space>
                      </Card>
                    ))
                  )}
                </Space>
              </div>
            </div>

            {/* Enhanced Reply Input */}
            <div style={{ 
              padding: '20px 24px', 
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar 
                    size="small"
                    style={{ backgroundColor: '#0D7139' }}
                  >
                    {(userData?.name || 'User').charAt(0)}
                  </Avatar>
                  <Text strong style={{ fontSize: '14px' }}>Add your reply</Text>
                </div>
                
                <TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Share your thoughts, provide updates, or ask questions..."
                  rows={3}
                  maxLength={500}
                  showCount
                  style={{ borderRadius: '8px' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space size="small">
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      💡 Tip: Be constructive and specific in your feedback
                    </Text>
                  </Space>
                  
                  <Space>
                    <Button
                      size="small"
                      onClick={() => setReplyText('')}
                      disabled={!replyText.trim()}
                    >
                      Clear
                    </Button>
                    <Button
                      type="primary"
                      icon={<Reply size={16} />}
                      loading={replyLoading}
                      disabled={!replyText.trim()}
                      onClick={() => handleReply(selectedFeedback.id)}
                      style={{
                        background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff'
                      }}
                    >
                      {replyLoading ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </Space>
                </div>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* Preview Modal */}
      <Modal
        title="📋 Feedback Preview"
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={[
          <Button key="back" onClick={() => setShowPreview(false)}>
            Close
          </Button>,
          <Button key="submit" type="primary" onClick={() => {
            setShowPreview(false);
            form.submit();
          }}>
            Submit Feedback
          </Button>
        ]}
        width={isMobile ? '95vw' : 600}
      >
        {form.getFieldsValue() && (
          <div style={{ padding: '16px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ color: '#374151' }}>Title:</Text>
                <br />
                <Text style={{ fontSize: '16px' }}>{form.getFieldValue('title') || 'No title provided'}</Text>
              </div>
              
              <div>
                <Text strong style={{ color: '#374151' }}>Category:</Text>
                <br />
                <Tag color="blue">
                  {getTypeIcon(form.getFieldValue('feedback_type'))} {form.getFieldValue('feedback_type')?.replace('_', ' ') || 'Not selected'}
                </Tag>
              </div>
              
              <div>
                <Text strong style={{ color: '#374151' }}>Priority:</Text>
                <br />
                <Tag color={getPriorityColor(form.getFieldValue('priority'))}>
                  {form.getFieldValue('priority')?.toUpperCase() || 'MEDIUM'}
                </Tag>
              </div>
              
              <div>
                <Text strong style={{ color: '#374151' }}>Description:</Text>
                <br />
                <Paragraph style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  {form.getFieldValue('description') || 'No description provided'}
                </Paragraph>
              </div>
              
              <div>
                <Text strong style={{ color: '#374151' }}>Visibility Options:</Text>
                <br />
                <Space wrap style={{ marginTop: '8px' }}>
                  {form.getFieldValue('visible_to_developers') && <Tag>👩‍💻 Development Team</Tag>}
                  {form.getFieldValue('visible_to_hr') && <Tag>👥 HR Team</Tag>}
                  {form.getFieldValue('visible_to_all_staff') && <Tag>🌐 All Staff</Tag>}
                  {form.getFieldValue('anonymous_submission') && <Tag>🕶️ Anonymous</Tag>}
                  {form.getFieldValue('email_notifications') && <Tag>📧 Email Updates</Tag>}
                  {!form.getFieldValue('visible_to_developers') && 
                   !form.getFieldValue('visible_to_hr') && 
                   !form.getFieldValue('visible_to_all_staff') && 
                   <Tag>🔒 Private</Tag>}
                </Space>
              </div>
            </Space>
          </div>
        )}
      </Modal>

      {/* Floating Action Button for Mobile */}
      {isMobile && activeTab !== 'submit' && (
        <FloatButton
          icon={<Plus />}
          type="primary"
          style={{
            right: 20,
            bottom: 20,
            background: 'linear-gradient(135deg, #8ac185 0%, #0D7139 100%)'
          }}
          onClick={() => setActiveTab('submit')}
          tooltip="Submit New Feedback"
        />
      )}

      {/* Global Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text strong>Submitting your feedback...</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Please wait while we process your submission
              </Text>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ProfessionalFeedbackForm;