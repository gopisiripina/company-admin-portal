import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Select,
  Input,
  DatePicker,
  Button,
  Tag,
  Space,
  Modal,
  Dropdown,
  Avatar,
  Badge,
  Row,
  Col,
  Typography,
  Divider,
  Tooltip,
  message
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  DownloadOutlined,
  MoreOutlined,
  UserOutlined,
  CalendarOutlined,
  ToolOutlined,
  TagsOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Dummy data for job postings
const jobPostings = [
  { id: 1, title: 'Senior React Developer', department: 'Engineering' },
  { id: 2, title: 'Product Manager', department: 'Product' },
  { id: 3, title: 'UX Designer', department: 'Design' },
  { id: 4, title: 'Data Scientist', department: 'Analytics' },
  { id: 5, title: 'DevOps Engineer', department: 'Engineering' }
];

// Dummy data for applicants
const applicantsData = [
  {
    id: 1,
    jobId: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    appliedDate: '2024-06-20',
    experience: 5,
    skills: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
    status: 'pending',
    resumeUrl: 'https://example.com/resume1.pdf',
    location: 'New York, NY',
    expectedSalary: '$120,000',
    avatar: null
  },
  {
    id: 2,
    jobId: 1,
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    appliedDate: '2024-06-19',
    experience: 7,
    skills: ['React', 'Vue.js', 'Python', 'AWS'],
    status: 'shortlisted',
    resumeUrl: 'https://example.com/resume2.pdf',
    location: 'San Francisco, CA',
    expectedSalary: '$140,000',
    avatar: null
  },
  {
    id: 3,
    jobId: 2,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    appliedDate: '2024-06-18',
    experience: 4,
    skills: ['Product Management', 'Agile', 'Analytics', 'SQL'],
    status: 'pending',
    resumeUrl: 'https://example.com/resume3.pdf',
    location: 'Austin, TX',
    expectedSalary: '$95,000',
    avatar: null
  },
  {
    id: 4,
    jobId: 1,
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1 (555) 456-7890',
    appliedDate: '2024-06-17',
    experience: 3,
    skills: ['React', 'JavaScript', 'MongoDB', 'Express'],
    status: 'rejected',
    resumeUrl: 'https://example.com/resume4.pdf',
    location: 'Seattle, WA',
    expectedSalary: '$85,000',
    avatar: null
  },
  {
    id: 5,
    jobId: 3,
    name: 'Jessica Wilson',
    email: 'jessica.wilson@email.com',
    phone: '+1 (555) 567-8901',
    appliedDate: '2024-06-16',
    experience: 6,
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    status: 'shortlisted',
    resumeUrl: 'https://example.com/resume5.pdf',
    location: 'Los Angeles, CA',
    expectedSalary: '$105,000',
    avatar: null
  },
  {
    id: 6,
    jobId: 4,
    name: 'Robert Taylor',
    email: 'robert.taylor@email.com',
    phone: '+1 (555) 678-9012',
    appliedDate: '2024-06-15',
    experience: 8,
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
    status: 'pending',
    resumeUrl: 'https://example.com/resume6.pdf',
    location: 'Boston, MA',
    expectedSalary: '$130,000',
    avatar: null
  }
];

const JobApplyPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [skillsFilter, setSkillsFilter] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Simulate API call to fetch applicants
  const fetchApplicants = (jobId) => {
    setLoading(true);
    setTimeout(() => {
      const jobApplicants = applicantsData.filter(app => app.jobId === jobId);
      setApplicants(jobApplicants);
      setFilteredApplicants(jobApplicants);
      setLoading(false);
    }, 1000);
  };

  const handleJobSelect = (jobId) => {
    setSelectedJob(jobId);
    if (jobId) {
      fetchApplicants(jobId);
    } else {
      setApplicants([]);
      setFilteredApplicants([]);
    }
  };

  const handleStatusChange = (applicantId, newStatus) => {
    const updatedApplicants = applicants.map(app =>
      app.id === applicantId ? { ...app, status: newStatus } : app
    );
    setApplicants(updatedApplicants);
    setFilteredApplicants(updatedApplicants);
    message.success(`Status updated to ${newStatus}`);
  };

  const applyFilters = () => {
    let filtered = [...applicants];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchText.toLowerCase()) ||
        app.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      const [min, max] = experienceFilter.split('-').map(Number);
      filtered = filtered.filter(app => {
        if (max) {
          return app.experience >= min && app.experience <= max;
        } else {
          return app.experience >= min;
        }
      });
    }

    // Skills filter
    if (skillsFilter.length > 0) {
      filtered = filtered.filter(app =>
        skillsFilter.some(skill => app.skills.includes(skill))
      );
    }

    // Date range filter
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(app => {
        const appDate = new Date(app.appliedDate);
        return appDate >= start && appDate <= end;
      });
    }

    setFilteredApplicants(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, statusFilter, experienceFilter, skillsFilter, dateRange, applicants]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'shortlisted': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusMenuItems = [
    { key: 'pending', label: 'Pending', onClick: () => handleStatusChange(selectedApplicant?.id, 'pending') },
    { key: 'shortlisted', label: 'Shortlisted', onClick: () => handleStatusChange(selectedApplicant?.id, 'shortlisted') },
    { key: 'rejected', label: 'Rejected', onClick: () => handleStatusChange(selectedApplicant?.id, 'rejected') }
  ];

  const allSkills = [...new Set(applicantsData.flatMap(app => app.skills))];

  const columns = [
    {
      title: 'Applicant',
      key: 'applicant',
      render: (_, record) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          {new Date(date).toLocaleDateString()}
        </Space>
      ),
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience',
      render: (exp) => (
        <Space>
          <ToolOutlined style={{ color: '#52c41a' }} />
          {exp} years
        </Space>
      ),
    },
    {
      title: 'Skills',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills) => (
        <div>
          {skills.slice(0, 3).map(skill => (
            <Tag key={skill} color="blue" style={{ marginBottom: 4 }}>
              {skill}
            </Tag>
          ))}
          {skills.length > 3 && (
            <Tag color="default">+{skills.length - 3} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record.id, value)}
          style={{ width: 120 }}
          size="small"
        >
          <Option value="pending">
            <Badge status="processing" text="Pending" />
          </Option>
          <Option value="shortlisted">
            <Badge status="success" text="Shortlisted" />
          </Option>
          <Option value="rejected">
            <Badge status="error" text="Rejected" />
          </Option>
        </Select>
      ),
    },
    {
      title: 'Resume',
      key: 'resume',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Resume">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedApplicant(record);
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View Details',
                icon: <EyeOutlined />,
                onClick: () => {
                  setSelectedApplicant(record);
                  setResumeModalVisible(true);
                }
              },
              {
                key: 'contact',
                label: 'Contact',
                onClick: () => window.open(`mailto:${record.email}`)
              }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
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
          Job Applications
        </Title>
        <Text type="secondary">
          Manage and review job applications from candidates
        </Text>
      </div>

      {/* Job Selection */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Select Job Posting</Text>
            </div>
            <Select
              placeholder="Choose a job posting to view applications"
              style={{ width: '100%' }}
              value={selectedJob}
              onChange={handleJobSelect}
              showSearch
              optionFilterProp="children"
            >
              {jobPostings.map(job => (
                <Option key={job.id} value={job.id}>
                  {job.title} - {job.department}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={16}>
            {selectedJob && (
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <div>
                    <Text strong>{filteredApplicants.length}</Text>
                    <Text type="secondary"> applications found</Text>
                  </div>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchApplicants(selectedJob)}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                </Space>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      {selectedJob && (
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
            <Col span={4}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Status</Text>
              </div>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">All Status</Option>
                <Option value="pending">Pending</Option>
                <Option value="shortlisted">Shortlisted</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </Col>
            <Col span={4}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Experience</Text>
              </div>
              <Select
                value={experienceFilter}
                onChange={setExperienceFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">All Experience</Option>
                <Option value="0-2">0-2 years</Option>
                <Option value="3-5">3-5 years</Option>
                <Option value="6-10">6-10 years</Option>
                <Option value="10">10+ years</Option>
              </Select>
            </Col>
            <Col span={6}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Skills</Text>
              </div>
              <Select
                mode="multiple"
                placeholder="Filter by skills"
                value={skillsFilter}
                onChange={setSkillsFilter}
                style={{ width: '100%' }}
              >
                {allSkills.map(skill => (
                  <Option key={skill} value={skill}>{skill}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Date Range</Text>
              </div>
              <RangePicker
                style={{ width: '100%' }}
                onChange={setDateRange}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Applications Table */}
      {selectedJob && (
        <Card>
          <Table
            columns={columns}
            dataSource={filteredApplicants}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} applications`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {/* Resume Modal */}
      <Modal
        title={selectedApplicant ? `${selectedApplicant.name} - Application Details` : 'Application Details'}
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
            onClick={() => selectedApplicant && window.open(selectedApplicant.resumeUrl, '_blank')}
          >
            Download Resume
          </Button>
        ]}
        width={800}
      >
        {selectedApplicant && (
          <div>
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <div>
                    <Text strong>Email:</Text>
                    <br />
                    <Text>{selectedApplicant.email}</Text>
                  </div>
                  <div>
                    <Text strong>Phone:</Text>
                    <br />
                    <Text>{selectedApplicant.phone}</Text>
                  </div>
                  <div>
                    <Text strong>Location:</Text>
                    <br />
                    <Text>{selectedApplicant.location}</Text>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <div>
                    <Text strong>Experience:</Text>
                    <br />
                    <Text>{selectedApplicant.experience} years</Text>
                  </div>
                  <div>
                    <Text strong>Expected Salary:</Text>
                    <br />
                    <Text>{selectedApplicant.expectedSalary}</Text>
                  </div>
                  <div>
                    <Text strong>Applied Date:</Text>
                    <br />
                    <Text>{new Date(selectedApplicant.appliedDate).toLocaleDateString()}</Text>
                  </div>
                </Space>
              </Col>
            </Row>
            <Divider />
            <div>
              <Text strong>Skills:</Text>
              <br />
              <div style={{ marginTop: '8px' }}>
                {selectedApplicant.skills.map(skill => (
                  <Tag key={skill} color="blue" style={{ marginBottom: '4px' }}>
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>
            <Divider />
            <div>
              <Text strong>Current Status:</Text>
              <br />
              <Tag color={getStatusColor(selectedApplicant.status)} style={{ marginTop: '8px' }}>
                {getStatusText(selectedApplicant.status)}
              </Tag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobApplyPage;