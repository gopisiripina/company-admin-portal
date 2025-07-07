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
  BankOutlined, IdcardOutlined, HomeOutlined, ContactsOutlined
} from '@ant-design/icons';
import emailjs from '@emailjs/browser';
import ErrorPage from '../../error/ErrorPage';
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Supabase configuration
import { supabase} from '../../supabase/config';

// EmailJS configuration - Replace with your actual values
const EMAIL_CONFIG = {
  serviceId: 'service_gtd1otu',
  templateId: 'template_qlck5w9', 
  publicKey: 'NYTlY5dQBnWRdlpKn'
};

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
  
  // Modal states
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

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

    const result = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      emailParams,
      EMAIL_CONFIG.publicKey
    );

    console.log('EmailJS result:', result);

    if (result.status === 200 || result.text === 'OK') {
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

  const columns = [
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
          <TrophyOutlined /> Selected Candidates
        </Title>
        <Text type="secondary">
          Manage selected candidates and send offer letters
        </Text>
      </div>

      {/* Statistics Cards */}
<Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}> {/* Added responsive breakpoints */}
    <Card>
      <Statistic
        title="Total Selected"
        value={candidates.length}
        prefix={<TeamOutlined />}
        valueStyle={{ color: '#3f8600' }}
      />
    </Card>
  </Col>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}>
    <Card>
      <Statistic
        title="Offers Sent"
        value={candidates.filter(c => c.offerSent).length}
        prefix={<SendOutlined />}
        valueStyle={{ color: '#1890ff' }}
      />
    </Card>
  </Col>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}>
    <Card>
      <Statistic
        title="Pending Offers"
        value={candidates.filter(c => !c.offerSent).length}
        prefix={<ClockCircleOutlined />}
        valueStyle={{ color: '#cf1322' }}
      />
    </Card>
  </Col>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}>
    <Card>
      <Statistic
        title="Completion Rate"
        value={candidates.length > 0 ? Math.round((candidates.filter(c => c.offerSent).length / candidates.length) * 100) : 0}
        suffix="%"
        prefix={<CheckCircleOutlined />}
        valueStyle={{ color: '#722ed1' }}
      />
    </Card>
  </Col>
</Row>

      {/* Filters */}
<Card style={{ marginBottom: '24px' }}>
  <Row gutter={[12, 12]}> {/* Reduced from [16, 16] */}
    <Col xs={24} sm={12} md={6} lg={6} xl={6}> {/* Made responsive */}
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
  columns={columns}
  dataSource={filteredCandidates}
  rowKey="id"
  loading={loading}
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) =>
      `${range[0]}-${range[1]} of ${total} candidates`,
  }}
  scroll={{ x: 900 }} // Reduced from 1200
  size="small" // Add this for more compact table
/>
      </Card>

      {/* Candidate Details Modal */}
      <Modal
        title={selectedCandidate ? `${selectedCandidate.name} - Candidate Details` : 'Candidate Details'}
        open={candidateModalVisible}
        onCancel={() => setCandidateModalVisible(false)}
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
        width={900}
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

      {/* History Drawer */}
      <Drawer
        title={selectedCandidate ? `${selectedCandidate.name} - Complete History` : 'Complete History'}
        placement="right"
        open={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
        width={600}
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