import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Card,
  Calendar,
  Badge,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Select,
  Alert,
  List,
  Tag,
  Divider,
  Modal,
  Form,
  Input,
  DatePicker,
  Switch,
  TimePicker,
  Dropdown
} from 'antd';
import {
  BarChartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

export default function CalendarManagement() {
   const [selectedDate, setSelectedDate] = useState(dayjs());
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [disasterModalVisible, setDisasterModalVisible] = useState(false);
  const [holidayForm] = Form.useForm();
  const [eventForm] = Form.useForm();
  const [disasterForm] = Form.useForm();
  const [selectedTab, setSelectedTab] = useState('overview');
  const menuItems = [
    {
      key: 'overview',
      icon: <BarChartOutlined />,
      label: 'Overview',
    },
    {
      key: 'holidays',
      icon: <CalendarOutlined />,
      label: 'Holidays',
    },
    {
      key: 'working-days',
      icon: <ClockCircleOutlined />,
      label: 'Working Days',
    },
    {
      key: 'events',
      icon: <CalendarOutlined />,
      label: 'Events',
    },
    {
      key: 'emergency',
      icon: <ExclamationCircleOutlined />,
      label: 'Emergency',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const getListData = (value) => {
    let listData;
    switch (value.date()) {
      case 8:
        listData = [
          { type: 'warning', content: 'Weekend/Non-working Day' },
        ];
        break;
      case 10:
        listData = [
          { type: 'warning', content: 'Weekend/Non-working Day' },
        ];
        break;
      case 15:
        listData = [
          { type: 'success', content: 'Event/Meeting' },
        ];
        break;
      case 17:
        listData = [
          { type: 'error', content: 'Holiday' },
        ];
        break;
      case 23:
        listData = [
          { type: 'warning', content: 'Weekend/Non-working Day' },
        ];
        break;
      case 30:
        listData = [
          { type: 'warning', content: 'Weekend/Non-working Day' },
        ];
        break;
      default:
    }
    return listData || [];
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text="" />
          </li>
        ))}
      </ul>
    );
  };

  const onSelect = (newValue) => {
    setSelectedDate(newValue);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: 0, color: '#262626' }}>
            Calendar Management
          </Title>
          <Text type="secondary" style={{ marginLeft: 16 }}>
            Manage holidays, working days, events, and emergency planning
          </Text>
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        {/* Navigation Menu moved here */}
        <Card style={{ marginBottom: 24 }}>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedTab]}
            onClick={({ key }) => setSelectedTab(key)}
            style={{ 
              borderBottom: 'none',
              backgroundColor: 'transparent'
            }}
            items={menuItems}
          />
        </Card>

        {selectedTab === 'overview' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                <BarChartOutlined style={{ marginRight: 8 }} />
                August 2025 Summary
              </Title>
              <Text type="secondary">
                Overview of working days, holidays, events and working hours for this month
              </Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
              <Col span={4}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Statistic
                    title="Total Days"
                    value={31}
                    valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Statistic
                    title="Working Days"
                    value={21}
                    valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
                  <Statistic
                    title="Weekends/Offs"
                    value={10}
                    valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f5ff', border: '1px solid #91d5ff' }}>
                  <Statistic
                    title="Holidays"
                    value={0}
                    valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f9f0ff', border: '1px solid #d3adf7' }}>
                  <Statistic
                    title="Events"
                    value={0}
                    valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Statistic
                    title="Daily Hours"
                    value="8h 0m"
                    valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 32 }}>
              <Col span={4}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Statistic
                    title="Monthly Hours"
                    value="168h 0m"
                    valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Space>
                  <Text>Break Time:</Text>
                  <Text strong>1h 0m</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space>
                  <Text>Timezone:</Text>
                  <Text strong>UTC</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space>
                  <Text>Work Schedule:</Text>
                  <Text strong>-</Text>
                </Space>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={16}>
                <Card 
                  title="Calendar View" 
                  size="small"
                  extra={
                    <Space>
                      <Text type="secondary">Click on a date to view events</Text>
                    </Space>
                  }
                >
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Badge status="default" text="Today" />
                      <Badge status="processing" text="Holiday" />
                      <Badge status="success" text="Event/Meeting" />
                      <Badge status="warning" text="Weekend/Non-working Day" />
                    </Space>
                  </div>
                  <Calendar
                    fullscreen={false}
                    dateCellRender={dateCellRender}
                    onSelect={onSelect}
                    value={selectedDate}
                    headerRender={({ value, type, onChange, onTypeChange }) => {
                      const start = 0;
                      const end = 12;
                      const monthOptions = [];
                      
                      let current = value.clone();
                      const localeData = value.localeData();
                      const months = [];
                      for (let i = 0; i < 12; i++) {
                        current = current.month(i);
                        months.push(localeData.monthsShort(current));
                      }
                      
                      for (let i = start; i < end; i++) {
                        monthOptions.push(
                          <Option key={i} value={i}>
                            {months[i]}
                          </Option>,
                        );
                      }
                      
                      const year = value.year();
                      const month = value.month();
                      const options = [];
                      for (let i = year - 10; i < year + 10; i += 1) {
                        options.push(
                          <Option key={i} value={i}>
                            {i}
                          </Option>,
                        );
                      }
                      
                      return (
                        <div style={{ padding: 8 }}>
                          <Row gutter={8}>
                            <Col>
                              <Select
                                size="small"
                                dropdownMatchSelectWidth={false}
                                value={month}
                                onChange={(newMonth) => {
                                  const now = value.clone().month(newMonth);
                                  onChange(now);
                                }}
                              >
                                {monthOptions}
                              </Select>
                            </Col>
                            <Col>
                              <Select
                                size="small"
                                dropdownMatchSelectWidth={false}
                                value={year}
                                onChange={(newYear) => {
                                  const now = value.clone().year(newYear);
                                  onChange(now);
                                }}
                              >
                                {options}
                              </Select>
                            </Col>
                          </Row>
                        </div>
                      );
                    }}
                  />
                </Card>
              </Col>
              
              <Col span={8}>
                <Card title={`${selectedDate.format('MMM DD, YYYY')}`} size="small">
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">Today's events</Text>
                  </div>
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Text type="secondary">No events for this date</Text>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card 
              title="Upcoming Events" 
              size="small" 
              style={{ marginTop: 24 }}
              extra={<Text type="secondary">Next 5 upcoming events across all categories</Text>}
            >
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">No upcoming events</Text>
              </div>
            </Card>
          </div>
        )}

       {selectedTab === 'holidays' && (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Title level={4}>Holidays Management</Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={() => setHolidayModalVisible(true)}
      >
        Add Holiday
      </Button>
    </div>
    <Alert
      message="Holiday Management"
      description="Add, edit, or remove holiday dates for your organization."
      type="info"
      showIcon
      style={{ marginBottom: 24 }}
    />
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text type="secondary">No holidays configured. Click "Add Holiday" to get started.</Text>
      </div>
    </Card>

    {/* Add Holiday Modal */}
    <Modal
      title="Add New Holiday"
      open={holidayModalVisible}
      onCancel={() => {
        setHolidayModalVisible(false);
        holidayForm.resetFields();
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          setHolidayModalVisible(false);
          holidayForm.resetFields();
        }}>
          Cancel
        </Button>,
        <Button key="create" type="primary" onClick={() => {
          // Handle form submission here
          console.log('Holiday form submitted');
          setHolidayModalVisible(false);
          holidayForm.resetFields();
        }}>
          Create
        </Button>
      ]}
      width={600}
    >
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Create a new holiday entry
      </Text>
      
      <Form
        form={holidayForm}
        layout="vertical"
        initialValues={{
          startDate: dayjs(),
          type: 'National'
        }}
      >
        <Form.Item
          name="holidayName"
          label="Holiday Name"
          rules={[{ required: true, message: 'Please enter holiday name' }]}
        >
          <Input placeholder="e.g., Independence Day" />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Start Date"
          rules={[{ required: true, message: 'Please select start date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="End Date (Optional)"
        >
          <DatePicker 
            style={{ width: '100%' }} 
            placeholder="Pick an end date (for multi-day holidays)"
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="Type"
        >
          <Select>
            <Option value="National">National</Option>
            <Option value="Regional">Regional</Option>
            <Option value="Company">Company</Option>
            <Option value="Religious">Religious</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Optional description"
          />
        </Form.Item>

        <Form.Item
          name="recurring"
          valuePropName="checked"
        >
          <Switch /> <Text style={{ marginLeft: 8 }}>Recurring Holiday</Text>
        </Form.Item>
      </Form>
    </Modal>
  </div>
)}
{selectedTab === 'working-days' && (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <Title level={4}>Working Days Configuration</Title>
        <Text type="secondary">Configure your organization's working schedule</Text>
      </div>
      <Button type="primary">
        Save Configuration
      </Button>
    </div>

    <Card title="Working Days" style={{ marginBottom: 24 }}>
      <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
        Select which days are working days (5 days selected)
      </Text>
      
      <Row gutter={16}>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
          <Col key={day} span={3}>
            <Card size="small" style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>{day}</Text>
              </div>
              <Switch 
                defaultChecked={index < 5} 
                size="small"
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Card>

    <Card title="Working Hours" style={{ marginBottom: 24 }}>
      <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
        Set the standard working hours and break times
      </Text>
      
      <Row gutter={24}>
        <Col span={12}>
          <Title level={5}>Work Hours</Title>
          <Form layout="vertical">
            <Form.Item label="Start Time">
              <TimePicker 
                defaultValue={dayjs('09:00', 'HH:mm')} 
                format="HH:mm" 
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="End Time">
              <TimePicker 
                defaultValue={dayjs('18:00', 'HH:mm')} 
                format="HH:mm" 
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Col>
        
        <Col span={12}>
          <Title level={5}>Break Hours</Title>
          <Form layout="vertical">
            <Form.Item label="Break Start">
              <TimePicker 
                defaultValue={dayjs('12:00', 'HH:mm')} 
                format="HH:mm" 
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="Break End">
              <TimePicker 
                defaultValue={dayjs('13:00', 'HH:mm')} 
                format="HH:mm" 
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Col>
      </Row>
      
      <Divider />
      
      <Form layout="vertical">
        <Form.Item label="Timezone">
          <Select defaultValue="UTC" style={{ width: 200 }}>
            <Option value="UTC">UTC</Option>
            <Option value="EST">Eastern Time</Option>
            <Option value="PST">Pacific Time</Option>
            <Option value="IST">Indian Standard Time</Option>
          </Select>
        </Form.Item>
      </Form>
    </Card>

    <Card title="Configuration Summary">
      <Row gutter={16}>
        <Col span={6}>
          <Text strong>Working Days:</Text> 5 days per week
        </Col>
        <Col span={6}>
          <Text strong>Daily Hours:</Text> 09:00:00 - 18:00:00
        </Col>
        <Col span={6}>
          <Text strong>Break Time:</Text> 12:00:00 - 13:00:00
        </Col>
        <Col span={6}>
          <Text strong>Timezone:</Text> UTC
        </Col>
      </Row>
    </Card>
  </div>
)}
       {selectedTab === 'events' && (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Title level={4}>Events Management</Title>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={() => setEventModalVisible(true)}
      >
        Add Event
      </Button>
    </div>
    <Alert
      message="Event Management"
      description="Create, schedule, and manage events and meetings."
      type="info"
      showIcon
      style={{ marginBottom: 24 }}
    />
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text type="secondary">No events configured. Click "Add Event" to get started.</Text>
      </div>
    </Card>

    {/* Add Event Modal */}
    <Modal
      title="Add New Event"
      open={eventModalVisible}
      onCancel={() => {
        setEventModalVisible(false);
        eventForm.resetFields();
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          setEventModalVisible(false);
          eventForm.resetFields();
        }}>
          Cancel
        </Button>,
        <Button key="create" type="primary" onClick={() => {
          console.log('Event form submitted');
          setEventModalVisible(false);
          eventForm.resetFields();
        }}>
          Create
        </Button>
      ]}
      width={700}
    >
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Create a new event
      </Text>
      
      <Form
        form={eventForm}
        layout="vertical"
        initialValues={{
          startDate: dayjs(),
          eventType: 'Meeting',
          priority: 'Medium',
          status: 'Scheduled',
          enableReminder: true
        }}
      >
        <Form.Item
          name="eventTitle"
          label="Event Title *"
          rules={[{ required: true, message: 'Please enter event title' }]}
        >
          <Input placeholder="e.g., Team Meeting" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Event description"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="Start Date *"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endDate"
              label="End Date"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                placeholder="Pick end date"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="Start Time"
            >
              <TimePicker style={{ width: '100%' }} placeholder="--:--" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="End Time"
            >
              <TimePicker style={{ width: '100%' }} placeholder="--:--" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="eventType"
              label="Event Type"
            >
              <Select>
                <Option value="Meeting">Meeting</Option>
                <Option value="Conference">Conference</Option>
                <Option value="Workshop">Workshop</Option>
                <Option value="Training">Training</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
            >
              <Select>
                <Option value="Low">Low</Option>
                <Option value="Medium">Medium</Option>
                <Option value="High">High</Option>
                <Option value="Critical">Critical</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="location"
          label="Location"
        >
          <Input placeholder="e.g., Conference Room A, Zoom Link" />
        </Form.Item>

        <Form.Item
          name="attendees"
          label="Attendees (comma-separated)"
        >
          <Input placeholder="john@example.com, jane@example.com" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
            >
              <Select>
                <Option value="Scheduled">Scheduled</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="enableReminder"
              valuePropName="checked"
              style={{ marginTop: 30 }}
            >
              <Space>
                <Switch />
                <Text>Enable Reminder</Text>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  </div>
)}
{selectedTab === 'emergency' && (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <Title level={4}>Emergency & Disaster Management</Title>
        <Text type="secondary">Track and manage emergency situations, disasters, and recovery plans</Text>
      </div>
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        onClick={() => setDisasterModalVisible(true)}
      >
        Add Disaster Event
      </Button>
    </div>

    <Card title="Disaster Events" style={{ marginBottom: 24 }}>
      <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
        Track emergency situations, disasters, and recovery efforts
      </Text>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text type="secondary">No disaster events</Text>
        <br />
        <Text type="secondary">Hopefully you won't need to create any disaster events.</Text>
      </div>
    </Card>

    {/* Add Disaster Event Modal */}
    <Modal
      title="Add New Disaster Event"
      open={disasterModalVisible}
      onCancel={() => {
        setDisasterModalVisible(false);
        disasterForm.resetFields();
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          setDisasterModalVisible(false);
          disasterForm.resetFields();
        }}>
          Cancel
        </Button>,
        <Button key="create" type="primary" onClick={() => {
          console.log('Disaster event form submitted');
          setDisasterModalVisible(false);
          disasterForm.resetFields();
        }}>
          Create
        </Button>
      ]}
      width={800}
    >
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Record a new emergency or disaster event
      </Text>
      
      <Form
        form={disasterForm}
        layout="vertical"
        initialValues={{
          startDate: dayjs(),
          disasterType: 'Operational Issue',
          severityLevel: 'Medium',
          status: 'Active'
        }}
      >
        <Form.Item
          name="eventName"
          label="Event Name *"
          rules={[{ required: true, message: 'Please enter event name' }]}
        >
          <Input placeholder="e.g., Server Outage, Fire Drill, Flood" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="disasterType"
              label="Disaster Type"
            >
              <Select>
                <Option value="Operational Issue">Operational Issue</Option>
                <Option value="Natural Disaster">Natural Disaster</Option>
                <Option value="Technical Failure">Technical Failure</Option>
                <Option value="Security Incident">Security Incident</Option>
                <Option value="Fire Emergency">Fire Emergency</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="severityLevel"
              label="Severity Level"
            >
              <Select>
                <Option value="Low">Low</Option>
                <Option value="Medium">Medium</Option>
                <Option value="High">High</Option>
                <Option value="Critical">Critical</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="Start Date *"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endDate"
              label="End Date"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                placeholder="Pick end date"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="affectedAreas"
          label="Affected Areas (comma-separated)"
        >
          <Input placeholder="e.g., Building A, Server Room, Floor 3" />
        </Form.Item>

        <Form.Item
          name="impactDescription"
          label="Impact Description"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Describe the impact of this event"
          />
        </Form.Item>

        <Form.Item
          name="responsePlan"
          label="Response Plan"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Describe the response plan and actions taken"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="assignedTeam"
              label="Assigned Team"
            >
              <Input placeholder="e.g., IT Team, Security Team" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="emergencyContact"
              label="Emergency Contact"
            >
              <Input 
                placeholder="Phone number or email" 
                suffix={<Button type="text" size="small" style={{ color: '#1890ff' }}>📧</Button>}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="estimatedCost"
              label="Estimated Cost"
            >
              <Input placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="actualCost"
              label="Actual Cost"
            >
              <Input placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="recoveryTimeline"
              label="Recovery Timeline"
            >
              <Input placeholder="e.g., 2 weeks, 1 month" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
            >
              <Select>
                <Option value="Active">Active</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Resolved">Resolved</Option>
                <Option value="On Hold">On Hold</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="lessonsLearned"
          label="Lessons Learned"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Document what was learned from this event"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
)}
        {selectedTab === 'settings' && (
          <div>
            <Title level={4}>Calendar Settings</Title>
            <Alert
              message="System Configuration"
              description="Configure timezone, work schedules, and system preferences."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Card>
              <Text type="secondary">Settings functionality will be implemented here.</Text>
            </Card>
          </div>
        )}
      </Content>
    </Layout>
  );
}