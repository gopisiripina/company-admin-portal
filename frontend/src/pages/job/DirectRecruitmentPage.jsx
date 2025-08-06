import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col, 
  Steps,
  Typography, 
  Divider, 
  Modal,
  Rate,
  Space,
  Tag,
  Avatar,
  message,
  DatePicker,
  TimePicker,
  Progress,
  Descriptions,
  Badge,
  Alert,
  Tooltip,
  Table,
  InputNumber,
  
  Empty
} from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  StarOutlined,
  FileTextOutlined,
  SendOutlined,
  TeamOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  LinkedinOutlined,
  EnvironmentOutlined,
  BookOutlined,
  BankOutlined,
  PlusOutlined,
  LinkOutlined,
  DeleteOutlined, 
  EyeOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  GlobalOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabase/config';
const { confirm } = Modal;

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;

const DirectRecruitmentPage = () => {
  const [form] = Form.useForm();
  const [jobForm] = Form.useForm();
  
  // View management
  const [currentView, setCurrentView] = useState('jobPosting'); // 'jobPosting', 'candidatesList', 'interview'
  const [loading, setLoading] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
const [jobPostings, setJobPostings] = useState([]);
const [candidates, setCandidates] = useState([]);  // Data states

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [departments, setDepartments] = useState([]);
const [locations, setLocations] = useState([]);
const [experienceLevels, setExperienceLevels] = useState([]);

  const interviewType = 'technical';

  useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoaded(true);
    fetchJobPostings();
    fetchCandidates();
  }, 100);
  return () => clearTimeout(timer);
}, []);
// Fetch job postings
const smartTitleCase = (str) => {
  if (!str) return str;
  return str.split(' ').map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};
