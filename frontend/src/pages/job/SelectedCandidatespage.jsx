import React, { useState, useEffect } from 'react';
import {
  Table, Card, Select, Input, DatePicker, Button, Tag, Form, 
  Space, Modal, Avatar, Badge, Row, Col, Typography, Divider, 
  message, Drawer, Timeline, Tooltip, InputNumber, Descriptions,
  Alert, Steps, Progress, Statistic
} from 'antd';
import {
  SearchOutlined, EyeOutlined, DownloadOutlined, MailOutlined, 
  UserOutlined, FileTextOutlined, TrophyOutlined, CloseCircleOutlined,
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  SendOutlined, PhoneOutlined, EnvironmentOutlined, DollarOutlined,
  HistoryOutlined, ReloadOutlined, StarOutlined, TeamOutlined,
  BankOutlined, IdcardOutlined, HomeOutlined, ContactsOutlined,
  UpOutlined, DownOutlined
} from '@ant-design/icons';
import ErrorPage from '../../error/ErrorPage';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Supabase configuration
import { supabase} from '../../supabase/config';

const SelectedCandidatesPage = ({ userRole }) => {
  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole!=='hr') {
    return <ErrorPage errorType="403" />;
  }
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [jobTitles, setJobTitles] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Modal states
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

const [screenSize, setScreenSize] = useState({
  isMobile: window.innerWidth < 576,
  isTablet: window.innerWidth >= 576 && window.innerWidth < 992,
  isDesktop: window.innerWidth >= 992,
  isLargeDesktop: window.innerWidth >= 1200
});

