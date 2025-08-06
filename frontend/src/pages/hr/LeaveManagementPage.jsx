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
import HRDashboard from './HRDashboard';
import LeaveCalendar from './LeaveCalendar';
import Events from './Events';
import Analytics from './Analytics';

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

// Fetch functions
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

const fetchCompanyCalendar = async () => {
  try {
    const { data, error } = await supabase
      .from('company_calendar')
      .select('date, day_type')
      .eq('day_type', 'holiday');

    if (error) throw error;
    return new Set(data.map(d => d.date));
  } catch (error) {
    console.error('Error fetching company calendar:', error);
    message.error('Failed to fetch company calendar');
    return new Set();
  }
};

const fetchWorkingDays = async (userId, holidays) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('date')
      .eq('user_id', userId)
      .eq('is_present', true);

    if (error) throw error;

    const workingDays = data.filter(attendance => !holidays.has(attendance.date));
    return workingDays.length;
  } catch (error) {
    console.error('Error fetching working days:', error);
    return 0;
  }
};

const fetchCompensatoryOffDays = async (userId, holidays) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('date')
      .eq('user_id', userId)
      .eq('is_present', true);

    if (error) throw error;

    const compensatoryDays = data.filter(attendance => holidays.has(attendance.date));
    return compensatoryDays.length;
  } catch (error) {
    console.error('Error fetching compensatory off days:', error);
    return 0;
  }
};

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
    return null;
  }
};

