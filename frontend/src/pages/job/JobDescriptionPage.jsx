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
  Spin,

  
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

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
import { useLocation } from 'react-router-dom';
  import { supabase} from '../../supabase/config';
import ErrorPage from '../../error/ErrorPage';


const JobDescriptionPage = ({ userRole,location: propLocation  }) => {
  const [hiringType, setHiringType] = useState('off-campus');
  const [colleges, setColleges] = useState([]);
   const location = useLocation();
   const editData = location.state?.editData;
  const isEditing = location.state?.isEditing;

  
  const [form] = Form.useForm();
  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole!=='hr') {
    return <ErrorPage errorType="403" />;
  }
  // Add animation state
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
useEffect(() => {
  if (location?.state?.editData) {
    const jobData = location.state.editData;
    
    // Extract min/max salary from range if exists
    let salaryMin, salaryMax;
    if (jobData.salary_range) {
      const salaryRange = jobData.salary_range.match(/\d+/g) || [];
      salaryMin = salaryRange[0] ? parseInt(salaryRange[0].replace(/,/g, '')) : undefined;
      salaryMax = salaryRange[1] ? parseInt(salaryRange[1].replace(/,/g, '')) : undefined;
    }

    // Set form values
    form.setFieldsValue({
      jobTitle: jobData.job_title,
      department: jobData.department,
      location: jobData.location,
      employmentType: jobData.employment_type,
      experienceLevel: jobData.experience_level,
      description: jobData.job_description,
      responsibilities: jobData.key_responsibilities,
      qualifications: jobData.qualification_requirements,
      benefits: jobData.additional_benefits,
      salaryMin: salaryMin,
      salaryMax: salaryMax
    });

    // Set hiring type
    setHiringType(jobData.hiring_type || 'off-campus');

    // Handle skills properly
    if (jobData.required_skills) {
      const skillsArray = Array.isArray(jobData.required_skills) 
        ? jobData.required_skills 
        : jobData.required_skills.split(',').map(s => s.trim());
      setSkills(skillsArray);
    }
  }
}, [location?.state?.editData, form]);