useEffect(() => {
  const handleResize = () => {
    setScreenSize({
      isMobile: window.innerWidth < 576,
      isTablet: window.innerWidth >= 576 && window.innerWidth < 992,
      isDesktop: window.innerWidth >= 992,
      isLargeDesktop: window.innerWidth >= 1200
    });
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

const mobileColumns = [
  {
    title: 'Candidate',
    key: 'candidate',
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 500, fontSize: '14px' }}>{record.name}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{record.jobTitle}</div>
        <div style={{ fontSize: '11px', color: '#999' }}>{record.email}</div>
        <div style={{ marginTop: '4px' }}>
          {record.offerSent ? (
            <Tag color="green" size="small">Offer Sent</Tag>
          ) : (
            <Tag color="orange" size="small">Pending</Tag>
          )}
        </div>
      </div>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 100,
    render: (_, record) => (
      <Space direction="vertical" size="small">
        <Button 
          size="small" 
          block
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedCandidate(record);
            setCandidateModalVisible(true);
          }}
        >
          Details
        </Button>
        <Button
          size="small"
          block
          type={record.offerSent ? "default" : "primary"}
          icon={<SendOutlined />}
          onClick={() => {
            setSelectedCandidate(record);
            setOfferModalVisible(true);
          }}
          disabled={record.offerSent}
        >
          {record.offerSent ? 'Sent' : 'Send Offer'}
        </Button>
      </Space>
    ),
  }
];
  // Fetch selected candidates from Supabase
  const fetchSelectedCandidates = async () => {
    setLoading(true);
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
          interview_status,
          technical_rating,
          communication_rating,
          interview_feedback,
          interviewer_name,
          mail_history
        `)
        .eq('status', 'selected')
        .order('applied_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching selected candidates:', error);
        message.error('Failed to load selected candidates');
        return;
      }

      // Transform data for display
      const transformedData = data.map(candidate => ({
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
        currentPosition: candidate.current_position,
        education: candidate.education,
        linkedinUrl: candidate.linkedin_url,
        portfolioUrl: candidate.portfolio_url,
        technicalRating: candidate.technical_rating,
        communicationRating: candidate.communication_rating,
        interviewFeedback: candidate.interview_feedback,
        interviewerName: candidate.interviewer_name,
        interviewDate: candidate.interview_date,
        interviewTime: candidate.interview_time,
        mailHistory: candidate.mail_history || [],
        offerSent: candidate.mail_history ? candidate.mail_history.some(mail => mail.type === 'offer') : false,
        offerSentDate: candidate.mail_history ? 
          candidate.mail_history.find(mail => mail.type === 'offer')?.sentDate : null
      }));

      setCandidates(transformedData);
      
      // Extract unique job titles
      const uniqueTitles = [...new Set(transformedData.map(item => item.jobTitle))];
      setJobTitles(uniqueTitles);

    } catch (error) {
      console.error('Error loading selected candidates:', error);
      message.error('Failed to load selected candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedCandidates();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...candidates];

    if (searchText) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (jobTitleFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.jobTitle === jobTitleFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'offer_sent') {
        filtered = filtered.filter(candidate => candidate.offerSent);
      } else if (statusFilter === 'offer_pending') {
        filtered = filtered.filter(candidate => !candidate.offerSent);
      }
    }

    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(candidate => {
        const candidateDate = new Date(candidate.selectedDate);
        return candidateDate >= start && candidateDate <= end;
      });
    }

    setFilteredCandidates(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, jobTitleFilter, statusFilter, dateRange, candidates]);

  // Send offer letter email
// Updated sendOfferLetter function with better error handling and debugging
const sendOfferLetter = async (offerData) => {
  setLoading(true);
  try {
    console.log('Sending email with data:', offerData);
    
    // Format the joining date properly
    const formattedJoiningDate = offerData.joiningDate 
      ? (typeof offerData.joiningDate === 'string' 
          ? offerData.joiningDate 
          : new Date(offerData.joiningDate).toLocaleDateString())
      : '';
    
    // Prepare email template parameters
    const emailParams = {
      to_name: selectedCandidate.name,
      to_email: selectedCandidate.email,
      job_title: selectedCandidate.jobTitle,
      company_name: offerData.companyName,
      salary_amount: offerData.salaryAmount,
      joining_date: formattedJoiningDate,
      work_location: offerData.workLocation,
      reporting_manager: offerData.reportingManager,
      additional_benefits: offerData.additionalBenefits,
      hr_contact: offerData.hrContact,
      offer_valid_until: offerData.offerValidUntil,
      message: offerData.message || ''
    };

    console.log('Email params:', emailParams);

    const response = await fetch('http://cap.myaccessio.com:5000/api/send-job-offer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    senderEmail: "suryavenkatareddy90@gmail.com",
    senderPassword: "vrxftrjsiekrxdnf",
    recipientEmail: selectedCandidate.email,
    subject: `Job Offer - ${selectedCandidate.jobTitle} Position at ${offerData.companyName}`,
    smtpServer: "smtp.gmail.com",
    smtpPort: 587,
    templateData: {
      to_name: selectedCandidate.name,
      job_title: selectedCandidate.jobTitle,
      company_name: offerData.companyName,
      salary_amount: offerData.salaryAmount,
      joining_date: formattedJoiningDate,
      work_location: offerData.workLocation,
      reporting_manager: offerData.reportingManager,
      additional_benefits: offerData.additionalBenefits,
      offer_valid_until: offerData.offerValidUntil,
      message: offerData.message || '',
      hr_contact: offerData.hrContact
    }
  })
});

const result = await response.json();

    console.log('EmailJS result:', result);

    if (response.ok && result.success) {
      // Store the formatted joining date in the database
      const newMailEntry = {
        type: 'offer',
        sentDate: new Date().toISOString(),
        offerDetails: {
          ...offerData,
          joiningDate: formattedJoiningDate // Store as formatted string
        },
        emailStatus: 'sent'
      };

      const currentMailHistory = selectedCandidate.mailHistory || [];
      const updatedMailHistory = [...currentMailHistory, newMailEntry];

      const { error } = await supabase
        .from('job_applications')
        .update({
          mail_history: updatedMailHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCandidate.id);

      if (error) {
        console.error('Database update error:', error);
        throw new Error('Failed to update database: ' + error.message);
      }

      const updatedCandidates = candidates.map(candidate =>
        candidate.id === selectedCandidate.id
          ? { 
              ...candidate, 
              mailHistory: updatedMailHistory,
              offerSent: true,
              offerSentDate: new Date().toISOString()
            }
          : candidate
      );
      
      setCandidates(updatedCandidates);
      setOfferModalVisible(false);
      message.success('Offer letter sent successfully!');
    } else {
      throw new Error('EmailJS returned unexpected status: ' + result.status);
    }
  } catch (error) {
    console.error('Error sending offer letter:', error);
    
    if (error.text) {
      message.error('Failed to send email: ' + error.text);
    } else if (error.message) {
      message.error('Failed to send offer letter: ' + error.message);
    } else {
      message.error('Failed to send offer letter. Please check your EmailJS configuration.');
    }
  } finally {
    setLoading(false);
  }
};

  const getColumns = () => {
  if (screenSize.isMobile) {
    return [
      {
        title: 'Candidate',
        key: 'candidate',
        render: (_, record) => (
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.jobTitle}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>{record.email}</div>
            <div style={{ marginTop: '4px' }}>
              {record.offerSent ? (
                <Tag color="green" size="small">Offer Sent</Tag>
              ) : (
                <Tag color="orange" size="small">Pending</Tag>
              )}
            </div>
          </div>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <Space direction="vertical" size="small">
            <Button 
              size="small" 
              block
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedCandidate(record);
                setCandidateModalVisible(true);
              }}
            >
              Details
            </Button>
            <Button
              size="small"
              block
              type={record.offerSent ? "default" : "primary"}
              icon={<SendOutlined />}
              onClick={() => {
                setSelectedCandidate(record);
                setOfferModalVisible(true);
              }}
              disabled={record.offerSent}
            >
              {record.offerSent ? 'Sent' : 'Send'}
            </Button>
          </Space>
        ),
      }
    ];
  }
  
  if (screenSize.isTablet) {
    return [
      {
        title: 'Candidate',
        key: 'candidate',
        width: 200,
        render: (_, record) => (
          <Space>
            <Avatar size={32} icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div>
              <Text type="secondary" style={{ fontSize: '11px' }}>{record.jobTitle}</Text>
            </div>
          </Space>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 100,
        render: (_, record) => (
          <div>
            {record.offerSent ? (
              <Tag color="green" size="small">Sent</Tag>
            ) : (
              <Tag color="orange" size="small">Pending</Tag>
            )}
          </div>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space size="small">
            <Button 
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedCandidate(record);
                setCandidateModalVisible(true);
              }}
            />
            <Button
              size="small"
              type={record.offerSent ? "default" : "primary"}
              icon={<SendOutlined />}
              onClick={() => {
                setSelectedCandidate(record);
                setOfferModalVisible(true);
              }}
              disabled={record.offerSent}
            />
          </Space>
        ),
      }
    ];
  }
  
  // Desktop - return your existing full columns array
  return [
  {
    title: 'Candidate',
    key: 'candidate',
    fixed: 'left',
    width: 180, // Reduced from 200
    render: (_, record) => (
      <Space>
        <Badge dot={!record.offerSent} status="processing">
          <Avatar size={32} icon={<UserOutlined />} /> {/* Reduced from 40 */}
        </Badge>
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div> {/* Reduced font */}
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
          <div style={{ fontSize: '10px', color: '#1890ff' }}>
            <StarOutlined /> Selected
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Job Details',
    key: 'jobDetails',
    width: 150, // Reduced from 180
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 500, fontSize: '12px' }}>{record.jobTitle}</div>
        <Text type="secondary" style={{ fontSize: '11px' }}>{record.department}</Text>
        <div style={{ fontSize: '10px', color: '#52c41a' }}>
          <TrophyOutlined /> Exp: {record.experience} years
        </div>
      </div>
    ),
  },
  {
    title: 'Ratings',
    key: 'ratings',
    width: 120, // Reduced from 150
    render: (_, record) => (
      <div>
        <div style={{ marginBottom: '2px' }}>
          <Text style={{ fontSize: '10px' }}>Tech: </Text>
          <Tag color={record.technicalRating >= 4 ? 'green' : record.technicalRating >= 3 ? 'orange' : 'red'} 
               size="small">
            {record.technicalRating || 'N/A'}/5
          </Tag>
        </div>
        <div>
          <Text style={{ fontSize: '10px' }}>Comm: </Text>
          <Tag color={record.communicationRating >= 4 ? 'green' : record.communicationRating >= 3 ? 'orange' : 'red'} 
               size="small">
            {record.communicationRating || 'N/A'}/5
          </Tag>
        </div>
      </div>
    ),
  },
  {
    title: 'Selected Date',
    dataIndex: 'selectedDate',
    key: 'selectedDate',
    width: 100, // Reduced from 120
    render: (date) => (
      <div style={{ fontSize: '11px' }}>
        <CalendarOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
        {new Date(date).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric'
        })}
      </div>
    ),
  },
  {
    title: 'Offer Status',
    key: 'offerStatus',
    width: 110, // Reduced from 130
    render: (_, record) => (
      <div>
        {record.offerSent ? (
          <div>
            <Tag color="green" icon={<CheckCircleOutlined />} size="small">
              Sent
            </Tag>
            <div style={{ fontSize: '9px', color: '#666' }}>
              {new Date(record.offerSentDate).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <Tag color="orange" icon={<ClockCircleOutlined />} size="small">
            Pending
          </Tag>
        )}
      </div>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 80, // Reduced from 100
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="View Details">
          <Button 
            type="text" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedCandidate(record);
              setCandidateModalVisible(true);
            }}
          />
        </Tooltip>
        <Tooltip title="Download Resume">
          <Button 
            type="text" 
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open(record.resumeUrl, '_blank')}
          />
        </Tooltip>
      </Space>
    ),
  },
  {
    title: 'Send Offer',
    key: 'sendOffer',
    width: 100, // Reduced from 120
    render: (_, record) => (
      <Button
        type={record.offerSent ? "default" : "primary"}
        size="small"
        icon={<SendOutlined />}
        onClick={() => {
          setSelectedCandidate(record);
          setOfferModalVisible(true);
        }}
        disabled={record.offerSent}
        style={{ fontSize: '11px' }}
      >
        {record.offerSent ? 'Sent' : 'Send'}
      </Button>
    ),
  },
  {
    title: 'History',
    key: 'history',
    width: 70, // Reduced from 80
    render: (_, record) => (
      <Button
        type="link"
        size="small"
        icon={<HistoryOutlined />}
        onClick={() => {
          setSelectedCandidate(record);
          setHistoryDrawerVisible(true);
        }}
        style={{ fontSize: '11px' }}
      >
        View
      </Button>
    ),
  }
];
};


  return (
    <div style={{ 
  padding: screenSize.isMobile ? '8px' : screenSize.isTablet ? '12px' : '16px',
  maxWidth: '100%',
  margin: '0 auto', 
  width: '100%',
  minHeight: '100vh'
}}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <TrophyOutlined /> Selected Candidates
        </Title>
        <Text type="secondary">
          Manage selected candidates and send offer letters
        </Text>
      </div>

      {/* Statistics Cards */}
<Row gutter={[screenSize.isMobile ? 4 : screenSize.isTablet ? 8 : 16, 8]} style={{ marginBottom: '24px' }}>
  <Col xs={12} sm={12} md={6} lg={6} xl={4}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title={screenSize.isMobile ? "Selected" : "Total Selected"}
        value={candidates.length}
        prefix={<TeamOutlined />}
        valueStyle={{ 
          color: '#3f8600',
          fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px'
        }}
      />
    </Card>
  </Col>

  <Col xs={12} sm={12} md={6} lg={6} xl={4}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title="Offers Sent"
        value={candidates.filter(c => c.offerSent).length}
        prefix={<SendOutlined />}
        valueStyle={{ color: '#1890ff' ,fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px'}}
      />
    </Card>
  </Col>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title="Pending Offers"
        value={candidates.filter(c => !c.offerSent).length}
        prefix={<ClockCircleOutlined />}
        valueStyle={{ color: '#cf1322',fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px' }}
      />
    </Card>
  </Col>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title="Completion Rate"
        value={candidates.length > 0 ? Math.round((candidates.filter(c => c.offerSent).length / candidates.length) * 100) : 0}
        suffix="%"
        prefix={<CheckCircleOutlined />}
        valueStyle={{ color: '#722ed1',fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px' }}
      />
    </Card>
  </Col>
</Row>

      {/* Filters */}
<Card style={{ marginBottom: '24px' }}>
  {screenSize.isMobile ? (
    <div>

      {filtersVisible && (
        <div style={{ marginTop: '16px' }}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Select
                value={jobTitleFilter}
                onChange={setJobTitleFilter}
                style={{ width: '100%' }}
                placeholder="Job Title"
              >
                <Option value="all">All Job Titles</Option>
                {jobTitles.map(title => (
                  <Option key={title} value={title}>{title}</Option>
                ))}
              </Select>
            </Col>
            <Col span={24}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                placeholder="Offer Status"
              >
                <Option value="all">All Status</Option>
                <Option value="offer_sent">Offer Sent</Option>
                <Option value="offer_pending">Offer Pending</Option>
              </Select>
            </Col>
          </Row>
        </div>
      )}
    </div>
  ) : (
    <Row gutter={[12, 12]}>
      {/* Your existing desktop filters */}
    </Row>
  )}
  <Row gutter={[screenSize.isMobile ? 8 : screenSize.isTablet ? 12 : 16, 12]}>
    <Col xs={24} sm={12} md={8} lg={6} xl={5}> {/* Made responsive */}
      <div style={{ marginBottom: '8px' }}>
        <Text strong style={{ fontSize: screenSize.isMobile ? '12px' : '14px' }}>Search</Text>
      </div>
      <Input
         size={screenSize.isMobile ? "small" : "middle"}
        placeholder={screenSize.isMobile ? "Search..." : "Search by name or email"}
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
      />
    </Col>
    <Col xs={12} sm={6} md={4} lg={4} xl={4}> {/* Reduced width */}
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
    <Col xs={12} sm={6} md={4} lg={4} xl={4}> {/* Reduced width */}
      <div style={{ marginBottom: '8px' }}>
        <Text strong>Offer Status</Text>
      </div>
      <Select
        value={statusFilter}
        onChange={setStatusFilter}
        style={{ width: '100%' }}
      >
        <Option value="all">All Status</Option>
        <Option value="offer_sent">Offer Sent</Option>
        <Option value="offer_pending">Offer Pending</Option>
      </Select>
    </Col>
    <Col xs={24} sm={12} md={6} lg={6} xl={6}> {/* Made responsive */}
      <div style={{ marginBottom: '8px' }}>
        <Text strong>Date Range</Text>
      </div>
      <RangePicker
        style={{ width: '100%' }}
        onChange={setDateRange}
      />
    </Col>
    <Col xs={24} sm={12} md={4} lg={4} xl={4}> {/* Reduced width */}
      <div style={{ marginBottom: '8px', opacity: 0 }}>
        <Text>Action</Text>
      </div>
      <Button
        icon={<ReloadOutlined />}
        onClick={fetchSelectedCandidates}
        title="Refresh Data"
        style={{ width: '100%' }} // Full width on mobile
      />
    </Col>
  </Row>
</Card>

      {/* Selected Candidates Table */}
      <Card>
        <Table
  columns={getColumns()}
  dataSource={filteredCandidates}
  rowKey="id"
  loading={loading}
  pagination={{
    pageSize: screenSize.isMobile ? 5 : screenSize.isTablet ? 8 : 10,
    showSizeChanger: screenSize.isDesktop,
    showQuickJumper: screenSize.isDesktop,
    showTotal: screenSize.isDesktop ? (total, range) =>
      `${range[0]}-${range[1]} of ${total} candidates` : null,
    simple: screenSize.isMobile
  }}
  scroll={{ 
    x: screenSize.isMobile ? 350 : screenSize.isTablet ? 500 : 900 
  }}
  size={screenSize.isMobile ? "small" : "middle"}
/>
      </Card>

      {/* Candidate Details Modal */}
<Modal
  title={selectedCandidate ? `${selectedCandidate.name} - Candidate Details` : 'Candidate Details'}
  open={candidateModalVisible}
  onCancel={() => setCandidateModalVisible(false)}
  width={screenSize.isMobile ? '95%' : screenSize.isTablet ? '80%' : screenSize.isDesktop ? 900 : 1000}
  style={{ top: screenSize.isMobile ? 20 : 40 }}
        footer={[
          <Button key="close" onClick={() => setCandidateModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedCandidate && window.open(selectedCandidate.resumeUrl, '_blank')}
          >
            Download Resume
          </Button>
        ]}

      >
        {selectedCandidate && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Full Name" span={1}>
                <UserOutlined /> {selectedCandidate.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={1}>
                <MailOutlined /> {selectedCandidate.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone" span={1}>
                <PhoneOutlined /> {selectedCandidate.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Location" span={1}>
                <EnvironmentOutlined /> {selectedCandidate.location}
              </Descriptions.Item>
              <Descriptions.Item label="Current Position" span={1}>
                <BankOutlined /> {selectedCandidate.currentPosition}
              </Descriptions.Item>
              <Descriptions.Item label="Experience" span={1}>
                <TrophyOutlined /> {selectedCandidate.experience} years
              </Descriptions.Item>
              <Descriptions.Item label="Education" span={2}>
                <FileTextOutlined /> {selectedCandidate.education}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Salary" span={1}>
                <DollarOutlined /> {selectedCandidate.expectedSalary}
              </Descriptions.Item>
              <Descriptions.Item label="Technical Rating" span={1}>
                <Tag color="blue">{selectedCandidate.technicalRating || 'N/A'}/5</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Communication Rating" span={1}>
                <Tag color="green">{selectedCandidate.communicationRating || 'N/A'}/5</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Interviewer" span={1}>
                {selectedCandidate.interviewerName || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />
            
            <div>
              <Text strong>Skills:</Text>
              <div style={{ marginTop: '8px' }}>
                {selectedCandidate.skills.map(skill => (
                  <Tag key={skill} color="blue" style={{ marginBottom: '4px' }}>
                    {skill.trim()}
                  </Tag>
                ))}
              </div>
            </div>

            {selectedCandidate.interviewFeedback && (
              <>
                <Divider />
                <div>
                  <Text strong>Interview Feedback:</Text>
                  <Paragraph style={{ marginTop: '8px', background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                    {selectedCandidate.interviewFeedback}
                  </Paragraph>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Send Offer Letter Modal */}
      <Modal
      
        title="Send Offer Letter"
        open={offerModalVisible}
        onCancel={() => setOfferModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCandidate && (
          <Form
            layout="vertical"
            onFinish={sendOfferLetter}
            initialValues={{
              candidateName: selectedCandidate.name,
              candidateEmail: selectedCandidate.email,
              jobTitle: selectedCandidate.jobTitle,
              companyName: 'Your Company Name',
              salaryAmount: selectedCandidate.expectedSalary,
              workLocation: 'Office/Remote/Hybrid',
              offerValidUntil: '7 days from offer date'
            }}
          >
            <Alert
              message="Offer Letter Details"
              description="Please fill in all the required details for the offer letter."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Candidate Name" name="candidateName">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Candidate Email" name="candidateEmail">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Job Title" name="jobTitle" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Company Name" name="companyName" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Salary Amount" name="salaryAmount" rules={[{ required: true }]}>
                  <Input prefix={<DollarOutlined />} placeholder="e.g., $75,000 per annum" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Joining Date" name="joiningDate" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

          <Row gutter={16}>
  <Col xs={24} sm={12} md={12} lg={12} xl={12}> {/* Made responsive */}
    <Form.Item label="Joining Date" name="joiningDate" rules={[{ required: true }]}>
      <DatePicker style={{ width: '100%' }} />
    </Form.Item>
  </Col>
  <Col xs={24} sm={12} md={12} lg={12} xl={12}> {/* Made responsive */}
    <Form.Item label="Work Location" name="workLocation" rules={[{ required: true }]}>
      <Select>
        <Option value="office">Office</Option>
        <Option value="remote">Remote</Option>
        <Option value="hybrid">Hybrid</Option>
        <Option value="onsite">On-site</Option>
      </Select>
    </Form.Item>
  </Col>
</Row>

            <Form.Item label="Additional Benefits" name="additionalBenefits">
              <TextArea 
                rows={3} 
                placeholder="Health insurance, provident fund, flexible hours, etc."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="HR Contact" name="hrContact" rules={[{ required: true }]}>
                  <Input placeholder="HR name and contact details" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Offer Valid Until" name="offerValidUntil" rules={[{ required: true }]}>
                  <Input placeholder="e.g., 7 days from offer date" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Additional Message" name="message">
              <TextArea 
                rows={4} 
                placeholder="Any additional message or instructions for the candidate..."
                defaultValue={`Dear ${selectedCandidate.name},

Congratulations! We are pleased to extend this offer of employment to you.

We look forward to welcoming you to our team.

Best regards,
HR Team`}
              />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setOfferModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                  Send Offer Letter
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Modal>

      <style>{`@media (max-width: 575px) {
  .ant-table-thead > tr > th {
    padding: 8px 4px !important;
    font-size: 12px !important;
  }
  .ant-table-tbody > tr > td {
    padding: 8px 4px !important;
    font-size: 11px !important;
  }
}

@media (min-width: 576px) and (max-width: 991px) {
  .ant-table-thead > tr > th {
    padding: 10px 6px !important;
    font-size: 13px !important;
  }
}

@media (min-width: 1200px) {
  .ant-table-thead > tr > th {
    padding: 12px 8px !important;
  }
}`}</style>
      {/* History Drawer */}
      <Drawer
        title={selectedCandidate ? `${selectedCandidate.name} - Complete History` : 'Complete History'}
  placement="right"
  open={historyDrawerVisible}
  onClose={() => setHistoryDrawerVisible(false)}
  width={screenSize.isMobile ? '95%' : screenSize.isTablet ? '70%' : screenSize.isDesktop ? 600 : 700}
      >
        {selectedCandidate && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <div style={{ marginTop: '12px' }}>
                <Title level={4} style={{ margin: 0 }}>{selectedCandidate.name}</Title>
                <Text type="secondary">{selectedCandidate.jobTitle}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag color="green" icon={<TrophyOutlined />}>
                    SELECTED CANDIDATE
                  </Tag>
                </div>
              </div>
            </div>
            
            <Divider />
            


<Timeline
  items={[
    {
      color: 'green',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Application Submitted</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(selectedCandidate.selectedDate).toLocaleDateString()}
          </Text>
        </div>
      ),
    },
    {
      color: 'blue',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Resume Shortlisted</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Moved to interview process
          </Text>
        </div>
      ),
    },
    // Fixed conditional interview item
    ...(selectedCandidate.interviewDate ? [{
      color: 'cyan',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Interview Completed</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(selectedCandidate.interviewDate).toLocaleDateString()}
          </Text>
          <div style={{ marginTop: '4px' }}>
            <Tag color="blue" size="small">Technical: {selectedCandidate.technicalRating}/5</Tag>
            <Tag color="green" size="small">Communication: {selectedCandidate.communicationRating}/5</Tag>
          </div>
        </div>
      ),
    }] : []),
    {
      color: 'gold',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Candidate Selected</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Moved to selected candidates list
          </Text>
        </div>
      ),
    },
    // Fixed mail history items - convert dates to strings properly
    ...((selectedCandidate.mailHistory || []).map((mail, index) => ({
      color: mail.type === 'offer' ? 'green' : 'blue',
      children: (
        <div key={`mail-${index}`}>
          <div style={{ fontWeight: 500 }}>
            {mail.type === 'offer' ? 'Offer Letter Sent' : 'Email Sent'}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(mail.sentDate).toLocaleDateString()} at {new Date(mail.sentDate).toLocaleTimeString()}
          </Text>
          {mail.type === 'offer' && mail.offerDetails && (
            <div style={{ marginTop: '8px', background: '#f6ffed', padding: '8px', borderRadius: '4px' }}>
              <Text style={{ fontSize: '12px' }}>
                <strong>Salary:</strong> {mail.offerDetails.salaryAmount}<br/>
                {/* Fix the joining date rendering */}
                <strong>Joining:</strong> {typeof mail.offerDetails.joiningDate === 'string' 
                  ? mail.offerDetails.joiningDate 
                  : new Date(mail.offerDetails.joiningDate).toLocaleDateString()}<br/>
                <strong>Location:</strong> {mail.offerDetails.workLocation}
              </Text>
            </div>
          )}
        </div>
      ),
    })))
  ]}
/>
            {selectedCandidate.mailHistory && selectedCandidate.mailHistory.length > 0 && (
              <>
                <Divider />
                <div>
                  <Title level={5}>Email History</Title>
                  {selectedCandidate.mailHistory.map((mail, index) => (
                    <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Tag color={mail.type === 'offer' ? 'green' : 'blue'}>
                            {mail.type.toUpperCase()}
                          </Tag>
                          <Text style={{ fontSize: '12px' }}>
                            {new Date(mail.sentDate).toLocaleString()}
                          </Text>
                        </div>
                        <Badge status={mail.emailStatus === 'sent' ? 'success' : 'error'} 
                               text={mail.emailStatus} />
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SelectedCandidatesPage;