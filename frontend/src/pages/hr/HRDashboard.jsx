import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Tag, 
  Statistic, 
  Select, 
  Badge,
  Tooltip,
  Avatar,
  Popconfirm,
  message
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  NotificationOutlined,
  SunOutlined,
  CoffeeOutlined,
  ClockCircleFilled,
  MoonOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const HRDashboard = ({ 
  userRole,
  filteredLeaves, 
  employees, 
  loading, 
  filterStatus, 
  setFilterStatus, 
  filterEmployee, 
  setFilterEmployee,
  setLeaveHistoryDrawer,
  setExportModalVisible,
  handleLeaveAction,
  setSelectedLeave,
  setLeaveDetailsModal,
  getLeaveTypeConfig,
  isLoaded,
  animationStyles,
  currentUser
}) => {
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
  }, []);

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

  const getTableColumns = () => {
    const baseColumns = [
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
            {!isMobile && record.status === 'Approved' && record.approved_by && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  by {record.approved_by}
                </Text>
              </>
            )}
          </div>
        ),
        width: isMobile ? 50 : 120,
      },

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
                    onConfirm={() => handleLeaveAction(record.id, 'reject', 'Rejected by HR')}
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

  return (
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
              direction="horizontal"
              style={{ width: '100%', justifyContent: isMobile ? 'center' : 'flex-start' }}
            >
              <Avatar 
                size={isMobile ? 40 : 64}
                icon={<TeamOutlined />} 
                style={{ backgroundColor: '#0D7139' }}
              />
              <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                <Title 
                  level={isMobile ? 4 : 2}
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
        <div style={{ marginBottom: '20px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12}>
              <Title level={4} style={{ 
                margin: 0, 
                color: '#0D7139', 
                fontSize: 'clamp(16px, 4vw, 20px)',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <NotificationOutlined style={{ marginRight: '8px' }} />
                Leave Applications
              </Title>
            </Col>
            <Col xs={24} sm={12}>
              <Row gutter={[8, 8]} justify={isMobile ? 'center' : 'end'}>
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
            simple: isMobile,
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

      <style>{`
        .pending-row {
          background-color: #fff7e6 !important;
        }
        .ant-table-tbody > tr:hover.pending-row > td {
          background-color: #ffefd3 !important;
        }
        
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
    </div>
  );
};

export default HRDashboard;