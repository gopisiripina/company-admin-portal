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
  RiseOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabase/config'; // ADD THIS IMPORT
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    leavesByType: [],
    leavesByDepartment: [],
    monthlyTrends: [],
    topUsers: []
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

  // Fixed fetch function with proper error handling
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Updated query to match your table structure
      let query = supabase
        .from('leave_applications') // Changed from 'leave_requests' to 'leave_applications'
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

      // Process data for analytics
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
        monthlyTrends: [],
        topUsers: []
      };
    }

    // Process leaves by type
    const leavesByType = {};
    data.forEach(leave => {
      const type = leave.leave_type || leave.leaveType || 'Unknown';
      leavesByType[type] = (leavesByType[type] || 0) + 1;
    });

    // Process leaves by department
    const leavesByDepartment = {};
    data.forEach(leave => {
      const dept = leave.department || 'Unknown';
      leavesByDepartment[dept] = (leavesByDepartment[dept] || 0) + 1;
    });

    // Process monthly trends
    const monthlyTrends = {};
    data.forEach(leave => {
      const month = dayjs(leave.start_date || leave.startDate).format('YYYY-MM');
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
    });

    // Process top users (most leaves taken)
    const userLeaves = {};
    data.forEach(leave => {
      const userId = leave.user_id;
      const userName = leave.users?.name || leave.employee_name || leave.employeeName || 'Unknown';
      if (!userLeaves[userId]) {
        userLeaves[userId] = {
          name: userName,
          department: leave.department,
          count: 0,
          days: 0
        };
      }
      userLeaves[userId].count += 1;
      const totalDays = leave.total_days || leave.totalDays || 0;
      userLeaves[userId].days += totalDays;
    });

    return {
      leavesByType: Object.entries(leavesByType).map(([type, count]) => ({
        type,
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
        .map(([month, count]) => ({
          month,
          count,
          monthName: dayjs(month).format('MMM YYYY')
        })),
      topUsers: Object.values(userLeaves)
        .sort((a, b) => b.days - a.days)
        .slice(0, 10)
    };
  };

  // Table column definitions
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
      title: 'Total Days',
      dataIndex: 'days',
      key: 'days',
      render: (days) => <Text strong>{days} days</Text>
    }
  ];

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

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Leave Requests"
              value={analyticsData.leavesByType.reduce((sum, item) => sum + item.count, 0)}
              prefix={<PieChartOutlined />}
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
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Requests/Month"
              value={Math.round(analyticsData.monthlyTrends.reduce((sum, item) => sum + item.count, 0) / Math.max(analyticsData.monthlyTrends.length, 1))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Peak Month"
              value={analyticsData.monthlyTrends.sort((a, b) => b.count - a.count)[0]?.monthName || 'N/A'}
            />
          </Card>
        </Col>
      </Row>

      {/* Analytics Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
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
        <Col xs={24} lg={12}>
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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Top Leave Users" loading={loading}>
            <Table
              columns={topUsersColumns}
              dataSource={analyticsData.topUsers}
              rowKey="name"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Export Report Modal Component (moved inside or export separately)
const ExportReportModal = ({ visible, onCancel, leaveData }) => {
  const [exportForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleExport = async (values) => {
    setLoading(true);
    try {
      const { month, year } = values;
      const startDate = dayjs(`${year}-${month + 1}-01`);
      const endDate = startDate.endOf('month');

      const filteredLeaves = leaveData.filter(leave => {
        const leaveDate = dayjs(leave.start_date || leave.startDate);
        return leaveDate.isAfter(startDate.subtract(1, 'day')) &&
               leaveDate.isBefore(endDate.add(1, 'day'));
      });

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
      title="Export Leave Report"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={exportForm} onFinish={handleExport}>
        <Form.Item
          name="month"
          label="Month"
          rules={[{ required: true, message: 'Please select month' }]}
        >
          <Select placeholder="Select Month">
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i} value={i}>
                {dayjs().month(i).format('MMMM')}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="year"
          label="Year"
          rules={[{ required: true, message: 'Please select year' }]}
        >
          <Select placeholder="Select Year">
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

        <Form.Item>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Export CSV
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Analytics;
