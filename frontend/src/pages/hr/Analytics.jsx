import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  DatePicker,
  Modal,
  Row,
  Col,
  Typography,
  Space,
  Select,
  Input,
  message,
  Progress,
  Empty,
  Spin,
  Form,
  Alert,
  Table,
  Statistic,
  Tag
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
   ExclamationCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabase/config';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    leavesByType: [],
    leavesByDepartment: [],
    leavesByStatus: [], // Added for status breakdown
    monthlyTrends: [],
    topUsers: [],
    rejectionAnalysis: [] // Added for rejection analysis
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, 'month'),
    dayjs()
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedDepartment]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('leave_applications')
        .select(`
          *,
          users:user_id (
            id,
            name,
            employee_id,
            email,
            employee_type,
            start_date
          )
        `)
        .gte('start_date', dateRange[0].format('YYYY-MM-DD'))
        .lte('end_date', dateRange[1].format('YYYY-MM-DD'));

      if (selectedDepartment !== 'all') {
        query = query.eq('department', selectedDepartment);
      }

      const { data: leaveData, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const processedData = processAnalyticsData(leaveData || []);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      message.error(`Failed to fetch leave applications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (data) => {
    if (!data || data.length === 0) {
      return {
        leavesByType: [],
        leavesByDepartment: [],
        leavesByStatus: [],
        monthlyTrends: [],
        topUsers: [],
        rejectionAnalysis: []
      };
    }

    // Process leaves by type
    const leavesByType = {};
    data.forEach(leave => {
      const type = leave.leave_type || leave.leaveType || 'Unknown';
      leavesByType[type] = (leavesByType[type] || 0) + 1;
    });

    // Process leaves by status (NEW)
    const leavesByStatus = {};
    data.forEach(leave => {
      const status = leave.status || 'Unknown';
      leavesByStatus[status] = (leavesByStatus[status] || 0) + 1;
    });

    // Process leaves by department
    const leavesByDepartment = {};
    data.forEach(leave => {
      const dept = leave.department || 'Unknown';
      leavesByDepartment[dept] = (leavesByDepartment[dept] || 0) + 1;
    });

    // Process monthly trends with status breakdown
    const monthlyTrends = {};
    data.forEach(leave => {
      const month = dayjs(leave.start_date || leave.startDate).format('YYYY-MM');
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      monthlyTrends[month].total += 1;
      monthlyTrends[month][leave.status.toLowerCase()] = (monthlyTrends[month][leave.status.toLowerCase()] || 0) + 1;
    });

    // Process top users
    const userLeaves = {};
    data.forEach(leave => {
      const userId = leave.user_id;
      const userName = leave.users?.name || leave.employee_name || leave.employeeName || 'Unknown';
      if (!userLeaves[userId]) {
        userLeaves[userId] = {
          name: userName,
          department: leave.department,
          count: 0,
          days: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        };
      }
      userLeaves[userId].count += 1;
      const totalDays = leave.total_days || leave.totalDays || 0;
      userLeaves[userId].days += totalDays;
      userLeaves[userId][leave.status.toLowerCase()] = (userLeaves[userId][leave.status.toLowerCase()] || 0) + 1;
    });

    // Process rejection analysis (NEW)
    const rejectedLeaves = data.filter(leave => leave.status === 'Rejected');
    const rejectionAnalysis = {};
    
    // Rejection by type
    rejectedLeaves.forEach(leave => {
      const type = leave.leave_type || leave.leaveType || 'Unknown';
      if (!rejectionAnalysis[type]) {
        rejectionAnalysis[type] = {
          type,
          rejectedCount: 0,
          totalCount: 0,
          rejectionRate: 0,
          reasons: {}
        };
      }
      rejectionAnalysis[type].rejectedCount += 1;
      
      // Count rejection reasons
      const reason = leave.rejection_reason || 'No reason provided';
      rejectionAnalysis[type].reasons[reason] = (rejectionAnalysis[type].reasons[reason] || 0) + 1;
    });

    // Calculate total count and rejection rate for each type
    Object.keys(rejectionAnalysis).forEach(type => {
      const totalOfType = data.filter(leave => (leave.leave_type || leave.leaveType) === type).length;
      rejectionAnalysis[type].totalCount = totalOfType;
      rejectionAnalysis[type].rejectionRate = ((rejectionAnalysis[type].rejectedCount / totalOfType) * 100).toFixed(1);
    });

    return {
      leavesByType: Object.entries(leavesByType).map(([type, count]) => ({
        type,
        count,
        percentage: ((count / data.length) * 100).toFixed(1)
      })),
      leavesByStatus: Object.entries(leavesByStatus).map(([status, count]) => ({
        status,
        count,
        percentage: ((count / data.length) * 100).toFixed(1)
      })),
      leavesByDepartment: Object.entries(leavesByDepartment).map(([dept, count]) => ({
        department: dept,
        count,
        percentage: ((count / data.length) * 100).toFixed(1)
      })),
      monthlyTrends: Object.entries(monthlyTrends)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => ({
          month,
          monthName: dayjs(month).format('MMM YYYY'),
          ...stats
        })),
      topUsers: Object.values(userLeaves)
        .sort((a, b) => b.days - a.days)
        .slice(0, 10),
      rejectionAnalysis: Object.values(rejectionAnalysis)
        .sort((a, b) => parseFloat(b.rejectionRate) - parseFloat(a.rejectionRate))
    };
  };

  // Enhanced table columns with status information
  const leaveTypeColumns = [
    {
      title: 'Leave Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Progress 
            percent={parseFloat(percentage)} 
            size="small" 
            style={{ width: 100, marginRight: 8 }}
          />
          <span>{percentage}%</span>
        </div>
      )
    }
  ];

  // New status columns
  const statusColumns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'Approved' ? 'success' : 
                     status === 'Rejected' ? 'error' : 'warning';
        const icon = status === 'Approved' ? <CheckCircleOutlined /> :
                     status === 'Rejected' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
        return <Tag color={color} icon={icon}>{status}</Tag>;
      }
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Text strong>{count}</Text>
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Progress 
            percent={parseFloat(percentage)} 
            size="small" 
            style={{ width: 100, marginRight: 8 }}
            strokeColor={
              percentage > 50 ? '#52c41a' : 
              percentage > 25 ? '#faad14' : '#ff4d4f'
            }
          />
          <span>{percentage}%</span>
        </div>
      )
    }
  ];

  // Rejection analysis columns
  const rejectionColumns = [
    {
      title: 'Leave Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="red">{type}</Tag>
    },
    {
      title: 'Total Requests',
      dataIndex: 'totalCount',
      key: 'totalCount'
    },
    {
      title: 'Rejected',
      dataIndex: 'rejectedCount',
      key: 'rejectedCount',
      render: (count) => <Text type="danger" strong>{count}</Text>
    },
    {
      title: 'Rejection Rate',
      dataIndex: 'rejectionRate',
      key: 'rejectionRate',
      render: (rate) => (
        <Progress 
          percent={parseFloat(rate)} 
          size="small"
          strokeColor="#ff4d4f"
          format={(percent) => `${percent}%`}
        />
      )
    }
  ];

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Leave Requests',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => `${percentage}%`
    }
  ];

  const topUsersColumns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag>{dept || 'Unknown'}</Tag>
    },
    {
      title: 'Total Requests',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: 'Approved',
      dataIndex: 'approved',
      key: 'approved',
      render: (count) => <Tag color="success">{count || 0}</Tag>
    },
    {
      title: 'Rejected',
      dataIndex: 'rejected',
      key: 'rejected',
      render: (count) => <Tag color="error">{count || 0}</Tag>
    },
    {
      title: 'Total Days',
      dataIndex: 'days',
      key: 'days',
      render: (days) => <Text strong>{days} days</Text>
    }
  ];

  // Calculate rejection statistics
  const totalRejected = analyticsData.leavesByStatus.find(item => item.status === 'Rejected')?.count || 0;
  const totalRequests = analyticsData.leavesByStatus.reduce((sum, item) => sum + item.count, 0);
  const rejectionRate = totalRequests > 0 ? ((totalRejected / totalRequests) * 100).toFixed(1) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>
          <BarChartOutlined /> Leave Analytics
        </Title>
        <Space>
          <Select
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            style={{ width: 150 }}
            placeholder="Select Department"
          >
            <Option value="all">All Departments</Option>
            <Option value="Engineering">Engineering</Option>
            <Option value="HR">HR</Option>
            <Option value="Marketing">Marketing</Option>
            <Option value="Sales">Sales</Option>
            <Option value="Finance">Finance</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 250 }}
          />
          <Button icon={<DownloadOutlined />}>Export Report</Button>
        </Space>
      </div>

      {/* Enhanced Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Leave Requests"
              value={totalRequests}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Rejected"
              value={totalRejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rejection Rate"
              value={rejectionRate}
              suffix="%"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: rejectionRate > 20 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Most Popular Leave Type"
              value={analyticsData.leavesByType[0]?.type || 'N/A'}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Rejection Alert */}
      {rejectionRate > 15 && (
        <Alert
          message="High Rejection Rate Detected"
          description={`Current rejection rate is ${rejectionRate}%. Consider reviewing leave policies or approval processes.`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Analytics Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Leave Status Breakdown" loading={loading}>
            <Table
              columns={statusColumns}
              dataSource={analyticsData.leavesByStatus}
              rowKey="status"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Leave Requests by Type" loading={loading}>
            <Table
              columns={leaveTypeColumns}
              dataSource={analyticsData.leavesByType}
              rowKey="type"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Leave Requests by Department" loading={loading}>
            <Table
              columns={departmentColumns}
              dataSource={analyticsData.leavesByDepartment}
              rowKey="department"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Rejection Analysis */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <StopOutlined style={{ color: '#ff4d4f' }} />
                <span>Rejection Analysis by Leave Type</span>
              </Space>
            } 
            loading={loading}
          >
            {analyticsData.rejectionAnalysis.length > 0 ? (
              <Table
                columns={rejectionColumns}
                dataSource={analyticsData.rejectionAnalysis}
                rowKey="type"
                pagination={false}
                expandable={{
                  expandedRowRender: (record) => {
                    const reasons = Object.entries(record.reasons);
                    return (
                      <div style={{ padding: '16px', background: '#fafafa' }}>
                        <Title level={5}>Common Rejection Reasons:</Title>
                        {reasons.map(([reason, count]) => (
                          <div key={reason} style={{ marginBottom: '8px' }}>
                            <Tag color="red">{count}</Tag>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    );
                  },
                  rowExpandable: (record) => Object.keys(record.reasons).length > 0,
                }}
              />
            ) : (
              <Empty description="No rejections found in the selected period" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Enhanced Top Users with Rejection Info */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Employee Leave Statistics" loading={loading}>
            <Table
              columns={topUsersColumns}
              dataSource={analyticsData.topUsers}
              rowKey="name"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Monthly Trends with Status Breakdown */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Monthly Leave Trends" loading={loading}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: '16px', minWidth: '800px', padding: '16px 0' }}>
                {analyticsData.monthlyTrends.map(trend => (
                  <div 
                    key={trend.month} 
                    style={{ 
                      flex: '0 0 150px',
                      textAlign: 'center',
                      padding: '16px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      background: '#fafafa'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      {trend.monthName}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                      {trend.total}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <div style={{ color: '#52c41a' }}>✓ {trend.approved || 0}</div>
                      <div style={{ color: '#ff4d4f' }}>✗ {trend.rejected || 0}</div>
                      <div style={{ color: '#faad14' }}>⏳ {trend.pending || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;