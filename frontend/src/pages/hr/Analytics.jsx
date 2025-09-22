import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Statistic,
  Progress,
  Select,
  DatePicker,
  Table,
  Tag,
  Avatar,
  Empty,
  Spin,
  Tooltip,
  Alert,
  Divider,
  Badge
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Analytics = ({ currentUserId, userRole = 'hr', leaveData = [] }) => {
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('thisMonth');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allLeaveBalances, setAllLeaveBalances] = useState([]);

  // Fetch additional data for analytics
 useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // Fetch employees data
        const { data: employeesData } = await supabase
          .from('users')
          .select('id, name, employee_id, department')
          .or('employee_id.like.MYAEMP%,employee_id.like.MYAINT%');
        
        setEmployees(employeesData || []);
        
        // Extract unique departments
        const uniqueDepartments = [...new Set(employeesData?.map(emp => emp.department).filter(Boolean))];
        setDepartments(uniqueDepartments);

        // --- NEW: Fetch all leave balances ---
        const { data: balancesData, error: balancesError } = await supabase
          .from('leave_balances')
          .select('*');

        if (balancesError) throw balancesError;
        setAllLeaveBalances(balancesData || []);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);
  useEffect(() => {
    console.log('Setting up real-time subscription for analytics balances...');

    const balanceChannel = supabase
      .channel('realtime-analytics-leave-balances')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'leave_balances',
        },
        (payload) => {
          console.log('Analytics Realtime: Balance change detected!', payload);

          // Use a functional update to safely modify the state
          setAllLeaveBalances((currentBalances) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'UPDATE') {
              // Find and replace the updated record
              return currentBalances.map((balance) =>
                balance.id === newRecord.id ? newRecord : balance
              );
            }
            
            if (eventType === 'INSERT') {
              // Add the new record to the list
              return [...currentBalances, newRecord];
            }

            if (eventType === 'DELETE') {
              // Filter out the deleted record
              return currentBalances.filter((balance) => balance.id !== oldRecord.id);
            }
            
            // If event type is not handled, return the current state
            return currentBalances;
          });
        }
      )
      .subscribe();

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      console.log('Cleaning up analytics balance subscription.');
      supabase.removeChannel(balanceChannel);
    };
  }, []);
  // Filter data based on selected criteria
  const filteredData = useMemo(() => {
    let filtered = [...leaveData];
    
    // Time range filtering
    let startDate, endDate;
    
    if (customDateRange && customDateRange.length === 2) {
      startDate = customDateRange[0];
      endDate = customDateRange[1];
    } else {
      const now = dayjs();
      switch (selectedTimeRange) {
        case 'thisMonth':
          startDate = now.startOf('month');
          endDate = now.endOf('month');
          break;
        case 'lastMonth':
          startDate = now.subtract(1, 'month').startOf('month');
          endDate = now.subtract(1, 'month').endOf('month');
          break;
        case 'thisQuarter':
          startDate = now.startOf('quarter');
          endDate = now.endOf('quarter');
          break;
        case 'thisYear':
          startDate = now.startOf('year');
          endDate = now.endOf('year');
          break;
        default:
          return filtered;
      }
    }
    
    if (startDate && endDate) {
      filtered = filtered.filter(leave => {
        const leaveDate = dayjs(leave.start_date);
        return leaveDate.isBetween(startDate, endDate, 'day', '[]');
      });
    }
    
    // Department filtering
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(leave => leave.department === selectedDepartment);
    }
    
    return filtered;
  }, [leaveData, selectedTimeRange, selectedDepartment, customDateRange]);

  // Calculate key metrics
  const analytics = useMemo(() => {
    const total = filteredData.length;
    const approved = filteredData.filter(l => l.status === 'Approved').length;
    const pending = filteredData.filter(l => l.status === 'Pending').length;
    const rejected = filteredData.filter(l => l.status === 'Rejected').length;
    
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;
    
    // Leave type breakdown
    const leaveTypes = {};
    filteredData.forEach(leave => {
      leaveTypes[leave.leave_type] = (leaveTypes[leave.leave_type] || 0) + 1;
    });
    
    // Department breakdown
    const departmentStats = {};
    filteredData.forEach(leave => {
      const dept = leave.department || 'Unknown';
      departmentStats[dept] = (departmentStats[dept] || 0) + 1;
    });
    
    // Monthly trends
    const monthlyData = {};
    filteredData.forEach(leave => {
      const month = dayjs(leave.start_date).format('MMM YYYY');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      monthlyData[month].total++;
      monthlyData[month][leave.status.toLowerCase()]++;
    });
    
    // Top employees by leave count
  const employeeStats = {};
    filteredData.forEach(leave => {
      const empName = leave.users?.name || leave.employee_name;
      const empId = leave.users?.id; // <-- Get the user ID

      if (!empId) return; // Skip if no user ID is present

      if (!employeeStats[empName]) {
        employeeStats[empName] = {
          name: empName,
          userId: empId, // <-- STORE THE USER ID
          employeeId: leave.users?.employee_id || leave.employee_code,
          department: leave.department,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }
      employeeStats[empName].total++;
      employeeStats[empName][leave.status.toLowerCase()]++;
    });
    
    return {
      total,
      approved,
      pending,
      rejected,
      approvalRate: parseFloat(approvalRate),
      rejectionRate: parseFloat(rejectionRate),
      leaveTypes,
      departmentStats,
      monthlyTrends: Object.values(monthlyData).sort((a, b) => dayjs(a.month).unix() - dayjs(b.month).unix()),
      topEmployees: Object.values(employeeStats).sort((a, b) => b.total - a.total).slice(0, 10)
    };
  }, [filteredData]);

  // Chart colors
  const COLORS = ['#0D7139', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

  // Leave type configurations
  const getLeaveTypeConfig = (type) => {
    const configs = {
      'Permission': { color: '#1890ff', icon: <ClockCircleOutlined /> },
      'Casual Leave': { color: '#52c41a', icon: <CalendarOutlined /> },
      'Earned Leave': { color: '#0D7139', icon: <BankOutlined /> },
      'Medical Leave': { color: '#ff4d4f', icon: <MedicineBoxOutlined /> },
      'Maternity Leave': { color: '#eb2f96', icon: <HeartOutlined /> },
      'Compensatory Leave': { color: '#722ed1', icon: <ThunderboltOutlined /> },
      'On Duty': { color: '#13c2c2', icon: <TeamOutlined /> },
      'Excuses': { color: '#fa8c16', icon: <ExclamationCircleOutlined /> },
      'Overtime': { color: '#a0d911', icon: <ThunderboltOutlined /> },
    };
    return configs[type] || { color: '#666', icon: <CalendarOutlined /> };
  };

  // Prepare chart data
  const pieChartData = Object.entries(analytics.leaveTypes).map(([type, count], index) => ({
    name: type,
    value: count,
    color: COLORS[index % COLORS.length]
  }));

  const departmentChartData = Object.entries(analytics.departmentStats).map(([dept, count]) => ({
    department: dept,
    leaves: count,
    fill: COLORS[Object.keys(analytics.departmentStats).indexOf(dept) % COLORS.length]
  }));

  return (
    <div style={{ padding: '24px 0' }}>
      <Spin spinning={loading}>
        {/* Header with Filters */}
        <Card style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #f8fffe 0%, #e6f7ff 50%, #f0f9ff 100%)',
          border: '1px solid #e8f4fd',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(13, 113, 57, 0.08)'
        }}>
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space size={16}>
                <div style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                  borderRadius: '12px',
                  display: 'inline-flex'
                }}>
                  <BarChartOutlined style={{ fontSize: '24px', color: 'white' }} />
                </div>
                <div>
                  <Title level={2} style={{
                    margin: 0,
                    background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(20px, 4vw, 28px)',
                    fontWeight: 700
                  }}>
                    Leave Analytics
                  </Title>
                  <Text style={{ color: '#6b7280', fontSize: '14px' }}>
                    Comprehensive leave management insights and trends
                  </Text>
                </div>
              </Space>
            </Col>
            
            <Col xs={24} md={12}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <Select
                    value={selectedTimeRange}
                    onChange={(value) => {
                      setSelectedTimeRange(value);
                      if (value !== 'custom') setCustomDateRange(null);
                    }}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    <Option value="thisMonth">This Month</Option>
                    <Option value="lastMonth">Last Month</Option>
                    <Option value="thisQuarter">This Quarter</Option>
                    <Option value="thisYear">This Year</Option>
                    <Option value="custom">Custom Range</Option>
                  </Select>
                </Col>
                
                {selectedTimeRange === 'custom' && (
                  <Col xs={24} sm={12}>
                    <RangePicker
                      value={customDateRange}
                      onChange={setCustomDateRange}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Col>
                )}
                
                <Col xs={24} sm={selectedTimeRange === 'custom' ? 24 : 12}>
                  <Select
                    value={selectedDepartment}
                    onChange={setSelectedDepartment}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    <Option value="all">All Departments</Option>
                    {departments.map(dept => (
                      <Option key={dept} value={dept}>{dept}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Key Metrics Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
          <Col xs={12} sm={6} lg={6}>
            <Card style={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid rgba(13, 113, 57, 0.12)',
              boxShadow: '0 4px 20px rgba(13, 113, 57, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(13, 113, 57, 0.1)',
                borderRadius: '12px',
                display: 'inline-flex',
                marginBottom: '12px'
              }}>
                <CalendarOutlined style={{ fontSize: '24px', color: '#0D7139' }} />
              </div>
              <Statistic
                title="Total Applications"
                value={analytics.total}
                valueStyle={{ color: '#0D7139', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6} lg={6}>
            <Card style={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid rgba(82, 196, 26, 0.12)',
              boxShadow: '0 4px 20px rgba(82, 196, 26, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(82, 196, 26, 0.1)',
                borderRadius: '12px',
                display: 'inline-flex',
                marginBottom: '12px'
              }}>
                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              </div>
              <Statistic
                title="Approved"
                value={analytics.approved}
                suffix={
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    <Text type="success">{analytics.approvalRate}%</Text>
                  </div>
                }
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6} lg={6}>
            <Card style={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid rgba(250, 173, 20, 0.12)',
              boxShadow: '0 4px 20px rgba(250, 173, 20, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(250, 173, 20, 0.1)',
                borderRadius: '12px',
                display: 'inline-flex',
                marginBottom: '12px'
              }}>
                <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
              </div>
              <Statistic
                title="Pending"
                value={analytics.pending}
                valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6} lg={6}>
            <Card style={{
              borderRadius: '16px',
              background: 'white',
              border: '1px solid rgba(255, 77, 79, 0.12)',
              boxShadow: '0 4px 20px rgba(255, 77, 79, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(255, 77, 79, 0.1)',
                borderRadius: '12px',
                display: 'inline-flex',
                marginBottom: '12px'
              }}>
                <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
              </div>
              <Statistic
                title="Rejected"
                value={analytics.rejected}
                suffix={
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    <Text type="danger">{analytics.rejectionRate}%</Text>
                  </div>
                }
                valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          {/* Leave Types Distribution */}
          <Col xs={24} md={12}>
            <Card title={
              <Space>
                <PieChartOutlined style={{ color: '#0D7139' }} />
                <span>Leave Types Distribution</span>
              </Space>
            } style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data available" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              )}
            </Card>
          </Col>

          {/* Department-wise Statistics */}
          <Col xs={24} md={12}>
            <Card title={
              <Space>
                <BarChartOutlined style={{ color: '#0D7139' }} />
                <span>Department-wise Leaves</span>
              </Space>
            } style={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}>
              {departmentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="leaves" fill="#0D7139" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No data available" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              )}
            </Card>
          </Col>
        </Row>

        {/* Monthly Trends */}
        {analytics.monthlyTrends.length > 0 && (
          <Card title={
            <Space>
              <LineChartOutlined style={{ color: '#0D7139' }} />
              <span>Monthly Leave Trends</span>
            </Space>
          } style={{
            marginBottom: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
          }}>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="total" stackId="1" stroke="#0D7139" fill="#0D7139" fillOpacity={0.6} />
                <Area type="monotone" dataKey="approved" stackId="2" stroke="#52c41a" fill="#52c41a" fillOpacity={0.6} />
                <Area type="monotone" dataKey="pending" stackId="2" stroke="#faad14" fill="#faad14" fillOpacity={0.6} />
                <Area type="monotone" dataKey="rejected" stackId="2" stroke="#ff4d4f" fill="#ff4d4f" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Employees Table */}
        {analytics.topEmployees.length > 0 && (
          <Card title={
            <Space>
              <TeamOutlined style={{ color: '#0D7139' }} />
              <span>Top Leave Applicants</span>
            </Space>
          } style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
          }}>
            <Table
              dataSource={analytics.topEmployees}
              pagination={false}
              size="middle"
              rowKey="userId"
              columns={[
                {
                  title: 'Employee',
                  key: 'employee',
                  render: (_, record) => (
                    <Space>
                      <Avatar style={{ backgroundColor: '#0D7139' }}>
                        {record.name?.charAt(0)}
                      </Avatar>
                      <div>
                        <div style={{ fontWeight: 600 }}>{record.name}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {record.employeeId} • {record.department}
                        </Text>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Total Leaves',
                  dataIndex: 'total',
                  align: 'center',
                  render: (value) => (
                    <Tag color="#0D7139" style={{ fontWeight: 600 }}>{value}</Tag>
                  ),
                },
                {
                  title: 'Approved',
                  dataIndex: 'approved',
                  align: 'center',
                  render: (value) => (
                    <Badge count={value} style={{ backgroundColor: '#52c41a' }} />
                  ),
                },
                {
                  title: 'Pending',
                  dataIndex: 'pending',
                  align: 'center',
                  render: (value) => (
                    <Badge count={value} style={{ backgroundColor: '#faad14' }} />
                  ),
                },
                {
                  title: 'Rejected',
                  dataIndex: 'rejected',
                  align: 'center',
                  render: (value) => (
                    <Badge count={value} style={{ backgroundColor: '#ff4d4f' }} />
                  ),
                },
                {
                  title: 'Approval Rate',
                  key: 'approvalRate',
                  align: 'center',
                  render: (_, record) => {
                    const rate = record.total > 0 ? ((record.approved / record.total) * 100).toFixed(1) : 0;
                    return (
                      <div style={{ width: '80px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <Text strong style={{ color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f' }}>
                            {rate}%
                          </Text>
                        </div>
                        <Progress 
                          percent={parseFloat(rate)} 
                          size="small" 
                          showInfo={false}
                          strokeColor={rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f'}
                        />
                      </div>
                    );
                  },
                }
              ]}
               expandable={{
                expandedRowRender: (record) => {
                  const balance = allLeaveBalances.find(b => b.user_id === record.userId);
                  if (!balance) {
                    return <Text type="secondary">No detailed balance information available.</Text>;
                  }

                  const balanceDetails = [
                    { type: 'Casual Leave', used: balance.casual_used, remaining: balance.casual_remaining, total: balance.casual_total, color: '#52c41a'},
                    { type: 'Medical Leave', used: balance.medical_used, remaining: balance.medical_remaining, total: balance.medical_total, color: '#ff4d4f'},
                    { type: 'Earned Leave', used: balance.earned_used, remaining: balance.earned_remaining, total: balance.earned_total, color: '#0D7139' },
                    { type: 'Permission', used: balance.permission_used, remaining: balance.permission_remaining, total: balance.permission_total, color: '#1890ff'},
                    { type: 'Excuses', used: balance.excuses_used, remaining: balance.excuses_remaining, total: balance.excuses_total, color: '#fa8c16'},
                    { type: 'Compensatory', used: balance.compensatory_used, remaining: balance.compensatory_remaining, total: balance.compensatory_total, color: '#722ed1'},
                  ];
                  
                  return (
                    <Card size="small" style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                      <Title level={5} style={{ marginTop: 0, marginBottom: '16px' }}>{record.name}'s Leave Balance Summary</Title>
                      <Row gutter={[24, 16]}>
                        {balanceDetails.map(item => (
                           <Col xs={24} sm={12} md={8} key={item.type}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ color: item.color }}>{item.type}</Text>
                                <Tag color={item.color}>{`${item.remaining} / ${item.total}`}</Tag>
                            </div>
                            <Progress 
                                percent={item.total > 0 ? (item.used / item.total) * 100 : 0} 
                                size="small"
                                strokeColor={item.color}
                                format={() => `${item.used} Used`}
                            />
                           </Col>
                        ))}
                      </Row>
                    </Card>
                  );
                },
                rowExpandable: (record) => true,
              }}
            />
          </Card>
        )}
        {/* Summary Alert */}
        {analytics.total === 0 && (
          <Alert
            message="No Data Available"
            description="No leave applications found for the selected criteria. Try adjusting your filters to view analytics."
            type="info"
            showIcon
            style={{
              borderRadius: '12px',
              border: '1px solid #d1ecf1'
            }}
          />
        )}
      </Spin>
    </div>
  );
};

export default Analytics;