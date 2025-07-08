import React, { useState, useEffect } from 'react';
import { Table, Card, Select, Input, Button, Space, Modal, Row, Col, Typography, message, Spin, Alert } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined, UserOutlined, ReloadOutlined, CalendarOutlined } from '@ant-design/icons';
import ErrorPage from '../../error/ErrorPage';
import { supabase } from '../../supabase/config';

const { Option } = Select;
const { Title, Text } = Typography;

const CampusJobApplyPage = ({ userRole }) => {
  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'hr') {
    return <ErrorPage errorType="403" />;
  }

  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Get unique job IDs and college names for filters
  const uniqueJobIds = [...new Set(applications.map(app => app.job_id))].filter(Boolean);
  const uniqueColleges = [...new Set(applications.map(app => app.college_name))].filter(Boolean);

  // Fetch all campus job applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campus_job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data.map(app => ({
        id: app.id,
        linkId: app.link_id,
        jobId: app.job_id,
        studentName: app.student_name,
        email: app.email,
        mobile: app.mobile,
        resumeUrl: app.resume_url,
        collegeName: app.college_name,
        appliedDate: app.created_at ? new Date(app.created_at).toISOString().split('T')[0] : '',
        appliedTime: app.created_at ? new Date(app.created_at).toLocaleString() : ''
      }));

      setApplications(transformedData);
      setFilteredApplications(transformedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      message.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...applications];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(app =>
        app.studentName?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.mobile?.includes(searchText) ||
        app.jobId?.toLowerCase().includes(searchText.toLowerCase()) ||
        app.collegeName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Job filter
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.jobId === jobFilter);
    }

    // College filter
    if (collegeFilter !== 'all') {
      filtered = filtered.filter(app => app.collegeName === collegeFilter);
    }

    setFilteredApplications(filtered);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, jobFilter, collegeFilter, applications]);

  // Table columns
  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 180,
      render: (name) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong>{name || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => (
        <Text >{email || 'N/A'}</Text>
      ),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 120,
      render: (mobile) => (
        <Text >{mobile || 'N/A'}</Text>
      ),
    },
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      width: 100,
      render: (jobId) => (
        <Text style={{ fontSize: '12px' }}>{jobId || 'N/A'}</Text>
      ),
    },
    {
      title: 'College',
      dataIndex: 'collegeName',
      key: 'collegeName',
      width: 200,
      render: (college) => (
        <Text style={{ fontSize: '12px' }}>{college || 'N/A'}</Text>
      ),
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      width: 120,
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: '12px' }}>
            {date ? new Date(date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }) : 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedApplication(record);
              setDetailsModalVisible(true);
            }}
          />
          {record.resumeUrl && (
            <Button 
              type="text" 
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => window.open(record.resumeUrl, '_blank')}
            />
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '100%',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          Campus Job Applications
        </Title>
        <Text type="secondary">
          View and manage campus recruitment applications
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Search</Text>
            </div>
            <Input
              placeholder="Search by name, email, mobile, job ID, or college"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Job ID</Text>
            </div>
            <Select
              value={jobFilter}
              onChange={setJobFilter}
              style={{ width: '100%' }}
              placeholder="Filter by Job ID"
            >
              <Option value="all">All Jobs</Option>
              {uniqueJobIds.map(jobId => (
                <Option key={jobId} value={jobId}>{jobId}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>College</Text>
            </div>
            <Select
              value={collegeFilter}
              onChange={setCollegeFilter}
              style={{ width: '100%' }}
              placeholder="Filter by College"
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">All Colleges</Option>
              {uniqueColleges.map(college => (
                <Option key={college} value={college}>{college}</Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Actions</Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchApplications}
                loading={loading}
              >
                Refresh
              </Button>
              <div>
                <Text strong>{filteredApplications.length}</Text>
                <Text type="secondary"> applications</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Show message if no applications found */}
      {applications.length === 0 && (
        <Alert
          message="No Campus Applications Found"
          description="No campus job applications have been submitted yet. Applications will appear here once students start applying."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Applications Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredApplications}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} applications`,
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>

      {/* Application Details Modal */}
      <Modal
        title={selectedApplication ? `${selectedApplication.studentName} - Application Details` : 'Application Details'}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          selectedApplication?.resumeUrl && (
            <Button 
              key="download" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => window.open(selectedApplication.resumeUrl, '_blank')}
            >
              Download Resume
            </Button>
          )
        ]}
        width={700}
      >
        {selectedApplication && (
          <div>
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Student Name:</Text>
                    <br />
                    <Text>{selectedApplication.studentName || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Email:</Text>
                    <br />
                    <Text copyable>{selectedApplication.email || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Mobile:</Text>
                    <br />
                    <Text copyable>{selectedApplication.mobile || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Job ID:</Text>
                    <br />
                    <Text>{selectedApplication.jobId || 'N/A'}</Text>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>College Name:</Text>
                    <br />
                    <Text>{selectedApplication.collegeName || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Link ID:</Text>
                    <br />
                    <Text>{selectedApplication.linkId || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Applied Date & Time:</Text>
                    <br />
                    <Text>{selectedApplication.appliedTime || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Resume:</Text>
                    <br />
                    {selectedApplication.resumeUrl ? (
                      <Button 
                        type="link" 
                        icon={<DownloadOutlined />}
                        onClick={() => window.open(selectedApplication.resumeUrl, '_blank')}
                      >
                        Download Resume
                      </Button>
                    ) : (
                      <Text type="secondary">No resume uploaded</Text>
                    )}
                  </div>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CampusJobApplyPage;