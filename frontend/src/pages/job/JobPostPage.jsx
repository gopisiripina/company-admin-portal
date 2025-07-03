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
  Descriptions,
  List,
  Popconfirm
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
  BellOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

import { supabase } from '../../supabase/config';

const JobPostPage = ({ userRole }) => {
  const [form] = Form.useForm();
  const [selectedJob, setSelectedJob] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postingPlatforms, setPostingPlatforms] = useState({
    linkedin: false,
    company: false,
    internal: true
  });
  const navigate = useNavigate();
  // Job descriptions data from Supabase
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [postingLogs, setPostingLogs] = useState([]);
  
const postToLinkedIn = async (jobData) => {
  try {
    // Generate dynamic application URL with job parameters
    const applicationUrl = `http://localhost:5173/job-application/${jobData.id}?` + 
      `title=${encodeURIComponent(jobData.job_title || '')}&` +
      `company=${encodeURIComponent(jobData.company_name || 'Your Company Name')}&` +
      `location=${encodeURIComponent(jobData.location || '')}&` +
      `type=${encodeURIComponent(jobData.employment_type || '')}&` +
      `salary=${encodeURIComponent(jobData.salary_range || 'Competitive')}&` +
      `description=${encodeURIComponent(jobData.job_description || '')}`;

    const response = await fetch('https://ksvreddy4.pythonanywhere.com/api/post-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: 'AQXRbDwBQ3o1RgOSPhIuWBxML2dsqW9g8AcVZBb-e5A--YBqheu0oHtbjqUkoHAfelpwAnkNWnDczfIk8sGdyidWe_d2ejNlgR8mrQbP3pvif9mBMW-uxp_y7jMfJ3Ry0lQGhe0fcJKcYNvpMyFL5i7QCXmVeYOl1inWJnBOh0qBmnk-iB2nl9p28ctlALbjnuY4FRkf2TB64qgkdALXMFFA7pySUchl9oZ1CJTr1n85o9X4CsTKcCdgXRZ_n2KVoyABGDM3DB-SmqYit9OJnklMMx6T3JgKC7bClH8PPJ5eVzTw_Vt6_VwiBTuhgstnmTD5XY1P9GbdkgtgR9YtRAOMBzvIeQ',
        jobData: jobData,
        applicationUrl: applicationUrl  // Pass the dynamic URL to the backend
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        const errorMessage = errorData.error?.message || 
                            errorData.error?.error || 
                            errorData.message || 
                            JSON.stringify(errorData.error) || 
                            'Unknown error';
        throw new Error(`API Error: ${response.status} - ${errorMessage}`);
      } catch (parseError) {
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    return {
      success: true,
      postId: result.postId || result.id,
      message: 'Successfully posted to LinkedIn'
    };
  } catch (error) {
    console.error('LinkedIn posting error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
  useEffect(() => {
    fetchJobDescriptions();
    fetchPostingLogs();
  }, []);

  
  const fetchJobDescriptions = async () => {
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch job descriptions:', error);
    } else {
      // Map database fields to component expectations and ensure proper data types
      const jobsWithStatus = data.map(job => ({
        ...job,
        status: job.status || 'Active',
        // Map database field names to component field names
        description: job.job_description,
        responsibilities: job.key_responsibilities,
        qualifications: job.qualification_requirements,
        benefits: job.additional_benefits,
        skills: job.required_skills ? 
          (Array.isArray(job.required_skills) ? 
            job.required_skills : 
            job.required_skills.split(',').map(s => s.trim())
          ) : [],
        // Parse salary range if it exists
        salary_min: job.salary_range ? extractSalaryMin(job.salary_range) : null,
        salary_max: job.salary_range ? extractSalaryMax(job.salary_range) : null
      }));

      setJobDescriptions(jobsWithStatus);
    }
  };

const fetchPostingLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        job_descriptions(job_title)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching job postings:', error);
      // Use sample data if table doesn't exist or has permission issues
      setPostingLogs([
        {
          id: 1,
          jobTitle: 'Senior Frontend Developer',
          platform: 'LinkedIn',
          status: 'Success',
          timestamp: new Date().toLocaleString(),
          postId: 'LI_12345',
          views: 245,
          applications: 12
        }
      ]);
    } else {
      // Map real data properly
      const mappedLogs = data.map(log => ({
        id: log.id,
        jobTitle: log.job_descriptions?.job_title || 'Unknown Job',
        platform: log.platform,
        status: log.status,
        timestamp: new Date(log.created_at).toLocaleString(),
        postId: log.post_id,
        views: log.views || 0,
        applications: log.applications || 0,
        error: log.error_message
      }));
      setPostingLogs(mappedLogs);
    }
  } catch (error) {
    console.error('Error in fetchPostingLogs:', error);
    // Fallback to sample data
    setPostingLogs([]);
  }
};

  // Helper functions to extract salary from range string
  const extractSalaryMin = (salaryRange) => {
    if (!salaryRange) return null;
    const match = salaryRange.match(/(\d+)/);
    return match ? parseInt(match[1]) * 1000 : null;
  };

  const extractSalaryMax = (salaryRange) => {
    if (!salaryRange) return null;
    const matches = salaryRange.match(/(\d+)/g);
    return matches && matches.length > 1 ? parseInt(matches[1]) * 1000 : null;
  };

   const handleEditJob = (job) => {
  console.log('=== DEBUG: Edit Job Clicked ===');
  console.log('Job object:', job);
  console.log('Job ID:', job?.id);
  console.log('Job Title:', job?.job_title);
  console.log('===========================');
  
  navigate('/dashboard/job-description', {
    state: {
      editData: job,
      isEditing: true
    }
  });
};

  // Update job status
  const updateJobStatus = async (jobId, newStatus) => {
    const { error } = await supabase
      .from('job_descriptions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      message.error('Failed to update job status');
      console.error(error);
    } else {
      message.success(`Job status updated to ${newStatus}`);
      fetchJobDescriptions(); // Refresh the data
    }
  };
