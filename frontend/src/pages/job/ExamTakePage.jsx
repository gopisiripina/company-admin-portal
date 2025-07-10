import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  Radio, 
  Typography, 
  Space, 
  Alert, 
  Modal, 
  message,
  Spin,
  Row,
  Col,
  Progress,
  Divider
} from 'antd';
import { 
  ClockCircleOutlined, 
  UserOutlined, 
  FileTextOutlined,
  SendOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/config';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ExamTakePage = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [examQuestions, setExamQuestions] = useState([]);

  // Fetch exam data
  const fetchExamData = async () => {
  try {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('campus_management')
      .select('*')
      .eq('type', 'exam')
      .eq('link_id', linkId)
      .single();

    if (error) throw error;
    
    if (!data) {
      throw new Error('Exam not found');
    }

    setExamData(data);
    setTimeLeft(data.duration * 60);
    
    // Parse questions from stored JSON data
    if (data.questions_data) {
      const questions = JSON.parse(data.questions_data);
      setExamQuestions(questions);
    } else {
      throw new Error('No questions found for this exam');
    }
    
  } catch (error) {
    console.error('Error fetching exam:', error);
    message.error('Failed to load exam. Please check your link.');
    navigate('/');
  } finally {
    setLoading(false);
  }
};


  // Timer effect
  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [examStarted, timeLeft]);

  // Auto submit when time runs out
  const handleAutoSubmit = async () => {
    message.warning('Time is up! Auto-submitting your exam...');
    await handleSubmitExam();
  };

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Start exam
  const handleStartExam = async (values) => {
    setStudentInfo(values);
    setExamStarted(true);
    message.success('Exam started! Best of luck!');
  };

  // Handle answer change
  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Submit exam
