import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  DatePicker,
  Modal,
  TimePicker,
  Row,
  Col,
  Switch,
  Typography,
  Space,
  Tag,
  Select,
  Input,
  message,
  Avatar,
  Tabs,
  Badge,
  Tooltip,
  Empty,
  Spin,
  Form,
  Radio,
  Timeline,
  Calendar,
  Popconfirm
} from 'antd';
import {
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  CalendarTwoTone,
  ThunderboltOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { supabase } from '../../supabase/config';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Fetches all events from the database
const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    message.error('Failed to fetch events');
    return [];
  }
};

const CompanyCalendarAndEventsPage = ({ userRole = 'hr', currentUserId = '1' }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModal, setEventModal] = useState(false);
  const [eventForm] = Form.useForm();

  // Initial data fetch for events
  useEffect(() => {
    setLoading(true);
    fetchEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  // Set up real-time subscription for events
  useEffect(() => {
    const eventSub = supabase
      .channel('realtime-events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
      }, () => {
        fetchEvents().then(setEvents);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventSub);
    };
  }, []);
  
  // Handle creating, updating, or deleting an event
const handleEventAction = async (eventData, action = 'create') => {
  setLoading(true);
  try {
    if (action === 'create') {
    const { error } = await supabase
  .from('events')
  .insert([{
    ...eventData,
    time: eventData.time ? dayjs(eventData.time).format('HH:mm:ss') : null,
    status: 'active',
    created_by: 'Current User',
    created_at: new Date().toISOString()
  }]);
      if (error) throw error;
      message.success('Event created successfully!');
    } else if (action === 'update') {
      const { error } = await supabase
  .from('events')
  .update({
    ...eventData,
    time: eventData.time ? dayjs(eventData.time).format('HH:mm:ss') : null,
    updated_at: new Date().toISOString()
  })
  .eq('id', eventData.id || selectedEvent.id);
      if (error) throw error;
      message.success('Event updated successfully!');
  } else if (action === 'delete') {
  if (!selectedEvent?.id && !eventData?.id) {
    message.error('No event selected for deletion');
    return;
  }
  const eventId = selectedEvent?.id || eventData?.id;
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  if (error) throw error;
  message.success('Event deleted successfully!');
}
    
    setEventModal(false);
    setSelectedEvent(null);
    eventForm.resetFields();
    
    // Refresh events
    const updatedEvents = await fetchEvents();
    setEvents(updatedEvents);
  } catch (error) {
    console.error('Error with event action:', error);
    message.error('Failed to perform event action');
  } finally {
    setLoading(false);
  }
};
  
  // Event Card Component for displaying individual events
  const EventCard = ({ event, userRole, onEdit, onDelete, isPast = false }) => {
    const eventDate = dayjs(event.event_date);
    const isToday = eventDate.isSame(dayjs(), 'day');
    const timeFromNow = eventDate.fromNow();
  
    return (
      <Card 
        size="small" 
        style={{ 
          marginBottom: '8px',
          borderRadius: '8px',
          border: `1px solid ${isPast ? '#d9d9d9' : isToday ? '#ff4d4f' : '#52c41a'}20`,
          background: isPast ? '#fafafa' : isToday ? '#fff2f0' : '#f6ffed',
          opacity: isPast ? 0.8 : 1
        }}
        bodyStyle={{ padding: '12px' }}
        actions={userRole !== 'employee' && !isPast ? [
         <Button 
  type="text" 
  size="small" 
  icon={<EditOutlined />}
  onClick={() => {
    setSelectedEvent(event);
    setEventModal(true);
  }}
/>,
          <Popconfirm
            title="Delete this event?"
            onConfirm={() => {
              setSelectedEvent(event);
              setTimeout(() => onDelete(null, 'delete'), 0);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              size="small" 
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>     
        ] : undefined}
      >
        <div>
          <Text strong style={{ 
            color: isPast ? '#8c8c8c' : isToday ? '#ff4d4f' : '#52c41a',
            fontSize: '14px' 
          }}>
            {event.title}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            📅 {eventDate.format('MMM DD, YYYY')} • ⏰ {event.time || 'All Day'}
            {event.location && (
              <><br />📍 {event.location}</>
            )}
          </Text>
          <br />
          <Text style={{ fontSize: '11px', color: isPast ? '#bfbfbf' : '#666' }}>
            {timeFromNow}
          </Text>
          {event.description && (
            <Paragraph style={{ fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>
              {event.description}
            </Paragraph>
          )}
        </div>
      </Card>
    );
  };
  
  // Form component for creating/editing events
  const EventForm = ({ form, onFinish, initialValues }) => {
    useEffect(() => {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          event_date: dayjs(initialValues.event_date)
        });
      }
    }, [initialValues, form]);
  
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          event_date: dayjs(),
          priority: 'medium'
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item
              name="title"
              label="Event Title"
              rules={[{ required: true, message: 'Please enter event title' }]}
            >
              <Input 
                placeholder="e.g., Team Meeting, Company Outing"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="priority"
              label="Priority"
            >
              <Select size="large">
                <Option value="low"><Tag color="green">Low</Tag></Option>
                <Option value="medium"><Tag color="orange">Medium</Tag></Option>
                <Option value="high"><Tag color="red">High</Tag></Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
  
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="event_date"
              label="Event Date"
              rules={[{ required: true, message: 'Please select event date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                size="large"
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="time"
              label="Time (Optional)"
            >
              <TimePicker 
                format="HH:mm"
                style={{ width: '100%' }}
                size="large"
                placeholder="Select time"
              />
            </Form.Item>
          </Col>
        </Row>
  
        <Form.Item
          name="location"
          label="Location (Optional)"
        >
          <Input 
            placeholder="e.g., Conference Room A, Zoom Meeting"
            size="large"
            prefix={<EnvironmentOutlined />}
          />
        </Form.Item>
  
        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea
            rows={3}
            placeholder="Event details and additional information..."
            maxLength={300}
            showCount
          />
        </Form.Item>
      </Form>
    );
  };

  // Main component for the Events Management Tab
const EventsManagement = () => {
  // Enhanced event filtering with proper time consideration
const now = dayjs();
const today = now.startOf('day');

const todayEvents = events.filter(event => {
  if (event.status === 'completed' || event.status === 'rejected') return false;
  
  const eventDate = dayjs(event.event_date);
  const eventDateTime = event.time ? 
    eventDate.hour(dayjs(event.time, 'HH:mm').hour()).minute(dayjs(event.time, 'HH:mm').minute()) : 
    eventDate.hour(23).minute(59); // End of day if no time specified
  
  return eventDate.isSame(today, 'day') && eventDateTime.isAfter(now.subtract(2, 'hours'));
});

const upcomingEvents = events.filter(event => {
  if (event.status === 'completed' || event.status === 'rejected') return false;
  
  const eventDate = dayjs(event.event_date);
  const eventDateTime = event.time ? 
    eventDate.hour(dayjs(event.time, 'HH:mm').hour()).minute(dayjs(event.time, 'HH:mm').minute()) : 
    eventDate.hour(23).minute(59);
  
  return eventDateTime.isAfter(now) && !eventDate.isSame(today, 'day');
});

const ongoingEvents = events.filter(event => {
  if (event.status === 'completed' || event.status === 'rejected') return false;
  
  const eventDate = dayjs(event.event_date);
  if (!eventDate.isSame(today, 'day')) return false;
  
  if (event.time) {
    const eventStartTime = eventDate.hour(dayjs(event.time, 'HH:mm').hour()).minute(dayjs(event.time, 'HH:mm').minute());
    const eventEndTime = eventStartTime.add(2, 'hours'); // Assuming 2-hour duration
    return now.isAfter(eventStartTime) && now.isBefore(eventEndTime);
  }
  return false;
});

const pastEvents = events.filter(event => {
  if (event.status !== 'completed' && event.status !== 'rejected') {
    const eventDate = dayjs(event.event_date);
    const eventDateTime = event.time ? 
      eventDate.hour(dayjs(event.time, 'HH:mm').hour()).minute(dayjs(event.time, 'HH:mm').minute()) : 
      eventDate.hour(23).minute(59);
    
    return eventDateTime.isBefore(now.subtract(2, 'hours'));
  }
  return event.status === 'completed' || event.status === 'rejected';
});

  return (
    <Spin spinning={loading}>
      <div>
        {/* Professional Events Header */}
        <Card style={{ 
          marginBottom: '32px',
          background: 'linear-gradient(to top, #0D7139, #52c41a)',
          border: 'none',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(50px, -50px)'
          }} />
          
          <Row align="middle" justify="space-between" gutter={[24, 24]}>
            <Col flex="auto">
              <Space size="large" align="start">
                <div style={{
                  // width: '80px',
                  // height: '80px',
                  // background: 'rgba(255, 255, 255, 0.2)',
                  // backdropFilter: 'blur(10px)',
                  // borderRadius: '20px',
                  // display: 'flex',
                  // alignItems: 'center',
                  // justifyContent: 'center',
                  // border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {/* <CalendarOutlined style={{ fontSize: '36px', color: 'white' }} /> */}
                </div>
                <div>
                  <Title level={1} style={{ 
                    margin: 0, 
                    color: 'white',
                    fontSize: 'clamp(24px, 5vw, 36px)',
                    fontWeight: '700',
                    letterSpacing: '-0.02em'
                  }}>
                    Company Events
                  </Title>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    fontWeight: '400',
                    display: 'block',
                    marginTop: '8px'
                  }}>
                    {userRole === 'employee' 
                      ? "Stay connected with upcoming company activities" 
                      : "Orchestrate memorable experiences for your team"
                    }
                  </Text>
                  
                  {/* Event Stats */}
                  <div style={{ 
                    display: 'flex',
                    gap: '24px',
                    marginTop: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Text style={{ color: 'white', fontSize: '12px', opacity: 0.9 }}>Today</Text>
                      <br />
                      <Text style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                        {todayEvents.length + ongoingEvents.length}
                      </Text>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Text style={{ color: 'white', fontSize: '12px', opacity: 0.9 }}>Upcoming</Text>
                      <br />
                      <Text style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                        {upcomingEvents.length}
                      </Text>
                    </div>
                  </div>
                </div>
              </Space>
            </Col>
            {userRole !== 'employee' && (
              <Col>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedEvent(null);
                    eventForm.resetFields();
                    setEventModal(true);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '16px',
                    height: '56px',
                    padding: '0 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Create Event
                </Button>
              </Col>
            )}
          </Row>
        </Card>

        {/* Enhanced Event Timelines Grid */}
        <Row gutter={[24, 24]}>
          {/* Ongoing Events */}
          {ongoingEvents.length > 0 && (
            <Col xs={24} lg={6}>
              <Card 
                title={
                  <Space>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ThunderboltOutlined style={{ color: 'white', fontSize: '12px' }} />
                    </div>
                    <Text strong>Live Now</Text>
                    <Badge count={ongoingEvents.length} style={{ backgroundColor: '#ff4d4f' }} />
                  </Space>
                }
                style={{ 
                  borderRadius: '16px',
                  minHeight: '480px',
                  border: '2px solid #ff4d4f20',
                  background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)'
                }}
                headStyle={{
                  borderBottom: '1px solid #ff4d4f20',
                  background: 'transparent'
                }}
              >
                <Timeline
                  items={ongoingEvents.map(event => ({
                    key: event.id,
                    dot: <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                      animation: 'pulse 2s infinite',
                      boxShadow: '0 0 0 4px rgba(255, 77, 79, 0.2)'
                    }} />,
                    children: <EnhancedEventCard 
                      event={event} 
                      userRole={userRole} 
                      onEdit={setSelectedEvent} 
                      onDelete={handleEventAction}
                      type="ongoing"
                    />
                  }))}
                />
              </Card>
            </Col>
          )}

          {/* Today's Events */}
          <Col xs={24} lg={ongoingEvents.length > 0 ? 6 : 8}>
            <Card 
              title={
                <Space>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #2ab7ca 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ClockCircleOutlined style={{ color: 'white', fontSize: '12px' }} />
                  </div>
                  <Text strong>Today</Text>
                  <Badge count={todayEvents.length} style={{ backgroundColor: '#1890ff' }} />
                </Space>
              }
              style={{ 
                borderRadius: '16px',
                minHeight: '480px',
                border: '2px solid #1890ff20',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)'
              }}
              headStyle={{
                borderBottom: '1px solid #1890ff20',
                background: 'transparent'
              }}
            >
              {todayEvents.length > 0 ? (
                <Timeline
                  items={todayEvents.map(event => ({
                    key: event.id,
                    dot: <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />,
                    children: <EnhancedEventCard 
                      event={event} 
                      userRole={userRole} 
                      onEdit={setSelectedEvent} 
                      onDelete={handleEventAction}
                      type="today"
                    />
                  }))}
                />
              ) : (
                <Empty 
                  description="No events scheduled for today"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '60px 0' }}
                />
              )}
            </Card>
          </Col>

          {/* Upcoming Events */}
          <Col xs={24} lg={ongoingEvents.length > 0 ? 6 : 8}>
            <Card 
              title={
                <Space>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CalendarTwoTone style={{ fontSize: '12px' }} />
                  </div>
                  <Text strong>Upcoming</Text>
                  <Badge count={upcomingEvents.length} style={{ backgroundColor: '#52c41a' }} />
                </Space>
              }
              style={{ 
                borderRadius: '16px',
                minHeight: '480px',
                border: '2px solid #52c41a20',
                background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)'
              }}
              headStyle={{
                borderBottom: '1px solid #52c41a20',
                background: 'transparent'
              }}
            >
              {upcomingEvents.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Timeline
                    items={upcomingEvents.slice(0, 12).map(event => ({
                      key: event.id,
                      dot: <CalendarTwoTone twoToneColor="#52c41a" />,
                      children: <EnhancedEventCard 
                        event={event} 
                        userRole={userRole} 
                        onEdit={setSelectedEvent} 
                        onDelete={handleEventAction}
                        type="upcoming"
                      />
                    }))}
                  />
                </div>
              ) : (
                <Empty 
                  description="No upcoming events"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '60px 0' }}
                />
              )}
            </Card>
          </Col>

          {/* Past Events */}
          <Col xs={24} lg={ongoingEvents.length > 0 ? 6 : 8}>
            <Card 
              title={
                <Space>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #bfbfbf 0%, #8c8c8c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HistoryOutlined style={{ color: 'white', fontSize: '12px' }} />
                  </div>
                  <Text strong>Completed</Text>
                  <Badge count={pastEvents.length} style={{ backgroundColor: '#8c8c8c' }} />
                </Space>
              }
              style={{ 
                borderRadius: '16px',
                minHeight: '480px',
                border: '2px solid #d9d9d920',
                background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)'
              }}
              headStyle={{
                borderBottom: '1px solid #d9d9d920',
                background: 'transparent'
              }}
            >
              {pastEvents.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Timeline
                    items={pastEvents.slice(0, 8).map(event => ({
                      key: event.id,
                      dot: <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: '#bfbfbf' 
                      }} />,
                      children: <EnhancedEventCard 
                        event={event} 
                        userRole={userRole} 
                        type="past"
                      />
                    }))}
                  />
                </div>
              ) : (
                <Empty 
                  description="No past events"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '60px 0' }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Enhanced Event Modal */}
        <Modal
          title={null}
          open={eventModal}
          onCancel={() => setEventModal(false)}
          footer={null}
          width={800}
          centered
          styles={{
            body: { padding: 0 },
            content: { borderRadius: '24px', overflow: 'hidden' }
          }}
        >
         <EventFormModal 
  form={eventForm}
  selectedEvent={selectedEvent}
  onFinish={(values) => {
    const eventData = selectedEvent ? { ...values, id: selectedEvent.id } : values;
    handleEventAction(eventData, selectedEvent ? 'update' : 'create');
  }}
  onCancel={() => setEventModal(false)}
  loading={loading}
