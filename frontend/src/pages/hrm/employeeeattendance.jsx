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
  Empty,
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
  BarChartOutlined,
  SearchOutlined,
  FileExcelOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Dummy data for employees and interns
const employeesData = [
  {
    id: 1,
    name: 'Arjun Sharma',
    employeeId: 'EMP001',
    department: 'Engineering',
    position: 'Senior Frontend Developer',
    type: 'Employee',
    email: 'arjun.sharma@company.com',
    joinDate: '2023-01-15',
    avatar: null
  },
  {
    id: 2,
    name: 'Priya Patel',
    employeeId: 'EMP002',
    department: 'Design',
    position: 'UI/UX Designer',
    type: 'Employee',
    email: 'priya.patel@company.com',
    joinDate: '2023-02-20',
    avatar: null
  },
  {
    id: 3,
    name: 'Rahul Kumar',
    employeeId: 'INT001',
    department: 'Engineering',
    position: 'Frontend Developer Intern',
    type: 'Intern',
    email: 'rahul.kumar@company.com',
    joinDate: '2024-06-01',
    avatar: null
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    employeeId: 'INT002',
    department: 'Marketing',
    position: 'Digital Marketing Intern',
    type: 'Intern',
    email: 'sneha.reddy@company.com',
    joinDate: '2024-06-15',
    avatar: null
  },
  {
    id: 5,
    name: 'Vikram Singh',
    employeeId: 'EMP003',
    department: 'HR',
    position: 'HR Manager',
    type: 'Employee',
    email: 'vikram.singh@company.com',
    joinDate: '2022-11-10',
    avatar: null
  },
  {
    id: 6,
    name: 'Ananya Gupta',
    employeeId: 'INT003',
    department: 'Design',
    position: 'Graphic Design Intern',
    type: 'Intern',
    email: 'ananya.gupta@company.com',
    joinDate: '2024-07-01',
    avatar: null
  }
];

// Generate dummy attendance data
const generateAttendanceData = () => {
  const attendanceData = {};
  const currentDate = dayjs();
  
  // Generate data for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = currentDate.subtract(i, 'day').format('YYYY-MM-DD');
    attendanceData[date] = {};
    
    employeesData.forEach(employee => {
      const isPresent = Math.random() > 0.1; // 90% attendance rate
      const checkInTime = isPresent ? dayjs().hour(9).minute(Math.floor(Math.random() * 60)).second(0) : null;
      const checkOutTime = isPresent ? dayjs().hour(17).minute(Math.floor(Math.random() * 60)).second(0) : null;
      
      attendanceData[date][employee.id] = {
        present: isPresent,
        checkIn: checkInTime ? checkInTime.format('HH:mm') : null,
        checkOut: checkOutTime ? checkOutTime.format('HH:mm') : null,
        totalHours: isPresent ? 8 + Math.random() * 2 : 0
      };
    });
  }
  
  return attendanceData;
};

