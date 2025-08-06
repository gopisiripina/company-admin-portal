import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Row, 
  Col,
  Typography, 
  message,
  Upload,
  Select,
  Space,
  Divider,
  Tag,
  Steps,
  Result
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  EnvironmentOutlined,
  BookOutlined,
  FileTextOutlined,
  SendOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  StarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabase/config';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CandidateApplicationForm = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('direct_recruitment')
        .select('job_id, job_title, department, location, experience, description')
        .eq('job_id', jobId)
        .is('candidate_id', null)
        .single();

      if (error) throw error;
      
      setJobDetails({
        id: data.job_id,
        title: data.job_title,
        department: data.department,
        location: data.location,
        experience: data.experience,
        description: data.description
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      message.error('Job not found or no longer available');
      navigate('/');
    }
  };

  const handleSkillsChange = (value) => {
    setSkills(value);
  };

const handleSubmit = async (values) => {
  setLoading(true);
  try {
    const candidateId = `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // First check if candidate already applied for this job
    const { data: existingApplication, error: checkError } = await supabase
      .from('direct_recruitment')
      .select('candidate_id')
      .eq('job_id', jobId)
      .eq('email', values.email)
      .not('candidate_id', 'is', null);

    if (checkError) throw checkError;
    
    if (existingApplication && existingApplication.length > 0) {
      message.error('You have already applied for this position!');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('direct_recruitment')
      .insert([{
        candidate_id: candidateId,
        job_id: jobId, // Same job_id as the job posting
        job_title: jobDetails.title,
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        candidate_experience: values.experience,
        current_company: values.currentCompany,
        current_designation: values.currentDesignation,
        notice_period: values.noticePeriod,
        current_location: values.currentLocation,
        preferred_location: values.preferredLocation,
        education: values.education,
        skills: skills,
        linkedin: values.linkedin,
        expected_salary: values.expectedSalary,
        current_salary: values.currentSalary,
        candidate_status: 'applied',
        application_date: new Date().toISOString(),
        // Leave job-specific fields null for candidate records
        job_status: null,
        department: null,
        location: null,
        experience: null,
        description: null,
        applications_count: null,
        shareable_link: null,
        job_created_at: null
      }])
      .select();

    if (error) throw error;

    // Update applications count for the job posting
    const { error: updateError } = await supabase
      .rpc('increment_application_count', { job_id_param: jobId });

    if (updateError) console.warn('Error updating application count:', updateError);

    setSubmitted(true);
    message.success('Application submitted successfully!');
    
  } catch (error) {
    console.error('Error submitting application:', error);
    message.error('Failed to submit application. Please try again.');
  } finally {
    setLoading(false);
  }
};

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{ maxWidth: '600px', width: '100%', textAlign: 'center', borderRadius: '16px' }}>
          <Result
            status="success"
            title="Application Submitted Successfully!"
            subTitle={`Thank you for applying to ${jobDetails?.title}. We have received your application and will get back to you soon.`}
           
          />
        </Card>
      </div>
    );
  }

  if (!jobDetails) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading job details...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <Card 
          style={{ 
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #0D7139 0%, #4ead1fff 100%)',
            border: 'none',
            borderRadius: '16px',
            textAlign: 'center'
          }}
        >
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            {jobDetails.title}
          </Title>
          <div style={{ marginTop: '16px' }}>
            <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none', fontSize: '14px' }}>
              {jobDetails.department}
            </Tag>
            <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none', fontSize: '14px' }}>
              {jobDetails.location}
            </Tag>
            <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none', fontSize: '14px' }}>
              {jobDetails.experience}
            </Tag>
          </div>
        </Card>

        {/* Application Steps */}
        <Card style={{ marginBottom: '30px', borderRadius: '16px' }}>
          <Steps
            current={0}
            items={[
              {
                title: 'Fill Application',
                description: 'Complete your details',
                icon: <FileTextOutlined />
              },
              
            ]}
          />
        </Card>

        {/* Application Form */}
        <Card style={{ borderRadius: '16px' }}>
          <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
            <UserOutlined style={{ marginRight: '12px' }} />
            Application Form
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            {/* Personal Information */}
            <Divider orientation="left">
              <Text strong style={{ color: '#0D7139' }}>Personal Information</Text>
            </Divider>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Full Name"
                  name="fullName"
                  rules={[{ required: true, message: 'Please enter your full name' }]}
                >
                  <Input placeholder="Enter your full name" prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input placeholder="Enter your email" prefix={<MailOutlined />} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Phone Number"
                  name="phone"
                  rules={[{ required: true, message: 'Please enter your phone number' }]}
                >
                  <Input placeholder="Enter your phone number" prefix={<PhoneOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="LinkedIn Profile"
                  name="linkedin"
                >
                  <Input placeholder="LinkedIn profile URL (optional)" />
                </Form.Item>
              </Col>
            </Row>

            {/* Professional Information */}
            <Divider orientation="left">
              <Text strong style={{ color: '#0D7139' }}>Professional Information</Text>
            </Divider>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Total Experience"
                  name="experience"
                  rules={[{ required: false, message: 'Please enter your experience' }]}
                >
                  <Input placeholder="e.g., 3 Years 6 Months" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Current Company"
                  name="currentCompany"
                  rules={[{ required: false, message: 'Please enter your current company' }]}
                >
                  <Input placeholder="Current company name" prefix={<BankOutlined />} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Current Designation"
                  name="currentDesignation"
                  rules={[{ required: false, message: 'Please enter your current designation' }]}
                >
                  <Input placeholder="Current job title" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Notice Period"
                  name="noticePeriod"
                  rules={[{ required: false, message: 'Please select notice period' }]}
                >
                  <Select placeholder="Select notice period">
                    <Option value="Immediate">Immediate</Option>
                    <Option value="15 Days">15 Days</Option>
                    <Option value="1 Month">1 Month</Option>
                    <Option value="2 Months">2 Months</Option>
                    <Option value="3 Months">3 Months</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Location & Education */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Current Location"
                  name="currentLocation"
                  rules={[{ required: true, message: 'Please enter your current location' }]}
                >
                  <Input placeholder="Current city" prefix={<EnvironmentOutlined />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Preferred Location"
                  name="preferredLocation"
                  rules={[{ required: false, message: 'Please enter preferred location' }]}
                >
                  <Input placeholder="Preferred work location" prefix={<EnvironmentOutlined />} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Education"
              name="education"
              rules={[{ required: true, message: 'Please enter your education details' }]}
            >
              <Input placeholder="e.g., B.Tech in Computer Science" prefix={<BookOutlined />} />
            </Form.Item>

            {/* Skills */}
            <Form.Item
              label="Key Skills"
              rules={[{ required: true, message: 'Please add at least one skill' }]}
            >
              <Select
                mode="tags"
                placeholder="Type and press Enter to add skills"
                onChange={handleSkillsChange}
                tokenSeparators={[',']}
                style={{ width: '100%' }}
              >
                <Option value="React.js">React.js</Option>
                <Option value="Node.js">Node.js</Option>
                <Option value="JavaScript">JavaScript</Option>
                <Option value="Python">Python</Option>
                <Option value="Java">Java</Option>
                <Option value="SQL">SQL</Option>
              </Select>
            </Form.Item>

            {/* Salary Information */}
            <Divider orientation="left">
              <Text strong style={{ color: '#0D7139' }}>Salary Information</Text>
            </Divider>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Current Salary (Annual CTC)"
                  name="currentSalary"
                  rules={[{ required: false, message: 'Please enter current salary' }]}
                >
                  <Input placeholder="e.g., 8 LPA" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Expected Salary (Annual CTC)"
                  name="expectedSalary"
                  rules={[{ required: false, message: 'Please enter expected salary' }]}
                >
                  <Input placeholder="e.g., 12 LPA" />
                </Form.Item>
              </Col>
            </Row>

            {/* Submit Button */}
            <Form.Item style={{ textAlign: 'center', marginTop: '40px' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<SendOutlined />}
                style={{
                  background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  minWidth: '200px'
                }}
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CandidateApplicationForm;