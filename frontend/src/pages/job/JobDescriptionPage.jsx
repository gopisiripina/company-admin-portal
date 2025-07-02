import React, { useState, useEffect } from 'react';
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
  InputNumber,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  RobotOutlined, 
  SendOutlined, 
  SaveOutlined,
  BankOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  FileTextOutlined,
  BulbOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

// Supabase configuration
const supabaseUrl = 'https://dsvqjsnxdxlgufzwcaub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdnFqc254ZHhsZ3VmendjYXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjgyMjMsImV4cCI6MjA2NjQwNDIyM30.YHdiWzPvU6XBXFzcDZL7LKtgjU_dv5pVVpFRF8OkEz8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const [aiLoading, setAiLoading] = useState(false);

  // Dynamic data states
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [experienceLevels, setExperienceLevels] = useState([]);

  // Function to convert text to title case (capitalize first letter of each word)
  const toTitleCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Load dynamic data from Supabase on component mount
  useEffect(() => {
    loadDynamicData();
  }, []);

  const loadDynamicData = async () => {
    try {
      // Load departments
      const { data: deptData } = await supabase
        .from('job_descriptions')
        .select('department')
        .not('department', 'is', null);
      
      const uniqueDepartments = [...new Set(deptData?.map(item => item.department).filter(Boolean))];
      setDepartments(uniqueDepartments.length > 0 ? uniqueDepartments : [
        'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'
      ]);

      // Load locations
      const { data: locData } = await supabase
        .from('job_descriptions')
        .select('location')
        .not('location', 'is', null);
      
      const uniqueLocations = [...new Set(locData?.map(item => item.location).filter(Boolean))];
      setLocations(uniqueLocations.length > 0 ? uniqueLocations : [
        'Remote', 'Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Delhi, NCR', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Pune, Maharashtra'
      ]);

      // Load employment types
      const { data: empData } = await supabase
        .from('job_descriptions')
        .select('employment_type')
        .not('employment_type', 'is', null);
      
      const uniqueEmpTypes = [...new Set(empData?.map(item => item.employment_type).filter(Boolean))];
      setEmploymentTypes(uniqueEmpTypes.length > 0 ? uniqueEmpTypes : [
        'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'
      ]);

      // Load experience levels
      const { data: expData } = await supabase
        .from('job_descriptions')
        .select('experience_level')
        .not('experience_level', 'is', null);
      
      const uniqueExpLevels = [...new Set(expData?.map(item => item.experience_level).filter(Boolean))];
      setExperienceLevels(uniqueExpLevels.length > 0 ? uniqueExpLevels : [
        'Entry Level (0-2 years)', 'Mid Level (2-5 years)', 'Senior Level (5-8 years)', 
        'Lead Level (8+ years)', 'Executive Level'
      ]);

    } catch (error) {
      console.error('Error loading dynamic data:', error);
      // Set default values if error occurs
      setDepartments(['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']);
      setLocations(['Remote', 'Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Delhi, NCR', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Pune, Maharashtra']);
      setEmploymentTypes(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']);
      setExperienceLevels(['Entry Level (0-2 years)', 'Mid Level (2-5 years)', 'Senior Level (5-8 years)', 'Lead Level (8+ years)', 'Executive Level']);
    }
  };

  // Handle skill addition with title case
  const handleSkillAdd = () => {
    if (inputValue && skills.indexOf(toTitleCase(inputValue)) === -1) {
      setSkills([...skills, toTitleCase(inputValue)]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleSkillRemove = (removedSkill) => {
    setSkills(skills.filter(skill => skill !== removedSkill));
  };

  // AI Job Description Generator
  const generateJobDescriptionWithAI = async () => {
    const jobTitle = form.getFieldValue('jobTitle');
    
    if (!jobTitle) {
      message.warning('Please enter a job title first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('open api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer chat gpt api key here'
        },
        body: JSON.stringify({
          model: 'model name here',
          messages: [
             {"role": "system", "content": "You are a helpful assistant that writes professional job descriptions."},
                  {"role": "user", "content": `{jobTitle: "${jobTitle}"}`},
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const generatedDescription = data.choices[0].message.content;
        
        form.setFieldsValue({
          description: generatedDescription
        });
        message.success('Job description generated successfully!');
      } else {
        throw new Error('Failed to generate job description');
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      message.error('Failed to generate job description. Please try again.');
    } finally {
      setAiLoading(false);
    }
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

  // Handle form submission to Supabase
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const jobData = {
        job_title: toTitleCase(values.jobTitle),
        department: toTitleCase(values.department),
        location: toTitleCase(values.location),
        employment_type: toTitleCase(values.employmentType),
        experience_level: values.experienceLevel,
        job_description: values.description,
        key_responsibilities: values.responsibilities,
        qualification_requirements: values.qualifications,
        additional_benefits: values.benefits,
        required_skills: skills.join(', '),
        salary_range: values.salaryMin && values.salaryMax 
          ? `₹${values.salaryMin.toLocaleString()} - ₹${values.salaryMax.toLocaleString()}`
          : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('job_descriptions')
        .insert([jobData])
        .select();

      if (error) {
        throw error;
      }

      message.success('Job description saved successfully!');
      
      // Reset form
      form.resetFields();
      setSkills([]);
      
      // Reload dynamic data to include new entries
      loadDynamicData();
      
    } catch (error) {
      console.error('Error saving job description:', error);
      message.error('Failed to save job description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'transparent'
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
                    onChange={(e) => {
                      const titleCaseValue = toTitleCase(e.target.value);
                      form.setFieldsValue({ jobTitle: titleCaseValue });
                    }}
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
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Space style={{ padding: '0 8px 4px' }}>
                              <Input
                                placeholder="Add new department"
                                onPressEnter={e => {
                                  const value = toTitleCase(e.target.value.trim());
                                  if (value && !departments.includes(value)) {
                                    setDepartments([...departments, value]);
                                    form.setFieldsValue({ department: value });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </Space>
                          </div>
                        )}
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
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Space style={{ padding: '0 8px 4px' }}>
                              <Input
                                placeholder="Add new location"
                                onPressEnter={e => {
                                  const value = toTitleCase(e.target.value.trim());
                                  if (value && !locations.includes(value)) {
                                    setLocations([...locations, value]);
                                    form.setFieldsValue({ location: value });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </Space>
                          </div>
                        )}
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
                      <Select 
                        size="large" 
                        placeholder="Select Type"
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Space style={{ padding: '0 8px 4px' }}>
                              <Input
                                placeholder="Add new employment type"
                                onPressEnter={e => {
                                  const value = toTitleCase(e.target.value.trim());
                                  if (value && !employmentTypes.includes(value)) {
                                    setEmploymentTypes([...employmentTypes, value]);
                                    form.setFieldsValue({ employmentType: value });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </Space>
                          </div>
                        )}
                      >
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
                      <Select 
                        size="large" 
                        placeholder="Select Level"
                        dropdownRender={menu => (
                          <div>
                            {menu}
                            <Divider style={{ margin: '8px 0' }} />
                            <Space style={{ padding: '0 8px 4px' }}>
                              <Input
                                placeholder="Add new experience level"
                                onPressEnter={e => {
                                  const value = toTitleCase(e.target.value.trim());
                                  if (value && !experienceLevels.includes(value)) {
                                    setExperienceLevels([...experienceLevels, value]);
                                    form.setFieldsValue({ experienceLevel: value });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </Space>
                          </div>
                        )}
                      >
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

                {/* Salary Range in INR */}
                <Form.Item label="Salary Range in INR (Optional)">
                  <Row gutter={16}>
                    <Col xs={12}>
                      <Form.Item name="salaryMin" style={{ marginBottom: 0 }}>
                        <InputNumber
                          size="large"
                          placeholder="Min"
                          prefix="₹"
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
                          prefix="₹"
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
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Job Description</span>
                      <Button
                        type="text"
                        size="small"
                        shape="circle"
                        icon={aiLoading ? <Spin size="small" /> : <RobotOutlined />}
                        onClick={generateJobDescriptionWithAI}
                        loading={aiLoading}
                        style={{
                          color: '#667eea',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          border: '1px solid rgba(102, 126, 234, 0.3)'
                        }}
                        title="Generate with AI"
                      />
                    </div>
                  }
                  name="description"
                  rules={[{ required: true, message: 'Please enter job description' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Click the AI button above to generate or enter your job description manually..."
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
                    placeholder="• Competitive salary and equity&#10;• Health insurance and medical benefits&#10;• Flexible working hours&#10;• Professional development opportunities..."
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