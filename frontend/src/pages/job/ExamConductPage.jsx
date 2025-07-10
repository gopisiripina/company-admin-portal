import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  Form, 
  Input, 
  Select, 
  Space, 
  Table, 
  Modal, 
  message, 
  Typography, 
  Row, 
  Col,
  Alert,
  Divider,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  LinkOutlined, 
  SendOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  MailOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabase/config';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ExamConductPage = ({ userRole }) => {
  const [form] = Form.useForm();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createExamVisible, setCreateExamVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questionFile, setQuestionFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [jobIds, setJobIds] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [applications, setApplications] = useState([]);

  // Fetch unique job IDs and colleges from applications
// Updated fetchJobsAndColleges function to use campus_job_applications table
const fetchJobsAndColleges = async () => {
  try {
    const { data, error } = await supabase
      .from('campus_job_applications')  // Changed from 'campus_management'
      .select('job_id, college_name, student_name, email, mobile, resume_url, created_at, link_id');  // Removed type filter

    if (error) throw error;

    const uniqueJobIds = [...new Set(data.map(app => app.job_id))].filter(Boolean);
    const uniqueColleges = [...new Set(data.map(app => app.college_name))].filter(Boolean);

    setJobIds(uniqueJobIds);
    setColleges(uniqueColleges);
    setApplications(data);
  } catch (error) {
    console.error('Error fetching jobs and colleges:', error);
    message.error('Failed to load job IDs and colleges');
  }
};

  // Fetch exams from database
 const fetchExams = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('campus_management')
      .select('*')
      .eq('type', 'exam')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setExams(data || []);
  } catch (error) {
    console.error('Error fetching exams:', error);
    message.error('Failed to load exams');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchJobsAndColleges();
    fetchExams();
  }, []);

  // Generate unique exam link
  const generateExamLink = () => {
    const linkId = Math.random().toString(36).substr(2, 12);
    return `${window.location.origin}/exam/take/${linkId}`;
  };

  // Upload file to Supabase storage
  const uploadFile = async (file, folder) => {
  try {
    console.log('Starting file upload:', file.name, 'to folder:', folder);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('File path:', filePath);

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('exam-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    console.log('Upload response:', { data, error });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exam-documents')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};


  // Create exam
const handleCreateExam = async (values) => {
  if (!questionFile || !answerFile) {
    message.error('Please upload both question and answer files');
    return;
  }

  setLoading(true);
  try {
    // Upload files
    const [questionUrl, answerUrl] = await Promise.all([
      uploadFile(questionFile, 'questions'),
      uploadFile(answerFile, 'answers')
    ]);

    // Generate exam link
    const examLink = generateExamLink();
    const linkId = examLink.split('/').pop();

    // Create exam record in single table
    const { data, error } = await supabase
      .from('campus_management')
      .insert([{
        type: 'exam',
        exam_title: values.examTitle,
        job_id: values.jobId,
        college: values.college,
        total_questions: parseInt(values.totalQuestions),
        duration: parseInt(values.duration),
        exam_link: examLink,
        link_id: linkId,
        question_file_url: questionUrl,
        answer_file_url: answerUrl,
        status: 'Draft',
        students_invited: 0,
        students_completed: 0,
        created_by: userRole
      }])
      .select()
      .single();

    if (error) throw error;

    setExams([data, ...exams]);
    setCreateExamVisible(false);
    form.resetFields();
    setQuestionFile(null);
    setAnswerFile(null);
    
    // Show copy link modal immediately after creation
    Modal.success({
      title: 'Exam Created Successfully!',
      content: (
        <div>
          <p>Exam link has been generated:</p>
          <Input.Search
            value={examLink}
            enterButton="Copy Link"
            onSearch={() => {
              navigator.clipboard.writeText(examLink);
              message.success('Link copied to clipboard!');
            }}
          />
          <p style={{ marginTop: '10px', color: '#666' }}>
            You can now go to Campus Applications page to send this link to students.
          </p>
        </div>
      ),
      width: 500
    });

  } catch (error) {
    console.error('Error creating exam:', error);
    message.error('Failed to create exam');
  } finally {
    setLoading(false);
  }
};

  // Copy exam link and open applications page
  const handleCopyLinkAndFilter = (exam) => {
    // Copy to clipboard
    navigator.clipboard.writeText(exam.exam_link);
    message.success('Exam link copied to clipboard!');

    // Store exam details in sessionStorage for the applications page
    sessionStorage.setItem('examLinkData', JSON.stringify({
      examId: exam.id,
      examTitle: exam.exam_title,
      jobId: exam.job_id,
      college: exam.college,
      examLink: exam.exam_link
    }));

    // Open applications page in new tab with filters
    const baseUrl = window.location.origin;
    const applicationsUrl = `${baseUrl}/campus-applications?job=${exam.job_id}&college=${encodeURIComponent(exam.college)}&exam=${exam.id}`;
    window.open(applicationsUrl, '_blank');
  };

  // Delete exam
  const handleDeleteExam = async (examId) => {
  try {
    const { error } = await supabase
      .from('campus_management')
      .delete()
      .eq('id', examId)
      .eq('type', 'exam');

    if (error) throw error;

    setExams(exams.filter(exam => exam.id !== examId));
    message.success('Exam deleted successfully!');
  } catch (error) {
    console.error('Error deleting exam:', error);
    message.error('Failed to delete exam');
  }
};

  // Get student count for job+college combination
  const getStudentCount = (jobId, college) => {
  return applications.filter(app => 
    app.job_id === jobId && app.college_name === college
  ).length;
};

  const examColumns = [
    {
      title: 'Exam Title',
      dataIndex: 'exam_title',
      key: 'exam_title',
      render: (title) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text strong>{title}</Text>
        </Space>
      )
    },
    {
      title: 'Job ID',
      dataIndex: 'job_id',
      key: 'job_id',
    },
    {
      title: 'College',
      dataIndex: 'college',
      key: 'college',
    },
    {
      title: 'Questions',
      dataIndex: 'total_questions',
      key: 'total_questions',
      render: (count) => <Text>{count} questions</Text>
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => <Text>{duration} minutes</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'orange'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Students',
      key: 'students',
      render: (_, record) => {
        const totalStudents = getStudentCount(record.job_id, record.college);
        return (
          <div>
            <Text style={{ fontSize: '12px' }}>
              {record.students_completed || 0}/{totalStudents} eligible
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: 'Exam Link',
                content: (
                  <div>
                    <Text>Share this link with students:</Text>
                    <br />
                    <Input.Search
                      value={record.exam_link}
                      enterButton="Copy"
                      onSearch={() => {
                        navigator.clipboard.writeText(record.exam_link);
                        message.success('Link copied to clipboard!');
                      }}
                    />
                  </div>
                )
              });
            }}
          />
          <Button 
            type="text" 
            size="small"
            icon={<MailOutlined />}
            onClick={() => handleCopyLinkAndFilter(record)}
            title="Copy link and open applications to send emails"
          />
          <Button 
            type="text" 
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: 'Delete Exam',
                content: 'Are you sure you want to delete this exam?',
                onOk: () => handleDeleteExam(record.id)
              });
            }}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          Exam Conduct Center
        </Title>
        <Text type="secondary">
          Create and manage campus recruitment exams
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                {exams.length}
              </Title>
              <Text type="secondary">Total Exams</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
                {exams.filter(exam => exam.status === 'Active').length}
              </Title>
              <Text type="secondary">Active Exams</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#faad14', margin: 0 }}>
                {exams.reduce((sum, exam) => sum + (exam.students_invited || 0), 0)}
              </Title>
              <Text type="secondary">Students Invited</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#722ed1', margin: 0 }}>
                {exams.reduce((sum, exam) => sum + (exam.students_completed || 0), 0)}
              </Title>
              <Text type="secondary">Completed</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Create Exam Button */}
      <Card style={{ marginBottom: '24px' }}>
        <Button 
          type="primary" 
          icon={<FileTextOutlined />}
          onClick={() => setCreateExamVisible(true)}
          size="large"
        >
          Create New Exam
        </Button>
      </Card>

      {/* Exams Table */}
      <Card>
        <Table
          columns={examColumns}
          dataSource={exams}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Create Exam Modal */}
      <Modal
        title="Create New Exam"
        open={createExamVisible}
        onCancel={() => setCreateExamVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleCreateExam} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="Exam Title"
                name="examTitle"
                rules={[{ required: true, message: 'Please enter exam title' }]}
              >
                <Input placeholder="Enter exam title" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Job ID"
                name="jobId"
                rules={[{ required: true, message: 'Please select job ID' }]}
              >
                <Select placeholder="Select Job ID">
                  {jobIds.map(jobId => (
                    <Option key={jobId} value={jobId}>{jobId}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="College"
                name="college"
                rules={[{ required: true, message: 'Please select college' }]}
              >
                <Select placeholder="Select College">
                  {colleges.map(college => (
                    <Option key={college} value={college}>{college}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="Total Questions"
                name="totalQuestions"
                rules={[{ required: true, message: 'Please enter number of questions' }]}
              >
                <Input type="number" placeholder="Enter number of questions" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Duration (minutes)"
                name="duration"
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <Input type="number" placeholder="Enter duration in minutes" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Upload Documents</Divider>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="Questions Document"
                name="questionsFile"
                rules={[{ required: true, message: 'Please upload questions document' }]}
              >
                <Upload
                  accept=".pdf,.doc,.docx"
                  beforeUpload={(file) => {
                    setQuestionFile(file);
                    return false;
                  }}
                  fileList={questionFile ? [questionFile] : []}
                  onRemove={() => setQuestionFile(null)}
                >
                  <Button icon={<UploadOutlined />}>Upload Questions</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Answer Key Document"
                name="answerFile"
                rules={[{ required: true, message: 'Please upload answer key document' }]}
              >
                <Upload
                  accept=".pdf,.doc,.docx"
                  beforeUpload={(file) => {
                    setAnswerFile(file);
                    return false;
                  }}
                  fileList={answerFile ? [answerFile] : []}
                  onRemove={() => setAnswerFile(null)}
                >
                  <Button icon={<UploadOutlined />}>Upload Answer Key</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="Document Requirements"
            description="Please ensure question document has clear question numbers and answer key document has corresponding answers in the same order."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Exam & Generate Link
              </Button>
              <Button onClick={() => setCreateExamVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamConductPage;