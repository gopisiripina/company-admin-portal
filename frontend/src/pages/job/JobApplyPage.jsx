import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  message,
  Spin,
  Alert
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
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { MailOutlined } from '@ant-design/icons';
import { LinkOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Supabase configuration (same as JobApplicationPage)
const supabaseUrl = 'https://dsvqjsnxdxlgufzwcaub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdnFqc254ZHhsZ3VmendjYXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjgyMjMsImV4cCI6MjA2NjQwNDIyM30.YHdiWzPvU6XBXFzcDZL7LKtgjU_dv5pVVpFRF8OkEz8';

const supabase = createClient(supabaseUrl, supabaseKey);

const JobApplyPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobPostings, setJobPostings] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [shortlistedApplicants, setShortlistedApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [skillsFilter, setSkillsFilter] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Fetch all unique job postings from applications
  const fetchJobPostings = async () => {
    setJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id, job_title')
        .order('job_id');

      if (error) throw error;

      // Get unique job postings
      const uniqueJobs = [];
      const seenJobIds = new Set();
      
      data.forEach(item => {
        if (!seenJobIds.has(item.job_id)) {
          seenJobIds.add(item.job_id);
          uniqueJobs.push({
            id: item.job_id,
            title: item.job_title
          });
        }
      });

      setJobPostings(uniqueJobs);
    } catch (error) {
      console.error('Error fetching job postings:', error);
      message.error('Failed to load job postings');
    } finally {
      setJobsLoading(false);
    }
  };

  // Fetch applicants for selected job
  const fetchApplicants = async (jobId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Transform data to match your existing format
      const transformedApplicants = data.map(app => ({
        id: app.id,
        jobId: app.job_id,
        name: app.full_name,
        email: app.email,
        phone: app.phone,
        appliedDate: app.applied_at ? new Date(app.applied_at).toISOString().split('T')[0] : '',
        experience: app.experience_years || 'Not specified',
        skills: app.skills ? app.skills.split(',').map(s => s.trim()) : [],
        status: app.status || 'pending',
        resumeUrl: app.resume_url,
        location: app.location || 'Not specified',
        expectedSalary: app.expected_salary || 'Not specified',
        currentPosition: app.current_position,
        currentCompany: app.current_company,
        education: app.education,
        availability: app.availability,
        portfolioUrl: app.portfolio_url,
        linkedinUrl: app.linkedin_url,
        coverLetter: app.cover_letter,
        avatar: null
      }));

      setApplicants(transformedApplicants);
      setFilteredApplicants(transformedApplicants);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      message.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shortlisted applicants
  const fetchShortlistedApplicants = async () => {
    try {
      const { data, error } = await supabase
        .from('shortlisted_candidates')
        .select('*')
        .order('shortlisted_at', { ascending: false });

      if (error) throw error;
      setShortlistedApplicants(data || []);
    } catch (error) {
      console.error('Error fetching shortlisted applicants:', error);
    }
  };

  // Update applicant status in database
  const handleStatusChange = async (applicantId, newStatus) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicantId);

      if (error) throw error;

      // If shortlisted, also add to shortlisted_candidates table
      if (newStatus === 'shortlisted') {
        const applicant = applicants.find(app => app.id === applicantId);
        if (applicant) {
          await addToShortlisted(applicant);
        }
      }

      // Update local state
      const updatedApplicants = applicants.map(app =>
        app.id === applicantId ? { ...app, status: newStatus } : app
      );
      setApplicants(updatedApplicants);
      setFilteredApplicants(updatedApplicants.filter(app => 
        selectedJob === null || app.jobId === selectedJob
      ));

      message.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    }
  };

  // Add candidate to shortlisted table
  const addToShortlisted = async (applicant) => {
    try {
      // First check if already shortlisted
      const { data: existing } = await supabase
        .from('shortlisted_candidates')
        .select('id')
        .eq('application_id', applicant.id)
        .single();

      if (existing) {
        return; // Already shortlisted
      }

      const shortlistedData = {
        application_id: applicant.id,
        job_id: applicant.jobId,
        job_title: jobPostings.find(job => job.id === applicant.jobId)?.title || 'Unknown',
        candidate_name: applicant.name,
        candidate_email: applicant.email,
        candidate_phone: applicant.phone,
        experience_years: applicant.experience,
        skills: applicant.skills.join(', '),
        resume_url: applicant.resumeUrl,
        expected_salary: applicant.expectedSalary,
        location: applicant.location,
        shortlisted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('shortlisted_candidates')
        .insert([shortlistedData]);

      if (error) throw error;

      fetchShortlistedApplicants(); // Refresh shortlisted list
    } catch (error) {
      console.error('Error adding to shortlisted:', error);
      message.error('Failed to add to shortlisted candidates');
    }
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
      filtered = filtered.filter(app => {
        if (experienceFilter === '0-2') {
          return app.experience.includes('0-1') || app.experience.includes('1-3');
        } else if (experienceFilter === '3-5') {
          return app.experience.includes('3-5');
        } else if (experienceFilter === '6-10') {
          return app.experience.includes('5-10');
        } else if (experienceFilter === '10+') {
          return app.experience.includes('10+');
        }
        return true;
      });
    }

    // Skills filter
    if (skillsFilter.length > 0) {
      filtered = filtered.filter(app =>
        skillsFilter.some(skill => 
          app.skills.some(appSkill => 
            appSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
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
    fetchJobPostings();
    fetchShortlistedApplicants();
  }, []);

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

  // Get all unique skills from current applicants
  const allSkills = [...new Set(applicants.flatMap(app => app.skills))];

  // Updated columns array - Remove the Actions column and Status dropdown
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
            {record.currentPosition && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                {record.currentPosition} {record.currentCompany && `at ${record.currentCompany}`}
              </div>
            )}
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
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
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
          {exp}
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
      title: 'Expected Salary',
      dataIndex: 'expectedSalary',
      key: 'expectedSalary',
      render: (salary) => (
        <Text>{salary || 'Not specified'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Resume',
      key: 'resume',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedApplicant(record);
                setResumeModalVisible(true);
              }}
            />
          </Tooltip>
          {record.resumeUrl && (
            <Tooltip title="Download Resume">
              <Button 
                type="text" 
                icon={<DownloadOutlined />}
                onClick={() => window.open(record.resumeUrl, '_blank')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (jobsLoading) {
    return (
      <div style={{ 
        padding: '24px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

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
          Job Applications Management
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
              loading={jobsLoading}
            >
              {jobPostings.map(job => (
                <Option key={job.id} value={job.id}>
                  {job.title} (ID: {job.id})
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
                  <div>
                    <Text strong>{shortlistedApplicants.length}</Text>
                    <Text type="secondary"> total shortlisted</Text>
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

      {/* Show message if no job postings found */}
      {jobPostings.length === 0 && (
        <Alert
          message="No Job Applications Found"
          description="No applications have been submitted yet. Applications will appear here once candidates start applying through the job application form."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

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
                <Option value="10+">10+ years</Option>
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

      {/* Application Details Modal */}
      <Modal
        title={selectedApplicant ? `${selectedApplicant.name} - Application Details` : 'Application Details'}
        open={resumeModalVisible}
        onCancel={() => setResumeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResumeModalVisible(false)}>
            Close
          </Button>,
          selectedApplicant?.resumeUrl && (
            <Button 
              key="download" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => window.open(selectedApplicant.resumeUrl, '_blank')}
            >
              Download Resume
            </Button>
          )
        ]}
        width={900}
      >
        {selectedApplicant && (
          <div>
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <div>
                    <Text strong>Email:</Text>
                    <br />
                    <Text copyable>{selectedApplicant.email}</Text>
                  </div>
                  <div>
                    <Text strong>Phone:</Text>
                    <br />
                    <Text copyable>{selectedApplicant.phone}</Text>
                  </div>
                  <div>
                    <Text strong>Location:</Text>
                    <br />
                    <Text>{selectedApplicant.location}</Text>
                  </div>
                  <div>
                    <Text strong>Current Position:</Text>
                    <br />
                    <Text>{selectedApplicant.currentPosition || 'Not specified'}</Text>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="small">
                  <div>
                    <Text strong>Experience:</Text>
                    <br />
                    <Text>{selectedApplicant.experience}</Text>
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
                  <div>
                    <Text strong>Education:</Text>
                    <br />
                    <Text>{selectedApplicant.education || 'Not specified'}</Text>
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

            {selectedApplicant.portfolioUrl && (
              <>
                <Divider />
                <div>
                  <Text strong>Portfolio:</Text>
                  <br />
                  <Button 
                    type="link" 
                    icon={<LinkOutlined />}
                    onClick={() => window.open(selectedApplicant.portfolioUrl, '_blank')}
                  >
                    View Portfolio
                  </Button>
                </div>
              </>
            )}

            {selectedApplicant.linkedinUrl && (
              <>
                <Divider />
                <div>
                  <Text strong>LinkedIn:</Text>
                  <br />
                  <Button 
                    type="link" 
                    icon={<LinkOutlined />}
                    onClick={() => window.open(selectedApplicant.linkedinUrl, '_blank')}
                  >
                    View LinkedIn Profile
                  </Button>
                </div>
              </>
            )}

            {selectedApplicant.coverLetter && (
              <>
                <Divider />
                <div>
                  <Text strong>Cover Letter:</Text>
                  <br />
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '12px', 
                    background: '#f5f5f5', 
                    borderRadius: '6px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedApplicant.coverLetter}
                  </div>
                </div>
              </>
            )}
            
            <Divider />
            
            <div>
              <Text strong>Current Status:</Text>
              <br />
              <Tag color={getStatusColor(selectedApplicant.status)} style={{ marginTop: '8px' }}>
                {getStatusText(selectedApplicant.status)}
              </Tag>
            </div>

            <Divider />

            <div>
              <Text strong>Update Status:</Text>
              <br />
              <Space style={{ marginTop: '8px' }}>
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    handleStatusChange(selectedApplicant.id, 'shortlisted');
                    // Update the selectedApplicant state to reflect the change immediately
                    setSelectedApplicant(prev => ({ ...prev, status: 'shortlisted' }));
                  }}
                  disabled={selectedApplicant.status === 'shortlisted'}
                >
                  Shortlist
                </Button>
                <Button 
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    handleStatusChange(selectedApplicant.id, 'rejected');
                    // Update the selectedApplicant state to reflect the change immediately
                    setSelectedApplicant(prev => ({ ...prev, status: 'rejected' }));
                  }}
                  disabled={selectedApplicant.status === 'rejected'}
                >
                  Reject
                </Button>
                <Button 
                  icon={<MailOutlined />}
                  onClick={() => window.open(`mailto:${selectedApplicant.email}`)}
                >
                  Send Email
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobApplyPage;