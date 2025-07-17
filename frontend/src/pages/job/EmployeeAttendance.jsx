import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  message,
  Card,
  Space,
  Avatar,
  Typography,
  Row,
  Col,
  Tag,
  Input,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { supabase } from '../../supabase/config';
const { Title } = Typography;

const ImprovedAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [globalCheckInTime, setGlobalCheckInTime] = useState('');
  const [globalCheckOutTime, setGlobalCheckOutTime] = useState('');
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [editForm] = Form.useForm();
  
  // Standard work hours (9:00 AM to 6:00 PM)
  const STANDARD_CHECK_IN = '09:00';
  const STANDARD_CHECK_OUT = '18:00';

  // Mock employees data
  useEffect(() => {
  fetchEmployees();
  fetchAttendanceData();
}, []);

useEffect(() => {
  if (selectedDate) {
    fetchAttendanceData();
  }
}, [selectedDate]);
const fetchEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('employeeid, name, email')
      .eq('role', 'user')
      .eq('isactive', true)
      .order('name');

    if (error) throw error;
    console.log('Fetched employees:', data); // Add this line to debug
    setEmployees(data || []);
  } catch (error) {
    console.error('Error fetching employees:', error);
    message.error('Failed to fetch employees');
  }
};

const fetchAttendanceData = async () => {
  setLoading(true);
  try {
    const selectedDateStr = selectedDate.format('YYYY-MM-DD');
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', selectedDateStr);

    if (error) throw error;
    setAttendanceData(data || []);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    message.error('Failed to fetch attendance data');
  } finally {
    setLoading(false);
  }
};


//   useEffect(() => {
//     setEmployees(mockEmployees);
//     setAttendanceData(mockAttendanceData);
//   }, []);

  // Calculate late time
  const calculateLateTime = (checkInTime) => {
    if (!checkInTime) return null;
    
    const standardTime = moment(STANDARD_CHECK_IN, 'HH:mm');
    const actualTime = moment(checkInTime, 'HH:mm');
    
    if (actualTime.isAfter(standardTime)) {
      const diff = moment.duration(actualTime.diff(standardTime));
      return `${Math.floor(diff.asHours())}:${diff.minutes().toString().padStart(2, '0')}`;
    }
    return null;
  };

  // Calculate overtime
  const calculateOvertime = (checkOutTime) => {
    if (!checkOutTime) return null;
    
    const standardTime = moment(STANDARD_CHECK_OUT, 'HH:mm');
    const actualTime = moment(checkOutTime, 'HH:mm');
    
    if (actualTime.isAfter(standardTime)) {
      const diff = moment.duration(actualTime.diff(standardTime));
      return `${Math.floor(diff.asHours())}:${diff.minutes().toString().padStart(2, '0')}`;
    }
    return null;
  };

  // Get attendance record for specific employee and date
  const getAttendanceRecord = (employeeId, date) => {
  return attendanceData.find(record => 
  record.employeeid === employeeId && record.date === date  // Change employeeId to employeeid
);
};

  // Prepare table data combining employees with attendance
  const getTableData = () => {
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  return employees.map(employee => {
  const attendanceRecord = getAttendanceRecord(employee.employeeid, selectedDateStr);
  
  return {
    key: employee.employeeid,  // Make sure this matches
    ...employee,  // This spreads all employee properties including 'employeeid'
    attendance: attendanceRecord || {
      id: null,
      employeeid: employee.employeeid,
      date: selectedDateStr,
      checkIn: null,
      checkOut: null
    },
    lateTime: calculateLateTime(attendanceRecord?.checkIn),
    overtime: calculateOvertime(attendanceRecord?.checkOut)
  };
});
};

  const handleCheckIn = async (employee) => {
  const currentTime = moment().format('HH:mm');
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  
  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        employeeId: employee.employeeId,
        date: selectedDateStr,
        checkIn: currentTime,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'employeeId,date'
      })
      .select();

    if (error) throw error;
    
    // Update local state
    await fetchAttendanceData();
    message.success('Check-in recorded successfully');
  } catch (error) {
    console.error('Error recording check-in:', error);
    message.error('Failed to record check-in');
  }
};

  const handleCheckOut = async (employee) => {
  const currentTime = moment().format('HH:mm');
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  
  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        employeeId: employee.employeeId,
        date: selectedDateStr,
        checkOut: currentTime,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'employeeId,date'
      })
      .select();

    if (error) throw error;
    
    // Update local state
    await fetchAttendanceData();
    message.success('Check-out recorded successfully');
  } catch (error) {
    console.error('Error recording check-out:', error);
    message.error('Failed to record check-out');
  }
};
  const handleEdit = (record) => {
    setEditingRecord(record);
    setCurrentEmployee(record);
    editForm.setFieldsValue({
      checkIn: record.attendance.checkIn ? moment(record.attendance.checkIn, 'HH:mm') : null,
      checkOut: record.attendance.checkOut ? moment(record.attendance.checkOut, 'HH:mm') : null
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
  try {
    const checkInTime = values.checkIn ? values.checkIn.format('HH:mm') : null;
    const checkOutTime = values.checkOut ? values.checkOut.format('HH:mm') : null;
    const selectedDateStr = selectedDate.format('YYYY-MM-DD');
    
    const { error } = await supabase
      .from('attendance')
      .upsert({
        employeeId: editingRecord.employeeId,
        date: selectedDateStr,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'employeeId,date'
      });

    if (error) throw error;
    
    await fetchAttendanceData();
    message.success('Attendance updated successfully');
    setEditModalVisible(false);
    editForm.resetFields();
    setEditingRecord(null);
  } catch (error) {
    console.error('Error updating attendance:', error);
    message.error('Failed to update attendance');
  }
};

  const handleDelete = async (record) => {
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  
  try {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('employeeId', record.employeeId)
      .eq('date', selectedDateStr);

    if (error) throw error;
    
    await fetchAttendanceData();
    message.success('Attendance record deleted successfully');
  } catch (error) {
    console.error('Error deleting attendance:', error);
    message.error('Failed to delete attendance record');
  }
};

  const handleBulkAttendance = () => {
    setBulkModalVisible(true);
    setSelectedEmployees([]);
    bulkForm.resetFields();
  };

  const handleBulkSubmit = async (values) => {
  if (selectedEmployees.length === 0) {
    message.error('Please select at least one employee');
    return;
  }

  try {
    const checkInTime = values.checkIn ? values.checkIn.format('HH:mm') : null;
    const checkOutTime = values.checkOut ? values.checkOut.format('HH:mm') : null;
    const selectedDateStr = selectedDate.format('YYYY-MM-DD');
    
    const bulkData = selectedEmployees.map(employeeId => ({
      employeeId,
      date: selectedDateStr,
      ...(checkInTime && { checkIn: checkInTime }),
      ...(checkOutTime && { checkOut: checkOutTime }),
      updatedAt: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(bulkData, {
        onConflict: 'employeeId,date'
      });

    if (error) throw error;
    
    await fetchAttendanceData();
    message.success(`Bulk attendance applied to ${selectedEmployees.length} employees`);
    setBulkModalVisible(false);
    setSelectedEmployees([]);
    bulkForm.resetFields();
  } catch (error) {
    console.error('Error applying bulk attendance:', error);
    message.error('Failed to apply bulk attendance');
  }
};

  const tableData = getTableData();

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.employeeid}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Check In',
      key: 'checkIn',
      width: 120,
      align: 'center',
      render: (_, record) => {
  const checkInTime = record.attendance.checkIn;
  
  if (checkInTime) {
    const lateTime = calculateLateTime(checkInTime);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <ClockCircleOutlined style={{ color: lateTime ? '#ff4d4f' : '#52c41a' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: lateTime ? '#ff4d4f' : '#52c41a' }}>
            {checkInTime}
          </div>
          {lateTime && (
            <div style={{ fontSize: '10px', color: '#ff4d4f' }}>
              Late: {lateTime}
            </div>
          )}
        </div>
      </div>
    );
  }
        
        return (
          <Button
      type="primary"
      size="small"
      icon={<LoginOutlined />}
      onClick={() => handleCheckIn(record)}
      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
    >
      Check In
    </Button>
        );
      },
    },
    {
      title: 'Check Out',
      key: 'checkOut',
      width: 120,
      align: 'center',
      render: (_, record) => {
  const checkOutTime = record.attendance.checkOut;
  
  if (checkOutTime) {
    const overtime = calculateOvertime(checkOutTime);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <ClockCircleOutlined style={{ color: '#1890ff' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {checkOutTime}
          </div>
          {overtime && (
            <div style={{ fontSize: '10px', color: '#1890ff' }}>
              OT: {overtime}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <Button
      type="primary"
      size="small"
      icon={<LogoutOutlined />}
      onClick={() => handleCheckOut(record)}
      style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
    >
      Check Out
    </Button>
  );
},
    },
    {
      title: 'Late',
      key: 'late',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const lateTime = record.lateTime;
        if (lateTime) {
          return (
            <Tooltip title={`Late by ${lateTime}`}>
              <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                {lateTime}
              </Tag>
            </Tooltip>
          );
        }
        return <span style={{ color: '#666' }}>-</span>;
      },
    },
    {
      title: 'Overtime',
      key: 'overtime',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const overtime = record.overtime;
        if (overtime) {
          return (
            <Tooltip title={`Overtime: ${overtime}`}>
              <Tag color="blue" icon={<ClockCircleOutlined />}>
                {overtime}
              </Tag>
            </Tooltip>
          );
        }
        return <span style={{ color: '#666' }}>-</span>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const { checkIn, checkOut } = record.attendance;
        
        if (checkIn && checkOut) {
          return <Tag color="success">Complete</Tag>;
        } else if (checkIn) {
          return <Tag color="processing">Checked In</Tag>;
        } else {
          return <Tag color="default">Not Marked</Tag>;
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this attendance record?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="improved-attendance">
      <div className="attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Employee Attendance</Title>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            style={{ width: '200px' }}
            prefix={<CalendarOutlined />}
          />
          <Button 
            type="primary" 
            icon={<TeamOutlined />} 
            onClick={handleBulkAttendance}
            size="large"
          >
            Bulk Attendance
          </Button>
        </Space>
      </div>

      {/* Global Time Input Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                Standard Check In
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{STANDARD_CHECK_IN}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                Standard Check Out
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{STANDARD_CHECK_OUT}</div>
            </div>
          </Col>
          <Col span={6}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
                Check In Time
              </div>
              <TimePicker
  format="HH:mm"
  value={globalCheckInTime ? moment(globalCheckInTime, 'HH:mm') : null}
  onChange={(time) => setGlobalCheckInTime(time ? time.format('HH:mm') : '')}
  style={{ width: '100%' }}
  placeholder="Select time"
/>

            </div>
          </Col>
          <Col span={6}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                Check Out Time
              </div>
              <TimePicker
  format="HH:mm"
  value={globalCheckOutTime ? moment(globalCheckOutTime, 'HH:mm') : null}
  onChange={(time) => setGlobalCheckOutTime(time ? time.format('HH:mm') : '')}
  style={{ width: '100%' }}
  placeholder="Select time"
/>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Selected Date Info */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
            Selected Date
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {selectedDate.format('YYYY-MM-DD')}
          </div>
        </div>
      </Card>

      {/* Main Attendance Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          rowKey="key"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
          }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedEmployees,
            onChange: (selectedRowKeys) => {
              setSelectedEmployees(selectedRowKeys);
            },
            getCheckboxProps: (record) => ({
              name: record.name,
            }),
          }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Attendance"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 'bold' }}>{currentEmployee?.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>{currentEmployee?.employeeId}</div>
              </div>
            </Space>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="checkIn"
                label="Check In Time"
              >
                <TimePicker 
                  style={{ width: '100%' }} 
                  format="HH:mm"
                  placeholder="Select check in time"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="checkOut"
                label="Check Out Time"
              >
                <TimePicker 
                  style={{ width: '100%' }} 
                  format="HH:mm"
                  placeholder="Select check out time"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Attendance
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Attendance Modal */}
      <Modal
        title="Bulk Attendance"
        visible={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkSubmit}
        >
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '6px' }}>
            <Space>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 'bold' }}>
                Date: {selectedDate.format('YYYY-MM-DD')}
              </span>
            </Space>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="checkIn"
                label="Check In Time (Optional)"
              >
                <TimePicker 
                  style={{ width: '100%' }} 
                  format="HH:mm"
                  placeholder="Select check in time"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="checkOut"
                label="Check Out Time (Optional)"
              >
                <TimePicker 
                  style={{ width: '100%' }} 
                  format="HH:mm"
                  placeholder="Select check out time"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Selected Employees"
            style={{ marginBottom: '16px' }}
          >
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px', 
              padding: '12px',
              backgroundColor: '#fafafa'
            }}>
              {selectedEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Please select employees from the table above
                </div>
              ) : (
                selectedEmployees.map(employeeId => {
                  const employee = employees.find(emp => emp.employeeId === employeeId);
                  return (
                    <div key={employeeId} style={{ marginBottom: '8px' }}>
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{employee?.name}</div>
                          <div style={{ color: '#666', fontSize: '12px' }}>
                            {employee?.employeeId}
                          </div>
                        </div>
                      </Space>
                    </div>
                  );
                })
              )}
            </div>
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<CheckOutlined />}
                disabled={selectedEmployees.length === 0}
              >
                Apply to {selectedEmployees.length} Employee(s)
              </Button>
              <Button onClick={() => setBulkModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ImprovedAttendance;