const EmployeeAttendancePage = ({ userRole = 'hr' }) => { 
     const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendanceData, setAttendanceData] = useState(generateAttendanceData());
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

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
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

  // Filter employees based on type and search
  const filteredEmployees = employeesData.filter(employee => {
    const matchesType = filterType === 'All' || employee.type === filterType;
    const matchesSearch = employee.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchText.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Handle checkbox selection
  const handleEmployeeSelect = (employeeId, checked) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  // Handle bulk attendance marking
  const handleMarkAttendance = () => {
    if (selectedEmployees.length === 0) {
      message.warning('Please select at least one employee');
      return;
    }
    setTimeModalVisible(true);
  };

  // Submit attendance
  const handleSubmitAttendance = () => {
    if (!checkInTime) {
      message.error('Please select check-in time');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const dateKey = selectedDate.format('YYYY-MM-DD');
      const newAttendanceData = { ...attendanceData };
      
      if (!newAttendanceData[dateKey]) {
        newAttendanceData[dateKey] = {};
      }

      selectedEmployees.forEach(employeeId => {
        const totalHours = checkOutTime && checkInTime 
          ? checkOutTime.diff(checkInTime, 'hours', true) 
          : 8;

        newAttendanceData[dateKey][employeeId] = {
          present: true,
          checkIn: checkInTime.format('HH:mm'),
          checkOut: checkOutTime ? checkOutTime.format('HH:mm') : null,
          totalHours: totalHours
        };
      });

      setAttendanceData(newAttendanceData);
      setTimeModalVisible(false);
      setSelectedEmployees([]);
      setCheckInTime(null);
      setCheckOutTime(null);
      setLoading(false);
      
      message.success(`Attendance marked for ${selectedEmployees.length} employee(s)`);
    }, 1000);
  };

  // Get attendance stats for selected date
  const getAttendanceStats = (date) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dayData = attendanceData[dateKey] || {};
    
    let present = 0, absent = 0, total = 0;
    
    filteredEmployees.forEach(employee => {
      total++;
      if (dayData[employee.id]?.present) {
        present++;
      } else {
        absent++;
      }
    });

    return { present, absent, total };
  };

  // Table columns for employee list
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: record.type === 'Employee' ? '#0D7139' : '#52c41a' }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.employeeId} • {record.department}
            </Text>
          </div>
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Employee' ? '#0D7139' : '#52c41a'}>
          {type}
        </Tag>
      ),
      responsive: ['sm', 'md', 'lg'],
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];
        
        if (attendance?.present) {
          return (
            <Space>
              <Badge status="success" />
              <Text style={{ color: '#52c41a' }}>Present</Text>
              {attendance.checkIn && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {attendance.checkIn}
                </Text>
              )}
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
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
    {
      title: 'Hours',
      key: 'hours',
      render: (_, record) => {
        const dateKey = selectedDate.format('YYYY-MM-DD');
        const attendance = attendanceData[dateKey]?.[record.id];
        
        if (attendance?.present && attendance.totalHours) {
          return (
            <Text>{attendance.totalHours.toFixed(1)}h</Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
      responsive: ['md', 'lg'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Checkbox
          checked={selectedEmployees.includes(record.id)}
          onChange={(e) => handleEmployeeSelect(record.id, e.target.checked)}
        />
      ),
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
  ];

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

  if (userRole === 'employee') {
    // Employee view - show their own attendance
    const currentEmployee = employeesData[0]; // Assuming first employee is logged in
    const currentMonth = dayjs().format('YYYY-MM');
    const employeeMonthlyData = monthlyData[currentMonth] || { present: 0, absent: 0, totalDays: 0 };
    
    return (
      <div style={{ padding: '24px', backgroundColor: 'transparent', ...animationStyles.container }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
                  <DashboardOutlined style={{ marginRight: '12px' }} />
                  My Attendance
                </Title>
                <Text type="secondary">Welcome back, {currentEmployee.name}</Text>
              </Col>
            </Row>
          </Card>

          {/* Employee Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ ...animationStyles.statsCard, borderRadius: '12px' }}>
                <Statistic
                  title="Days Present"
                  value={employeeMonthlyData.present / employeesData.length}
                  precision={0}
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
                  value={employeeMonthlyData.absent / employeesData.length}
                  precision={0}
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
                  value={((employeeMonthlyData.present / employeesData.length) / 22) * 100}
                  precision={1}
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
                  value={((employeeMonthlyData.present / employeesData.length) * 8)}
                  precision={1}
                  valueStyle={{ color: '#0D7139' }}
                  suffix="h"
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>This Month</Text>
              </Card>
            </Col>
          </Row>

          {/* Employee Calendar */}
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
                const attendance = attendanceData[dateKey]?.[currentEmployee.id];
                
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

  // HR/Admin view
  const stats = getAttendanceStats(selectedDate);

  return (
    
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
                          value={stats.present}
                          valueStyle={{ color: '#0D7139' }}
                          prefix={<CheckCircleOutlined />}
                        />
                        <Progress 
                          percent={stats.total > 0 ? (stats.present / stats.total) * 100 : 0}
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
                          value={stats.absent}
                          valueStyle={{ color: '#ff4d4f' }}
                          prefix={<CloseCircleOutlined />}
                        />
                        <Progress 
                          percent={stats.total > 0 ? (stats.absent / stats.total) * 100 : 0}
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
                          value={stats.total}
                          valueStyle={{ color: '#0D7139' }}
                          prefix={<TeamOutlined />}
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Attendance Rate: {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
                        </Text>
                      </Card>
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Filters and Actions */}
              <Card style={{ 
                marginBottom: '24px',
                borderRadius: '12px',
                ...animationStyles.statsCard
              }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={8}>
                    <Space style={{ width: '100%' }}>
                      <FilterOutlined style={{ color: '#0D7139' }} />
                      <Select
                        value={filterType}
                        onChange={setFilterType}
                        style={{ width: '150px' }}
                        size="large"
                      >
                        <Option value="All">All Types</Option>
                        <Option value="Employee">Employees</Option>
                        <Option value="Intern">Interns</Option>
                      </Select>
                    </Space>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Search
                      placeholder="Search employees..."
                      allowClear
                      size="large"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Row gutter={8} justify="end">
                      <Col>
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleMarkAttendance}
                          disabled={selectedEmployees.length === 0}
                          style={{
                            background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                            border: 'none',
                            borderRadius: '8px'
                          }}
                        >
                          Mark Attendance ({selectedEmployees.length})
                        </Button>
                      </Col>
                    </Row>
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
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
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
                  <BarChartOutlined style={{ marginRight: '8px' }} />
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
                          backgroundColor: employee?.type === 'Employee' ? '#0D7139' : '#52c41a',
                          marginRight: '8px'
                        }} 
                      />
                      <span style={{ fontSize: '14px' }}>{employee?.name}</span>
                      <Tag 
                        size="small" 
                        color={employee?.type === 'Employee' ? '#0D7139' : '#52c41a'}
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
    
  );
};

// Enhanced Employee Dashboard Component
const EmployeeDashboard = ({ employee }) => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [yearlyData, setYearlyData] = useState({});
  const [loading, setLoading] = useState(false);

  // Calculate yearly attendance data
  useEffect(() => {
    const yearly = {};
    const currentYear = dayjs().year();
    
    // Generate yearly data for current year
    for (let month = 0; month < 12; month++) {
      const monthKey = dayjs().year(currentYear).month(month).format('YYYY-MM');
      yearly[monthKey] = {
        present: Math.floor(Math.random() * 20) + 15, // 15-35 days
        absent: Math.floor(Math.random() * 5) + 1,    // 1-6 days
        totalDays: 22 // Average working days
      };
    }
    
    setYearlyData(yearly);
  }, []);

  // Get monthly attendance summary
  const getMonthlyAttendance = (month) => {
    const monthKey = month.format('YYYY-MM');
    return yearlyData[monthKey] || { present: 0, absent: 0, totalDays: 0 };
  };

  const monthlyData = getMonthlyAttendance(selectedMonth);
  const attendanceRate = monthlyData.totalDays > 0 ? 
    ((monthlyData.present / monthlyData.totalDays) * 100).toFixed(1) : 0;

  // Calculate yearly totals
  const yearlyTotals = Object.values(yearlyData).reduce(
    (acc, curr) => ({
      present: acc.present + curr.present,
      absent: acc.absent + curr.absent,
      totalDays: acc.totalDays + curr.totalDays
    }),
    { present: 0, absent: 0, totalDays: 0 }
  );

  const yearlyAttendanceRate = yearlyTotals.totalDays > 0 ? 
    ((yearlyTotals.present / yearlyTotals.totalDays) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: '24px', backgroundColor: 'transparent' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Employee Header */}
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
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: '#0D7139' }}
                />
                <div>
                  <Title level={2} style={{ margin: 0, color: '#0D7139' }}>
                    {employee.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    {employee.position} • {employee.department}
                  </Text>
                  <br />
                  <Tag color={employee.type === 'Employee' ? '#0D7139' : '#52c41a'}>
                    {employee.type}
                  </Tag>
                </div>
              </Space>
            </Col>
            <Col>
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary">Employee ID</Text>
                <br />
                <Text strong style={{ fontSize: '18px' }}>{employee.employeeId}</Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Monthly and Yearly Overview */}
        <Tabs defaultActiveKey="monthly" style={{ marginBottom: '24px' }}>
          <TabPane tab="Monthly View" key="monthly">
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                  <Title level={4} style={{ color: '#0D7139', marginBottom: '16px' }}>
                    Select Month
                  </Title>
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={16}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Card style={{ borderRadius: '12px' }}>
                      <Statistic
                        title="Days Present"
                        value={monthlyData.present}
                        valueStyle={{ color: '#0D7139' }}
                        prefix={<CheckCircleOutlined />}
                      />
                      <Progress 
                        percent={parseFloat(attendanceRate)}
                        strokeColor="#0D7139"
                        showInfo={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card style={{ borderRadius: '12px' }}>
                      <Statistic
                        title="Days Absent"
                        value={monthlyData.absent}
                        valueStyle={{ color: '#ff4d4f' }}
                        prefix={<CloseCircleOutlined />}
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Attendance Rate: {attendanceRate}%
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Monthly Calendar */}
            <Card style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
                <CalendarOutlined style={{ marginRight: '8px' }} />
                Monthly Attendance - {selectedMonth.format('MMMM YYYY')}
              </Title>
              <Calendar
                value={selectedMonth}
                validRange={[selectedMonth.startOf('month'), selectedMonth.endOf('month')]}
                dateCellRender={(date) => {
                  if (date.month() !== selectedMonth.month()) return null;
                  
                  // Random attendance for demo
                  const isPresent = Math.random() > 0.1;
                  const isWeekend = date.day() === 0 || date.day() === 6;
                  
                  if (isWeekend) return null;
                  
                  if (date.isAfter(dayjs())) return null;
                  
                  return (
                    <div style={{ textAlign: 'center' }}>
                      <Badge 
                        status={isPresent ? "success" : "error"} 
                        text={isPresent ? "P" : "A"}
                        style={{ fontSize: '10px' }}
                      />
                    </div>
                  );
                }}
              />
            </Card>
          </TabPane>

          <TabPane tab="Yearly View" key="yearly">
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={6}>
                <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                  <Statistic
                    title="Total Present"
                    value={yearlyTotals.present}
                    valueStyle={{ color: '#0D7139' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                  <Statistic
                    title="Total Absent"
                    value={yearlyTotals.absent}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                  <Statistic
                    title="Attendance Rate"
                    value={yearlyAttendanceRate}
                    valueStyle={{ color: '#0D7139' }}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                  <Statistic
                    title="Total Hours"
                    value={yearlyTotals.present * 8}
                    valueStyle={{ color: '#0D7139' }}
                    suffix="h"
                  />
                </Card>
              </Col>
            </Row>

            {/* Yearly Chart */}
            <Card style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <Title level={4} style={{ color: '#0D7139', marginBottom: '24px' }}>
                <BarChartOutlined style={{ marginRight: '8px' }} />
                Yearly Attendance Overview - {dayjs().year()}
              </Title>
              
              <Row gutter={[16, 16]}>
                {Object.entries(yearlyData).map(([month, data]) => {
                  const monthName = dayjs(month).format('MMM');
                  const rate = ((data.present / data.totalDays) * 100).toFixed(1);
                  
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={month}>
                      <Card size="small" style={{ borderRadius: '8px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <Text strong style={{ color: '#0D7139' }}>{monthName}</Text>
                          <div style={{ margin: '8px 0' }}>
                            <Progress 
                              type="circle" 
                              percent={parseFloat(rate)}
                              width={60}
                              strokeColor="#0D7139"
                              format={() => `${rate}%`}
                            />
                          </div>
                          <div style={{ fontSize: '12px' }}>
                            <Text type="secondary">
                              {data.present}P / {data.absent}A
                            </Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </TabPane>
        </Tabs>

        {/* Quick Actions */}
        <Card style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Title level={4} style={{ color: '#0D7139', marginBottom: '16px' }}>
            Quick Actions
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Button 
                type="primary" 
                size="large" 
                block
                style={{
                  background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '50px'
                }}
              >
                <ClockCircleOutlined /> Check In
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button 
                size="large" 
                block
                style={{
                  borderRadius: '8px',
                  height: '50px'
                }}
              >
                <FileExcelOutlined /> Download Report
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button 
                size="large" 
                block
                style={{
                  borderRadius: '8px',
                  height: '50px'
                }}
              >
                <EyeOutlined /> View Leaves
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button 
                size="large" 
                block
                style={{
                  borderRadius: '8px',
                  height: '50px'
                }}
              >
                <SearchOutlined /> Search Records
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [userRole, setUserRole] = useState('hr'); // 'hr' or 'employee'
  const [selectedEmployee] = useState(employeesData[0]); // For employee view

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Role Switcher for Demo */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000,
        background: 'white',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <Select
          value={userRole}
          onChange={setUserRole}
          style={{ width: '150px' }}
          size="small"
        >
          <Option value="hr">HR View</Option>
          <Option value="employee">Employee View</Option>
        </Select>
      </div>

      {userRole === 'hr' ? (
        <AttendanceManagement userRole={userRole} />
      ) : (
        <EmployeeDashboard employee={selectedEmployee} />
      )}
    </div>
  );
};

export default EmployeeAttendancePage;