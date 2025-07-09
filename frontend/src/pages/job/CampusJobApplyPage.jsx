import React, { useState, useEffect ,useMemo } from 'react';
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
const [examSelectionVisible, setExamSelectionVisible] = useState(false);
const [availableExams, setAvailableExams] = useState([]);
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
  const EMAIL_SERVICE_ID = 'service_gtd1otu'; // Replace with your EmailJS service ID
const EMAIL_TEMPLATE_ID = 'template_lqcrq8c'; // Replace with your EmailJS template ID
const EMAIL_PUBLIC_KEY = 'NYTlY5dQBnWRdlpKn';

  // Get unique job IDs and college names for filters
  const uniqueJobIds = useMemo(() => {
  return [...new Set(applications.map(app => app.jobId))].filter(Boolean);
}, [applications]);

const uniqueColleges = useMemo(() => {
  return [...new Set(applications.map(app => app.collegeName))].filter(Boolean);
}, [applications]);

  // Check for exam link data from sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('exam');
    const jobId = urlParams.get('job');
    const college = urlParams.get('college');

    if (examId) {
      setJobFilter(jobId || 'all');
      setCollegeFilter(college || 'all');
    }

    // Check sessionStorage for exam link data
    const storedExamData = sessionStorage.getItem('examLinkData');
    if (storedExamData) {
      const examData = JSON.parse(storedExamData);
      setExamLinkData(examData);
      setJobFilter(examData.jobId || 'all');
      setCollegeFilter(examData.college || 'all');
      
      // Show notification
      message.info({
        content: `Exam link copied! Ready to send "${examData.examTitle}" to students.`,
        duration: 5
      });
    }
  }, []);

  // Fetch all campus job applications
// Updated fetchApplications function to use campus_job_applications table
const fetchApplications = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('campus_job_applications')  // Changed from 'campus_management'
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
      collegeName: app.college_name,  // Updated field name
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

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, jobFilter, collegeFilter, applications]);

  // Handle student selection
  const handleStudentSelection = (studentIds) => {
    setSelectedStudents(studentIds);
  };
const handleSendExamLink = async () => {
  if (selectedStudents.length === 0) {
    message.error('Please select at least one student');
    return;
  }

  // Get unique job IDs and colleges from selected students
  const selectedApps = applications.filter(app => selectedStudents.includes(app.id));
  const uniqueJobIds = [...new Set(selectedApps.map(app => app.jobId))];
  const uniqueColleges = [...new Set(selectedApps.map(app => app.collegeName))];

  if (uniqueJobIds.length > 1 || uniqueColleges.length > 1) {
    message.error('Please select students from the same job and college');
    return;
  }

  // Fetch available exams for this job and college
  const exams = await fetchAvailableExams(uniqueJobIds[0], uniqueColleges[0]);
  
  if (exams.length === 0) {
    message.error('No exams available for this job and college combination');
    return;
  }

  setAvailableExams(exams);
  setExamSelectionVisible(true);
};
const fetchAvailableExams = async (jobId, college) => {
  try {
    const { data, error } = await supabase
      .from('campus_management')
      .select('*')
      .eq('type', 'exam')
      .eq('job_id', jobId)
      .eq('college', college)
      .eq('status', 'Draft');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching exams:', error);
    return [];
  }
};
const handleExamSelection = (examId) => {
  const selectedExam = availableExams.find(exam => exam.id === examId);
  
  if (selectedExam) {
    setExamLinkData({
      examId: selectedExam.id,
      examTitle: selectedExam.exam_title,
      jobId: selectedExam.job_id,
      college: selectedExam.college,
      examLink: selectedExam.exam_link
    });
    
    setExamSelectionVisible(false);
    setEmailModalVisible(true);
  }
};
// 5. Update sendExamEmails function with EmailJS integration
const sendExamEmails = async (values) => {
  if (!examLinkData) {
    message.error('No exam link data found. Please generate exam link first.');
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

    // Create email invitations records in single table
    const invitations = studentsToEmail.map(student => ({
      type: 'exam_invitation',
      exam_id: examLinkData.examId,
      student_email: student.email,
      student_name: student.studentName,
      job_id: student.jobId,
      college: student.collegeName,
      status: 'sent'
    }));

    const { error: inviteError } = await supabase
      .from('campus_management')
      .insert(invitations);

    if (inviteError) throw inviteError;

    // Update exam students_invited count
    const { error: updateError } = await supabase
      .from('campus_management')
      .update({ 
        students_invited: invitations.length,
        status: 'Active'
      })
      .eq('id', examLinkData.examId)
      .eq('type', 'exam');

    if (updateError) throw updateError;

    // Send emails using EmailJS
    const emailPromises = studentsToEmail.map(student => {
      const templateParams = {
        to_name: student.studentName,
        to_email: student.email,
        subject: values.subject,
        exam_title: examLinkData.examTitle,
        job_id: examLinkData.jobId,
        college: examLinkData.college,
        exam_link: examLinkData.examLink,
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
    emailForm.resetFields();
    
    // Clear exam link data
    sessionStorage.removeItem('examLinkData');
    setExamLinkData(null);

  } catch (error) {
    console.error('Error sending emails:', error);
    message.error('Failed to send exam emails');
  } finally {
    setSendingEmails(false);
  }
};


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

  // Show exam link notification if coming from exam conduct page
  useEffect(() => {
    const storedExamData = sessionStorage.getItem('examLinkData');
    if (storedExamData) {
      const examData = JSON.parse(storedExamData);
      message.info({
        content: `Exam link ready! You can now send "${examData.examTitle}" to selected students.`,
        duration: 5
      });
    }
  }, []);

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

      {/* Exam Link Alert */}
      {examLinkData && (
        <Alert
          message={`Exam Ready: ${examLinkData.examTitle}`}
          description={`You can now send the exam link to students for Job ID: ${examLinkData.jobId} at ${examLinkData.college}`}
          type="success"
          showIcon
          icon={<LinkOutlined />}
          style={{ marginBottom: '24px' }}
          action={
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={() => setEmailModalVisible(true)}
            >
              Send to Students
            </Button>
          }
        />
      )}

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
                  onClick={() => setEmailModalVisible(true)}
                  disabled={!examLinkData}
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
                <Text><strong>Exam:</strong> {examLinkData?.examTitle}</Text><br />
                <Text><strong>Job ID:</strong> {examLinkData?.jobId}</Text><br />
                <Text><strong>College:</strong> {examLinkData?.college}</Text><br />
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
            initialValue={`Exam Invitation - ${examLinkData?.examTitle}`}
            rules={[{ required: true, message: 'Please enter email subject' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email Content"
            name="message"
            initialValue={`Dear Student,

You are invited to take the ${examLinkData?.examTitle} exam for Job ID: ${examLinkData?.jobId}.

Click the link below to start your exam:
${examLinkData?.examLink}

Please note:
- Make sure you have a stable internet connection
- Complete the exam in the given time limit
- Do not refresh the page during the exam

Best regards,
HR Team`}
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