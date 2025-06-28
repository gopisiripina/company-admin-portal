import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  message,
  Steps,
  Progress,
  Tag,
  Space,
  Alert,
  Spin
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  BankOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useParams, useSearchParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Supabase configuration
const supabaseUrl = 'https://dsvqjsnxdxlgufzwcaub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdnFqc254ZHhsZ3VmendjYXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjgyMjMsImV4cCI6MjA2NjQwNDIyM30.YHdiWzPvU6XBXFzcDZL7LKtgjU_dv5pVVpFRF8OkEz8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Utility function for uploading resume
const uploadResumeToStorage = async (file, applicationId) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${applicationId}/resume.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(fileName, file);
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName);
  
  return publicUrl;
};

const JobApplicationPage = () => {
  const { jobId } = useParams(); // Get job ID from URL params
  const [searchParams] = useSearchParams(); // Get query parameters
  const [jobData, setJobData] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // Add useEffect to fetch job data dynamically
  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  const fetchJobData = async () => {
    setLoading(true);
    try {
      let jobInfo = null;

      // If jobId is provided in URL, fetch from database
      if (jobId) {
        const { data, error } = await supabase
          .from('job_descriptions')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error fetching job:', error);
          message.error('Job not found');
          return;
        }

        jobInfo = {
          id: data.id,
          title: data.job_title,
          company: data.company_name || "Your Company Name",
          location: data.location,
          type: data.employment_type,
          salary: data.salary_range || "Competitive",
          description: data.job_description,
          requirements: data.required_skills ? 
            (Array.isArray(data.required_skills) ? 
              data.required_skills : 
              data.required_skills.split(',').map(s => s.trim())
            ) : []
        };
      } 
      // If no jobId but query params exist (from job posting)
      else if (searchParams.get('title')) {
        jobInfo = {
          id: searchParams.get('id') || Date.now(),
          title: searchParams.get('title'),
          company: searchParams.get('company') || "Your Company Name",
          location: searchParams.get('location') || "Location TBD",
          type: searchParams.get('type') || "Full-time",
          salary: searchParams.get('salary') || "Competitive",
          description: searchParams.get('description') || "Great opportunity to join our team",
          requirements: []
        };
      }
      // Fallback to default
      else {
        jobInfo = {
          id: 1,
          title: "General Application",
          company: "Your Company Name",
          location: "Various Locations",
          type: "Multiple Types",
          salary: "Competitive",
          description: "Submit your application for future opportunities.",
          requirements: []
        };
      }

      setJobData(jobInfo);
    } catch (error) {
      console.error('Error fetching job data:', error);
      message.error('Failed to load job information');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const values = form.getFieldsValue();
    const requiredFields = ['fullName', 'email', 'phone', 'experience', 'expectedSalary'];
    const completedFields = requiredFields.filter(field => values[field]).length;
    const progress = (completedFields / requiredFields.length) * 100;
    setFormProgress(progress);
  };

  // Update the handleSubmit function to use dynamic jobData
  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      let resumeUrl = null;
      
      if (fileList.length > 0) {
        resumeUrl = await uploadResumeToStorage(fileList[0], Date.now().toString());
      }

      const applicationData = {
        job_id: jobData.id, // Use dynamic job data
        job_title: jobData.title, // Use dynamic job data
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        location: values.location || null,
        current_position: values.currentPosition || null,
        current_company: values.currentCompany || null,
        experience_years: values.experience,
        education: values.education || null,
        availability: values.availability || null,
        skills: values.skills || null,
        expected_salary: values.expectedSalary,
        portfolio_url: values.portfolioUrl || null,
        linkedin_url: values.linkedinUrl || null,
        cover_letter: values.coverLetter || null,
        resume_url: resumeUrl,
        status: 'pending'
      };
      
      const { data, error } = await supabase
        .from('job_applications')
        .insert([applicationData])
        .select();
      
      if (error) throw error;
      
      message.success('Application submitted successfully!');
      setSubmitted(true);
      
    } catch (error) {
      console.error('Submission error:', error);
      message.error(`Failed to submit application: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const uploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf,.doc,.docx',
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/msword' || 
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isValidType) {
        message.error('Please upload PDF, DOC, or DOCX files only');
        return false;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('File must be smaller than 5MB');
        return false;
      }
      
      return false; // Prevent auto upload
    },
    onChange: handleFileChange,
    fileList
  };

  const steps = [
    { title: 'Personal Info', icon: <UserOutlined /> },
    { title: 'Professional Details', icon: <BankOutlined /> },
    { title: 'Application', icon: <FileTextOutlined /> }
  ];

  // Add loading state for initial page load
  if (loading && !jobData) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg,rgb(156, 184, 139) 0%,rgb(237, 244, 239) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: '16px' }}>Loading Job Information...</Title>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #FBFBFD 0%, #BCF49D 50%, #1F4842 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 500, textAlign: 'center', borderRadius: '12px' }}>
          <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }} />
          <Title level={2}>Application Submitted!</Title>
          <Paragraph>
            Thank you for applying to <strong>{jobData?.title}</strong> at <strong>{jobData?.company}</strong>.
            We'll review your application and get back to you soon.
          </Paragraph>
          <Button type="primary" size="large" onClick={() => window.location.reload()}>
            Apply for Another Position
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      // background: 'linear-gradient(135deg,rgb(156, 184, 139) 0%,rgb(237, 244, 239) 100%)',
      padding: '20px 0'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                {jobData?.title}
              </Title>
              <Text style={{ fontSize: '16px', color: '#666' }}>
                {jobData?.company} • {jobData?.location}
              </Text>
              <div style={{ marginTop: '12px' }}>
                <Space>
                  <Tag color="blue">{jobData?.type}</Tag>
                  <Tag color="green">{jobData?.salary}</Tag>
                </Space>
              </div>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Progress 
                type="circle" 
                percent={formProgress} 
                size={80}
                strokeColor="#1890ff"
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Form Completion
              </div>
            </Col>
          </Row>
        </Card>

        {/* Steps */}
        <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
          <Steps current={currentStep} items={steps} />
        </Card>

        {/* Application Form */}
        <Card style={{ borderRadius: '12px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={calculateProgress}
            size="large"
          >
            {/* Personal Information */}
            <div>
              <Title level={4} style={{ color: '#1890ff', marginBottom: '20px' }}>
                <UserOutlined /> Personal Information
              </Title>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="John Doe" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="john@example.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="+1 (555) 123-4567" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="location"
                    label="Current Location"
                  >
                    <Input placeholder="City, State/Country" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Professional Information */}
            <div>
              <Title level={4} style={{ color: '#1890ff', marginBottom: '20px' }}>
                <BankOutlined /> Professional Information
              </Title>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="currentPosition"
                    label="Current Position"
                  >
                    <Input placeholder="Software Engineer" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="currentCompany"
                    label="Current Company"
                  >
                    <Input placeholder="ABC Tech Corp" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="experience"
                    label="Years of Experience"
                    rules={[{ required: true, message: 'Please select your experience level' }]}
                  >
                    <Select placeholder="Select experience level">
                      <Option value="0-1">0-1 years</Option>
                      <Option value="1-3">1-3 years</Option>
                      <Option value="3-5">3-5 years</Option>
                      <Option value="5-10">5-10 years</Option>
                      <Option value="10+">10+ years</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="expectedSalary"
                    label="Expected Salary"
                    rules={[{ required: true, message: 'Please enter expected salary' }]}
                  >
                    <Input prefix={<DollarOutlined />} placeholder="80,000 - 100,000" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="education"
                    label="Highest Education"
                  >
                    <Select placeholder="Select education level">
                      <Option value="high-school">High School</Option>
                      <Option value="associate">Associate Degree</Option>
                      <Option value="bachelor">Bachelor's Degree</Option>
                      <Option value="master">Master's Degree</Option>
                      <Option value="phd">PhD</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="availability"
                    label="Availability"
                  >
                    <Select placeholder="When can you start?">
                      <Option value="immediate">Immediately</Option>
                      <Option value="2weeks">2 weeks notice</Option>
                      <Option value="1month">1 month</Option>
                      <Option value="2months">2 months</Option>
                      <Option value="3months">3+ months</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="skills"
                label="Key Skills"
              >
                <TextArea 
                  rows={3} 
                  placeholder="React, TypeScript, Node.js, AWS, etc."
                />
              </Form.Item>
            </div>

            <Divider />

            {/* Application Details */}
            <div>
              <Title level={4} style={{ color: '#1890ff', marginBottom: '20px' }}>
                <FileTextOutlined /> Application Details
              </Title>
              
              <Form.Item
                name="resume"
                label="Resume/CV"
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>
                    Upload Resume (PDF, DOC, DOCX)
                  </Button>
                </Upload>
              </Form.Item>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="portfolioUrl"
                    label="Portfolio URL"
                  >
                    <Input 
                      prefix={<LinkOutlined />} 
                      placeholder="https://yourportfolio.com" 
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="linkedinUrl"
                    label="LinkedIn Profile"
                  >
                    <Input 
                      prefix={<LinkOutlined />} 
                      placeholder="https://linkedin.com/in/yourprofile" 
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="coverLetter"
                label="Cover Letter"
              >
                <TextArea 
                  rows={6} 
                  placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                />
              </Form.Item>
            </div>

            <Divider />

            {/* Submit Button */}
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                loading={loading}
                style={{ 
                  width: '100%', 
                  height: '50px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </Form.Item>

            <Alert
              message="Your Privacy Matters"
              description="All information provided will be kept confidential and used solely for recruitment purposes."
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default JobApplicationPage;