const handleSubmitExam = async () => {
  if (!studentInfo) {
    message.error('Student information is missing');
    return;
  }

  setSubmitting(true);
  
  try {
    const now = new Date().toISOString();
    let correctCount = 0;
    let totalQuestions = examQuestions.length;
    
    // Calculate score
    const examResponses = examQuestions.map(question => {
      const studentAnswer = answers[question.id] || '';
      const isCorrect = studentAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        type: 'exam_response',
        exam_id: examData.id,
        student_name: studentInfo.studentName,
        student_email: studentInfo.email,
        job_id: examData.job_id,
        college: examData.college,
        question_number: question.id,
        student_answer: studentAnswer,
        correct_answer: question.correctAnswer,
        is_correct: isCorrect,
        score: isCorrect ? 1 : 0,
        created_at: now,
        metadata: JSON.stringify({
          question_text: question.question,
          options: question.options
        })
      };
    });

    // Insert exam responses
    const { error: responseError } = await supabase
      .from('campus_management')
      .insert(examResponses);

    if (responseError) throw responseError;

    // Update exam completion count
    const { data: currentExam, error: fetchError } = await supabase
      .from('campus_management')
      .select('students_completed')
      .eq('id', examData.id)
      .single();

    if (fetchError) throw fetchError;

    const newCompletedCount = (currentExam?.students_completed || 0) + 1;

    const { error: updateError } = await supabase
      .from('campus_management')
      .update({ students_completed: newCompletedCount })
      .eq('id', examData.id);

    if (updateError) throw updateError;

    // Calculate percentage
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Show detailed results
    Modal.success({
      title: 'Exam Completed Successfully!',
      content: (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: percentage >= 60 ? '#52c41a' : '#ff4d4f'
            }}>
              {percentage}%
            </div>
            <Text type="secondary">Your Score</Text>
          </div>
          
          <Divider />
          
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {correctCount}
                  </div>
                  <Text type="secondary">Correct</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {totalQuestions - correctCount}
                  </div>
                  <Text type="secondary">Incorrect</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {totalQuestions}
                  </div>
                  <Text type="secondary">Total</Text>
                </div>
              </Col>
            </Row>
          </div>
          
          <Divider />
          
          <div>
            <p><strong>Student:</strong> {studentInfo.studentName}</p>
            <p><strong>Email:</strong> {studentInfo.email}</p>
            <p><strong>Job ID:</strong> {examData.job_id}</p>
            <p><strong>College:</strong> {examData.college}</p>
            <p><strong>Questions Attempted:</strong> {Object.keys(answers).length} / {totalQuestions}</p>
          </div>
          
          <Alert
            message={percentage >= 60 ? "Congratulations!" : "Better luck next time!"}
            description={
              percentage >= 60 
                ? "You have passed the exam. Your responses have been recorded and will be reviewed by the HR team."
                : "Your responses have been recorded. The HR team will review all submissions."
            }
            type={percentage >= 60 ? "success" : "info"}
            showIcon
            style={{ marginTop: '16px' }}
          />
        </div>
      ),
      width: 600,
      onOk: () => navigate('/')
    });

  } catch (error) {
    console.error('Error submitting exam:', error);
    message.error('Failed to submit exam. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  // Confirm submit
  const handleConfirmSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = examQuestions.length;
    
    Modal.confirm({
      title: 'Submit Exam?',
      content: (
        <div>
          <p>Are you sure you want to submit your exam?</p>
          <p><strong>Questions Answered:</strong> {answeredCount} / {totalQuestions}</p>
          {answeredCount < totalQuestions && (
            <p style={{ color: '#ff4d4f' }}>
              <WarningOutlined /> You have {totalQuestions - answeredCount} unanswered questions.
            </p>
          )}
          <p>You won't be able to change your answers after submission.</p>
        </div>
      ),
      onOk: handleSubmitExam,
      okText: 'Submit Exam',
      cancelText: 'Continue Exam'
    });
  };

  useEffect(() => {
    fetchExamData();
  }, [linkId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!examData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          message="Exam Not Found"
          description="The exam link you're looking for doesn't exist or has expired."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Student info form (before exam starts)
  if (!examStarted) {
    return (
      <div style={{ 
        padding: '24px', 
        maxWidth: '600px', 
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Card style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={2} style={{ color: '#1890ff' }}>
              {examData.exam_title}
            </Title>
            <Text type="secondary">
              Job ID: {examData.job_id} • College: {examData.college}
            </Text>
          </div>

          <Alert
            message="Exam Instructions"
            description={
              <div>
                <p>• Total Questions: {examData.total_questions}</p>
                <p>• Duration: {examData.duration} minutes</p>
                <p>• Once you start, you cannot pause the exam</p>
                <p>• Make sure you have a stable internet connection</p>
                <p>• Do not refresh the page during the exam</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Form form={form} onFinish={handleStartExam} layout="vertical">
            <Form.Item
              label="Student Name"
              name="studentName"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="Enter your email address" />
            </Form.Item>

            <Form.Item
              label="Mobile Number"
              name="mobile"
              rules={[{ required: true, message: 'Please enter your mobile number' }]}
            >
              <Input placeholder="Enter your mobile number" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Start Exam
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  // Exam interface
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {examData.exam_title}
            </Title>
            <Text type="secondary">
              Student: {studentInfo.studentName} • Email: {studentInfo.email}
            </Text>
          </Col>
          <Col>
            <Space>
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ color: timeLeft < 300 ? '#ff4d4f' : '#1890ff' }} />
                <Text 
                  strong 
                  style={{ 
                    marginLeft: '8px',
                    color: timeLeft < 300 ? '#ff4d4f' : '#1890ff'
                  }}
                >
                  {formatTime(timeLeft)}
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
        
        <div style={{ marginTop: '16px' }}>
          <Progress
            percent={Math.round(((examData.total_questions - timeLeft / (examData.duration * 60) * examData.total_questions) / examData.total_questions) * 100)}
            showInfo={false}
            strokeColor={timeLeft < 300 ? '#ff4d4f' : '#1890ff'}
          />
        </div>
      </Card>

      {/* Questions */}
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Text strong>Question {currentQuestion} of {examQuestions.length}</Text>
        </div>

// Updated question rendering to handle dynamic options
{examQuestions.map((question, index) => (
  <div 
    key={question.id}
    style={{ 
      display: currentQuestion === question.id ? 'block' : 'none',
      marginBottom: '24px'
    }}
  >
    <Title level={4}>{question.question}</Title>
    
    <Radio.Group
      value={answers[question.id]}
      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {question.options.map((option, optIndex) => (
          <Radio key={optIndex} value={option} style={{ padding: '8px' }}>
            {option}
          </Radio>
        ))}
      </Space>
    </Radio.Group>
  </div>
))}
        <Divider />

        {/* Navigation */}
        <Row justify="space-between" align="middle">
          <Col>
            <Button 
              disabled={currentQuestion === 1}
              onClick={() => setCurrentQuestion(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
          </Col>
          <Col>
            <Space>
              <Text>
                {Object.keys(answers).filter(key => answers[key]).length} / {examQuestions.length} answered
              </Text>
              {currentQuestion < examQuestions.length ? (
                <Button 
                  type="primary"
                  onClick={() => setCurrentQuestion(prev => Math.min(examQuestions.length, prev + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="primary"
                  onClick={handleConfirmSubmit}
                  loading={submitting}
                  icon={<SendOutlined />}
                >
                  Submit Exam
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Question Navigation */}
        <div style={{ marginTop: '24px' }}>
          <Text strong>Question Navigation:</Text>
          <div style={{ marginTop: '8px' }}>
            {examQuestions.map((question, index) => (
              <Button
                key={question.id}
                type={currentQuestion === question.id ? 'primary' : 'default'}
                size="small"
                style={{ 
                  margin: '2px',
                  backgroundColor: answers[question.id] ? '#52c41a' : undefined,
                  borderColor: answers[question.id] ? '#52c41a' : undefined,
                  color: answers[question.id] && currentQuestion !== question.id ? '#fff' : undefined
                }}
                onClick={() => setCurrentQuestion(question.id)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Warning for time */}
      {timeLeft < 300 && (
        <Alert
          message="Time Warning"
          description={`Only ${formatTime(timeLeft)} remaining! Your exam will be auto-submitted when time runs out.`}
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
    </div>
  );
};

export default ExamTakePage;