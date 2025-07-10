import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  Card, 
  Select, 
  Input, 
  Button, 
  Space, 
  Modal, 
  Row, 
  Col, 
  Typography, 
  message, 
  Spin, 
  Alert,
  Form,
  Checkbox,
  Tag,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  DownloadOutlined, 
  UserOutlined, 
  ReloadOutlined, 
  CalendarOutlined,
  MailOutlined,
  LinkOutlined,
  SendOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import ErrorPage from '../../error/ErrorPage';
import { supabase } from '../../supabase/config';
import emailjs from '@emailjs/browser';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const CampusJobApplyPage = ({ userRole }) => {
  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'hr') {
    return <ErrorPage errorType="403" />;
  }

  // State variables
  const [availableExams, setAvailableExams] = useState([]);
  const [examSelectionVisible, setExamSelectionVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [examLinkData, setExamLinkData] = useState(null);
  const [emailForm] = Form.useForm();
  const [sendingEmails, setSendingEmails] = useState(false);

  const EMAIL_SERVICE_ID = 'service_gtd1otu';
  const EMAIL_TEMPLATE_ID = 'template_lqcrq8c';
  const EMAIL_PUBLIC_KEY = 'NYTlY5dQBnWRdlpKn';

  // Get unique job IDs and college names for filters
  const uniqueJobIds = useMemo(() => {
    return [...new Set(applications.map(app => app.jobId))].filter(Boolean);
  }, [applications]);

  const uniqueColleges = useMemo(() => {
    return [...new Set(applications.map(app => app.collegeName))].filter(Boolean);
  }, [applications]);

  // Updated useEffect - removed sessionStorage usage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job');
    const college = urlParams.get('college');
    const examId = urlParams.get('examId');

    if (jobId) {
      setJobFilter(jobId);
    }
    if (college) {
      setCollegeFilter(college);
    }
    
    // If examId is provided, highlight it but don't auto-select
    if (examId) {
      console.log('Exam ID from URL:', examId);
    }
  }, []);

  // Fetch all campus job applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campus_job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data.map(app => ({
        id: app.id,
        linkId: app.link_id,
        jobId: app.job_id,
        studentName: app.student_name,
        email: app.email,
        mobile: app.mobile,
        resumeUrl: app.resume_url,
        collegeName: app.college_name,
        appliedDate: app.created_at ? new Date(app.created_at).toISOString().split('T')[0] : '',
        appliedTime: app.created_at ? new Date(app.created_at).toLocaleString() : ''
      }));

      setApplications(transformedData);
      setFilteredApplications(transformedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...applications];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(app =>
        app.studentName?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.mobile?.includes(searchText) ||
        app.jobId?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.collegeName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Job filter
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.jobId === jobFilter);
    }

    // College filter
    if (collegeFilter !== 'all') {
      filtered = filtered.filter(app => app.collegeName === collegeFilter);
    }

    setFilteredApplications(filtered);
  };

  // Handle select all functionality
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = filteredApplications.map(app => app.id);
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents([]);
    }
  };

  // Fetch available exams
// Fetch available exams - Updated to show all active exams
// Updated fetchAvailableExams function
const fetchAvailableExams = async () => {
  try {
    console.log('Fetching available exams...');
    
    const { data, error } = await supabase
      .from('campus_management')
      .select('*')
      .eq('type', 'exam')
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Raw exam data from database:', data);
    
    // Transform the data to match expected format
    const transformedExams = data?.map(exam => ({
      id: exam.id,
      exam_title: exam.exam_title,
      job_id: exam.job_id,
      college: exam.college || exam.college_name, // Handle both field names
      total_questions: exam.total_questions,
      duration: exam.duration,
      exam_link: exam.exam_link,
      students_invited: exam.students_invited || 0,
      status: exam.status,
      created_at: exam.created_at
    })) || [];
    
    console.log('Transformed exam data:', transformedExams);
    console.log('Number of exams found:', transformedExams.length);
    
    return transformedExams;
  } catch (error) {
    console.error('Error fetching exams:', error);
    message.error('Failed to fetch exams: ' + error.message);
    return [];
  }
};
  // Updated handleSendExamLink function
