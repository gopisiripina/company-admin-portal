import React, { useState, useEffect } from 'react';
import {Table,Card,Select,Input,DatePicker,Button,Tag,Space,Modal,Avatar,Row,Col,Typography,Divider,Tooltip,message,Spin,Alert} from 'antd';
import {SearchOutlined,EyeOutlined,DownloadOutlined,UserOutlined,CalendarOutlined,ToolOutlined,ReloadOutlined,CheckCircleOutlined,CloseCircleOutlined,MailOutlined,LinkOutlined} from '@ant-design/icons';
import ErrorPage from '../../error/ErrorPage';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Supabase configuration
import { supabase} from '../../supabase/config';

const JobApplyPage = ({ userRole }) => {
  // const userRole = userData?.role;
  if (userRole !== 'superadmin' && userRole !== 'admin'&& userRole!=='hr') {
    return <ErrorPage errorType="403" />;
  }

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobPostings, setJobPostings] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
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

  // Fetch applicants for selected job - FIXED VERSION
  const fetchApplicants = async (jobId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Transform data with proper status handling
      const transformedApplicants = data.map(app => ({
        id: app.id,
        jobId: app.job_id,
        name: app.full_name,
        email: app.email,
        phone: app.phone,
        appliedDate: app.applied_at ? new Date(app.applied_at).toISOString().split('T')[0] : '',
        experience: app.experience_years || 'Not specified',
        skills: app.skills ? app.skills.split(',').map(s => s.trim()) : [],
        status: app.status || 'pending', // Ensure status is properly set
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

      console.log('Transformed applicants:', transformedApplicants); // Debug log

      setApplicants(transformedApplicants);
      setFilteredApplicants(transformedApplicants);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      message.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  // REPLACE the handleStatusChange function with this:
  const handleStatusChange = async (applicantId, newStatus) => {
    try {
      console.log(`Updating applicant ${applicantId} status to ${newStatus}`);

      // First, check if the record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('job_applications')
        .select('id, status')
        .eq('id', applicantId)
        .single();

      if (checkError) {
        console.error('Error checking existing record:', checkError);
        throw checkError;
      }

      console.log('Existing record:', existingRecord);

      // Perform the update
      const { data, error } = await supabase
        .from('job_applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', applicantId)
        .select('*'); // Return all fields to verify update

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Database update result:', data);

      // Verify the update was successful
      if (!data || data.length === 0) {
        throw new Error('No rows were updated');
      }

      // Update local state immediately
      const updatedApplicants = applicants.map(app =>
        app.id === applicantId ? { ...app, status: newStatus } : app
      );
      
      setApplicants(updatedApplicants);
      
      // Also update selectedApplicant if it's the same one
      if (selectedApplicant && selectedApplicant.id === applicantId) {
        setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
      }
      
      // Reapply filters to show updated data
      applyFiltersToData(updatedApplicants);

      message.success(`Status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating status:', error);
      message.error(`Failed to update status: ${error.message}`);
      
      // Refresh data from server in case of error
      if (selectedJob) {
        fetchApplicants(selectedJob);
      }
    }
  };

  const testDatabaseAccess = async () => {
    try {
      // Test read access
      const { data: readData, error: readError } = await supabase
        .from('job_applications')
        .select('id, status')
        .limit(1);
      
      console.log('Read test:', { readData, readError });
      
      // Test update access (you can comment this out after testing)
      if (readData && readData.length > 0) {
        const testId = readData[0].id;
        const currentStatus = readData[0].status;
        
        const { data: updateData, error: updateError } = await supabase
          .from('job_applications')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testId)
          .select();
        
        console.log('Update test:', { updateData, updateError });
      }
    } catch (error) {
      console.error('Database access test failed:', error);
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

  // Separate function to apply filters to given data
  const applyFiltersToData = (dataToFilter) => {
    let filtered = [...dataToFilter];

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

  // Apply filters using the current applicants data
  const applyFilters = () => {
    applyFiltersToData(applicants);
  };

  useEffect(() => {
    fetchJobPostings();
  }, []);

  useEffect(() => {
    if (applicants.length > 0) {
      applyFilters();
    }
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

  // Table columns - Updated for responsiveness
  const columns = [
    {
      title: 'Applicant',
      key: 'applicant',
      fixed: 'left',
      width: 200, // Set specific width
      render: (_, record) => (
        <Space direction="vertical" size="small">
      <Space>
        <Avatar size={32} icon={<UserOutlined />} />
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
          {record.currentPosition && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              {record.currentPosition} {record.currentCompany && `at ${record.currentCompany}`}
            </div>
          )}
        </div>
      </Space>
      {/* Show additional info on mobile */}
      <div className="mobile-only" style={{ fontSize: '10px' }}>
        <div>Applied: {record.appliedDate ? new Date(record.appliedDate).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric' 
        }) : 'N/A'}</div>
        <div>Experience: {record.experience}</div>
        <Tag color={getStatusColor(record.status)} style={{ fontSize: '10px', marginTop: '2px' }}>
          {getStatusText(record.status)}
        </Tag>
      </div>
    </Space>
      ),
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      width: 120, 
      responsive: ['md'],
      render: (date) => (
        <div style={{ fontSize: '11px' }}>
          <CalendarOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
          {date ? new Date(date).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric' 
          }) : 'N/A'}
        </div>
      ),
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience',
      width: 100,
      responsive: ['lg'],
      render: (exp) => (
        <div style={{ fontSize: '11px' }}>
          <ToolOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
          {exp}
        </div>
      ),
    },
    {
      title: 'Skills',
      dataIndex: 'skills',
      key: 'skills',
      width: 140, 
      responsive: ['xl'],
      render: (skills) => (
        <div>
          {skills.slice(0, 2).map(skill => ( // Reduced from 3 to 2
            <Tag key={skill} color="blue" style={{ marginBottom: 2, fontSize: '10px' }}>
              {skill}
            </Tag>
          ))}
          {skills.length > 2 && (
            <Tag color="default" style={{ fontSize: '10px' }}>+{skills.length - 2}</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Salary',
      dataIndex: 'expectedSalary',
      key: 'expectedSalary',
      width: 100, 
      responsive: ['xl'],
      render: (salary) => (
        <Text style={{ fontSize: '11px' }}>{salary || 'Not specified'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      responsive: ['sm'],
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ fontSize: '10px' }}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              size="small"
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
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => window.open(record.resumeUrl, '_blank')}
              />
            </Tooltip>
          )}
          {record.status === 'pending' && (
            <>
              <Tooltip title="Shortlist">
                <Button 
                  type="text" 
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleStatusChange(record.id, 'shortlisted')}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button 
                  type="text" 
                  size="small"
                  icon={<CloseCircleOutlined />}
                  style={{ color: '#ff4d4f' }}
                  onClick={() => handleStatusChange(record.id, 'rejected')}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (jobsLoading) {
    return (
      <div style={{ 
        padding: '16px', // Reduced from '24px'
        maxWidth: '100%', // Changed from '1200px' 
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
      padding: '16px', // Reduced from '24px'
      maxWidth: '100%', // Changed from '1200px' 
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
      <style>{`@media (min-width: 768px) {
  .mobile-only {
    display: none !important;
  }
}

@media (max-width: 767px) {
  .mobile-only {
    display: block !important;
  }
}`}</style>
      {/* Job Selection */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={12} lg={8}>
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
          <Col xs={24} sm={24} md={12} lg={16}>
            {selectedJob && (
              <div style={{ 
          textAlign: window.innerWidth < 768 ? 'left' : 'right', // Left align on mobile
          marginTop: window.innerWidth < 768 ? '16px' : '0' // Add top margin on mobile
        }}>
                <Space direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'} size="middle">
                  <div>
                    <Text strong>{filteredApplicants.length}</Text>
                    <Text type="secondary"> applications found</Text>
                  </div>
                  <div>
                    <Text strong>{applicants.filter(app => app.status === 'shortlisted').length}</Text>
                    <Text type="secondary"> shortlisted</Text>
                  </div>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchApplicants(selectedJob)}
                    loading={loading}
                    size={window.innerWidth < 768 ? 'small' : 'default'}
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
          <Row gutter={[12, 12]}> {/* Reduced from [16, 16] */}
            <Col xs={24} sm={12} md={8} lg={6}>
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
            <Col xs={12} sm={6} md={4} lg={3}> {/* Reduced from 4 */}
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
            <Col xs={12} sm={6} md={4} lg={3}> {/* Reduced from 4 */}
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
            <Col xs={24} sm={12} md={8} lg={5}> {/* Reduced from 6 */}
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Skills</Text>
              </div>
              <Select
                mode="multiple"
                placeholder="Filter by skills"
                value={skillsFilter}
                onChange={setSkillsFilter}
                style={{ width: '100%' }}
                maxTagCount={window.innerWidth < 768 ? 1 : 'responsive'}
              >
                {allSkills.map(skill => (
                  <Option key={skill} value={skill}>{skill}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Date Range</Text>
              </div>
              <RangePicker
                style={{ width: '100%' }}
                onChange={setDateRange}
                size={window.innerWidth < 768 ? 'small' : 'default'}
              />
            </Col>
            <Col> {/* Spacer column */}
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
  scroll={{ x: 'max-content' }} // Change this from { x: 800 }
  size="small"
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
                  onClick={() => handleStatusChange(selectedApplicant.id, 'shortlisted')}
                  disabled={selectedApplicant.status === 'shortlisted'}
                >
                  Shortlist
                </Button>
                <Button 
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleStatusChange(selectedApplicant.id, 'rejected')}
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