useEffect(() => {
  console.log('Edit data received:', location?.state?.editData); // Add this line
  if (location?.state?.editData) {
    // ... rest of your code
  }
}, [location?.state?.editData, form]);
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
 const smartTitleCase = (str) => {
  if (!str) return str;
  
  
  // Split by spaces and process each word
  return str.split(' ').map(word => {
    if (word.length === 0) return word;
    // Only capitalize first letter, keep rest exactly as user typed
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};
const toTitleCaseRealTime = (str) => {
  if (!str) return str;
  
  // Split by spaces and process each word
  return str.split(' ').map(word => {
    if (word.length === 0) return word;
    // Only capitalize first letter, keep rest as user typed
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};
const handleSmartTitleCaseChange = (e, fieldName, form) => {
  const cursorPosition = e.target.selectionStart;
  const value = e.target.value;
  
  // Apply smart title case conversion
  const smartTitleCaseValue = smartTitleCase(value);
  
  // Set the form value
  form.setFieldsValue({ [fieldName]: smartTitleCaseValue });
  
  // Restore cursor position after a brief delay
  setTimeout(() => {
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  }, 0);
};


  // Load dynamic data from Supabase on component mount
  useEffect(() => {
    loadDynamicData();
  }, []);
  
  const loadDynamicData = async () => {
    try {

      const { data: collegeData } = await supabase
  .from('job_descriptions')
  .select('college_name')
  .not('college_name', 'is', null);

const uniqueColleges = [...new Set(collegeData?.map(item => item.college_name).filter(Boolean))];
setColleges(uniqueColleges);

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
  if (inputValue && skills.indexOf(smartTitleCase(inputValue)) === -1) {
    setSkills([...skills, smartTitleCase(inputValue)]);
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
          {
            "role": "system", 
            "content": `You are a helpful assistant that writes professional job descriptions. Consider the hiring type: ${hiringType}. If it's on-campus, focus on entry-level requirements, internship opportunities, and student-friendly language. If it's off-campus, use standard professional requirements.`
          },
          {"role": "user", "content": `{jobTitle: "${jobTitle}", hiringType: "${hiringType}"}`},
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    // ... rest of the function remains the same
  } catch (error) {
    console.error('AI Generation Error:', error);
    message.error('Failed to generate job description. Please try again.');
  } finally {
    setAiLoading(false);
  }
};
 useEffect(() => {
    if (location?.state?.editData) {
      const jobData = location.state.editData;
      
      // Extract min/max salary from range if exists
      const salaryRange = jobData.salary_range?.match(/\d+/g) || [];
      const salaryMin = salaryRange[0] ? parseInt(salaryRange[0].replace(/,/g, '')) : undefined;
      const salaryMax = salaryRange[1] ? parseInt(salaryRange[1].replace(/,/g, '')) : undefined;

      form.setFieldsValue({
        jobTitle: jobData.job_title,
        department: jobData.department,
        location: jobData.location,
        employmentType: jobData.employment_type,
        experienceLevel: jobData.experience_level,
        description: jobData.job_description,
        responsibilities: jobData.key_responsibilities,
        qualifications: jobData.qualification_requirements,
        benefits: jobData.additional_benefits,
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        collegeName: jobData.college_name
      });

      if (jobData.required_skills) {
        setSkills(
          Array.isArray(jobData.required_skills) 
            ? jobData.required_skills 
            : jobData.required_skills.split(',').map(s => s.trim()))
      }
    }
  }, [location?.state?.editData]);
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
  console.log('=== DEBUG INFO ===');
  console.log('Form values received:', values);
  console.log('Skills array:', skills);
  console.log('Hiring type:', hiringType);
  console.log('College name from form:', values.collegeName);
  
  setLoading(true);
  try {
    // Format salary range
    const salaryRange = values.salaryMin && values.salaryMax 
      ? `₹${values.salaryMin.toLocaleString()} - ₹${values.salaryMax.toLocaleString()}`
      : values.salaryMin 
        ? `₹${values.salaryMin.toLocaleString()}+`
        : null;

    const jobData = {
      job_title: values.jobTitle,
      department: values.department,
      location: values.location,
      employment_type: values.employmentType,
      experience_level: values.experienceLevel,
      job_description: values.description,
      key_responsibilities: values.responsibilities,
      qualification_requirements: values.qualifications,
      additional_benefits: values.benefits,
      required_skills: skills.join(', '),
      salary_range: salaryRange,
      hiring_type: hiringType,
      college_name: hiringType === 'on-campus' ? values.collegeName : null,
      status: 'Active',
    };

    console.log('Final jobData object:', jobData);
    console.log('College name in jobData:', jobData.college_name);

    // Always insert new record
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert([jobData])
      .select();

    console.log('Supabase response data:', data);
    console.log('Supabase error:', error);

    if (error) throw error;

    // Show appropriate success message
    if (isEditing) {
      message.success('Job description saved as new copy successfully!');
    } else {
      message.success('Job description created successfully!');
    }

    // Reset form and reload data
    form.resetFields();
    setSkills([]);
    setHiringType('off-campus');
    setColleges([]);  
    loadDynamicData();
    
  } catch (error) {
    console.error('Error saving job:', error);
    message.error(`Failed to save job description: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  // Animation styles
  const animationStyles = {
    container: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    headerCard: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-30px)',
      transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
    },
    mainCard: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-40px)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
    },
    leftColumn: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateX(0)' : 'translateX(-30px)',
      transition: 'all 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
    },
    rightColumn: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateX(0)' : 'translateX(30px)',
      transition: 'all 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
    },
    submitButton: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
    },
    floatButton: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'scale(1)' : 'scale(0.8)',
      transition: 'all 1.1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
    }
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'transparent',
      ...animationStyles.container
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
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            ...animationStyles.headerCard
          }}
        >
          <Row align="middle" justify="space-between">
            <Col>
             
<Title level={2} style={{ margin: 0, color: '#1890ff' }}>
  <FileTextOutlined style={{ marginRight: '12px' }} />
  Create Job Description 
  <Tag 
    color={hiringType === 'on-campus' ? 'green' : 'blue'} 
    style={{ marginLeft: '12px', fontSize: '12px' }}
  >
    {hiringType === 'on-campus' ? 'On-Campus' : 'Off-Campus'}
  </Tag>
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
<Card 
  style={{ 
    marginBottom: '24px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    ...animationStyles.headerCard
  }}
>
  <Title level={4} style={{ color: '#1890ff', marginBottom: '16px' }}>
    <BankOutlined style={{ marginRight: '8px' }} />
    Hiring Type
  </Title>
  <Row gutter={16}>
    <Col xs={24} sm={12}>
      <Card
        hoverable
        style={{
          borderRadius: '12px',
          border: hiringType === 'off-campus' ? '2px solid #1890ff' : '1px solid #f0f0f0',
          background: hiringType === 'off-campus' ? 'rgba(24, 144, 255, 0.05)' : 'white',
          cursor: 'pointer'
        }}
        onClick={() => setHiringType('off-campus')}
      >
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <BankOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
          <Title level={5} style={{ margin: 0, color: hiringType === 'off-campus' ? '#1890ff' : '#333' }}>
            Off-Campus Hiring
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Open positions for external candidates
          </Text>
        </div>
      </Card>
    </Col>
    <Col xs={24} sm={12}>
      <Card
        hoverable
        style={{
          borderRadius: '12px',
          border: hiringType === 'on-campus' ? '2px solid #52c41a' : '1px solid #f0f0f0',
          background: hiringType === 'on-campus' ? 'rgba(82, 196, 26, 0.05)' : 'white',
          cursor: 'pointer'
        }}
        onClick={() => setHiringType('on-campus')}
      >
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <TeamOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
          <Title level={5} style={{ margin: 0, color: hiringType === 'on-campus' ? '#52c41a' : '#333' }}>
            On-Campus Hiring
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Campus recruitment for students
          </Text>
        </div>
      </Card>
    </Col>
  </Row>
</Card>
{/* College Selection for On-Campus */}
        {/* Main Content */}
        <Card 
          style={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            ...animationStyles.mainCard
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ padding: '24px' }}
          >
            {hiringType === 'on-campus' && (
  <Card 
    style={{ 
      marginBottom: '24px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      ...animationStyles.headerCard
    }}
  >
    <Title level={4} style={{ color: '#52c41a', marginBottom: '16px' }}>
      <TeamOutlined style={{ marginRight: '8px' }} />
      College Information
    </Title>
    <Form.Item
  label="College Name"
  name="collegeName"  // Make sure this matches what you're accessing in values.collegeName
  rules={[
    { required: hiringType === 'on-campus', message: 'Please select or enter college name' }
  ]}
>
      <Select 
        size="large" 
        placeholder="Select or enter college name"
        showSearch
        filterOption={(input, option) =>
          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        dropdownRender={menu => (
          <div>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Space style={{ padding: '0 8px 4px' }}>
              <Input
                placeholder="Add new college"
                onChange={(e) => {
                  e.target.value = smartTitleCase(e.target.value);
                }}
                onPressEnter={e => {
                  const value = smartTitleCase(e.target.value.trim());
                  if (value && !colleges.includes(value)) {
                    setColleges([...colleges, value]);
                    form.setFieldsValue({ collegeName: value });
                  }
                  e.target.value = '';
                }}
              />
            </Space>
          </div>
        )}
      >
        {colleges.map(college => (
          <Option key={college} value={college}>{college}</Option>
        ))}
      </Select>
    </Form.Item>
  </Card>
)}

            <Row gutter={[32, 24]}>
              {/* Left Column - Basic Information */}
              <Col xs={24} lg={12} style={animationStyles.leftColumn}>
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
    onChange={(e) => handleSmartTitleCaseChange(e, 'jobTitle', form)}
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
            onChange={(e) => {
              // Apply smart title case in real-time for dropdown input
              e.target.value = smartTitleCase(e.target.value);
            }}
            onPressEnter={e => {
              const value = smartTitleCase(e.target.value.trim());
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
            onChange={(e) => {
              // Apply smart title case in real-time for dropdown input
              e.target.value = smartTitleCase(e.target.value);
            }}
            onPressEnter={e => {
              const value = smartTitleCase(e.target.value.trim());
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
            onChange={(e) => {
              // Apply smart title case in real-time for dropdown input
              e.target.value = smartTitleCase(e.target.value);
            }}
            onPressEnter={e => {
              const value = smartTitleCase(e.target.value.trim());
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
            onChange={(e) => {
              // Apply smart title case in real-time for dropdown input
              e.target.value = smartTitleCase(e.target.value);
            }}
            onPressEnter={e => {
              const value = smartTitleCase(e.target.value.trim());
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
    onChange={(e) => {
      const smartValue = smartTitleCase(e.target.value);
      setInputValue(smartValue);
    }}
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
              <Col xs={24} lg={12} style={animationStyles.rightColumn}>
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
  {loading 
    ? 'Saving Job Description...' 
    : isEditing 
      ? 'Save as New Copy' 
      : 'Save Job Description'
  }
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