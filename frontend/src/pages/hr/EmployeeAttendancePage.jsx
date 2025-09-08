import React, { useState, useEffect } from 'react';
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
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';
import ErrorPage from '../../error/ErrorPage';
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

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
  const fetchAttendanceData = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
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
          totalHours: record.total_hours
        };
      });
      
      setAttendanceData(transformedData);
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
        selectedDate.endOf('month').format('YYYY-MM-DD')
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
        selectedDate.endOf('month').format('YYYY-MM-DD')
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
        let totalHours = 8;
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

  // View attendance details
  const handleViewAttendance = (employee) => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const attendance = attendanceData[dateKey]?.[employee.id];
    
    const employeeMonthlyData = {};
    Object.keys(attendanceData).forEach(date => {
      const month = dayjs(date).format('YYYY-MM');
      if (!employeeMonthlyData[month]) {
        employeeMonthlyData[month] = { present: 0, absent: 0 };
      }
      
      if (attendanceData[date][employee.id]?.present) {
        employeeMonthlyData[month].present++;
      } else {
        employeeMonthlyData[month].absent++;
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
              </Row>
            </Card>

            <Card title="Attendance Calendar">
              <Calendar
                fullscreen={false}
                value={selectedDate}
                dateCellRender={(date) => {
                  const dayKey = date.format('YYYY-MM-DD');
                  const dayAttendance = attendanceData[dayKey]?.[employee.id];
                  
                  if (dayAttendance?.present) {
                    return <Badge status="success" text="P" />;
                  } else if (date.isBefore(dayjs(), 'day') && dayAttendance) {
                    return <Badge status="error" text="A" />;
                  }
                  return null;
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

  // Calculate total statistics
  const calculateTotalStats = () => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const dayData = attendanceData[dateKey] || {};
    
    const totalEmpCount = totalEmployeeCount || 0;
    let presentCount = 0;
    
    Object.values(dayData).forEach(record => {
      if (record.present) {
        presentCount++;
      }
    });
    
    const absentCount = totalEmpCount - presentCount;
    
    return {
      present: presentCount,
      absent: absentCount,
      total: totalEmpCount
    };
  };

  // Fetch employees on component mount and when filters change
  useEffect(() => {
    fetchEmployees(currentPage, pageSize, searchText, filterType);
    
    const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
    fetchAttendanceData(startDate, endDate);
  }, [currentPage, pageSize, searchText, filterType]);

  // Fetch attendance data when date changes
  useEffect(() => {
    const startDate = selectedDate.startOf('month').format('YYYY-MM-DD');
    const endDate = selectedDate.endOf('month').format('YYYY-MM-DD');
    fetchAttendanceData(startDate, endDate);
  }, [selectedDate]);

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
        monthly[month] = { present: 0, absent: 0, totalDays: 0 };
      }
      
      Object.values(attendanceData[date]).forEach(record => {
        monthly[month].totalDays++;
        if (record.present) {
          monthly[month].present++;
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
          employeeMonthlyData[month] = { present: 0, absent: 0, totalDays: 0 };
        }
        
        const attendance = attendanceData[date][currentEmployee.id];
        employeeMonthlyData[month].totalDays++;
        if (attendance?.present) {
          employeeMonthlyData[month].present++;
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
            <Col xs={24} sm={12} md={6}>
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
            <Col xs={24} sm={12} md={6}>
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
            <Col xs={24} sm={12} md={6}>
              <Card style={{ ...animationStyles.statsCard, borderRadius: '12px' }}>
                <Statistic
                  title="Attendance Rate"
                  value={monthlyStats.totalDays > 0 ? ((monthlyStats.present / monthlyStats.totalDays) * 100).toFixed(1) : 0}
                  valueStyle={{ color: '#0D7139' }}
                  suffix="%"
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>This Month</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
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
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];
        
        if (attendance?.present) {
          return (
            <Space direction="vertical" size="small">
              <Space>
                <Badge status="success" />
                <Text style={{ color: '#52c41a' }}>Present</Text>
              </Space>
              <div style={{ fontSize: '12px' }}>
                <Text type="secondary">In: </Text>
                <Text>{attendance.checkIn || '-'}</Text>
              </div>
              <div style={{ fontSize: '12px' }}>
                <Text type="secondary">Out: </Text>
                <Text>{attendance.checkOut || '-'}</Text>
              </div>
            </Space>
          );
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
        
        if (attendance?.present) {
          let hours = 0;
          if (attendance.checkIn && attendance.checkOut) {
            const checkIn = dayjs(`${dateKey} ${attendance.checkIn}`);
            const checkOut = dayjs(`${dateKey} ${attendance.checkOut}`);
            hours = checkOut.diff(checkIn, 'hours', true);
          } else if (attendance.totalHours) {
            hours = attendance.totalHours;
          }
          
          return (
            <div>
              <Text style={{ fontWeight: 600 }}>{hours.toFixed(1)}h</Text>
              {hours < 8 && (
                <div>
                  <Text type="danger" style={{ fontSize: '10px' }}>
                    Short by {(8 - hours).toFixed(1)}h
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
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];
        const isToday = selectedDate.isSame(dayjs(), 'day');
        
        return (
          <Space>
            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewAttendance(record)}
              />
            </Tooltip>
            {attendance?.present && (
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
                    <Col xs={24} sm={8}>
                      <Card style={{ borderRadius: '12px', ...animationStyles.statsCard }}>
                        <Statistic
                          title="Total"
                          value={totalStats.total}
                          valueStyle={{ color: '#0D7139' }}
                          prefix={<TeamOutlined />}
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Attendance Rate: {totalStats.total > 0 ? ((totalStats.present / totalStats.total) * 100).toFixed(1) : 0}%
                        </Text>
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
                  Total Hours: {checkOutTime.diff(checkInTime, 'hours', true).toFixed(1)}h
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