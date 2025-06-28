import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Space, 
  Typography, 
  Divider, 
  FloatButton,
  Drawer,
  Avatar,
  message,
  InputNumber
} from 'antd';
import { 
  PlusOutlined, 
  RobotOutlined, 
  SendOutlined, 
  SaveOutlined,
  DollarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  FileTextOutlined,
  BulbOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const JobDescriptionPage = ({ userRole }) => {
  const [form] = Form.useForm();
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      type: 'bot',
      message: 'Hi! I\'m your AI assistant. I can help you create professional job descriptions. Try asking me: "Generate a job description for a Frontend Developer" or "What skills should I include for a Data Scientist role?"'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Dummy data for dropdowns
  const departments = [
    'Engineering', 'Product', 'Design', 'Marketing', 
    'Sales', 'HR', 'Finance', 'Operations'
  ];

  const locations = [
    'Remote', 'New York, NY', 'San Francisco, CA', 
    'London, UK', 'Berlin, Germany', 'Bangalore, India'
  ];

  const experienceLevels = [
    'Entry Level (0-2 years)',
    'Mid Level (2-5 years)', 
    'Senior Level (5-8 years)',
    'Lead Level (8+ years)',
    'Executive Level'
  ];

  const employmentTypes = [
    'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'
  ];

  // Handle skill addition
  const handleSkillAdd = () => {
    if (inputValue && skills.indexOf(inputValue) === -1) {
      setSkills([...skills, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleSkillRemove = (removedSkill) => {
    setSkills(skills.filter(skill => skill !== removedSkill));
  };

  // Handle AI chat
  const handleAiSend = () => {
    if (!chatInput.trim()) return;

    // Add user message
    const newMessages = [...chatMessages, { type: 'user', message: chatInput }];
    setChatMessages(newMessages);

    // Simulate AI response (replace with actual ChatGPT API call)
    setTimeout(() => {
      let aiResponse = '';
      const input = chatInput.toLowerCase();
      
      if (input.includes('frontend') || input.includes('react')) {
        aiResponse = `Here's a suggested job description for a Frontend Developer:

**Title:** Senior Frontend Developer
**Key Responsibilities:**
• Develop responsive web applications using React, HTML5, CSS3
• Collaborate with designers to implement pixel-perfect UI
• Optimize applications for maximum speed and scalability
• Write clean, maintainable, and well-documented code

**Required Skills:** React, JavaScript, TypeScript, HTML5, CSS3, Git, REST APIs

Would you like me to help you refine any specific section?`;
      } else if (input.includes('data scientist')) {
        aiResponse = `For a Data Scientist role, consider these key qualifications:

**Must-have Skills:**
• Python/R programming
• Machine Learning algorithms
• SQL and database management
• Statistical analysis and hypothesis testing
• Data visualization (Tableau, PowerBI)

**Preferred Qualifications:**
• PhD/Master's in Statistics, Computer Science, or related field
• Experience with cloud platforms (AWS, GCP, Azure)
• Deep learning frameworks (TensorFlow, PyTorch)

Would you like me to generate a complete job description?`;
      } else {
        aiResponse = `I can help you with job descriptions! Try asking me:
• "Generate a job description for [role]"
• "What skills are needed for [position]?"
• "Help me write responsibilities for [job title]"
• "What qualifications should I include?"

What specific role would you like help with?`;
      }

      setChatMessages(prev => [...prev, { type: 'bot', message: aiResponse }]);
    }, 1000);

    setChatInput('');
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate API call to save to Firestore
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Job description saved successfully!');
      console.log('Job Description Data:', { ...values, skills });
      
      // Reset form
      form.resetFields();
      setSkills([]);
    } catch (error) {
      message.error('Failed to save job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'transparent' // Remove animated background
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <Card 
          style={{ 
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                <FileTextOutlined style={{ marginRight: '12px' }} />
                Create Job Description
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Design comprehensive job descriptions with AI assistance
              </Text>
            </Col>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  icon={<BulbOutlined />}
                  onClick={() => setAiChatOpen(true)}
                  style={{
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  Get AI Help
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <Card 
          style={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ padding: '24px' }}
          >
            <Row gutter={[32, 24]}>
              {/* Left Column - Basic Information */}
              <Col xs={24} lg={12}>
                <Title level={4} style={{ color: '#1890ff', marginBottom: '24px' }}>
                  <TeamOutlined style={{ marginRight: '8px' }} />
                  Basic Information
                </Title>

                <Form.Item
                  label="Job Title"
                  name="jobTitle"
                  rules={[{ required: true, message: 'Please enter job title' }]}
                >
                  <Input 
                    size="large" 
                    placeholder="e.g., Senior Frontend Developer"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Department"
                      name="department"
                      rules={[{ required: true, message: 'Please select department' }]}
                    >
                      <Select 
                        size="large" 
                        placeholder="Select Department"
                        style={{ borderRadius: '8px' }}
                      >
                        {departments.map(dept => (
                          <Option key={dept} value={dept}>{dept}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Location"
                      name="location"
                      rules={[{ required: true, message: 'Please select location' }]}
                    >
                      <Select 
                        size="large" 
                        placeholder="Select Location"
                      >
                        {locations.map(loc => (
                          <Option key={loc} value={loc}>
                            <EnvironmentOutlined style={{ marginRight: '8px' }} />
                            {loc}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Employment Type"
                      name="employmentType"
                      rules={[{ required: true, message: 'Please select employment type' }]}
                    >
                      <Select size="large" placeholder="Select Type">
                        {employmentTypes.map(type => (
                          <Option key={type} value={type}>
                            <ClockCircleOutlined style={{ marginRight: '8px' }} />
                            {type}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Experience Level"
                      name="experienceLevel"
                      rules={[{ required: true, message: 'Please select experience level' }]}
                    >
                      <Select size="large" placeholder="Select Level">
                        {experienceLevels.map(level => (
                          <Option key={level} value={level}>
                            <StarOutlined style={{ marginRight: '8px' }} />
                            {level}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* Skills Section */}
                <Form.Item label="Required Skills">
                  <div style={{ marginBottom: '16px' }}>
                    {skills.map(skill => (
                      <Tag
                        key={skill}
                        closable
                        onClose={() => handleSkillRemove(skill)}
                        style={{ 
                          marginBottom: '8px',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        {skill}
                      </Tag>
                    ))}
                    {inputVisible ? (
                      <Input
                        type="text"
                        size="small"
                        style={{ width: '120px' }}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleSkillAdd}
                        onPressEnter={handleSkillAdd}
                        autoFocus
                      />
                    ) : (
                      <Tag
                        onClick={() => setInputVisible(true)}
                        style={{
                          background: '#f0f0f0',
                          borderStyle: 'dashed',
                          cursor: 'pointer'
                        }}
                      >
                        <PlusOutlined /> Add Skill
                      </Tag>
                    )}
                  </div>
                </Form.Item>

                {/* Salary Range */}
                <Form.Item label="Salary Range (Optional)">
                  <Row gutter={16}>
                    <Col xs={12}>
                      <Form.Item name="salaryMin" style={{ marginBottom: 0 }}>
                        <InputNumber
                          size="large"
                          placeholder="Min"
                          prefix={<DollarOutlined />}
                          style={{ width: '100%' }}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item name="salaryMax" style={{ marginBottom: 0 }}>
                        <InputNumber
                          size="large"
                          placeholder="Max"
                          prefix={<DollarOutlined />}
                          style={{ width: '100%' }}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              </Col>

              {/* Right Column - Detailed Information */}
              <Col xs={24} lg={12}>
                <Title level={4} style={{ color: '#1890ff', marginBottom: '24px' }}>
                  <FileTextOutlined style={{ marginRight: '8px' }} />
                  Detailed Information
                </Title>

                <Form.Item
                  label="Job Description"
                  name="description"
                  rules={[{ required: true, message: 'Please enter job description' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Provide a comprehensive overview of the role, company culture, and what makes this position exciting..."
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  label="Key Responsibilities"
                  name="responsibilities"
                  rules={[{ required: true, message: 'Please enter responsibilities' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="• Develop and maintain web applications&#10;• Collaborate with cross-functional teams&#10;• Write clean, maintainable code&#10;• Participate in code reviews..."
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  label="Qualifications & Requirements"
                  name="qualifications"
                  rules={[{ required: true, message: 'Please enter qualifications' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="• Bachelor's degree in Computer Science or related field&#10;• 3+ years of experience with React/JavaScript&#10;• Strong problem-solving skills&#10;• Experience with modern development tools..."
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item label="Additional Benefits" name="benefits">
                  <TextArea
                    rows={3}
                    placeholder="• Competitive salary and equity&#10;• Health, dental, and vision insurance&#10;• Flexible working hours&#10;• Professional development opportunities..."
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Submit Button */}
            <Row justify="center">
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<SaveOutlined />}
                  style={{
                    background: 'linear-gradient(45deg, #1890ff 0%, #722ed1 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 48px',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  {loading ? 'Saving Job Description...' : 'Save Job Description'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* AI Assistant Float Button */}
        <FloatButton
          icon={<RobotOutlined />}
          type="primary"
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
          onClick={() => setAiChatOpen(true)}
          tooltip="AI Assistant - Get help with job descriptions"
        />

        {/* AI Chat Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                icon={<RobotOutlined />} 
                style={{ 
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  marginRight: '12px'
                }} 
              />
              <span>AI Job Description Assistant</span>
            </div>
          }
          placement="right"
          width={400}
          open={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          styles={{
            body: { padding: 0 }
          }}
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              background: '#f5f5f5'
            }}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: msg.type === 'user' 
                        ? 'linear-gradient(45deg, #1890ff 0%, #722ed1 100%)'
                        : 'white',
                      color: msg.type === 'user' ? 'white' : '#333',
                      whiteSpace: 'pre-line',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div style={{ 
              padding: '16px', 
              borderTop: '1px solid #f0f0f0',
              background: 'white'
            }}>
              <Row gutter={8}>
                <Col flex={1}>
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask me to help with job descriptions..."
                    onPressEnter={handleAiSend}
                    size="large"
                    style={{ borderRadius: '8px' }}
                  />
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleAiSend}
                    size="large"
                    style={{
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                </Col>
              </Row>
            </div>
          </div>
        </Drawer>
      </div>
    </div>
  );
};

export default JobDescriptionPage;