/>
        </Modal>
      </div>

      {/* Add pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
          }
        }
      `}</style>
    </Spin>
  );
};
const EventFormModal = ({ form, selectedEvent, onFinish, onCancel, loading }) => {
  useEffect(() => {
    if (selectedEvent) {
     form.setFieldsValue({
  ...selectedEvent,
  event_date: dayjs(selectedEvent.event_date),
  time: selectedEvent.time ? dayjs(selectedEvent.time, 'HH:mm:ss') : null
});
    }
  }, [selectedEvent, form]);

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '32px',
        background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <CalendarOutlined style={{ fontSize: '28px' }} />
        </div>
        <Title level={2} style={{ color: 'white', margin: 0, fontSize: '28px' }}>
          {selectedEvent ? 'Edit Event' : 'Create New Event'}
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
          {selectedEvent ? 'Update event details' : 'Plan something amazing for your team'}
        </Text>
      </div>

      {/* Form */}
      <div style={{ padding: '32px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            event_date: dayjs(),
            priority: 'medium'
          }}
        >
          <div style={{
            padding: '24px',
            background: '#f8f9fa',
            borderRadius: '16px',
            marginBottom: '24px'
          }}>
            <Title level={4} style={{ margin: '0 0 16px 0', color: '#495057' }}>
              Event Details
            </Title>
            
            <Row gutter={[24, 16]}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="title"
                  label={<Text strong style={{ fontSize: '14px' }}>Event Title</Text>}
                  rules={[{ required: true, message: 'Please enter event title' }]}
                >
                  <Input 
                    placeholder="e.g., Annual Team Building, Product Launch"
                    size="large"
                    style={{ borderRadius: '8px' }}
                    prefix={<CalendarOutlined style={{ color: '#8c8c8c' }} />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="priority"
                  label={<Text strong style={{ fontSize: '14px' }}>Priority Level</Text>}
                >
                  <Select size="large" style={{ borderRadius: '8px' }}>
                    <Option value="low">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#52c41a' }} />
                        Low Priority
                      </div>
                    </Option>
                    <Option value="medium">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#faad14' }} />
                        Medium Priority
                      </div>
                    </Option>
                    <Option value="high">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4f' }} />
                        High Priority
                      </div>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{
            padding: '24px',
            background: '#f0f9ff',
            borderRadius: '16px',
            marginBottom: '24px'
          }}>
            <Title level={4} style={{ margin: '0 0 16px 0', color: '#495057' }}>
              Schedule Information
            </Title>
            
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="event_date"
                  label={<Text strong style={{ fontSize: '14px' }}>Event Date</Text>}
                  rules={[{ required: true, message: 'Please select event date' }]}
                >
                  <DatePicker 
                    style={{ width: '100%', borderRadius: '8px' }}
                    size="large"
                    format="DD/MM/YYYY"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    placeholder="Select date"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="time"
                  label={<Text strong style={{ fontSize: '14px' }}>Time (Optional)</Text>}
                >
                  <TimePicker 
                    format="HH:mm"
                    style={{ width: '100%', borderRadius: '8px' }}
                    size="large"
                    placeholder="Select time"
                    minuteStep={15}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{
            padding: '24px',
            background: '#f6ffed',
            borderRadius: '16px',
            marginBottom: '24px'
          }}>
            <Title level={4} style={{ margin: '0 0 16px 0', color: '#495057' }}>
              Additional Information
            </Title>
            
            <Form.Item
              name="location"
              label={<Text strong style={{ fontSize: '14px' }}>Location</Text>}
            >
              <Input 
                placeholder="e.g., Conference Room A, Zoom Meeting, Outdoor Venue"
                size="large"
                style={{ borderRadius: '8px' }}
                prefix={<EnvironmentOutlined style={{ color: '#8c8c8c' }} />}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={<Text strong style={{ fontSize: '14px' }}>Event Description</Text>}
            >
              <TextArea
                rows={4}
                placeholder="Describe the event, agenda, what attendees should expect, or any special instructions..."
                maxLength={500}
                showCount
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '24px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button 
              size="large"
              onClick={onCancel}
              style={{
                borderRadius: '8px',
                padding: '0 24px',
                height: '48px'
              }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              size="large"
              htmlType="submit"
              loading={loading}
              style={{
                background: 'linear-gradient(to top, #0D7139, #52c41a)',
                border: 'none',
                borderRadius: '8px',
                padding: '0 32px',
                height: '48px',
                fontSize: '16px',
                fontWeight: '600'
              }}
              icon={<SaveOutlined />}
            >
              {selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
const EnhancedEventCard = ({ event, userRole, onEdit, onDelete, type = 'upcoming' }) => {
  const [actionModal, setActionModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [rescheduleForm] = Form.useForm();
  
  const eventDate = dayjs(event.event_date);
  const eventDateTime = event.time ? 
    eventDate.hour(dayjs(event.time, 'HH:mm').hour()).minute(dayjs(event.time, 'HH:mm').minute()) : 
    eventDate;
  const timeFromNow = eventDateTime.fromNow();
  const isPast = type === 'past';
  const isOngoing = type === 'ongoing';
  const isToday = type === 'today';

  const getCardStyle = () => {
    switch (type) {
      case 'ongoing':
        return {
          background: 'linear-gradient(135deg, #fff2f0 0%, #ffffff 100%)',
          border: '2px solid #ff4d4f20',
          borderLeft: '4px solid #ff4d4f'
        };
      case 'today':
        return {
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
          border: '2px solid #1890ff20',
          borderLeft: '4px solid #1890ff'
        };
      case 'upcoming':
        return {
          background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)',
          border: '2px solid #52c41a20',
          borderLeft: '4px solid #52c41a'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
          border: '2px solid #d9d9d920',
          borderLeft: '4px solid #bfbfbf',
          opacity: 0.9
        };
    }
  };

  const handleReschedule = async (values) => {
    try {
      const updatedEvent = {
        ...event,
        event_date: values.newDate.format('YYYY-MM-DD'),
        time: values.newTime ? values.newTime.format('HH:mm') : event.time,
        description: values.reason ? 
          `${event.description || ''}\n\nRescheduled: ${values.reason}` : 
          event.description
      };
      
      // Update event (you'll need to implement this in your handleEventAction)
      await handleEventAction(updatedEvent, 'update');
      setRescheduleModal(false);
      setActionModal(false);
      rescheduleForm.resetFields();
      message.success('Event rescheduled successfully!');
    } catch (error) {
      message.error('Failed to reschedule event');
    }
  };
const handleComplete = async () => {
  try {
    const completedEvent = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      id: event.id
    };
    
    await onDelete(completedEvent, 'update');
    setActionModal(false);
    message.success('Event marked as completed!');
  } catch (error) {
    message.error('Failed to mark event as completed');
  }
}; 

  const handleReject = async () => {
    try {
      const rejectedEvent = {
        ...event,
        status: 'rejected',
        rejected_at: new Date().toISOString()
      };
      
      await handleEventAction(rejectedEvent, 'update');
      setActionModal(false);
      message.success('Event has been rejected');
    } catch (error) {
      message.error('Failed to reject event');
    }
  };

  return (
    <>
      <Card 
        size="small" 
        style={{ 
          marginBottom: '12px',
          borderRadius: '12px',
          ...getCardStyle(),
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        bodyStyle={{ padding: '16px' }}
        hoverable
        actions={!isPast && userRole !== 'employee' ? [
          <Tooltip title="Edit Event">
          <Button 
  type="text" 
  size="small" 
  icon={<EditOutlined />}
  onClick={(e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEventModal(true);
  }}
  style={{ color: '#1890ff' }}
/>
          </Tooltip>,
          <Tooltip title="Event Actions">
            <Button 
              type="text" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setActionModal(true);
              }}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>,
          <Tooltip title="Delete Event">
          <Popconfirm
  title="Delete this event?"
  onConfirm={(e) => {
    e?.stopPropagation();
    onDelete(event, 'delete'); // Pass the event object directly
  }}
  okText="Delete"
  cancelText="Cancel"
  placement="topRight"
>
  <Button 
    type="text" 
    size="small" 
    icon={<DeleteOutlined />}
    danger
    onClick={(e) => e.stopPropagation()}
  />
</Popconfirm>
          </Tooltip>
        ] : undefined}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <Title level={5} style={{ 
              margin: 0,
              color: isPast ? '#8c8c8c' : isOngoing ? '#ff4d4f' : '#262626',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {event.title}
            </Title>
            {isOngoing && (
              <Tag color="red" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px' }}>
                LIVE
              </Tag>
            )}
            {event.priority && (
              <Tag 
                color={event.priority === 'high' ? 'red' : event.priority === 'medium' ? 'orange' : 'green'}
                style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px' }}
              >
                {event.priority.toUpperCase()}
              </Tag>
            )}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <Space wrap size={[8, 4]}>
              <Text style={{ 
                fontSize: '13px', 
                color: isPast ? '#bfbfbf' : '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CalendarOutlined style={{ fontSize: '12px' }} />
                {eventDate.format('MMM DD, YYYY')}
              </Text>
              
              {event.time && (
                <Text style={{ 
                  fontSize: '13px', 
                  color: isPast ? '#bfbfbf' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ClockCircleOutlined style={{ fontSize: '12px' }} />
                  {event.time}
                </Text>
              )}
              
              {event.location && (
                <Text style={{ 
                  fontSize: '13px', 
                  color: isPast ? '#bfbfbf' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <EnvironmentOutlined style={{ fontSize: '12px' }} />
                  {event.location}
                </Text>
              )}
            </Space>
          </div>
          
          <Text style={{ 
            fontSize: '11px', 
            color: isPast ? '#bfbfbf' : isOngoing ? '#ff4d4f' : '#52c41a',
            fontWeight: '500'
          }}>
            {isOngoing ? 'Happening now' : timeFromNow}
          </Text>
          
          {event.description && (
            <Paragraph 
              ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
              style={{ 
                fontSize: '13px', 
                marginTop: '8px', 
                marginBottom: 0,
                color: isPast ? '#8c8c8c' : '#666'
              }}
            >
              {event.description}
            </Paragraph>
          )}
        </div>
      </Card>

      {/* Event Action Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircleOutlined style={{ color: 'white', fontSize: '24px' }} />
            </div>
            <Title level={4} style={{ margin: 0 }}>Event Status</Title>
            <Text type="secondary">What would you like to do with "{event.title}"?</Text>
          </div>
        }
        open={actionModal}
        onCancel={() => setActionModal(false)}
        footer={null}
        centered
        width={500}
      >
        <div style={{ padding: '24px 0' }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleComplete}
              style={{
                width: '100%',
                height: '56px',
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px'
              }}
            >
              Mark as Completed
            </Button>
            
            <Button
              size="large"
              icon={<ClockCircleOutlined />}
              onClick={() => {
                setActionModal(false);
                setRescheduleModal(true);
              }}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '12px',
                fontSize: '16px',
                borderColor: '#1890ff',
                color: '#1890ff'
              }}
            >
              Reschedule Event
            </Button>
            
            <Button
              danger
              size="large"
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '12px',
                fontSize: '16px'
              }}
            >
              Cancel Event
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClockCircleOutlined style={{ color: 'white', fontSize: '24px' }} />
            </div>
            <Title level={4} style={{ margin: 0 }}>Reschedule Event</Title>
            <Text type="secondary">Choose a new date and time for "{event.title}"</Text>
          </div>
        }
        open={rescheduleModal}
        onCancel={() => {
          setRescheduleModal(false);
          rescheduleForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setRescheduleModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => rescheduleForm.submit()}
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              border: 'none'
            }}
          >
            Reschedule
          </Button>
        ]}
        centered
        width={600}
      >
        <Form
          form={rescheduleForm}
          layout="vertical"
          onFinish={handleReschedule}
          style={{ padding: '24px 0' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="newDate"
                label="New Date"
                rules={[{ required: true, message: 'Please select new date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="newTime"
                label="New Time"
              >
                <TimePicker 
                  format="HH:mm"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="reason"
            label="Reason for Rescheduling"
            rules={[{ required: true, message: 'Please provide reason for rescheduling' }]}
          >
            <TextArea
              rows={3}
              placeholder="Please explain why this event needs to be rescheduled..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
  // Main component for the Company Calendar Tab with enhanced UI
  const LeaveCalendarView = ({ userRole }) => {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [companyCalendar, setCompanyCalendar] = useState([]);
    const [editModal, setEditModal] = useState(false);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
    const [calendarForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [weeklyHolidayModal, setWeeklyHolidayModal] = useState(false);
    const [weeklyHolidayForm] = Form.useForm();
    const [pendingChanges, setPendingChanges] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fetch company calendar data
    const fetchCompanyCalendarData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('company_calendar')
          .select('*')
          .order('date', { ascending: true });
        
        if (error) throw error;
        setCompanyCalendar(data || []);
      } catch (error) {
        console.error('Error fetching company calendar:', error);
        message.error('Failed to fetch company calendar');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchCompanyCalendarData();
    }, []);

    // Get calendar data for a specific date (including pending changes)
    const getCalendarData = (value) => {
      const dateStr = value.format('YYYY-MM-DD');
      
      if (pendingChanges[dateStr]) {
        return pendingChanges[dateStr];
      }
      
      return companyCalendar.find(item => item.date === dateStr);
    };

    // Handle calendar date update
    const handleCalendarUpdate = (values) => {
      const dateStr = selectedCalendarDate.format('YYYY-MM-DD');
      
      const calendarData = {
        date: dateStr,
        day_type: values.dayType,
        holiday_name: values.dayType === 'holiday' ? values.holidayName : null,
        reason: values.reason || null,
        is_mandatory: values.isMandatory || false,
        created_by: 'Current User',
        updated_at: new Date().toISOString()
      };

      setPendingChanges(prev => ({
        ...prev,
        [dateStr]: calendarData
      }));
      
      setHasUnsavedChanges(true);
      setEditModal(false);
      calendarForm.resetFields();
      message.info('Change saved locally. Click "Publish" to save to the database.');
    };

    // Handle weekly holiday setup
    const handleWeeklyHolidaySetup = (values) => {
      const { weekday, year, holidayName, reason } = values;
      const startDate = dayjs(`${year}-01-01`);
      const endDate = dayjs(`${year}-12-31`);
      
      let currentDate = startDate.day(weekday);
      if (currentDate.isBefore(startDate)) {
        currentDate = currentDate.add(7, 'days');
      }
      
      const weeklyDates = [];
      while (currentDate.isBefore(endDate)) {
        weeklyDates.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(7, 'days');
      }
      
      const newPendingChanges = { ...pendingChanges };
      weeklyDates.forEach(dateStr => {
        newPendingChanges[dateStr] = {
          date: dateStr,
          day_type: 'holiday',
          holiday_name: holidayName,
          reason: reason || `Weekly holiday - ${dayjs().day(weekday).format('dddd')}`,
          is_mandatory: true,
          created_by: 'Current User',
          updated_at: new Date().toISOString()
        };
      });
      
      setPendingChanges(newPendingChanges);
      setHasUnsavedChanges(true);
      setWeeklyHolidayModal(false);
      weeklyHolidayForm.resetFields();
      message.success(`${weeklyDates.length} days marked as holidays for ${year}. Click "Publish" to save.`);
    };

    // Publish all pending changes to database
    const handlePublishChanges = async () => {
      if (!hasUnsavedChanges || Object.keys(pendingChanges).length === 0) {
        return;
      }
      
      setLoading(true);
      try {
        const changesToPublish = Object.values(pendingChanges);
        
        const { error } = await supabase
          .from('company_calendar')
          .upsert(changesToPublish, { onConflict: 'date' });

        if (error) throw error;
        
        await fetchCompanyCalendarData();
        setPendingChanges({});
        setHasUnsavedChanges(false);
        
        message.success('Calendar changes published successfully!');
        
      } catch (error) {
        console.error('Error publishing changes:', error);
        message.error('Failed to publish changes');
      } finally {
        setLoading(false);
      }
    };

    // Discard pending changes
    const handleDiscardChanges = () => {
      setPendingChanges({});
      setHasUnsavedChanges(false);
      message.info('Pending changes discarded');
    };

    // Helper functions for styling
    const getDateBackground = (calendarData, isToday, effectiveDayType) => {
      if (isToday) {
        return 'linear-gradient(135deg, rgba(13, 113, 57, 0.1) 0%, rgba(13, 113, 57, 0.05) 100%)';
      }
      
      if (!calendarData) {
        return 'transparent';
      }
      
      switch (effectiveDayType) {
        case 'holiday':
          return 'linear-gradient(135deg, rgba(255, 77, 79, 0.08) 0%, rgba(255, 77, 79, 0.03) 100%)';
        case 'half_day':
          return 'linear-gradient(135deg, rgba(250, 173, 20, 0.08) 0%, rgba(250, 173, 20, 0.03) 100%)';
        default:
          return 'transparent';
      }
    };

    const getDateBorder = (calendarData, isToday, effectiveDayType) => {
      if (isToday) {
        return '2px solid #0D7139';
      }
      if (!calendarData) return 'none';
      
      switch (effectiveDayType) {
        case 'holiday':
          return '1px solid rgba(255, 77, 79, 0.2)';
        case 'half_day':
          return '1px solid rgba(250, 173, 20, 0.2)';
        case 'working':
          return '1px solid rgba(82, 196, 26, 0.2)';
        default:
          return 'none';
      }
    };

    // Date cell render for calendar
    const dateCellRender = (value) => {
      const calendarData = getCalendarData(value);
      const isToday = value.isSame(dayjs(), 'day');
      const effectiveDayType = calendarData?.day_type || 'working';
      
      return (
        <>
          {/* Custom CSS styles */}
          <style>{`
            .calendar-date-cell:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            }
            
            .calendar-date-cell:hover .edit-indicator {
              opacity: 1 !important;
            }
            
            .calendar-date-cell.today {
              box-shadow: 0 0 0 2px rgba(13, 113, 57, 0.2), 0 4px 12px rgba(13, 113, 57, 0.15);
            }
            
            .ant-picker-calendar .ant-picker-calendar-date {
              border: none !important;
              border-radius: 8px !important;
              margin: 2px !important;
            }
            
            .ant-picker-calendar-header {
              padding: 16px 24px !important;
              border-bottom: 1px solid #f0f0f0 !important;
            }
          `}</style>
          
          <div 
            className={`calendar-date-cell ${isToday ? 'today' : ''}`}
            style={{
              position: 'relative',
              height: '80px',
              padding: '4px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              cursor: userRole !== 'employee' ? 'pointer' : 'default',
              backgroundColor: getDateBackground(calendarData, isToday, effectiveDayType),
              border: getDateBorder(calendarData, isToday, effectiveDayType),
            }}
            onClick={() => {
              if (userRole !== 'employee') {
                setSelectedCalendarDate(value);
                const existing = getCalendarData(value);
                if (existing) {
                  calendarForm.setFieldsValue({
                    dayType: existing.day_type,
                    holidayName: existing.holiday_name,
                    reason: existing.reason,
                    isMandatory: existing.is_mandatory
                  });
                } else {
                  calendarForm.resetFields();
                  calendarForm.setFieldsValue({ dayType: 'working' });
                }
                setEditModal(true);
              }
            }}
          >     
            {/* Status indicators */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '2px',
              right: '2px',
              zIndex: 1
            }}>
              {/* Holiday badge */}
              {effectiveDayType === 'holiday' && (
                <div style={{
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  marginBottom: '2px',
                  fontSize: '9px',
                  fontWeight: '500',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(255, 77, 79, 0.3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  🎉 {calendarData?.holiday_name || 'Holiday'}
                </div>
              )}

              {/* Half Day badge */}
              {effectiveDayType === 'half_day' && (
                <div style={{
                  background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  marginBottom: '2px',
                  fontSize: '9px',
                  fontWeight: '500',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(250, 173, 20, 0.3)',
                }}>
                  🕑 Half Day
                </div>
              )}

              {/* Working Day badge */}
              {effectiveDayType === 'working' && (
                <div style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  marginBottom: '2px',
                  fontSize: '9px',
                  fontWeight: '500',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(82, 196, 26, 0.3)',
                }}>
                  ✅ Working Day
                </div>
              )}
              
              {/* Reason tooltip */}
              {calendarData?.reason && (
                <Tooltip title={calendarData.reason} placement="bottom">
                  <div style={{
                    background: 'rgba(13, 113, 57, 0.1)',
                    border: '1px solid rgba(13, 113, 57, 0.2)',
                    color: '#0D7139',
                    borderRadius: '8px',
                    padding: '2px 4px',
                    fontSize: '8px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'help'
                  }}>
                    📝 Info
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Edit button for HR/Admin */}
            {userRole !== 'employee' && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                opacity: 0,
                transition: 'opacity 0.2s ease'
              }}
              className="edit-indicator">
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                }}>
                  <EditOutlined />
                </div>
              </div>
            )}
          </div>
        </>
      );
    };

    return (
      <Spin spinning={loading}>
        <Card style={{ 
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}>
          {/* Enhanced Header */}
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(13, 113, 57, 0.1)'
          }}>
            {/* Title Section */}
            <div style={{ marginBottom: '16px' }}>
              <Title level={3} style={{ 
                margin: 0, 
                color: '#0D7139', 
                fontSize: 'clamp(18px, 4vw, 24px)',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <CalendarTwoTone 
                  twoToneColor={['#0D7139', '#52c41a']} 
                  style={{ fontSize: '24px', flexShrink: 0 }} 
                />
                <span>Company Calendar</span>
              </Title>
            </div>

            {/* Legend Section */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px', 
              alignItems: 'center',
              padding: '12px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              marginBottom: '16px'
            }}>
              <Tooltip title="Public Holidays">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  minWidth: 'fit-content',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 77, 79, 0.05)'
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)', 
                    borderRadius: '3px',
                    boxShadow: '0 1px 3px rgba(255, 77, 79, 0.3)',
                    flexShrink: 0
                  }}></div>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>Holiday</Text>
                </div>
              </Tooltip>
              
              <Tooltip title="Half Working Days">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  minWidth: 'fit-content',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(250, 173, 20, 0.05)'
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)', 
                    borderRadius: '3px',
                    boxShadow: '0 1px 3px rgba(250, 173, 20, 0.3)',
                    flexShrink: 0
                  }}></div>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>Half Day</Text>
                </div>
              </Tooltip>
              
              <Tooltip title="Special Working Days">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  minWidth: 'fit-content',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(82, 196, 26, 0.05)'
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', 
                    borderRadius: '3px',
                    boxShadow: '0 1px 3px rgba(82, 196, 26, 0.3)',
                    flexShrink: 0
                  }}></div>
                  <Text style={{ 
                    fontSize: '12px', 
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>Working</Text>
                </div>
              </Tooltip>
            </div>

            {/* Action Buttons */}
            {userRole !== 'employee' && (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Primary Actions Row */}
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <Tooltip title="Set Weekly Holiday">
                    <Button 
                      icon={<CalendarOutlined />}
                      onClick={() => {
                        weeklyHolidayForm.resetFields();
                        setWeeklyHolidayModal(true);
                      }}
                      style={{ borderRadius: '8px' }}
                    >
                      Weekly Holiday
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Quick Add Holiday">
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      style={{
                        background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      onClick={() => {
                        setSelectedCalendarDate(dayjs());
                        calendarForm.resetFields();
                        calendarForm.setFieldsValue({ dayType: 'holiday' });
                        setEditModal(true);
                      }}
                    >
                      Add Holiday
                    </Button>
                  </Tooltip>
                </div>

                {/* Secondary Actions Row */}
                {hasUnsavedChanges && (
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px',
                    background: 'rgba(82, 196, 26, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(82, 196, 26, 0.2)'
                  }}>
                    <Badge 
                      count={Object.keys(pendingChanges).length} 
                      size="small"
                    >
                      <Button 
                        type="primary"
                        icon={<SaveOutlined />}
                        style={{
                          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                          border: 'none',
                          borderRadius: '8px'
                        }}
                        onClick={handlePublishChanges}
                        loading={loading}
                      >
                        Publish
                      </Button>
                    </Badge>
                    
                    <Button 
                      icon={<CloseCircleOutlined />}
                      danger
                      style={{ borderRadius: '8px' }}
                      onClick={handleDiscardChanges}
                    >
                      Discard
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Calendar */}
          <Calendar 
            cellRender={(value, info) => {
              if (info.type === 'date') {
                return dateCellRender(value);
              }
              return info.originNode;
            }}
            onSelect={(date) => setSelectedDate(date)}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          />

          {/* Calendar Edit Modal */}
          {userRole !== 'employee' && (
            <Modal
              title={
                <Space>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <CalendarOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>
                      Edit Calendar Date
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {selectedCalendarDate?.format('dddd, MMMM DD, YYYY')}
                    </Text>
                  </div>
                </Space>
              }
              open={editModal}
              onCancel={() => {
                setEditModal(false);
                calendarForm.resetFields();
              }}
              footer={[
                <Button key="cancel" onClick={() => setEditModal(false)}>
                  Cancel
                </Button>,
                <Button 
                  key="submit" 
                  type="primary" 
                  onClick={() => calendarForm.submit()}
                  loading={loading}
                  style={{
                    background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  <SaveOutlined /> Save Changes
                </Button>
              ]}
              width={600}
              centered
            >
              <Form
                form={calendarForm}
                layout="vertical"
                onFinish={handleCalendarUpdate}
                initialValues={{ dayType: 'working' }}
              >
                <Form.Item
                  name="dayType"
                  label="Day Type"
                  rules={[{ required: true, message: 'Please select day type' }]}
                >
                  <Radio.Group 
                    size="large"
                    style={{ width: '100%' }}
                    buttonStyle="solid"
                  >
                    <Radio.Button 
                      value="working" 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center',
                        borderRadius: '8px 0 0 8px'
                      }}
                    >
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> Working Day
                    </Radio.Button>
                    <Radio.Button 
                      value="holiday" 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center'
                      }}
                    >
                      <ThunderboltOutlined style={{ color: '#ff4d4f' }} /> Holiday
                    </Radio.Button>
                    <Radio.Button 
                      value="half_day" 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center',
                        borderRadius: '0 8px 8px 0'
                      }}
                    >
                      <ClockCircleOutlined style={{ color: '#faad14' }} /> Half Day
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.dayType !== currentValues.dayType
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue('dayType') === 'holiday' ? (
                      <Form.Item
                        name="holidayName"
                        label="Holiday Name"
                        rules={[{ required: true, message: 'Please enter holiday name' }]}
                      >
                        <Input 
                          placeholder="e.g., Diwali, Christmas, Independence Day"
                          size="large"
                          prefix={<ThunderboltOutlined style={{ color: '#ff4d4f' }} />}
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>

                <Form.Item
                  name="reason"
                  label="Description"
                >
                  <TextArea
                    rows={3}
                    placeholder="Provide additional details about this day..."
                    maxLength={200}
                    showCount
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="isMandatory"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <div style={{
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <Space>
                      <Switch size="small" />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        Mandatory Holiday
                      </span>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        (Cannot be overridden by employees)
                      </Text>
                    </Space>
                  </div>
                </Form.Item>
              </Form>
            </Modal>
          )}

          {/* Weekly Holiday Setup Modal */}
          <Modal
            title={
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <CalendarOutlined />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    Set Weekly Holiday
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Mark all occurrences of a weekday as holiday
                  </Text>
                </div>
              </div>
            }
            open={weeklyHolidayModal}
            onCancel={() => {
              setWeeklyHolidayModal(false);
              weeklyHolidayForm.resetFields();
            }}
            footer={[
              <Button 
                key="cancel" 
                onClick={() => setWeeklyHolidayModal(false)}
              >
                Cancel
              </Button>,
              <Button 
                key="submit" 
                type="primary" 
                onClick={() => weeklyHolidayForm.submit()}
                style={{
                  background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                  border: 'none',
                  borderRadius: '6px'
                }}
                icon={<CalendarOutlined />}
              >
                Set Holiday
              </Button>
            ]}
            width={500}
            centered
          >
            <Form
              form={weeklyHolidayForm}
              layout="vertical"
              onFinish={handleWeeklyHolidaySetup}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="weekday"
                    label="Select Weekday"
                    rules={[{ required: true, message: 'Please select a weekday' }]}
                  >
                    <Select 
                      placeholder="Choose weekday"
                      size="large"
                    >
                      <Option value={1}>Monday</Option>
                      <Option value={2}>Tuesday</Option>
                      <Option value={3}>Wednesday</Option>
                      <Option value={4}>Thursday</Option>
                      <Option value={5}>Friday</Option>
                      <Option value={6}>Saturday</Option>
                      <Option value={0}>Sunday</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="year"
                    label="Select Year"
                    rules={[{ required: true, message: 'Please select a year' }]}
                  >
                    <Select 
                      placeholder="Choose year"
                      size="large"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = dayjs().year() + i;
                        return (
                          <Option key={year} value={year}>
                            {year}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="holidayName"
                label="Holiday Name"
                rules={[{ required: true, message: 'Please enter holiday name' }]}
              >
                <Input 
                  placeholder="e.g., Weekly Off, Saturday Holiday"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="reason"
                label="Description (Optional)"
              >
                <TextArea
                  rows={2}
                  placeholder="Additional details about this weekly holiday..."
                  maxLength={100}
                  showCount
                />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      </Spin>
    );
  };
    
  // Main component render with Tabs
  return (
    <div style={{ padding: '24px', background: 'transparent', minHeight: '100vh' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: '24px' }}
        items={[
          {
            key: 'calendar',
            label: (
              <Space>
                <CalendarOutlined />
                <span>Company Calendar</span>
              </Space>
            ),
            children: <LeaveCalendarView userRole={userRole} />
          },
          {
            key: 'events',
            label: (
              <Space>
                <TeamOutlined />
                <span>Events</span>
                <Badge count={events.filter(e => dayjs(e.event_date).isAfter(dayjs().subtract(1, 'day'))).length} size="small" />
              </Space>
            ),
            children: <EventsManagement />
          }
        ]}
      />
    </div>
  );
};

export default CompanyCalendarAndEventsPage;