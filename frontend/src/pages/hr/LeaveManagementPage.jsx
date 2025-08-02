import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  DatePicker, 
  Table, 
  Modal, 
  TimePicker, 
  Row, 
  Col, 
  Switch,

  Typography, 
  Space, 
  Tag, 
  Statistic, 
  Select, 
  Input,
  message,
  Divider,
  Avatar,
  Progress,
  Tabs,
  Badge,
  Tooltip,
  Empty,
  Spin,
  Form,
  Upload,
  Radio,
 
  Alert,
  Descriptions,
  Timeline,
  Calendar,
  Drawer,
  Popconfirm
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  BankOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  NotificationOutlined,
  SendOutlined,
  UploadOutlined,
  PrinterOutlined,
  SearchOutlined,
  HistoryOutlined,
  ClockCircleFilled,
  CalendarTwoTone,
  CoffeeOutlined,
  SunOutlined,
  MoonOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { supabase } from '../../supabase/config';
import useSWR, { mutate } from 'swr';

dayjs.extend(relativeTime);

 const getLeaveTypeConfig = (type) => {
    const configs = {
      'Permission': { color: '#1890ff', icon: <ClockCircleOutlined />, gradient: 'linear-gradient(45deg, #40a9ff 0%, #1890ff 100%)' },
      'Casual Leave': { color: '#52c41a', icon: <CalendarOutlined />, gradient: 'linear-gradient(45deg, #73d13d 0%, #52c41a 100%)' },
      'Earned Leave': { color: '#0D7139', icon: <BankOutlined />, gradient: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)' },
      'Medical Leave': { color: '#ff4d4f', icon: <MedicineBoxOutlined />, gradient: 'linear-gradient(45deg, #ff7875 0%, #ff4d4f 100%)' },
      'Maternity Leave': { color: '#eb2f96', icon: <MedicineBoxOutlined />, gradient: 'linear-gradient(45deg, #f759ab 0%, #eb2f96 100%)' },
      'Compensatory Leave': { color: '#722ed1', icon: <DollarOutlined />, gradient: 'linear-gradient(45deg, #9254de 0%, #722ed1 100%)' },
      'On Duty': { color: '#13c2c2', icon: <TeamOutlined />, gradient: 'linear-gradient(45deg, #36cfc9 0%, #13c2c2 100%)' },
      'Excuses': { color: '#fa8c16', icon: <ExclamationCircleOutlined />, gradient: 'linear-gradient(45deg, #ffa940 0%, #fa8c16 100%)' },
      'Overtime': { color: '#a0d911', icon: <ThunderboltOutlined />, gradient: 'linear-gradient(45deg, #b7eb8f 0%, #a0d911 100%)' },
    };
    return configs[type] || { color: '#666', icon: <FileTextOutlined />, gradient: 'linear-gradient(45deg, #bfbfbf 0%, #666 100%)' };
  };

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Dummy data for employees
const fetcher = async (url) => {
  const [table, userId] = url.split('|');
  
  if (table === 'leave_applications') {
    return await fetchLeaveApplications(userId === 'null' ? null : userId);
  } else if (table === 'leave_balances') {
    return await fetchLeaveBalances(userId);
  } else if (table === 'events') {
    return await fetchEvents();
  }
};

// Add new events fetch function
const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    message.error('Failed to fetch events');
    return [];
  }
};

// Generate dummy leave data
const fetchLeaveApplications = async (userId = null) => {
  try {
    let query = supabase
      .from('leave_applications')
      .select(`
        *,
        users!user_id (
          id,
          name,
          employee_id,
          email,
          employee_type,
          start_date
        )
      `)
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leave applications:', error);
    message.error('Failed to fetch leave applications');
    return [];
  }
};


const fetchLeaveBalances = async (userId) => {
  try {
    await supabase.rpc('reset_monthly_limits');
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        users!user_id (
          name,
          employee_id
        )
      `)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    // If no balance record exists, create one
    if (!data) {
      const { data: userData } = await supabase
        .from('users')
        .select('name, employee_id')
        .eq('id', userId)
        .single();
        
      const newBalance = {
        user_id: userId,
        employee_name: userData?.name || 'Unknown',
        permission_total: 2,
        permission_remaining: 2,
        casual_total: 12,
        casual_remaining: 12,
        earned_total: 0,
        earned_remaining: 0,
        medical_total: 12,
        medical_remaining: 12,
        maternity_total: 84,
        maternity_remaining: 84,
        compensatory_total: 0,
        compensatory_remaining: 0,
        excuses_total: 1,
        excuses_remaining: 1
      };
      
     const { data: newData, error: insertError } = await supabase
        .from('leave_balances')
        .insert([newBalance])
        .select(`
          *,
          users!user_id (
            name,
            employee_id
          )
        `)
        .single();
        
      if (insertError) throw insertError;
      return newData;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    return null;
  }
};

// Calculate leave balances
const calculateLeaveBalances = async (userId, currentUser) => {
  const balanceData = await fetchLeaveBalances(userId);

  const earnedFromWorkingDays = currentUser?.workingDays ? Math.floor(currentUser.workingDays / 20) : 0;
  
  if (!balanceData) {
    return {
      permission: { total: 2, used: 0, remaining: 2, monthlyLimit: 2 },
      casualLeave: { total: 12, used: 0, remaining: 12, monthlyLimit: 1 },
      earnedLeave: { total: 0, used: 0, remaining: 0 },
      medicalLeave: { total: 12, used: 0, remaining: 12 },
      maternityLeave: { total: 84, used: 0, remaining: 84 },
      compensatoryLeave: { total: 0, used: 0, remaining: 0 },
      excuses: { total: 1, used: 0, remaining: 1, monthlyLimit: 1 }
    };
  }
   balanceData.earned_total = earnedFromWorkingDays;
  balanceData.earned_remaining = earnedFromWorkingDays - (balanceData.earned_used || 0);
  
  return {
    permission: {
      total: balanceData.permission_total,
      used: balanceData.permission_used,
      remaining: balanceData.permission_remaining,
      monthlyLimit: 2
    },
    casualLeave: {
      total: balanceData.casual_total,
      used: balanceData.casual_used,
      remaining: balanceData.casual_remaining,
      monthlyLimit: 1,
      monthlyUsed: balanceData.casual_monthly_used || 0 // Added for monthly check
    },
    earnedLeave: {
      total: balanceData.earned_total,
      used: balanceData.earned_used,
      remaining: balanceData.earned_remaining
    },
    medicalLeave: {
      total: balanceData.medical_total,
      used: balanceData.medical_used,
      remaining: balanceData.medical_remaining
    },
    maternityLeave: {
      total: balanceData.maternity_total,
      used: balanceData.maternity_used,
      remaining: balanceData.maternity_remaining
    },
    compensatoryLeave: {
      total: balanceData.compensatory_total,
      used: balanceData.compensatory_used,
      remaining: balanceData.compensatory_remaining
    },
    excuses: {
      total: balanceData.excuses_total,
      used: balanceData.excuses_used,
      remaining: balanceData.excuses_remaining,
      monthlyLimit: 1
    }
  };
};



const LeaveManagementPage = ({ userRole = 'hr', currentUserId = '1' }) => {
const [employees, setEmployees] = useState([]);
    const { data: leaveData = [], error: leaveError, mutate: mutateLeaves } = useSWR(
    `leave_applications|${userRole === 'employee' ? currentUserId : null}`,
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  const { data: events = [], mutate: mutateEvents } = useSWR(
    'events|null',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every minute
      revalidateOnFocus: true
    }
  );

  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({});
const [casualSubType, setCasualSubType] = useState('');

  // Modal states
  const [applyLeaveModal, setApplyLeaveModal] = useState(false);
  const [leaveDetailsModal, setLeaveDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveHistoryDrawer, setLeaveHistoryDrawer] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDate, setExportDate] = useState(dayjs());
  // Form and filter states
  const [form] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('dashboard');
  // Add these with other state declarations
const [calendarForm] = Form.useForm();
const [editModal, setEditModal] = useState(false);
const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
   // Add these new state variables:
  const [weeklyHolidayModal, setWeeklyHolidayModal] = useState(false);
  const [weeklyHolidayForm] = Form.useForm();
  const [pendingChanges, setPendingChanges] = useState({}); // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
const [selectedEvent, setSelectedEvent] = useState(null);
const [eventModal, setEventModal] = useState(false);
const [eventForm] = Form.useForm(); // For the event modal form


useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (error) {
        console.error('Error fetching current user:', error);
        // Create a fallback user object
        setCurrentUser({
          id: currentUserId,
          name: 'Current User',
          employeeId: 'EMP001',
          department: 'General',
          position: 'Employee',
          email: 'user@company.com',
          joinDate: dayjs().format('YYYY-MM-DD'),
          type: 'Full-time',
          workingDays: 0
        });
      } else {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error('Error:', err);
      // Fallback user
      setCurrentUser({
        id: currentUserId,
        name: 'Current User',
        employeeId: 'EMP001',
        department: 'General',
        position: 'Employee',
        email: 'user@company.com',
        joinDate: dayjs().format('YYYY-MM-DD'),
        type: 'Full-time',
        workingDays: 0
      });
    }
  };

  fetchCurrentUser();
}, [currentUserId]);
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter leaves based on current filters
// Filter leaves based on current filters
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const leaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
      const balances = await calculateLeaveBalances(currentUserId, currentUser);
      
mutateLeaves(leaves, false); // Update local cache without revalidation
      setLeaveBalances(balances);
      
      // Apply filters to the loaded data
      let filtered = leaves;
      
      if (filterStatus !== 'All') {
        filtered = filtered.filter(leave => leave.status === filterStatus);
      }
      
      if (filterType !== 'All') {
        filtered = filtered.filter(leave => leave.leave_type === filterType);
      }
      
      if (filterEmployee !== 'All') {
        filtered = filtered.filter(leave => leave.employee_id === filterEmployee);
      }
      
      setFilteredLeaves(filtered);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };
  
  loadData();
}, [userRole, currentUserId, currentUser, filterStatus, filterType, filterEmployee]); // Add filter dependencies  // Get current user data
 
 // Apply filters when filter values change
useEffect(() => {
  let filtered = leaveData;
  
  if (filterStatus !== 'All') {
    filtered = filtered.filter(leave => leave.status === filterStatus);
  }
  
  if (filterType !== 'All') {
    filtered = filtered.filter(leave => leave.leave_type === filterType);
  }
  
  if (filterEmployee !== 'All') {
    filtered = filtered.filter(leave => leave.employee_id === filterEmployee);
  }
  
  setFilteredLeaves(filtered);
}, [leaveData, filterStatus, filterType, filterEmployee]);
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
    statsCard: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-40px)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
    },
    mainCard: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-50px)',
      transition: 'all 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
    },
  };

  // Handle apply leave
const handleApplyLeave = async (values) => {
  setLoading(true);
  try {
    // Get current user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUserId)
      .single();
      
    if (!userData) {
      message.error('User information not found');
      return;
    }
    
    const newLeave = {
      user_id: currentUserId,
      employee_name: userData.name,
      employee_code: userData.employee_id,
      department: userData.department || 'General',
      position: userData.position || 'Employee',
      email: userData.email,
      join_date: userData.start_date,
      employee_type: userData.employee_type,
      leave_type: values.leaveType,
      sub_type: values.subType,
      start_date: values.startDate.format('YYYY-MM-DD'),
      end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : values.startDate.format('YYYY-MM-DD'),
      start_time: values.startTime ? values.startTime.format('HH:mm') : null,
      end_time: values.endTime ? values.endTime.format('HH:mm') : null,
      total_days: values.leaveType === 'Permission' ? 0 : 
                 values.endDate ? values.endDate.diff(values.startDate, 'days') + 1 : 1,
      total_hours: values.leaveType === 'Permission' && values.startTime && values.endTime ? 
                  values.endTime.diff(values.startTime, 'hours', true) : 0,
      reason: values.reason,
      medical_certificate: values.medicalCertificate?.[0]?.name || null,
      attachment: values.attachment?.[0]?.name || null,
      working_days_at_application: currentUser?.workingDays || 0
    };
      
    const { data, error } = await supabase
      .from('leave_applications')
      .insert([newLeave])
      .select(`
        *,
        users!user_id (
          name,
          employee_id,
          email
        )
      `)
      .single();
    
    if (error) throw error;
    
    // Update leave balance using user_id
    await updateLeaveBalance(currentUserId, values.leaveType, values.subType);
      
    mutateLeaves();
      
      setApplyLeaveModal(false);
      form.resetFields();
      message.success('Leave application submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave:', error);
      message.error('Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

const updateLeaveBalance = async (userId, leaveType, subType) => {
  try {
    const currentBalances = await fetchLeaveBalances(userId);
    const updates = {};
      
    switch (leaveType) {
      case 'Permission':
        updates.permission_used = (currentBalances?.permission_used || 0) + 1;
        updates.permission_remaining = (currentBalances?.permission_remaining || 2) - 1;
        break;
      case 'Casual Leave':
        const days = subType === 'HDL' ? 0.5 : 1;
        updates.casual_used = (currentBalances?.casual_used || 0) + days;
        updates.casual_remaining = (currentBalances?.casual_remaining || 12) - days;
        updates.casual_monthly_used = (currentBalances?.casual_monthly_used || 0) + 1;
        break;
      case 'Earned Leave':
        updates.earned_used = (currentBalances?.earned_used || 0) + 1;
        updates.earned_remaining = (currentBalances?.earned_remaining || 0) - 1;
        break;
      case 'Medical Leave':
        updates.medical_used = (currentBalances?.medical_used || 0) + 1;
        updates.medical_remaining = (currentBalances?.medical_remaining || 12) - 1;
        break;
      case 'Excuses':
        updates.excuses_used = (currentBalances?.excuses_used || 0) + 1;
        updates.excuses_remaining = (currentBalances?.excuses_remaining || 1) - 1;
        break;
    }
      
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('leave_balances')
        .update(updates)
        .eq('user_id', userId);
        
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating leave balance:', error);
  }
};

// 7. Add function to get available leave types:
  const getAvailableLeaveTypes = () => {
    const available = [];
    
    // These leaves are only available if there is a balance
    if (leaveBalances.permission?.remaining > 0) available.push('Permission');
    if (leaveBalances.casualLeave?.remaining > 0 && leaveBalances.casualLeave?.monthlyUsed < 1) available.push('Casual Leave');
    if (leaveBalances.earnedLeave?.remaining > 0) available.push('Earned Leave');
    if (leaveBalances.maternityLeave?.remaining > 0) available.push('Maternity Leave');
    if (leaveBalances.compensatoryLeave?.remaining > 0) available.push('Compensatory Leave');
    if (leaveBalances.excuses?.remaining > 0) available.push('Excuses');
    
    // UPDATED: Medical leave is always available to apply for.
    available.push('Medical Leave');
    
    // These are always available (no balance limits)
    available.push('On Duty', 'Overtime');
    
    return available;
  };


  // Handle approve/reject leave
// Remove this line (around line 194):
// const [setLeaveData] = useState([]);

// Update the handleLeaveAction function:
const handleLeaveAction = async (leaveId, action, reason = null) => {
  setLoading(true);
  try {
    const updates = {
      status: action === 'approve' ? 'Approved' : 'Rejected',
      approved_by: action === 'approve' ? 'Current User' : null,
      approved_date: action === 'approve' ? new Date().toISOString().split('T')[0] : null,
      rejection_reason: action === 'reject' ? reason : null,
    };
    
    const { error } = await supabase
      .from('leave_applications')
      .update(updates)
      .eq('id', leaveId);
    
    if (error) throw error;
    
    // Use mutateLeaves instead of setLeaveData
    mutateLeaves();
    
    message.success(`Leave ${action}d successfully!`);
  } catch (error) {
    console.error(`Error ${action}ing leave:`, error);
    message.error(`Failed to ${action} leave`);
  } finally {
    setLoading(false);
  }
};  // Get leave type color and icon
 
  // Get permission time icon
  const getPermissionTimeIcon = (timeSlot) => {
    const icons = {
      'Morning': <SunOutlined style={{ color: '#faad14' }} />,
      'Before Lunch': <CoffeeOutlined style={{ color: '#8c4a2b' }} />,
      'Middle': <ClockCircleFilled style={{ color: '#1890ff' }} />,
      'After Lunch': <CoffeeOutlined style={{ color: '#52c41a' }} />,
      'Evening': <MoonOutlined style={{ color: '#722ed1' }} />,
    };
    return icons[timeSlot] || <ClockCircleOutlined />;
  };

  // Employee Dashboard Component
const EmployeeDashboard = () => (
  <div style={animationStyles.container}>
    {/* Mobile-Responsive Header */}
    <Card style={{ 
      marginBottom: '24px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      ...animationStyles.headerCard
    }}>
      <Row align="middle" justify="space-between" gutter={[16, 16]}>
        <Col xs={24} sm={16} md={18}>
          <Space size="large" direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar 
                size={{ xs: 48, sm: 64 }} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#0D7139', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <Title 
                  level={2} 
                  style={{ 
                    margin: 0, 
                    color: '#0D7139',
                    fontSize: 'clamp(18px, 4vw, 24px)' // Responsive font size
                  }}
                >
                  Leave Dashboard
                </Title>
                <Text type="secondary" style={{ 
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  display: 'block'
                }}>
                  {currentUser?.position} • {currentUser?.department}
                </Text>
              </div>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setApplyLeaveModal(true)}
            block // Make button full width on mobile
            style={{
              background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
              border: 'none',
              borderRadius: '8px',
              height: '50px'
            }}
          >
            Apply Leave
          </Button>
        </Col>
      </Row>
    </Card>
      {/* Leave Balance Cards */}
           <Row gutter={[12, 12]} style={{ marginBottom: '24px' }}>
        {Object.entries(leaveBalances).map(([key, balance]) => {
          const leaveTypeNames = {
            permission: 'Permission',
            casualLeave: 'Casual Leave',
            earnedLeave: 'Earned Leave',
            medicalLeave: 'Medical Leave',
            maternityLeave: 'Maternity Leave',
            compensatoryLeave: 'Compensatory Leave',
            excuses: 'Excuses'
          };

const config = getLeaveTypeConfig(leaveTypeNames[key]);
          const percentage = balance.total > 0 ? (balance.remaining / balance.total) * 100 : 0;
    return (
      <Col xs={12} sm={8} md={6} lg={4} xl={4} key={key}> {/* Updated responsive breakpoints */}
      <Card 
  style={{ 
    borderRadius: '12px',
    background: '#ffffff', 
    border: '1px solid #f0f0f0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    ...animationStyles.statsCard 
  }}
  styles={{ body: { padding: '12px' } }} // Changed from bodyStyle
>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'clamp(18px, 4vw, 24px)', // Responsive icon size
              color: config.color, 
              marginBottom: '6px' 
            }}>
              {config.icon}
            </div>
            <Title level={5} style={{ 
              margin: '0 0 6px 0', 
              color: config.color,
              fontSize: 'clamp(11px, 2.5vw, 14px)', // Responsive title
              lineHeight: '1.2'
            }}>
              {leaveTypeNames[key]}
            </Title>
            <div style={{ marginBottom: '8px' }}>
              <Text style={{ 
                fontSize: 'clamp(16px, 4vw, 20px)', 
                fontWeight: 'bold', 
                color: config.color 
              }}>
                {balance.remaining}
              </Text>
              <Text type="secondary" style={{ 
                fontSize: 'clamp(10px, 2vw, 12px)', 
                marginLeft: '2px' 
              }}>
                / {balance.total}
              </Text>
            </div>
            <Progress 
              percent={percentage}
              strokeColor={config.color}
              showInfo={false}
              size="small"
            />
            <div style={{ marginTop: '6px' }}>
              <Text type="secondary" style={{ fontSize: 'clamp(9px, 2vw, 11px)' }}>
                Used: {balance.used}
                {balance.monthlyLimit && ` • Monthly: ${balance.monthlyLimit}`}
              </Text>
            </div>
          </div>
        </Card>
      </Col>
    );
  })}
</Row>


      {/* Recent Leave Applications */}
      <Card style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        ...animationStyles.mainCard
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={4} style={{ margin: 0, color: '#0D7139' }}>
            <HistoryOutlined style={{ marginRight: '8px' }} />
            Recent Applications
          </Title>
          <Button 
            type="text" 
            onClick={() => setLeaveHistoryDrawer(true)}
            style={{ color: '#0D7139' }}
          >
            View All
          </Button>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Timeline>
            {filteredLeaves.slice(0, 5).map(leave => {
              const config = getLeaveTypeConfig(leave.leaveType);
              return (
                <Timeline.Item
                  key={leave.id}
                  dot={<div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: config.gradient,
                    border: '2px solid white', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                  }} />}
                >
                 <Card 
  size="small" 
  style={{ 
    marginBottom: '8px',
    borderRadius: '8px',
    border: `1px solid ${config.color}20`,
    background: `linear-gradient(135deg, ${config.color}08 0%, ${config.color}03 100%)`
  }}
  styles={{ body: { padding: '12px' } }} // Changed from bodyStyle
>
                    <Row align="middle" justify="space-between">
                      <Col flex="auto">
                        <Space>
                          {config.icon}
                          <div>
                            <Text strong style={{ color: config.color }}>
                              {leave.leaveType}
                              {leave.subType && ` (${leave.subType})`}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {dayjs(leave.startDate).format('MMM DD')} - {dayjs(leave.endDate).format('MMM DD, YYYY')}
                              {leave.totalHours > 0 && ` • ${leave.totalHours}h`}
                              {leave.totalDays > 0 && ` • ${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''}`}
                            </Text>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Tag 
                          color={leave.status === 'Approved' ? 'success' : 
                                leave.status === 'Rejected' ? 'error' : 'warning'}
                        >
                          {leave.status}
                        </Tag>
                      </Col>
                    </Row>
                  </Card>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </div>
      </Card>
    </div>
  );

  // HR/Admin Table Columns
const getTableColumns = () => {
  const isMobile = window.innerWidth < 768;
  const baseColumns = [
    // Always show employee column (modify condition)
    ...(userRole !== 'employee' ? [{
      title: isMobile ? 'Emp' : 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small">
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#0D7139' }}
            size={isMobile ? "small" : "default"}
          />
          {!isMobile ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: '12px' }}>
                {record.users?.name || record.employee_name}
              </div>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {record.users?.employee_id || record.employee_code}
              </Text>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, fontSize: '10px' }}>
                {(record.users?.name || record.employee_name)?.split(' ')[0]}
              </div>
              <Text type="secondary" style={{ fontSize: '8px' }}>
                {record.users?.employee_id || record.employee_code}
              </Text>
            </div>
          )}
        </Space>
      ),
      width: isMobile ? 80 : 150,
    }] : []),

    // Mobile-optimized Leave Type column
    {
      title: isMobile ? 'Type' : 'Leave Type',
      key: 'leaveType',
      render: (_, record) => {
        const config = getLeaveTypeConfig(record.leave_type);
        return (
          <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small">
            <div style={{ color: config.color }}>{config.icon}</div>
            <div>
              <Tag 
                color={config.color} 
                style={{ 
                  borderRadius: '6px',
                  fontSize: isMobile ? '8px' : '12px',
                  padding: isMobile ? '2px 4px' : '4px 8px'
                }}
              >
                {isMobile ? 
                  (record.leave_type.length > 6 ? 
                    record.leave_type.substring(0, 6) + '...' : 
                    record.leave_type
                  ) : 
                  record.leave_type
                }
              </Tag>
              {record.sub_type && !isMobile && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    {record.leave_type === 'Permission' && getPermissionTimeIcon(record.sub_type)}
                    {' '}{record.sub_type}
                  </Text>
                </>
              )}
            </div>
          </Space>
        );
      },
      width: isMobile ? 70 : 150,
    },

    // Mobile-optimized Duration column
    {
      title: isMobile ? 'Date' : 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: isMobile ? '9px' : '13px' }}>
            {dayjs(record.start_date).format(isMobile ? 'DD/MM' : 'MMM DD')}
            {record.end_date !== record.start_date && 
              ` - ${dayjs(record.end_date).format(isMobile ? 'DD/MM' : 'MMM DD')}`}
          </Text>
          {isMobile ? (
            <div>
              <Text type="secondary" style={{ fontSize: '8px' }}>
                {record.total_hours > 0 ? `${record.total_hours}h` : 
                 record.total_days > 0 ? `${record.total_days}d` : '-'}
              </Text>
            </div>
          ) : (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.total_hours > 0 ? `${record.total_hours}h` : 
                 record.total_days > 0 ? `${record.total_days}d` : '-'}
                {record.start_time && record.end_time && (
                  <> • {record.start_time}-{record.end_time}</>
                )}
              </Text>
            </>
          )}
        </div>
      ),
      width: isMobile ? 60 : 140,
    },

    // Mobile-optimized Status column
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div>
          <Badge 
            status={record.status === 'Approved' ? 'success' : 
                   record.status === 'Rejected' ? 'error' : 'processing'}
            text={<span style={{ fontSize: isMobile ? '8px' : '12px' }}>
              {isMobile ? record.status.substring(0, 3) : record.status}
            </span>}
          />
          {!isMobile && record.status === 'Approved' && record.approvedBy && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                by {record.approvedBy}
              </Text>
            </>
          )}
        </div>
      ),
      width: isMobile ? 50 : 120,
    },

    // Always show Applied Date (modify condition)
    {
      title: isMobile ? 'Applied' : 'Applied Date',
      dataIndex: 'created_at',
      render: (date) => (
        <Text style={{ fontSize: isMobile ? '8px' : '12px' }}>
          {dayjs(date).format(isMobile ? 'DD/MM/YY' : 'MMM DD, YYYY')}
        </Text>
      ),
      width: isMobile ? 60 : 100,
    },

    // Mobile-optimized Actions column
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedLeave(record);
                setLeaveDetailsModal(true);
              }}
              style={{ color: '#0D7139' }}
            />
          </Tooltip>
          {userRole !== 'employee' && record.status === 'Pending' && (
            <>
              <Tooltip title="Approve">
                <Popconfirm
                  title="Approve this leave?"
                  onConfirm={() => handleLeaveAction(record.id, 'approve')}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    icon={<CheckCircleOutlined />}
                    size="small"
                    style={{ color: '#52c41a' }}
                  />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Reject">
                <Popconfirm
                  title="Reject this leave?"
                  description="Please provide rejection reason"
                  onConfirm={() => handleLeaveAction(record.id, 'reject', 'Insufficient leave balance')}
                  okText="Reject"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    size="small"
                    style={{ color: '#ff4d4f' }}
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
      width: isMobile ? 40 : (userRole === 'employee' ? 80 : 120),
      fixed: isMobile ? false : 'right',
    },
  ];

  return baseColumns;
};

  // Apply Leave Form Component
 const ApplyLeaveForm = () => {
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const availableLeaveTypes = getAvailableLeaveTypes();

    const isPermissionDisabled = leaveBalances.permission?.remaining <= 0;
    const isCasualDisabled = leaveBalances.casualLeave?.remaining <= 0 || leaveBalances.casualLeave?.monthlyUsed >= 1;
    const isEarnedDisabled = leaveBalances.earnedLeave?.remaining <= 0;
    const isExcusesDisabled = leaveBalances.excuses?.remaining <= 0;
    
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleApplyLeave}
        initialValues={{
          startDate: dayjs(),
          endDate: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="leaveType"
              label="Leave Type"
              rules={[{ required: true, message: 'Please select leave type' }]}
            >
              <Select 
                placeholder="Select leave type"
                onChange={(value) => {
                  setSelectedLeaveType(value);
                  form.resetFields(['subType', 'startTime', 'endTime', 'endDate']);
                }}
                size="large"
              >
                {/* UPDATED: Added disabled logic to options */}
                <Option value="Permission" disabled={isPermissionDisabled}>
                  <Space>
                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                    Permission ({leaveBalances.permission?.remaining} remaining)
                  </Space>
                </Option>
                <Option value="Casual Leave" disabled={isCasualDisabled}>
                  <Space>
                    <CalendarOutlined style={{ color: '#52c41a' }} />
                    Casual Leave ({leaveBalances.casualLeave?.remaining} remaining)
                  </Space>
                </Option>
                <Option value="Earned Leave" disabled={isEarnedDisabled}>
                  <Space>
                    <BankOutlined style={{ color: '#0D7139' }} />
                    Earned Leave ({leaveBalances.earnedLeave?.remaining} remaining)
                  </Space>
                </Option>
                <Option value="Medical Leave">
                  <Space>
                    <MedicineBoxOutlined style={{ color: '#ff4d4f' }} />
                    Medical Leave ({leaveBalances.medicalLeave?.remaining} remaining)
                  </Space>
                </Option>
                <Option value="Maternity Leave">
                  {/* ... (no changes) ... */}
                </Option>
                <Option value="Compensatory Leave">
                   {/* ... (no changes) ... */}
                </Option>
                <Option value="Excuses" disabled={isExcusesDisabled}>
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                    Excuses ({leaveBalances.excuses?.remaining} remaining)
                  </Space>
                </Option>
                <Option value="On Duty">

                  <Space>
                    <TeamOutlined style={{ color: '#13c2c2' }} />
                    On Duty
                  </Space>
                </Option>
                <Option value="Overtime">
                  <Space>
                    <ThunderboltOutlined style={{ color: '#a0d911' }} />
                    Overtime
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          {selectedLeaveType === 'Permission' && (
            <Col xs={24} md={12}>
              <Form.Item
                name="subType"
                label="Permission Time Slot"
                rules={[{ required: true, message: 'Please select time slot' }]}
              >
                <Select 
                  placeholder="Select time slot"
                  
                  size="large"
                >
                  <Option value="Morning">
                    <Space>
                      <SunOutlined style={{ color: '#faad14' }} />
                      Morning (8:00 - 10:00 AM)
                    </Space>
                  </Option>
                  <Option value="Before Lunch">
                    <Space>
                      <CoffeeOutlined style={{ color: '#8c4a2b' }} />
                      Before Lunch (10:00 AM - 12:00 PM)
                    </Space>
                  </Option>
                  <Option value="Middle">
                    <Space>
                      <ClockCircleFilled style={{ color: '#1890ff' }} />
                      Middle (12:00 - 2:00 PM)
                    </Space>
                  </Option>
                  <Option value="After Lunch">
                    <Space>
                      <CoffeeOutlined style={{ color: '#52c41a' }} />
                      After Lunch (2:00 - 4:00 PM)
                    </Space>
                  </Option>
                  <Option value="Evening">
                    <Space>
                      <MoonOutlined style={{ color: '#722ed1' }} />
                      Evening (4:00 - 6:00 PM)
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          )}

          {selectedLeaveType === 'Casual Leave' && (
            <Col xs={24} md={12}>
              <Form.Item
                name="subType"
                label="Leave Duration"
                rules={[{ required: true, message: 'Please select duration' }]}
              >
                <Radio.Group onChange={(e) => setCasualSubType(e.target.value)} size="large">
                  <Radio.Button value="HDL">Half Day Leave (HDL)</Radio.Button>
                  <Radio.Button value="FDL">Full Day Leave (FDL)</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          )}
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={selectedLeaveType === 'Permission' ? 8 : 12}>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                size="large"
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>

          {selectedLeaveType !== 'Permission' && (
            <Col xs={24} md={12}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  size="large"
                  format="DD/MM/YYYY"
                  disabledDate={(current) => {
                    const startDate = form.getFieldValue('startDate');
                    return current && (current < dayjs().startOf('day') || 
                           (startDate && current < startDate));
                  }}
                />
              </Form.Item>
            </Col>
          )}

          {selectedLeaveType === 'Permission' && (
            <>
              <Col xs={12} md={8}>
                <Form.Item
                  name="startTime"
                  label="Start Time"
                  rules={[{ required: true, message: 'Please select start time' }]}
                >
                  <TimePicker 
                    format="HH:mm"
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={8}>
                <Form.Item
                  name="endTime"
                  label="End Time"
                  rules={[{ required: true, message: 'Please select end time' }]}
                >
                  <TimePicker 
                    format="HH:mm"
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
           {selectedLeaveType === 'Casual Leave' && (
          <Alert
            message={`Monthly Limit: You can apply for a maximum of 1 Casual Leave per month. You have used ${leaveBalances.casualLeave?.monthlyUsed} this month.`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
 {selectedLeaveType === 'Medical Leave' && leaveBalances.medicalLeave?.remaining <= 0 && (
          <Alert
            message={`You have exhausted your available medical leaves. This application will be considered as an extra leave and is subject to HR approval.`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        <Form.Item
          name="reason"
          label="Reason for Leave"
          rules={[{ required: true, message: 'Please provide reason' }]}
        >
          <TextArea
            rows={3}
            placeholder="Please provide detailed reason for your leave request..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        {(selectedLeaveType === 'Medical Leave' || selectedLeaveType === 'Maternity Leave') && (
          <Form.Item
            name="medicalCertificate"
            label="Medical Certificate"
            rules={[{ required: true, message: 'Please upload medical certificate' }]}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              accept=".pdf,.jpg,.jpeg,.png"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        )}

        <Form.Item name="attachment" label="Additional Documents (Optional)">
          <Upload
            listType="picture-card"
            maxCount={3}
            beforeUpload={() => false}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>

        {/* Leave Balance Warning */}
        {selectedLeaveType && (
          <Alert
            message={`Available Balance: ${
              selectedLeaveType === 'Permission' ? leaveBalances.permission.remaining + ' permissions' :
              selectedLeaveType === 'Casual Leave' ? leaveBalances.casualLeave.remaining + ' days' :
              selectedLeaveType === 'Earned Leave' ? leaveBalances.earnedLeave.remaining + ' days' :
              selectedLeaveType === 'Medical Leave' ? leaveBalances.medicalLeave.remaining + ' days' :
              selectedLeaveType === 'Maternity Leave' ? leaveBalances.maternityLeave.remaining + ' days' :
              selectedLeaveType === 'Compensatory Leave' ? leaveBalances.compensatoryLeave.remaining + ' days' :
              selectedLeaveType === 'Excuses' ? leaveBalances.excuses.remaining + ' excuses' : 'Check with HR'
            }`}
            type={
              (selectedLeaveType === 'Permission' && leaveBalances.permission.remaining <= 0) ||
              (selectedLeaveType === 'Casual Leave' && leaveBalances.casualLeave.remaining <= 0) ||
              (selectedLeaveType === 'Earned Leave' && leaveBalances.earnedLeave.remaining <= 0) ||
              (selectedLeaveType === 'Medical Leave' && leaveBalances.medicalLeave.remaining <= 0) ||
              (selectedLeaveType === 'Excuses' && leaveBalances.excuses.remaining <= 0)
                ? 'warning' : 'info'
            }
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
      </Form>
    );
  };

  // Leave Details Modal Component
  const LeaveDetailsModal = () => {
  if (!selectedLeave) return null;

  const config = getLeaveTypeConfig(selectedLeave.leave_type || selectedLeave.leaveType);

  // Updated handleLeaveActionWithClose function
  const handleLeaveActionWithClose = async (leaveId, action, reason = null) => {
    try {
      await handleLeaveAction(leaveId, action, reason);
      // Close the modal after successful action
      setLeaveDetailsModal(false);
      setSelectedLeave(null);
    } catch (error) {
      console.error('Error in leave action:', error);
    }
  };

return (
    <Modal
      title={
        <Space>
          <div style={{ color: config.color }}>{config.icon}</div>
          <span>Leave Details</span>
        </Space>
      }
      open={leaveDetailsModal}
      onCancel={() => {
        setLeaveDetailsModal(false);
        setSelectedLeave(null);
      }}
      footer={[
        <Button key="close" onClick={() => {
          setLeaveDetailsModal(false);
          setSelectedLeave(null);
        }}>
          Close
        </Button>,
        userRole !== 'employee' && selectedLeave.status === 'Pending' && (
          <Space key="actions">
            <Popconfirm
              title="Are you sure you want to reject this leave?"
              description="Please provide a rejection reason"
              onConfirm={() => handleLeaveActionWithClose(selectedLeave.id, 'reject', 'Insufficient leave balance')}
              okText="Reject"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger>
                Reject
              </Button>
            </Popconfirm>
            <Button 
              type="primary" 
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleLeaveActionWithClose(selectedLeave.id, 'approve')}
            >
              Approve
            </Button>
          </Space>
        )
      ]}
      width={600}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Employee">
          <Space>
            <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#0D7139' }} />
            <div>
              <div style={{ fontWeight: 600 }}>
                {selectedLeave.users?.name || selectedLeave.employee_name || selectedLeave.employeeName}
              </div>
              <Text type="secondary">
                {selectedLeave.users?.employee_id || selectedLeave.employee_code || selectedLeave.employeeCode} • {selectedLeave.department}
              </Text>
            </div>
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item label="Leave Type">
          <Space>
            <Tag color={config.color} style={{ borderRadius: '6px' }}>
              {selectedLeave.leave_type || selectedLeave.leaveType}
            </Tag>
            {(selectedLeave.sub_type || selectedLeave.subType) && (
              <Tag color="default">
                {(selectedLeave.leave_type || selectedLeave.leaveType) === 'Permission' && 
                  getPermissionTimeIcon(selectedLeave.sub_type || selectedLeave.subType)}
                {' '}{selectedLeave.sub_type || selectedLeave.subType}
              </Tag>
            )}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Duration">
          <div>
            <Text strong>
              {dayjs(selectedLeave.start_date || selectedLeave.startDate).format('DD MMM YYYY')}
              {(selectedLeave.end_date || selectedLeave.endDate) !== (selectedLeave.start_date || selectedLeave.startDate) && 
                ` - ${dayjs(selectedLeave.end_date || selectedLeave.endDate).format('DD MMM YYYY')}`}
            </Text>
            <br />
            <Text type="secondary">
              {(selectedLeave.total_hours || selectedLeave.totalHours) > 0 ? 
                `${selectedLeave.total_hours || selectedLeave.totalHours} hours` : 
                `${selectedLeave.total_days || selectedLeave.totalDays} day${(selectedLeave.total_days || selectedLeave.totalDays) > 1 ? 's' : ''}`}
              {(selectedLeave.start_time || selectedLeave.startTime) && (selectedLeave.end_time || selectedLeave.endTime) && (
                <> • {selectedLeave.start_time || selectedLeave.startTime} - {selectedLeave.end_time || selectedLeave.endTime}</>
              )}
            </Text>
          </div>
        </Descriptions.Item>

        <Descriptions.Item label="Reason">
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {selectedLeave.reason}
          </Paragraph>
        </Descriptions.Item>

        <Descriptions.Item label="Applied Date">
          {dayjs(selectedLeave.created_at || selectedLeave.appliedDate).format('DD MMM YYYY, hh:mm A')}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Badge 
            status={selectedLeave.status === 'Approved' ? 'success' : 
                   selectedLeave.status === 'Rejected' ? 'error' : 'processing'}
            text={selectedLeave.status}
          />
          {selectedLeave.status === 'Approved' && (selectedLeave.approved_by || selectedLeave.approvedBy) && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Approved by {selectedLeave.approved_by || selectedLeave.approvedBy} on {dayjs(selectedLeave.approved_date || selectedLeave.approvedDate).format('DD MMM YYYY')}
              </Text>
            </div>
          )}
          {selectedLeave.status === 'Rejected' && (selectedLeave.rejection_reason || selectedLeave.rejectionReason) && (
            <div style={{ marginTop: '4px' }}>
              <Text type="danger" style={{ fontSize: '12px' }}>
                Rejected: {selectedLeave.rejection_reason || selectedLeave.rejectionReason}
              </Text>
            </div>
          )}
        </Descriptions.Item>

        {((selectedLeave.medical_certificate || selectedLeave.medicalCertificate) || (selectedLeave.attachment)) && (
          <Descriptions.Item label="Attachments">
            <Space direction="vertical">
              {(selectedLeave.medical_certificate || selectedLeave.medicalCertificate) && (
                <Button 
                  type="link" 
                  icon={<FileTextOutlined />}
                  style={{ padding: 0, height: 'auto' }}
                >
                  {selectedLeave.medical_certificate || selectedLeave.medicalCertificate}
                </Button>
              )}
              {selectedLeave.attachment && (
                <Button 
                  type="link" 
                  icon={<FileTextOutlined />}
                  style={{ padding: 0, height: 'auto' }}
                >
                  {selectedLeave.attachment}
                </Button>
              )}
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};
const handleEventAction = async (eventData, action = 'create') => {
  setLoading(true);
  try {
    if (action === 'create') {
      const { error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          created_by: 'Current User',
          created_at: new Date().toISOString()
        }]);
      if (error) throw error;
      message.success('Event created successfully!');
    } else if (action === 'update') {
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', selectedEvent.id);
      if (error) throw error;
      message.success('Event updated successfully!');
    } else if (action === 'delete') {
      if (!selectedEvent || !selectedEvent.id) {
        message.error('No event selected for deletion');
        return;
      }
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', selectedEvent.id);
      if (error) throw error;
      message.success('Event deleted successfully!');
    }
    
    // Mutate events cache
    mutateEvents();
    setEventModal(false);
    setSelectedEvent(null);
    eventForm.resetFields();
  } catch (error) {
    console.error('Error with event action:', error);
    message.error('Failed to perform event action');
  } finally {
    setLoading(false);
  }
};
  // Events Component
  const EventsManagement = () => {
    const today = dayjs();
    const upcomingEvents = events.filter(event => 
      dayjs(event.event_date).isAfter(today.subtract(1, 'day'))
    );
    const todayEvents = events.filter(event => 
      dayjs(event.event_date).isSame(today, 'day')
    );
    const pastEvents = events.filter(event => 
      dayjs(event.event_date).isBefore(today, 'day')
    );

    return (
      <div>
        {/* Events Header */}
        <Card style={{ 
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space size="large">
                <Avatar 
                  size={64} 
                  icon={<CalendarOutlined />} 
                  style={{ backgroundColor: '#03481def' }}
                />
                <div>
                  <Title level={2} style={{ margin: 0, color: '#03481def' }}>
                    Company Events
                  </Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    {userRole === 'employee' 
                      ? "Stay updated with upcoming company events"
                      : "Manage company events and announcements"
                    }
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              {userRole !== 'employee' && (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedEvent(null);
                    eventForm.resetFields();
                    setEventModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '50px',
                    paddingLeft: '24px',
                    paddingRight: '24px'
                  }}
                >
                  Add Event
                </Button>
              )}
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Today's Events */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    <ClockCircleOutlined />
                  </div>
                  <span>Today's Events</span>
                  <Badge count={todayEvents.length} />
                </Space>
              }
              style={{ 
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    minHeight: '400px'
  }}
  styles={{ body: { padding: '16px' } }} // Changed from bodyStyle
>
              {todayEvents.length === 0 ? (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No events today"
                  style={{ margin: '40px 0' }}
                />
              ) : (
                <Timeline>
                  {todayEvents.map(event => (
                    <Timeline.Item
                      key={event.id}
                      dot={<ClockCircleFilled style={{ color: '#ff4d4f' }} />}
                    >
                      <EventCard event={event} userRole={userRole} onEdit={setSelectedEvent} onDelete={handleEventAction} />
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Card>
          </Col>

          {/* Upcoming Events */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    <CalendarOutlined />
                  </div>
                  <span>Upcoming Events</span>
                  <Badge count={upcomingEvents.length} />
                </Space>
              }
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                minHeight: '400px'
              }}
              styles={{ body: { padding: '16px' } }}
            >
              {upcomingEvents.length === 0 ? (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No upcoming events"
                  style={{ margin: '40px 0' }}
                />
              ) : (
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <Timeline>
                    {upcomingEvents.slice(0, 10).map(event => (
                      <Timeline.Item
                        key={event.id}
                        dot={<CalendarTwoTone twoToneColor={['#52c41a', '#73d13d']} />}
                      >
                        <EventCard event={event} userRole={userRole} onEdit={setSelectedEvent} onDelete={handleEventAction} />
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              )}
            </Card>
          </Col>

          {/* Past Events */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #bfbfbf 0%, #d9d9d9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    <HistoryOutlined />
                  </div>
                  <span>Past Events</span>
                </Space>
              }
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                minHeight: '400px'
              }}
             styles={{ body: { padding: '16px' } }} 
            >
              {pastEvents.length === 0 ? (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No past events"
                  style={{ margin: '40px 0' }}
                />
              ) : (
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <Timeline>
                    {pastEvents.slice(0, 5).map(event => (
                      <Timeline.Item
                        key={event.id}
                        dot={<div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#bfbfbf' 
                        }} />}
                        style={{ opacity: 0.7 }}
                      >
                        <EventCard event={event} userRole={userRole} isPast={true} />
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Event Modal */}
        <Modal
          title={
            <Space>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <CalendarOutlined />
              </div>
              <span>{selectedEvent ? 'Edit Event' : 'Add New Event'}</span>
            </Space>
          }
          open={eventModal}
          onCancel={() => {
            setEventModal(false);
            setSelectedEvent(null);
            eventForm.resetFields();
          }}
          footer={[
            <Button key="cancel" onClick={() => setEventModal(false)}>
              Cancel
            </Button>,
// In the Event Modal footer, replace the delete button:
selectedEvent && (
  <Popconfirm
    title="Are you sure you want to delete this event?"
    onConfirm={() => handleEventAction(null, 'delete')}
    okText="Yes"
    cancelText="No"
  >
    <Button 
      key="delete"
      danger
      loading={loading}
    >
      Delete
    </Button>
  </Popconfirm>
),
            <Button 
              key="submit" 
              type="primary" 
              onClick={() => eventForm.submit()}
              loading={loading}
              style={{
                background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                border: 'none'
              }}
            >
              {selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
          ].filter(Boolean)}
          width={600}
        >
          <EventForm 
            form={eventForm} 
            onFinish={(values) => handleEventAction(values, selectedEvent ? 'update' : 'create')}
            initialValues={selectedEvent}
          />
        </Modal>
      </div>
    );
  };

  // Event Card Component
  const EventCard = ({ event, userRole, onEdit, onDelete, isPast = false }) => {
    const eventDate = dayjs(event.event_date);
    const isToday = eventDate.isSame(dayjs(), 'day');
    const timeFromNow = eventDate.fromNow();

    return (
   <Card 
  size="small" 
  style={{ 
    marginBottom: '8px',
    borderRadius: '8px',
    border: `1px solid ${isPast ? '#d9d9d9' : isToday ? '#ff4d4f' : '#52c41a'}20`,
    background: isPast ? '#fafafa' : isToday ? '#fff2f0' : '#f6ffed',
    opacity: isPast ? 0.8 : 1
  }}
  styles={{ body: { padding: '12px' } }} // Changed from bodyStyle
  actions={userRole !== 'employee' && !isPast ? [
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              onEdit(event);
              setEventModal(true);
            }}
          />,
// In EventCard component, replace the delete action:
<Popconfirm
  title="Delete this event?"
  onConfirm={() => {
    setSelectedEvent(event); // Set the event first
    setTimeout(() => onDelete(null, 'delete'), 0); // Then delete
  }}
  okText="Yes"
  cancelText="No"
>
  <Button 
    type="text" 
    size="small" 
    icon={<DeleteOutlined />}
    danger
  />
</Popconfirm>     
   ] : undefined}
      >
        <div>
          <Text strong style={{ 
            color: isPast ? '#8c8c8c' : isToday ? '#ff4d4f' : '#52c41a',
            fontSize: '14px' 
          }}>
            {event.title}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            📅 {eventDate.format('MMM DD, YYYY')} • ⏰ {event.time || 'All Day'}
            {event.location && (
              <><br />📍 {event.location}</>
            )}
          </Text>
          <br />
          <Text style={{ fontSize: '11px', color: isPast ? '#bfbfbf' : '#666' }}>
            {timeFromNow}
          </Text>
          {event.description && (
            <>
              <br />
              <Text style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {event.description}
              </Text>
            </>
          )}
        </div>
      </Card>
    );
  };

  // Event Form Component
  const EventForm = ({ form, onFinish, initialValues }) => {
    useEffect(() => {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          event_date: dayjs(initialValues.event_date)
        });
      }
    }, [initialValues, form]);

    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          event_date: dayjs(),
          priority: 'medium'
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item
              name="title"
              label="Event Title"
              rules={[{ required: true, message: 'Please enter event title' }]}
            >
              <Input 
                placeholder="e.g., Team Meeting, Company Outing"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="priority"
              label="Priority"
            >
              <Select size="large">
                <Option value="low">
                  <Space><Tag color="green">Low</Tag></Space>
                </Option>
                <Option value="medium">
                  <Space><Tag color="orange">Medium</Tag></Space>
                </Option>
                <Option value="high">
                  <Space><Tag color="red">High</Tag></Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="event_date"
              label="Event Date"
              rules={[{ required: true, message: 'Please select event date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                size="large"
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="time"
              label="Time (Optional)"
            >
              <TimePicker 
                format="HH:mm"
                style={{ width: '100%' }}
                size="large"
                placeholder="Select time"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="location"
          label="Location (Optional)"
        >
          <Input 
            placeholder="e.g., Conference Room A, Zoom Meeting"
            size="large"
            prefix={<EnvironmentOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea
            rows={3}
            placeholder="Event details and additional information..."
            maxLength={300}
            showCount
          />
        </Form.Item>
      </Form>
    );
  };

  // Leave History Drawer
  const LeaveHistoryDrawer = () => (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>Leave History</span>
        </Space>
      }
      width={800}
      open={leaveHistoryDrawer}
      onClose={() => setLeaveHistoryDrawer(false)}
      extra={
        <Space>
          <Button
  icon={<DownloadOutlined />}
  onClick={() => setExportModalVisible(true)}
>
  Export Report
</Button>
        </Space>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by Status"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="All">All Status</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Rejected">Rejected</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by Type"
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="All">All Types</Option>
              <Option value="Permission">Permission</Option>
              <Option value="Casual Leave">Casual Leave</Option>
              <Option value="Earned Leave">Earned Leave</Option>
              <Option value="Medical Leave">Medical Leave</Option>
              <Option value="Maternity Leave">Maternity Leave</Option>
              <Option value="Compensatory Leave">Compensatory Leave</Option>
              <Option value="On Duty">On Duty</Option>
              <Option value="Excuses">Excuses</Option>
              <Option value="Overtime">Overtime</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker 
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
        </Row>
      </div>

      <Table
        columns={getTableColumns()}
        dataSource={filteredLeaves}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: 800 }}
        size="small"
      />
    </Drawer>
  );

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [])
  
  // HR/Admin Dashboard Component
  const HRDashboard = () => (
    <div style={animationStyles.container}>
      {/* HR Header */}
      <Card style={{ 
  marginBottom: '24px',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: 'none',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  ...animationStyles.headerCard
}}>
  <Row align="middle" justify="space-between" gutter={[16, 16]}>
    <Col xs={24} sm={16} md={18}>
      <Space 
        size={isMobile ? "small" : "large"} 
        direction="horizontal" // Always horizontal
        style={{ width: '100%', justifyContent: isMobile ? 'center' : 'flex-start' }}
      >
        <Avatar 
          size={isMobile ? 40 : 64} // Smaller on mobile
          icon={<TeamOutlined />} 
          style={{ backgroundColor: '#0D7139' }}
        />
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <Title 
            level={isMobile ? 4 : 2} // Smaller title on mobile
            style={{ 
              margin: 0, 
              color: '#0D7139',
              fontSize: isMobile ? '16px' : '24px',
              lineHeight: isMobile ? '1.2' : '1.5'
            }}
          >
            Leave Management
          </Title>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: isMobile ? '10px' : '16px',
              display: 'block',
              lineHeight: '1.2'
            }}
          >
            {isMobile ? 'HR Dashboard' : 'HR Dashboard - Manage all employee leaves'}
          </Text>
        </div>
      </Space>
    </Col>
    <Col xs={24} sm={8} md={6}>
      <div style={{ 
        display: 'flex',
        gap: isMobile ? '4px' : '8px',
        justifyContent: isMobile ? 'center' : 'flex-end',
        flexWrap: 'wrap'
      }}>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setLeaveHistoryDrawer(true)}
          size={isMobile ? "small" : "middle"}
          style={{ 
            fontSize: isMobile ? '10px' : '14px',
            padding: isMobile ? '4px 8px' : undefined
          }}
        >
          {isMobile ? 'Filter' : 'Advanced Filter'}
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => setExportModalVisible(true)}
          size={isMobile ? "small" : "middle"}
          style={{ 
            fontSize: isMobile ? '10px' : '14px',
            padding: isMobile ? '4px 8px' : undefined
          }}
        >
          {isMobile ? 'Export' : 'Export Report'}
        </Button>
      </div>
    </Col>
  </Row>
</Card>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #52c41a15 0%, #52c41a05 100%)',
            border: '1px solid #52c41a20',
            ...animationStyles.statsCard 
          }}>
            <Statistic
              title="Total Approved"
              value={filteredLeaves.filter(l => l.status === 'Approved').length}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #faad1415 0%, #faad1405 100%)',
            border: '1px solid #faad1420',
            ...animationStyles.statsCard 
          }}>
            <Statistic
              title="Pending Approval"
              value={filteredLeaves.filter(l => l.status === 'Pending').length}
              valueStyle={{ color: '#faad14', fontSize: '24px' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff4d4f15 0%, #ff4d4f05 100%)',
            border: '1px solid #ff4d4f20',
            ...animationStyles.statsCard 
          }}>
            <Statistic
              title="Rejected"
              value={filteredLeaves.filter(l => l.status === 'Rejected').length}
              valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0D713915 0%, #0D713905 100%)',
            border: '1px solid #0D713920',
            ...animationStyles.statsCard 
          }}>
            <Statistic
              title="Total Employees"
              value={employees.filter(emp => emp.type === 'Full-time').length}
              valueStyle={{ color: '#0D7139', fontSize: '24px' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Leave Applications Table */}
    <Card style={{ 
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      ...animationStyles.mainCard
    }}>
      {/* Mobile-Responsive Table Header */}
<div style={{ marginBottom: '20px' }}>
  <Row gutter={[16, 16]} align="middle">
    <Col xs={24} sm={12}>
      <Title level={4} style={{ 
        margin: 0, 
        color: '#0D7139', 
        fontSize: 'clamp(16px, 4vw, 20px)',
        textAlign: isMobile ? 'center' : 'left' // Use state instead of window.innerWidth
      }}>
        <NotificationOutlined style={{ marginRight: '8px' }} />
        Leave Applications
      </Title>
    </Col>
    <Col xs={24} sm={12}>
      <Row gutter={[8, 8]} justify={isMobile ? 'center' : 'end'}> {/* Use state instead of window.innerWidth */}
        <Col xs={12} sm={8}>
          <Select
            placeholder="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="All">All</Option>
            <Option value="Pending">Pending</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Rejected">Rejected</Option>
          </Select>
        </Col>
        <Col xs={12} sm={8}>
          <Select
            placeholder="Employee"
            value={filterEmployee}
            onChange={setFilterEmployee}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="All">All</Option>
            {employees.map(emp => (
              <Option key={emp.id} value={emp.id}>
                {emp.name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Col>
  </Row>
</div>

      <Table
  columns={getTableColumns()}
  dataSource={filteredLeaves}
  rowKey="id"
  loading={loading}
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => 
      `${range[0]}-${range[1]} of ${total} items`,
    simple: isMobile, // Use state instead of window.innerWidth
  }}
  scroll={{ 
    x: 'max-content',
    scrollToFirstRowOnChange: true
  }}
  size="small"
  rowClassName={(record) => 
    record.status === 'Pending' ? 'pending-row' : ''
  }
/>
    </Card>
  </div>
);


  return (
    <div style={{ 
      padding: '24px',
      background: 'transparent',
      minHeight: '100vh'
    }}>
      <style>{`
  .pending-row {
    background-color: #fff7e6 !important;
  }
  .ant-table-tbody > tr:hover.pending-row > td {
    background-color: #ffefd3 !important;
  }
  
  /* Pagination white styling */
  .ant-pagination .ant-pagination-item {
    background-color: white !important;
    border-color: #d9d9d9 !important;
  }
  
  .ant-pagination .ant-pagination-item a {
    color: #666 !important;
  }
  
  .ant-pagination .ant-pagination-item:hover {
    border-color: #0D7139 !important;
  }
  
  .ant-pagination .ant-pagination-item:hover a {
    color: #0D7139 !important;
  }
  
  .ant-pagination .ant-pagination-item-active {
    background-color: #0D7139 !important;
    border-color: #0D7139 !important;
  }
  
  .ant-pagination .ant-pagination-item-active a {
    color: white !important;
  }
  
  .ant-pagination .ant-pagination-prev,
  .ant-pagination .ant-pagination-next {
    background-color: white !important;
    border-color: #d9d9d9 !important;
  }
  
  .ant-pagination .ant-pagination-prev:hover,
  .ant-pagination .ant-pagination-next:hover {
    border-color: #0D7139 !important;
    color: #0D7139 !important;
  }
  
  .ant-pagination .ant-pagination-jump-prev,
  .ant-pagination .ant-pagination-jump-next {
    color: #666 !important;
  }
  
  .ant-pagination .ant-pagination-jump-prev:hover,
  .ant-pagination .ant-pagination-jump-next:hover {
    color: #0D7139 !important;
  }
`}</style>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: '24px' }}
        items={[
          userRole === 'employee' ? {
            key: 'dashboard',
            label: (
              <Space>
                <UserOutlined />
                <span>My Dashboard</span>
              </Space>
            ),
            children: <EmployeeDashboard />
          } : {
            key: 'dashboard',
            label: (
              <Space>
                <TeamOutlined />
                <span>HR Dashboard</span>
              </Space>
            ),
            children: <HRDashboard />
          },
          {
  key: 'calendar',
  label: (
    <Space>
      <CalendarOutlined />
      <span>Leave Calendar</span>
    </Space>
  ),
  children: <LeaveCalendarView userRole={userRole} />
}
,
  {
            key: 'events',
            label: (
              <Space>
                <CalendarOutlined />
                <span>Events</span>
                {events.filter(e => dayjs(e.event_date).isAfter(dayjs().subtract(1, 'day'))).length > 0 && (
                  <Badge 
                    count={events.filter(e => dayjs(e.event_date).isAfter(dayjs().subtract(1, 'day'))).length} 
                    size="small" 
                  />
                )}
              </Space>
            ),
            children: <EventsManagement />
          },
          userRole !== 'employee' &&
          
        {
  key: 'analytics',
  label: (
    <Space>
      <BankOutlined />
      <span>Analytics</span>
    </Space>
  ),
  children: (
    <LeaveAnalytics 
      exportModalVisible={exportModalVisible}
      setExportModalVisible={setExportModalVisible}
      filteredLeaves={filteredLeaves}
    />
  )
}
        ].filter(Boolean)}
      />

      {/* Apply Leave Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#0D7139' }} />
            <span>Apply for Leave</span>
          </Space>
        }
        open={applyLeaveModal}
        onCancel={() => {
          setApplyLeaveModal(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setApplyLeaveModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => form.submit()}
            loading={loading}
            style={{
              background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
              border: 'none'
            }}
          >
            Submit Application
          </Button>
        ]}
        width={800}
       destroyOnHidden
      >
        <ApplyLeaveForm />
      </Modal>

      {/* Leave Details Modal */}
      <LeaveDetailsModal />

      {/* Leave History Drawer */}
      <LeaveHistoryDrawer />
    </div>
  );
};

// Leave Calendar View Component
// Leave Calendar View Component
const LeaveCalendarView = ({ userRole }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [companyCalendar, setCompanyCalendar] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // month, year
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  
  // Add these missing state variables:
  const [weeklyHolidayModal, setWeeklyHolidayModal] = useState(false);
  const [weeklyHolidayForm] = Form.useForm();
  const [pendingChanges, setPendingChanges] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Rest of the component code remains the same...
  // (Continue with the existing fetchCompanyCalendar and other functions)

  // Fetch company calendar data
// Fetch company calendar data
const fetchCompanyCalendar = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('company_calendar')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) throw error;
    setCompanyCalendar(data || []);
  } catch (error) {
    console.error('Error fetching company calendar:', error);
    message.error('Failed to fetch company calendar');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchCompanyCalendar();
  }, []);

  // Get calendar data for a specific date
  // Get calendar data for a specific date (including pending changes)
const getCalendarData = (value) => {
  const dateStr = value.format('YYYY-MM-DD');
  
  // Check pending changes first, then database
  if (pendingChanges[dateStr]) {
    return pendingChanges[dateStr];
  }
  
  return companyCalendar.find(item => item.date === dateStr);
};

  // Handle calendar date update
// Handle calendar date update
const handleCalendarUpdate = (values) => {
  const dateStr = selectedCalendarDate.format('YYYY-MM-DD');
  
  const calendarData = {
    date: dateStr,
    day_type: values.dayType,
    holiday_name: values.dayType === 'holiday' ? values.holidayName : null,
    reason: values.reason || null,
    is_mandatory: values.isMandatory || false,
    created_by: 'Current User',
    updated_at: new Date().toISOString()
  };

  // Store in pending changes instead of saving to DB
  setPendingChanges(prev => ({
    ...prev,
    [dateStr]: calendarData
  }));
  
  setHasUnsavedChanges(true);
  setEditModal(false);
  calendarForm.resetFields();
  message.success('Changes saved locally. Click "Publish" to save to database.');
};
// Handle weekly holiday setup
const handleWeeklyHolidaySetup = (values) => {
  const { weekday, year, holidayName, reason } = values;
  const startDate = dayjs(`${year}-01-01`);
  const endDate = dayjs(`${year}-12-31`);
  
  // Find all dates for the selected weekday in the year
  const weeklyDates = [];
  let currentDate = startDate;
  
  // Find first occurrence of the weekday
  while (currentDate.day() !== weekday) {
    currentDate = currentDate.add(1, 'day');
  }
  
  // Add all occurrences of this weekday in the year
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    weeklyDates.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(7, 'days');
  }
  
  // Add to pending changes
  const newPendingChanges = { ...pendingChanges };
  weeklyDates.forEach(dateStr => {
    newPendingChanges[dateStr] = {
      date: dateStr,
      day_type: 'holiday',
      holiday_name: holidayName,
      reason: reason || `Weekly holiday - ${dayjs().day(weekday).format('dddd')}`,
      is_mandatory: true,
      created_by: 'Current User',
      updated_at: new Date().toISOString()
    };
  });
  
  setPendingChanges(newPendingChanges);
  setHasUnsavedChanges(true);
  setWeeklyHolidayModal(false);
  weeklyHolidayForm.resetFields();
  message.success(`${weeklyDates.length} ${dayjs().day(weekday).format('dddd')}s marked as holidays for ${year}. Click "Publish" to save.`);
};

// Publish all pending changes to database
const handlePublishChanges = async () => {
  if (!hasUnsavedChanges || Object.keys(pendingChanges).length === 0) {
    message.info('No changes to publish');
    return;
  }
  
  setLoading(true);
  try {
    const changesToPublish = Object.values(pendingChanges);
    
    // Batch update/insert to database
    for (const change of changesToPublish) {
      const existingEntry = companyCalendar.find(item => item.date === change.date);
      
      if (existingEntry) {
        // Update existing
        const { error } = await supabase
          .from('company_calendar')
          .update(change)
          .eq('id', existingEntry.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('company_calendar')
          .insert([change]);
        if (error) throw error;
      }
    }
    
    // Refresh calendar data
    await fetchCompanyCalendar();
    
    // Clear pending changes
    setPendingChanges({});
    setHasUnsavedChanges(false);
    
    message.success(`${changesToPublish.length} changes published successfully!`);
    
  } catch (error) {
    console.error('Error publishing changes:', error);
    message.error('Failed to publish changes');
  } finally {
    setLoading(false);
  }
};

// Discard pending changes
const handleDiscardChanges = () => {
  setPendingChanges({});
  setHasUnsavedChanges(false);
  message.success('Pending changes discarded');
};  // Date cell render for calendar
const dateCellRender = (value) => {
  const calendarData = getCalendarData(value);
  const isToday = value.isSame(dayjs(), 'day');
  // Remove: const isWeekend = value.day() === 0 || value.day() === 6;
  
  // All days are working by default, only override if explicitly marked
  const effectiveDayType = calendarData?.day_type || 'working';
  
  return (
    <div 
      className={`calendar-date-cell ${isToday ? 'today' : ''}`}
      style={{
        position: 'relative',
        height: '80px',
        padding: '4px',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        cursor: userRole !== 'employee' ? 'pointer' : 'default',
        backgroundColor: getDateBackground(calendarData, isToday, effectiveDayType),
        border: getDateBorder(calendarData, isToday, effectiveDayType),
      }}
      
      onClick={() => {
  if (userRole !== 'employee') {
    setSelectedCalendarDate(value);
    const existing = getCalendarData(value);
    if (existing) {
      calendarForm.setFieldsValue({
        dayType: existing.day_type,
        holidayName: existing.holiday_name,
        reason: existing.reason,
        isMandatory: existing.is_mandatory
      });
    } else {
      calendarForm.resetFields();
      calendarForm.setFieldsValue({ dayType: 'working' });
    }
    setEditModal(true);
  }
}}
    >     
        {/* Status indicators */}
{/* Status indicators */}
<div style={{
  position: 'absolute',
  top: '16px',
  left: '2px',
  right: '2px',
  zIndex: 1
}}>
  {/* Holiday badge */}
  {effectiveDayType === 'holiday' && (
    <div style={{
      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
      color: 'white',
      borderRadius: '10px',
      padding: '2px 6px',
      marginBottom: '2px',
      fontSize: '9px',
      fontWeight: '500',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(255, 77, 79, 0.3)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}>
      🎉 {calendarData?.holiday_name || 'Holiday'}
    </div>
  )}

  {/* Half Day badge */}
  {effectiveDayType === 'half_day' && (
    <div style={{
      background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
      color: 'white',
      borderRadius: '10px',
      padding: '2px 6px',
      marginBottom: '2px',
      fontSize: '9px',
      fontWeight: '500',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(250, 173, 20, 0.3)',
    }}>
      🕑 Half Day
    </div>
  )}

  {/* ✅ Working Day badge */}
  {effectiveDayType === 'working' && (
    <div style={{
      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
      color: 'white',
      borderRadius: '10px',
      padding: '2px 6px',
      marginBottom: '2px',
      fontSize: '9px',
      fontWeight: '500',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(82, 196, 26, 0.3)',
    }}>
      ✅ Working Day
    </div>
  )}

        {/* Remove the working indicator completely since all days are working by default */}
        
        {/* Reason tooltip */}
        {calendarData?.reason && (
          <Tooltip title={calendarData.reason} placement="bottom">
            <div style={{
              background: 'rgba(13, 113, 57, 0.1)',
              border: '1px solid rgba(13, 113, 57, 0.2)',
              color: '#0D7139',
              borderRadius: '8px',
              padding: '2px 4px',
              fontSize: '8px',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'help'
            }}>
              📝 Info
            </div>
          </Tooltip>
        )}
      </div>

        
        {/* Edit button for HR/Admin */}
   {userRole !== 'employee' && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          opacity: 0,
          transition: 'opacity 0.2s ease'
        }}
        className="edit-indicator">
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
          }}>
            <EditOutlined />
          </div>
        </div>
      )}
    </div>
  );
};
const getDateBackground = (calendarData, isToday) => {
  if (isToday) {
    return 'linear-gradient(135deg, rgba(13, 113, 57, 0.1) 0%, rgba(13, 113, 57, 0.05) 100%)';
  }
  
  // Only show special background for explicitly marked days
  if (!calendarData) {
    return 'transparent'; // All days are working by default, no special background needed
  }
  
  switch (calendarData.day_type) {
    case 'holiday':
      return 'linear-gradient(135deg, rgba(255, 77, 79, 0.08) 0%, rgba(255, 77, 79, 0.03) 100%)';
    case 'half_day':
      return 'linear-gradient(135deg, rgba(250, 173, 20, 0.08) 0%, rgba(250, 173, 20, 0.03) 100%)';
    // Remove 'working' case since it's default
    default:
      return 'transparent';
  }
};

  const getDateBorder = (calendarData, isToday) => {
    if (isToday) {
      return '2px solid #0D7139';
    }
    if (!calendarData) return 'none';
    
    switch (calendarData.day_type) {
      case 'holiday':
        return '1px solid rgba(255, 77, 79, 0.2)';
      case 'half_day':
        return '1px solid rgba(250, 173, 20, 0.2)';
      case 'working':
        return '1px solid rgba(82, 196, 26, 0.2)';
      default:
        return 'none';
    }
  };

  return (
    <>
      {/* Custom styles */}
      <style>{`
        .calendar-date-cell:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        .calendar-date-cell:hover .edit-indicator {
          opacity: 1 !important;
        }
        
        .calendar-date-cell.today {
          box-shadow: 0 0 0 2px rgba(13, 113, 57, 0.2), 0 4px 12px rgba(13, 113, 57, 0.15);
        }
        
        .calendar-date-cell.weekend {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%);
        }
        
        .ant-picker-calendar .ant-picker-calendar-date {
          border: none !important;
          border-radius: 8px !important;
          margin: 2px !important;
        }
        
        .ant-picker-calendar-header {
          padding: 16px 24px !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        
        .ant-picker-calendar-header .ant-picker-calendar-year-select,
        .ant-picker-calendar-header .ant-picker-calendar-month-select {
          min-width: 120px !important;
        }
      `}</style>

      <Card style={{ 
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  border: 'none',
  borderRadius: '20px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden'
}}>
  {/* Mobile-Responsive Enhanced Header */}
  <div style={{ 
    marginBottom: '24px',
    padding: '16px',
    background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(13, 113, 57, 0.1)'
  }}>
    {/* Title Section */}
    <div style={{ marginBottom: '16px' }}>
      <Title level={3} style={{ 
        margin: 0, 
        color: '#0D7139', 
        fontSize: 'clamp(18px, 4vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <CalendarTwoTone 
          twoToneColor={['#0D7139', '#52c41a']} 
          style={{ fontSize: '24px', flexShrink: 0 }} 
        />
        <span>Company Calendar</span>
      </Title>
    </div>

    {/* Legend Section - Mobile Optimized */}
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap',
      gap: '8px', 
      alignItems: 'center',
      padding: '12px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      marginBottom: '16px'
    }}>
      <Tooltip title="Public Holidays">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          minWidth: 'fit-content',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'rgba(255, 77, 79, 0.05)'
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)', 
            borderRadius: '3px',
            boxShadow: '0 1px 3px rgba(255, 77, 79, 0.3)',
            flexShrink: 0
          }}></div>
          <Text style={{ 
            fontSize: '12px', 
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>Holiday</Text>
        </div>
      </Tooltip>
      
      <Tooltip title="Half Working Days">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          minWidth: 'fit-content',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'rgba(250, 173, 20, 0.05)'
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', 
            borderRadius: '3px',
            boxShadow: '0 1px 3px rgba(250, 173, 20, 0.3)',
            flexShrink: 0
          }}></div>
          <Text style={{ 
            fontSize: '12px', 
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>Half Day</Text>
        </div>
      </Tooltip>
      
      <Tooltip title="Special Working Days">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          minWidth: 'fit-content',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'rgba(82, 196, 26, 0.05)'
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', 
            borderRadius: '3px',
            boxShadow: '0 1px 3px rgba(82, 196, 26, 0.3)',
            flexShrink: 0
          }}></div>
          <Text style={{ 
            fontSize: '12px', 
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>Working</Text>
        </div>
      </Tooltip>
    </div>

    {/* Action Buttons - Mobile Responsive */}
    {userRole !== 'employee' && (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Primary Actions Row */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          <Tooltip title="Set Weekly Holiday">
            <Button 
              icon={<CalendarOutlined style={{ fontSize: '14px' }} />}
              size="middle"
              style={{ 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minWidth: '90px',
                height: '36px'
              }}
              onClick={() => {
                weeklyHolidayForm.resetFields();
                setWeeklyHolidayModal(true);
              }}
            >
              <span style={{ fontSize: '8px' }}>Weekly Holiday</span>
            </Button>
          </Tooltip>
          
          <Tooltip title="Quick Add Holiday">
            <Button 
              type="primary" 
              icon={<PlusOutlined style={{ fontSize: '14px' }} />}
              size="middle"
              style={{
                background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minWidth: '80px',
                height: '36px'
              }}
              onClick={() => {
                setSelectedCalendarDate(dayjs());
                calendarForm.resetFields();
                calendarForm.setFieldsValue({ dayType: 'holiday' });
                setEditModal(true);
              }}
            >
              <span style={{ fontSize: '10px' }}>Add Holiday</span>
            </Button>
          </Tooltip>
        </div>

        {/* Secondary Actions Row - Only show when needed */}
        {hasUnsavedChanges && (
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            padding: '8px',
            background: 'rgba(82, 196, 26, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(82, 196, 26, 0.2)'
          }}>
            <Badge 
              count={Object.keys(pendingChanges).length} 
              size="small"
              style={{ fontSize: '10px' }}
            >
              <Button 
                type="primary"
                icon={<SaveOutlined style={{ fontSize: '14px' }} />}
                size="middle"
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '100px',
                  height: '36px'
                }}
                onClick={handlePublishChanges}
                loading={loading}
              >
                <span style={{ fontSize: '10px' }}>Publish</span>
              </Button>
            </Badge>
            
            <Button 
              icon={<CloseCircleOutlined style={{ fontSize: '14px' }} />}
              size="middle"
              danger
              style={{ 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minWidth: '80px',
                height: '36px'
              }}
              onClick={handleDiscardChanges}
            >
              <span style={{ fontSize: '12px' }}>Discard</span>
            </Button>
          </div>
        )}
      </div>
    )}
  </div>

  {/* Weekly Holiday Setup Modal - Mobile Optimized */}
  {userRole !== 'employee' && (
    <Modal
      title={
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0
          }}>
            <CalendarOutlined />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              Set Weekly Holiday
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Mark all occurrences of a weekday as holiday
            </Text>
          </div>
        </div>
      }
      open={weeklyHolidayModal}
      onCancel={() => {
        setWeeklyHolidayModal(false);
        weeklyHolidayForm.resetFields();
      }}
      footer={[
        <Button 
          key="cancel" 
          onClick={() => setWeeklyHolidayModal(false)}
          style={{ marginRight: '8px' }}
        >
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={() => weeklyHolidayForm.submit()}
          style={{
            background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
            border: 'none',
            borderRadius: '6px'
          }}
          icon={<CalendarOutlined />}
        >
          Set Holiday
        </Button>
      ]}
      width="90%"
      style={{ maxWidth: '500px' }}
      centered
    >
      <Form
        form={weeklyHolidayForm}
        layout="vertical"
        onFinish={handleWeeklyHolidaySetup}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="weekday"
              label="Select Weekday"
              rules={[{ required: true, message: 'Please select a weekday' }]}
            >
              <Select 
                placeholder="Choose weekday"
                size="large"
                style={{ borderRadius: '8px' }}
              >
                <Option value={1}>Monday</Option>
                <Option value={2}>Tuesday</Option>
                <Option value={3}>Wednesday</Option>
                <Option value={4}>Thursday</Option>
                <Option value={5}>Friday</Option>
                <Option value={6}>Saturday</Option>
                <Option value={0}>Sunday</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              name="year"
              label="Select Year"
              rules={[{ required: true, message: 'Please select a year' }]}
            >
              <Select 
                placeholder="Choose year"
                size="large"
                style={{ borderRadius: '8px' }}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = dayjs().year() + i;
                  return (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="holidayName"
          label="Holiday Name"
          rules={[{ required: true, message: 'Please enter holiday name' }]}
        >
          <Input 
            placeholder="e.g., Weekly Off, Saturday Holiday"
            size="large"
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Description (Optional)"
        >
          <TextArea
            rows={2}
            placeholder="Additional details about this weekly holiday..."
            maxLength={100}
            showCount
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )}
        
  {/* Professional Calendar */}
  <div style={{ 
    padding: '0 8px'
  }}>
    <style>{`
      .ant-picker-calendar {
        background: transparent !important;
      }
      
      /* Mobile calendar optimizations */
      @media (max-width: 768px) {
        .ant-picker-calendar .ant-picker-calendar-header {
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .ant-picker-calendar .ant-picker-calendar-date {
          height: 40px;
        }
        
        .ant-picker-calendar .ant-picker-calendar-date-content {
          font-size: 12px;
        }
      }
    `}</style>
    
    <Calendar 
      key={companyCalendar.length}
      cellRender={(value, info) => {
        if (info.type === 'date') {
          return dateCellRender(value);
        }
        return info.originNode;
      }}
      onSelect={(date) => setSelectedDate(date)}
      headerRender={({ value, type, onChange, onTypeChange }) => (
        <div style={{ 
          padding: '16px', 
          background: 'white',
          borderBottom: '1px solid #f0f0f0',
          borderRadius: '12px 12px 0 0'
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Date Selection Row */}
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}>
              <Select
                size="large"
                value={value.month()}
                onChange={(month) => {
                  const newValue = value.clone().month(month);
                  onChange(newValue);
                }}
                style={{ 
                  minWidth: '120px',
                  flex: '1 1 auto'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <Option key={i} value={i}>
                    {dayjs().month(i).format('MMMM')}
                  </Option>
                ))}
              </Select>
              
              <Select
                size="large"
                value={value.year()}
                onChange={(year) => {
                  const newValue = value.clone().year(year);
                  onChange(newValue);
                }}
                style={{ 
                  minWidth: '90px',
                  flex: '0 0 auto'
                }}
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = dayjs().year() - 5 + i;
                  return (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  );
                })}
              </Select>
            </div>
            
            {/* Action Buttons Row */}
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Button 
                onClick={() => {
                  const today = dayjs();
                  onChange(today);
                }}
                style={{ 
                  borderRadius: '6px',
                  minWidth: '70px'
                }}
              >
                Today
              </Button>
              
              <div style={{ 
                display: 'flex',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <Button 
                  type={type === 'month' ? 'primary' : 'default'}
                  onClick={() => onTypeChange('month')}
                  style={{ 
                    borderRadius: '0',
                    border: 'none',
                    minWidth: '60px'
                  }}
                >
                  Month
                </Button>
                <Button 
                  type={type === 'year' ? 'primary' : 'default'}
                  onClick={() => onTypeChange('year')}
                  style={{ 
                    borderRadius: '0',
                    border: 'none',
                    borderLeft: '1px solid #d9d9d9',
                    minWidth: '60px'
                  }}
                >
                  Year
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    />
  </div>
</Card>

      {/* Enhanced Calendar Edit Modal */}
      {userRole !== 'employee' && (
        <Modal
          title={
            <Space>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <CalendarOutlined />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  Edit Calendar Date
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {selectedCalendarDate?.format('dddd, MMMM DD, YYYY')}
                </Text>
              </div>
            </Space>
          }
          open={editModal}
          onCancel={() => {
            setEditModal(false);
            calendarForm.resetFields();
          }}
          footer={[
            <Button key="cancel" onClick={() => setEditModal(false)}>
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={() => calendarForm.submit()}
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              <SaveOutlined /> Save Changes
            </Button>
          ]}
          width={600}
          centered
          styles={{
            header: {
              padding: '20px 24px',
              borderBottom: '1px solid #f0f0f0'
            },
            body: {
              padding: '24px'
            }
          }}
        >
          <Form
            form={calendarForm}
            layout="vertical"
            onFinish={handleCalendarUpdate}
            initialValues={{ dayType: 'working' }}
          >
            <Form.Item
              name="dayType"
              label={
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Day Type
                </span>
              }
              rules={[{ required: true, message: 'Please select day type' }]}
            >
              <Radio.Group 
                size="large"
                style={{ width: '100%' }}
                buttonStyle="solid"
              >
                <Radio.Button 
                  value="working" 
                  style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    borderRadius: '8px 0 0 8px'
                  }}
                >
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> Working Day
                </Radio.Button>
                <Radio.Button 
                  value="holiday" 
                  style={{ 
                    flex: 1, 
                    textAlign: 'center'
                  }}
                >
                  <ThunderboltOutlined style={{ color: '#ff4d4f' }} /> Holiday
                </Radio.Button>
                <Radio.Button 
                  value="half_day" 
                  style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    borderRadius: '0 8px 8px 0'
                  }}
                >
                  <ClockCircleOutlined style={{ color: '#faad14' }} /> Half Day
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.dayType !== currentValues.dayType
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('dayType') === 'holiday' ? (
                  <Form.Item
                    name="holidayName"
                    label={
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        Holiday Name
                      </span>
                    }
                    rules={[{ required: true, message: 'Please enter holiday name' }]}
                  >
                    <Input 
                      placeholder="e.g., Diwali, Christmas, Independence Day"
                      size="large"
                      prefix={<ThunderboltOutlined style={{ color: '#ff4d4f' }} />}
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="reason"
              label={
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Description
                </span>
              }
            >
              <TextArea
                rows={3}
                placeholder="Provide additional details about this day..."
                maxLength={200}
                showCount
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="isMandatory"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <div style={{
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <Space>
                  <Switch 
                    size="small"
                    style={{
                      background: '#52c41a'
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Mandatory Holiday
                  </span>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    (Cannot be overridden by employees)
                  </Text>
                </Space>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};
const generateLeaveData = () => {
  // Return empty array as we're using real data from Supabase
  return [];
};

// 2. Add Export Modal Component (add this before the LeaveManagementPage component)
const ExportReportModal = ({ visible, onCancel, leaveData }) => {
  const [exportForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleExport = async (values) => {
    setLoading(true);
    try {
      const { month, year } = values;
      const startDate = dayjs(`${year}-${month + 1}-01`);
      const endDate = startDate.endOf('month');
      
      // Filter leaves for the selected month/year
      const filteredLeaves = leaveData.filter(leave => {
        const leaveDate = dayjs(leave.start_date || leave.startDate);
        return leaveDate.isAfter(startDate.subtract(1, 'day')) && 
               leaveDate.isBefore(endDate.add(1, 'day'));
      });

      // Prepare data for export
      const exportData = filteredLeaves.map(leave => ({
        'Employee Name': leave.users?.name || leave.employee_name || leave.employeeName,
        'Employee ID': leave.users?.employee_id || leave.employee_code || leave.employeeCode,
        'Department': leave.department,
        'Leave Type': leave.leave_type || leave.leaveType,
        'Sub Type': leave.sub_type || leave.subType || '-',
        'Start Date': dayjs(leave.start_date || leave.startDate).format('DD/MM/YYYY'),
        'End Date': dayjs(leave.end_date || leave.endDate).format('DD/MM/YYYY'),
        'Total Days': leave.total_days || leave.totalDays || 0,
        'Total Hours': leave.total_hours || leave.totalHours || 0,
        'Status': leave.status,
        'Applied Date': dayjs(leave.created_at || leave.appliedDate).format('DD/MM/YYYY'),
        'Approved By': leave.approved_by || leave.approvedBy || '-',
        'Reason': leave.reason || '-'
      }));

      // Create CSV content
      if (exportData.length === 0) {
        message.warning('No leave data found for the selected month/year');
        return;
      }

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_report_${startDate.format('MMM_YYYY')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`Leave report for ${startDate.format('MMMM YYYY')} downloaded successfully!`);
      onCancel();
      exportForm.resetFields();
      
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined style={{ color: '#0D7139' }} />
          <span>Export Leave Report</span>
        </Space>
      }
      open={visible}
      onCancel={() => {
        onCancel();
        exportForm.resetFields();
      }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="export" 
          type="primary" 
          onClick={() => exportForm.submit()}
          loading={loading}
          style={{
            background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
            border: 'none'
          }}
        >
          <DownloadOutlined /> Export Report
        </Button>
      ]}
      width={400}
    >
      <Form
        form={exportForm}
        layout="vertical"
        onFinish={handleExport}
        initialValues={{
          month: dayjs().month(),
          year: dayjs().year()
        }}
      >
        <Form.Item
          name="month"
          label="Select Month"
          rules={[{ required: true, message: 'Please select month' }]}
        >
          <Select size="large" placeholder="Choose month">
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i} value={i}>
                {dayjs().month(i).format('MMMM')}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="year"
          label="Select Year"
          rules={[{ required: true, message: 'Please select year' }]}
        >
          <Select size="large" placeholder="Choose year">
            {Array.from({ length: 5 }, (_, i) => {
              const year = dayjs().year() - 2 + i;
              return (
                <Option key={year} value={year}>
                  {year}
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        <Alert
          message="Export Format"
          description="The report will be downloaded as a CSV file containing all leave applications for the selected month and year."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Form>
    </Modal>
  );
};

// Leave Analytics Component  
const LeaveAnalytics = ({ exportModalVisible, setExportModalVisible, filteredLeaves }) => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch real leave data for analytics
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const data = await fetchLeaveApplications();
        setLeaveData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading analytics...</div>
      </div>
    );
  }

  if (leaveData.length === 0) {
    return (
      <Empty 
        description="No leave data available for analytics"
        style={{ padding: '50px' }}
      />
    );
  }

  // Calculate analytics data using real data
  const leaveTypeStats = leaveData.reduce((acc, leave) => {
    const leaveType = leave.leave_type || leave.leaveType;
    acc[leaveType] = (acc[leaveType] || 0) + 1;
    return acc;
  }, {});

  const departmentStats = leaveData.reduce((acc, leave) => {
    acc[leave.department] = (acc[leave.department] || 0) + 1;
    return acc;
  }, {});

  const monthlyStats = leaveData.reduce((acc, leave) => {
    const month = dayjs(leave.start_date || leave.startDate).format('MMM YYYY');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const statusStats = leaveData.reduce((acc, leave) => {
    acc[leave.status] = (acc[leave.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* Leave Type Distribution */}
        <Col xs={24} lg={12}>
          <Card 
            title="Leave Type Distribution" 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ height: '300px' }}>
              {Object.entries(leaveTypeStats).map(([type, count]) => {
                const config = getLeaveTypeConfig(type);
                const percentage = (count / leaveData.length) * 100;
                
                return (
                  <div key={type} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Space>
                        <div style={{ color: config.color }}>{config.icon}</div>
                        <Text>{type}</Text>
                      </Space>
                      <Text strong>{count}</Text>
                    </div>
                   <Progress 
  percent={percentage}
  strokeColor={config.color}
  showInfo={false}
  size="small"
/>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Department Wise Statistics */}
        <Col xs={24} lg={12}>
          <Card 
            title="Department Wise Leaves" 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ height: '300px' }}>
              {Object.entries(departmentStats).map(([dept, count]) => {
                const percentage = (count / leaveData.length) * 100;
                const colors = ['#0D7139', '#52c41a', '#1890ff', '#722ed1', '#fa8c16'];
                const color = colors[Object.keys(departmentStats).indexOf(dept) % colors.length];
                
                return (
                  <div key={dept} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text>{dept}</Text>
                      <Text strong>{count}</Text>
                    </div>
                    <Progress 
                      percent={percentage}
                      strokeColor={color}
                      showInfo={false}
                      strokeWidth={8}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Status Overview */}
        <Col xs={24} md={12}>
          <Card 
            title="Status Overview" 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(statusStats).map(([status, count]) => {
                const color = status === 'Approved' ? '#52c41a' : 
                             status === 'Rejected' ? '#ff4d4f' : '#faad14';
                const icon = status === 'Approved' ? <CheckCircleOutlined /> : 
                            status === 'Rejected' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
                
                return (
                  <div key={status} style={{ 
                    padding: '12px',
                    background: `${color}10`,
                    borderRadius: '8px',
                    border: `1px solid ${color}20`
                  }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <div style={{ color }}>{icon}</div>
                        <Text>{status}</Text>
                      </Space>
                      <Text strong style={{ color, fontSize: '18px' }}>
                        {count}
                      </Text>
                    </Space>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        {/* Monthly Trends */}
        <Col xs={24} md={12}>
          <Card 
            title="Monthly Leave Trends" 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Row gutter={[16, 16]}>
              {Object.entries(monthlyStats).slice(-6).map(([month, count]) => (
                <Col xs={12} sm={8} md={6} key={month}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px auto',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {count}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {month}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
      <ExportReportModal 
  visible={exportModalVisible}
  onCancel={() => setExportModalVisible(false)}
  leaveData={filteredLeaves}
/>
    </div>
  );
};
export default LeaveManagementPage;
