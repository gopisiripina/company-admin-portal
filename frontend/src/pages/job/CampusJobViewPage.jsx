import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Tag, 
  Space, 
  Row, 
  Col,
  Alert,
  List,
  Avatar,
  Spin,
  Modal,
  Form,
  Input,
  message,
  Tooltip,
  Breadcrumb,
  Affix,
  Upload,
  Button 
} from 'antd';
import { 
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  StarOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  BankOutlined,
  UserOutlined,
  CalendarOutlined,
  SendOutlined,
  HomeOutlined,
  BookOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  UploadOutlined 
} from '@ant-design/icons';
import { supabase } from '../../supabase/config';
import { FaIndianRupeeSign } from "react-icons/fa6";
const { Title, Text, Paragraph } = Typography;

const CampusJobViewPage = () => {
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `oncampusresumes/${fileName}`;

  const { data, error } = await supabase.storage
    .from('oncampusresumes') // Your storage bucket name
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('oncampusresumes')
    .getPublicUrl(filePath);

  return publicUrl;
};
  const handleFormSubmit = async (values) => {
  setSubmitting(true);
  try {
    let resumeUrl = '';
    
    if (fileList.length > 0) {
      setUploading(true);
      resumeUrl = await handleFileUpload(fileList[0].originFileObj);
      setUploading(false);
    }

    const { data, error } = await supabase
      .from('campus_job_applications')
      .insert([{
        link_id: jobData.linkId,
        job_id: jobData.jobId,
        student_name: values.name,
        email: values.email,
        mobile: values.mobile,
        roll_no: values.roll_no,
        college_name: jobData.college_name,
        resume_url: resumeUrl, // Store the storage URL
      }]);

    if (error) {
        console.error('Application error:', error);
        message.error('Submission failed. Please try again.');
      } else {
        message.success('Application submitted successfully!');
        setModalVisible(false);
        form.resetFields();
      }
    } catch (err) {
      console.error(err);
      message.error('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
     console.log('All URL params:', Object.fromEntries(urlParams));
    const extractedData = {
      linkId: urlParams.get('link_id'),
      jobId: urlParams.get('job_id'),
      title: urlParams.get('title'),
      company: urlParams.get('company'),
      college_name: decodeURIComponent(urlParams.get('college_name') || ''),
      department: urlParams.get('department'),
      location: urlParams.get('location'),
      employmentType: urlParams.get('employment_type'),
      experienceLevel: urlParams.get('experience_level'),
      salaryRange: urlParams.get('salary_range'),
      jobDescription: urlParams.get('job_description'),
      keyResponsibilities: urlParams.get('key_responsibilities'),
      qualificationRequirements: urlParams.get('qualification_requirements'),
      requiredSkills: urlParams.get('required_skills'),
      additionalBenefits: urlParams.get('additional_benefits'),
      createdAt: urlParams.get('created_at')
    };
     console.log('Extracted college_name:', extractedData.college_name);
    if (!extractedData.linkId || !extractedData.jobId || !extractedData.title) {
      setError('Invalid job link. Please contact the company for a valid link.');
      setLoading(false);
      return;
    }

    if (extractedData.requiredSkills) {
      extractedData.skillsArray = extractedData.requiredSkills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }

    setJobData(extractedData);
    setLoading(false);
  }, []);

  const formatResponsibilities = (responsibilities) => {
    if (!responsibilities) return [];
    return responsibilities.split('\n').filter(item => item.trim());
  };

  const formatQualifications = (qualifications) => {
    if (!qualifications) return [];
    return qualifications.split('\n').filter(item => item.trim());
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '0 16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>Loading job details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg,rgb(0, 102, 255) 0%, #c3cfe2 100%)',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: '90%', width: '100%', textAlign: 'center' }}>
          <Alert
            message="Invalid Job Link"
            description={error}
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  const cardStyle = {
    marginBottom: '16px',
    background: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease'
  };

  const sectionTitleStyle = {
    color: '#1890ff',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '12px'
  };

  return (
    <div style={{ 
      // left:'20%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative',
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header with breadcrumb */}
      <div style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e8e8e8',
        padding: '12px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        width: '100%',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          width: '100%',
          margin: '0 auto', 
          padding: '0 16px',
          overflow: 'hidden'
        }}>
          
        </div>
      </div>

      <div style={{ 
        width: '100%',
        padding: '20px 16px',
        maxWidth: '1200px',
        boxSizing: 'border-box'
      }}>
        {/* Hero Section */}
        <Card style={{ ...cardStyle, marginBottom: '20px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6} md={4} lg={3} style={{ textAlign: 'center' }}>
              <Avatar 
                size={64} 
                icon={<BankOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  fontSize: '24px'
                }}
              />
            </Col>
            <Col xs={24} sm={18} md={20} lg={21}>
              <div>
                <Title level={2} style={{ 
  margin: '0 0 8px 0', 
  color: '#262626',
  fontSize: 'clamp(20px, 4vw, 28px)',
  lineHeight: '1.2'
}}>
  {jobData.title}
  {jobData.college_name && jobData.college_name.trim() !== '' && (
    <Text style={{ 
      color: '#666', 
      fontSize: '16px', 
      fontWeight: 400,
      marginLeft: '8px' 
    }}>
      - {jobData.college_name}
    </Text>
  )}
</Title>
                <Title level={4} style={{ 
                  margin: '0 0 12px 0', 
                  color: '#1890ff',
                  fontWeight: 500,
                  fontSize: 'clamp(16px, 3vw, 20px)',
                  lineHeight: '1.3'
                }}>
                </Title>
                
                {/* Job Tags */}
                <div style={{ marginBottom: '16px' }}>
                  <Space wrap size={[6, 6]}>
                    {jobData.department && (
                      <Tag icon={<TeamOutlined />} color="blue" style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        lineHeight: '1.2'
                      }}>
                        {jobData.department}
                      </Tag>
                    )}
                    {jobData.location && (
                      <Tag icon={<EnvironmentOutlined />} color="green" style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        lineHeight: '1.2'
                      }}>
                        {jobData.location}
                      </Tag>
                    )}
                    {jobData.employmentType && (
                      <Tag icon={<ClockCircleOutlined />} color="orange" style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        lineHeight: '1.2'
                      }}>
                        {jobData.employmentType}
                      </Tag>
                    )}
                    {jobData.experienceLevel && (
                      <Tag icon={<StarOutlined />} color="purple" style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        lineHeight: '1.2'
                      }}>
                        {jobData.experienceLevel}
                      </Tag>
                    )}
                    {jobData.salaryRange && (
                      <Tag icon={<FaIndianRupeeSign />} color="gold" style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        lineHeight: '1.2'
                      }}>
                        {jobData.salaryRange}
                      </Tag>
                    )}
                  </Space>
                </div>

                {/* Apply Button */}
                
              </div>
            </Col>
          </Row>

          <Alert
            message="🎓 Campus Hiring Opportunity"
            description="This is an exclusive opportunity for college students and recent graduates. Please ensure you meet the eligibility criteria before applying."
            type="info"
            showIcon
            style={{ 
              marginTop: '16px',
              borderRadius: '6px',
              border: '1px solid #1890ff20',
              backgroundColor: '#f0f8ff'
            }}
          />
        </Card>

        {/* Main Content Grid */}
        <Row gutter={[16, 16]}>
          {/* Left Column - Job Details */}
          <Col xs={24} lg={16}>
            {/* Job Description */}
            <Card title={
              <div style={sectionTitleStyle}>
                <UserOutlined style={{ marginRight: '6px' }} />
                Job Description
              </div>
            } style={cardStyle}>
              <Paragraph style={{ 
                fontSize: '14px', 
                lineHeight: '1.6',
                color: '#595959',
                marginBottom: 0,
                wordBreak: 'break-word'
              }}>
                {jobData.jobDescription || 'No job description provided.'}
              </Paragraph>
            </Card>

            {/* Key Responsibilities */}
            {jobData.keyResponsibilities && (
              <Card title={
                <div style={sectionTitleStyle}>
                  <CheckCircleOutlined style={{ marginRight: '6px' }} />
                  Key Responsibilities
                </div>
              } style={cardStyle}>
                <List
                  dataSource={formatResponsibilities(jobData.keyResponsibilities)}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: '8px 0', border: 'none' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        width: '100%',
                        gap: '8px'
                      }}>
                        <CheckCircleOutlined style={{ 
                          color: '#52c41a', 
                          marginTop: '2px',
                          fontSize: '14px',
                          flexShrink: 0
                        }} />
                        <Text style={{ 
                          fontSize: '14px', 
                          lineHeight: '1.5', 
                          color: '#595959',
                          wordBreak: 'break-word',
                          flex: 1
                        }}>
                          {item}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Qualification Requirements */}
            {jobData.qualificationRequirements && (
              <Card title={
                <div style={sectionTitleStyle}>
                  <CalendarOutlined style={{ marginRight: '6px' }} />
                  Qualification Requirements
                </div>
              } style={cardStyle}>
                <List
                  dataSource={formatQualifications(jobData.qualificationRequirements)}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: '8px 0', border: 'none' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        width: '100%',
                        gap: '8px'
                      }}>
                        <CheckCircleOutlined style={{ 
                          color: '#1890ff', 
                          marginTop: '2px',
                          fontSize: '14px',
                          flexShrink: 0
                        }} />
                        <Text style={{ 
                          fontSize: '14px', 
                          lineHeight: '1.5', 
                          color: '#595959',
                          wordBreak: 'break-word',
                          flex: 1
                        }}>
                          {item}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Additional Benefits */}
            {jobData.additionalBenefits && (
              <Card title={
                <div style={sectionTitleStyle}>
                  <GiftOutlined style={{ marginRight: '6px' }} />
                  Additional Benefits
                </div>
              } style={cardStyle}>
                <Paragraph style={{ 
                  fontSize: '14px', 
                  lineHeight: '1.6',
                  color: '#595959',
                  marginBottom: 0,
                  wordBreak: 'break-word'
                }}>
                  {jobData.additionalBenefits}
                </Paragraph>
              </Card>
            )}
          </Col>

          {/* Right Column - Sidebar */}
          <Col xs={24} lg={8}>
            {/* Required Skills */}
            {jobData.skillsArray && jobData.skillsArray.length > 0 && (
              <Card title={
                <div style={sectionTitleStyle}>
                  <StarOutlined style={{ marginRight: '6px' }} />
                  Required Skills
                </div>
              } style={cardStyle}>
                <Space wrap size={[6, 6]} style={{ width: '100%' }}>
                  {jobData.skillsArray.map((skill, index) => (
                    <Tag 
                      key={index} 
                      color="processing" 
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#f0f8ff',
                        color: '#1890ff',
                        wordBreak: 'break-word'
                      }}
                    >
                      {skill}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* Quick Apply Card */}
            <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <Title level={5} style={{ 
                  color: 'white', 
                  marginBottom: '12px',
                  fontSize: 'clamp(14px, 2.5vw, 16px)'
                }}>
                  Ready to Apply?
                </Title>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  display: 'block', 
                  marginBottom: '16px', 
                  fontSize: '13px',
                  wordBreak: 'break-word'
                }}>
                  Join our team and kickstart your career with us!
                </Text>
                <Button 
                  type="default" 
                  size="middle" 
                  icon={<SendOutlined />}
                  onClick={() => setModalVisible(true)}
                  style={{ 
                    borderRadius: '6px',
                    height: '36px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: 'white',
                    borderColor: 'white',
                    color: '#1890ff',
                    minWidth: '120px'
                  }}
                >
                  Apply Now
                </Button>
              </div>
            </Card>

            {/* Application Instructions */}
            <Card title={
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ marginRight: '6px' }} />
                Application Process
              </div>
            } style={cardStyle}>
              <div style={{ fontSize: '13px', color: '#595959', lineHeight: '1.5' }}>
                <p style={{ marginBottom: '8px', wordBreak: 'break-word' }}>
                  📋 <strong>Step 1:</strong> Fill out the application form
                </p>
                <p style={{ marginBottom: '8px', wordBreak: 'break-word' }}>
                  📎 <strong>Step 2:</strong> Upload your resume
                </p>
                <p style={{ marginBottom: '8px', wordBreak: 'break-word' }}>
                  📧 <strong>Step 3:</strong> Wait for confirmation email
                </p>
                <p style={{ marginBottom: '0', wordBreak: 'break-word' }}>
                  🎯 <strong>Step 4:</strong> Prepare for the interview
                </p>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px',
          padding: '16px',
          borderTop: '1px solid #e8e8e8',
          backgroundColor: 'rgba(255,255,255,0.8)',
          borderRadius: '8px'
        }}>
          <Text type="secondary" style={{ 
            fontSize: '12px',
            wordBreak: 'break-word'
          }}>
            © {new Date().getFullYear()} {jobData.company}. All rights reserved.
          </Text>
        </div>
      </div>

      {/* Application Modal */}
      <Modal
        title={
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#1890ff',
            wordBreak: 'break-word'
          }}>
            <SendOutlined style={{ marginRight: '6px' }} />
            Apply for {jobData.title}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting || uploading}
        okText="Submit Application"
        cancelText="Cancel"
        width="95%"
        style={{ 
          top: 20,
          maxWidth: '800px',
          margin: '0 auto'
        }}
       styles={{ body: { padding: '24px' } }}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleFormSubmit}
          style={{ marginTop: '16px' }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item 
                label="Full Name" 
                name="name" 
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  size="large"
                  placeholder="Enter your full name"
                  style={{ borderRadius: '6px' }}
                />
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
                <Input 
                  prefix={<MailOutlined />}
                  size="large"
                  placeholder="Enter your email address"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item 
                label="Mobile Number" 
                name="mobile" 
                rules={[{ required: true, message: 'Please enter your mobile number' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />}
                  size="large"
                  placeholder="Enter your mobile number"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
  <Form.Item 
    label="Roll Number" 
    name="roll_no" 
    rules={[{ required: true, message: 'Please enter your roll number' }]}
  >
    <Input 
      prefix={<BookOutlined />}
      size="large"
      placeholder="Enter your roll number"
      style={{ borderRadius: '6px' }}
    />
  </Form.Item>
</Col>
            <Col xs={24} md={12}>
  <Form.Item label="College Name">
    <Input 
  prefix={<BookOutlined />}
  size="large"
  value={jobData.college_name}
  disabled
  style={{ borderRadius: '6px', backgroundColor: '#f5f5f5' }}
/>
  </Form.Item>
</Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24}>
  <Form.Item 
    label="Resume Upload" 
    name="resume_file"
    help="Please upload your resume (PDF, DOC, DOCX - Max 5MB)"
    rules={[{ required: true, message: 'Please upload your resume' }]}
  >
    <Upload
      fileList={fileList}
      beforeUpload={() => false} // Prevent auto upload
      onChange={({ fileList }) => setFileList(fileList)}
      accept=".pdf,.doc,.docx"
      maxCount={1}
    >
      <Button icon={<UploadOutlined />} size="large">
        Select Resume File
      </Button>
    </Upload>
  </Form.Item>
</Col>
          </Row>
        </Form>
      </Modal>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Affix offsetBottom={20}>
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            zIndex: 1000
          }}>
            <Tooltip title="Back to Top">
              <Button
                type="primary"
                shape="circle"
                icon={<ArrowUpOutlined />}
                onClick={scrollToTop}
                style={{
                  width: '44px',
                  height: '44px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              />
            </Tooltip>
          </div>
        </Affix>
      )}
    </div>
  );
};

export default CampusJobViewPage;