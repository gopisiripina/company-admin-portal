import React, { useState, useEffect } from 'react';
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
  FileTextOutlined,
  CheckCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Supabase configuration
import { supabase } from '../../supabase/config';

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

const JobApplicationPage = ({ userRole, jobId }) => {
  const [searchParams] = useSearchParams();
  const [jobData, setJobData] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [formProgress, setFormProgress] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // Extract job ID from URL if not passed as prop
  const getCurrentJobId = () => {
    if (jobId) return jobId;
    const path = window.location.pathname;
    const match = path.match(/\/job-application\/(\d+)/);
    return match ? match[1] : null;
  };
  
  const currentJobId = getCurrentJobId();
  
  useEffect(() => {
    fetchJobData();
  }, [currentJobId]);

  const fetchJobData = async () => {
    setLoading(true);
    try {
      let jobInfo = null;

      // If jobId is provided, try to fetch from job_postings table
      if (currentJobId) {
        try {
          const { data: jobPosting, error } = await supabase
            .from('job_postings')
            .select('*')
            .eq('id', currentJobId)
            .single();

          if (error) {
            console.error('Error fetching job posting:', error);
            throw error;
          }

          // Use the job posting data directly
          jobInfo = {
            id: jobPosting.id,
            title: jobPosting.title || jobPosting.job_title,
            company: jobPosting.company || jobPosting.company_name || "My Access",
            location: jobPosting.location || "Location TBD",
            type: jobPosting.type || jobPosting.employment_type || "Full-time",
            salary: jobPosting.salary || jobPosting.salary_range || "Competitive",
            description: jobPosting.description || jobPosting.job_description || "Great opportunity to join our team",
            requirements: jobPosting.requirements || jobPosting.required_skills || []
          };
        } catch (error) {
          console.error('Error fetching job from database:', error);
          // If database fetch fails, fall back to URL parameters
          jobInfo = getJobInfoFromParams();
        }
      }
      // If no jobId but query params exist (from job posting)
      else if (searchParams.get('title')) {
        jobInfo = getJobInfoFromParams();
      }
      // Fallback to default
      else {
        jobInfo = getDefaultJobInfo();
      }

      setJobData(jobInfo);
    } catch (error) {
      console.error('Error fetching job data:', error);
      message.error('Failed to load job information');
      // Set default job info even on error
      setJobData(getDefaultJobInfo());
    } finally {
      setLoading(false);
    }
  };

  const getJobInfoFromParams = () => {
    return {
      id: searchParams.get('job_id') || searchParams.get('id'),
      title: searchParams.get('title'),
      company: searchParams.get('company') || "My Access",
      location: searchParams.get('location') || "Location TBD",
      type: searchParams.get('type') || "Full-time",
      salary: searchParams.get('salary') || "Competitive",
      description: searchParams.get('description') || "Great opportunity to join our team",
      requirements: []
    };
  };

  const getDefaultJobInfo = () => {
    return {
      id: null,
      title: "General Application",
      company: "My Access",
      location: "Various Locations",
      type: "Multiple Types",
      salary: "Competitive",
      description: "Submit your application for future opportunities.",
      requirements: []
    };
  };

  const calculateProgress = () => {
    const values = form.getFieldsValue();
    const requiredFields = ['fullName', 'email', 'phone', 'experience', 'expectedSalary'];
    const completedFields = requiredFields.filter(field => values[field]).length;
    const progress = (completedFields / requiredFields.length) * 100;
    setFormProgress(progress);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      let resumeUrl = null;
      
      if (fileList.length > 0) {
        resumeUrl = await uploadResumeToStorage(fileList[0], Date.now().toString());
      }

      const applicationData = {
        job_id: currentJobId ? parseInt(currentJobId) : null,
        job_title: jobData?.title || 'Unknown Position',
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

  // Loading state for initial page load
  if (loading && !jobData) {
    return (
      <div style={{ 
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <Card 
          style={{ 
            textAlign: 'center', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '40px'
          }}
        >
          <Spin size="large" />
          <Title level={4} style={{ marginTop: '16px', color: '#666' }}>
            Loading Job Information...
          </Title>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: '#f5f5f5'
      }}>
        <Card 
          style={{ 
            maxWidth: 500, 
            textAlign: 'center', 
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            padding: '40px'
          }}
        >
          <CheckCircleOutlined 
            style={{ 
              fontSize: '72px', 
              color: '#52c41a', 
              marginBottom: '24px' 
            }} 
          />
          <Title level={2} style={{ color: '#1890ff', marginBottom: '16px' }}>
            Application Submitted!
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
            Thank you for applying to <strong>{jobData?.title}</strong> at <strong>{jobData?.company}</strong>.
            We'll review your application and get back to you soon.
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => window.location.reload()}
            style={{
              borderRadius: '8px',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Apply for Another Position
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      {/* Centered Container */}
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header Card */}
        <Card 
          style={{ 
            marginBottom: '32px', 
            borderRadius: '16px',
            width: '100%',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            border: 'none'
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Title level={1} style={{ 
              margin: '0 0 8px 0', 
              color: '#1890ff',
              fontSize: '2.5rem',
              fontWeight: '700'
            }}>
              {jobData?.title}
            </Title>
            <Text style={{ 
              fontSize: '18px', 
              color: '#666',
              display: 'block',
              marginBottom: '16px'
            }}>
              {jobData?.company} • {jobData?.location}
            </Text>
            <Space size="middle" style={{ marginBottom: '24px' }}>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {jobData?.type}
              </Tag>
              <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {jobData?.salary}
              </Tag>
            </Space>
            
            {/* Progress Circle */}
            <div style={{ marginTop: '20px' }}>
              <Progress 
                type="circle" 
                percent={formProgress} 
                size={100}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                strokeWidth={8}
              />
              <div style={{ 
                marginTop: '12px', 
                fontSize: '14px', 
                color: '#666',
                fontWeight: '500'
              }}>
                Form Completion
              </div>
            </div>
          </div>
        </Card>

        {/* Application Form Card */}
        <Card 
          style={{ 
            borderRadius: '16px',
            width: '100%',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            border: 'none'
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={calculateProgress}
            size="large"
          >
            {/* Personal Information */}
            <div style={{ marginBottom: '40px' }}>
              <Title level={3} style={{ 
                color: '#1890ff', 
                marginBottom: '24px',
                textAlign: 'center',
                fontSize: '1.5rem'
              }}>
                <UserOutlined style={{ marginRight: '8px' }} /> 
                Personal Information
              </Title>
              
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
                      placeholder="John Doe"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
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
                    <Input 
                      prefix={<MailOutlined style={{ color: '#1890ff' }} />} 
                      placeholder="john@example.com"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                  >
                    <Input 
                      prefix={<PhoneOutlined style={{ color: '#1890ff' }} />} 
                      placeholder="+1 (555) 123-4567"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="location"
                    label="Current Location"
                  >
                    <Input 
                      placeholder="City, State/Country"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '40px 0' }} />

            {/* Professional Information */}
            <div style={{ marginBottom: '40px' }}>
              <Title level={3} style={{ 
                color: '#1890ff', 
                marginBottom: '24px',
                textAlign: 'center',
                fontSize: '1.5rem'
              }}>
                <BankOutlined style={{ marginRight: '8px' }} /> 
                Professional Information
              </Title>
              
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="currentPosition"
                    label="Current Position"
                  >
                    <Input 
                      placeholder="Software Engineer"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="currentCompany"
                    label="Current Company"
                  >
                    <Input 
                      placeholder="ABC Tech Corp"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="experience"
                    label="Years of Experience"
                    rules={[{ required: true, message: 'Please select your experience level' }]}
                  >
                    <Select 
                      placeholder="Select experience level"
                      style={{ height: '48px' }}
                    >
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
                    <Input 
                      prefix={<span style={{color:"#1890ff"}}>₹</span>} 
                      placeholder="Enter the Expected Salary"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="education"
                    label="Highest Education"
                  >
                    <Select 
                      placeholder="Select education level"
                      style={{ height: '48px' }}
                    >
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
                    <Select 
                      placeholder="When can you start?"
                      style={{ height: '48px' }}
                    >
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
                  rows={4} 
                  placeholder="React, TypeScript, Node.js, AWS, etc."
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </div>

            <Divider style={{ margin: '40px 0' }} />

            {/* Application Details */}
            <div style={{ marginBottom: '40px' }}>
              <Title level={3} style={{ 
                color: '#1890ff', 
                marginBottom: '24px',
                textAlign: 'center',
                fontSize: '1.5rem'
              }}>
                <FileTextOutlined style={{ marginRight: '8px' }} /> 
                Application Details
              </Title>
              
              <Form.Item
                name="resume"
                label="Resume/CV"
              >
                <Upload {...uploadProps}>
                  <Button 
                    icon={<UploadOutlined />}
                    size="large"
                    style={{
                      borderRadius: '8px',
                      height: '48px',
                      borderStyle: 'dashed'
                    }}
                  >
                    Upload Resume (PDF, DOC, DOCX)
                  </Button>
                </Upload>
              </Form.Item>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="portfolioUrl"
                    label="Portfolio URL"
                  >
                    <Input 
                      prefix={<LinkOutlined style={{ color: '#1890ff' }} />} 
                      placeholder="https://yourportfolio.com"
                      style={{ borderRadius: '8px', height: '48px' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="linkedinUrl"
                    label="LinkedIn Profile"
                  >
                    <Input 
                      prefix={<LinkOutlined style={{ color: '#1890ff' }} />} 
                      placeholder="https://linkedin.com/in/yourprofile"
                      style={{ borderRadius: '8px', height: '48px' }}
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
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                loading={loading}
                style={{ 
                  width: '300px', 
                  height: '56px',
                  borderRadius: '28px',
                  fontSize: '18px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                }}
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>

            <Alert
              message="Your Privacy Matters"
              description="All information provided will be kept confidential and used solely for recruitment purposes."
              type="info"
              showIcon
              style={{ 
                marginTop: '32px',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            />
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default JobApplicationPage;