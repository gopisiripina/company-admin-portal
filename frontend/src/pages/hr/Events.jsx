import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  DatePicker, 
  Modal, 
  TimePicker, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Tag, 
  Select, 
  Input,
  message,
  Avatar,
  Badge,
  Tooltip,
  Empty,
  Timeline,
  Form,
  Popconfirm
} from 'antd';
import { 
  CalendarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  ClockCircleFilled,
  CalendarTwoTone
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Events = ({ userRole, events, setEvents, loading, setLoading }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModal, setEventModal] = useState(false);
  const [eventForm] = Form.useForm();

  // Fetch events from database
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('Failed to fetch events');
      return [];
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventAction = async (eventData, action = 'create') => {
    setLoading(true);
    try {
      if (action === 'create') {
        const { error } = await supabase
          .from('events')
          .insert([{
            ...eventData,
            created_by: 'Current User',
            created_at: new Date().toISOString()
          }]);
        if (error) throw error;
        message.success('Event created successfully!');
      } else if (action === 'update') {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', selectedEvent.id);
        if (error) throw error;
        message.success('Event updated successfully!');
      } else if (action === 'delete') {
        if (!selectedEvent || !selectedEvent.id) {
          message.error('No event selected for deletion');
          return;
        }
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', selectedEvent.id);
        if (error) throw error;
        message.success('Event deleted successfully!');
      }
      
      // Refresh events
      await fetchEvents();
      setEventModal(false);
      setSelectedEvent(null);
      eventForm.resetFields();
    } catch (error) {
      console.error('Error with event action:', error);
      message.error('Failed to perform event action');
    } finally {
      setLoading(false);
    }
  };

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
        styles={{ body: { padding: '12px' } }}
        actions={userRole !== 'employee' && !isPast ? [
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              onEdit(event);
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
            <>
              <br />
              <Text style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {event.description}
              </Text>
            </>
          )}
        </div>
      </Card>
    );
  };

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
                <Option value="low">
                  <Space><Tag color="green">Low</Tag></Space>
                </Option>
                <Option value="medium">
                  <Space><Tag color="orange">Medium</Tag></Space>
                </Option>
                <Option value="high">
                  <Space><Tag color="red">High</Tag></Space>
                </Option>
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

  const today = dayjs();
  const upcomingEvents = events.filter(event => 
    dayjs(event.event_date).isAfter(today.subtract(1, 'day'))
  );
  const todayEvents = events.filter(event => 
    dayjs(event.event_date).isSame(today, 'day')
  );
  const pastEvents = events.filter(event => 
    dayjs(event.event_date).isBefore(today, 'day')
  );

  return (
    <div>
      {/* Events Header */}
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
                icon={<CalendarOutlined />} 
                style={{ backgroundColor: '#03481def' }}
              />
              <div>
                <Title level={2} style={{ margin: 0, color: '#03481def' }}>
                  Company Events
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {userRole === 'employee' 
                    ? "Stay updated with upcoming company events"
                    : "Manage company events and announcements"
                  }
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            {userRole !== 'employee' && (
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
                  background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '50px',
                  paddingLeft: '24px',
                  paddingRight: '24px'
                }}
              >
                Add Event
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Today's Events */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  <ClockCircleOutlined />
                </div>
                <span>Today's Events</span>
                <Badge count={todayEvents.length} />
              </Space>
            }
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              minHeight: '400px'
            }}
            styles={{ body: { padding: '16px' } }}
          >
            {todayEvents.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No events today"
                style={{ margin: '40px 0' }}
              />
            ) : (
              <Timeline
                items={todayEvents.map(event => ({
                  key: event.id,
                  dot: <ClockCircleFilled style={{ color: '#ff4d4f' }} />,
                  children: <EventCard event={event} userRole={userRole} onEdit={setSelectedEvent} onDelete={handleEventAction} />
                }))}
              />
            )}
          </Card>
        </Col>

        {/* Upcoming Events */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  <CalendarOutlined />
                </div>
                <span>Upcoming Events</span>
                <Badge count={upcomingEvents.length} />
              </Space>
            }
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              minHeight: '400px'
            }}
            styles={{ body: { padding: '16px' } }}
          >
            {upcomingEvents.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No upcoming events"
                style={{ margin: '40px 0' }}
              />
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <Timeline
                  items={upcomingEvents.slice(0, 10).map(event => ({
                    key: event.id,
                    dot: <CalendarTwoTone twoToneColor={['#52c41a', '#73d13d']} />,
                    children: <EventCard event={event} userRole={userRole} onEdit={setSelectedEvent} onDelete={handleEventAction} />
                  }))}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* Past Events */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #bfbfbf 0%, #d9d9d9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  <HistoryOutlined />
                </div>
                <span>Past Events</span>
              </Space>
            }
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              minHeight: '400px'
            }}
            styles={{ body: { padding: '16px' } }} 
          >
            {pastEvents.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No past events"
                style={{ margin: '40px 0' }}
              />
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <Timeline
                  items={pastEvents.slice(0, 5).map(event => ({
                    key: event.id,
                    dot: <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#bfbfbf' 
                    }} />,
                    style: { opacity: 0.7 },
                    children: <EventCard event={event} userRole={userRole} isPast={true} />
                  }))}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Event Modal */}
      <Modal
        title={
          <Space>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <CalendarOutlined />
            </div>
            <span>{selectedEvent ? 'Edit Event' : 'Add New Event'}</span>
          </Space>
        }
        open={eventModal}
        onCancel={() => {
          setEventModal(false);
          setSelectedEvent(null);
          eventForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setEventModal(false)}>
            Cancel
          </Button>,
          selectedEvent && (
            <Popconfirm
              title="Are you sure you want to delete this event?"
              onConfirm={() => handleEventAction(null, 'delete')}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                key="delete"
                danger
                loading={loading}
              >
                Delete
              </Button>
            </Popconfirm>
          ),
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => eventForm.submit()}
            loading={loading}
            style={{
              background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
              border: 'none'
            }}
          >
            {selectedEvent ? 'Update Event' : 'Create Event'}
          </Button>
        ].filter(Boolean)}
        width={600}
      >
        <EventForm 
          form={eventForm} 
          onFinish={(values) => handleEventAction(values, selectedEvent ? 'update' : 'create')}
          initialValues={selectedEvent}
        />
      </Modal>
    </div>
  );
};

export default Events;