// Delete job
const deleteJob = async (jobId, jobTitle) => {
  const { error } = await supabase
    .from('job_descriptions')
    .delete()
    .eq('id', jobId);

  if (error) {
    message.error('Failed to delete job');
    console.error(error);
  } else {
    message.success(`Job "${jobTitle}" deleted successfully`);
    fetchJobDescriptions(); // Refresh the data
    
    // If the deleted job was selected, clear the selection
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(null);
    }
  }
};
  // Get counts for badges
  const getActiveJobsCount = () => {
    return jobDescriptions.filter(j => j.status === 'Active').length;
  };

  const getPostedTodayCount = () => {
    const today = new Date().toDateString();
    return postingLogs.filter(log => {
      const logDate = new Date(log.timestamp).toDateString();
      return logDate === today && log.status === 'Success';
    }).length;
  };

  // Table columns for job descriptions
  const jobColumns = [
    {
  title: 'Job Title',
  dataIndex: 'job_title',
  key: 'jobTitle',
  width: 200, // Add fixed width
  render: (text, record) => (
    <div style={{ maxWidth: '180px' }}> {/* Add max-width container */}
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
      dataIndex: 'employment_type',
      key: 'employmentType',
      render: (text) => (
        <Tag color="blue">{text || 'N/A'}</Tag>
      )
    },
    {
      title: 'Experience',
      dataIndex: 'experience_level',
      key: 'experienceLevel',
      render: (text) => (
        <Tag color="purple">
          {text ? `${text.split(' ')[0]} Level` : 'N/A'}
        </Tag>
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
      dataIndex: 'created_at',
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
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEditJob(record)}
        >
          Edit
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
      title: 'Posted At',
      dataIndex: 'timestamp',
      key: 'timestamp'
    }
  ];

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    message.success(`Selected: ${job.job_title}`);
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
  const results = [];

  try {
    // Process each selected platform
    for (const platform of selectedPlatforms) {
      let result = { platform, success: false, error: null, postId: null };

      if (platform === 'linkedin') {
        // Post to LinkedIn
        const linkedInResult = await postToLinkedIn(selectedJob);
        result.success = linkedInResult.success;
        result.error = linkedInResult.error;
        result.postId = linkedInResult.postId;
      } else if (platform === 'company') {
        // Simulate company portal posting
        await new Promise(resolve => setTimeout(resolve, 1500));
        result.success = true;
        result.postId = `COMPANY_${Date.now()}`;
      } else if (platform === 'internal') {
        // Simulate internal portal posting
        await new Promise(resolve => setTimeout(resolve, 1000));
        result.success = true;
        result.postId = `INTERNAL_${Date.now()}`;
      }

      results.push(result);

      // Insert posting log into database
 try {
  const { data, error } = await supabase
    .from('job_postings')
    .insert({
      job_id: selectedJob.id,
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      status: result.success ? 'Success' : 'Failed',
      post_id: result.postId,
      error_message: result.error,
      views: 0,
      applications: 0,
      created_at: new Date().toISOString()
    })
    .select(); // Add .select() to return the inserted data
    
  if (error) {
    console.error('Job postings insert error:', error);
    // Still continue with the process even if logging fails
  } else {
    console.log('Successfully logged posting:', data);
  }
} catch (error) {
  console.error('Job postings insert exception:', error);
}
    }

    // Show results
    const successfulPosts = results.filter(r => r.success);
    const failedPosts = results.filter(r => !r.success);

    if (successfulPosts.length > 0) {
      message.success({
        content: `Job posted successfully to: ${successfulPosts.map(p => p.platform).join(', ')}!`,
        duration: 5
      });
    }

    if (failedPosts.length > 0) {
      message.error({
        content: `Failed to post to: ${failedPosts.map(p => `${p.platform} (${p.error})`).join(', ')}`,
        duration: 8
      });
    }

    // Reset selections if at least one post was successful
    if (successfulPosts.length > 0) {
      setSelectedJob(null);
      setPostingPlatforms({
        linkedin: false,
        company: false,
        internal: true
      });
    }

    // Refresh posting logs
    fetchPostingLogs();

  } catch (error) {
    console.error('Posting error:', error);
    message.error('An unexpected error occurred while posting. Please try again.');
  } finally {
    setPosting(false);
  }
};
  const handleActiveJobsClick = () => {
    message.info(`You have ${getActiveJobsCount()} active jobs`);
  };

  const handlePostedTodayClick = () => {
    message.info(`${getPostedTodayCount()} jobs were posted today`);
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'transparent'
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
                <Badge count={getActiveJobsCount()}>
                  <Button 
                    icon={<FileTextOutlined />}
                    onClick={handleActiveJobsClick}
                  >
                    Active Jobs
                  </Button>
                </Badge>
                <Badge count={getPostedTodayCount()}>
                  <Button 
                    icon={<BellOutlined />}
                    onClick={handlePostedTodayClick}
                  >
                    Posted Today
                  </Button>
                </Badge>
                <Button 
                  icon={<SettingOutlined />}
                  onClick={() => setStatusModalVisible(true)}
                >
                  Status Jobs
                </Button>
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
  scroll={{ x: 800 }}
  style={{
    '--scrollbar-color': '#234c46'
  }}
  className="custom-scrollbar"
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
                        {selectedJob.job_title}
                      </Title>
                      <Space wrap>
                        <Tag icon={<TeamOutlined />} color="blue">
                          {selectedJob.department}
                        </Tag>
                        <Tag icon={<EnvironmentOutlined />} color="green">
                          {selectedJob.location}
                        </Tag>
                        <Tag icon={<StarOutlined />} color="purple">
                          {selectedJob.experience_level ? selectedJob.experience_level.split(' ')[0] + ' Level' : 'N/A'}
                        </Tag>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div>
                      <Text type="secondary">Skills Required:</Text>
                      <div style={{ marginTop: '8px' }}>
                        {selectedJob.skills && Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 ? (
                          <>
                            {selectedJob.skills.slice(0, 3).map((skill, index) => (
                              <Tag key={index} style={{ marginBottom: '4px' }}>
                                {skill}
                              </Tag>
                            ))}
                            {selectedJob.skills.length > 3 && (
                              <Tag>+{selectedJob.skills.length - 3} more</Tag>
                            )}
                          </>
                        ) : (
                          <Text type="secondary">No skills listed</Text>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Divider />
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                  {selectedJob.description || 'No description available'}
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
          </Col>
        </Row>

        {/* Job Preview Modal */}
        <Modal
          title={selectedJob?.job_title}
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
                  {selectedJob.department || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  {selectedJob.location || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Employment Type">
                  {selectedJob.employment_type || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Experience Level">
                  {selectedJob.experience_level || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Salary Range">
                  {selectedJob.salary_range || 'Not specified'}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Skills Required</Divider>
              <div style={{ marginBottom: '24px' }}>
                {selectedJob.skills && Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 ? (
                  selectedJob.skills.map((skill, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: '8px' }}>
                      {skill}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">No skills listed</Text>
                )}
              </div>

              <Divider orientation="left">Job Description</Divider>
              <Paragraph>{selectedJob.description || 'No description available'}</Paragraph>

              <Divider orientation="left">Key Responsibilities</Divider>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {selectedJob.responsibilities || 'No responsibilities listed'}
              </Paragraph>

              <Divider orientation="left">Qualifications</Divider>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {selectedJob.qualifications || 'No qualifications listed'}
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

        {/* Status Jobs Modal */}
        <Modal
          title="Manage Job Status"
          open={statusModalVisible}
          onCancel={() => setStatusModalVisible(false)}
          width={600}
          footer={[
            <Button key="close" onClick={() => setStatusModalVisible(false)}>
              Close
            </Button>
          ]}
        >
<List
  dataSource={jobDescriptions}
  renderItem={(job) => (
    <List.Item
      actions={[
        <Button
          key="active"
          type={job.status === 'Active' ? 'primary' : 'default'}
          size="small"
          onClick={() => updateJobStatus(job.id, 'Active')}
          disabled={job.status === 'Active'}
        >
          Active
        </Button>,
        <Button
          key="inactive"
          type={job.status === 'Inactive' ? 'primary' : 'default'}
          size="small"
          onClick={() => updateJobStatus(job.id, 'Inactive')}
          disabled={job.status === 'Inactive'}
        >
          Inactive
        </Button>,
        <Popconfirm
          key="delete"
          title="Delete this job?"
          description="This action cannot be undone. Are you sure?"
          onConfirm={() => deleteJob(job.id, job.job_title)}
          okText="Yes, Delete"
          cancelText="Cancel"
          okType="danger"
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
          >
            Delete
          </Button>
        </Popconfirm>
      ]}
    >
      <List.Item.Meta
        title={
          <Space>
            <Text strong>{job.job_title}</Text>
            <Badge 
              status={job.status === 'Active' ? 'success' : 'default'} 
              text={job.status}
            />
          </Space>
        }
        description={`${job.department} • ${job.location} • ${job.employment_type}`}
      />
    </List.Item>
  )}
/>        </Modal>
      </div>
    </div>
  );
};

export default JobPostPage;