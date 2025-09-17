import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './leavemanage.css';
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
  InputNumber,
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
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { FaIndianRupeeSign } from "react-icons/fa6";
// import ErrorPage from '../../error/ErrorPage';

dayjs.extend(relativeTime);
dayjs.extend(isBetween); // <-- AND ADD THIS LINE
dayjs.extend(isSameOrBefore);


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
      'Compensatory Leave': { color: '#722ed1', icon: <FaIndianRupeeSign/>, gradient: 'linear-gradient(45deg, #9254de 0%, #722ed1 100%)' },
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

    // Filter out holidays from the present days to get only working days
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

    // Filter for days worked ON a holiday
    const compensatoryDays = data.filter(attendance => holidays.has(attendance.date));
    return compensatoryDays.length;
  } catch (error)
   {
    console.error('Error fetching compensatory off days:', error);
    return 0;
  }
};
// Generate dummy leave data
// In leavemanage.jsx

// Update the fetchLeaveApplications function (around line 109)
// In leavemanage.jsx

// Update the fetchLeaveApplications function
const fetchLeaveApplications = async (userId = null) => {
  try {
    let query;

    if (userId) {
      // ✅ FIX: Added .eq('user_id', userId) to correctly filter for the current employee
      query = supabase
        .from('leave_applications')
        .select(`
          id,
          employee_name,
          employee_code,
          leave_type,
          start_date,
          end_date,
          total_days,
          total_hours,
          status,
          reason,
          sub_type,
          applied_date,
          approved_by,
          approved_date,
          rejected_by,
          rejection_reason
        `)
        .eq('user_id', userId) // <-- This line is the crucial fix
        .order('applied_date', { ascending: false });

    } else {
      // HR/Admin query to fetch leaves for multiple employee types
      const { data: allLeaves, error: fetchError } = await supabase
        .from('leave_applications')
        .select(`
          *,
          users!inner (
            id,
            name,
            employee_id,
            email,
            employee_type,
            start_date
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Filter in JavaScript for HR view
      const filteredLeaves = allLeaves.filter(leave => 
        leave.users?.employee_id?.startsWith('MYAEMP') || 
        leave.users?.employee_id?.startsWith('MYAINT')
      );
      
      return filteredLeaves || [];
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

// In leavemanage.jsx
// In leavemanage.jsx
// Replace the existing fetchLeaveBalances function with this one

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

    if (data) {
      const currentYear = dayjs().year();
      const lastUpdatedYear = dayjs(data.last_updated || data.created_at).year();
      const currentMonth = dayjs().month();
      const lastMonthlyReset = dayjs(data.last_monthly_reset).month();
      const updates = {};
      let shouldUpdate = false;

      // --- NEW: Monthly Renewal Logic ---
      // Check if the month has changed since the last monthly reset
      if (currentMonth !== lastMonthlyReset) {
        updates.permission_remaining = 2; // Reset permissions to 2
        updates.excuses_remaining = 1;     // Reset excuses to 1
        updates.last_monthly_reset = new Date().toISOString();
        shouldUpdate = true;
        console.log(`Monthly renewal triggered for user ${userId}.`);
      }

      // --- EXISTING: Yearly Renewal Logic (with slight modification) ---
      if (currentYear > lastUpdatedYear) {
        const newCasualTotal = data.casual_remaining + 12;
        updates.casual_total = newCasualTotal;
        updates.casual_remaining = newCasualTotal;
        updates.medical_total = 12;
        updates.medical_remaining = 12;
        updates.last_updated = new Date().toISOString();
        shouldUpdate = true;
        console.log(`Yearly renewal triggered for user ${userId}.`);
      }

      // If any updates are needed, perform them
      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('leave_balances')
          .update(updates)
          .eq('user_id', userId);
        
        if (updateError) throw updateError;
        
        // Fetch the newly updated data to reflect on the UI immediately
        return await fetchLeaveBalances(userId);
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching or updating leave balances:", error);
    message.error("Could not refresh leave balances.");
    return null;
  }
};

// Replace the existing calculateLeaveBalances function with this corrected one

const calculateLeaveBalances = async (userId, currentUser) => {
  // 1. Fetch all necessary data first.
  const balanceData = await fetchLeaveBalances(userId);
  
  // Cache holidays to prevent repeated fetching
  if (!window.holidayCache) {
    window.holidayCache = await fetchCompanyCalendar();
  }
  const holidays = window.holidayCache;
  
  const totalWorkingDaysPresent = await fetchWorkingDays(userId, holidays);
  const totalCompensatoryDaysEarned = await fetchCompensatoryOffDays(userId, holidays);

  // 2. Calculate the total leaves earned based on your rules.
  const totalEarnedLeave = Math.floor(totalWorkingDaysPresent / 20);

  // 3. Handle the case for a new user with no existing balance record.
  if (!balanceData) {
    return {
      permission: { total: 2, used: 0, remaining: 2, monthlyLimit: 2 },
      casualLeave: { total: 12, used: 0, remaining: 12, monthlyLimit: 1 },
      earnedLeave: { 
        total: totalEarnedLeave, 
        used: 0, 
        remaining: totalEarnedLeave 
      },
      medicalLeave: { 
        total: 12, 
        used: 0, 
        remaining: 12,
        extraGranted: 0,
        extraUsed: 0,
        totalAvailable: 12
      },
      maternityLeave: { total: 84, used: 0, remaining: 84 },
      compensatoryLeave: { 
        total: totalCompensatoryDaysEarned, 
        used: 0, 
        remaining: totalCompensatoryDaysEarned 
      },
      excuses: { total: 1, used: 0, remaining: 1, monthlyLimit: 1 }
    };
  }

  // 4. If a user has an existing record, calculate their current balances.
  const totalMedicalAvailable =  (balanceData.medical_total || 0)+ (balanceData.medical_extra_granted || 0);
  const totalMedicalUsed = (balanceData.medical_used || 0) + (balanceData.medical_extra_used || 0);

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
    },
    earnedLeave: {
      total: totalEarnedLeave,
      used: balanceData.earned_used || 0,
      remaining: totalEarnedLeave - (balanceData.earned_used || 0)
    },
 medicalLeave: {
      total: balanceData.medical_total, // FIX: Reads the prorated total from the database.
      used: balanceData.medical_used || 0,
      remaining: balanceData.medical_remaining, // FIX: Reads the correct remaining balance from the database.
      extraGranted: balanceData.medical_extra_granted || 0,
      extraUsed: balanceData.medical_extra_used || 0,
      totalAvailable: totalMedicalAvailable, // This is now calculated correctly.
      totalUsed: totalMedicalUsed
    },
    maternityLeave: {
      total: balanceData.maternity_total,
      used: balanceData.maternity_used,
      remaining: balanceData.maternity_remaining
    },
    compensatoryLeave: {
      total: totalCompensatoryDaysEarned,
      used: balanceData.compensatory_used || 0,
      remaining: totalCompensatoryDaysEarned - (balanceData.compensatory_used || 0)
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
      destroyOnHidden
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
  // if (userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'hr') {
  //   return <ErrorPage errorType="403" />;
  // }
  const [employees, setEmployees] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [leaveBalanceRaw, setLeaveBalanceRaw] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [medicalLeaveModal, setMedicalLeaveModal] = useState(false);
  const [selectedEmployeeForMedical, setSelectedEmployeeForMedical] = useState(null);
  const [medicalForm] = Form.useForm();
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(false); // <--- setLoading is defined here
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
    const [activeTab, setActiveTab] = useState('dashboard');
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [balanceWarning, setBalanceWarning] = useState('');

  // ADD THESE LINES FOR PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentUser, setCurrentUser] = useState(null);


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

useEffect(() => {
  // Only load data ONCE when component mounts and user is available
  if (!dataLoaded && currentUser?.id && activeTab === 'dashboard') {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // FIRST: Initialize balance if it doesn't exist (only for employee)
        if (userRole === 'employee') {
          await initializeUserLeaveBalance(currentUserId);
        }
        
        // THEN: Load data
        const leaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
        
        // Only calculate balances for employee view
        let balances = {};
        if (userRole === 'employee') {
          balances = await calculateLeaveBalances(currentUserId, currentUser);
        }
        
        setLeaveData(leaves);
        setLeaveBalances(balances);
        setDataLoaded(true);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    };
    
    loadInitialData();
  }
}, [currentUser?.id, dataLoaded, activeTab, userRole]);
 useEffect(() => {
  let filtered = leaveData;
  
  if (filterStatus !== 'All') {
    filtered = filtered.filter(leave => leave.status === filterStatus);
  }
  
  if (filterType !== 'All') {
    filtered = filtered.filter(leave => leave.leave_type === filterType);
  }
  
  if (filterEmployee !== 'All') {
    // UPDATED: Corrected the filter to use user_id
    filtered = filtered.filter(leave => leave.user_id === filterEmployee);
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
// Add this component before LeaveManagementPage
const HRMedicalLeaveModal = ({ visible, onCancel, employees, onAllocate, loading }) => {
  const [form] = Form.useForm();
  
  return (
    <Modal
      title={
        <Space>
          <MedicineBoxOutlined style={{ color: '#ff4d4f' }} />
          <span>Allocate Additional Medical Leave</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button 
          key="allocate" 
          type="primary" 
          onClick={() => form.submit()}
          loading={loading}
          style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
        >
          Allocate Leave
        </Button>
      ]}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onAllocate}>
        <Form.Item
          name="employeeId"
          label="Select Employee"
          rules={[{ required: true, message: 'Please select an employee' }]}
        >
          <Select 
            placeholder="Choose employee"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {employees.map(emp => (
              <Option key={emp.id} value={emp.id}>
                <Space>
                  <Avatar size="small" style={{ backgroundColor: '#ff4d4f' }}>
                    {emp.name.charAt(0)}
                  </Avatar>
                  {emp.name} ({emp.employee_id})
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="extraDays"
          label="Additional Medical Leave Days"
          rules={[
            { required: true, message: 'Please enter number of days' },
            { type: 'number', min: 1, max: 30, message: 'Days must be between 1-30' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter number of additional days"
            min={1}
            max={30}
          />
        </Form.Item>

        {/* <Form.Item
          name="medicalCertificate"
          label="Medical Certificate (Required)"
          rules={[{ required: true, message: 'Medical certificate is required' }]}
          valuePropName="fileList"
          getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
        >
          <Upload
            listType="picture-card"
            maxCount={1}
            beforeUpload={() => false}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload Certificate</div>
            </div>
          </Upload>
        </Form.Item> */}

        <Form.Item
          name="reason"
          label="HR Comments/Reason"
          rules={[{ required: true, message: 'Please provide reason for allocation' }]}
        >
          <TextArea
            rows={3}
            placeholder="Reason for granting additional medical leave..."
            maxLength={300}
            showCount
          />
        </Form.Item>

        <Alert
          message="This will add extra medical leave days to the selected employee's balance."
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Form>
    </Modal>
  );
};

const handleAllocateMedicalLeave = async (values) => {
    setLoading(true);
    try {
      const { employeeId, extraDays, reason, medicalCertificate } = values;

      // 1. Upload the certificate
      if (!medicalCertificate || medicalCertificate.length === 0) {
        message.error('Medical certificate is required.');
        setLoading(false);
        return;
      }
      const certificateUrl = await uploadFileToSupabase(medicalCertificate[0].originFileObj);

      // 2. Get the user's current leave balance
      const { data: currentBalance, error: fetchError } = await supabase
        .from('leave_balances')
        .select('medical_extra_granted, medical_remaining')
        .eq('user_id', employeeId)
        .single();

      if (fetchError) {
        // If no record exists, initialize it first
        await initializeUserLeaveBalance(employeeId);
        // Then retry fetching
        const { data: newBalance, error: newFetchError } = await supabase
            .from('leave_balances')
            .select('medical_extra_granted, medical_remaining')
            .eq('user_id', employeeId)
            .single();
        if (newFetchError) throw newFetchError;
        Object.assign(currentBalance, newBalance);
      }
      
      // 3. Calculate new totals
      const newExtraGranted = (currentBalance?.medical_extra_granted || 0) + extraDays;
      const newRemaining = (currentBalance?.medical_remaining || 0) + extraDays;

      // 4. Update the leave_balances table
      const { error: updateError } = await supabase
        .from('leave_balances')
        .update({
          medical_extra_granted: newExtraGranted,
          medical_remaining: newRemaining,
          // Optional: You could add a log of this specific allocation
          // allocation_history: supabase.sql`allocation_history || ${JSON.stringify({ date: new Date(), days: extraDays, reason, certificateUrl })}::jsonb`
        })
        .eq('user_id', employeeId);

      if (updateError) throw updateError;
      
      message.success(`${extraDays} additional medical leave days allocated successfully!`);
      
      // 5. Close modal and reset form
      setMedicalLeaveModal(false);
      medicalForm.resetFields();
      
      // 6. Refresh data for the current view
      if (userRole === 'employee' && currentUserId === employeeId) {
        const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
        setLeaveBalances(updatedBalances);
      }

    } catch (error) {
      console.error('Error allocating medical leave:', error);
      message.error('Failed to allocate medical leave. Please try again.');
    } finally {
      setLoading(false);
    }
  };
// Helper to count only working days (exclude weekends + holidays)
// In leavemanage.jsx, replace the existing countDeductibleDays function

const countDeductibleDays = async (startDate, endDate) => {
  // 1. Fetch all public holidays
  const holidays = await fetchCompanyCalendar(); // Fetches all dates marked as 'holiday'

  // 2. Fetch the dynamic working day configuration set by HR
  const { data: configData, error: configError } = await supabase
    .from('company_calendar')
    .select('reason') // We only need the JSON data from the 'reason' column
    .eq('day_type', 'working_config') // Fetch the correct configuration type
    .single();

  // Handle potential errors while fetching the configuration
  if (configError && configError.code !== 'PGRST116') { // PGRST116 means no row was found, which is okay
    console.error('Error fetching working day configuration:', configError);
    // Fallback to a simple day count if the configuration is unavailable
    return dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
  }

  // 3. Define a default schedule in case no configuration is set in the database yet
  const defaultConfig = {
    monday: true, tuesday: true, wednesday: true,
    thursday: true, friday: true, saturday: false, sunday: false
  };

  // 4. Safely parse the configuration from the database, or use the default
  // This now correctly looks inside the nested JSON for the "workingDays" object
  const workingDaysConfig = configData?.reason
    ? JSON.parse(configData.reason).workingDays || defaultConfig
    : defaultConfig;

  // 5. Iterate through the date range to count only the deductible days
  let deductibleDays = 0;
  let current = dayjs(startDate);

  while (current.isSameOrBefore(endDate, 'day')) {
    const dayName = current.format('dddd').toLowerCase(); // e.g., 'monday', 'tuesday'
    const isHoliday = holidays.has(current.format('YYYY-MM-DD'));
    
    // Check if the current day is marked as a working day in the fetched configuration
    const isWorkingDay = workingDaysConfig[dayName];

    // A day is only deducted if it is a configured working day AND not a public holiday
    if (isWorkingDay && !isHoliday) {
      deductibleDays++;
    }

    current = current.add(1, 'day');
  }

  return deductibleDays;
};


// In leavemanage.jsx, replace the existing calculateLeaveDays function
// In leavemanage.jsx, replace the existing calculateLeaveDays function

const calculateLeaveDays = async () => {
  const startDate = form.getFieldValue('startDate');
  const endDate = form.getFieldValue('endDate');
  const leaveType = form.getFieldValue('leaveType');
  const subType = form.getFieldValue('subType'); // This will be 'HDL' or 'FDL'

  if (!startDate || !leaveType) {
    setCalculatedDays(0);
    setBalanceWarning('');
    return;
  }

  let days = 0;

  if (leaveType === 'Permission') {
    days = 0; // Permissions are in hours.
  } else if (leaveType === 'Excuses') {
    days = 1; // An excuse is always treated as 1 unit/day for deduction.
  } else if (leaveType === 'Casual Leave' && subType === 'HDL') {
    // FIX: A half-day leave is always 0.5 days.
    days = 0.5;
  } else if (leaveType === 'Casual Leave' && subType === 'FDL') {
    // Use the working day counter for Full Day Casual Leave
    days = await countDeductibleDays(startDate, endDate || startDate);
  }
   else if (leaveType === 'Medical Leave') {
    days = await countDeductibleDays(startDate, endDate || startDate);
  } else {
    // Default calculation for other leave types
    const start = dayjs(startDate);
    const end = dayjs(endDate || startDate);
    days = end.diff(start, 'days') + 1;
  }

  setCalculatedDays(days);

  const currentBalance = getCurrentBalance(leaveType);
  if (days > 0 && days > currentBalance && leaveType !== 'On Duty' && leaveType !== 'Overtime') {
    setBalanceWarning(`❌ You don’t have enough balance for ${leaveType}. Only ${currentBalance} available.`);
  } else if (days > 0) {
    setBalanceWarning(`✅ This will deduct ${days} day(s) from your ${leaveType} balance.`);
  } else {
    setBalanceWarning('');
  }
};
// Helper function to get current balance
const getCurrentBalance = (leaveType) => {
  switch (leaveType) {
    case 'Permission': return leaveBalances.permission?.remaining || 0;
    case 'Casual Leave': return leaveBalances.casualLeave?.remaining || 0;
    case 'Earned Leave': return leaveBalances.earnedLeave?.remaining || 0;
    case 'Medical Leave': return leaveBalances.medicalLeave?.remaining || 0;
    case 'Maternity Leave': return leaveBalances.maternityLeave?.remaining || 0;
    case 'Compensatory Leave': return leaveBalances.compensatoryLeave?.remaining || 0;
    case 'Excuses': return leaveBalances.excuses?.remaining || 0;
    default: return 999; // For leaves without balance like 'On Duty'
  }
};

// Add watchers to form fields
useEffect(() => {
  calculateLeaveDays();
}, [form.getFieldValue('startDate'), form.getFieldValue('endDate'), form.getFieldValue('leaveType'), form.getFieldValue('subType')]);


// In leavemanage.jsx, replace the existing handleApplyLeave function
const handleApplyLeave = async (values) => {
  setLoading(true);
  try {
    // Destructure all relevant values from the form
    const { startDate, endDate, leaveType, subType, startTime, endTime, reason, session } = values;

    if (leaveType === 'Permission' && startTime && endTime) {
      const hours = endTime.diff(startTime, 'hours');
      if (hours > 2) {
        message.error('Permission cannot be applied for more than 2 hours.');
        setLoading(false);
        return;
      }
    }

    let totalDays = 0;

    // --- UPDATED LOGIC ---
    if (leaveType === 'Permission') {
      totalDays = 0;
    } else if (leaveType === 'Excuses') {
      totalDays = 1;
    } else if (leaveType === 'Casual Leave' && subType === 'HDL') {
      // Correctly assign 0.5 for half-day leave
      totalDays = 0.5;
    } else if (leaveType === 'Casual Leave' || leaveType === 'Medical Leave') {
      totalDays = await countDeductibleDays(startDate, endDate || startDate);
    } else {
      const start = dayjs(startDate);
      const end = dayjs(endDate || startDate);
      totalDays = end.diff(start, 'days') + 1;
    }

   // In handleApplyLeave function, replace the validation section with:
const currentBalance = getCurrentBalance(leaveType);
const isValidationRequired = !['On Duty', 'Overtime'].includes(leaveType);

// FIX: For HDL, check if balance is at least 0.5
if (isValidationRequired) {
  if (leaveType === 'Casual Leave' && subType === 'HDL' && currentBalance < 0.5) {
    message.error(`You don't have enough ${leaveType}. Need 0.5 days, but only ${currentBalance} available.`);
    setLoading(false);
    return;
  } else if (totalDays > currentBalance && !(leaveType === 'Casual Leave' && subType === 'HDL')) {
    message.error(`You don't have enough ${leaveType}. Only ${currentBalance} available.`);
    setLoading(false);
    return;
  }
}
    
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
      // Store 'HDL - Morning' or 'HDL - Afternoon' for clarity
      sub_type: subType === 'HDL' ? `${subType} - ${session}` : subType,
      start_date: values.startDate.format('YYYY-MM-DD'),
      // For HDL, end_date is the same as start_date
      end_date: subType === 'HDL' ? values.startDate.format('YYYY-MM-DD') : (values.endDate || values.startDate).format('YYYY-MM-DD'),
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
      
    const { error } = await supabase
      .from('leave_applications')
      .insert([newLeave])
      .select()
      .single();
    
    if (error) throw error;
    
    clearCache();
    
    const updatedLeaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
    setLeaveData(updatedLeaves);
    
    if (userRole === 'employee') {
      const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
      setLeaveBalances(updatedBalances);
    }
    
    setApplyLeaveModal(false);
    form.resetFields();
    setBalanceWarning('');
    setCalculatedDays(0);
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
const updateLeaveBalance = async (userId, leaveType, days, subType = null) => {
  try {
    // First ensure user has a balance record
    await initializeUserLeaveBalance(userId);
    
    const { data: currentBalances, error: fetchError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching leave balances:', fetchError.message);
      return;
    }

    const updates = { updated_at: new Date().toISOString() };
        
    switch (leaveType) {
      case 'Permission':
        updates.permission_used = (currentBalances.permission_used || 0) + 1;
        updates.permission_remaining = Math.max(0, (currentBalances.permission_remaining || 2) - 1);
        break;
        
      case 'Casual Leave':
        // FIX: Use the actual days value for HDL (0.5) or FDL (varies)
        const actualDays = subType && subType.includes('HDL') ? 0.5 : days;
        updates.casual_used = (currentBalances.casual_used || 0) + actualDays;
        updates.casual_remaining = Math.max(0, (currentBalances.casual_remaining || 12) - actualDays);
        break;
        
      case 'Earned Leave':
        updates.earned_used = (currentBalances.earned_used || 0) + days;
        // FIX: Calculate remaining based on current earned leave total
        const currentEarnedTotal = await calculateEarnedLeaveTotal(userId);
        updates.earned_remaining = Math.max(0, currentEarnedTotal - ((currentBalances.earned_used || 0) + days));
        break;
        
      case 'Medical Leave':
        updates.medical_used = (currentBalances.medical_used || 0) + days;
        updates.medical_remaining = Math.max(0, (currentBalances.medical_remaining || 12) - days);
        break;

      case 'Maternity Leave':
        updates.maternity_used = (currentBalances.maternity_used || 0) + days;
        updates.maternity_remaining = Math.max(0, (currentBalances.maternity_remaining || 84) - days);
        break;
        
      case 'Compensatory Leave':
        updates.compensatory_used = (currentBalances.compensatory_used || 0) + days;
        // FIX: Calculate remaining based on current compensatory leave total
        const currentCompTotal = await calculateCompensatoryLeaveTotal(userId);
        updates.compensatory_remaining = Math.max(0, currentCompTotal - ((currentBalances.compensatory_used || 0) + days));
        break;
        
      case 'Excuses':
        updates.excuses_used = (currentBalances.excuses_used || 0) + 1;
        updates.excuses_remaining = Math.max(0, (currentBalances.excuses_remaining || 1) - 1);
        break;
      
      default:
        return; // No balance update needed for On Duty, Overtime, etc.
    }

    const { error: updateError } = await supabase
      .from('leave_balances')
      .update(updates)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating leave balances:', updateError.message);
    } else {
      console.log(`Leave balance updated: ${actualDays || days} days deducted for user:`, userId);
    }

  } catch (error) {
    console.error('Error in updateLeaveBalance:', error);
  }
};
const calculateEarnedLeaveTotal = async (userId) => {
  // Cache holidays to prevent repeated fetching
  if (!window.holidayCache) {
    window.holidayCache = await fetchCompanyCalendar();
  }
  const holidays = window.holidayCache;
  
  const totalWorkingDaysPresent = await fetchWorkingDays(userId, holidays);
  return Math.floor(totalWorkingDaysPresent / 20);
};

const calculateCompensatoryLeaveTotal = async (userId) => {
  // Cache holidays to prevent repeated fetching
  if (!window.holidayCache) {
    window.holidayCache = await fetchCompanyCalendar();
  }
  const holidays = window.holidayCache;
  
  return await fetchCompensatoryOffDays(userId, holidays);
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
    
    if ((leaveBalances.medicalLeave?.remaining || 0) > 0) {
  available.push('Medical Leave');
}

    
    // These are always available (no balance limits)
    available.push('On Duty', 'Overtime');
    
    return available;
  };


 // In leavemanage.jsx
// Replace the existing initializeUserLeaveBalance function with this one

const initializeUserLeaveBalance = async (userId) => {
  try {
    // Check if balance record already exists
    const { data: existingBalance } = await supabase
      .from('leave_balances')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingBalance) {
      return; // Balance already exists
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    if (!userData) {
      console.error('User not found:', userId);
      return;
    }

    // --- NEW: Prorated Leave Calculation ---
    // Calculates leaves based on months remaining in the year.
    // dayjs().month() is 0-indexed (Jan=0), so we add 1.
    const currentMonth = dayjs().month() + 1; 
    const proratedLeaves = 12 - currentMonth + 1; // +1 to include the current month

    // Create initial balance record
    const { error } = await supabase
      .from('leave_balances')
      .insert([{
        user_id: userId,
        employee_name: userData.name,
        permission_total: 2,
        permission_used: 0,
        permission_remaining: 2,
        // --- UPDATED: Use prorated values for the first year ---
        casual_total: proratedLeaves,
        casual_used: 0,
        casual_remaining: proratedLeaves,
        earned_total: 0,
        earned_used: 0,
        earned_remaining: 0,
        medical_total: proratedLeaves,
        medical_used: 0,
        medical_remaining: proratedLeaves,
        // --- End of Update ---
        maternity_total: 84,
        maternity_used: 0,
        maternity_remaining: 84,
        compensatory_total: 0,
        compensatory_used: 0,
        compensatory_remaining: 0,
        excuses_total: 1,
        excuses_used: 0,
        excuses_remaining: 1
      }]);

    if (error) {
      console.error('Error initializing leave balance:', error);
    } else {
      console.log(`Leave balance initialized for user ${userId} with ${proratedLeaves} prorated leaves.`);
    }

  } catch (error) {
    console.error('Error in initializeUserLeaveBalance:', error);
  }
};
// Update the handleLeaveAction function:
const handleLeaveAction = async (leaveId, action, reason = null) => {
  setLoading(true);
  try {
    // Get the leave details first
    const { data: leaveDetails, error: fetchError } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', leaveId)
      .single();
    
    if (fetchError) throw fetchError;

    const updates = {
      status: action === 'approve' ? 'Approved' : 'Rejected',
      approved_by: action === 'approve' ? (currentUser?.name || 'Admin') : null,
      rejected_by: action === 'reject' ? (currentUser?.name || 'Admin') : null,
      approved_date: action === 'approve' ? new Date().toISOString().split('T')[0] : null,
      rejection_reason: action === 'reject' ? reason : null,
    };
    
    const { error } = await supabase
      .from('leave_applications')
      .update(updates)
      .eq('id', leaveId);
    
    if (error) throw error;
    
    // Update balance if approved
  // In handleLeaveAction function, after updating balance:
if (action === 'approve') {
  // FIX: Pass the sub_type to handle HDL correctly
  const totalDays = leaveDetails.leave_type === 'Permission' ? 0 : leaveDetails.total_days;
  await updateLeaveBalance(
    leaveDetails.user_id, 
    leaveDetails.leave_type, 
    totalDays, 
    leaveDetails.sub_type // Pass sub_type for HDL detection
  );
  
  // Force refresh balances for the affected user
  if (leaveDetails.user_id === currentUserId) {
    // Clear cache to ensure fresh calculation
    clearCache();
    const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
    setLeaveBalances(updatedBalances);
  }
}
    
    // Force immediate UI refresh (backup to realtime)
    setTimeout(async () => {
      const updatedLeaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
      setLeaveData(updatedLeaves);
      
      // Update balances for the affected user
      if (userRole === 'employee' && leaveDetails.user_id === currentUserId) {
        const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
        setLeaveBalances(updatedBalances);
      }
    }, 300);
    
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
  <Spin spinning={loading} tip="Fetching your leave data..." size="large">
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
        {loading ? (
          // Skeleton Loading State
          Array.from({ length: 7 }).map((_, index) => (
            <Col xs={12} sm={8} md={6} lg={4} xl={4} key={index}>
              <Card 
                style={{ 
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
                styles={{ body: { padding: '12px' } }}
              >
                <div style={{ textAlign: 'center', height: '135px' }}>
                  <Spin />
                </div>
              </Card>
            </Col>
          ))
        ) : (
          // Actual Data
          Object.entries(leaveBalances).map(([key, balance]) => {
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
                        / {key === 'medicalLeave' ? balance.totalAvailable || balance.total : balance.total}
                      </Text>
                    </div>
                    {key === 'medicalLeave' && balance.extraGranted > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <Text style={{ fontSize: '9px', color: '#ff4d4f' }}>
                          +{balance.extraGranted} HR granted
                        </Text>
                      </div>
                    )}
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
          })
        )}
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
        
        <div style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
          {/* Timeline or Empty State */}
          {!loading && filteredLeaves.length === 0 ? (
            <Empty description="No recent applications found." />
          ) : (
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
          )}
        </div>
      </Card>
    </div>
  </Spin>
);

  // HR/Admin Table Columns
const getTableColumns = () => {
  const isMobile = window.innerWidth < 768;
  
  const baseColumns = [
    // Employee Column (Enhanced)
    ...(userRole !== 'employee' ? [{
      title: (
        <Space>
          <UserOutlined className="employee-icon" />
          <span className="column-title">Employee</span>
        </Space>
      ),
      key: 'employee',
      render: (_, record) => (
        <Space direction="horizontal" size={12}>
          <Avatar 
            className="employee-avatar"
            size={isMobile ? 36 : 42}
          >
            {(record.users?.name || record.employee_name)?.charAt(0)}
          </Avatar>
          <div className="employee-info">
            <div className="employee-name">
              {record.users?.name || record.employee_name}
            </div>
            {/* <Text className="employee-id">
              {record.users?.employee_id || record.employee_code}
            </Text>
            {!isMobile && (
              <div className="employee-department">
                {record.department}
              </div>
            )} */}
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
          <div className="leave-duration-dates">
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
          <div className="leave-duration-dates">
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
    // State to track if Casual Leave is HDL or FDL
    const [casualLeaveDuration, setCasualLeaveDuration] = useState('FDL');
    const availableLeaveTypes = getAvailableLeaveTypes();
    const isMedicalDisabled = !leaveBalances.medicalLeave || leaveBalances.medicalLeave.remaining <= 0;
    const isPermissionDisabled = leaveBalances.permission?.remaining <= 0;
    const isCasualDisabled = !leaveBalances.casualLeave || leaveBalances.casualLeave.remaining < 0.5;
    const isEarnedDisabled = !leaveBalances.earnedLeave || leaveBalances.earnedLeave.remaining <= 0;
    const isCompensatoryDisabled = !leaveBalances.compensatoryLeave || leaveBalances.compensatoryLeave.remaining <= 0;
    const isExcusesDisabled = leaveBalances.excuses?.remaining <= 0;

     useEffect(() => {
      const validatePermissionTime = () => {
        if (selectedLeaveType === 'Permission') {
          const startTime = form.getFieldValue('startTime');
          const endTime = form.getFieldValue('endTime');
          
          if (startTime && endTime) {
            const hours = endTime.diff(startTime, 'hours');
            if (hours > 2) {
              form.setFields([
                {
                  name: 'endTime',
                  errors: ['Permission cannot exceed 2 hours.'],
                },
              ]);
            } else {
              // Clear the error if valid
              form.setFields([{ name: 'endTime', errors: [] }]);
            }
          }
        }
      };

      validatePermissionTime();
    }, [form.getFieldValue('startTime'), form.getFieldValue('endTime'), selectedLeaveType]);
    
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleApplyLeave}
        initialValues={{
          startDate: dayjs(),
          endDate: dayjs(),
          subType: 'FDL', // Default to Full Day Leave
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
                  // Reset sub-fields when leave type changes
                  form.resetFields(['subType', 'startTime', 'endTime', 'endDate', 'session']);
                  if (value === 'Casual Leave') {
                     setCasualLeaveDuration('FDL'); // Default back to FDL
                     form.setFieldsValue({ subType: 'FDL' });
                  }
                }}
                size="large"
              >
                {/* --- Your Leave Type Options --- */}
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
                   <Space>
                    <MedicineBoxOutlined style={{ color: '#eb2f96' }} />
                    Maternity Leave
                  </Space>
                </Option>
               <Option value="Compensatory Leave" disabled={isCompensatoryDisabled}>
                   <Space>
                    <FaIndianRupeeSign  style={{ color: '#722ed1' }} />
                    Compensatory Leave ({leaveBalances.compensatoryLeave?.remaining || 0} remaining)
                  </Space>
                </Option>
                <Option value="Excuses" disabled={isExcusesDisabled}>
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                    Excuses ({leaveBalances.excuses?.remaining || 0} remaining)
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

          {/* --- UPDATED CONDITIONAL RENDERING FOR CASUAL LEAVE --- */}
          {selectedLeaveType === 'Casual Leave' && (
            <Col xs={24} md={12}>
              <Form.Item
                name="subType"
                label="Leave Duration"
                rules={[{ required: true, message: 'Please select duration' }]}
              >
                <Radio.Group 
                  onChange={(e) => setCasualLeaveDuration(e.target.value)} 
                  size="large"
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="FDL">Full Day</Radio.Button>
                  <Radio.Button value="HDL">Half Day</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          )}

          {/* This will now show only for HDL */}
          {selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL' && (
            <Col xs={24} md={12}>
              <Form.Item
                name="session"
                label="Select Session"
                rules={[{ required: true, message: 'Please select a session' }]}
              >
                <Select placeholder="Select morning or afternoon" size="large">
                  <Option value="Morning">Morning</Option>
                  <Option value="Afternoon">Afternoon</Option>
                </Select>
              </Form.Item>
            </Col>
          )}
          
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

        </Row>
        
        {/* --- ROW FOR DATES & TIMES --- */}
        <Row gutter={16}>
            <Col xs={24} md={
              (selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL') || selectedLeaveType === 'Excuses' || selectedLeaveType === 'Permission' 
              ? 24 
              : 12
            }>
            <Form.Item
                name="startDate"
                label={
                    selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL' ? 'Date' :
                    selectedLeaveType === 'Excuses' ? 'Date of Excuse' : 'Start Date'
                }
                rules={[{ required: true, message: 'Please select a date' }]}
            >
                <DatePicker 
                style={{ width: '100%' }}
                size="large"
                format="DD/MM/YYYY"
                disabledDate={(current) => selectedLeaveType === 'Excuses' ? current && current > dayjs().endOf('day') : false}
                />
            </Form.Item>
            </Col>

            {/* Conditionally hide End Date for various types */}
            {selectedLeaveType !== 'Permission' && selectedLeaveType !== 'Excuses' && !(selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL') && (
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
                    return current && startDate && current < startDate;
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
              (selectedLeaveType === 'Casual Leave' && leaveBalances.casualLeave.remaining < 0.5) ||
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

  const [employeeLeaveBalance, setEmployeeLeaveBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const config = getLeaveTypeConfig(selectedLeave.leave_type || selectedLeave.leaveType);

  // Fetch the specific employee's leave balance when the modal opens
  useEffect(() => {
    const fetchBalanceForEmployee = async () => {
      if (selectedLeave && selectedLeave.user_id) {
        setBalanceLoading(true);
        try {
          const balances = await calculateLeaveBalances(selectedLeave.user_id);
          setEmployeeLeaveBalance(balances);
        } catch (error) {
          console.error("Failed to fetch employee balance for modal:", error);
          setEmployeeLeaveBalance(null); // Reset on error
        } finally {
          setBalanceLoading(false);
        }
      }
    };

    fetchBalanceForEmployee();
  }, [selectedLeave]); // Re-run when a new leave is selected

  // Helper to get the specific balance details based on the leave type
  const getBalanceForType = (type) => {
    if (!employeeLeaveBalance) return null;
    switch (type) {
      case 'Permission': return employeeLeaveBalance.permission;
      case 'Casual Leave': return employeeLeaveBalance.casualLeave;
      case 'Earned Leave': return employeeLeaveBalance.earnedLeave;
      case 'Medical Leave': return employeeLeaveBalance.medicalLeave;
      case 'Maternity Leave': return employeeLeaveBalance.maternityLeave;
      case 'Compensatory Leave': return employeeLeaveBalance.compensatoryLeave;
      case 'Excuses': return employeeLeaveBalance.excuses;
      default: return null;
    }
  };

  const relevantBalance = getBalanceForType(selectedLeave.leave_type || selectedLeave.leaveType);

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
      // --- CHANGE: Removed action buttons from the footer ---
      footer={[
        <Button key="close" onClick={() => {
          setLeaveDetailsModal(false);
          setSelectedLeave(null);
        }}>
          Close
        </Button>,
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

        {/* --- NEW: Added Leave Balance Information Row --- */}
        {relevantBalance && (
           <Descriptions.Item label={`${selectedLeave.leave_type} Balance`}>
            {balanceLoading ? (
              <Spin size="small" />
            ) : (
              <Space split={<Divider type="vertical" />}>
                <Statistic title="Total" value={relevantBalance.total} valueStyle={{ fontSize: '16px', color: '#333' }} />
                <Statistic title="Used" value={relevantBalance.used} valueStyle={{ fontSize: '16px', color: '#fa8c16' }} />
                <Statistic title="Remaining" value={relevantBalance.remaining} valueStyle={{ fontSize: '16px', color: '#52c41a' }} />
              </Space>
            )}
           </Descriptions.Item>
        )}

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
// In leavemanage.jsx

useEffect(() => {
  // Only set up realtime after initial data is loaded and for the dashboard tab
  if (!dataLoaded || activeTab !== 'dashboard' || !currentUser?.id) return;

  console.log('Setting up realtime subscriptions for user:', currentUserId);

  // --- LEAVE APPLICATIONS SUBSCRIPTION ---
  const leaveChannel = supabase
    .channel('realtime-leave-applications')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leave_applications',
      // Filter for employee's own applications OR all applications for HR
      ...(userRole === 'employee' && { filter: `user_id=eq.${currentUserId}` })
    }, async (payload) => {
      console.log('🔄 Realtime: Leave application change detected!', payload);
      
      try {
        // Fetch updated leave data
        const updatedLeaves = await fetchLeaveApplications(userRole === 'employee' ? currentUserId : null);
        setLeaveData(updatedLeaves);
        
        // If this is an employee and it's their own application, also update balances
        if (userRole === 'employee' && payload.new?.user_id === currentUserId) {
          console.log('🔄 Updating balances for employee after leave change');
          const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
          setLeaveBalances(updatedBalances);
        }
      } catch (error) {
        console.error('Error handling leave application change:', error);
      }
    })
    .subscribe();

  // --- LEAVE BALANCES SUBSCRIPTION ---
  const balanceChannel = supabase
    .channel('realtime-leave-balances')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leave_balances',
      // Only listen to current user's balance changes for employees
      ...(userRole === 'employee' && { filter: `user_id=eq.${currentUserId}` })
    }, async (payload) => {
      console.log('🔄 Realtime: Leave balance change detected!', payload);
      
      try {
        // For employees, only update if it's their balance
        if (userRole === 'employee') {
          if (payload.new?.user_id === currentUserId || payload.old?.user_id === currentUserId) {
            const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
            setLeaveBalances(updatedBalances);
            console.log('✅ Employee balance updated via realtime');
          }
        } else {
          // For HR, this might trigger other updates
          console.log('HR detected balance change for user:', payload.new?.user_id);
        }
      } catch (error) {
        console.error('Error handling balance change:', error);
      }
    })
    .subscribe();

  // Enhanced cleanup function
  return () => {
    console.log('🧹 Cleaning up realtime subscriptions');
    supabase.removeChannel(leaveChannel);
    supabase.removeChannel(balanceChannel);
  };
}, [dataLoaded, currentUserId, userRole, currentUser?.id, activeTab]);
// Add cache clearing utility
const clearCache = () => {
  delete window.holidayCache;
};
// Add this useEffect hook inside LeaveManagementPage
useEffect(() => {
    const fetchEmployees = async () => {
        if (userRole !== 'employee' && activeTab === 'dashboard' && employees.length === 0) {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, employee_id') // Only essential fields
                .or('employee_id.like.MYAEMP%,employee_id.like.MYAINT%') // Server-side filtering
                .order('name', { ascending: true });
            
            if (error) {
                console.error("Error fetching employees:", error);
            } else {
                setEmployees(data || []);
            }
        }
    };

    fetchEmployees();
}, [userRole, activeTab, employees.length]);
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
<Col>
  <Tooltip title="Allocate Additional Medical Leave">
    <Button
      icon={<MedicineBoxOutlined />}
      onClick={() => setMedicalLeaveModal(true)} // <-- THIS IS THE FIX
      style={{
        height: '44px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
        border: 'none',
        color: 'white',
        fontWeight: 600,
        boxShadow: '0 4px 16px rgba(255, 77, 79, 0.24)',
      }}
    >
      Medical Leave
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
      <div className="leave-header">
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={12} md={14}>
            <Space size={16}>
              <div className="leave-icon-container">
                <NotificationOutlined style={{ fontSize: '20px', color: 'white' }} />
              </div>
              <div>
                <Title level={3} className="leave-title">
                  Leave Applications
                </Title>
                <Text className="leave-subtitle">
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
    <HRMedicalLeaveModal
        visible={medicalLeaveModal}
        onCancel={() => {
          setMedicalLeaveModal(false);
          medicalForm.resetFields();
        }}
        employees={employees}
        onAllocate={handleAllocateMedicalLeave}
        loading={loading}
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
      destroyOnHidden
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
