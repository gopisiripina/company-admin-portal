import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  DatePicker, 
  TimePicker,
  message,
  Card,
  Row,
  Col,
  Divider,
  Badge,
  Tooltip,
  Typography
} from 'antd';
import { 
  SearchOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

// Dummy data for interview candidates
const dummyInterviewData = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-234-567-8900',
    jobTitle: 'React Developer',
    appliedDate: '2024-01-15',
    interviewType: 'Technical',
    interviewStatus: 'Scheduled',
    interviewDate: '2024-01-20',
    interviewTime: '10:00 AM',
    interviewer: 'Sarah Johnson',
    outcome: null,
    experience: '3 years',
    currentRound: 'Technical',
    roundsCompleted: []
  },
  {
    id: 2,
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1-234-567-8901',
    jobTitle: 'Full Stack Developer',
    appliedDate: '2024-01-12',
    interviewType: 'Technical',
    interviewStatus: 'Completed',
    interviewDate: '2024-01-18',
    interviewTime: '2:00 PM',
    interviewer: 'Mike Wilson',
    outcome: 'Selected',
    experience: '5 years',
    currentRound: 'HR',
    roundsCompleted: ['Technical']
  },
  {
    id: 3,
    name: 'Robert Johnson',
    email: 'robert.johnson@email.com',
    phone: '+1-234-567-8902',
    jobTitle: 'Node.js Developer',
    appliedDate: '2024-01-10',
    interviewType: 'HR',
    interviewStatus: 'Completed',
    interviewDate: '2024-01-17',
    interviewTime: '11:30 AM',
    interviewer: 'Lisa Brown',
    outcome: 'Selected',
    experience: '4 years',
    currentRound: 'Final',
    roundsCompleted: ['Technical', 'HR']
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    phone: '+1-234-567-8903',
    jobTitle: 'Frontend Developer',
    appliedDate: '2024-01-14',
    interviewType: 'Technical',
    interviewStatus: 'Completed',
    interviewDate: '2024-01-19',
    interviewTime: '3:30 PM',
    interviewer: 'David Lee',
    outcome: 'Rejected',
    experience: '2 years',
    currentRound: 'Technical',
    roundsCompleted: []
  },
  {
    id: 5,
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '+1-234-567-8904',
    jobTitle: 'React Developer',
    appliedDate: '2024-01-13',
    interviewType: 'HR',
    interviewStatus: 'Scheduled',
    interviewDate: '2024-01-22',
    interviewTime: '1:00 PM',
    interviewer: 'Jennifer Taylor',
    outcome: null,
    experience: '6 years',
    currentRound: 'HR',
    roundsCompleted: ['Technical']
  }
];