// Delete Job Posting Function
const handleDeleteJob = async (recordId, jobTitle) => {
  confirm({
    title: 'Delete Job Posting',
    icon: <ExclamationCircleOutlined />,
    content: (
      <div>
        <p>Are you sure you want to delete the job posting:</p>
        <p><strong>"{jobTitle}"</strong></p>
        <p style={{ color: '#ff4d4f', marginTop: '12px' }}>
          This action cannot be undone and will also delete all associated candidate applications.
        </p>
      </div>
    ),
    okText: 'Yes, Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      setLoading(true);
      try {
        // Get the job_id first, then delete all records with that job_id
        const { data: jobData } = await supabase
          .from('direct_recruitment')
          .select('job_id')
          .eq('id', recordId)
          .single();

        if (jobData) {
          const { error } = await supabase
            .from('direct_recruitment')
            .delete()
            .eq('job_id', jobData.job_id);

          if (error) throw error;
        }

        message.success('Job posting and all associated applications deleted successfully!');
        
        // Refresh both lists
        fetchJobPostings();
        fetchCandidates();
        
      } catch (error) {
        console.error('Error deleting job:', error);
        message.error('Failed to delete job posting. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });
};

// Delete Candidate Function
const handleDeleteCandidate = async (recordId, candidateName) => {
  confirm({
    title: 'Delete Candidate Application',
    icon: <ExclamationCircleOutlined />,
    content: (
      <div>
        <p>Are you sure you want to delete the application from:</p>
        <p><strong>{candidateName}</strong></p>
        <p style={{ color: '#ff4d4f', marginTop: '12px' }}>
          This action cannot be undone and will permanently remove all interview data and assessments.
        </p>
      </div>
    ),
    okText: 'Yes, Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: async () => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('direct_recruitment')
          .delete()
          .eq('id', recordId); // Use 'id' instead of 'candidate_id'

        if (error) throw error;

        message.success('Candidate application deleted successfully!');
        
        // Update local state immediately
        const updatedCandidates = candidates.filter(candidate => candidate.db_id !== recordId);
        setCandidates(updatedCandidates);
        
        // If we're currently viewing this candidate, go back to list
        if (selectedCandidate && selectedCandidate.db_id === recordId) {
          setCurrentView('candidatesList');
          setSelectedCandidate(null);
        }
        
      } catch (error) {
        console.error('Error deleting candidate:', error);
        message.error('Failed to delete candidate application. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });
};
const handleSmartTitleCaseChange = (e, fieldName, form) => {
  const cursorPosition = e.target.selectionStart;
  const value = e.target.value;
  const smartTitleCaseValue = smartTitleCase(value);
  form.setFieldsValue({ [fieldName]: smartTitleCaseValue });
  
  setTimeout(() => {
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  }, 0);
};

// Add this function to load dynamic data (similar to JobDescriptionPage)
const loadDynamicData = async () => {
  try {
    // Load departments
    const { data: deptData } = await supabase
      .from('direct_recruitment')
      .select('department')
      .not('department', 'is', null);
    
    const uniqueDepartments = [...new Set(deptData?.map(item => item.department).filter(Boolean))];
    setDepartments(uniqueDepartments.length > 0 ? uniqueDepartments : [
      'Technology'
    ]);

    // Load locations
    const { data: locData } = await supabase
      .from('direct_recruitment')
      .select('location')
      .not('location', 'is', null);
    
    const uniqueLocations = [...new Set(locData?.map(item => item.location).filter(Boolean))];
    setLocations(uniqueLocations.length > 0 ? uniqueLocations : [
      'Remote',
    ]);

    // Load experience levels
    const { data: expData } = await supabase
      .from('direct_recruitment')
      .select('experience')
      .not('experience', 'is', null);
    
    const uniqueExpLevels = [...new Set(expData?.map(item => item.experience).filter(Boolean))];
    setExperienceLevels(uniqueExpLevels.length > 0 ? uniqueExpLevels : [
      '0-1 Years', 
    ]);

  } catch (error) {
    console.error('Error loading dynamic data:', error);
    // Set default values if error occurs
    setDepartments(['Technology', ]);
    setLocations(['Remote',]);
    setExperienceLevels(['0-1 Years',]);
  }
};

// Add this useEffect to load data on component mount
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoaded(true);
    fetchJobPostings();
    fetchCandidates();
    loadDynamicData(); // Add this line
  }, 100);
  return () => clearTimeout(timer);
}, []);

const fetchJobPostings = async () => {
  try {
    const { data, error } = await supabase
      .from('direct_recruitment')
      .select('id, job_id, job_title, department, location, experience, job_created_at, job_status, applications_count, shareable_link') // Added 'id'
      .is('candidate_id', null)
      .eq('job_status', 'active')
      .order('job_created_at', { ascending: false });

    if (error) throw error;
    
    const transformedJobs = data.map(job => ({
      id: job.job_id, // Keep this for UI consistency
      db_id: job.id,  // Add database ID for delete operations
      title: job.job_title,
      department: job.department,
      location: job.location,
      experience: job.experience,
      created_at: job.job_created_at,
      status: job.job_status,
      applications_count: job.applications_count || 0,
      shareable_link: job.shareable_link
    }));

    setJobPostings(transformedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    message.error('Failed to load job postings');
  }
};

// Fetch candidates
const fetchCandidates = async () => {
  try {
    const { data, error } = await supabase
      .from('direct_recruitment')
      .select('id, *') // Added 'id'
      .not('candidate_id', 'is', null)
      .order('application_date', { ascending: false });

    if (error) throw error;
    
    const transformedCandidates = data.map(candidate => ({
      id: candidate.candidate_id, // Keep this for UI consistency
      db_id: candidate.id,        // Add database ID for delete operations
      job_id: candidate.job_id,
      job_title: candidate.job_title,
      full_name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone,
      experience: candidate.candidate_experience,
      current_company: candidate.current_company,
      current_designation: candidate.current_designation,
      notice_period: candidate.notice_period,
      current_location: candidate.current_location,
      preferred_location: candidate.preferred_location,
      education: candidate.education,
      skills: candidate.skills || [],
      linkedin: candidate.linkedin,
      expected_salary: candidate.expected_salary,
      current_salary: candidate.current_salary,
      application_date: candidate.application_date,
      status: candidate.candidate_status,
      resume_url: candidate.resume_url
    }));

    setCandidates(transformedCandidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    message.error('Failed to load candidates');
  }
};


  // Job Posting Functions
// Updated handleCreateJob function
const handleCreateJob = async (values) => {
  setLoading(true);
  try {
    const jobId = `job_${Date.now()}`;
    // Fix the shareable link - remove the extra path
    const shareableLink = `${window.location.origin}/direct-apply/${jobId}`;    
    
    const { data, error } = await supabase
      .from('direct_recruitment')
      .insert([{
        job_id: jobId,
        job_title: values.title,
        department: values.department,
        location: values.location,
        experience: values.experience,
        description: values.description,
        job_status: 'active',
        applications_count: 0,
        shareable_link: shareableLink,
        job_created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    jobForm.resetFields();
    message.success('Job posting created successfully!');
    fetchJobPostings();
    
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    
    // More specific error messages
    if (error.message.includes('Failed to fetch')) {
      message.error('Network error: Please check your internet connection and try again');
    } else if (error.message.includes('JWT')) {
      message.error('Authentication error: Please refresh the page and try again');
    } else {
      message.error(`Failed to create job posting: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Link copied to clipboard!');
    });
  };

  // Candidate Selection
  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setCurrentView('interview');
  };

  // Interview Functions (existing code)
// Replace your existing handleInterviewSubmit function with this:
const handleInterviewSubmit = async (values) => {
  setLoading(true);
  try {
    // Debug: Log the form values
    console.log('Form values received:', values);
    
    // Ensure we have valid ratings
    const technicalRating = values.technicalRating || 0;
    const communicationRating = values.communicationRating || 0;
    const problemSolvingRating = values.problemSolvingRating || 0;
    const cultureFitRating = values.cultureFitRating || 0;
    
    const scores = [
      technicalRating,
      communicationRating,
      problemSolvingRating,
      cultureFitRating
    ];
    const overallScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    
    console.log('Calculated scores:', { technicalRating, communicationRating, problemSolvingRating, cultureFitRating, overallScore });
    
    // Update the candidate record with interview data AND status
    const { data, error } = await supabase
      .from('direct_recruitment')
      .update({
        interview_date: values.interviewDate?.format('YYYY-MM-DD'),
        interview_time: values.interviewTime?.format('HH:mm'),
        interviewer_name: values.interviewerName,
        technical_rating: technicalRating,
        communication_rating: communicationRating,
        problem_solving_rating: problemSolvingRating,
        culture_fit_rating: cultureFitRating,
        overall_score: parseFloat(overallScore),
        strengths: values.strengths,
        areas_for_improvement: values.areasForImprovement,
        interview_notes: values.interviewNotes,
        recommendation: values.recommendation,
        next_round_notes: values.nextRoundNotes,
        candidate_status: 'interviewed',
        interview_status: 'completed',
        interview_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('candidate_id', selectedCandidate.id)
      .select();

    if (error) throw error;

    // Update local state immediately for real-time effect
    const updatedCandidates = candidates.map(candidate =>
      candidate.id === selectedCandidate.id
        ? { 
            ...candidate, 
            status: 'interviewed',
            technical_rating: technicalRating,
            communication_rating: communicationRating,
            problem_solving_rating: problemSolvingRating,
            culture_fit_rating: cultureFitRating,
            overall_score: parseFloat(overallScore)
          }
        : candidate
    );
    setCandidates(updatedCandidates);

    const interviewResult = {
      candidate_id: selectedCandidate.id,
      candidate_name: selectedCandidate.full_name,
      candidate_email: selectedCandidate.email,
      candidate_phone: selectedCandidate.phone,
      job_position: selectedCandidate.job_title,
      interview_type: interviewType,
      interview_date: values.interviewDate?.format('YYYY-MM-DD') || '2025-01-20',
      interview_time: values.interviewTime?.format('HH:mm') || '14:30',
      interviewer_name: values.interviewerName,
      technical_rating: technicalRating,
      communication_rating: communicationRating,
      problem_solving_rating: problemSolvingRating,
      culture_fit_rating: cultureFitRating,
      overall_score: parseFloat(overallScore),
      strengths: values.strengths,
      areas_for_improvement: values.areasForImprovement,
      interview_notes: values.interviewNotes,
      recommendation: values.recommendation,
      next_round_notes: values.nextRoundNotes,
      status: 'interviewed',
      created_at: new Date().toISOString()
    };

    setInterviewData(interviewResult);
    setSubmitModalVisible(true);
    message.success('Interview assessment completed successfully!');
    
  } catch (error) {
    console.error('Error processing interview:', error);
    message.error('Failed to process interview data');
  } finally {
    setLoading(false);
  }
};


// Add this useEffect for real-time updates after your existing useEffects:
useEffect(() => {
  // Set up real-time subscription
  const subscription = supabase
    .channel('direct_recruitment_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'direct_recruitment'
      },
      (payload) => {
        console.log('Real-time update received:', payload);
        
        if (payload.eventType === 'UPDATE' && payload.new.candidate_id) {
          // Update candidates list when a candidate record is updated
          setCandidates(prevCandidates => 
            prevCandidates.map(candidate => 
              candidate.id === payload.new.candidate_id 
                ? {
                    ...candidate,
                    status: payload.new.candidate_status,
                    technical_rating: payload.new.technical_rating,
                    communication_rating: payload.new.communication_rating,
                    problem_solving_rating: payload.new.problem_solving_rating,
                    culture_fit_rating: payload.new.culture_fit_rating,
                    overall_score: payload.new.overall_score
                  }
                : candidate
            )
          );
          
          // Update selected candidate if it's currently being viewed
          if (selectedCandidate && selectedCandidate.id === payload.new.candidate_id) {
            setSelectedCandidate(prev => ({
              ...prev,
              status: payload.new.candidate_status,
              technical_rating: payload.new.technical_rating,
              communication_rating: payload.new.communication_rating,
              problem_solving_rating: payload.new.problem_solving_rating,
              culture_fit_rating: payload.new.culture_fit_rating,
              overall_score: payload.new.overall_score
            }));
          }
        }
      }
    )
    .subscribe();

  // Cleanup subscription on unmount
  return () => {
    supabase.removeChannel(subscription);
  };
}, [selectedCandidate]);

// Replace your existing handleFinalDecision function:
// Replace your existing handleFinalDecision function:
// Replace your existing handleFinalDecision function:
// Replace your existing handleFinalDecision function:
// Replace your existing handleFinalDecision function:
const handleFinalDecision = async (decision) => {
  setLoading(true);
  try {
    const newStatus = decision === 'selected' ? 'selected' : 'rejected';
    
    // First, update in the direct_recruitment table
    const { error: directRecruitmentError } = await supabase
      .from('direct_recruitment')
      .update({
        candidate_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('candidate_id', selectedCandidate.id);

    if (directRecruitmentError) {
      console.error('Direct recruitment update error:', directRecruitmentError);
      throw directRecruitmentError;
    }

    // If selected, create record in job_applications table for SelectedCandidatesPage
    if (decision === 'selected') {
      try {
        // Parse experience years from string (e.g., "3-5 Years" -> 3)
        let experienceYears = 0;
        if (selectedCandidate.experience) {
          const match = selectedCandidate.experience.match(/(\d+)/);
          experienceYears = match ? parseInt(match[1]) : 0;
        }

        // Extract numeric part from job_id string (e.g., "job_1754461702050" -> 1754461702050)
        const numericJobId = selectedCandidate.job_id ? 
          parseInt(selectedCandidate.job_id.replace('job_', '')) : 
          Date.now(); // fallback to current timestamp if no job_id
        
        const jobApplicationData = {
          job_id: numericJobId, // Convert string job_id to numeric value
          full_name: selectedCandidate.full_name,
          email: selectedCandidate.email,
          phone: selectedCandidate.phone,
          job_title: selectedCandidate.job_title,
          current_company: selectedCandidate.current_company || 'Not specified',
          experience_years: experienceYears,
          skills: Array.isArray(selectedCandidate.skills) 
            ? selectedCandidate.skills.join(',') 
            : (selectedCandidate.skills || ''),
          status: 'selected',
          location: selectedCandidate.current_location || selectedCandidate.preferred_location || 'Not specified',
          expected_salary: selectedCandidate.expected_salary || 'Not specified',
          current_position: selectedCandidate.current_designation || 'Not specified',
          education: selectedCandidate.education || 'Not specified',
          linkedin_url: selectedCandidate.linkedin || null,
          portfolio_url: null,
          resume_url: selectedCandidate.resume_url || null,
          technical_rating: interviewData?.technical_rating || selectedCandidate.technical_rating,
          communication_rating: interviewData?.communication_rating || selectedCandidate.communication_rating,
          interview_feedback: interviewData?.interview_notes || 'Interview completed via Direct Recruitment',
          interviewer_name: interviewData?.interviewer_name || 'Direct Recruitment Team',
          interview_date: interviewData?.interview_date || new Date().toISOString().split('T')[0],
          interview_time: interviewData?.interview_time || '14:00',
          interview_type: 'technical',
          interview_status: 'completed',
          applied_at: selectedCandidate.application_date || new Date().toISOString(),
          mail_history: []
        };

        console.log('Inserting job application data:', jobApplicationData);

        const { error: insertError, data: insertedData } = await supabase
          .from('job_applications')
          .insert(jobApplicationData)
          .select();

        if (insertError) {
          console.error('Error inserting into job_applications table:', insertError);
          // Don't throw error here - the main functionality still works
          console.warn('Could not create job_applications record, but candidate status updated successfully');
        } else {
          console.log('Successfully created job_applications record:', insertedData);
        }
      } catch (jobAppError) {
        console.warn('Could not create job_applications record:', jobAppError);
        // Continue execution - the main functionality still works
      }
    }

    // Update local state immediately for real-time effect
    const updatedCandidates = candidates.map(candidate =>
      candidate.id === selectedCandidate.id
        ? { ...candidate, status: newStatus }
        : candidate
    );
    setCandidates(updatedCandidates);

    // Update selected candidate state
    if (selectedCandidate) {
      setSelectedCandidate(prev => ({
        ...prev,
        status: newStatus
      }));
    }

    if (decision === 'selected') {
      message.success('Candidate moved to selected list successfully! Check the Selected Candidates page.');
    } else {
      message.success('Candidate has been rejected.');
    }

    setSubmitModalVisible(false);
    setCurrentView('candidatesList');
    setSelectedCandidate(null);
    
  } catch (error) {
    console.error('Error saving decision:', error);
    message.error(`Failed to save decision: ${error.message}. Please try again.`);
  } finally {
    setLoading(false);
  }
};


const getCurrentStep = () => {
  if (selectedCandidate.status === 'selected' || selectedCandidate.status === 'rejected') return 2;
  if (selectedCandidate.technical_rating) return 2;
  if (selectedCandidate.interview_date) return 1;
  return 0;
};
  // Animation styles
  const animationStyles = {
    container: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    card: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-30px)',
      transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4) return '#52c41a';
    if (score >= 3) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreText = (score) => {
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Average';
    return 'Below Average';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Table columns for candidates list
  const candidatesColumns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
              marginRight: '12px'
            }}
          >
            {record.full_name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <div>
            <div style={{ fontWeight: '600', color: '#333' }}>{record.full_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Position',
      dataIndex: 'job_title',
      key: 'job_title',
      render: (text) => <Tag color="#0D7139">{text}</Tag>
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience'
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => `${record.current_location} → ${record.preferred_location}`
    },
    {
      title: 'Applied Date',
      dataIndex: 'application_date',
      key: 'application_date',
      render: (date) => formatDate(date)
    },
   // In your candidatesColumns array, update the Status column:
{
  title: 'Status',
  dataIndex: 'status',
  key: 'status',
  render: (status) => {
    const statusConfig = {
      applied: { color: 'blue', text: 'Applied' },
      interviewed: { color: 'orange', text: 'Interviewed' },
      selected: { color: 'green', text: 'Selected' },
      rejected: { color: 'red', text: 'Rejected' }
    };
    const config = statusConfig[status] || statusConfig.applied;
    return <Badge status={config.color} text={config.text} />;
  }
},
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space size="small">
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleCandidateSelect(record)}
          style={{
            background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
            border: 'none'
          }}
        >
          Interview
        </Button>
        <Tooltip title="Delete Application">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCandidate(record.db_id, record.full_name)}
            style={{
              color: '#ff4d4f'
            }}
          />
        </Tooltip>
      </Space>
    )
  }
];
  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: '#f5f7fa',
      minHeight: '100vh',
      ...animationStyles.container
    }}>
      <style>
        {`
          .ant-input:hover,
          .ant-input:focus,
          .ant-input-focused {
            border-color: #0D7139 !important;
          }
          
          .ant-input:focus,
          .ant-input-focused {
            box-shadow: 0 0 0 2px rgba(13, 113, 57, 0.2) !important;
          }
          
          .ant-select:hover .ant-select-selector,
          .ant-select-focused .ant-select-selector,
          .ant-select-selector:focus {
            border-color: #0D7139 !important;
          }
          
          .ant-select-focused .ant-select-selector {
            box-shadow: 0 0 0 2px rgba(13, 113, 57, 0.2) !important;
          }
          
          .skills-tag {
            background: rgba(13, 113, 57, 0.1);
            color: #0D7139;
            border: 1px solid rgba(13, 113, 57, 0.2);
            border-radius: 16px;
            padding: 4px 12px;
            margin: 2px;
            font-size: 12px;
          }
        `}
      </style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <Card 
          style={{ 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #0D7139 0%, #4ead1fff 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(13, 113, 57, 0.15)',
            ...animationStyles.card
          }}
          styles={{ body: { padding: '32px' } }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={1} style={{ margin: 0, color: 'white', fontSize: '32px' }}>
                Direct Recruitment System
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                {currentView === 'jobPosting' && 'Create job postings and generate shareable application links'}
                {currentView === 'candidatesList' && 'Review candidate applications and conduct interviews'}
                {currentView === 'interview' && 'Streamlined hiring process for immediate talent acquisition'}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Job Posting View */}
        {currentView === 'jobPosting' && (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card 
                style={{ 
                  background: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  ...animationStyles.card
                }}
              >
                <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
                  <PlusOutlined style={{ marginRight: '12px' }} />
                  Create New Job Posting
                </Title>

                <Form
                  form={jobForm}
                  layout="vertical"
                  onFinish={handleCreateJob}
                >
<Form.Item
  label="Job Title"
  name="title"
  rules={[{ required: true, message: 'Please enter job title' }]}
>
  <Input 
    size="large" 
    placeholder="e.g. Senior React Developer"
    onChange={(e) => handleSmartTitleCaseChange(e, 'title', jobForm)}
  />
</Form.Item>

<Form.Item
  label="Department"
  name="department"
  rules={[{ required: true, message: 'Please select department' }]}
>
  <Select 
    size="large" 
    placeholder="Select department"
    popupRender={menu => (
      <div>
        {menu}
        <Divider style={{ margin: '8px 0' }} />
        <Space style={{ padding: '0 8px 4px' }}>
          <Input
            placeholder="Add new department"
            onChange={(e) => {
              e.target.value = smartTitleCase(e.target.value);
            }}
            onPressEnter={e => {
              const value = smartTitleCase(e.target.value.trim());
              if (value && !departments.includes(value)) {
                setDepartments([...departments, value]);
                jobForm.setFieldsValue({ department: value });
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


<Form.Item
  label="Location"
  name="location"
  rules={[{ required: true, message: 'Please enter location' }]}
>
  <Select 
    size="large" 
    placeholder="Select location"
    popupRender={menu => (
      <div>
        {menu}
        <Divider style={{ margin: '8px 0' }} />
        <Space style={{ padding: '0 8px 4px' }}>
          <Input
            placeholder="Add new location"
            onChange={(e) => {
              e.target.value = smartTitleCase(e.target.value);
            }}
            onPressEnter={e => {
              const value = smartTitleCase(e.target.value.trim());
              if (value && !locations.includes(value)) {
                setLocations([...locations, value]);
                jobForm.setFieldsValue({ location: value });
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


<Form.Item
  label="Experience Required"
  name="experience"
  rules={[{ required: false, message: 'Please enter experience requirement' }]}
>
  <Select 
    size="large" 
    placeholder="Select experience level"
    popupRender={menu => (
      <div>
        {menu}
        <Divider style={{ margin: '8px 0' }} />
        <Space style={{ padding: '0 8px 4px' }}>
          <Input
            placeholder="Add new experience level"
            onChange={(e) => {
              e.target.value = smartTitleCase(e.target.value);
            }}
            onPressEnter={e => {
              const value = smartTitleCase(e.target.value.trim());
              if (value && !experienceLevels.includes(value)) {
                setExperienceLevels([...experienceLevels, value]);
                jobForm.setFieldsValue({ experience: value });
              }
              e.target.value = '';
            }}
          />
        </Space>
      </div>
    )}
  >
    {experienceLevels.map(exp => (
      <Option key={exp} value={exp}>
        <StarOutlined style={{ marginRight: '8px' }} />
        {exp}
      </Option>
    ))}
  </Select>
</Form.Item>


                  <Form.Item
                    label="Job Description"
                    name="description"
                    rules={[{ required: false, message: 'Please enter job description' }]}
                  >
                    <TextArea rows={4} placeholder="Detailed job description..." />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    icon={<PlusOutlined />}
                    block
                    style={{
                      background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    Create Job Posting
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card 
                style={{ 
                  background: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  ...animationStyles.card
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <Title level={4} style={{ color: '#0D7139', margin: 0 }}>
                    <GlobalOutlined style={{ marginRight: '12px' }} />
                    Active Job Postings
                  </Title>
                  <Button
                    type="primary"
                    icon={<UsergroupAddOutlined />}
                    onClick={() => setCurrentView('candidatesList')}
                    style={{
                      background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                      border: 'none'
                    }}
                  >
                    View Applications ({candidates.length})
                  </Button>
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size="large">
{jobPostings.map(job => (
  <Card key={job.id} type="inner" style={{ background: '#fafbfc' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '12px' }}>
          <Title level={5} style={{ margin: 0, color: '#0D7139' }}>
            {job.title}
          </Title>
          <Text type="secondary">{job.department} • {job.location} • {job.experience}</Text>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <Badge count={job.applications_count} style={{ backgroundColor: '#0D7139' }}>
            <Tag color="blue">Applications</Tag>
          </Badge>
          <Tag color="green" style={{ marginLeft: '8px' }}>
            Created {formatDate(job.created_at)}
          </Tag>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px dashed #d9d9d9'
        }}>
          <Text strong style={{ color: '#0D7139', fontSize: '13px' }}>
            <LinkOutlined style={{ marginRight: '6px' }} />
            Shareable Application Link:
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
            <Input 
              value={job.shareable_link}
              size="small"
              readOnly
              style={{ fontSize: '12px' }}
            />
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(job.shareable_link)}
              style={{ marginLeft: '8px', background: '#0D7139', border: 'none' }}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
      
      {/* Delete Button */}
      <div style={{ marginLeft: '16px' }}>
        <Tooltip title="Delete Job Posting">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteJob(job.db_id, job.title)}
            style={{
              color: '#ff4d4f',
              borderColor: '#ff4d4f'
            }}
          />
        </Tooltip>
      </div>
    </div>
  </Card>
))}                </Space>
              </Card>
            </Col>
          </Row>
        )}

        {/* Candidates List View */}
        {currentView === 'candidatesList' && (
          <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
              <Col>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrentView('jobPosting')}
                  style={{ marginRight: '16px' }}
                >
                  Back to Job Postings
                </Button>
              </Col>
            </Row>

            <Card 
              style={{ 
                background: 'white',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                ...animationStyles.card
              }}
            >
              <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
                <UsergroupAddOutlined style={{ marginRight: '12px' }} />
                Candidate Applications ({candidates.length})
              </Title>

              {candidates.length === 0 ? (
                <Empty 
                  description="No applications received yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  columns={candidatesColumns}
                  dataSource={candidates}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                  }}
                  scroll={{ x: 1000 }}
                />
              )}
            </Card>
          </div>
        )}

        {/* Interview View - Existing Interview Form */}
        {currentView === 'interview' && selectedCandidate && (
          <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
              <Col>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setCurrentView('candidatesList');
                    setSelectedCandidate(null);
                  }}
                >
                  Back to Candidates List
                </Button>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              {/* Left Column - Candidate Information */}
              <Col xs={24} xl={10}>
                {/* Candidate Profile Card */}
                <Card 
                  style={{ 
                    marginBottom: '24px',
                    background: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    ...animationStyles.card
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Avatar 
                      size={80} 
                      style={{ 
                        background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                        marginBottom: '12px',
                        fontSize: '32px'
                      }}
                    >
                      {selectedCandidate.full_name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Title level={3} style={{ margin: 0, color: '#0D7139' }}>
                      {selectedCandidate.full_name}
                    </Title>
                    <Text style={{ fontSize: '16px', color: '#666' }}>
                      {selectedCandidate.job_title}
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <Tag color="#0D7139" style={{ fontSize: '12px' }}>
                        Direct Hiring
                      </Tag>
                    </div>
                  </div>

                  <Descriptions column={1} size="small" styles={{ label: { fontWeight: '600', color: '#333' } }}>
                    <Descriptions.Item 
                      label={<><MailOutlined style={{ marginRight: '8px', color: '#0D7139' }} />Email</>}
                    >
                      {selectedCandidate.email}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><PhoneOutlined style={{ marginRight: '8px', color: '#0D7139' }} />Phone</>}
                    >
                      {selectedCandidate.phone}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><BankOutlined style={{ marginRight: '8px', color: '#0D7139' }} />Current Company</>}
                    >
                      {selectedCandidate.current_company}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><TeamOutlined style={{ marginRight: '8px', color: '#0D7139' }} />Experience</>}
                    >
                      {selectedCandidate.experience}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><EnvironmentOutlined style={{ marginRight: '8px', color: '#0D7139' }} />Location</>}
                    >
                      {selectedCandidate.current_location} → {selectedCandidate.preferred_location}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><BookOutlined style={{ marginRight: '8px', color: '#0D7139' }} />Education</>}
                    >
                      {selectedCandidate.education}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><CalendarOutlined style={{ marginRight: '8px', color: '#0D7139' }} />Notice Period</>}
                    >
                      {selectedCandidate.notice_period}
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider />

                  <div>
                    <Title level={5} style={{ color: '#0D7139', marginBottom: '12px' }}>
                      <StarOutlined style={{ marginRight: '8px' }} />
                      Key Skills
                    </Title>
                    <div>
                      {selectedCandidate.skills.map(skill => (
                        <span key={skill} className="skills-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ color: '#0D7139' }}>Current CTC</Text>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                          {selectedCandidate.current_salary}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ color: '#0D7139' }}>Expected CTC</Text>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                          {selectedCandidate.expected_salary}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Interview Process Steps */}
                <Card 
                  style={{ 
                    background: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    ...animationStyles.card
                  }}
                >
                  <Title level={5} style={{ color: '#0D7139', marginBottom: '20px' }}>
                    Interview Process
                  </Title>
                <Steps 
  direction="vertical"
  current={getCurrentStep()} // Add this function
  size="small"
  items={[
    {
      title: 'Interview Setup',
      description: 'Schedule & Prepare Interview',
      icon: <CalendarOutlined />,
      status: selectedCandidate.interview_date ? 'finish' : 'process'
    },
    {
      title: 'Conduct Assessment',
      description: 'Evaluate Technical & Soft Skills',
      icon: <UserOutlined />,
      status: selectedCandidate.technical_rating ? 'finish' : 'wait'
    },
    {
      title: 'Final Decision',
      description: 'Select or Reject Candidate',
      icon: <CheckCircleOutlined />,
      status: selectedCandidate.status === 'selected' || selectedCandidate.status === 'rejected' ? 'finish' : 'wait'
    }
  ]}
/>
                </Card>
              </Col>

              {/* Right Column - Interview Form */}
              <Col xs={24} xl={14}>
                <Card 
                  style={{ 
                    background: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    ...animationStyles.card
                  }}
                >
                  <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
                    <FileTextOutlined style={{ marginRight: '12px' }} />
                    Interview Evaluation Form
                  </Title>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleInterviewSubmit}
                 initialValues={{
  technicalRating: 3,
  communicationRating: 3,
  problemSolvingRating: 3,
  cultureFitRating: 3,
  recommendation: 'proceed'
}}
                  >
                    {/* Interview Details Section */}
                    <Card 
                      type="inner" 
                      title={
                        <span style={{ color: '#0D7139' }}>
                          <CalendarOutlined style={{ marginRight: '8px' }} />
                          Interview Details
                        </span>
                      }
                      style={{ marginBottom: '24px', background: '#fafbfc' }}
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Interview Date"
                            name="interviewDate"
                            rules={[{ required: true, message: 'Please select interview date' }]}
                          >
                            <DatePicker 
                              size="large" 
                              style={{ width: '100%' }}
                              format="DD MMM YYYY"
                              placeholder="Select interview date"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Interview Time"
                            name="interviewTime"
                            rules={[{ required: true, message: 'Please select interview time' }]}
                          >
                            <TimePicker 
                              size="large" 
                              style={{ width: '100%' }}
                              format="HH:mm"
                              minuteStep={15}
                              placeholder="Select interview time"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="Interviewer Name"
                        name="interviewerName"
                        rules={[{ required: true, message: 'Please enter interviewer name' }]}
                      >
                        <Input 
                          size="large" 
                          placeholder="Enter interviewer's full name"
                          prefix={<UserOutlined style={{ color: '#0D7139' }} />}
                        />
                      </Form.Item>
                    </Card>
/* Performance Ratings Section - Replace the existing Card with this updated version */
<Card 
  type="inner" 
  title={
    <span style={{ color: '#0D7139' }}>
      <StarOutlined style={{ marginRight: '8px' }} />
      Performance Assessment
    </span>
  }
  style={{ marginBottom: '24px', background: '#fafbfc' }}
>
  <Space direction="vertical" style={{ width: '100%' }} size="large">
    <Form.Item
      label={
        <span style={{ fontSize: '16px', fontWeight: '600' }}>
          Technical Skills & Domain Knowledge
        </span>
      }
      name="technicalRating"
      rules={[
        { required: true, message: 'Please rate technical skills' },
        { 
          validator: (_, value) => {
            if (!value || value < 1 || value > 5) {
              return Promise.reject(new Error('Rating must be between 1 and 5'));
            }
            return Promise.resolve();
          }
        }
      ]}
    >
      <div>
        <InputNumber
          min={1}
          max={5}
          step={0.5}
          style={{ width: '120px', fontSize: '16px' }}
          placeholder="1-5"
          addonAfter="⭐"
        />
        <Text style={{ marginLeft: '16px', color: '#666', fontSize: '14px' }}>
          Rate technical competency, coding skills, and domain expertise (1-5 scale)
        </Text>
      </div>
    </Form.Item>

    <Form.Item
      label={
        <span style={{ fontSize: '16px', fontWeight: '600' }}>
          Communication & Presentation Skills
        </span>
      }
      name="communicationRating"
      rules={[
        { required: true, message: 'Please rate communication skills' },
        { 
          validator: (_, value) => {
            if (!value || value < 1 || value > 5) {
              return Promise.reject(new Error('Rating must be between 1 and 5'));
            }
            return Promise.resolve();
          }
        }
      ]}
    >
      <div>
        <InputNumber
          min={1}
          max={5}
          step={0.5}
          style={{ width: '120px', fontSize: '16px' }}
          placeholder="1-5"
          addonAfter="⭐"
        />
        <Text style={{ marginLeft: '16px', color: '#666', fontSize: '14px' }}>
          Rate verbal communication, clarity, and presentation abilities (1-5 scale)
        </Text>
      </div>
    </Form.Item>

    <Form.Item
      label={
        <span style={{ fontSize: '16px', fontWeight: '600' }}>
          Problem Solving & Analytical Thinking
        </span>
      }
      name="problemSolvingRating"
      rules={[
        { required: true, message: 'Please rate problem solving skills' },
        { 
          validator: (_, value) => {
            if (!value || value < 1 || value > 5) {
              return Promise.reject(new Error('Rating must be between 1 and 5'));
            }
            return Promise.resolve();
          }
        }
      ]}
    >
      <div>
        <InputNumber
          min={1}
          max={5}
          step={0.5}
          style={{ width: '120px', fontSize: '16px' }}
          placeholder="1-5"
          addonAfter="⭐"
        />
        <Text style={{ marginLeft: '16px', color: '#666', fontSize: '14px' }}>
          Rate analytical approach, logical reasoning, and problem-solving methodology (1-5 scale)
        </Text>
      </div>
    </Form.Item>

    <Form.Item
      label={
        <span style={{ fontSize: '16px', fontWeight: '600' }}>
          Culture Fit & Team Collaboration
        </span>
      }
      name="cultureFitRating"
      rules={[
        { required: true, message: 'Please rate culture fit' },
        { 
          validator: (_, value) => {
            if (!value || value < 1 || value > 5) {
              return Promise.reject(new Error('Rating must be between 1 and 5'));
            }
            return Promise.resolve();
          }
        }
      ]}
    >
      <div>
        <InputNumber
          min={1}
          max={5}
          step={0.5}
          style={{ width: '120px', fontSize: '16px' }}
          placeholder="1-5"
          addonAfter="⭐"
        />
        <Text style={{ marginLeft: '16px', color: '#666', fontSize: '14px' }}>
          Rate alignment with company values, team dynamics, and cultural adaptation (1-5 scale)
        </Text>
      </div>
    </Form.Item>
  </Space>
</Card>

                    {/* Detailed Feedback Section */}
                    <Card 
                      type="inner" 
                      title={
                        <span style={{ color: '#0D7139' }}>
                          <FileTextOutlined style={{ marginRight: '8px' }} />
                          Detailed Interview Feedback
                        </span>
                      }
                      style={{ marginBottom: '24px', background: '#fafbfc' }}
                    >
                      <Row gutter={16}>
                        <Col xs={24} lg={12}>
                          <Form.Item
                            label="Key Strengths & Highlights"
                            name="strengths"
                            rules={[{ required: true, message: 'Please mention key strengths' }]}
                          >
                            <TextArea
                              rows={4}
                              placeholder="• Strong React.js and frontend development skills&#10;• Excellent problem-solving approach&#10;• Good communication and team collaboration&#10;• Quick learner with adaptability..."
                              style={{ fontSize: '14px' }}
                            />
                          </Form.Item>

                          <Form.Item
                            label="Areas for Improvement"
                            name="areasForImprovement"
                            rules={[{ required: true, message: 'Please mention areas for improvement' }]}
                          >
                            <TextArea
                              rows={4}
                              placeholder="• Could enhance backend technology knowledge&#10;• Needs more experience with cloud platforms&#10;• Can improve system design concepts&#10;• Would benefit from DevOps exposure..."
                              style={{ fontSize: '14px' }}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} lg={12}>
                          <Form.Item
                            label="Comprehensive Interview Notes"
                            name="interviewNotes"
                            rules={[{ required: true, message: 'Please add interview notes' }]}
                          >
                            <TextArea
                              rows={6}
                              placeholder="Detailed interview observations:&#10;&#10;• Technical Discussion: React concepts, state management, performance optimization&#10;• Problem Solving: Approach to coding challenges, debugging methodology&#10;• Behavioral Assessment: Leadership examples, conflict resolution&#10;• Questions Asked: Quality and relevance of candidate's questions&#10;• Overall Impression: Enthusiasm, cultural fit, growth mindset..."
                              style={{ fontSize: '14px' }}
                            />
                          </Form.Item>

                          <Form.Item
                            label="Overall Recommendation"
                            name="recommendation"
                            rules={[{ required: true, message: 'Please select recommendation' }]}
                          >
                            <Select size="large" placeholder="Select overall recommendation">
                              <Option value="strongly_recommend">
                                <TrophyOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                                Strongly Recommend - Exceptional Candidate
                              </Option>
                              <Option value="recommend">
                                <CheckCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                                Recommend - Good Fit for Role
                              </Option>
                              <Option value="proceed">
                                <StarOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                                Proceed with Caution - Average Performance
                              </Option>
                              <Option value="not_recommend">
                                <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                                Do Not Recommend - Below Expectations
                              </Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label="Next Round Notes & Final Recommendations (Optional)"
                        name="nextRoundNotes"
                      >
                        <TextArea
                          rows={3}
                          placeholder="Specific areas to focus on in next round, final interview recommendations, salary negotiations notes, joining timeline discussions..."
                          style={{ fontSize: '14px' }}
                        />
                      </Form.Item>
                    </Card>

                    <Row justify="center" style={{ marginTop: '32px' }}>
                      <Col xs={24} sm={18} md={12}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          loading={loading}
                          icon={<SendOutlined />}
                          block
                          style={{
                            background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            height: '56px',
                            fontSize: '18px',
                            fontWeight: '600',
                            boxShadow: '0 8px 24px rgba(13, 113, 57, 0.3)'
                          }}
                        >
                          {loading ? 'Processing Assessment...' : 'Complete Interview Assessment'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* Decision Modal */}
        <Modal
          title={
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <TrophyOutlined style={{ fontSize: '32px', color: '#0D7139', marginBottom: '8px', display: 'block' }} />
              <Title level={3} style={{ margin: 0, color: '#0D7139' }}>
                Interview Assessment Complete
              </Title>
            </div>
          }
          open={submitModalVisible}
          onCancel={() => setSubmitModalVisible(false)}
          footer={null}
          width={700}
          centered
          style={{ borderRadius: '16px' }}
        >
          {interviewData && (
            <div>
              <Alert
                message="Interview evaluation has been completed successfully!"
                description={
                  <div style={{ marginTop: '8px' }}>
                    <Text style={{ fontSize: '16px' }}>
                      Overall Score: <Text strong style={{ color: getScoreColor(interviewData.overall_score) }}>
                        {interviewData.overall_score}/5.0
                      </Text> - {getScoreText(interviewData.overall_score)}
                    </Text>
                  </div>
                }
                type="success"
                style={{ marginBottom: '24px', borderRadius: '8px' }}
                showIcon
              />

              <Card style={{ marginBottom: '24px', background: '#f8f9fa', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <Avatar 
                    size={64} 
                    style={{ 
                      background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                      marginBottom: '8px',
                      fontSize: '24px'
                    }}
                  >
                    {interviewData.candidate_name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Title level={4} style={{ margin: 0, color: '#0D7139' }}>
                    {interviewData.candidate_name}
                  </Title>
                  <Text type="secondary">{interviewData.job_position}</Text>
                </div>
                
                <Row gutter={[16, 16]} justify="center">
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={interviewData.technical_rating * 20}
                        size={80}
                        strokeColor={getScoreColor(interviewData.technical_rating)}
                        format={() => interviewData.technical_rating}
                        strokeWidth={8}
                      />
                      <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Technical Skills
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={interviewData.communication_rating * 20}
                        size={80}
                        strokeColor={getScoreColor(interviewData.communication_rating)}
                        format={() => interviewData.communication_rating}
                        strokeWidth={8}
                      />
                      <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Communication
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={interviewData.problem_solving_rating * 20}
                        size={80}
                        strokeColor={getScoreColor(interviewData.problem_solving_rating)}
                        format={() => interviewData.problem_solving_rating}
                        strokeWidth={8}
                      />
                      <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Problem Solving
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={interviewData.culture_fit_rating * 20}
                        size={80}
                        strokeColor={getScoreColor(interviewData.culture_fit_rating)}
                        format={() => interviewData.culture_fit_rating}
                        strokeWidth={8}
                      />
                      <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Culture Fit
                      </div>
                    </div>
                  </Col>
                </Row>

                <Divider />

                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ color: '#0D7139', fontSize: '16px' }}>Interview Type</Text>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        <Tag color="#0D7139">{interviewData.interview_type.charAt(0).toUpperCase() + interviewData.interview_type.slice(1)}</Tag>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ color: '#0D7139', fontSize: '16px' }}>Interview Date</Text>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        {interviewData.interview_date} at {interviewData.interview_time}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ color: '#0D7139', fontSize: '16px' }}>Interviewer</Text>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        {interviewData.interviewer_name}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#333', marginBottom: '8px' }}>
                  What would you like to do with this candidate?
                </Title>
                <Text style={{ color: '#666', fontSize: '16px' }}>
                  Make your final decision based on the interview assessment
                </Text>
              </div>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Tooltip title="Move candidate to selected list and proceed with offer letter">
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleFinalDecision('selected')}
                      loading={loading}
                      style={{
                        background: 'linear-gradient(45deg, #52c41a, #73d13d)',
                        border: 'none',
                        borderRadius: '12px',
                        height: '56px',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 6px 20px rgba(82, 196, 26, 0.3)'
                      }}
                    >
                      <div>
                        <div>Move to Selected List</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Proceed with Offer Letter</div>
                      </div>
                    </Button>
                  </Tooltip>
                </Col>
                <Col xs={24} sm={12}>
                  <Tooltip title="Reject candidate and update status">
                    <Button
                      danger
                      size="large"
                      block
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleFinalDecision('rejected')}
                      loading={loading}
                      style={{
                        borderRadius: '12px',
                        height: '56px',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 6px 20px rgba(255, 77, 79, 0.2)'
                      }}
                    >
                      <div>
                        <div>Reject Candidate</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Update Status & Close</div>
                      </div>
                    </Button>
                  </Tooltip>
                </Col>
              </Row>

              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                background: 'rgba(13, 113, 57, 0.05)', 
                borderRadius: '8px',
                border: '1px dashed rgba(13, 113, 57, 0.2)'
              }}>
                <Text style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                  <ExclamationCircleOutlined style={{ marginRight: '6px', color: '#faad14' }} />
                  Note: Selected candidates will be moved to the Selected Candidates page where you can generate and send offer letters. 
                  Rejected candidates will have their status updated accordingly.
                </Text>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default DirectRecruitmentPage;