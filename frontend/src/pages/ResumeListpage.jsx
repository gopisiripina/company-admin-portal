import React, { useState, useEffect } from 'react';
import {Table,Card,Select,Input,DatePicker,Button,Tag,Space,Modal,Avatar,Badge,Row,Col,Typography,Divider,message,Drawer,Steps,Timeline,Tooltip} from 'antd';
import {SearchOutlined,EyeOutlined,DownloadOutlined,MailOutlined,UserOutlined,CalendarOutlined,CheckCircleOutlined,ClockCircleOutlined,SendOutlined,PhoneOutlined,EnvironmentOutlined,DollarOutlined,HistoryOutlined,ReloadOutlined} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

// Dummy data for selected resumes
const selectedResumesData = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Senior React Developer',
    department: 'Engineering',
    selectedDate: '2024-06-22',
    experience: 5,
    skills: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
    status: 'not_sent',
    resumeUrl: 'https://example.com/resume1.pdf',
    location: 'New York, NY',
    expectedSalary: '$120,000',
    avatar: null,
    interviewDate: null,
    mailSentDate: null,
    currentStep: 0
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    jobTitle: 'Senior React Developer',
    department: 'Engineering',
    selectedDate: '2024-06-21',
    experience: 7,
    skills: ['React', 'Vue.js', 'Python', 'AWS'],
    status: 'mail_sent',
    resumeUrl: 'https://example.com/resume2.pdf',
    location: 'San Francisco, CA',
    expectedSalary: '$140,000',
    avatar: null,
    interviewDate: '2024-06-25',
    mailSentDate: '2024-06-22',
    currentStep: 1
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    jobTitle: 'Product Manager',
    department: 'Product',
    selectedDate: '2024-06-20',
    experience: 4,
    skills: ['Product Management', 'Agile', 'Analytics', 'SQL'],
    status: 'interview_done',
    resumeUrl: 'https://example.com/resume3.pdf',
    location: 'Austin, TX',
    expectedSalary: '$95,000',
    avatar: null,
    interviewDate: '2024-06-23',
    mailSentDate: '2024-06-21',
    currentStep: 2
  },
  {
    id: 4,
    name: 'Jessica Wilson',
    email: 'jessica.wilson@email.com',
    phone: '+1 (555) 567-8901',
    jobTitle: 'UX Designer',
    department: 'Design',
    selectedDate: '2024-06-19',
    experience: 6,
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    status: 'selected',
    resumeUrl: 'https://example.com/resume5.pdf',
    location: 'Los Angeles, CA',
    expectedSalary: '$105,000',
    avatar: null,
    interviewDate: '2024-06-24',
    mailSentDate: '2024-06-20',
    currentStep: 3
  },
  {
    id: 5,
    name: 'Robert Taylor',
    email: 'robert.taylor@email.com',
    phone: '+1 (555) 678-9012',
    jobTitle: 'Data Scientist',
    department: 'Analytics',
    selectedDate: '2024-06-18',
    experience: 8,
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
    status: 'mail_sent',
    resumeUrl: 'https://example.com/resume6.pdf',
    location: 'Boston, MA',
    expectedSalary: '$130,000',
    avatar: null,
    interviewDate: '2024-06-26',
    mailSentDate: '2024-06-23',
    currentStep: 1
  }
];

const jobTitles = [...new Set(selectedResumesData.map(resume => resume.jobTitle))];

