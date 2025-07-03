import React, { useState, useEffect } from 'react';
import {
  Table, Card, Select, Input, DatePicker, Button, Tag, Form, TimePicker, Space, Modal, Avatar, Badge, Row, Col, Typography, Divider, message, Drawer, Steps, Timeline, Tooltip, Radio, Rate, Popconfirm
} from 'antd';
import {
  SearchOutlined, EyeOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined, UserOutlined, FileTextOutlined, VideoCameraOutlined, ClockCircleOutlined, SendOutlined, PhoneOutlined, EnvironmentOutlined, DollarOutlined, HistoryOutlined, ReloadOutlined, StarOutlined, CommentOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
import { supabase } from '../../supabase/config';

// Fetch candidates with scheduled interviews
const fetchInterviewCandidates = async (jobId) => {
  let query = supabase
    .from('job_applications')
    .select('*');
    
  // Only filter by job_id if it's not 'all'
  if (jobId !== 'all') {
    query = query.eq('job_id', jobId);
  }
  
  const { data, error } = await query
    .in('status', ['shortlisted', 'technical', 'hr', 'reschedule'])
    .order('updated_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching interview candidates:', error);
    return [];
  }
  return data;
};

// Update candidate interview status
const updateCandidateStatus = async (candidateId, updateData) => {
  const { data, error } = await supabase
  .from('job_applications')
  .update({
    ...updateData,
    updated_at: new Date().toISOString()
  })
  .eq('id', candidateId)
  .select();
    
  if (error) {
    console.error('Error updating candidate status:', error);
    return { success: false, error };
  }
  return { success: true, data };
};

const InterviewManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [jobId, setJobId] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [interviewTypeFilter, setInterviewTypeFilter] = useState('all');
  
  // Modal states
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);

  // Load candidates
  useEffect(() => {
    const loadCandidates = async () => {
      setLoading(true);
      try {
        const data = await fetchInterviewCandidates(jobId);
        const transformedData = data.map(candidate => ({
          id: candidate.id,
          name: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone,
          jobTitle: candidate.job_title,
          status: candidate.status,
          interviewType: candidate.interview_type,
          interviewDate: candidate.interview_date,
          interviewTime: candidate.interview_time,
          interviewPlatform: candidate.interview_platform,
          interviewLink: candidate.interview_link,
          interviewStatus: candidate.interview_status,
          experience: candidate.experience_years,
          skills: candidate.skills ? candidate.skills.split(',') : [],
          location: candidate.location,
          expectedSalary: candidate.expected_salary,
          resumeUrl: candidate.resume_url,
          appliedAt: candidate.applied_at,
          // Add new fields for interview feedback
          technical_rating: candidate.technical_rating,
          communication_rating: candidate.communication_rating,
          interview_feedback: candidate.interview_feedback,
          interviewer_name: candidate.interviewer_name
        }));
        setCandidates(transformedData);
      } catch (error) {
        console.error('Error loading candidates:', error);
        message.error('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, [jobId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...candidates];

    if (searchText) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }

    if (interviewTypeFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.interviewType === interviewTypeFilter);
    }

    setFilteredCandidates(filtered);
  }, [searchText, statusFilter, interviewTypeFilter, candidates]);

  const handleInterviewAction = (candidate) => {
    setSelectedCandidate(candidate);
    setActionModalVisible(true);
  };

const handleActionSubmit = async (values) => {
  setLoading(true);
  try {
    const updateData = {
      interview_status: values.action === 'reschedule' ? 'rescheduled' : 'completed',
      technical_rating: values.technicalRating,
      communication_rating: values.communicationRating,
      interview_feedback: values.feedback,
      interviewer_name: values.interviewerName
    };

    // Determine new status based on action and current interview type
    let newStatus = selectedCandidate.status; // Keep current status by default

    if (values.action === 'cleared') {
      if (selectedCandidate.interviewType === 'technical') {
        // Technical cleared -> move to HR round but keep status as 'technical' 
        // until HR interview is scheduled
        newStatus = 'technical'; // Keep as technical, but mark interview as completed
      } else if (selectedCandidate.interviewType === 'hr') {
        // HR cleared -> final selection
        newStatus = 'selected';
      }
    } else if (values.action === 'rejected') {
      newStatus = 'rejected';
    } else if (values.action === 'reschedule') {
      newStatus = 'reschedule';
      updateData.interview_date = values.newDate?.format('YYYY-MM-DD');
      updateData.interview_time = values.newTime?.format('HH:mm');
    }

    updateData.status = newStatus;

    const result = await updateCandidateStatus(selectedCandidate.id, updateData);
    
    if (result.success) {
      // Update local state properly
      const updatedCandidates = candidates.map(candidate => {
        if (candidate.id === selectedCandidate.id) {
          return { 
            ...candidate, 
            status: newStatus,
            interviewStatus: updateData.interview_status,
            technical_rating: updateData.technical_rating,
            communication_rating: updateData.communication_rating,
            interview_feedback: updateData.interview_feedback,
            interviewer_name: updateData.interviewer_name,
            // Keep other interview details
            interviewDate: updateData.interview_date || candidate.interviewDate,
            interviewTime: updateData.interview_time || candidate.interviewTime
          };
        }
        return candidate;
      });
      
      setCandidates(updatedCandidates);
      
      setActionModalVisible(false);
      setSelectedCandidate(null);
      
      // Success message based on action
      const actionMessages = {
        cleared: selectedCandidate.interviewType === 'technical' ? 
          'Technical interview completed! Candidate ready for HR round.' : 'Candidate selected successfully!',
        rejected: 'Candidate status updated to rejected',
        reschedule: 'Interview rescheduled successfully!'
      };
      
      message.success(actionMessages[values.action]);
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    console.error('Error updating interview status:', error);
    message.error('Failed to update interview status');
  } finally {
    setLoading(false);
  }
};
const columns = [
  {
    title: 'Candidate',
    key: 'candidate',
    fixed: 'left',
    width: 200, // Reduced from 250
    render: (_, record) => (
      <Space>
        <Avatar size={32} icon={<UserOutlined />} /> {/* Reduced from 40 */}
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div> {/* Reduced font */}
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: '10px' }}>{record.jobTitle}</Text>
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Interview Details',
    key: 'interviewDetails',
    width: 160, // Reduced from 200
    render: (_, record) => (
      <div>
        <Tag 
          color={record.interviewType === 'technical' ? 'blue' : 'green'}
          style={{ fontSize: '10px' }} // Smaller tag
        >
          {record.interviewType?.toUpperCase()}
        </Tag>
        <div style={{ fontSize: '11px', marginTop: '2px' }}>
          <CalendarOutlined style={{ marginRight: '2px' }} />
          {new Date(record.interviewDate).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric' 
          })}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          <ClockCircleOutlined style={{ marginRight: '2px' }} />
          {record.interviewTime}
        </div>
        <div style={{ fontSize: '10px', color: '#1890ff', marginTop: '1px' }}>
          {record.interviewPlatform?.replace('_', ' ').toUpperCase()}
        </div>
      </div>
    ),
  },
  {
    title: 'Status',
    key: 'currentStatus',
    width: 110, // Reduced from 140
    render: (_, record) => {
      const getDetailedStatus = () => {
        if (record.status === 'selected') {
          return { text: 'Selected', color: 'purple' };
        }
        
        if (record.status === 'rejected') {
          return { text: 'Rejected', color: 'red' };
        }
        
        if (record.status === 'reschedule') {
          const roundType = record.interviewType === 'technical' ? 'Tech' : 'HR';
          return { text: `${roundType} Rescheduled`, color: 'orange' };
        }
        
        if (record.status === 'hr') {
          if (record.interviewStatus === 'completed') {
            return { text: 'HR Done', color: 'green' };
          } else if (record.interviewStatus === 'scheduled') {
            return { text: 'HR Scheduled', color: 'geekblue' };
          }
          return { text: 'HR Round', color: 'geekblue' };
        }
        
        if (record.status === 'technical') {
          if (record.interviewType === 'technical') {
            if (record.interviewStatus === 'completed') {
              return { text: 'Tech Done', color: 'green' };
            } else if (record.interviewStatus === 'scheduled') {
              return { text: 'Tech Scheduled', color: 'blue' };
            }
            return { text: 'Tech Round', color: 'blue' };
          } else if (record.interviewType === 'hr') {
            if (record.interviewStatus === 'completed') {
              return { text: 'HR Done', color: 'green' };
            } else if (record.interviewStatus === 'scheduled') {
              return { text: 'HR Scheduled', color: 'geekblue' };
            }
            return { text: 'HR Round', color: 'geekblue' };
          }
        }
        
        return { text: 'Pending', color: 'default' };
      };

      const statusInfo = getDetailedStatus();
      return (
        <Tag color={statusInfo.color} style={{ fontSize: '10px' }}>
          {statusInfo.text}
        </Tag>
      );
    },
  },
  {
    title: 'Interview Status',
    key: 'interviewStatus',
    width: 100, // Reduced from 130
    render: (_, record) => {
      const getInterviewStatus = () => {
        switch (record.interviewStatus) {
          case 'scheduled':
            return { text: 'Scheduled', color: 'blue', icon: <CalendarOutlined /> };
          case 'completed':
            return { text: 'Done', color: 'green', icon: <CheckCircleOutlined /> };
          case 'rescheduled':
            return { text: 'Rescheduled', color: 'orange', icon: <ClockCircleOutlined /> };
          case 'cancelled':
            return { text: 'Cancelled', color: 'red', icon: <CloseCircleOutlined /> };
          default:
            return { text: 'Pending', color: 'default', icon: <ClockCircleOutlined /> };
        }
      };

      const statusInfo = getInterviewStatus();
      return (
        <Tag 
          color={statusInfo.color} 
          icon={statusInfo.icon}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2px', 
            width: 'fit-content',
            fontSize: '10px'
          }}
        >
          {statusInfo.text}
        </Tag>
      );
    },
  },
  {
    title: 'Rating',
    key: 'rating',
    width: 90, // Reduced from 120
    render: (_, record) => (
      <div>
        {record.technical_rating && (
          <div>
            <Text style={{ fontSize: '10px' }}>Tech: </Text>
            <Rate disabled size="small" value={record.technical_rating} style={{ fontSize: '10px' }} />
          </div>
        )}
        {record.communication_rating && (
          <div>
            <Text style={{ fontSize: '10px' }}>Comm: </Text>
            <Rate disabled size="small" value={record.communication_rating} style={{ fontSize: '10px' }} />
          </div>
        )}
      </div>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120, // Reduced from 150
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="View Details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCandidate(record);
              setDetailsDrawerVisible(true);
            }}
          />
        </Tooltip>
        {record.interviewStatus === 'scheduled' && (
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleInterviewAction(record)}
            style={{ fontSize: '11px' }}
          >
            Update
          </Button>
        )}
      </Space>
    ),
  }
];

  return (
     <div style={{ padding: '16px', maxWidth: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          Interview Management
        </Title>
        <Text type="secondary">
          Manage candidate interviews and update their progress
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Search</Text>
            </div>
            <Input
              placeholder="Search by name or email"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Status</Text>
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="technical">Technical Round</Option>
              <Option value="hr">HR Round</Option>
              <Option value="reschedule">Rescheduled</Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>Interview Type</Text>
            </div>
            <Select
              value={interviewTypeFilter}
              onChange={setInterviewTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Types</Option>
              <Option value="technical">Technical</Option>
              <Option value="hr">HR</Option>
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: '8px', opacity: 0 }}>
              <Text>Action</Text>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
              title="Refresh Data"
            />
          </Col>
        </Row>
        
        <Divider style={{ margin: '16px 0 8px 0' }} />
        
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>{filteredCandidates.length}</Text>
              <Text type="secondary">candidates scheduled for interviews</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge count={filteredCandidates.filter(c => c.interviewStatus === 'scheduled').length} showZero>
                <Tag color="blue">Scheduled</Tag>
              </Badge>
              <Badge count={filteredCandidates.filter(c => c.interviewStatus === 'completed').length} showZero>
                <Tag color="green">Completed</Tag>
              </Badge>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Candidates Table */}
      <Card>
      <Table
        columns={columns}
        dataSource={filteredCandidates}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} candidates`,
        }}
        scroll={{ x: 800 }} // Reduced from 1200
        size="small" // Add this for more compact table
      />
    </Card>

      {/* Action Modal */}
      <Modal
        title={`Update Interview - ${selectedCandidate?.name}`}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedCandidate && (
          <Form
            layout="vertical"
            onFinish={handleActionSubmit}
            initialValues={{
              action: 'cleared',
              technicalRating: 3,
              communicationRating: 3
            }}
          >
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
              <Text strong>Interview Details:</Text>
              <div style={{ marginTop: '8px' }}>
                <Tag color="blue">{selectedCandidate.interviewType?.toUpperCase()}</Tag>
                <Text style={{ marginLeft: '8px' }}>
                  {new Date(selectedCandidate.interviewDate).toLocaleDateString()} at {selectedCandidate.interviewTime}
                </Text>
              </div>
            </div>

            <Form.Item
              label="Interview Result"
              name="action"
              rules={[{ required: true, message: 'Please select an action' }]}
            >
              <Radio.Group>
                <Radio.Button value="cleared">
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> Cleared
                </Radio.Button>
                <Radio.Button value="rejected">
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Rejected
                </Radio.Button>
                <Radio.Button value="reschedule">
                  <CalendarOutlined style={{ color: '#faad14' }} /> Reschedule
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.action !== currentValues.action}>
              {({ getFieldValue }) => {
                const action = getFieldValue('action');
                
                if (action === 'reschedule') {
                  return (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="New Interview Date"
                          name="newDate"
                          rules={[{ required: true, message: 'Please select new date' }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="New Interview Time"
                          name="newTime"
                          rules={[{ required: true, message: 'Please select new time' }]}
                        >
                          <TimePicker style={{ width: '100%' }} format="HH:mm" />
                        </Form.Item>
                      </Col>
                    </Row>
                  );
                }

                if (action === 'cleared' || action === 'rejected') {
                  return (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="Technical Rating"
                            name="technicalRating"
                            rules={[{ required: true, message: 'Please provide technical rating' }]}
                          >
                            <Rate />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Communication Rating"
                            name="communicationRating"
                            rules={[{ required: true, message: 'Please provide communication rating' }]}
                          >
                            <Rate />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item
                        label="Interviewer Name"
                        name="interviewerName"
                        rules={[{ required: true, message: 'Please enter interviewer name' }]}
                      >
                        <Input placeholder="Enter interviewer name" />
                      </Form.Item>
                    </>
                  );
                }
                
                return null;
              }}
            </Form.Item>

            <Form.Item
              label="Feedback/Comments"
              name="feedback"
              rules={[{ required: true, message: 'Please provide feedback' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Enter detailed feedback about the interview..."
              />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setActionModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Update Status
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Modal>

      {/* Details Drawer */}
      <Drawer
        title={`${selectedCandidate?.name} - Interview Details`}
        placement="right"
        open={detailsDrawerVisible}
        onClose={() => setDetailsDrawerVisible(false)}
        width={500}
      >
        {selectedCandidate && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <div style={{ marginTop: '12px' }}>
                <Title level={4} style={{ margin: 0 }}>{selectedCandidate.name}</Title>
                <Text type="secondary">{selectedCandidate.jobTitle}</Text>
              </div>
            </div>

            <Divider />

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Contact Information</Text>
                <div style={{ marginTop: '8px' }}>
                  <div><Text>Email: {selectedCandidate.email}</Text></div>
                  <div><Text>Phone: {selectedCandidate.phone}</Text></div>
                  <div><Text>Location: {selectedCandidate.location}</Text></div>
                </div>
              </div>

              <div>
                <Text strong>Interview Schedule</Text>
                <div style={{ marginTop: '8px' }}>
                  <div>
                    <Tag color="blue">{selectedCandidate.interviewType?.toUpperCase()}</Tag>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <CalendarOutlined /> {new Date(selectedCandidate.interviewDate).toLocaleDateString()}
                  </div>
                  <div>
                    <ClockCircleOutlined /> {selectedCandidate.interviewTime}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <Text>Platform: {selectedCandidate.interviewPlatform?.replace('_', ' ').toUpperCase()}</Text>
                  </div>
                </div>
              </div>

              {selectedCandidate.technical_rating && (
                <div>
                  <Text strong>Interview Ratings</Text>
                  <div style={{ marginTop: '8px' }}>
                    <div>
                      <Text>Technical: </Text>
                      <Rate disabled value={selectedCandidate.technical_rating} size="small" />
                    </div>
                    <div>
                      <Text>Communication: </Text>
                      <Rate disabled value={selectedCandidate.communication_rating} size="small" />
                    </div>
                  </div>
                </div>
              )}

              {selectedCandidate.interview_feedback && (
                <div>
                  <Text strong>Interview Feedback</Text>
                  <div style={{ marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <Text>{selectedCandidate.interview_feedback}</Text>
                  </div>
                  {selectedCandidate.interviewer_name && (
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary">
                        - {selectedCandidate.interviewer_name}
                      </Text>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Text strong>Skills</Text>
                <div style={{ marginTop: '8px' }}>
                  {selectedCandidate.skills.map(skill => (
                    <Tag key={skill} color="blue" style={{ marginBottom: '4px' }}>
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default InterviewManagement;