// Updated handleSendExamLink function
const handleSendExamLink = async () => {
  if (selectedStudents.length === 0) {
    message.error('Please select at least one student');
    return;
  }

  // Fetch all available exams (no filtering by job/college)
  const exams = await fetchAvailableExams();
  
  if (exams.length === 0) {
    message.error('No active exams found. Please create an exam first.');
    return;
  }

  setAvailableExams(exams);
  setExamSelectionVisible(true);
};
  // Handle exam selection
  const handleExamSelection = (examId) => {
    const exam = availableExams.find(e => e.id === examId);
    setSelectedExam(exam);
    setExamSelectionVisible(false);
    
    // Pre-fill email form with exam details
    emailForm.setFieldsValue({
      subject: `Exam Invitation: ${exam.exam_title}`,
      message: `Dear Student,

You are invited to take the following exam:

Exam Title: ${exam.exam_title}
Job ID: ${exam.job_id}
Duration: ${exam.duration} minutes
Total Questions: ${exam.total_questions}

Please click the link below to start your exam:
${exam.exam_link}

Important Instructions:
- Make sure you have a stable internet connection
- Do not refresh the page during the exam
- Complete the exam within the given time limit

Best regards,
HR Team`
    });
    
    setEmailModalVisible(true);
  };

  // Updated sendExamEmails function
  const sendExamEmails = async (values) => {
    if (!selectedExam) {
      message.error('No exam selected. Please select an exam first.');
      return;
    }

    if (selectedStudents.length === 0) {
      message.error('Please select at least one student');
      return;
    }

    setSendingEmails(true);
    try {
      const studentsToEmail = applications.filter(app => 
        selectedStudents.includes(app.id)
      );

      // Create email invitations records
      const now = new Date().toISOString();
      const invitations = studentsToEmail.map(student => ({
        type: 'exam_invitation',
        exam_id: selectedExam.id,
        student_email: student.email,
        student_name: student.studentName,
        job_id: student.jobId,
        college: student.collegeName,
        status: 'sent',
        created_at: now
      }));

      const { error: inviteError } = await supabase
        .from('campus_management')
        .insert(invitations);

      if (inviteError) throw inviteError;

      // Update exam students_invited count
      const { data: currentExam, error: fetchError } = await supabase
        .from('campus_management')
        .select('students_invited')
        .eq('id', selectedExam.id)
        .single();

      if (fetchError) throw fetchError;

      const newCount = (currentExam?.students_invited || 0) + invitations.length;

      const { error: updateError } = await supabase
        .from('campus_management')
        .update({ 
          students_invited: newCount
        })
        .eq('id', selectedExam.id)
        .eq('type', 'exam');

      if (updateError) throw updateError;

      // Send emails using EmailJS
      const emailPromises = studentsToEmail.map(student => {
        const templateParams = {
          to_name: student.studentName,
          to_email: student.email,
          subject: values.subject,
          exam_title: selectedExam.exam_title,
          job_id: selectedExam.job_id,
          college: selectedExam.college,
          exam_link: selectedExam.exam_link,
          message: values.message
        };

        return emailjs.send(
          EMAIL_SERVICE_ID,
          EMAIL_TEMPLATE_ID,
          templateParams,
          EMAIL_PUBLIC_KEY
        );
      });

      await Promise.all(emailPromises);

      message.success(`Exam links sent to ${studentsToEmail.length} students successfully!`);
      setEmailModalVisible(false);
      setSelectedStudents([]);
      setSelectedExam(null); // Reset exam selection for next send
      emailForm.resetFields();

    } catch (error) {
      console.error('Error sending emails:', error);
      message.error('Failed to send exam emails');
    } finally {
      setSendingEmails(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, jobFilter, collegeFilter, applications]);

  // Table columns
  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedStudents.length === filteredApplications.length && filteredApplications.length > 0}
          indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredApplications.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Select All
        </Checkbox>
      ),
      key: 'select',
      width: 100,
      render: (_, record) => (
        <Checkbox
          checked={selectedStudents.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedStudents([...selectedStudents, record.id]);
            } else {
              setSelectedStudents(selectedStudents.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: 'Student Name',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 180,
      render: (name) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong>{name || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => (
        <Text>{email || 'N/A'}</Text>
      ),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 120,
      render: (mobile) => (
        <Text>{mobile || 'N/A'}</Text>
      ),
    },
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      width: 100,
      render: (jobId) => (
        <Text style={{ fontSize: '12px' }}>{jobId || 'N/A'}</Text>
      ),
    },
    {
      title: 'College',
      dataIndex: 'collegeName',
      key: 'collegeName',
      width: 200,
      render: (college) => (
        <Text style={{ fontSize: '12px' }}>{college || 'N/A'}</Text>
      ),
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      width: 120,
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: '12px' }}>
            {date ? new Date(date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }) : 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedApplication(record);
              setDetailsModalVisible(true);
            }}
          />
          {record.resumeUrl && (
            <Button 
              type="text" 
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => window.open(record.resumeUrl, '_blank')}
            />
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        padding: '24px',
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
      maxWidth: '100%',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          Campus Job Applications
        </Title>
        <Text type="secondary">
          View and manage campus recruitment applications
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Search</Text>
            </div>
            <Input
              placeholder="Search by name, email, mobile, job ID, or college"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Job ID</Text>
            </div>
            <Select
              value={jobFilter}
              onChange={setJobFilter}
              style={{ width: '100%' }}
              placeholder="Filter by Job ID"
            >
              <Option value="all">All Jobs</Option>
              {uniqueJobIds.map(jobId => (
                <Option key={jobId} value={jobId}>{jobId}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>College</Text>
            </div>
            <Select
              value={collegeFilter}
              onChange={setCollegeFilter}
              style={{ width: '100%' }}
              placeholder="Filter by College"
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">All Colleges</Option>
              {uniqueColleges.map(college => (
                <Option key={college} value={college}>{college}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Actions</Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchApplications}
                loading={loading}
              >
                Refresh
              </Button>
              <div>
                <Text strong>{filteredApplications.length}</Text>
                <Text type="secondary"> applications</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <Card style={{ marginBottom: '24px', backgroundColor: '#f6ffed' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>{selectedStudents.length} students selected</Text>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<MailOutlined />}
                  onClick={handleSendExamLink}
                >
                  Send Exam Link
                </Button>
                <Button
                  onClick={() => setSelectedStudents([])}
                >
                  Clear Selection
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Show message if no applications found */}
      {applications.length === 0 && (
        <Alert
          message="No Campus Applications Found"
          description="No campus job applications have been submitted yet. Applications will appear here once students start applying."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Applications Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredApplications}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} applications`,
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>

      {/* Exam Selection Modal */}
      <Modal
        title="Select Exam to Send"
        open={examSelectionVisible}
        onCancel={() => setExamSelectionVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text><strong>Selected Students:</strong> {selectedStudents.length}</Text>
          <br />
          <Text><strong>Job ID:</strong> {applications.find(app => selectedStudents.includes(app.id))?.jobId}</Text>
          <br />
          <Text><strong>College:</strong> {applications.find(app => selectedStudents.includes(app.id))?.collegeName}</Text>
        </div>
        
        <Divider />
        
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Available Exams:</Text>
        </div>
        
{availableExams.map(exam => (
  <Card 
    key={exam.id} 
    style={{ marginBottom: '12px', cursor: 'pointer' }}
    hoverable
    onClick={() => handleExamSelection(exam.id)}
  >
    <Row justify="space-between" align="middle">
      <Col span={16}>
        <div>
          <Text strong>{exam.exam_title}</Text>
          <br />
          <Text type="secondary">
            Job ID: {exam.job_id} • College: {exam.college || exam.college_name || 'Not specified'}
          </Text>
          <br />
          <Text type="secondary">
            {exam.total_questions} questions • {exam.duration} minutes
          </Text>
          <br />
          <Tag color="green">Active</Tag>
          <Tag color="blue">Invited: {exam.students_invited || 0}</Tag>
        </div>
      </Col>
      <Col span={8} style={{ textAlign: 'right' }}>
        <Button type="primary">
          Select This Exam
        </Button>
      </Col>
    </Row>
  </Card>
))}
        
        {availableExams.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="secondary">No exams available for this job and college combination</Text>
          </div>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal
        title="Send Exam Link to Students"
        open={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={emailForm} onFinish={sendExamEmails} layout="vertical">
          <Alert
            message="Exam Details"
            description={
              <div>
                <Text><strong>Exam:</strong> {selectedExam?.exam_title}</Text><br />
                <Text><strong>Job ID:</strong> {selectedExam?.job_id}</Text><br />
                <Text><strong>College:</strong> {selectedExam?.college}</Text><br />
                <Text><strong>Selected Students:</strong> {selectedStudents.length}</Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            label="Email Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter email subject' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email Content"
            name="message"
            rules={[{ required: true, message: 'Please enter email content' }]}
          >
            <TextArea rows={8} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={sendingEmails}
                icon={<SendOutlined />}
              >
                Send Exam Links ({selectedStudents.length} students)
              </Button>
              <Button onClick={() => setEmailModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Application Details Modal */}
      <Modal
        title={selectedApplication ? `${selectedApplication.studentName} - Application Details` : 'Application Details'}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          selectedApplication?.resumeUrl && (
            <Button 
              key="download" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => window.open(selectedApplication.resumeUrl, '_blank')}
            >
              Download Resume
            </Button>
          )
        ]}
        width={700}
      >
        {selectedApplication && (
          <div>
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Student Name:</Text>
                    <br />
                    <Text>{selectedApplication.studentName || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Email:</Text>
                    <br />
                    <Text copyable>{selectedApplication.email || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Mobile:</Text>
                    <br />
                    <Text copyable>{selectedApplication.mobile || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Job ID:</Text>
                    <br />
                    <Text>{selectedApplication.jobId || 'N/A'}</Text>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>College Name:</Text>
                    <br />
                    <Text>{selectedApplication.collegeName || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Link ID:</Text>
                    <br />
                    <Text>{selectedApplication.linkId || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Applied Date & Time:</Text>
                    <br />
                    <Text>{selectedApplication.appliedTime || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Resume:</Text>
                    <br />
                    {selectedApplication.resumeUrl ? (
                      <Button 
                        type="link" 
                        icon={<DownloadOutlined />}
                        onClick={() => window.open(selectedApplication.resumeUrl, '_blank')}
                      >
                        Download Resume
                      </Button>
                    ) : (
                      <Text type="secondary">No resume uploaded</Text>
                    )}
                  </div>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CampusJobApplyPage;