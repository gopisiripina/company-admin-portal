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
    const today = dayjs();
    const upcomingEvents = events.filter(event => dayjs(event.event_date).isAfter(today.subtract(1, 'day')));
    const todayEvents = events.filter(event => dayjs(event.event_date).isSame(today, 'day'));
    const pastEvents = events.filter(event => dayjs(event.event_date).isBefore(today, 'day'));

    return (
      <Spin spinning={loading}>
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
            <Row align="middle" justify="space-between" gutter={[16, 16]}>
              <Col>
                <Space size="large">
                  <Avatar size={64} icon={<CalendarOutlined />} style={{ backgroundColor: '#03481def' }} />
                  <div>
                    <Title level={2} style={{ margin: 0, color: '#03481def' }}>Company Events</Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                      {userRole === 'employee' ? "Stay updated with company events" : "Manage company events and announcements"}
                    </Text>
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
                      background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      height: '50px',
                      padding: '0 24px'
                    }}
                  >
                    Add Event
                  </Button>
                </Col>
              )}
            </Row>
          </Card>

          {/* Event Timelines */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card title="Today's Events" style={{ borderRadius: '12px', minHeight: '400px' }}>
                {todayEvents.length > 0 ? (
                  <Timeline
                    items={todayEvents.map(event => ({
                      key: event.id,
                      dot: <ClockCircleOutlined style={{ color: '#ff4d4f' }} />,
                      children: <EventCard event={event} userRole={userRole} onEdit={setSelectedEvent} onDelete={handleEventAction} />
                    }))}
                  />
                ) : <Empty description="No events today" />}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Upcoming Events" style={{ borderRadius: '12px', minHeight: '400px' }}>
                {upcomingEvents.length > 0 ? (
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <Timeline
                      items={upcomingEvents.slice(0, 10).map(event => ({
                        key: event.id,
                        dot: <CalendarTwoTone twoToneColor="#52c41a" />,
                        children: <EventCard event={event} userRole={userRole} onEdit={setSelectedEvent} onDelete={handleEventAction} />
                      }))}
                    />
                  </div>
                ) : <Empty description="No upcoming events" />}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Past Events" style={{ borderRadius: '12px', minHeight: '400px' }}>
                {pastEvents.length > 0 ? (
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <Timeline
                      items={pastEvents.slice(0, 5).map(event => ({
                        key: event.id,
                        dot: <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#bfbfbf' }} />,
                        children: <EventCard event={event} userRole={userRole} isPast={true} />
                      }))}
                    />
                  </div>
                ) : <Empty description="No past events" />}
              </Card>
            </Col>
          </Row>

          {/* Event Modal */}
          <Modal
            title={selectedEvent ? 'Edit Event' : 'Add New Event'}
            open={eventModal}
            onCancel={() => setEventModal(false)}
            footer={[
              <Button key="cancel" onClick={() => setEventModal(false)}>Cancel</Button>,
              <Button key="submit" type="primary" loading={loading} onClick={() => eventForm.submit()}>
                {selectedEvent ? 'Update Event' : 'Create Event'}
              </Button>,
            ]}
            width={600}
          >
            <EventForm 
              form={eventForm} 
              onFinish={(values) => handleEventAction(values, selectedEvent ? 'update' : 'create')} 
              initialValues={selectedEvent} 
            />
          </Modal>
        </div>
      </Spin>
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