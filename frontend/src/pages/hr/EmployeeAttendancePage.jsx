import React, { useState, useEffect } from 'react';
import './EmployeeAttendancePage.css';
import { 
  Card, 
  Button, 
  DatePicker, 
  Table, 
  Checkbox, 
  Modal, 
  TimePicker, 
  Row, 
  Col, 
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
  Calendar,
  Badge,
  Tooltip,
  Spin
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  DashboardOutlined,
  SearchOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { Building,MapPinHouse } from 'lucide-react';
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';
import isBetween from 'dayjs/plugin/isBetween';
import ErrorPage from '../../error/ErrorPage';
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;
dayjs.extend(isBetween); 

const EmployeeAttendancePage = ({ userRole = 'hr' }) => { 
  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'hr') {
      return <ErrorPage errorType="403" />;
    }
  const [employeesData, setEmployeesData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const [monthlyData, setMonthlyData] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalEmployeeCount, setTotalEmployeeCount] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [leaveData, setLeaveData] = useState([]);
  const [onLeaveCount, setOnLeaveCount] = useState(0);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(data);
      }
    };
    getCurrentUser();
  }, []);
  
  const fetchOnLeaveCount = async (date, search, type) => {
    try {
      const dateKey = date.format('YYYY-MM-DD');

      // First, get the IDs of all users on approved leave for the selected date
      const { data: leaveUsers, error: leaveError } = await supabase
        .from('leave_applications')
        .select('user_id')
        .eq('status', 'Approved')
        .lte('start_date', dateKey)
        .gte('end_date', dateKey);

      if (leaveError) throw leaveError;
      
      const onLeaveUserIds = leaveUsers.map(l => l.user_id);

      if (onLeaveUserIds.length === 0) {
        setOnLeaveCount(0);
        return;
      }

      // Next, count how many of those users match the current page filters
      let userQuery = supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .in('id', onLeaveUserIds);

      if (search) {
        userQuery = userQuery.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%,department.ilike.%${search}%`);
      }
      
      if (type !== 'All') {
        const typeMapping = {
          'Full-time': 'full-time',
          'Intern': 'internship', 
          'Temporary': 'temporary'
        };
        userQuery = userQuery.eq('employee_type', typeMapping[type]);
      }

      const { count, error: userError } = await userQuery;

      if (userError) throw userError;

      setOnLeaveCount(count || 0);

    } catch (error) {
      console.error('Error fetching on-leave count:', error);
      setOnLeaveCount(0);
    }
  };

  const fetchLeaveData = async (date) => {
    try {
      const startDate = dayjs(date).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs(date).endOf('month').format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('leave_applications')
        .select('user_id, leave_type, start_date, end_date')
        .eq('status', 'Approved')
        .gte('end_date', startDate)
        .lte('start_date', endDate);

      if (error) throw error;
      setLeaveData(data || []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      message.error('Failed to load leave data');
      setLeaveData([]); // Set empty array on error
    }
  };

  // Fetch employees with pagination and filtering
  const fetchEmployees = async (page = 1, size = 5, search = '', type = 'All') => {
    try {
      setLoading(true);
      
      let baseQuery = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .in('employee_type', ['full-time', 'internship', 'temporary'])
        .not('role', 'in', '(superadmin,admin)');
      
      if (search) {
        baseQuery = baseQuery.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%,department.ilike.%${search}%`);
      }
      
      if (type !== 'All') {
        const typeMapping = {
          'Full-time': 'full-time',
          'Intern': 'internship', 
          'Temporary': 'temporary'
        };
        baseQuery = baseQuery.eq('employee_type', typeMapping[type]);
      }
      
      const { data, count, error } = await baseQuery.range((page - 1) * size, page * size - 1);
      
      if (error) throw error;
      
      setTotalEmployeeCount(count || 0);
      setTotalEmployees(count || 0);
      
      const transformedData = data.map(user => ({
        id: user.id,
        name: user.name,
        employeeId: user.employee_id,
        department: user.department || 'N/A',
        position: user.position || 'N/A',
        type: user.employee_type === 'internship' ? 'Intern' : 
              user.employee_type === 'temporary' ? 'Temporary' : 'Full-time',
        email: user.email,
        joinDate: user.start_date,
        avatar: user.profileimage,
        role: user.role
      }));
      
      setEmployeesData(transformedData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async (startDate, endDate, shouldMerge = false) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No attendance data found for the date range');
      }
      
      const transformedData = {};
      data.forEach(record => {
        const dateKey = record.date;
        if (!transformedData[dateKey]) {
          transformedData[dateKey] = {};
        }
        transformedData[dateKey][record.user_id] = {
          present: record.is_present,
          checkIn: record.check_in,
          checkOut: record.check_out,
          totalHours: record.total_hours,
          location_coordinates: record.location_coordinates,
          reason: record.reason
        };
      });
      
      if (shouldMerge) {
        setAttendanceData(prevData => ({
          ...prevData,
          ...transformedData
        }));
      } else {
        setAttendanceData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      message.error('Failed to load attendance data');
    }
  };

  // Mark individual employee as absent
  const handleMarkIndividualAbsent = async (employee) => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert([{
          user_id: employee.id,
          date: dateKey,
          check_in: null,
          check_out: null,
          total_hours: 0,
          is_present: false
        }], { onConflict: 'user_id,date' });

      if (error) throw error;

      await fetchAttendanceData(
        selectedDate.startOf('month').format('YYYY-MM-DD'),
        selectedDate.endOf('month').format('YYYY-MM-DD'),
        true
      );

      message.success(`${employee.name} marked as absent`);
    } catch (error) {
      console.error('Error marking absent:', error);
      message.error('Failed to mark absent');
    }
  };

  // Mark remaining employees as absent
  const handleMarkAbsent = async () => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const presentEmployeeIds = Object.keys(attendanceData[dateKey] || {})
      .filter(id => attendanceData[dateKey][id]?.present);
    
    const absentEmployees = employeesData.filter(emp => 
      !presentEmployeeIds.includes(emp.id)
    );

    if (absentEmployees.length === 0) {
      message.info('All employees already have attendance records');
      return;
    }

    try {
      const absentRecords = absentEmployees.map(employee => ({
        user_id: employee.id,
        date: dateKey,
        check_in: null,
        check_out: null,
        total_hours: 0,
        is_present: false
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(absentRecords, { onConflict: 'user_id,date' });

      if (error) throw error;

      await fetchAttendanceData(
        selectedDate.startOf('month').format('YYYY-MM-DD'),
        selectedDate.endOf('month').format('YYYY-MM-DD'),
        true
      );

      message.success(`Marked ${absentEmployees.length} employees as absent`);
    } catch (error) {
      console.error('Error marking absent:', error);
      message.error('Failed to mark absent');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
    fetchEmployees(1, pageSize, value, filterType);
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    setFilterType(value);
    setCurrentPage(1);
    fetchEmployees(1, pageSize, searchText, value);
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId, checked) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  // Handle mark attendance
  const handleMarkAttendance = () => {
    if (selectedEmployees.length === 0) {
      message.warning('Please select at least one employee');
      return;
    }
    setTimeModalVisible(true);
  };

  // Submit attendance
  const handleSubmitAttendance = async () => {
    if (!checkInTime) {
      message.error('Please select check-in time');
      return;
    }

    setLoading(true);
    
    try {
      const dateKey = selectedDate.format('YYYY-MM-DD');
      const attendanceRecords = selectedEmployees.map(employeeId => {
        let totalHours = null;
        let checkOutValue = null;
        
        if (checkInTime && checkOutTime && checkOutTime.isAfter(checkInTime)) {
          totalHours = checkOutTime.diff(checkInTime, 'hours', true);
          checkOutValue = checkOutTime.format('HH:mm:ss');
        }
        
        return {
          user_id: employeeId,
          date: dateKey,
          check_in: checkInTime.format('HH:mm:ss'),
          check_out: checkOutValue,
          total_hours: totalHours,
          is_present: true
        };
      });

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { onConflict: 'user_id,date' });

      if (error) throw error;

      await fetchAttendanceData(
        selectedDate.startOf('month').format('YYYY-MM-DD'),
        selectedDate.endOf('month').format('YYYY-MM-DD')
      );

      setTimeModalVisible(false);
      setSelectedEmployees([]);
      setCheckInTime(null);
      setCheckOutTime(null);
      
      message.success(`Attendance updated for ${selectedEmployees.length} employee(s)`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = (employee) => {
    // Enhanced validation
    if (!employee?.id) {
      console.error('Employee ID missing:', employee);
      message.error('Employee data not available');
      return;
    }

    // Check if data is still loading
    if (!isLoaded) {
      message.warning('Please wait for data to load completely');
      return;
    }

    // Ensure attendanceData exists and has content
    if (!attendanceData) {
      console.error('Attendance data is null/undefined');
      message.error('Attendance data not loaded. Please refresh the page.');
      return;
    }

    // Ensure leaveData is loaded (even if empty array)
    if (leaveData === null || leaveData === undefined) {
      console.error('Leave data not loaded');
      message.error('Leave data not loaded. Please refresh the page.');
      return;
    }

    const dateKey = selectedDate.format('YYYY-MM-DD');
    const attendance = attendanceData[dateKey]?.[employee.id];
      
    const employeeMonthlyData = {};
    Object.keys(attendanceData).forEach(date => {
      const month = dayjs(date).format('YYYY-MM');
      const employeeRecord = attendanceData[date][employee.id];
      
      const isOnLeave = leaveData.some(leave => 
          leave.user_id === employee.id &&
          dayjs(date).isBetween(dayjs(leave.start_date), dayjs(leave.end_date), 'day', '[]')
      );

      if (isOnLeave) {
        return;
      }

      if (employeeRecord) {
        if (!employeeMonthlyData[month]) {
          employeeMonthlyData[month] = { present: 0, absent: 0, missing: 0 };
        }
        
        if (employeeRecord.present) {
          if (employeeRecord.checkIn && !employeeRecord.checkOut) {
            employeeMonthlyData[month].missing++;
          } else {
            employeeMonthlyData[month].present++;
          }
        } else {
          employeeMonthlyData[month].absent++;
        }
      }
    });
    
    Modal.info({
      title: `${employee.name}'s Attendance Details`,
      width: 800,
      content: (
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              <Text strong>Status for {selectedDate.format('DD/MM/YYYY')}: </Text>
              <Tag color={attendance?.present ? 'success' : 'error'}>
                {attendance?.present ? 'Present' : 'Absent'}
              </Tag>
              {attendance?.present && (
                <div style={{ marginTop: 8 }}>
                  <Text strong>Hours: </Text>
                  <Text>{attendance.totalHours?.toFixed(1) || 0}h</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Location: </Text>
                    <Tag color={attendance.location_coordinates ? 'orange' : 'green'}>
                      {attendance.location_coordinates ? 'Out of Office' : 'In Office'}
                    </Tag>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Monthly Summary">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic 
                    title="Days Present" 
                    value={employeeMonthlyData[selectedDate.format('YYYY-MM')]?.present || 0} 
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Days Absent" 
                    value={employeeMonthlyData[selectedDate.format('YYYY-MM')]?.absent || 0} 
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Days Missing" 
                    value={employeeMonthlyData[selectedDate.format('YYYY-MM')]?.missing || 0} 
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="Attendance Calendar">
              <Calendar
                fullscreen={false}
                value={selectedDate}
                dateFullCellRender={(date) => {
                  const dayKey = date.format('YYYY-MM-DD');
                  const dayAttendance = attendanceData[dayKey]?.[employee.id];
                  const isToday = date.isSame(dayjs(), 'day');

                  const approvedLeave = leaveData.find(leave =>
                    leave.user_id === employee.id &&
                    date.isBetween(dayjs(leave.start_date), dayjs(leave.end_date), 'day', '[]')
                  );

                  let cellStyle = {
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: isToday ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    color: 'black'
                  };
                  
                  if (approvedLeave) {
                    cellStyle.backgroundColor = '#e6f7ff';
                    cellStyle.color = '#1890ff';
                    cellStyle.border = `1px solid #91d5ff`;
                  } 
                  else if (dayAttendance?.present) {
                    if (dayAttendance.checkIn && !dayAttendance.checkOut) {
                      cellStyle.backgroundColor = '#fffbe6';
                      cellStyle.color = '#faad14';
                    } else {
                      cellStyle.backgroundColor = '#f6ffed';
                      cellStyle.color = '#52c41a';
                    }
                  } else if (dayAttendance && !dayAttendance.present) {
                    cellStyle.backgroundColor = '#fff1f0';
                    cellStyle.color = '#ff4d4f';
                  } else if (isToday) {
                    cellStyle.backgroundColor = '#e6f7ff';
                    cellStyle.color = '#1890ff';
                  }
                  
                  return (
                    <div style={cellStyle}>
                      {date.date()}
                    </div>
                  );
                }}
              />
            </Card>
          </Space>
        </div>
      ),
    });
  };

  // Update times for existing attendance
  const handleUpdateTimes = (employee) => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const attendance = attendanceData[dateKey]?.[employee.id];
    
    setSelectedEmployees([employee.id]);
    setCheckInTime(attendance?.checkIn ? dayjs(`${dateKey} ${attendance.checkIn}`) : null);
    setCheckOutTime(attendance?.checkOut ? dayjs(`${dateKey} ${attendance.checkOut}`) : null);
    setTimeModalVisible(true);
  };

  const calculateTotalStats = () => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const dayData = attendanceData[dateKey] || {};

    const totalEmpCount = totalEmployeeCount || 0;
    let presentCount = 0;
    let missingCount = 0;

    const totalOnLeaveCount = onLeaveCount;

    Object.keys(dayData).forEach(userId => {
      const record = dayData[userId];
      
      if (record.present) {
        const isUserOnLeave = leaveData.some(leave =>
          leave.user_id === userId &&
          selectedDate.isBetween(dayjs(leave.start_date), dayjs(leave.end_date), 'day', '[]')
        );

        if (!isUserOnLeave) {
          if (record.checkIn && !record.checkOut) {
            missingCount++;
          } else {
            presentCount++;
          }
        }
      }
    });

    const absentCount = totalEmpCount - presentCount - missingCount - totalOnLeaveCount;

    return {
      present: presentCount,
      absent: Math.max(0, absentCount),
      missing: missingCount,
      onLeave: totalOnLeaveCount,
      total: totalEmpCount
    };
  };

  // Fetch employees on component mount and when filters change
  useEffect(() => {
    fetchEmployees(currentPage, pageSize, searchText, filterType);
    fetchOnLeaveCount(selectedDate, searchText, filterType);
    
    const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
    fetchAttendanceData(startDate, endDate);
  }, [currentPage, pageSize, searchText, filterType]);

  // Enhanced data loading useEffect
  useEffect(() => {
    const startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
    const endDate = selectedDate.endOf('month').format('YYYY-MM-DD');
    
    setIsLoaded(false);
    
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchAttendanceData(startDate, endDate),
          fetchLeaveData(selectedDate),
          fetchOnLeaveCount(selectedDate, searchText, filterType)
        ]);
        
        // Small delay to ensure state updates complete
        setTimeout(() => {
          setIsLoaded(true);
        }, 200);
        
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('Failed to load data');
        setIsLoaded(false);
      }
    };

    loadAllData();
  }, [selectedDate, searchText, filterType]);

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate monthly statistics
  useEffect(() => {
    const monthly = {};
    Object.keys(attendanceData).forEach(date => {
      const month = dayjs(date).format('YYYY-MM');
      if (!monthly[month]) {
        monthly[month] = { present: 0, absent: 0, missing: 0, totalDays: 0 };
      }
      
      Object.values(attendanceData[date]).forEach(record => {
        monthly[month].totalDays++;
        if (record.present) {
          if (record.checkIn && !record.checkOut) {
            monthly[month].missing++;
          } else {
            monthly[month].present++;
          }
        } else {
          monthly[month].absent++;
        }
      });
    });
    setMonthlyData(monthly);
  }, [attendanceData]);

  const filteredEmployees = employeesData;
  const totalStats = calculateTotalStats();

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

  // Employee view (simplified)
  if (!['superadmin', 'admin', 'hr'].includes(userRole)) {
    const currentEmployee = currentUser ? employeesData.find(emp => emp.id === currentUser.id) : null; 
    
    if (!currentEmployee) {
      return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    const currentMonth = dayjs().format('YYYY-MM');
    const employeeMonthlyData = {};
    Object.keys(attendanceData).forEach(date => {
      const month = dayjs(date).format('YYYY-MM');
      if (month === currentMonth) {
        if (!employeeMonthlyData[month]) {
          employeeMonthlyData[month] = { present: 0, absent: 0, missing: 0, totalDays: 0 };
        }
        
        const attendance = attendanceData[date][currentEmployee.id];
        employeeMonthlyData[month].totalDays++;
        if (attendance?.present) {
          if (attendance.checkIn && !attendance.checkOut) {
            employeeMonthlyData[month].missing++;
          } else {
            employeeMonthlyData[month].present++;
          }
        } else {
          employeeMonthlyData[month].absent++;
        }
      }
    });

    const monthlyStats = employeeMonthlyData[currentMonth] || { present: 0, absent: 0, totalDays: 0 };
    
    return (
      <div style={{ padding: '24px', backgroundColor: 'transparent', ...animationStyles.container }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Card style={{ 
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            ...animationStyles.headerCard
          }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={2} style={{ margin: 0, color: '#0D7139' }}>
                  <DashboardOutlined style={{ marginRight: '12px' }} />
                  My Attendance
                </Title>
                <Text type="secondary">Welcome back, {currentEmployee.name}</Text>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={5}>
              <Card style={{ ...animationStyles.statsCard, borderRadius: '12px' }}>
                <Statistic
                  title="Days Present"
                  value={monthlyStats.present}
                  valueStyle={{ color: '#0D7139' }}
                  prefix={<CheckCircleOutlined />}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>This Month</Text>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card style={{ borderRadius: '12px', ...animationStyles.statsCard }}>
                <Statistic
                  title="Missing"
                  value={totalStats.missing}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                />
                <Progress 
                  percent={totalStats.total > 0 ? (totalStats.missing / totalStats.total) * 100 : 0}
                  strokeColor="#faad14"
                  showInfo={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Card style={{ ...animationStyles.statsCard, borderRadius: '12px' }}>
                <Statistic
                  title="Days Absent"
                  value={monthlyStats.absent}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<CloseCircleOutlined />}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>This Month</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Card style={{ ...animationStyles.statsCard, borderRadius: '12px' }}>
                <Statistic
                  title="Attendance Rate"
                  value={monthlyStats.totalDays > 0 ? (((monthlyStats.present + monthlyStats.missing) / monthlyStats.totalDays) * 100).toFixed(1) : 0}
                  valueStyle={{ color: '#0D7139' }}
                  suffix="%"
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>This Month</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Card style={{ ...animationStyles.statsCard, borderRadius: '12px' }}>
                <Statistic
                  title="Total Hours"
                  value={monthlyStats.present * 8}
                  valueStyle={{ color: '#0D7139' }}
                  suffix="h"
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>This Month</Text>
              </Card>
            </Col>
          </Row>

          <Card style={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            ...animationStyles.mainCard
          }}>
            <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
              <CalendarOutlined style={{ marginRight: '8px' }} />
              Attendance Calendar
            </Title>
            <Calendar
              fullscreen={false}
              dateCellRender={(date) => {
                const dateKey = date.format('YYYY-MM-DD');
                const attendance = attendanceData[dateKey]?.[currentEmployee?.id];
                
                if (attendance?.present) {
                  return <Badge status="success" />;
                } else if (date.isBefore(dayjs(), 'day')) {
                  return <Badge status="error" />;
                }
                return null;
              }}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Table columns
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: record.type === 'Full-time' ? '#0D7139' : '#52c41a' }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.employeeId}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Full-time' ? '#0D7139' : '#52c41a'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Work Location',
      key: 'work_location',
      render: (_, record) => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];

        if (!attendance?.present && !attendance?.checkIn) {
  return <Text type="secondary">-</Text>;
}

        const isOutOfOffice = attendance.location_coordinates;
        
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{isOutOfOffice ? <MapPinHouse /> : <Building />}</span>
              <Tag color={isOutOfOffice ? 'orange' : 'green'} style={{ margin: 0 }}>
                {isOutOfOffice ? 'Out of Office' : 'In Office'}
              </Tag>
            </div>
            {isOutOfOffice && attendance.reason && (
              <div style={{ 
                fontSize: '11px', 
                color: '#666',
                backgroundColor: '#fff7e6',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #ffd591',
                maxWidth: '220px',
                wordWrap: 'break-word'
              }}>
                {(() => {
                  try {
                    // Handle if reason is already an object (from JSONB) or string (needs parsing)
                    const reasons = typeof attendance.reason === 'string' 
                      ? JSON.parse(attendance.reason) 
                      : attendance.reason;
                      
                    return (
                      <div>
                        {reasons.check_in && (
                          <div style={{ marginBottom: '4px' }}>
                            <Text strong style={{ fontSize: '10px', color: '#d46b08' }}>Check-in: </Text>
                            <Text style={{ fontSize: '11px' }}>{reasons.check_in}</Text>
                          </div>
                        )}
                        {reasons.check_out && (
                          <div>
                            <Text strong style={{ fontSize: '10px', color: '#d46b08' }}>Check-out: </Text>
                            <Text style={{ fontSize: '11px' }}>{reasons.check_out}</Text>
                          </div>
                        )}
                      </div>
                    );
                  } catch (error) {
                    // Fallback for non-JSON format
                    return (
                      <div>
                        <Text strong style={{ fontSize: '10px', color: '#d46b08' }}>Reason: </Text>
                        <Text style={{ fontSize: '11px' }}>{attendance.reason}</Text>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];

        // Check for approved leave first
        const approvedLeave = leaveData.find(leave =>
          leave.user_id === record.id &&
          selectedDate.isBetween(dayjs(leave.start_date), dayjs(leave.end_date), 'day', '[]')
        );

        if (approvedLeave) {
          return (
            <Space>
              <Badge status="processing" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ color: '#1890ff' }}>On Leave</Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>({approvedLeave.leave_type})</Text>
              </div>
            </Space>
          );
        }

        if (attendance?.present || attendance?.checkIn) {
          // Check if employee checked in but not checked out (missing)
          if (attendance.checkIn && !attendance.checkOut) {
            return (
              <Space direction="vertical" size="small">
                <Space><Badge status="warning" /><Text style={{ color: '#faad14' }}>Missing</Text></Space>
                <div style={{ fontSize: '12px' }}><Text type="secondary">In: </Text><Text>{attendance.checkIn || '-'}</Text></div>
                <div style={{ fontSize: '12px' }}><Text type="secondary">Out: </Text><Text style={{ color: '#faad14' }}>Not checked out</Text></div>
              </Space>
            );
          } else {
            return (
              <Space direction="vertical" size="small">
                <Space><Badge status="success" /><Text style={{ color: '#52c41a' }}>Present</Text></Space>
                <div style={{ fontSize: '12px' }}><Text type="secondary">In: </Text><Text>{attendance.checkIn || '-'}</Text></div>
                <div style={{ fontSize: '12px' }}><Text type="secondary">Out: </Text><Text>{attendance.checkOut || '-'}</Text></div>
              </Space>
            );
          }
        } else {
          return (
            <Space>
              <Badge status="error" />
              <Text style={{ color: '#ff4d4f' }}>Absent</Text>
            </Space>
          );
        }
      },
    },
    {
      title: 'Hours',
      key: 'hours',
      render: (_, record) => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];
        
        if (attendance?.present && attendance.totalHours !== null) {
          let hours = 0;
          if (attendance.checkIn && attendance.checkOut) {
            const checkIn = dayjs(`${dateKey} ${attendance.checkIn}`);
            const checkOut = dayjs(`${dateKey} ${attendance.checkOut}`);
            hours = checkOut.diff(checkIn, 'hours', true);
          } else if (attendance.totalHours) {
            hours = attendance.totalHours;
          }
          
          const displayHours = Math.floor(hours);
          const displayMinutes = Math.round((hours - displayHours) * 60);
          const timeString = `${displayHours}:${String(displayMinutes).padStart(2, '0')}`;
          
          return (
            <div>
              <Text style={{ fontWeight: 600 }}>{timeString}</Text>
              {hours < 8 && (
                <div>
                  <Text type="danger" style={{ fontSize: '10px' }}>
                    Short by {Math.floor(8-hours)}:{String(Math.round(((8-hours) - Math.floor(8-hours)) * 60)).padStart(2, '0')}
                  </Text>
                </div>
              )}
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        // Safety checks
        if (!record?.id || !isLoaded) {
          return <Spin size="small" />;
        }
        
        // Check if essential data is loaded
        if (!attendanceData || leaveData === null || leaveData === undefined) {
          return <Spin size="small" />;
        }
        
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];
        
        return (
          <Space>
            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewAttendance(record)}
                disabled={loading}
              />
            </Tooltip>
            {(attendance?.present || attendance?.checkIn) && (

              <Tooltip title="Update Times">
                <Button
                  type="text"
                  size="small"
                  icon={<ClockCircleOutlined />}
                  onClick={() => handleUpdateTimes(record)}
                />
              </Tooltip>
            )}
            <Tooltip title="Mark Absent">
              <Button
                type="text"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleMarkIndividualAbsent(record)}
                style={{ color: '#ff4d4f' }}
              />
            </Tooltip>
            <Checkbox
              checked={selectedEmployees.includes(record.id)}
              onChange={(e) => handleEmployeeSelect(record.id, e.target.checked)}
            />
          </Space>
        );
      },
    },
  ];

  // HR/Admin view
  return (
    <div style={{ padding: '24px', backgroundColor: 'transparent', ...animationStyles.container }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ 
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          ...animationStyles.headerCard
        }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={2} style={{ margin: 0, color: '#0D7139' }}>
                <TeamOutlined style={{ marginRight: '12px' }} />
                Attendance Management
              </Title>
              <Text type="secondary">Track and manage employee attendance</Text>
            </Col>
            <Col>
              <Space size="middle">
                <Button icon={<DownloadOutlined />} type="default">
                  Export
                </Button>
                <Button icon={<PrinterOutlined />} type="default">
                  Print
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Tabs */}
        <Card style={{ 
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          ...animationStyles.headerCard
        }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Daily View" key="daily">
              {/* Date Selection and Stats */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={8}>
                  <Card style={{ borderRadius: '12px', ...animationStyles.statsCard }}>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={4} style={{ color: '#0D7139', marginBottom: '16px' }}>
                        <CalendarOutlined style={{ marginRight: '8px' }} />
                        Select Date
                      </Title>
                      <DatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        size="large"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={16}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Card style={{ borderRadius: '12px', ...animationStyles.statsCard }}>
                        <Statistic
                          title="Present"
                          value={totalStats.present}
                          valueStyle={{ color: '#0D7139' }}
                          prefix={<CheckCircleOutlined />}
                        />
                        <Progress 
                          percent={totalStats.total > 0 ? (totalStats.present / totalStats.total) * 100 : 0}
                          strokeColor="#0D7139"
                          showInfo={false}
                          size="small"
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card style={{ borderRadius: '12px', ...animationStyles.statsCard }}>
                        <Statistic
                          title="Absent"
                          value={totalStats.absent}
                          valueStyle={{ color: '#ff4d4f' }}
                          prefix={<CloseCircleOutlined />}
                        />
                        <Progress 
                          percent={totalStats.total > 0 ? (totalStats.absent / totalStats.total) * 100 : 0}
                          strokeColor="#ff4d4f"
                          showInfo={false}
                          size="small"
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card style={{ borderRadius: '12px', ...animationStyles.statsCard }}>
                        <Statistic
                          title="On Leave"
                          value={totalStats.onLeave}
                          valueStyle={{ color: '#1890ff' }}
                          prefix={<CalendarOutlined />}
                        />
                        <Progress
                          percent={totalStats.total > 0 ? (totalStats.onLeave / totalStats.total) * 100 : 0}
                          strokeColor="#1890ff"
                          showInfo={false}
                          size="small"
                        />
                      </Card>
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Controls */}
              <Card style={{ 
                marginBottom: '24px',
                borderRadius: '12px',
                ...animationStyles.statsCard
              }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} lg={6}>
                    <Space style={{ width: '100%' }}>
                      <FilterOutlined style={{ color: '#0D7139' }} />
                      <Select
                        value={filterType}
                        onChange={handleFilterChange}
                        style={{ width: '150px' }}
                        size="large"
                      >
                        <Option value="All">All Types</Option>
                        <Option value="Full-time">Full-time</Option>
                        <Option value="Intern">Internship</Option>
                        <Option value="Temporary">Temporary</Option>
                      </Select>
                    </Space>
                  </Col>
                  
                  <Col xs={24} sm={12} lg={6}>
                    <Search
                      placeholder="Search employees..."
                      allowClear
                      size="large"
                      value={searchText}
                      onSearch={handleSearch}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: '100%'}}
                      enterButton={
                        <Button 
                          style={{ 
                            backgroundColor: '#0D7139', 
                            borderColor: '#0D7139',
                            color: 'white'
                          }}
                        >
                          <SearchOutlined />
                        </Button>
                      }
                    />
                  </Col>
                  
                  <Col xs={24} sm={12} lg={6}>
                    <Button
                      type="default"
                      size="large"
                      onClick={handleMarkAbsent}
                      style={{  
                        background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        width: '100%',
                        color:"white"
                      }}
                    >
                      Mark Remaining as Absent
                    </Button>
                  </Col>
                  
                  <Col xs={24} sm={12} lg={6}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleMarkAttendance}
                      disabled={selectedEmployees.length === 0}
                      style={{
                        background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        width: '100%',
                        color:"white"
                      }}
                    >
                      Mark Attendance ({selectedEmployees.length})
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* Employee Table */}
              <Card style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                ...animationStyles.mainCard
              }}>
                <Table
                  columns={columns}
                  dataSource={filteredEmployees}
                  rowKey="id"
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalEmployees,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                      fetchEmployees(page, size, searchText, filterType);
                    },
                    onShowSizeChange: (current, size) => {
                      setCurrentPage(1);
                      setPageSize(size);
                      fetchEmployees(1, size, searchText, filterType);
                    },
                    itemRender: (current, type, originalElement) => {
                      if (type === 'page') {
                        return (
                          <a style={{ 
                            color: current === currentPage ? '#0D7139' : '#666',
                            backgroundColor: current === currentPage ? '#f6ffed' : 'white',
                            border: `1px solid ${current === currentPage ? '#0D7139' : '#d9d9d9'}`,
                            borderRadius: '6px',
                            fontWeight: current === currentPage ? 600 : 400
                          }}>
                            {current}
                          </a>
                        );
                      }
                      return originalElement;
                    }
                  }}
                  scroll={{ x: 800 }}
                  size="middle"
                />
              </Card>
            </TabPane>

            <TabPane tab="Monthly View" key="monthly">
              <Card style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                ...animationStyles.mainCard
              }}>
                <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
                  Monthly Statistics
                </Title>
                
                <Row gutter={[16, 16]}>
                  {Object.entries(monthlyData).map(([month, data]) => {
                    const attendanceRate = ((data.present / data.totalDays) * 100).toFixed(1);
                    return (
                      <Col xs={24} sm={12} md={8} key={month}>
                        <Card style={{ borderRadius: '12px' }}>
                          <Title level={5} style={{ color: '#0D7139' }}>
                            {dayjs(month).format('MMMM YYYY')}
                          </Title>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text>Present:</Text>
                              <Text style={{ color: '#0D7139', fontWeight: 600 }}>{data.present}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text>Missing:</Text>
                              <Text style={{ color: '#faad14', fontWeight: 600 }}>{data.missing}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text>Absent:</Text>
                              <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>{data.absent}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text>Rate:</Text>
                              <Text style={{ color: '#0D7139', fontWeight: 600 }}>{attendanceRate}%</Text>
                            </div>
                            <Progress 
                              percent={parseFloat(attendanceRate)}
                              strokeColor="#0D7139"
                              size="small"
                            />
                          </Space>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card>
            </TabPane>
          </Tabs>
        </Card>

        {/* Time Selection Modal */}
        <Modal
          title="Set Attendance Time"
          open={timeModalVisible}
          onCancel={() => setTimeModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setTimeModalVisible(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={loading}
              onClick={handleSubmitAttendance}
              style={{
                background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                border: 'none'
              }}
            >
              Mark Attendance
            </Button>,
          ]}
        >
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Check-in Time *</Text>
                  <TimePicker
                    value={checkInTime}
                    onChange={setCheckInTime}
                    format="HH:mm"
                    size="large"
                    style={{ width: '100%', marginTop: '8px' }}
                    placeholder="Select check-in time"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Check-out Time (Optional)</Text>
                  <TimePicker
                    value={checkOutTime}
                    onChange={setCheckOutTime}
                    format="HH:mm"
                    size="large"
                    style={{ width: '100%', marginTop: '8px' }}
                    placeholder="Select check-out time"
                  />
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Selected Employees ({selectedEmployees.length})</Text>
              <div style={{ 
                marginTop: '8px', 
                maxHeight: '200px', 
                overflowY: 'auto',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '8px'
              }}>
                {selectedEmployees.map(employeeId => {
                  const employee = employeesData.find(emp => emp.id === employeeId);
                  return (
                    <div key={employeeId} style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '8px',
                      padding: '4px 8px',
                      background: 'white',
                      borderRadius: '4px'
                    }}>
                      <Avatar 
                        size="small" 
                        icon={<UserOutlined />} 
                        style={{ 
                          backgroundColor: employee?.type === 'Full-time' ? '#0D7139' : '#52c41a',
                          marginRight: '8px'
                        }} 
                      />
                      <span style={{ fontSize: '14px' }}>{employee?.name}</span>
                      <Tag 
                        size="small" 
                        color={employee?.type === 'Full-time' ? '#0D7139' : '#52c41a'}
                        style={{ marginLeft: 'auto' }}
                      >
                        {employee?.type}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            </div>

            {checkInTime && checkOutTime && (
              <div style={{ 
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #0D7139'
              }}>
                <Text strong style={{ color: '#0D7139' }}>
                  Total Hours: {(() => {
                    const totalMinutes = checkOutTime.diff(checkInTime, 'minutes');
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${hours}:${String(minutes).padStart(2, '0')}`;
                  })()}
                </Text>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default EmployeeAttendancePage;