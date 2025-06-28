import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col, 
  Table, 
  Switch, 
  Space, 
  Typography, 
  Divider, 
  Modal,
  Tag,
  message,
  Checkbox,
  Tooltip,
  Alert,
  Badge,
  Avatar,
  Timeline,
  Descriptions
} from 'antd';
import { 
  SendOutlined, 
  EyeOutlined, 
  LinkedinOutlined,
  GlobalOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  RocketOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  StarOutlined,
  FileTextOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const JobPostPage = ({ userRole }) => {
  const [form] = Form.useForm();
  const [selectedJob, setSelectedJob] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postingPlatforms, setPostingPlatforms] = useState({
    linkedin: false,
    company: false,
    internal: true
  });

  // Dummy job descriptions data (replace with Firestore data)
  const [jobDescriptions] = useState([
    {
      id: 1,
      jobTitle: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full-time',
      experienceLevel: 'Senior Level (5-8 years)',
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'CSS3'],
      salaryMin: 80000,
      salaryMax: 120000,
      description: 'We are looking for a talented Senior Frontend Developer to join our dynamic engineering team. You will be responsible for building cutting-edge web applications using modern technologies.',
      responsibilities: '• Develop responsive web applications using React and TypeScript\n• Collaborate with designers and backend developers\n• Optimize applications for maximum speed and scalability\n• Mentor junior developers and conduct code reviews\n• Participate in architectural decisions',
      qualifications: '• Bachelor\'s degree in Computer Science or related field\n• 5+ years of experience with React and JavaScript\n• Strong understanding of modern frontend technologies\n• Experience with state management (Redux, Context API)\n• Excellent problem-solving and communication skills',
      benefits: '• Competitive salary and equity package\n• Comprehensive health insurance\n• Flexible working hours and remote work options\n• Professional development budget\n• Modern equipment and tools',
      createdAt: '2024-06-20',
      status: 'Active'
    },
    {
      id: 2,
      jobTitle: 'Data Scientist',
      department: 'Product',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      experienceLevel: 'Mid Level (2-5 years)',
      skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics'],
      salaryMin: 100000,
      salaryMax: 140000,
      description: 'Join our data science team to drive insights and build intelligent solutions that impact millions of users worldwide.',
      responsibilities: '• Develop machine learning models and algorithms\n• Analyze large datasets to extract actionable insights\n• Collaborate with product teams to define metrics\n• Build data pipelines and automated reporting systems\n• Present findings to stakeholders',
      qualifications: '• Master\'s degree in Data Science, Statistics, or related field\n• 3+ years of experience in data science or analytics\n• Proficiency in Python and SQL\n• Experience with ML frameworks (TensorFlow, PyTorch)\n• Strong statistical analysis skills',
      benefits: '• Competitive compensation package\n• Stock options\n• Health, dental, and vision insurance\n• Learning and development opportunities\n• Flexible PTO policy',
      createdAt: '2024-06-18',
      status: 'Active'
    },
    {
      id: 3,
      jobTitle: 'UX Designer',
      department: 'Design',
      location: 'New York, NY',
      employmentType: 'Full-time',
      experienceLevel: 'Mid Level (2-5 years)',
      skills: ['Figma', 'Sketch', 'Prototyping', 'User Research', 'Wireframing'],
      salaryMin: 70000,
      salaryMax: 95000,
      description: 'We\'re seeking a creative UX Designer to help shape the future of our digital products through user-centered design.',
      responsibilities: '• Design intuitive user interfaces and experiences\n• Conduct user research and usability testing\n• Create wireframes, prototypes, and design systems\n• Collaborate with product managers and developers\n• Advocate for user needs throughout the design process',
      qualifications: '• Bachelor\'s degree in Design, HCI, or related field\n• 3+ years of UX/UI design experience\n• Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)\n• Strong portfolio demonstrating design thinking\n• Experience with user research methodologies',
      benefits: '• Competitive salary\n• Creative workspace and tools\n• Health and wellness benefits\n• Professional conference attendance\n• Collaborative team environment',
      createdAt: '2024-06-15',
      status: 'Draft'
    }
  ]);

  // Dummy posting logs data
  const [postingLogs] = useState([
    {
      id: 1,
      jobTitle: 'Senior Frontend Developer',
      platform: 'LinkedIn',
      status: 'Success',
      timestamp: '2024-06-22 10:30 AM',
      postId: 'LI_12345',
      views: 245,
      applications: 12
    },
    {
      id: 2,
      jobTitle: 'Data Scientist',
      platform: 'Company Portal',
      status: 'Success',
      timestamp: '2024-06-21 2:15 PM',
      postId: 'CP_67890',
      views: 156,
      applications: 8
    },
    {
      id: 3,
      jobTitle: 'UX Designer',
      platform: 'LinkedIn',
      status: 'Failed',
      timestamp: '2024-06-20 11:45 AM',
      postId: null,
      error: 'API rate limit exceeded',
      views: 0,
      applications: 0
    }
  ]);

  // Table columns for job descriptions
  const jobColumns = [
    {
      title: 'Job Title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department} • {record.location}
          </Text>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'employmentType',
      key: 'employmentType',
      render: (text) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: 'Experience',
      dataIndex: 'experienceLevel',
      key: 'experienceLevel',
      render: (text) => (
        <Tag color="purple">{text.split(' ')[0]} Level</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'Active' ? 'success' : 'default'} 
          text={status}
        />
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleJobPreview(record)}
          >
            Preview
          </Button>
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleJobSelect(record)}
            disabled={record.status !== 'Active'}
          >
            Select
          </Button>
        </Space>
      )
    }
  ];

  // Table columns for posting logs
  const logColumns = [
    {
      title: 'Job Title',
      dataIndex: 'jobTitle',
      key: 'jobTitle'
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Space>
          {platform === 'LinkedIn' && <LinkedinOutlined style={{ color: '#0077b5' }} />}
          {platform === 'Company Portal' && <GlobalOutlined style={{ color: '#1890ff' }} />}
          {platform === 'Internal' && <TeamOutlined style={{ color: '#52c41a' }} />}
          {platform}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={status === 'Success' ? 'success' : 'error'}
          icon={status === 'Success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
        >
          {status}
        </Tag>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record) => (
        record.status === 'Success' ? (
          <Space direction="vertical" size="small">
            <Text style={{ fontSize: '12px' }}>
              👁️ {record.views} views
            </Text>
            <Text style={{ fontSize: '12px' }}>
              📝 {record.applications} applications
            </Text>
          </Space>
        ) : (
          <Text type="danger" style={{ fontSize: '12px' }}>
            {record.error}
          </Text>
        )
      )
    },
    {
      title: 'Posted At',
      dataIndex: 'timestamp',
      key: 'timestamp'
    }
  ];

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    message.success(`Selected: ${job.jobTitle}`);
  };

  const handleJobPreview = (job) => {
    setSelectedJob(job);
    setPreviewVisible(true);
  };

  const handlePlatformChange = (platform, checked) => {
    setPostingPlatforms(prev => ({
      ...prev,
      [platform]: checked
    }));
  };

  const handlePostJob = async () => {
    if (!selectedJob) {
      message.error('Please select a job description first');
      return;
    }

    const selectedPlatforms = Object.keys(postingPlatforms).filter(
      platform => postingPlatforms[platform]
    );

    if (selectedPlatforms.length === 0) {
      message.error('Please select at least one platform to post');
      return;
    }

    setPosting(true);
    try {
      // Simulate API calls to different platforms
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      message.success({
        content: `Job posted successfully to ${selectedPlatforms.join(', ')}!`,
        duration: 5
      });

      // Reset selections
      setSelectedJob(null);
      setPostingPlatforms({
        linkedin: false,
        company: false,
        internal: true
      });
    } catch (error) {
      message.error('Failed to post job. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'transparent' // Use animated background
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <Card 
          style={{ 
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                <RocketOutlined style={{ marginRight: '12px' }} />
                Job Posting Hub
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Select and post job descriptions to multiple platforms
              </Text>
            </Col>
            <Col>
              <Space>
                <Badge count={jobDescriptions.filter(j => j.status === 'Active').length}>
                  <Button icon={<FileTextOutlined />}>
                    Active Jobs
                  </Button>
                </Badge>
                <Badge count={postingLogs.filter(l => l.status === 'Success').length}>
                  <Button icon={<BellOutlined />}>
                    Posted Today
                  </Button>
                </Badge>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Left Column - Job Selection */}
          <Col xs={24} xl={16}>
            {/* Job Selection Section */}
            <Card 
              title={
                <div style={{ color: '#1890ff' }}>
                  <FileTextOutlined style={{ marginRight: '8px' }} />
                  Available Job Descriptions
                </div>
              }
              style={{ 
                marginBottom: '24px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Table 
                columns={jobColumns}
                dataSource={jobDescriptions}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="middle"
                rowSelection={{
                  type: 'radio',
                  selectedRowKeys: selectedJob ? [selectedJob.id] : [],
                  onSelect: (record) => handleJobSelect(record)
                }}
              />
            </Card>

            {/* Selected Job Preview */}
            {selectedJob && (
              <Card 
                title={
                  <div style={{ color: '#1890ff' }}>
                    <EyeOutlined style={{ marginRight: '8px' }} />
                    Selected Job Preview
                  </div>
                }
                style={{ 
                  marginBottom: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
                extra={
                  <Button 
                    type="link" 
                    onClick={() => setPreviewVisible(true)}
                  >
                    Full Preview
                  </Button>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div>
                      <Title level={4} style={{ marginBottom: '8px' }}>
                        {selectedJob.jobTitle}
                      </Title>
                      <Space wrap>
                        <Tag icon={<TeamOutlined />} color="blue">
                          {selectedJob.department}
                        </Tag>
                        <Tag icon={<EnvironmentOutlined />} color="green">
                          {selectedJob.location}
                        </Tag>
                        <Tag icon={<StarOutlined />} color="purple">
                          {selectedJob.experienceLevel.split(' ')[0]} Level
                        </Tag>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div>
                      <Text type="secondary">Skills Required:</Text>
                      <div style={{ marginTop: '8px' }}>
                        {selectedJob.skills.slice(0, 3).map(skill => (
                          <Tag key={skill} style={{ marginBottom: '4px' }}>
                            {skill}
                          </Tag>
                        ))}
                        {selectedJob.skills.length > 3 && (
                          <Tag>+{selectedJob.skills.length - 3} more</Tag>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Divider />
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                  {selectedJob.description}
                </Paragraph>
              </Card>
            )}

            {/* Posting Logs */}
            <Card 
              title={
                <div style={{ color: '#1890ff' }}>
                  <HistoryOutlined style={{ marginRight: '8px' }} />
                  Recent Posting Activity
                </div>
              }
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Table 
                columns={logColumns}
                dataSource={postingLogs}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="middle"
              />
            </Card>
          </Col>

          {/* Right Column - Posting Options */}
          <Col xs={24} xl={8}>
            {/* Posting Platforms */}
            <Card 
              title={
                <div style={{ color: '#1890ff' }}>
                  <SendOutlined style={{ marginRight: '8px' }} />
                  Posting Platforms
                </div>
              }
              style={{ 
                marginBottom: '24px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                  padding: '16px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '8px',
                  background: postingPlatforms.linkedin ? '#f6ffed' : '#fafafa'
                }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar 
                          icon={<LinkedinOutlined />} 
                          style={{ backgroundColor: '#0077b5' }}
                        />
                        <div>
                          <Text strong>LinkedIn</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Professional network
                          </Text>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Switch 
                        checked={postingPlatforms.linkedin}
                        onChange={(checked) => handlePlatformChange('linkedin', checked)}
                      />
                    </Col>
                  </Row>
                  {postingPlatforms.linkedin && (
                    <Alert 
                      message="LinkedIn API connected" 
                      type="success" 
                      showIcon 
                      style={{ marginTop: '12px' }}
                      size="small"
                    />
                  )}
                </div>

                <div style={{ 
                  padding: '16px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '8px',
                  background: postingPlatforms.company ? '#f6ffed' : '#fafafa'
                }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar 
                          icon={<GlobalOutlined />} 
                          style={{ backgroundColor: '#1890ff' }}
                        />
                        <div>
                          <Text strong>Company Portal</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            External careers page
                          </Text>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Switch 
                        checked={postingPlatforms.company}
                        onChange={(checked) => handlePlatformChange('company', checked)}
                      />
                    </Col>
                  </Row>
                  {postingPlatforms.company && (
                    <Alert 
                      message="Company API configured" 
                      type="success" 
                      showIcon 
                      style={{ marginTop: '12px' }}
                      size="small"
                    />
                  )}
                </div>

                <div style={{ 
                  padding: '16px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '8px',
                  background: postingPlatforms.internal ? '#f6ffed' : '#fafafa'
                }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar 
                          icon={<TeamOutlined />} 
                          style={{ backgroundColor: '#52c41a' }}
                        />
                        <div>
                          <Text strong>Internal Portal</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Employee referrals
                          </Text>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Switch 
                        checked={postingPlatforms.internal}
                        onChange={(checked) => handlePlatformChange('internal', checked)}
                      />
                    </Col>
                  </Row>
                  {postingPlatforms.internal && (
                    <Alert 
                      message="Internal system ready" 
                      type="success" 
                      showIcon 
                      style={{ marginTop: '12px' }}
                      size="small"
                    />
                  )}
                </div>
              </Space>

              <Divider />

              <Button
                type="primary"
                size="large"
                block
                icon={<RocketOutlined />}
                loading={posting}
                onClick={handlePostJob}
                disabled={!selectedJob}
                style={{
                  background: 'linear-gradient(45deg, #1890ff 0%, #722ed1 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {posting ? 'Posting Job...' : 'Post to Selected Platforms'}
              </Button>
            </Card>

            {/* Quick Stats */}
            <Card 
              title="Quick Stats"
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                      {postingLogs.filter(l => l.status === 'Success').length}
                    </Title>
                    <Text type="secondary">Successful Posts</Text>
                  </div>
                </Col>
                <Col xs={12}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                      {postingLogs.reduce((sum, log) => sum + (log.views || 0), 0)}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Total Views
                    </Text>
                  </div>
                </Col>
                <Col xs={12}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#722ed1', margin: 0 }}>
                      {postingLogs.reduce((sum, log) => sum + (log.applications || 0), 0)}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Applications
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Job Preview Modal */}
        <Modal
          title={selectedJob?.jobTitle}
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setPreviewVisible(false)}>
              Close
            </Button>,
            <Button 
              key="select" 
              type="primary" 
              onClick={() => {
                handleJobSelect(selectedJob);
                setPreviewVisible(false);
              }}
            >
              Select This Job
            </Button>
          ]}
        >
          {selectedJob && (
            <div>
              <Descriptions column={2} style={{ marginBottom: '24px' }}>
                <Descriptions.Item label="Department">
                  {selectedJob.department}
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  {selectedJob.location}
                </Descriptions.Item>
                <Descriptions.Item label="Employment Type">
                  {selectedJob.employmentType}
                </Descriptions.Item>
                <Descriptions.Item label="Experience Level">
                  {selectedJob.experienceLevel}
                </Descriptions.Item>
                <Descriptions.Item label="Salary Range">
                  ${selectedJob.salaryMin?.toLocaleString()} - ${selectedJob.salaryMax?.toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Skills Required</Divider>
              <div style={{ marginBottom: '24px' }}>
                {selectedJob.skills.map(skill => (
                  <Tag key={skill} color="blue" style={{ marginBottom: '8px' }}>
                    {skill}
                  </Tag>
                ))}
              </div>

              <Divider orientation="left">Job Description</Divider>
              <Paragraph>{selectedJob.description}</Paragraph>

              <Divider orientation="left">Key Responsibilities</Divider>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {selectedJob.responsibilities}
              </Paragraph>

              <Divider orientation="left">Qualifications</Divider>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {selectedJob.qualifications}
              </Paragraph>

              {selectedJob.benefits && (
                <>
                  <Divider orientation="left">Benefits</Divider>
                  <Paragraph style={{ whiteSpace: 'pre-line' }}>
                    {selectedJob.benefits}
                  </Paragraph>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default JobPostPage;