const InterviewPage = () => {
  const [interviewData, setInterviewData] = useState(dummyInterviewData);
  const [filteredData, setFilteredData] = useState(dummyInterviewData);
  const [searchText, setSearchText] = useState('');
  const [filterJobTitle, setFilterJobTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterRound, setFilterRound] = useState('');
  
  // Modal states
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [scheduleForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  // Filter data based on search and filters
  const applyFilters = () => {
    let filtered = interviewData;

    if (searchText) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterJobTitle) {
      filtered = filtered.filter(item => item.jobTitle === filterJobTitle);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.interviewStatus === filterStatus);
    }

    if (filterOutcome) {
      filtered = filtered.filter(item => item.outcome === filterOutcome);
    }

    if (filterRound) {
      filtered = filtered.filter(item => item.currentRound === filterRound);
    }

    setFilteredData(filtered);
  };

  React.useEffect(() => {
    applyFilters();
  }, [searchText, filterJobTitle, filterStatus, filterOutcome, filterRound, interviewData]);

  // Get unique job titles for filter
  const jobTitles = [...new Set(interviewData.map(item => item.jobTitle))];

  // Handle interview outcome
  const handleOutcome = (candidateId, outcome) => {
    const updatedData = interviewData.map(item => {
      if (item.id === candidateId) {
        const updatedItem = { ...item, outcome, interviewStatus: 'Completed' };
        
        // If technical round is selected, move to HR round
        if (outcome === 'Selected' && item.currentRound === 'Technical') {
          updatedItem.currentRound = 'HR';
          updatedItem.roundsCompleted = [...item.roundsCompleted, 'Technical'];
          updatedItem.interviewStatus = 'Scheduled'; // Reset for HR round
          updatedItem.outcome = null; // Reset outcome for HR round
        }
        // If HR round is selected, move to final
        else if (outcome === 'Selected' && item.currentRound === 'HR') {
          updatedItem.currentRound = 'Final';
          updatedItem.roundsCompleted = [...item.roundsCompleted, 'HR'];
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setInterviewData(updatedData);
    
    if (outcome === 'Selected') {
      message.success(`Candidate selected for ${updatedData.find(item => item.id === candidateId)?.currentRound === 'Final' ? 'final selection' : 'next round'}!`);
    } else {
      message.info('Candidate marked as rejected');
    }
  };

  // Handle reject with email
  const handleRejectWithEmail = (candidate) => {
    setSelectedCandidate(candidate);
    setIsRejectModalVisible(true);
  };

  // Handle schedule interview
  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate);
    setIsScheduleModalVisible(true);
  };

  // Handle view candidate details
  const handleViewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setIsViewModalVisible(true);
  };

  // Send rejection email
  const sendRejectionEmail = () => {
    rejectForm.validateFields().then(values => {
      console.log('Sending rejection email:', {
        candidate: selectedCandidate,
        message: values.message
      });
      
      // Update candidate status
      handleOutcome(selectedCandidate.id, 'Rejected');
      
      message.success('Rejection email sent successfully!');
      setIsRejectModalVisible(false);
      rejectForm.resetFields();
    });
  };

  // Schedule interview
  const scheduleInterview = () => {
    scheduleForm.validateFields().then(values => {
      console.log('Scheduling interview:', {
        candidate: selectedCandidate,
        ...values
      });
      
      // Update interview data
      const updatedData = interviewData.map(item => {
        if (item.id === selectedCandidate.id) {
          return {
            ...item,
            interviewDate: values.date.format('YYYY-MM-DD'),
            interviewTime: values.time.format('HH:mm A'),
            interviewer: values.interviewer,
            interviewStatus: 'Scheduled'
          };
        }
        return item;
      });
      
      setInterviewData(updatedData);
      message.success('Interview scheduled successfully!');
      setIsScheduleModalVisible(false);
      scheduleForm.resetFields();
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'blue';
      case 'Completed': return 'green';
      case 'Cancelled': return 'red';
      default: return 'default';
    }
  };

  // Get outcome color
  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'Selected': return 'success';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  // Get round color
  const getRoundColor = (round) => {
    switch (round) {
      case 'Technical': return 'blue';
      case 'HR': return 'orange';
      case 'Final': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.email}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Job Title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience',
    },
    {
      title: 'Current Round',
      dataIndex: 'currentRound',
      key: 'currentRound',
      render: (round) => <Tag color={getRoundColor(round)}>{round}</Tag>
    },
    {
      title: 'Interview Details',
      key: 'interviewDetails',
      render: (_, record) => (
        <div>
          <div><CalendarOutlined /> {record.interviewDate}</div>
          <div><ClockCircleOutlined /> {record.interviewTime}</div>
          <div><UserOutlined /> {record.interviewer}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'interviewStatus',
      key: 'interviewStatus',
      render: (status) => (
        <Badge 
          status={status === 'Completed' ? 'success' : status === 'Scheduled' ? 'processing' : 'default'} 
          text={status} 
        />
      )
    },
    {
      title: 'Outcome',
      dataIndex: 'outcome',
      key: 'outcome',
      render: (outcome) => {
        if (!outcome) return <Tag color="default">Pending</Tag>;
        return <Tag color={getOutcomeColor(outcome)}>{outcome}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewCandidate(record)}
            />
          </Tooltip>
          
          {record.interviewStatus === 'Scheduled' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleScheduleInterview(record)}
            >
              Reschedule
            </Button>
          )}
          
          {record.interviewStatus === 'Completed' && !record.outcome && (
            <>
              <Button 
                type="primary" 
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleOutcome(record.id, 'Selected')}
              >
                Select
              </Button>
              <Button 
                danger 
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectWithEmail(record)}
              >
                Reject
              </Button>
            </>
          )}
          
          {record.interviewStatus === 'Scheduled' && (
            <Button 
              type="default" 
              size="small"
              icon={<MailOutlined />}
            >
              Send Mail
            </Button>
          )}
        </Space>
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

      <Title level={2}>Interview Management</Title>
      
      {/* Filter Panel */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search by name or email"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Job Title"
              value={filterJobTitle}
              onChange={setFilterJobTitle}
              allowClear
              style={{ width: '100%' }}
            >
              {jobTitles.map(title => (
                <Option key={title} value={title}>{title}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="Scheduled">Scheduled</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Round"
              value={filterRound}
              onChange={setFilterRound}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="Technical">Technical</Option>
              <Option value="HR">HR</Option>
              <Option value="Final">Final</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Outcome"
              value={filterOutcome}
              onChange={setFilterOutcome}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="Selected">Selected</Option>
              <Option value="Rejected">Rejected</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Interview Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Schedule Interview Modal */}
      <Modal
        title="Schedule Interview"
        open={isScheduleModalVisible}
        onOk={scheduleInterview}
        onCancel={() => setIsScheduleModalVisible(false)}
        width={600}
      >
        <Form form={scheduleForm} layout="vertical">
          <Form.Item label="Candidate" name="candidate">
            <Input value={selectedCandidate?.name} disabled />
          </Form.Item>
          <Form.Item 
            label="Interview Date" 
            name="date" 
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item 
            label="Interview Time" 
            name="time" 
            rules={[{ required: true, message: 'Please select time' }]}
          >
            <TimePicker use12Hours format="h:mm A" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item 
            label="Interviewer" 
            name="interviewer" 
            rules={[{ required: true, message: 'Please enter interviewer name' }]}
          >
            <Input placeholder="Enter interviewer name" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Send Rejection Email"
        open={isRejectModalVisible}
        onOk={sendRejectionEmail}
        onCancel={() => setIsRejectModalVisible(false)}
        width={600}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item label="Candidate">
            <Input value={`${selectedCandidate?.name} (${selectedCandidate?.email})`} disabled />
          </Form.Item>
          <Form.Item 
            label="Rejection Message" 
            name="message" 
            rules={[{ required: true, message: 'Please enter rejection message' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="Enter rejection message..."
              defaultValue="Thank you for your interest in our company. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs. We appreciate the time you invested in the interview process and wish you the best in your job search."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Candidate Modal */}
      <Modal
        title="Candidate Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedCandidate && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>Name:</strong> {selectedCandidate.name}
              </Col>
              <Col span={12}>
                <strong>Email:</strong> {selectedCandidate.email}
              </Col>
              <Col span={12}>
                <strong>Phone:</strong> {selectedCandidate.phone}
              </Col>
              <Col span={12}>
                <strong>Job Title:</strong> {selectedCandidate.jobTitle}
              </Col>
              <Col span={12}>
                <strong>Experience:</strong> {selectedCandidate.experience}
              </Col>
              <Col span={12}>
                <strong>Applied Date:</strong> {selectedCandidate.appliedDate}
              </Col>
              <Col span={12}>
                <strong>Current Round:</strong> 
                <Tag color={getRoundColor(selectedCandidate.currentRound)} style={{ marginLeft: 8 }}>
                  {selectedCandidate.currentRound}
                </Tag>
              </Col>
              <Col span={12}>
                <strong>Interview Status:</strong> 
                <Badge 
                  status={selectedCandidate.interviewStatus === 'Completed' ? 'success' : 'processing'} 
                  text={selectedCandidate.interviewStatus}
                  style={{ marginLeft: 8 }}
                />
              </Col>
              <Col span={24}>
                <strong>Rounds Completed:</strong>
                <div style={{ marginTop: 8 }}>
                  {selectedCandidate.roundsCompleted.length > 0 ? (
                    selectedCandidate.roundsCompleted.map(round => (
                      <Tag key={round} color="green" style={{ marginRight: 8 }}>
                        ✓ {round}
                      </Tag>
                    ))
                  ) : (
                    <span style={{ color: '#666' }}>No rounds completed yet</span>
                  )}
                </div>
              </Col>
              <Col span={24}>
                <Divider />
                <strong>Interview Details:</strong>
                <div style={{ marginTop: 12, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <CalendarOutlined /> <strong>Date:</strong> {selectedCandidate.interviewDate}
                    </Col>
                    <Col span={12}>
                      <ClockCircleOutlined /> <strong>Time:</strong> {selectedCandidate.interviewTime}
                    </Col>
                    <Col span={12}>
                      <UserOutlined /> <strong>Interviewer:</strong> {selectedCandidate.interviewer}
                    </Col>
                    <Col span={12}>
                      <strong>Outcome:</strong> {selectedCandidate.outcome ? (
                        <Tag color={getOutcomeColor(selectedCandidate.outcome)}>
                          {selectedCandidate.outcome}
                        </Tag>
                      ) : (
                        <Tag color="default">Pending</Tag>
                      )}
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewPage;