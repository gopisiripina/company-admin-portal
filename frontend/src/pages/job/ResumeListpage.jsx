import React, { useState, useEffect } from 'react';
import {Table,Card,Select,Input,DatePicker,Button,Tag,Form, TimePicker ,Space,Modal,Avatar,Badge,Row,Col,Typography,Divider,message,Drawer,Steps,Timeline,Tooltip} from 'antd';
import {SearchOutlined,EyeOutlined,DownloadOutlined,MailOutlined,UserOutlined, FileTextOutlined, VideoCameraOutlined, CloseCircleOutlined ,CalendarOutlined,CheckCircleOutlined,ClockCircleOutlined,SendOutlined,PhoneOutlined,EnvironmentOutlined,DollarOutlined,HistoryOutlined,ReloadOutlined} from '@ant-design/icons';
import { sendInterviewInvitation } from '../email/EmailService';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;
import { supabase} from '../../supabase/config';


const fetchShortlistedCandidates = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        interview_type,
        interview_date,
        interview_time,
        interview_link,
        interview_platform,
        mail_sent_date,
        interview_status
      `)
      .eq('job_id', jobId)
      .in('status', ['shortlisted', 'technical', 'hr', 'reschedule', 'selected'])
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching candidates:', error);
      throw error; // Throw error instead of returning empty array
    }
    
    console.log('Fetched candidates:', data); // Add this for debugging
    return data || [];
  } catch (error) {
    console.error('Error in fetchShortlistedCandidates:', error);
    return [];
  }
};

const updateInterviewDetails = async (candidateId, interviewData) => {
  const { data, error } = await supabase
    .from('job_applications')
    .update({
      status: interviewData.interviewType,
      interview_type: interviewData.interviewType,
      interview_date: interviewData.interviewDate,
      interview_time: interviewData.interviewTime,
      interview_link: interviewData.interviewLink,
      interview_platform: interviewData.interviewPlatform,
      mail_sent_date: new Date().toISOString(),
      interview_status: 'scheduled',
      updated_at: new Date().toISOString()
    })
    .eq('id', candidateId)
    .select();
    
  if (error) {
    console.error('Error updating interview details:', error);
    return { success: false, error };
  }
  return { success: true, data };
};

const getCandidateCountByJob = async (jobId) => {
  const { data, error } = await supabase
    .from('job_applications')
    .select('status, count(*)')
    .eq('job_id', jobId)
    .in('status', ['shortlisted', 'technical', 'hr', 'reschedule', 'selected']);
    
  if (error) {
    console.error('Error getting candidate count:', error);
    return {};
  }
  
  return data.reduce((acc, item) => {
    acc[item.status] = item.count;
    return acc;
  }, {});
};


const fetchJobTitles = async () => {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('job_title, job_id')
      .in('status', ['shortlisted', 'technical', 'hr', 'reschedule', 'selected'])
      .order('job_title');
    
    if (error) {
      console.error('Error fetching job titles:', error);
      return [];
    }
    
    // Get unique job titles with their job_ids
    const uniqueJobs = data.reduce((acc, item) => {
      if (!acc.find(job => job.title === item.job_title && job.id === item.job_id)) {
        acc.push({
          id: item.job_id,
          title: item.job_title
        });
      }
      return acc;
    }, []);
    
    console.log('Available jobs with shortlisted candidates:', uniqueJobs);
    return uniqueJobs;
  } catch (error) {
    console.error('Error in fetchJobTitles:', error);
    return [];
  }
};

const ResumeListPage = () => {
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [jobId, setJobId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [jobTitles, setJobTitles] = useState([]);
  
  // Modal states
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [mailModalVisible, setMailModalVisible] = useState(false);
  const [progressDrawerVisible, setProgressDrawerVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
// Add this useEffect after your state declarations
useEffect(() => {
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // First, fetch all available job titles
      const availableJobs = await fetchJobTitles();
      setJobTitles(availableJobs);
      
      // If no specific jobId is set and we have available jobs, set the first one
      if (!jobId && availableJobs.length > 0) {
        setJobId(availableJobs[0].id);
        return; // This will trigger another useEffect call with the new jobId
      }
      
      // Load candidates for the current jobId
      if (jobId) {
        console.log('Loading candidates for job ID:', jobId);
        
        const candidates = await fetchShortlistedCandidates(jobId);
        console.log('Raw candidates data:', candidates);
        
        // Transform the data to match your existing structure
        const transformedData = candidates.map(candidate => ({
          id: candidate.id,
          name: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone,
          jobTitle: candidate.job_title,
          department: candidate.current_company || 'Not specified',
          selectedDate: candidate.applied_at,
          experience: candidate.experience_years,
          skills: candidate.skills ? candidate.skills.split(',') : [],
          status: candidate.status,
          resumeUrl: candidate.resume_url,
          location: candidate.location,
          expectedSalary: candidate.expected_salary,
          avatar: null,
          interviewDate: candidate.interview_date,
          interviewTime: candidate.interview_time,
          interviewLink: candidate.interview_link,
          interviewPlatform: candidate.interview_platform,
          interviewType: candidate.interview_type,
          mailHistory: candidate.mail_history || [],
          mailSentDate: candidate.mail_sent_date,
          interviewStatus: candidate.interview_status,
          currentStep: candidate.status === 'shortlisted' ? 1 : candidate.status === 'technical' || candidate.status === 'hr' ? 2 : candidate.status === 'selected' ? 3 : 0
        }));
        
        console.log('Transformed data:', transformedData);
        setResumes(transformedData);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      message.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  loadInitialData();
}, [jobId]);
const refreshJobTitles = async () => {
  try {
    const availableJobs = await fetchJobTitles();
    setJobTitles(availableJobs);
    console.log('Job titles refreshed:', availableJobs);
  } catch (error) {
    console.error('Error refreshing job titles:', error);
  }
};
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
    case 'pending': return 'orange';
    case 'shortlisted': return 'blue';
    case 'technical': return 'cyan';
    case 'hr': return 'green';
    case 'reschedule': return 'gold';
    case 'selected': return 'purple';
    case 'rejected': return 'red';
    default: return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Pending Review';
    case 'shortlisted': return 'Shortlisted';
    case 'technical': return 'Technical Round';
    case 'hr': return 'HR Round';
    case 'reschedule': return 'Rescheduled';
    case 'selected': return 'Selected';
    case 'rejected': return 'Rejected';
    default: return status;
  }
};

  const handleSendMail = (resume) => {
    setSelectedResume(resume);
    setMailModalVisible(true);
  };

// Replace your existing sendInterviewMail function with this
const sendInterviewMail = async (values) => {
  setLoading(true);
  try {
    const interviewDetails = {
      type: values.interviewType,
      date: values.interviewDate.format('YYYY-MM-DD'),
      time: values.interviewTime.format('HH:mm'),
      link: values.meetingLink,
      platform: values.platform
    };

    // Send email using your email service
    const emailResult = await sendInterviewInvitation(selectedResume, interviewDetails);
    
    if (!emailResult.success) {
      throw new Error(emailResult.error);
    }

    // Prepare mail history entry
    const newMailEntry = {
      type: values.interviewType,
      sentDate: new Date().toISOString(),
      platform: values.platform,
      interviewDate: values.interviewDate.format('YYYY-MM-DD'),
      interviewTime: values.interviewTime.format('HH:mm')
    };

    // Get current mail history and add new entry
    const currentMailHistory = selectedResume.mailHistory || [];
    const updatedMailHistory = [...currentMailHistory, newMailEntry];

    // Update resume status in Supabase with mail history
    const updateResult = await supabase
      .from('job_applications')
      .update({
        status: values.interviewType,
        interview_type: values.interviewType,
        interview_date: values.interviewDate.format('YYYY-MM-DD'),
        interview_time: values.interviewTime.format('HH:mm'),
        interview_link: values.meetingLink,
        interview_platform: values.platform,
        mail_sent_date: new Date().toISOString(),
        interview_status: 'scheduled',
        mail_history: updatedMailHistory, // Add this line
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedResume.id)
      .select();

    if (updateResult.error) {
      throw new Error('Failed to update database');
    }

    // Update local state
    const updatedResumes = resumes.map(resume =>
      resume.id === selectedResume.id
        ? { 
            ...resume, 
            status: values.interviewType,
            mailSentDate: new Date().toISOString().split('T')[0],
            interviewDate: values.interviewDate.format('YYYY-MM-DD'),
            interviewTime: values.interviewTime.format('HH:mm'),
            interviewLink: values.meetingLink,
            interviewPlatform: values.platform,
            interviewType: values.interviewType,
            interviewStatus: 'scheduled',
            mailHistory: updatedMailHistory, // Add this line
            currentStep: values.interviewType === 'reschedule' ? 2 : 1
          }
        : resume
    );
    
    setResumes(updatedResumes);
    setMailModalVisible(false);
    
    message.success(`${values.interviewType} interview invitation sent successfully!`);
  } catch (error) {
    console.error('Error sending interview invitation:', error);
    message.error('Failed to send interview invitation: ' + error.message);
  } finally {
    setLoading(false);
  }
};
const getProgressSteps = (resume) => {
  const steps = [
    {
      title: 'Application Received',
      description: resume.applied_at ? `Applied on ${new Date(resume.applied_at).toLocaleDateString()}` : 'Pending',
      icon: <FileTextOutlined />,
      status: 'finish'
    },
    {
      title: 'Resume Shortlisted',
      description: resume.status !== 'pending' ? `Shortlisted on ${new Date(resume.selectedDate || resume.updated_at).toLocaleDateString()}` : 'Pending',
      icon: <CheckCircleOutlined />,
      status: resume.status !== 'pending' ? 'finish' : 'wait'
    },
    {
      title: 'Interview Scheduled',
      description: resume.interviewDate ? (
        <div>
          <div>{resume.interviewType?.toUpperCase()} Round</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(resume.interviewDate).toLocaleDateString()} at {resume.interviewTime}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Platform: {resume.interviewPlatform?.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      ) : 'Pending',
      icon: <CalendarOutlined />,
      status: resume.interviewDate ? 'finish' : 'wait'
    },
    {
      title: 'Interview Completed',
      description: resume.interviewStatus === 'completed' ? 'Interview completed successfully' : 'Pending',
      icon: <VideoCameraOutlined />,
      status: resume.interviewStatus === 'completed' ? 'finish' : 'wait'
    },
    {
      title: 'Final Decision',
      description: resume.status === 'selected' ? 'Candidate Selected' : resume.status === 'rejected' ? 'Not Selected' : 'Pending',
      icon: resume.status === 'selected' ? <CheckCircleOutlined /> : resume.status === 'rejected' ? <CloseCircleOutlined /> : <ClockCircleOutlined />,
      status: resume.status === 'selected' ? 'finish' : resume.status === 'rejected' ? 'error' : 'wait'
    }
  ];
  return steps;
};

  const columns = [
  {
    title: 'Candidate',
    key: 'candidate',
    fixed: 'left',
    width: 160, // Reduced from 180
    render: (_, record) => (
      <Space>
        <Avatar size={32} icon={<UserOutlined />} /> {/* Reduced from 40 */}
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div> {/* Reduced font */}
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
        </div>
      </Space>
    ),
  },
  {
    title: 'Job Title',
    dataIndex: 'jobTitle',
    key: 'jobTitle',
    width: 140, // Reduced from 160
    render: (title, record) => (
      <div>
        <div style={{ fontWeight: 500, fontSize: '12px' }}>{title}</div> {/* Reduced font */}
        <Text type="secondary" style={{ fontSize: '10px' }}>{record.department}</Text>
      </div>
    ),
  },
  {
    title: 'Selected Date',
    dataIndex: 'selectedDate',
    key: 'selectedDate',
    width: 100, // Reduced from 120
    render: (date) => (
      <div style={{ fontSize: '11px' }}> {/* Added wrapper with smaller font */}
        <CalendarOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
        {new Date(date).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric' 
        })}
      </div>
    ),
  },
  {
    title: 'Mail Type',
    key: 'mailType',
    width: 100, // Reduced from 120
    render: (_, record) => (
      <div>
        {record.mailHistory && record.mailHistory.length > 0 ? (
          <div>
            {record.mailHistory.map((mail, index) => ( // Show only latest mail
              <div key={index} style={{ marginBottom: '2px' }}>
                <Tag 
                  color={mail.type === 'technical' ? 'blue' : mail.type === 'hr' ? 'green' : 'orange'}
                  style={{ fontSize: '9px', marginBottom: '1px' }}
                >
                  {mail.type.toUpperCase()}
                </Tag>
                <div style={{ fontSize: '8px', color: '#666' }}>
                  {new Date(mail.sentDate).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric' ,year: 'numeric'
                  })}
                </div>
              </div>
            ))}
            <Text type="secondary" style={{ fontSize: '9px' }}>
              {record.mailHistory.length} mail{record.mailHistory.length > 1 ? 's' : ''}
            </Text>
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: '10px' }}>No mails sent</Text>
        )}
      </div>
    ),
  },
  {
    title: 'Resume',
    key: 'resume',
    width: 80, // Reduced from 100
    render: (_, record) => (
      <Space size="small"> {/* Added size="small" */}
        <Tooltip title="View">
          <Button 
            type="text" 
            size="small" // Added size="small"
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedResume(record);
              setResumeModalVisible(true);
            }}
          />
        </Tooltip>
        <Tooltip title="Download">
          <Button 
            type="text" 
            size="small" // Added size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open(record.resumeUrl, '_blank')}
          />
        </Tooltip>
      </Space>
    ),
  },
  {
    title: 'Interview Mail',
    key: 'interviewMail',
    width: 100, // Reduced from 120
    render: (_, record) => (
      <Button
        type="primary"
        size="small"
        icon={<SendOutlined />}
        onClick={() => handleSendMail(record)}
        style={{ fontSize: '11px' }} // Smaller font
      >
        Send
      </Button>
    ),
  },
  {
    title: 'Status',
    key: 'currentStatus',
    width: 110, // Reduced from 120
    render: (_, record) => {
      const getDetailedStatus = () => {
        switch (record.status) {
          case 'shortlisted':
            return { text: 'Shortlisted', color: 'blue' };
          case 'technical':
            if (record.interviewStatus === 'completed') {
              return { text: 'Tech Done', color: 'green' }; // Shortened text
            } else if (record.interviewStatus === 'scheduled') {
              return { text: 'Tech Scheduled', color: 'cyan' };
            }
            return { text: 'Technical', color: 'cyan' };
          case 'hr':
            if (record.interviewStatus === 'completed') {
              return { text: 'HR Done', color: 'green' }; // Shortened text
            } else if (record.interviewStatus === 'scheduled') {
              return { text: 'HR Scheduled', color: 'geekblue' };
            }
            return { text: 'HR Round', color: 'geekblue' };
          case 'reschedule':
            return { text: 'Rescheduled', color: 'gold' };
          case 'selected':
            return { text: 'Selected', color: 'purple' };
          case 'rejected':
            return { text: 'Rejected', color: 'red' };
          default:
            return { text: 'Pending', color: 'default' };
        }
      };

      const statusInfo = getDetailedStatus();
      return (
        <Tag color={statusInfo.color} style={{ fontSize: '10px' }}>
          {statusInfo.text}
        </Tag>
      );
    },
  },
  {
    title: 'Next Round',
    key: 'nextRound',
    width: 100, // Reduced from 120
    render: (_, record) => {
      const getNextRound = () => {
        if (record.status === 'selected' || record.status === 'rejected') {
          return { text: 'Final', color: 'default', icon: <CheckCircleOutlined /> };
        }
        
        if (record.status === 'technical' && record.interviewStatus === 'completed') {
          return { text: 'HR Round', color: 'green', icon: <CalendarOutlined /> };
        }
        
        if (record.status === 'hr' && record.interviewStatus === 'completed') {
          return { text: 'Decision', color: 'gold', icon: <ClockCircleOutlined /> };
        }
        
        if (record.status === 'reschedule') {
          const roundType = record.interviewType === 'technical' ? 'Tech' : 'HR';
          return { text: `${roundType}`, color: 'orange', icon: <CalendarOutlined /> };
        }
        
        if (record.interviewStatus === 'scheduled') {
          const currentRound = record.interviewType === 'technical' ? 'Tech' : 'HR';
          return { text: `${currentRound}`, color: 'blue', icon: <VideoCameraOutlined /> };
        }
        
        return { text: 'Pending', color: 'default', icon: <ClockCircleOutlined /> };
      };

      const nextRound = getNextRound();
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {nextRound.icon}
          <Text style={{ 
            fontSize: '10px', 
            color: nextRound.color === 'default' ? '#666' : undefined,
            fontWeight: nextRound.text.includes('Interview') ? 500 : 400
          }}>
            {nextRound.text}
          </Text>
        </div>
      );
    },
  },
  {
    title: 'Progress',
    key: 'progress',
    width: 80, // Reduced from 100
    render: (_, record) => (
      <Button
        type="link"
        size="small" // Added size="small"
        icon={<HistoryOutlined />}
        onClick={() => {
          setSelectedResume(record);
          setProgressDrawerVisible(true);
        }}
        style={{ fontSize: '10px' }} // Smaller font
      >
        Steps
      </Button>
    ),
  }
];


  return (
  <div style={{ 
  padding: '16px', 
  maxWidth: '100%', 
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
      <Col span={5}>
        <div style={{ marginBottom: '8px' }}>
          <Text strong>Select Job</Text>
        </div>
        <Select
          value={jobId}
          onChange={(value) => {
            setJobId(value);
            setJobTitleFilter('all'); // Reset job title filter when job changes
          }}
          style={{ width: '100%' }}
          placeholder="Select a job"
        >
          {jobTitles.map(job => (
            <Option key={job.id} value={job.id}>
              {job.title} (ID: {job.id})
            </Option>
          ))}
        </Select>
      </Col>
      <Col span={5}>
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
          <Option value="shortlisted">Shortlisted</Option>
          <Option value="technical">Technical Round</Option>
          <Option value="hr">HR Round</Option>
          <Option value="reschedule">Rescheduled</Option>
          <Option value="selected">Selected</Option>
        </Select>
      </Col>
      <Col span={5}>
        <div style={{ marginBottom: '8px' }}>
          <Text strong>Date Range</Text>
        </div>
        <RangePicker
          style={{ width: '100%' }}
          onChange={setDateRange}
        />
      </Col>
      <Col span={5}>
        <div style={{ marginBottom: '8px', opacity: 0 }}>
          <Text>Actions</Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={async () => {
              await refreshJobTitles();
              // Reload current job data
              const candidates = await fetchShortlistedCandidates(jobId);
              const transformedData = candidates.map(candidate => ({
                // ... same transformation as in useEffect
                id: candidate.id,
                name: candidate.full_name,
                email: candidate.email,
                phone: candidate.phone,
                jobTitle: candidate.job_title,
                department: candidate.current_company || 'Not specified',
                selectedDate: candidate.applied_at,
                experience: candidate.experience_years,
                skills: candidate.skills ? candidate.skills.split(',') : [],
                status: candidate.status,
                resumeUrl: candidate.resume_url,
                location: candidate.location,
                expectedSalary: candidate.expected_salary,
                avatar: null,
                interviewDate: candidate.interview_date,
                interviewTime: candidate.interview_time,
                interviewLink: candidate.interview_link,
                interviewPlatform: candidate.interview_platform,
                interviewType: candidate.interview_type,
                mailHistory: candidate.mail_history || [],
                mailSentDate: candidate.mail_sent_date,
                interviewStatus: candidate.interview_status,
                currentStep: candidate.status === 'shortlisted' ? 1 : candidate.status === 'technical' || candidate.status === 'hr' ? 2 : candidate.status === 'selected' ? 3 : 0
              }));
              setResumes(transformedData);
              message.success('Data refreshed');
            }}
            title="Refresh Data"
          >
            Refresh
          </Button>
        </Space>
      </Col>
    </Row>
    
    <Divider style={{ margin: '16px 0 8px 0' }} />
    
    <Row justify="space-between" align="middle">
      <Col>
        <Space>
          <Text strong>{filteredResumes.length}</Text>
          <Text type="secondary">selected resumes found</Text>
          {jobId && (
            <>
              <Text type="secondary">for Job ID: {jobId}</Text>
              <Text type="secondary">
                ({jobTitles.find(job => job.id === jobId)?.title || 'Unknown Job'})
              </Text>
            </>
          )}
        </Space>
      </Col>
      <Col>
        <Space>
          <Badge count={filteredResumes.filter(r => !r.mailSentDate).length} showZero>
            <Tag color="orange">Pending Mails</Tag>
          </Badge>
          <Badge count={filteredResumes.filter(r => r.mailSentDate).length} showZero>
            <Tag color="blue">Mails Sent</Tag>
          </Badge>
        </Space>
      </Col>
    </Row>
  </Card>

      {/* Resumes Table */}
      <Card style={{ overflowX: 'auto' }}>
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
    scroll={{ x: 800 }} // allows natural scroll
    size="small"
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
  width={700}
>
  {selectedResume && (
    <Form
      layout="vertical"
      onFinish={sendInterviewMail}
      initialValues={{
        email: selectedResume.email,
        subject: `Interview Invitation - ${selectedResume.jobTitle} Position`,
        interviewType: 'technical',
        platform: 'google_meet'
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="To Email" name="email">
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Interview Type" name="interviewType" rules={[{ required: true }]}>
            <Select>
              <Option value="technical">Technical Round</Option>
              <Option value="hr">HR Round</Option>
              <Option value="reschedule">Reschedule Interview</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Subject" name="subject" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Interview Date" name="interviewDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Interview Time" name="interviewTime" rules={[{ required: true }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Platform" name="platform" rules={[{ required: true }]}>
            <Select>
              <Option value="google_meet">Google Meet</Option>
              <Option value="microsoft_teams">Microsoft Teams</Option>
              <Option value="zoom">Zoom</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Meeting Link" name="meetingLink" rules={[{ required: true, type: 'url' }]}>
            <Input placeholder="https://meet.google.com/..." />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Message" name="message">
        <TextArea 
          rows={6} 
          placeholder="Enter your message"
          defaultValue={`Dear ${selectedResume.name},


Interview Details will be mentioned above.

Please availablility and join the meeting at the scheduled time.

Best regards,
HR Team`}
        />
      </Form.Item>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={() => setMailModalVisible(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
            Send Interview Invitation
          </Button>
        </Space>
      </div>
    </Form>
  )}
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