const ResumeListPage = () => {
  const [resumes, setResumes] = useState(selectedResumesData);
  const [filteredResumes, setFilteredResumes] = useState(selectedResumesData);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  
  // Modal states
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [mailModalVisible, setMailModalVisible] = useState(false);
  const [progressDrawerVisible, setProgressDrawerVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);


  const applyFilters = () => {
    let filtered = [...resumes];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(resume =>
        resume.name.toLowerCase().includes(searchText.toLowerCase()) ||
        resume.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Job title filter
    if (jobTitleFilter !== 'all') {
      filtered = filtered.filter(resume => resume.jobTitle === jobTitleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(resume => resume.status === statusFilter);
    }

    // Date range filter
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(resume => {
        const resumeDate = new Date(resume.selectedDate);
        return resumeDate >= start && resumeDate <= end;
      });
    }

    setFilteredResumes(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, jobTitleFilter, statusFilter, dateRange, resumes]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_sent': return 'orange';
      case 'mail_sent': return 'blue';
      case 'interview_done': return 'green';
      case 'selected': return 'purple';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'not_sent': return 'Interview Not Sent';
      case 'mail_sent': return 'Mail Sent';
      case 'interview_done': return 'Interview Done';
      case 'selected': return 'Selected';
      default: return status;
    }
  };

  const handleSendMail = (resume) => {
    setSelectedResume(resume);
    setMailModalVisible(true);
  };

  const sendInterviewMail = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update resume status
      const updatedResumes = resumes.map(resume =>
        resume.id === selectedResume.id
          ? { 
              ...resume, 
              status: 'mail_sent', 
              mailSentDate: new Date().toISOString().split('T')[0],
              currentStep: 1
            }
          : resume
      );
      
      setResumes(updatedResumes);
      setMailModalVisible(false);
      message.success('Interview invitation sent successfully!');
    } catch (error) {
      message.error('Failed to send interview invitation');
    } finally {
      setLoading(false);
    }
  };

  const getProgressSteps = (resume) => {
    const steps = [
      {
        title: 'Resume Selected',
        description: resume.selectedDate ? `Selected on ${new Date(resume.selectedDate).toLocaleDateString()}` : 'Pending',
        icon: <CheckCircleOutlined />
      },
      {
        title: 'Interview Mail Sent',
        description: resume.mailSentDate ? `Sent on ${new Date(resume.mailSentDate).toLocaleDateString()}` : 'Pending',
        icon: <MailOutlined />
      },
      {
        title: 'Interview Scheduled',
        description: resume.interviewDate ? `Scheduled for ${new Date(resume.interviewDate).toLocaleDateString()}` : 'Pending',
        icon: <CalendarOutlined />
      },
      {
        title: 'Final Selection',
        description: resume.status === 'selected' ? 'Candidate Selected' : 'Pending',
        icon: <CheckCircleOutlined />
      }
    ];
    return steps;
  };

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Job Title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 200,
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.department}</Text>
        </div>
      ),
    },
    {
      title: 'Selected Date',
      dataIndex: 'selectedDate',
      key: 'selectedDate',
      width: 150,
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
    },
    {
      title: 'Resume',
      key: 'resume',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Resume">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedResume(record);
                setResumeModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Download Resume">
            <Button 
              type="text" 
              icon={<DownloadOutlined />}
              onClick={() => window.open(record.resumeUrl, '_blank')}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Interview Mail',
      key: 'interviewMail',
      width: 130,
      render: (_, record) => (
        <div>
          {record.status === 'not_sent' ? (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSendMail(record)}
            >
              Send Mail
            </Button>
          ) : (
            <div>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.mailSentDate && `Sent ${new Date(record.mailSentDate).toLocaleDateString()}`}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<HistoryOutlined />}
          onClick={() => {
            setSelectedResume(record);
            setProgressDrawerVisible(true);
          }}
        >
          View Steps
        </Button>
      ),
    }
  ];

  return (
  <div style={{ 
    padding: '24px', 
    maxWidth: '1200px', 
    margin: '0 auto', 
    width: '100%' 
  }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          Selected Resumes
        </Title>
        <Text type="secondary">
          Manage selected candidates and send interview invitations
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Search</Text>
            </div>
            <Input
              placeholder="Search by name or email"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Job Title</Text>
            </div>
            <Select
              value={jobTitleFilter}
              onChange={setJobTitleFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Job Titles</Option>
              {jobTitles.map(title => (
                <Option key={title} value={title}>{title}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Status</Text>
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="not_sent">Interview Not Sent</Option>
              <Option value="mail_sent">Mail Sent</Option>
              <Option value="interview_done">Interview Done</Option>
              <Option value="selected">Selected</Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Date Range</Text>
            </div>
            <RangePicker
              style={{ width: '100%' }}
              onChange={setDateRange}
            />
          </Col>
          <Col span={2}>
            <div style={{ marginBottom: '8px', opacity: 0 }}>
              <Text>Action</Text>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setResumes([...selectedResumesData]);
                message.success('Data refreshed');
              }}
              title="Refresh Data"
            />
          </Col>
        </Row>
        
        <Divider style={{ margin: '16px 0 8px 0' }} />
        
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>{filteredResumes.length}</Text>
              <Text type="secondary">selected resumes found</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge count={filteredResumes.filter(r => r.status === 'not_sent').length} showZero>
                <Tag color="orange">Pending Mails</Tag>
              </Badge>
              <Badge count={filteredResumes.filter(r => r.status === 'mail_sent').length} showZero>
                <Tag color="blue">Mails Sent</Tag>
              </Badge>
              <Badge count={filteredResumes.filter(r => r.status === 'selected').length} showZero>
                <Tag color="purple">Selected</Tag>
              </Badge>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Resumes Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredResumes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} resumes`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Resume Details Modal */}
      <Modal
        title={selectedResume ? `${selectedResume.name} - Resume Details` : 'Resume Details'}
        open={resumeModalVisible}
        onCancel={() => setResumeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResumeModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedResume && window.open(selectedResume.resumeUrl, '_blank')}
          >
            Download Resume
          </Button>
        ]}
        width={800}
      >
        {selectedResume && (
          <div>
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong><MailOutlined /> Email:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{selectedResume.email}</Text>
                    </div>
                  </div>
                  <div>
                    <Text strong><PhoneOutlined /> Phone:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{selectedResume.phone}</Text>
                    </div>
                  </div>
                  <div>
                    <Text strong><EnvironmentOutlined /> Location:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{selectedResume.location}</Text>
                    </div>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Experience:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{selectedResume.experience} years</Text>
                    </div>
                  </div>
                  <div>
                    <Text strong><DollarOutlined /> Expected Salary:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{selectedResume.expectedSalary}</Text>
                    </div>
                  </div>
                  <div>
                    <Text strong><CalendarOutlined /> Selected Date:</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{new Date(selectedResume.selectedDate).toLocaleDateString()}</Text>
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>
            <Divider />
            <div>
              <Text strong>Skills:</Text>
              <div style={{ marginTop: '8px' }}>
                {selectedResume.skills.map(skill => (
                  <Tag key={skill} color="blue" style={{ marginBottom: '4px' }}>
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>
            <Divider />
            <div>
              <Text strong>Current Status:</Text>
              <div style={{ marginTop: '8px' }}>
                <Tag color={getStatusColor(selectedResume.status)}>
                  {getStatusText(selectedResume.status)}
                </Tag>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Mail Modal */}
      <Modal
        title="Send Interview Invitation"
        open={mailModalVisible}
        onCancel={() => setMailModalVisible(false)}
        footer={null}
        width={600}
      >
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>To:</Text>
            <Input 
              value={selectedResume?.email || ''} 
              disabled 
              style={{ marginTop: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Subject:</Text>
            <Input 
              placeholder="Enter subject"
              style={{ marginTop: '4px' }}
              defaultValue={`Interview Invitation - ${selectedResume?.jobTitle} Position`}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <Text strong>Message:</Text>
            <TextArea 
              rows={8} 
              placeholder="Enter your message"
              style={{ marginTop: '4px' }}
              defaultValue={selectedResume ? `Dear ${selectedResume.name},\n\nWe are pleased to inform you that your application for the ${selectedResume.jobTitle} position has been reviewed and we would like to invite you for an interview.\n\nPlease let us know your availability for the coming week.\n\nBest regards,\nHR Team` : ''}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setMailModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => sendInterviewMail({})}>
                Send Interview Invitation
              </Button>
            </Space>
          </div>
        </div>
      </Modal>

      {/* Progress Drawer */}
      <Drawer
        title={selectedResume ? `${selectedResume.name} - Progress Timeline` : 'Progress Timeline'}
        placement="right"
        open={progressDrawerVisible}
        onClose={() => setProgressDrawerVisible(false)}
        width={500}
      >
        {selectedResume && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <div style={{ marginTop: '12px' }}>
                <Title level={4} style={{ margin: 0 }}>{selectedResume.name}</Title>
                <Text type="secondary">{selectedResume.jobTitle}</Text>
              </div>
            </div>
            
            <Divider />
            
            <Steps
              direction="vertical"
              current={selectedResume.currentStep}
              items={getProgressSteps(selectedResume)}
            />
            
            <Divider />
            
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>Resume Selected</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(selectedResume.selectedDate).toLocaleDateString()}
                      </Text>
                    </div>
                  ),
                },
                ...(selectedResume.mailSentDate ? [{
                  color: 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>Interview Mail Sent</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(selectedResume.mailSentDate).toLocaleDateString()}
                      </Text>
                    </div>
                  ),
                }] : []),
                ...(selectedResume.interviewDate ? [{
                  color: selectedResume.status === 'interview_done' ? 'green' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>Interview Scheduled</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(selectedResume.interviewDate).toLocaleDateString()}
                      </Text>
                    </div>
                  ),
                }] : []),
                ...(selectedResume.status === 'selected' ? [{
                  color: 'purple',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>Candidate Selected</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Final selection completed
                      </Text>
                    </div>
                  ),
                }] : [])
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ResumeListPage;