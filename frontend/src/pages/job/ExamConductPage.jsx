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
  BarChartOutlined,
  CheckCircleOutlined,
  DownloadOutlined,    // ADD THIS
  UserAddOutlined ,
  
  CopyOutlined, MailOutlined, DeleteOutlined
  
} from '@ant-design/icons';
import { supabase } from '../../supabase/config';
import * as XLSX from 'xlsx';



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
  const [showResponses, setShowResponses] = useState(false);
const [selectedExamResponses, setSelectedExamResponses] = useState([]);
const [cutoffScore, setCutoffScore] = useState('');
const [filteredResponses, setFilteredResponses] = useState([]);
const [selectedStudents, setSelectedStudents] = useState([]);
const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);

const moveToCandidateList = async () => {
  if (selectedStudents.length === 0) {
    message.warning('Please select at least one student to move');
    return;
  }

  setLoading(true);

  try {
    const insertPayload = selectedStudents.map(student => ({
      job_id: selectedExam?.job_id,
      job_title: selectedExam?.exam_title,
      full_name: student.student_name,
      email: student.student_email,
      phone: '', // optional, if available
      location: '',
      current_position: '',
      current_company: '',
      experience_years: '',
      education: '',
      availability: '',
      skills: '',
      expected_salary: '',
      resume_url: '',
      interview_type: null,
      interview_date: null,
      interview_time: null,
      interview_link: null,
      interview_platform: null,
      mail_sent_date: null,
      interview_status: 'pending',
      status: 'shortlisted',
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('job_applications')
      .insert(insertPayload);

    if (error) throw error;

    message.success(`${selectedStudents.length} students moved to candidate list`);
  } catch (error) {
    console.error('Error moving students:', error);
    message.error('Failed to move candidates');
  } finally {
    setLoading(false);
  }
};


const downloadExcel = () => {
  if (selectedStudents.length === 0) {
    message.warning('Please select at least one student to download');
    return;
  }

  // Prepare data for Excel
  const excelData = selectedStudents.map((student, index) => ({
    'S.No': index + 1,
    'Student Name': student.student_name,
    'Email': student.student_email,
    'Score': student.total_score,
    'Total Questions': student.total_questions,
    'Percentage': ((student.total_score / student.total_questions) * 100).toFixed(2) + '%',
    'Status': cutoffScore && student.total_score >= parseInt(cutoffScore) ? 'PASSED' : 'FAILED',
    'Exam Title': selectedExam?.exam_title,
    'Job ID': selectedExam?.job_id,
    'College': selectedExam?.college
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Selected Students');
  
  // Generate filename
  const filename = `${selectedExam?.exam_title}_Selected_Students_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, filename);
  
  message.success(`Downloaded ${selectedStudents.length} student records`);
};


  // Fetch unique job IDs and colleges from applications
// Updated fetchJobsAndColleges function to use campus_job_applications table
const fetchJobsAndColleges = async () => {
  try {
    // Fetch applications data
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('campus_job_applications')
      .select('job_id, college_name, student_name, email, mobile, resume_url, created_at, link_id');

    if (applicationsError) throw applicationsError;

    // Fetch job descriptions data
    const { data: jobDescriptionsData, error: jobDescriptionsError } = await supabase
      .from('job_descriptions')
      .select('job_title, college_name');

    if (jobDescriptionsError) throw jobDescriptionsError;

    const uniqueJobIds = [...new Set(applicationsData.map(app => app.job_id))].filter(Boolean);
    const uniqueColleges = [...new Set(jobDescriptionsData.map(job => job.college_name))].filter(Boolean);
    
    // Extract job titles from job_descriptions table
    const uniqueJobTitles = [...new Set(jobDescriptionsData.map(job => job.job_title))].filter(Boolean);

    setJobIds(uniqueJobIds);
    setColleges(uniqueColleges);
    setJobTitles(uniqueJobTitles);
    setApplications(applicationsData);
  } catch (error) {
    console.error('Error fetching jobs and colleges:', error);
    message.error('Failed to load job IDs and colleges');
  }
};


const handleViewResponses = async (exam) => {
  setSelectedExam(exam);
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('campus_management')
      .select('*')
      .eq('type', 'exam_response')
      .eq('exam_id', exam.id);

    if (error) throw error;
    
    // Group responses by student
    const studentResponses = data.reduce((acc, response) => {
      const studentKey = response.student_email;
      if (!acc[studentKey]) {
        acc[studentKey] = {
          student_email: response.student_email,
          student_name: response.student_name,
          total_score: 0,
          total_questions: 0,
          responses: []
        };
      }
      acc[studentKey].responses.push(response);
      acc[studentKey].total_score += response.score || 0;
      acc[studentKey].total_questions += 1;
      return acc;
    }, {});

    setSelectedExamResponses(Object.values(studentResponses));
    setFilteredResponses(Object.values(studentResponses));
    setShowResponses(true);
  } catch (error) {
    message.error('Failed to fetch responses');
  } finally {
    setLoading(false);
  }
};
const handleCutoffFilter = (cutoff) => {
  if (!cutoff) {
    setFilteredResponses(selectedExamResponses);
    return;
  }
  
  const filtered = selectedExamResponses.filter(student => 
    student.total_score >= parseInt(cutoff)
  );
  setFilteredResponses(filtered);
};
const responseColumns = [
  {
    title: 'Student Name',
    dataIndex: 'student_name',
    key: 'student_name',
  },
  {
    title: 'Email',
    dataIndex: 'student_email',
    key: 'student_email',
  },
  {
    title: 'Score',
    dataIndex: 'total_score',
    key: 'total_score',
    render: (score, record) => (
      <Text strong style={{ 
        color: cutoffScore && score >= parseInt(cutoffScore) ? '#52c41a' : '#ff4d4f' 
      }}>
        {score}/{record.total_questions}
      </Text>
    )
  },
  {
    title: 'Percentage',
    key: 'percentage',
    render: (_, record) => {
      const percentage = ((record.total_score / record.total_questions) * 100).toFixed(2);
      return <Text>{percentage}%</Text>;
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => {
      if (!cutoffScore) return <Text>-</Text>;
      const passed = record.total_score >= parseInt(cutoffScore);
      return (
        <Tag color={passed ? 'green' : 'red'}>
          {passed ? 'PASSED' : 'FAILED'}
        </Tag>
      );
    }
  }
];
const rowSelection = {
  selectedRowKeys: selectedStudentKeys,
  onChange: (selectedRowKeys, selectedRows) => {
    setSelectedStudentKeys(selectedRowKeys);
    setSelectedStudents(selectedRows);
  },
  onSelectAll: (selected, selectedRows, changeRows) => {
    if (selected) {
      setSelectedStudentKeys(filteredResponses.map(student => student.student_email));
      setSelectedStudents(filteredResponses);
    } else {
      setSelectedStudentKeys([]);
      setSelectedStudents([]);
    }
  },
  getCheckboxProps: (record) => ({
    name: record.student_name,
  }),
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
  const linkId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return `${window.location.origin}/exam/${linkId}`;
};

  // Upload file to Supabase storage
const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Parse questions (assuming format: Column A = Questions, Column B = Options, Column C = Answers)
        const questions = jsonData.slice(1).map((row, index) => { // Skip header row
          if (!row[0]) return null; // Skip empty rows
          
const options = row[1] ? String(row[1]).split(',').map(opt => opt.trim()) : [];
          
          return {
            id: index + 1,
            question: row[0],
            options: options,
            correctAnswer: row[2] ? String(row[2]).trim() : '',

            type: 'multiple_choice'
          };
        }).filter(q => q !== null);
        
        resolve(questions);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
const uploadFile = async (file, folder = 'questions') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('exam-files') // 👈 Replace with your Supabase storage bucket name
    .upload(filePath, file);

  if (error) {
    throw new Error('File upload failed: ' + error.message);
  }

  const { publicUrl } = supabase.storage
    .from('exam-files') // 👈 Same bucket
    .getPublicUrl(filePath).data;

  return publicUrl;
};

  // Create exam
const handleCreateExam = async (values) => {
  if (!questionFile) {
    message.error('Please upload the questions Excel file');
    return;
  }

  setLoading(true);
  try {
    // Parse Excel file to get questions and answers
    const questionsData = await parseExcelFile(questionFile);
    
    if (!questionsData || questionsData.length === 0) {
      throw new Error('No valid questions found in Excel file');
    }

    // Upload the original Excel file
    const questionUrl = await uploadFile(questionFile, 'questions');

    // Generate exam link
    const examLink = generateExamLink();
    const linkId = examLink.split('/').pop();

    // Create exam record with questions data
    const { data, error } = await supabase
      .from('campus_management')
      .insert([{
        type: 'exam',
        exam_title: values.examTitle,
        job_id: Array.isArray(values.jobId) ? parseInt(values.jobId[0]) : parseInt(values.jobId),
college: Array.isArray(values.college) ? values.college[0] : values.college,
        total_questions: questionsData.length,
        duration: parseInt(values.duration),
        exam_link: examLink,
        link_id: linkId,
        question_file_url: questionUrl,
        questions_data: JSON.stringify(questionsData), // Store parsed questions
        status: 'Active',
        students_invited: 0,
        students_completed: 0,
        created_by: userRole
      }])
      .select()
      .single();

    if (error) throw error;

    // Add to local state
    setExams([data, ...exams]);
    setCreateExamVisible(false);
    form.resetFields();
    setQuestionFile(null);
    
    // Show success message
    Modal.success({
      title: 'Exam Created Successfully!',
      content: (
        <div>
          <p>Exam "{values.examTitle}" has been created with {questionsData.length} questions.</p>
          <p><strong>Exam Link:</strong></p>
          <Input.Search
            value={examLink}
            enterButton="Copy Link"
            onSearch={() => {
              navigator.clipboard.writeText(examLink);
              message.success('Link copied to clipboard!');
            }}
            style={{ marginBottom: '16px' }}
          />
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f6ffed', 
            borderRadius: '6px',
            border: '1px solid #b7eb8f'
          }}>
            <p style={{ margin: 0, color: '#389e0d' }}>
              <strong>✓ Excel Format Detected:</strong>
              <br />
              • Questions: {questionsData.length}
              <br />
              • All questions parsed successfully
              <br />
              • Ready for student evaluation
            </p>
          </div>
        </div>
      ),
      width: 650,
      okText: 'Got It!'
    });

  } catch (error) {
    console.error('Error creating exam:', error);
    message.error(`Failed to create exam: ${error.message}`);
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

  const handleDeleteExam = async (examId) => {
  try {
    const { error } = await supabase
      .from('campus_management')
      .delete()
      .eq('id', examId)
      .eq('type', 'exam');

    if (error) throw error;

    // Remove from local state
    setExams(exams.filter(exam => exam.id !== examId));
    message.success('Exam deleted successfully');
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
// Add this function to format exam title
const formatExamTitle = (title) => {
  if (!title) return '';
  return title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Add these state variables at the top with other useState declarations
const [jobTitles, setJobTitles] = useState([]);
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
          icon={<BarChartOutlined />}
          onClick={() => handleViewResponses(record)}
          title="View Responses"
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
    <Col span={24}>
      <Form.Item
        label="Exam Title"
        name="examTitle"
        rules={[{ required: true, message: 'Please enter exam title' }]}
      >
        <Select
          mode="tags"
          placeholder="Select existing job title or enter new one"
          style={{ width: '100%' }}
          tokenSeparators={[',']}
          maxTagCount={1}
          onChange={(value) => {
            if (value && value.length > 0) {
              const formattedTitle = formatExamTitle(value[0]);
              form.setFieldsValue({ examTitle: formattedTitle });
            }
          }}
          filterOption={(input, option) =>
            option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {jobTitles.map(title => (
            <Option key={title} value={title}>
              {formatExamTitle(title)}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Col>
  </Row>
  
  <Row gutter={[16, 0]}>
    <Col span={12}>
      <Form.Item
        label="Job ID"
        name="jobId"
        rules={[{ required: true, message: 'Please enter job ID' }]}
      >
        <Select
          mode="tags"
          placeholder="Select existing Job ID or enter new one"
          style={{ width: '100%' }}
          tokenSeparators={[',']}
          maxTagCount={1}
          filterOption={(input, option) =>
            option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {jobIds.map(jobId => (
            <Option key={jobId} value={jobId}>{jobId}</Option>
          ))}
        </Select>
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        label="College"
        name="college"
        rules={[{ required: true, message: 'Please enter college name' }]}
      >
        <Select
          mode="tags"
          placeholder="Select existing college or enter new one"
          style={{ width: '100%' }}
          tokenSeparators={[',']}
          maxTagCount={1}
          filterOption={(input, option) =>
            option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {colleges.map(college => (
            <Option key={college} value={college}>{college}</Option>
          ))}
        </Select>
      </Form.Item>
    </Col>
  </Row>
  
  {/* Rest of your form remains the same */}
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
  <Col span={24}>
    <Form.Item
      label="Questions Excel File"
      name="questionsFile"
      rules={[{ required: true, message: 'Please upload questions Excel file' }]}
    >
      <Upload
        accept=".xlsx,.xls"
        beforeUpload={(file) => {
          setQuestionFile(file);
          return false;
        }}
        fileList={questionFile ? [questionFile] : []}
        onRemove={() => setQuestionFile(null)}
      >
        <Button icon={<UploadOutlined />}>Upload Questions Excel</Button>
      </Upload>
    </Form.Item>
  </Col>
</Row>

<Alert
  message="Excel Format Requirements"
  description={
    <div>
      <p><strong>Column A:</strong> Questions (e.g., "What is 2+2?")</p>
      <p><strong>Column B:</strong> Options separated by commas (e.g., "Option A, Option B, Option C, Option D")</p>
      <p><strong>Column C:</strong> Correct Answer (e.g., "Option A")</p>
      <p><strong>First row should contain headers, questions start from row 2</strong></p>
    </div>
  }
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
      {/* Responses View */}
      
{showResponses && (
  <Card style={{ marginTop: '24px' }}>
    <div style={{ marginBottom: '16px' }}>
      <Space>
        <Button onClick={() => setShowResponses(false)}>
          ← Back to Exams
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          Responses for: {selectedExam?.exam_title}
        </Title>
      </Space>
    </div>
    
    <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
      <Col span={8}>
        <Input
          placeholder="Enter cutoff score"
          value={cutoffScore}
          onChange={(e) => {
            setCutoffScore(e.target.value);
            handleCutoffFilter(e.target.value);
          }}
          type="number"
          addonBefore="Cutoff Score"
        />
      </Col>
      <Col span={16}>
        <Space>
          <Text>Total Students: {selectedExamResponses.length}</Text>
          {cutoffScore && (
            <>
              <Text type="success">Passed: {filteredResponses.filter(s => s.total_score >= parseInt(cutoffScore)).length}</Text>
              <Text type="danger">Failed: {filteredResponses.filter(s => s.total_score < parseInt(cutoffScore)).length}</Text>
            </>
          )}
        </Space>
      </Col>
    </Row>
<Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
  <Col span={24}>
    <Space>
      <Button 
        type="primary" 
        icon={<DownloadOutlined />}
        onClick={downloadExcel}
        disabled={selectedStudents.length === 0}
      >
        Download Excel ({selectedStudents.length} selected)
      </Button>
      <Button 
  type="default"
  icon={<UserAddOutlined />}
  disabled={selectedStudents.length === 0}
  onClick={moveToCandidateList} // ✅ Attach this
>
  Move to Candidate List ({selectedStudents.length} selected)
</Button>

      {selectedStudents.length > 0 && (
        <Text type="secondary">
          {selectedStudents.length} of {filteredResponses.length} students selected
        </Text>
      )}
    </Space>
  </Col>
</Row>

    <Table
  columns={responseColumns}
  dataSource={filteredResponses}
  rowKey="student_email"
  loading={loading}
  pagination={{ pageSize: 10 }}
  rowSelection={rowSelection}
/>
  </Card>
)}

    </div>
  );
};
export default ExamConductPage;