const calculateLeaveBalances = async (userId, currentUser) => {
  const balanceData = await fetchLeaveBalances(userId);
  const holidays = await fetchCompanyCalendar();
  const workingDays = await fetchWorkingDays(userId, holidays);
  const compensatoryDays = await fetchCompensatoryOffDays(userId, holidays);

  const earnedFromWorkingDays = Math.floor(workingDays / 20);

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

  balanceData.compensatory_total = compensatoryDays;
  balanceData.compensatory_remaining = compensatoryDays - (balanceData.compensatory_used || 0);

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
      monthlyUsed: balanceData.casual_monthly_used || 0
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
  const [leaveData, setLeaveData] = useState([]);
  const [events, setEvents] = useState([]);
  const [leaveBalanceRaw, setLeaveBalanceRaw] = useState(null);
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
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModal, setEventModal] = useState(false);
  const [eventForm] = Form.useForm();

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const leaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
        const balances = await calculateLeaveBalances(currentUserId, currentUser);
        
        setLeaveData(leaves);
        setLeaveBalances(balances);
        
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
  }, [userRole, currentUserId, currentUser, filterStatus, filterType, filterEmployee]);

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
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();
        
      if (!userData) {
        message.error('User information not found');
        return;
      }
      
      const totalDays = values.leaveType === 'Permission' ? 0 : 
                   (values.endDate ? values.endDate.diff(values.startDate, 'days') + 1 : 1);

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
        total_days: totalDays,
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
      
      await updateLeaveBalance(currentUserId, values.leaveType, totalDays);

      fetchLeaveApplications(userRole === 'employee' ? currentUserId : null).then(setLeaveData);
      
      const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
      setLeaveBalances(updatedBalances);
      
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

  const updateLeaveBalance = async (userId, leaveType, daysApplied) => {
    try {
      const currentBalances = await fetchLeaveBalances(userId);
      if (!currentBalances) {
        console.error("Could not find leave balances for the user to update.");
        return;
      }

      const updates = {};
      const days = Number(daysApplied) || 0;
        
      switch (leaveType) {
        case 'Permission':
          updates.permission_used = (currentBalances.permission_used || 0) + 1;
          updates.permission_remaining = (currentBalances.permission_remaining || 2) - 1;
          break;
        case 'Casual Leave':
          const casualDays = daysApplied === 0.5 ? 0.5 : Math.ceil(daysApplied);
          updates.casual_used = (currentBalances.casual_used || 0) + casualDays;
          updates.casual_remaining = (currentBalances.casual_remaining || 12) - casualDays;
          updates.casual_monthly_used = (currentBalances.casual_monthly_used || 0) + 1;
          break;
        case 'Earned Leave':
          updates.earned_used = (currentBalances.earned_used || 0) + days;
          updates.earned_remaining = (currentBalances.earned_remaining || 0) - days;
          break;
        case 'Medical Leave':
          updates.medical_used = (currentBalances.medical_used || 0) + days;
          updates.medical_remaining = (currentBalances.medical_remaining || 12) - days;
          break;
        case 'Maternity Leave':
          updates.maternity_used = (currentBalances.maternity_used || 0) + days;
          updates.maternity_remaining = (currentBalances.maternity_remaining || 84) - days;
          break;
        case 'Compensatory Leave':
          updates.compensatory_used = (currentBalances.compensatory_used || 0) + days;
          updates.compensatory_remaining = (currentBalances.compensatory_remaining || 0) - days;
          break;
        case 'Excuses':
          updates.excuses_used = (currentBalances.excuses_used || 0) + 1;
          updates.excuses_remaining = (currentBalances.excuses_remaining || 1) - 1;
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
      message.error(`Failed to update leave balance for ${leaveType}.`);
    }
  };

  const getAvailableLeaveTypes = () => {
    const available = [];
    
    if (leaveBalances.permission?.remaining > 0) available.push('Permission');
    if (leaveBalances.casualLeave?.remaining > 0 && leaveBalances.casualLeave?.monthlyUsed < 1) available.push('Casual Leave');
    if (leaveBalances.earnedLeave?.remaining > 0) available.push('Earned Leave');
    if (leaveBalances.maternityLeave?.remaining > 0) available.push('Maternity Leave');
    if (leaveBalances.compensatoryLeave?.remaining > 0) available.push('Compensatory Leave');
    if (leaveBalances.excuses?.remaining > 0) available.push('Excuses');
    
    available.push('Medical Leave');
    available.push('On Duty', 'Overtime');
    
    return available;
  };

  const handleLeaveAction = async (leaveId, action, reason = null) => {
    setLoading(true);
    try {
      const updates = {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        approved_by: action === 'approve' ? (currentUser?.name || 'Admin') : null,
        approved_date: action === 'approve' ? new Date().toISOString().split('T')[0] : null,
        rejection_reason: action === 'reject' ? reason : null,
      };
      
      const { error } = await supabase
        .from('leave_applications')
        .update(updates)
        .eq('id', leaveId);
      
      if (error) throw error;
      
      fetchLeaveApplications(userRole === 'employee' ? currentUserId : null).then(setLeaveData);
      
      message.success(`Leave ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing leave:`, error);
      message.error(`Failed to ${action} leave. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

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
                      fontSize: 'clamp(18px, 4vw, 24px)'
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
              block
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
            <Col xs={12} sm={8} md={6} lg={4} xl={4} key={key}>
              <Card 
                style={{ 
                  borderRadius: '12px',
                  background: '#ffffff', 
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  ...animationStyles.statsCard 
                }}
                styles={{ body: { padding: '12px' } }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    color: config.color, 
                    marginBottom: '6px' 
                  }}>
                    {config.icon}
                  </div>
                  <Title level={5} style={{ 
                    margin: '0 0 6px 0', 
                    color: config.color,
                    fontSize: 'clamp(11px, 2.5vw, 14px)',
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
          <Timeline
            items={filteredLeaves.slice(0, 5).map(leave => {
              const config = getLeaveTypeConfig(leave.leave_type);
              return {
                key: leave.id,
                dot: <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: config.gradient,
                  border: '2px solid white', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                }} />,
                children: (
                  <Card 
                    size="small" 
                    style={{ 
                      marginBottom: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${config.color}20`,
                      background: `linear-gradient(135deg, ${config.color}08 0%, ${config.color}03 100%)`
                    }}
                    styles={{ body: { padding: '12px' } }}
                  >
                    <Row align="middle" justify="space-between">
                      <Col flex="auto">
                        <Space>
                          {config.icon}
                          <div>
                            <Text strong style={{ color: config.color }}>
                              {leave.leave_type}
                              {leave.sub_type && ` (${leave.sub_type})`}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {dayjs(leave.start_date).format('MMM DD')} - {dayjs(leave.end_date).format('MMM DD, YYYY')}
                              {leave.total_hours > 0 && ` • ${leave.total_hours}h`}
                              {leave.total_days > 0 && ` • ${leave.total_days} day${leave.total_days > 1 ? 's' : ''}`}
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
                )
              };
            })}
          />
        </div>
      </Card>
    </div>
  );

  // Apply Leave Form Component
  const ApplyLeaveForm = () => {
    const [selectedLeaveType, setSelectedLeaveType] = useState('');

    const isPermissionDisabled = leaveBalances.permission?.remaining <= 0;
    const isCasualDisabled = leaveBalances.casualLeave?.remaining <= 0 || leaveBalances.casualLeave?.monthlyUsed >= 1;
    const isEarnedDisabled = !leaveBalances.earnedLeave || leaveBalances.earnedLeave.remaining <= 0;
    const isCompensatoryDisabled = !leaveBalances.compensatoryLeave || leaveBalances.compensatoryLeave.remaining <= 0;
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
                    Earned Leave ({leaveBalances.earnedLeave?.remaining || 0} remaining)
                  </Space>
                </Option>
                <Option value="Medical Leave">
                  <Space>
                    <MedicineBoxOutlined style={{ color: '#ff4d4f' }} />
                    Medical Leave ({leaveBalances.medicalLeave?.remaining} remaining)
                  </Space>
                </Option>
                <Option value="Maternity Leave">
                  <Space>
                    <MedicineBoxOutlined style={{ color: '#eb2f96' }} />
                    Maternity Leave ({leaveBalances.maternityLeave?.remaining} remaining)
                  </Space>
                </Option>
                <Option value="Compensatory Leave" disabled={isCompensatoryDisabled}>
                  <Space>
                    <DollarOutlined style={{ color: '#722ed1' }} />
                    Compensatory Leave ({leaveBalances.compensatoryLeave?.remaining || 0} remaining)
                  </Space>
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
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
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

        <Form.Item 
          name="attachment" 
          label="Additional Documents (Optional)"
          valuePropName="fileList"
          getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
        >
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

  return (
    <div style={{ 
      padding: '24px',
      background: 'transparent',
      minHeight: '100vh'
    }}>
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
            children: <HRDashboard 
              userRole={userRole}
              filteredLeaves={filteredLeaves}
              employees={employees}
              loading={loading}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterEmployee={filterEmployee}
              setFilterEmployee={setFilterEmployee}
              setLeaveHistoryDrawer={setLeaveHistoryDrawer}
              setExportModalVisible={setExportModalVisible}
              handleLeaveAction={handleLeaveAction}
              setSelectedLeave={setSelectedLeave}
              setLeaveDetailsModal={setLeaveDetailsModal}
              getLeaveTypeConfig={getLeaveTypeConfig}
              isLoaded={isLoaded}
              animationStyles={animationStyles}
              currentUser={currentUser}
            />
          },
          {
            key: 'calendar',
            label: (
              <Space>
                <CalendarOutlined />
                <span>Leave Calendar</span>
              </Space>
            ),
            children: <LeaveCalendar userRole={userRole} />
          },
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
            children: <Events 
              userRole={userRole}
              events={events}
              setEvents={setEvents}
              loading={loading}
              setLoading={setLoading}
            />
          },
          userRole !== 'employee' && {
            key: 'analytics',
            label: (
              <Space>
                <BankOutlined />
                <span>Analytics</span>
              </Space>
            ),
            children: <Analytics 
              exportModalVisible={exportModalVisible}
              setExportModalVisible={setExportModalVisible}
              filteredLeaves={filteredLeaves}
              getLeaveTypeConfig={getLeaveTypeConfig}
            />
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
    </div>
  );
};

export default LeaveManagementPage;