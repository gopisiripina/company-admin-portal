import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween'; // <-- ADD THIS LINE
import { supabase } from '../../supabase/config';
import useSWR, { mutate } from 'swr';
import Analytics from './Analytics'; // Add this line - adjust path as needed


dayjs.extend(relativeTime);
dayjs.extend(isBetween); // <-- AND ADD THIS LINE


// Add this function after your imports
const uploadFileToSupabase = async (file, bucketName = 'leave-documents') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

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
  }
};

const fetchCompanyCalendar = async () => {
  try {
    const { data, error } = await supabase
      .from('company_calendar')
      .select('date, day_type')
      .eq('day_type', 'holiday');

    if (error) throw error;
    // Return a set of holiday dates for quick lookup
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

    // Filter out holidays from the present days
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

    // Filter for days worked on a holiday
    const compensatoryDays = data.filter(attendance => holidays.has(attendance.date));
    return compensatoryDays.length;
  } catch (error) {
    console.error('Error fetching compensatory off days:', error);
    return 0;
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
    message.error('Failed to fetch leave applications');
    return [];
  }
};


const fetchLeaveBalances = async (userId) => {
  try {
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

    // Check if it's a new year and add 12 new casual leaves
    if (data) {
      const currentYear = new Date().getFullYear();
      const lastUpdatedYear = new Date(data.last_updated || data.created_at).getFullYear();
      
      if (currentYear > lastUpdatedYear) {
        // Add 12 new casual leaves to existing remaining balance
        const newCasualTotal = data.casual_remaining + 12;
        const newCasualRemaining = data.casual_remaining + 12;
        
        const { error: updateError } = await supabase
          .from('leave_balances')
          .update({
            casual_total: newCasualTotal,
            casual_remaining: newCasualRemaining,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (updateError) throw updateError;
        
        // Fetch updated data
        return await fetchLeaveBalances(userId);
      }
    }

    return data;
  } catch (error) {
    return null;
  }
};

// Calculate leave balances
// Calculate leave balances
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

  // Update earned leave and compensatory leave totals
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
  // Remove monthlyLimit and monthlyUsed completely
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
// In leavemanage.jsx

// 1. ADD THIS NEW COMPONENT before the main LeaveManagementPage component
const LeaveHistoryDrawer = ({ visible, onClose, leaveData, currentUser }) => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredHistory = useMemo(() => {
    return leaveData.filter(leave => {
      const statusMatch = statusFilter === 'All' || leave.status === statusFilter;
      const typeMatch = typeFilter === 'All' || leave.leave_type === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [leaveData, statusFilter, typeFilter]);

  const leaveTypes = useMemo(() => [...new Set(leaveData.map(l => l.leave_type))], [leaveData]);

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>{currentUser?.name}'s Leave History</span>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={window.innerWidth > 768 ? 500 : '90%'}
      destroyOnClose
    >
      {/* Filter Controls */}
      <Card style={{ marginBottom: '16px', background: '#fafafa' }} size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="Filter by Status"
            >
              <Option value="All">All Statuses</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Rejected">Rejected</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              placeholder="Filter by Leave Type"
            >
              <Option value="All">All Leave Types</Option>
              {leaveTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Leave List */}
      {filteredHistory.length > 0 ? (
        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '8px' }}>
          <Timeline>
            {filteredHistory.map(leave => {
              const config = getLeaveTypeConfig(leave.leave_type);
              return (
                <Timeline.Item key={leave.id} dot={config.icon} color={config.color}>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                      {leave.leave_type}
                      <Tag color={
                        leave.status === 'Approved' ? 'success' :
                        leave.status === 'Rejected' ? 'error' : 'warning'
                      } style={{ marginLeft: '8px' }}>
                        {leave.status}
                      </Tag>
                    </p>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(leave.start_date).format('MMM DD, YYYY')} - {dayjs(leave.end_date).format('MMM DD, YYYY')}
                    </Text>
                     <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }} style={{ fontSize: '13px', marginTop: '4px', color: '#666' }}>
                      Reason: {leave.reason}
                    </Paragraph>
                  </div>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </div>
      ) : (
        <Empty description="No leave history found." />
      )}
    </Drawer>
  );
};

const LeaveManagementPage = ({ userRole = 'hr', currentUserId = '1' }) => {
const [employees, setEmployees] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
const [leaveBalanceRaw, setLeaveBalanceRaw] = useState(null);
// Add these new states near the top of LeaveManagementPage

const [dataLoaded, setDataLoaded] = useState(false);



// Add these to your existing state declarations



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
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [calculatedDays, setCalculatedDays] = useState(0);
const [balanceWarning, setBalanceWarning] = useState('');

  const [currentUser, setCurrentUser] = useState(null);
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(5);
const [totalEmployees, setTotalEmployees] = useState(0);
const [searchText, setSearchText] = useState('');
const [filterType, setFilterType] = useState('All');

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
useEffect(() => {
  // Only load data ONCE when component mounts and user is available
  if (!dataLoaded && currentUser?.id) {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const leaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
        const balances = await calculateLeaveBalances(currentUserId, currentUser);
        
        setLeaveData(leaves);
        setLeaveBalances(balances);
        setDataLoaded(true); // Mark data as loaded
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    };
    
    loadInitialData();
  }
}, [currentUser?.id]);
 
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





// Add this function to calculate days in real-time
const calculateLeaveDays = () => {
  const startDate = form.getFieldValue('startDate');
  const endDate = form.getFieldValue('endDate');
  const leaveType = form.getFieldValue('leaveType');
  const subType = form.getFieldValue('subType');
  
  if (!startDate || !leaveType) return;
  
  let days = 0;
  
  if (leaveType === 'Permission') {
    days = 0; // Permissions don't count as days
  } else if (leaveType === 'Casual Leave' && subType === 'HDL') {
    days = 0.5; // Half day
  } else if (endDate) {
    days = endDate.diff(startDate, 'days') + 1;
  } else {
    days = 1; // Single day
  }
  
  setCalculatedDays(days);
  
  // Check balance and set warnings
  const currentBalance = getCurrentBalance(leaveType);
  if (days > currentBalance && leaveType !== 'Medical Leave' && leaveType !== 'On Duty' && leaveType !== 'Overtime') {
    setBalanceWarning(`❌ You are requesting ${days} days but only have ${currentBalance} days available`);
  } else if (days > 0) {
    setBalanceWarning(`✅ Total Days: ${days} days - This will deduct ${days} days from your ${leaveType} balance`);
  } else {
    setBalanceWarning('');
  }
};

// Helper function to get current balance
const getCurrentBalance = (leaveType) => {
  switch (leaveType) {
    case 'Casual Leave': return leaveBalances.casualLeave?.remaining || 0;
    case 'Earned Leave': return leaveBalances.earnedLeave?.remaining || 0;
    case 'Medical Leave': return leaveBalances.medicalLeave?.remaining || 0;
    case 'Maternity Leave': return leaveBalances.maternityLeave?.remaining || 0;
    case 'Compensatory Leave': return leaveBalances.compensatoryLeave?.remaining || 0;
    default: return 0;
  }
};

// Add watchers to form fields
useEffect(() => {
  calculateLeaveDays();
}, [form.getFieldValue('startDate'), form.getFieldValue('endDate'), form.getFieldValue('leaveType'), form.getFieldValue('subType')]);


// Replace the existing handleApplyLeave function with this corrected version:
const handleApplyLeave = async (values) => {
  setLoading(true);
  try {
    // Calculate leave details from form values
    const startDate = values.startDate;
    const endDate = values.endDate;
    const leaveType = values.leaveType;
    const subType = values.subType;

    // Calculate total days
    const totalDays = leaveType === 'Permission' ? 0 : 
                     (leaveType === 'Casual Leave' && subType === 'HDL') ? 0.5 :
                     (endDate ? endDate.diff(startDate, 'days') + 1 : 1);

    // Validate balance before submission
    const currentBalance = getCurrentBalance(leaveType);
    if (totalDays > currentBalance && 
        leaveType !== 'Medical Leave' && 
        leaveType !== 'On Duty' && 
        leaveType !== 'Overtime') {
      message.error(`Insufficient balance! You have only ${currentBalance} days available for ${leaveType}`);
      setLoading(false);
      return;
    }

    // Get current user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUserId)
      .single();
      
    if (!userData) {
      message.error('User information not found');
      setLoading(false);
      return;
    }
    let medicalCertificateUrl = null;
let attachmentUrl = null;

if (values.medicalCertificate && values.medicalCertificate.length > 0) {
  medicalCertificateUrl = await uploadFileToSupabase(values.medicalCertificate[0].originFileObj);
}

if (values.attachment && values.attachment.length > 0) {
  attachmentUrl = await uploadFileToSupabase(values.attachment[0].originFileObj);
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
      total_days: totalDays,
      total_hours: values.leaveType === 'Permission' && values.startTime && values.endTime ? 
                  values.endTime.diff(values.startTime, 'hours', true) : 0,
      reason: values.reason,
      
      medical_certificate: medicalCertificateUrl,
attachment: attachmentUrl,
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
    
    // ✅ FORCE IMMEDIATE UI UPDATE - Don't wait for realtime
    const updatedLeaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
    setLeaveData(updatedLeaves);
    
    // ✅ FORCE IMMEDIATE BALANCE REFRESH (even though no deduction yet)
    const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
    setLeaveBalances(updatedBalances);
    
    setApplyLeaveModal(false);
    form.resetFields();
    setBalanceWarning(''); // Clear any warnings
    setCalculatedDays(0); // Reset calculated days
    message.success('Leave application submitted successfully!');

  } catch (error) {
    console.error('Error submitting leave:', error);
    message.error('Failed to submit leave application');
  } finally {
    setLoading(false);
  }
};
// In LeaveManagementPage.jsx
{/* Add this after the date selection Row */}
{balanceWarning && (
  <Alert
    message={balanceWarning}
    type={balanceWarning.includes('❌') ? 'error' : 'success'}
    showIcon
    style={{ marginBottom: '16px' }}
  />
)}
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
  // Remove this line: updates.casual_monthly_used = (currentBalances.casual_monthly_used || 0) + 1;
  break;
      case 'Earned Leave': // Logic updated to use daysApplied
        updates.earned_used = (currentBalances.earned_used || 0) + days;
        updates.earned_remaining = (currentBalances.earned_remaining || 0) - days;
        break;
      case 'Medical Leave':
        updates.medical_used = (currentBalances.medical_used || 0) + days;
        updates.medical_remaining = (currentBalances.medical_remaining || 12) - days;
        break;
      case 'Maternity Leave': // ADDED
        updates.maternity_used = (currentBalances.maternity_used || 0) + days;
        updates.maternity_remaining = (currentBalances.maternity_remaining || 84) - days;
        break;
      case 'Compensatory Leave': // ADDED
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
// 7. Add function to get available leave types:
  const getAvailableLeaveTypes = () => {
    const available = [];
    
    // These leaves are only available if there is a balance
    if (leaveBalances.permission?.remaining > 0) available.push('Permission');
if (leaveBalances.casualLeave?.remaining > 0) available.push('Casual Leave');    if (leaveBalances.earnedLeave?.remaining > 0) available.push('Earned Leave');
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
// In LeaveManagementPage.jsx

// Update the handleLeaveAction function:
const handleLeaveAction = async (leaveId, action, reason = null) => {
  setLoading(true);
  try {
    // ✅ First, get the leave details to calculate balance update
    const { data: leaveDetails, error: fetchError } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', leaveId)
      .single();
    
    if (fetchError) throw fetchError;

    const updates = {
  status: action === 'approve' ? 'Approved' : 'Rejected',
  approved_by: action === 'approve' ? (currentUser?.name || 'Admin') : null,
  rejected_by: action === 'reject' ? (currentUser?.name || 'Admin') : null, // Add this line
  approved_date: action === 'approve' ? new Date().toISOString().split('T')[0] : null,
  rejection_reason: action === 'reject' ? reason : null,
};
    
    const { error } = await supabase
      .from('leave_applications')
      .update(updates)
      .eq('id', leaveId);
    
    if (error) throw error;
    
    // ✅ Only update balance if APPROVED
    if (action === 'approve') {
      const totalDays = leaveDetails.leave_type === 'Permission' ? 0 : leaveDetails.total_days;
      await updateLeaveBalance(leaveDetails.user_id, leaveDetails.leave_type, totalDays);
    }
    
    // ✅ FORCE IMMEDIATE UI UPDATE - Don't wait for realtime
    const updatedLeaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
    setLeaveData(updatedLeaves);
    
    // ✅ FORCE IMMEDIATE BALANCE UPDATE
    const updatedBalances = await calculateLeaveBalances(
      userRole === 'employee' ? currentUserId : leaveDetails.user_id, 
      currentUser
    );
    setLeaveBalances(updatedBalances);
    
    message.success(`Leave ${action}d successfully!`);
  } catch (error) {
    console.error(`Error ${action}ing leave:`, error);
    message.error(`Failed to ${action} leave. Please try again.`);
  } finally {
    setLoading(false);
  }
};
 
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
    {/* Add this after the Recent Leave Applications card */}

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
          {/* UPDATED: Converted Timeline.Item to use the 'items' prop */}
          <Timeline
            items={filteredLeaves.slice(0, 5).map(leave => {
              const config = getLeaveTypeConfig(leave.leaveType);
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
                )
              };
            })}
          />
        </div>
      </Card>
    </div>
  );

  // HR/Admin Table Columns
const getTableColumns = () => {
  const isMobile = window.innerWidth < 768;
  
  const baseColumns = [
    // Employee Column (Enhanced)
    ...(userRole !== 'employee' ? [{
      title: (
        <Space>
          <UserOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Employee</span>
        </Space>
      ),
      key: 'employee',
      render: (_, record) => (
        <Space direction="horizontal" size={12}>
          <Avatar 
            style={{ 
              backgroundColor: '#0D7139',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            size={isMobile ? 36 : 42}
          >
            {(record.users?.name || record.employee_name)?.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: isMobile ? '13px' : '14px',
              color: '#1f2937',
              marginBottom: '2px',
              lineHeight: '1.2'
            }}>
              {record.users?.name || record.employee_name}
            </div>
            <Text type="secondary" style={{ 
              fontSize: isMobile ? '11px' : '12px',
              color: '#6b7280'
            }}>
              {record.users?.employee_id || record.employee_code}
            </Text>
            {!isMobile && (
              <div style={{ 
                fontSize: '10px', 
                color: '#9ca3af',
                marginTop: '1px'
              }}>
                {record.department}
              </div>
            )}
          </div>
        </Space>
      ),
      width: isMobile ? 120 : 180,
      fixed: !isMobile ? 'left' : false,
    }] : []),

    // Leave Type Column (Enhanced)
    {
      title: (
        <Space>
          <CalendarOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Leave Type</span>
        </Space>
      ),
      key: 'leaveType',
      render: (_, record) => {
        const config = getLeaveTypeConfig(record.leave_type);
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                padding: '4px',
                background: `${config.color}15`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: config.color, fontSize: '14px' }}>
                  {config.icon}
                </span>
              </div>
              <Tag 
                style={{ 
                  background: config.gradient,
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: isMobile ? '10px' : '12px',
                  padding: isMobile ? '2px 6px' : '4px 8px',
                  margin: 0
                }}
              >
                {isMobile ? 
                  (record.leave_type.length > 8 ? 
                    record.leave_type.substring(0, 8) + '...' : 
                    record.leave_type
                  ) : 
                  record.leave_type
                }
              </Tag>
            </div>
            {record.sub_type && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {record.leave_type === 'Permission' && (
                  <span style={{ fontSize: '10px' }}>
                    {getPermissionTimeIcon(record.sub_type)}
                  </span>
                )}
                <Text type="secondary" style={{ 
                  fontSize: isMobile ? '9px' : '11px',
                  background: '#f8f9fa',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  {record.sub_type}
                </Text>
              </div>
            )}
          </Space>
        );
      },
      width: isMobile ? 100 : 160,
    },

    // Duration Column (Enhanced)
    {
      title: (
        <Space>
          <ClockCircleOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Duration</span>
        </Space>
      ),
      key: 'duration',
      render: (_, record) => (
        <div style={{ lineHeight: '1.4' }}>
          <div style={{
            fontWeight: 600,
            fontSize: isMobile ? '11px' : '13px',
            color: '#1f2937',
            marginBottom: '2px'
          }}>
            {dayjs(record.start_date).format(isMobile ? 'DD/MM' : 'DD MMM')}
            {record.end_date !== record.start_date && 
              ` - ${dayjs(record.end_date).format(isMobile ? 'DD/MM' : 'DD MMM')}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {record.total_hours > 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: isMobile ? '9px' : '10px',
                fontWeight: 500,
                color: '#1565c0'
              }}>
                {record.total_hours}h
              </div>
            ) : record.total_days > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: isMobile ? '9px' : '10px',
                fontWeight: 500,
                color: '#2e7d32'
              }}>
                {record.total_days}d
              </div>
            )}
            {record.start_time && record.end_time && !isMobile && (
              <Text type="secondary" style={{ fontSize: '9px' }}>
                {record.start_time}-{record.end_time}
              </Text>
            )}
          </div>
        </div>
      ),
      width: isMobile ? 80 : 120,
    },

    // Status Column (Enhanced)
    {
      title: (
        <Space>
          <NotificationOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Status</span>
        </Space>
      ),
      key: 'status',
      render: (_, record) => {
        const statusConfig = {
          'Approved': { 
            color: '#52c41a', 
            bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            icon: <CheckCircleOutlined />
          },
          'Rejected': { 
            color: '#ff4d4f', 
            bg: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
            icon: <CloseCircleOutlined />
          },
          'Pending': { 
            color: '#faad14', 
            bg: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
            icon: <ClockCircleOutlined />
          }
        };
        
        const config = statusConfig[record.status] || statusConfig['Pending'];
        
        return (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: config.bg,
              padding: '6px 10px',
              borderRadius: '20px',
              border: `1px solid ${config.color}30`,
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 600,
              color: config.color
            }}>
              <span style={{ fontSize: '10px' }}>{config.icon}</span>
              {isMobile ? record.status.substring(0, 4) : record.status}
            </div>
            {!isMobile && record.status === 'Approved' && record.approved_by && (
              <div style={{ marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '9px' }}>
                  by {record.approved_by}
                </Text>
              </div>
            )}
            {!isMobile && record.status === 'Rejected' && record.rejected_by && (
              <div style={{ marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '9px' }}>
                  by {record.rejected_by}
                </Text>
              </div>
            )}
          </div>
        );
      },
      width: isMobile ? 70 : 120,
    },

    // Applied Date Column (Enhanced)
    {
      title: (
        <Space>
          <HistoryOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Applied</span>
        </Space>
      ),
      dataIndex: 'created_at',
      render: (date) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontWeight: 600,
            fontSize: isMobile ? '10px' : '12px',
            color: '#1f2937',
            marginBottom: '2px'
          }}>
            {dayjs(date).format(isMobile ? 'DD/MM' : 'DD MMM')}
          </div>
          <Text type="secondary" style={{ 
            fontSize: isMobile ? '8px' : '10px',
            display: 'block'
          }}>
            {dayjs(date).format(isMobile ? 'YY' : 'YYYY')}
          </Text>
          {!isMobile && (
            <Text type="secondary" style={{ fontSize: '9px', display: 'block' }}>
              {dayjs(date).fromNow()}
            </Text>
          )}
        </div>
      ),
      width: isMobile ? 60 : 100,
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },

    // Actions Column (Enhanced)
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontWeight: 600, color: '#6b7280' }}>Actions</Text>
        </div>
      ),
      key: 'actions',
      render: (_, record) => (
        <Space size={4} direction={isMobile ? 'vertical' : 'horizontal'}>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedLeave(record);
                setLeaveDetailsModal(true);
              }}
              style={{ 
                color: '#0D7139',
                border: '1px solid transparent',
                borderRadius: '8px',
                padding: '4px 8px',
                transition: 'all 0.3s ease'
              }}
              className="action-btn"
            />
          </Tooltip>
          
          {userRole !== 'employee' && record.status === 'Pending' && (
            <>
              <Tooltip title="Approve Leave">
                <Popconfirm
                  title="Approve this leave application?"
                  description="This action cannot be undone."
                  onConfirm={() => handleLeaveAction(record.id, 'approve')}
                  okText="Approve"
                  cancelText="Cancel"
                  okButtonProps={{ 
                    style: { 
                      background: '#52c41a',
                      borderColor: '#52c41a'
                    }
                  }}
                >
                  <Button
                    type="text"
                    icon={<CheckCircleOutlined />}
                    size="small"
                    style={{ 
                      color: '#52c41a',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      transition: 'all 0.3s ease'
                    }}
                    className="action-btn approve-btn"
                  />
                </Popconfirm>
              </Tooltip>
              
              <Tooltip title="Reject Leave">
                <Popconfirm
                  title="Reject this leave application?"
                  description="Please provide rejection reason in the details modal."
                  onConfirm={() => handleLeaveAction(record.id, 'reject', 'Leave rejected by HR')}
                  okText="Reject"
                  cancelText="Cancel"
                  okButtonProps={{ 
                    danger: true 
                  }}
                >
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    size="small"
                    style={{ 
                      color: '#ff4d4f',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      transition: 'all 0.3s ease'
                    }}
                    className="action-btn reject-btn"
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
      width: isMobile ? 50 : (userRole === 'employee' ? 80 : 140),
      fixed: !isMobile ? 'right' : false,
    },
  ];

  return baseColumns;
};
const actionButtonStyles = `
  /* Enhanced Action Buttons */
  .action-btn:hover {
    background: rgba(13, 113, 57, 0.08) !important;
    border-color: #0D7139 !important;
    transform: scale(1.1);
  }

  .approve-btn:hover {
    background: rgba(82, 196, 26, 0.08) !important;
    border-color: #52c41a !important;
    transform: scale(1.1);
  }

  .reject-btn:hover {
    background: rgba(255, 77, 79, 0.08) !important;
    border-color: #ff4d4f !important;
    transform: scale(1.1);
  }

  /* Enhanced Popconfirm Styling */
  .ant-popconfirm .ant-popconfirm-message-title {
    font-weight: 600 !important;
    color: #1f2937 !important;
  }

  .ant-popconfirm .ant-popconfirm-description {
    color: #6b7280 !important;
  }

  /* Loading States */
  .ant-table-tbody > tr.ant-table-row-loading > td {
    background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%) !important;
    background-size: 200% 100% !important;
    animation: loading 1.5s infinite !important;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Responsive Table Improvements */
  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 4px !important;
      font-size: 11px !important;
    }
    
    .ant-table-tbody > tr > td {
      padding: 6px 4px !important;
    }
    
    .ant-space-item {
      margin-bottom: 2px !important;
    }
  }
`;

// 5. Export the complete updated styles to be added to your component
const completeStyles = professionalStyles + actionButtonStyles;
  // Apply Leave Form Component
  const ApplyLeaveForm = () => {
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const availableLeaveTypes = getAvailableLeaveTypes();
const isMedicalDisabled = !leaveBalances.medicalLeave || leaveBalances.medicalLeave.remaining <= 0;
    const isPermissionDisabled = leaveBalances.permission?.remaining <= 0;
    const isCasualDisabled = leaveBalances.casualLeave?.remaining <= 0 || leaveBalances.casualLeave?.monthlyUsed >= 1;
    // UPDATED: More robust check for earned and compensatory leave
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
                    Earned Leave ({leaveBalances.earnedLeave?.remaining || 0} remaining)
                  </Space>
                </Option>
                <Option value="Medical Leave" disabled={isMedicalDisabled}>
  <Space>
    <MedicineBoxOutlined style={{ color: '#ff4d4f' }} />
    Medical Leave ({leaveBalances.medicalLeave?.remaining} remaining)
  </Space>
</Option>
                <Option value="Maternity Leave">
                  {/* ... (no changes) ... */}
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
                      Morning 
                    </Space>
                  </Option>
                  <Option value="Before Lunch">
                    <Space>
                      <CoffeeOutlined style={{ color: '#8c4a2b' }} />
                      Before Lunch 
                    </Space>
                  </Option>
                  <Option value="Middle">
                    <Space>
                      <ClockCircleFilled style={{ color: '#1890ff' }} />
                      Middle
                    </Space>
                  </Option>
                  <Option value="After Lunch">
                    <Space>
                      <CoffeeOutlined style={{ color: '#52c41a' }} />
                      After Lunch
                    </Space>
                  </Option>
                  <Option value="Evening">
                    <Space>
                      <MoonOutlined style={{ color: '#722ed1' }} />
                      Evening
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
            rules={[{ required: false, message: 'Please upload medical certificate' }]}
            // ADDED: Props to correctly handle file list with AntD Form
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
          >
            <Upload
  listType="picture-card"
  maxCount={3}
  beforeUpload={() => false} // Keep this
  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
  showUploadList={{ showPreviewIcon: false }} // Add this
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
          // ADDED: Props to correctly handle file list with AntD Form
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
    
    // ✅ Close the modal after successful action
    setLeaveDetailsModal(false);
    setSelectedLeave(null);
    
    // ✅ FORCE IMMEDIATE REFRESH (backup to realtime)
    setTimeout(async () => {
      const updatedLeaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
      setLeaveData(updatedLeaves);
      
      const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
      setLeaveBalances(updatedBalances);
    }, 500);
    
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
          {selectedLeave.status === 'Rejected' && (selectedLeave.rejected_by || selectedLeave.rejected_by) && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Rejected by {selectedLeave.rejected_by || selectedLeave.rejected_by} on {dayjs(selectedLeave.approved_date || selectedLeave.approvedDate).format('DD MMM YYYY')}
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
                  onClick={() => window.open(selectedLeave.medical_certificate || selectedLeave.medicalCertificate, '_blank')}
                >
                Medical Certificate
              </Button>
              )}
              {selectedLeave.attachment && (
                <Button 
                  type="link" 
                  icon={<FileTextOutlined />}
                  onClick={() => window.open(selectedLeave.attachment || selectedLeave.attachment, '_blank')}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Attachment
                </Button>
              )}
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

  // Leave History Drawer
// ✅ Place this entire component BEFORE the main LeaveManagementPage component
// Replace your existing LeaveHistoryDrawer component with this fixed version
// Replace the existing LeaveHistoryDrawer component with this fixed version:


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
useEffect(() => {
  // Only set up realtime after initial data is loaded
  if (!dataLoaded) return;
  
  // LEAVE APPLICATIONS
  const leaveSub = supabase
    .channel('realtime-leave-applications')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leave_applications',
    }, async (payload) => {
      console.log('Leave applications updated:', payload);
      
      const updatedLeaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
      setLeaveData(updatedLeaves);
      
      if (payload.eventType === 'UPDATE' && 
          (payload.new?.status === 'Approved' || payload.new?.status === 'Rejected')) {
        const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
        setLeaveBalances(updatedBalances);
      }
    })
    .subscribe();

  const balanceSub = supabase
    .channel('realtime-leave-balances')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leave_balances',
    }, async (payload) => {
      console.log('Leave balances updated:', payload);
      
      const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
      setLeaveBalances(updatedBalances);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(leaveSub);
    supabase.removeChannel(balanceSub);
  };
}, [dataLoaded, currentUserId, userRole, currentUser]);
// Add this useEffect hook inside LeaveManagementPage


const fetchEmployees = async (page = 1, size = 5, search = '', filter = 'All') => {
  if (userRole === 'employee') return;
  
  setLoading(true);
  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }
    
    // Apply type filter
    if (filter !== 'All') {
      query = query.eq('employee_type', filter);
    }
    
    // Apply pagination
    const from = (page - 1) * size;
    const to = from + size - 1;
    query = query.range(from, to).order('name', { ascending: true });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    setEmployees(data || []);
    setTotalEmployees(count || 0);
  } catch (error) {
    console.error("Error fetching employees:", error);
    message.error('Failed to fetch employees');
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchEmployees(currentPage, pageSize, searchText, filterType);
}, [userRole, currentPage, pageSize, searchText, filterType]);
  // HR/Admin Dashboard Component
  const HRDashboard = () => (
  <div style={animationStyles.container}>
    {/* Professional HR Header */}
    <Card style={{
      marginBottom: '24px',
      background: 'linear-gradient(135deg, #f8fffe 0%, #e6f7ff 50%, #f0f9ff 100%)',
      border: '1px solid #e8f4fd',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(13, 113, 57, 0.08)',
      overflow: 'hidden',
      ...animationStyles.headerCard
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '200px',
        height: '100px',
        background: 'linear-gradient(135deg, rgba(13, 113, 57, 0.05) 0%, rgba(82, 196, 26, 0.03) 100%)',
        borderRadius: '0 0 0 100px',
        zIndex: 1
      }} />
      
      <Row align="middle" justify="space-between" gutter={[24, 16]} style={{ position: 'relative', zIndex: 2 }}>
        <Col xs={24} md={14} lg={16}>
          <Space size={24} direction="horizontal" style={{ width: '100%' }}>
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(13, 113, 57, 0.2)'
            }}>
              <TeamOutlined style={{ fontSize: '32px', color: 'white' }} />
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                background: '#52c41a',
                borderRadius: '50%',
                border: '2px solid white'
              }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <Title level={2} style={{
                margin: '0 0 4px 0',
                background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: 700,
                letterSpacing: '-0.5px'
              }}>
                Leave Management Hub
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Text style={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  HR Administrative Dashboard
                </Text>
                <div style={{ 
                  padding: '4px 12px',
                  background: 'rgba(13, 113, 57, 0.1)',
                  border: '1px solid rgba(13, 113, 57, 0.2)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#0D7139',
                  fontWeight: 600
                }}>
                  Admin Access
                </div>
              </div>
            </div>
          </Space>
        </Col>
        
        <Col xs={24} md={10} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Row gutter={8} justify="end">
              
              <Col>
                <Tooltip title="Export Leave Reports">
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => setExportModalVisible(true)}
                    style={{
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 16px rgba(13, 113, 57, 0.24)',
                      transition: 'all 0.3s ease'
                    }}
                    className="professional-primary-btn"
                  >
                    Export Report
                  </Button>
                </Tooltip>
              </Col>
            </Row>
          </Space>
        </Col>
      </Row>
    </Card>

    {/* Professional Stats Cards with Enhanced Design */}
   {/* Professional Stats Cards with Enhanced Design */}
    <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
      <Col xs={12} sm={6} lg={6}>
        <Card style={{
          borderRadius: '16px',
          border: '1px solid rgba(82, 196, 26, 0.12)',
          background: 'white', // ✅ Added white background
          boxShadow: '0 4px 20px rgba(82, 196, 26, 0.08)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          ...animationStyles.statsCard
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(82, 196, 26, 0.1)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(82, 196, 26, 0.1)',
                borderRadius: '10px',
                display: 'inline-flex'
              }}>
                <CheckCircleOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
              </div>
              <Text style={{ 
                fontSize: '12px', 
                color: '#52c41a',
                fontWeight: 600,
                background: 'rgba(82, 196, 26, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                +12.5%
              </Text>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#52c41a',
                lineHeight: 1
              }}>
                {filteredLeaves.filter(l => l.status === 'Approved').length}
              </Text>
            </div>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Approved Leaves
            </Text>
            <Text style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '4px'
            }}>
              This month
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={12} sm={6} lg={6}>
        <Card style={{
          borderRadius: '16px',
          border: '1px solid rgba(250, 173, 20, 0.12)',
          background: 'white', // ✅ Added white background
          boxShadow: '0 4px 20px rgba(250, 173, 20, 0.08)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          ...animationStyles.statsCard
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(250, 173, 20, 0.1)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(250, 173, 20, 0.1)',
                borderRadius: '10px',
                display: 'inline-flex'
              }}>
                <ClockCircleOutlined style={{ fontSize: '20px', color: '#faad14' }} />
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#faad14',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#faad14',
                lineHeight: 1
              }}>
                {filteredLeaves.filter(l => l.status === 'Pending').length}
              </Text>
            </div>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Pending Review
            </Text>
            <Text style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '4px'
            }}>
              Requires attention
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={12} sm={6} lg={6}>
        <Card style={{
          borderRadius: '16px',
          border: '1px solid rgba(255, 77, 79, 0.12)',
          background: 'white', // ✅ Added white background
          boxShadow: '0 4px 20px rgba(255, 77, 79, 0.08)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          ...animationStyles.statsCard
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 77, 79, 0.1)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(255, 77, 79, 0.1)',
                borderRadius: '10px',
                display: 'inline-flex'
              }}>
                <CloseCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
              </div>
              <Text style={{ 
                fontSize: '12px', 
                color: '#ff4d4f',
                fontWeight: 600,
                background: 'rgba(255, 77, 79, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                -8.2%
              </Text>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#ff4d4f',
                lineHeight: 1
              }}>
                {filteredLeaves.filter(l => l.status === 'Rejected').length}
              </Text>
            </div>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Rejected Leaves
            </Text>
            <Text style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '4px'
            }}>
              This month
            </Text>
          </div>
        </Card>
      </Col>

     
    </Row>

    {/* Enhanced Leave Applications Table */}
    <Card style={{
      background: 'white',
      border: '1px solid #f0f0f0',
      borderRadius: '20px',
      boxShadow: '0 6px 30px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      ...animationStyles.mainCard
    }}>
      {/* Professional Table Header */}
      <div style={{
        background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
        padding: '24px 24px 20px 24px',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '0px'
      }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={12} md={14}>
            <Space size={16}>
              <div style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                borderRadius: '12px',
                display: 'inline-flex'
              }}>
                <NotificationOutlined style={{ fontSize: '20px', color: 'white' }} />
              </div>
              <div>
                <Title level={3} style={{
                  margin: 0,
                  color: '#1f2937',
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 700,
                  letterSpacing: '-0.3px'
                }}>
                  Leave Applications
                </Title>
                <Text style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 400
                }}>
                  Manage and review employee leave requests
                </Text>
              </div>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={10}>
            <Row gutter={[12, 12]} justify="end">
  <Col xs={24} sm={12} md={6}>
    <Select
      placeholder="Status"
      value={filterStatus}
      onChange={setFilterStatus}
      style={{ width: '100%' }}
      size="large"
      suffixIcon={<FilterOutlined style={{ color: '#9ca3af' }} />}
      className="professional-select"
    >
      <Option value="All">All Status</Option>
      <Option value="Pending">
        <Space>
          <div style={{ width: '8px', height: '8px', background: '#faad14', borderRadius: '50%' }} />
          Pending
        </Space>
      </Option>
      <Option value="Approved">
        <Space>
          <div style={{ width: '8px', height: '8px', background: '#52c41a', borderRadius: '50%' }} />
          Approved
        </Space>
      </Option>
      <Option value="Rejected">
        <Space>
          <div style={{ width: '8px', height: '8px', background: '#ff4d4f', borderRadius: '50%' }} />
          Rejected
        </Space>
      </Option>
    </Select>
  </Col>
  
  {/* NEW DATE RANGE PICKER */}
  <Col xs={24} sm={12} md={6}>
    <RangePicker
      style={{ width: '100%' }}
      size="large"
      placeholder={['Start Date', 'End Date']}
      onChange={(dates) => {
        // Add date filtering logic here
        if (dates && dates.length === 2) {
          // Filter leaves by date range
          const filtered = leaveData.filter(leave => {
            const leaveDate = dayjs(leave.start_date);
            return leaveDate.isBetween(dates[0], dates[1], 'day', '[]');
          });
          setFilteredLeaves(filtered);
        } else {
          // Reset to show all leaves when date range is cleared
          setFilteredLeaves(leaveData);
        }
      }}
      className="professional-select"
    />
  </Col>
  
  <Col xs={24} sm={12} md={6}>
    <Select
      placeholder="Employee"
      value={filterEmployee}
      onChange={setFilterEmployee}
      style={{ width: '100%' }}
      size="large"
      suffixIcon={<UserOutlined style={{ color: '#9ca3af' }} />}
      className="professional-select"
    >
      <Option value="All">All Employees</Option>
      {employees.map(emp => (
        <Option key={emp.id} value={emp.id}>
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#0D7139' }}>
              {emp.name.charAt(0)}
            </Avatar>
            {emp.name}
          </Space>
        </Option>
      ))}
    </Select>
  </Col>
</Row>
          </Col>
        </Row>
      </div>
      
      {/* Table with padding */}
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Table
          columns={getTableColumns()}
          dataSource={filteredLeaves}
          rowKey="id"
          loading={loading}
          pagination={filteredLeaves.length > 0 ? {
  current: currentPage,
  pageSize: pageSize,
  total: filteredLeaves.length, // Change this from totalEmployees to filteredLeaves.length
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`, // Change "employees" to "applications"
  pageSizeOptions: ['5', '10', '20', '50'],
  onChange: (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  },
  onShowSizeChange: (current, size) => {
    setCurrentPage(1);
    setPageSize(size);
  },
  itemRender: (current, type, originalElement) => {
    if (type === 'page') {
      return (
        <a style={{
          color: current === currentPage ? '#0D7139' : '#d9d9d9',
          backgroundColor:current === currentPage ? "#ffffffff" : '#faf8f8ff' ,
          border: `1px solid ${current === currentPage ? '#0D7139' : '#d9d9d9'}`,
          borderRadius: '6px',
          fontWeight: current === currentPage ? 600 : 400,
          padding: '0px 7px',
          textDecoration: 'none'
        }}>
          {current}
        </a>
      );
    }
    return originalElement;
  }
} : false}
          scroll={filteredLeaves.length > 0 ? {
            x: 'max-content',
            scrollToFirstRowOnChange: true
          } : undefined}
          size="middle"
          rowClassName={(record) => {
            if (record.status === 'Pending') return 'pending-row';
            if (record.status === 'Approved') return 'approved-row';
            if (record.status === 'Rejected') return 'rejected-row';
            return '';
          }}
          locale={{
            emptyText: (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
                borderRadius: '16px',
                margin: '20px 0'
              }}>
                <div style={{
                  padding: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  <NotificationOutlined style={{ fontSize: '32px', color: '#d1d5db' }} />
                </div>
                <Title level={4} style={{ color: '#6b7280', marginBottom: '8px' }}>
                  No Leave Applications
                </Title>
                <Text style={{ color: '#9ca3af' }}>
                  No leave applications found matching your criteria
                </Text>
              </div>
            )
          }}
        />
      </div>
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
  
    /* Add this to your existing style block */

/* Prevent horizontal scrollbar on empty tables */
.ant-table-empty .ant-table-tbody {
  overflow-x: hidden !important;
}

/* Consistent card heights */
.ant-card {
  height: fit-content;
}

/* Remove unnecessary scrollbars from empty containers */
.ant-table-placeholder {
  overflow: hidden !important;
}

/* Timeline container fixes */
.ant-timeline {
  overflow: visible !important;
}

/* Ensure consistent row heights */
.ant-table-tbody > tr {
  min-height: 54px;
}

/* Fix empty table container */
.ant-table-container {
  overflow-x: auto;
}

.ant-table-container:has(.ant-empty) {
  overflow-x: hidden;
}

/* Responsive adjustments for empty states */
@media (max-width: 768px) {
  .ant-empty {
    padding: 20px 10px !important;
  }
  
  .ant-table-empty .ant-table-tbody {
    min-height: 200px;
  }
}
`}</style>

       <Tabs 
  activeKey={activeTab} 
  onChange={setActiveTab}
  style={{ marginBottom: '24px' }}
  destroyOnHidden={false} // ✅ This prevents tab content from being destroyed/recreated
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
        <Analytics 
          currentUserId={currentUserId}
          userRole={userRole}
          leaveData={leaveData}
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
    {/* Remove this entire component usage */}
      <LeaveHistoryDrawer
        visible={leaveHistoryDrawer}
        onClose={() => setLeaveHistoryDrawer(false)}
        leaveData={leaveData} 
        currentUser={currentUser}
      />      
       <ExportReportModal 
  visible={exportModalVisible}
  onCancel={() => setExportModalVisible(false)}
  leaveData={filteredLeaves}
/>
    </div>
  );
};
const professionalStyles = `
  /* Professional Button Styles */
  .professional-btn:hover {
    background: #f8f9fa !important;
    border-color: #0D7139 !important;
    color: #0D7139 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }

  .professional-primary-btn:hover {
    background: linear-gradient(135deg, #52c41a 0%, #0D7139 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(13, 113, 57, 0.32) !important;
  }

  /* Professional Select Styles */
  .professional-select .ant-select-selector {
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
    transition: all 0.3s ease !important;
  }

  .professional-select:hover .ant-select-selector {
    border-color: #0D7139 !important;
    box-shadow: 0 2px 8px rgba(13, 113, 57, 0.12) !important;
  }

  .professional-select.ant-select-focused .ant-select-selector {
    border-color: #0D7139 !important;
    box-shadow: 0 0 0 3px rgba(13, 113, 57, 0.1) !important;
  }

  /* Enhanced Row Styling */
  .pending-row {
    background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%) !important;
    border-left: 4px solid #faad14 !important;
  }

  .approved-row {
    background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%) !important;
    border-left: 4px solid #52c41a !important;
  }

  .rejected-row {
    background: linear-gradient(135deg, #fff1f0 0%, #fff2f0 100%) !important;
    border-left: 4px solid #ff4d4f !important;
  }

  .ant-table-tbody > tr:hover.pending-row > td {
    background: linear-gradient(135deg, #fff7e6 0%, #ffefd3 100%) !important;
  }

  .ant-table-tbody > tr:hover.approved-row > td {
    background: linear-gradient(135deg, #f0f9ff 0%, #e8f4fd 100%) !important;
  }

  .ant-table-tbody > tr:hover.rejected-row > td {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
  }

  /* Card Hover Effects */
  .ant-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
  }

  /* Stats Card Animation */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Professional Table Headers */
  .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%) !important;
    border-bottom: 2px solid #e9ecef !important;
    font-weight: 600 !important;
    color: #495057 !important;
    padding: 16px 16px !important;
  }

  
  /* Responsive Improvements */
  @media (max-width: 768px) {
    .ant-card-body {
      padding: 16px !important;
    }
    
    .ant-table-tbody > tr > td {
      padding: 8px 6px !important;
    }
    
    .ant-statistic-content-value {
      font-size: 20px !important;
    }
  }
`;
// 2. Add Export Modal Component (add this before the LeaveManagementPage component)
// In leavemanage.jsx, place this before the `const LeaveManagementPage = ...` line.

const ExportReportModal = ({ visible, onCancel, leaveData }) => {
  const [exportForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleExport = async (values) => {
    setLoading(true);
    try {
      const { month, year } = values;
      const startDate = dayjs().year(year).month(month).startOf('month');
      const endDate = dayjs().year(year).month(month).endOf('month');

      // Filter leaves for the selected month/year
      const filteredLeaves = leaveData.filter(leave => {
        const leaveDate = dayjs(leave.start_date);
        return leaveDate.isBetween(startDate, endDate, 'day', '[]');
      });

      if (filteredLeaves.length === 0) {
        message.warning('No leave data found for the selected month/year');
        setLoading(false);
        return;
      }

      // Prepare data for export
      const exportData = filteredLeaves.map(leave => ({
        'Employee Name': leave.users?.name || leave.employee_name,
        'Employee ID': leave.users?.employee_id || leave.employee_code,
        'Department': leave.department,
        'Leave Type': leave.leave_type,
        'Sub Type': leave.sub_type || '-',
        'Start Date': dayjs(leave.start_date).format('DD/MM/YYYY'),
        'End Date': dayjs(leave.end_date).format('DD/MM/YYYY'),
        'Total Days': leave.total_days || 0,
        'Status': leave.status,
        'Applied Date': dayjs(leave.created_at).format('DD/MM/YYYY'),
        'Approved By': leave.approved_by || '-',
        'Reason': leave.reason?.replace(/,/g, ';') || '-' // Sanitize commas for CSV
      }));

      // Create CSV content
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => `"${row[header]}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_report_${startDate.format('MMM_YYYY')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`Report for ${startDate.format('MMMM YYYY')} downloaded.`);
      onCancel();

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
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button
          key="export"
          type="primary"
          onClick={() => exportForm.submit()}
          loading={loading}
          icon={<DownloadOutlined />}
          style={{ background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)', border: 'none' }}
        >
          Export
        </Button>
      ]}
      width={400}
      destroyOnClose
    >
      <Form
        form={exportForm}
        layout="vertical"
        onFinish={handleExport}
        initialValues={{ month: dayjs().month(), year: dayjs().year() }}
      >
        <Form.Item name="month" label="Select Month" rules={[{ required: true }]}>
          <Select placeholder="Choose month">
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i} value={i}>{dayjs().month(i).format('MMMM')}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="year" label="Select Year" rules={[{ required: true }]}>
          <Select placeholder="Choose year">
            {Array.from({ length: 5 }, (_, i) => {
              const year = dayjs().year() - i;
              return <Option key={year} value={year}>{year}</Option>;
            })}
          </Select>
        </Form.Item>
        <Alert
          message="The report will be downloaded as a CSV file for the selected period."
          type="info"
          showIcon
        />
      </Form>
    </Modal>
  );
};

export default LeaveManagementPage;
