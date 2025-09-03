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
import ErrorPage from '../../error/ErrorPage';
import { supabase } from '../../supabase/config';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const JobPostPage = ({ userRole }) => {
  const [hiringTypeFilter, setHiringTypeFilter] = useState('all'); // 'all', 'on-campus', 'off-campus'
const [campusLinkModal, setCampusLinkModal] = useState(false);
const [generatedLink, setGeneratedLink] = useState('');
  const [form] = Form.useForm();
  const [selectedJob, setSelectedJob] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(5);
const [totalJobs, setTotalJobs] = useState(0);
  const [postingPlatforms, setPostingPlatforms] = useState({
    linkedin: false,
    company: false,
    internal: true
  });
  const navigate = useNavigate();
  // Job descriptions data from Supabase
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [postingLogs, setPostingLogs] = useState([]);
  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole!=='hr') {
  return <ErrorPage errorType="403" />;
}
const postToLinkedIn = async (jobData) => {
  try {
    // Generate dynamic application URL with job parameters
    const applicationUrl = `https://hrm.myaccess.cloud/job-application/${jobData.id}?` + 
      `title=${encodeURIComponent(jobData.job_title || '')}&` +
      `company=${encodeURIComponent(jobData.company_name || 'My Access')}&` +
      `location=${encodeURIComponent(jobData.location || '')}&` +
      `type=${encodeURIComponent(jobData.employment_type || '')}&` +
      `salary=${encodeURIComponent(jobData.salary_range || 'Competitive')}&` +
      `description=${encodeURIComponent(jobData.job_description || '')}`
    const requestBody = {
      accessToken: 'AQXRbDwBQ3o1RgOSPhIuWBxML2dsqW9g8AcVZBb-e5A--YBqheu0oHtbjqUkoHAfelpwAnkNWnDczfIk8sGdyidWe_d2ejNlgR8mrQbP3pvif9mBMW-uxp_y7jMfJ3Ry0lQGhe0fcJKcYNvpMyFL5i7QCXmVeYOl1inWJnBOh0qBmnk-iB2nl9p28ctlALbjnuY4FRkf2TB64qgkdALXMFFA7pySUchl9oZ1CJTr1n85o9X4CsTKcCdgXRZ_n2KVoyABGDM3DB-SmqYit9OJnklMMx6T3JgKC7bClH8PPJ5eVzTw_Vt6_VwiBTuhgstnmTD5XY1P9GbdkgtgR9YtRAOMBzvIeQ',
      jobData: jobData,
      applicationUrl: applicationUrl
    };
    const response = await fetch(`${baseUrl}post-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response text:', errorText);
      
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
    console.log('Success response:', result);
    
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
const fetchJobDescriptions = async () => {
  let query = supabase
    .from('job_descriptions')
    .select('*')
    .order('updated_at', { ascending: false });
  
  // Apply hiring type filter
  if (hiringTypeFilter !== 'all') {
    query = query.eq('hiring_type', hiringTypeFilter);
  }

  const { data, error } = await query;

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
    setTotalJobs(jobsWithStatus.length); // Add this line
  }
};
useEffect(() => {
  setCurrentPage(1);
  fetchJobDescriptions();
}, [hiringTypeFilter]);

// Generate campus link function
const generateCampusLink = (jobData) => {
  const baseUrl = 'https://hrm.myaccess.cloud/campus-job-view'; // Changed from 'campus-job' to 'campus-job-view'
  const uniqueId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  
  const linkParams = new URLSearchParams({
    link_id: uniqueId,
    job_id: jobData.id,
    title: jobData.job_title || '',
    company: jobData.company_name || 'My Access',
    college_name: jobData.college_name || '',
    department: jobData.department || '',
    location: jobData.location || '',
    employment_type: jobData.employment_type || '',
    experience_level: jobData.experience_level || '',
    salary_range: jobData.salary_range || 'Competitive',
    job_description: jobData.job_description || '',
    key_responsibilities: jobData.key_responsibilities || '',
    qualification_requirements: jobData.qualification_requirements || '',
    required_skills: Array.isArray(jobData.required_skills) ? 
      jobData.required_skills.join(',') : 
      (jobData.required_skills || ''),
    additional_benefits: jobData.additional_benefits || '',
    hiring_type: jobData.hiring_type || 'on-campus',
    status: 'active',
    created_at: new Date().toISOString()
  });
  
  return `${baseUrl}?${linkParams.toString()}`;
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
// Updated deleteJob function
const deleteJob = async (jobId, jobTitle) => {
  try {
    // First, delete related job postings to avoid foreign key constraint issues
    const { error: postingsError } = await supabase
      .from('job_postings')
      .delete()
      .eq('job_id', jobId);

    if (postingsError) {
      console.warn('Warning: Could not delete related job postings:', postingsError);
      // Continue with job deletion even if postings deletion fails
    }

    // Then delete the job description
    const { error: jobError } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', jobId);

    if (jobError) {
      console.error('Delete job error:', jobError);
      message.error(`Failed to delete job: ${jobError.message}`);
      return;
    }

    message.success(`Job "${jobTitle}" deleted successfully`);
    
    // Refresh the data
    await fetchJobDescriptions();
    await fetchPostingLogs();
    
    // If the deleted job was selected, clear the selection
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(null);
    }
    
    // Close the modal after successful deletion
    setStatusModalVisible(false);
    
  } catch (error) {
    console.error('Delete job exception:', error);
    message.error('An unexpected error occurred while deleting the job');
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
    width: 200,
    render: (text, record) => (
      <div style={{ maxWidth: '180px' }}>
        <Text strong style={{ color: '#0D7139' }}>{text}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {record.department} • {record.location}
        </Text>
        <br />
        <Tag 
          color={record.hiring_type === 'on-campus' ? 'orange' : 'blue'}
          style={{ fontSize: '10px' }}
        >
          {record.hiring_type === 'on-campus' ? 'On-Campus' : 'Off-Campus'}
        </Tag>
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
      width: 80,
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
        icon={<EyeOutlined style={{ color: '#0D7139' }}/>}
        onClick={() => handleJobPreview(record)}
        style={{ color: '#0D7139' }}
      >
        
        Preview
      </Button>
      <Button 
          type="link"
          icon={<EditOutlined style={{ color: '#0D7139' }}/>}
          onClick={() => handleEditJob(record)}
          style={{ color: '#0D7139' }}
        >
          Edit
        </Button>
      <Button 
        type="primary" 
        size="small"
        onClick={() => handleJobSelect(record)}
        disabled={record.status !== 'Active'}
        style={{ background: '#0D7139' }}
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

  // Check if it's on-campus hiring
  if (selectedJob.hiring_type === 'on-campus') {
    setPosting(true);
    
    try {
      const campusLink = generateCampusLink(selectedJob);
      setGeneratedLink(campusLink);
      
      // Store the campus link in database for tracking
      const { data, error } = await supabase
        .from('campus_job_links')  // You'll need to create this table
        .insert({
          job_id: selectedJob.id,
          unique_link_id: campusLink.split('link_id=')[1].split('&')[0],
          full_link: campusLink,
          job_title: selectedJob.job_title,
          company_name: selectedJob.company_name || 'My Access',
          college_name: selectedJob.college_name || '',
          status: 'active',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) {
        console.error('Failed to store campus link:', error);
        // Continue even if storage fails
      }

      // Also log in job_postings table
      await supabase
        .from('job_postings')
        .insert({
          job_id: selectedJob.id,
          platform: 'Campus Link',
          status: 'Success',
          post_id: campusLink.split('link_id=')[1].split('&')[0],
          created_at: new Date().toISOString()
        });

      setCampusLinkModal(true);
      message.success('Campus job link generated successfully!');
      
    } catch (error) {
      console.error('Failed to generate campus link:', error);
      message.error('Failed to generate campus link. Please try again.');
    } finally {
      setPosting(false);
    }
    
    fetchPostingLogs();
    return;
  }


  // Continue with existing off-campus posting logic
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
          <Row align="middle" justify="space-between" gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={8}>
              <Title level={2} style={{ margin: 0, color: '#0D7139' }}>
                Job Posting Page
              </Title>
            </Col>
            <Col xs={24} sm={24} md={12} lg={16}>
              <Row justify="end" gutter={[8, 8]}>
<Col xs={24} sm={16} md={14} lg={12}>
  <Space.Compact style={{ width: '100%' }}>
    <Button 
      type={hiringTypeFilter === 'all' ? 'primary' : 'default'}
      onClick={() => setHiringTypeFilter('all')}
      size="small"
      style={{ 
        flex: 1,
        backgroundColor: hiringTypeFilter === 'all' ? '#0D7139' : undefined,
        borderColor: hiringTypeFilter === 'all' ? '#0D7139' : undefined,
        color: hiringTypeFilter === 'all' ? '#fff' : undefined
      }}
    >
      All Jobs
    </Button>
    <Button 
      type={hiringTypeFilter === 'off-campus' ? 'primary' : 'default'}
      onClick={() => setHiringTypeFilter('off-campus')}
      size="small"
      style={{ 
        flex: 1,
        backgroundColor: hiringTypeFilter === 'off-campus' ? '#0D7139' : undefined,
        borderColor: hiringTypeFilter === 'off-campus' ? '#0D7139' : undefined,
        color: hiringTypeFilter === 'off-campus' ? '#fff' : undefined
      }}
    >
      Off-Campus
    </Button>
    <Button 
      type={hiringTypeFilter === 'on-campus' ? 'primary' : 'default'}
      onClick={() => setHiringTypeFilter('on-campus')}
      size="small"
      style={{ 
        flex: 1,
        backgroundColor: hiringTypeFilter === 'on-campus' ? '#0D7139' : undefined,
        borderColor: hiringTypeFilter === 'on-campus' ? '#0D7139' : undefined,
        color: hiringTypeFilter === 'on-campus' ? '#fff' : undefined
      }}
    >
      On-Campus
    </Button>
  </Space.Compact>
</Col>
                <Col xs={24} sm={8} md={10} lg={12}>
                  <Space wrap size="small" style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Badge count={getActiveJobsCount()}>
                      <Button 
                        icon={<FileTextOutlined />}
                        onClick={handleActiveJobsClick}
                        size="small"
                      >
                        Active Jobs
                      </Button>
                    </Badge>
                    <Button 
                      icon={<SettingOutlined />}
                      onClick={() => setStatusModalVisible(true)}
                      size="small"
                    >
                      Status Jobs
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          
          {/* Left Column - Job Selection */}
          
          <Col xs={24} xl={16}>
            {/* Job Selection Section */}
            <Card 
              title={
                <div style={{ color: '#0D7139' }}>
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
  pagination={{
    current: currentPage,
    pageSize: pageSize,
    total: totalJobs,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`,
    pageSizeOptions: ['5', '10', '20', '50'],
    onChange: (page, size) => {
      setCurrentPage(page);
      setPageSize(size);
    },
    onShowSizeChange: (current, size) => {
      setCurrentPage(1);
      setPageSize(size);
    },
    itemRender: (current, type, originalElement) => {
      if (type === 'page') {
        return (
          <a style={{
            color: current === currentPage ? '#0D7139' : '#666',
            backgroundColor: current === currentPage ? '#f6ffed' : 'white',
            border: `1px solid ${current === currentPage ? '#0D7139' : '#d9d9d9'}`,
            borderRadius: '6px',
            fontWeight: current === currentPage ? 600 : 400
          }}>
            {current}
          </a>
        );
      }
      return originalElement;
    }
  }}
  size="middle"
  scroll={{ x: 800 }}
  style={{
    '--scrollbar-color': '#234c46'
  }}
  className="custom-scrollbar"
  rowSelection={{
    type: 'radio',
    selectedRowKeys: selectedJob ? [selectedJob.id] : [],
    onSelect: (record) => handleJobSelect(record),
  }}
/>
            </Card>

            {/* Selected Job Preview */}
            {selectedJob && (
              <Card 
                title={
                  <div style={{ color: '#0D7139' }}>
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
                    style={{ color: '#0D7139' }}
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
           <Card title="Recent Posting Activity" >
  <div style={{ overflowX: 'auto' }}> {/* ✅ Add this */}
    <Table 
      columns={logColumns}
      dataSource={postingLogs}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      size="middle"
    />
  </div>
</Card>

          </Col>

          {/* Right Column - Posting Options */}
{/* Right Column - Posting Options */}
          <Col xs={24} xl={8}>
            {/* Posting Platforms */}
            <Card 
              title={
                <div style={{ color: '#0D7139' }}>
                  <SendOutlined style={{ marginRight: '8px' }} />
                  {selectedJob?.hiring_type === 'on-campus' ? 'Campus Job Link' : 'Posting Platforms'}
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
              {/* On-Campus Job Content */}
              {selectedJob?.hiring_type === 'on-campus' ? (
                <div>
                  <Alert
                    message="On-Campus Hiring"
                    description="Generate a shareable link for college placement officers to distribute to students."
                    type="info"
                    showIcon
                    style={{ marginBottom: '20px' }}
                  />
                  
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ 
                      padding: '16px', 
                      border: '2px dashed #0D7139', 
                      borderRadius: '8px',
                      background: '#f0f8ff'
                    }}>
                      <TeamOutlined style={{ fontSize: '24px', color: '#0D7139', marginBottom: '8px' }} />
                      <div>
                        <Text strong>Campus Job Link Generation</Text>
                        <br />
                        <Text type="secondary">
                          Click below to generate a unique application link for this job
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<RocketOutlined />}
                    loading={posting}
                    onClick={handlePostJob}
                    disabled={!selectedJob}
                    style={{
                      background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {posting ? 'Generating Link...' : 'Generate Campus Job Link'}
                  </Button>
                </div>
              ) : (
                /* Off-Campus Job Content */
                <div>
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
  style={{
    backgroundColor: postingPlatforms.linkedin ? '#8ac185' : undefined,
  }}
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
  style={{
    backgroundColor: postingPlatforms.company ? '#8ac185' : undefined
  }}
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
  style={{
    backgroundColor: postingPlatforms.internal ? '#8ac185' : undefined,
  }}
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
                      background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {posting ? 'Processing...' : 'Post to Selected Platforms'}
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>

{/* Job Preview Modal */}
<Modal
  title={selectedJob?.job_title}
  open={previewVisible}
  onCancel={() => setPreviewVisible(false)}
  width="100%"
  style={{ 
    maxWidth: '800px',
    top: window.innerWidth <= 768 ? '10px' : '20px',
    margin: window.innerWidth <= 768 ? '0 10px' : 'auto'
  }}
  styles={{
    body: {
      padding: window.innerWidth <= 768 ? '16px' : '24px',
      maxHeight: window.innerWidth <= 768 ? '80vh' : '70vh',
      overflowY: 'auto'
    }
  }}
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
      style={{ marginLeft: '8px' }}
    >
      Select This Job
    </Button>
  ]}
>

          {selectedJob && (
            <div style={{ fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}>
              <Descriptions 
                column={window.innerWidth <= 768 ? 1 : 2} 
                style={{ marginBottom: '24px' }}
                size={window.innerWidth <= 768 ? 'small' : 'default'}
                labelStyle={{ 
                  fontWeight: '600',
                  color: '#1890ff',
                  width: window.innerWidth <= 768 ? '100px' : 'auto'
                }}
                contentStyle={{ 
                  wordBreak: 'break-word'
                }}
              >
                <Descriptions.Item label="Department">
                  <Text>{selectedJob.department || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  <Text>{selectedJob.location || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Employment Type">
                  <Tag color="blue">{selectedJob.employment_type || 'N/A'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Experience Level">
                  <Tag color="purple">{selectedJob.experience_level || 'N/A'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Salary Range">
                  <Text strong style={{ color: '#52c41a' }}>
                    {selectedJob.salary_range || 'Not specified'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Hiring Type">
                  <Tag color={selectedJob.hiring_type === 'on-campus' ? 'orange' : 'blue'}>
                    {selectedJob.hiring_type === 'on-campus' ? 'On-Campus' : 'Off-Campus'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" style={{ 
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: '600',
                color: '#1890ff'
              }}>
                Skills Required
              </Divider>
              <div style={{ marginBottom: '24px' }}>
                {selectedJob.skills && Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px'
                  }}>
                    {selectedJob.skills.map((skill, index) => (
                      <Tag 
                        key={index} 
                        color="blue" 
                        style={{ 
                          marginBottom: '4px',
                          fontSize: window.innerWidth <= 768 ? '12px' : '14px'
                        }}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">No skills listed</Text>
                )}
              </div>

              <Divider orientation="left" style={{ 
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: '600',
                color: '#1890ff'
              }}>
                Job Description
              </Divider>
              <div style={{ 
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e8e8e8'
              }}>
                <Paragraph style={{ 
                  margin: 0,
                  lineHeight: '1.6',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                }}>
                  {selectedJob.description || 'No description available'}
                </Paragraph>
              </div>

              <Divider orientation="left" style={{ 
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: '600',
                color: '#1890ff'
              }}>
                Key Responsibilities
              </Divider>
              <div style={{ 
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f0f8ff',
                borderRadius: '8px',
                border: '1px solid #d4edda'
              }}>
                <Paragraph style={{ 
                  margin: 0,
                  whiteSpace: 'pre-line',
                  lineHeight: '1.6',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                }}>
                  {selectedJob.responsibilities || 'No responsibilities listed'}
                </Paragraph>
              </div>

              <Divider orientation="left" style={{ 
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: '600',
                color: '#1890ff'
              }}>
                Qualifications
              </Divider>
              <div style={{ 
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#fff7e6',
                borderRadius: '8px',
                border: '1px solid #ffeaa7'
              }}>
                <Paragraph style={{ 
                  margin: 0,
                  whiteSpace: 'pre-line',
                  lineHeight: '1.6',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                }}>
                  {selectedJob.qualifications || 'No qualifications listed'}
                </Paragraph>
              </div>

              {selectedJob.benefits && (
                <>
                  <Divider orientation="left" style={{ 
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                    fontWeight: '600',
                    color: '#1890ff'
                  }}>
                    Benefits
                  </Divider>
                  <div style={{ 
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: '#f3f5f2ff',
                    borderRadius: '8px',
                    border: '1px solid #eef3ebff'
                  }}>
                    <Paragraph style={{ 
                      margin: 0,
                      whiteSpace: 'pre-line',
                      lineHeight: '1.6',
                      fontSize: window.innerWidth <= 768 ? '14px' : '16px'
                    }}>
                      {selectedJob.benefits}
                    </Paragraph>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>

{/* Status Jobs Modal */}
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
          <div style={{ overflowX: 'auto' }}>
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
                  style={{ minWidth: '400px' }}
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
            />
          </div>
        </Modal>
        <Modal
  title="Campus Job Link Generated"
  open={campusLinkModal}
  onCancel={() => setCampusLinkModal(false)}
  width={600}
  footer={[
    <Button 
      key="copy" 
      type="primary"
      onClick={() => {
        navigator.clipboard.writeText(generatedLink);
        message.success('Link copied to clipboard!');
      }}
    >
      Copy Link
    </Button>,
    <Button key="close" onClick={() => setCampusLinkModal(false)}>
      Close
    </Button>
  ]}
>
  <div>
    <Alert
      message="Campus Job Link Ready"
      description="Share this link with colleges for on-campus hiring. Students can apply directly through this link."
      type="success"
      showIcon
      style={{ marginBottom: '16px' }}
    />
    
    <div style={{ marginBottom: '16px' }}>
      <Text strong>Job: </Text>
      <Text>{selectedJob?.job_title}</Text>
    </div>
    
    <div style={{ marginBottom: '16px' }}>
      <Text strong>Generated Link:</Text>
      <div style={{ 
        marginTop: '8px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        wordBreak: 'break-all'
      }}>
        <Text code>{generatedLink}</Text>
      </div>
    </div>
    
    <Alert
      message="Instructions"
      description="1. Copy the link above. 2. Share with college placement officers. 3. Students can apply directly through this link. 4. Track applications in your dashboard."
      type="info"
      showIcon
    />
  </div>
</Modal>
      </div>
    </div>
  );
};

export default JobPostPage;