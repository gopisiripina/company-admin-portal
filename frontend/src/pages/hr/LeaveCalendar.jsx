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
  Select, 
  Input,
  message,
  Avatar,
  Tooltip,
  Form,
  Radio,
  Alert,
  Calendar,
  Badge,
  Popconfirm
} from 'antd';
import { 
  CalendarOutlined,
  EditOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  CalendarTwoTone,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const LeaveCalendar = ({ userRole }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [companyCalendar, setCompanyCalendar] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  
  const [weeklyHolidayModal, setWeeklyHolidayModal] = useState(false);
  const [weeklyHolidayForm] = Form.useForm();
  const [pendingChanges, setPendingChanges] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch company calendar data
  const fetchCompanyCalendar = async () => {
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
    fetchCompanyCalendar();
  }, []);

  // Get calendar data for a specific date
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
    message.success('Changes saved locally. Click "Publish" to save to database.');
  };

  // Handle weekly holiday setup
  const handleWeeklyHolidaySetup = (values) => {
    const { weekday, year, holidayName, reason } = values;
    const startDate = dayjs(`${year}-01-01`);
    const endDate = dayjs(`${year}-12-31`);
    
    const weeklyDates = [];
    let currentDate = startDate;
    
    while (currentDate.day() !== weekday) {
      currentDate = currentDate.add(1, 'day');
    }
    
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
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
    message.success(`${weeklyDates.length} ${dayjs().day(weekday).format('dddd')}s marked as holidays for ${year}. Click "Publish" to save.`);
  };

  // Publish all pending changes to database
  const handlePublishChanges = async () => {
    if (!hasUnsavedChanges || Object.keys(pendingChanges).length === 0) {
      message.info('No changes to publish');
      return;
    }
    
    setLoading(true);
    try {
      const changesToPublish = Object.values(pendingChanges);
      
      const { error } = await supabase
        .from('company_calendar')
        .upsert(changesToPublish, { onConflict: 'date' });

      if (error) throw error;
      
      await fetchCompanyCalendar();
      
      setPendingChanges({});
      setHasUnsavedChanges(false);
      
      message.success(`${changesToPublish.length} changes published successfully!`);
      
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
    message.success('Pending changes discarded');
  };

  // Date cell render for calendar
  const dateCellRender = (value) => {
    const calendarData = getCalendarData(value);
    const isToday = value.isSame(dayjs(), 'day');
    
    const effectiveDayType = calendarData?.day_type || 'working';
    
    return (
      <div 
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
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '2px',
          right: '2px',
          zIndex: 1
        }}>
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
    );
  };

  const getDateBackground = (calendarData, isToday) => {
    if (isToday) {
      return 'linear-gradient(135deg, rgba(13, 113, 57, 0.1) 0%, rgba(13, 113, 57, 0.05) 100%)';
    }
    
    if (!calendarData) {
      return 'transparent';
    }
    
    switch (calendarData.day_type) {
      case 'holiday':
        return 'linear-gradient(135deg, rgba(255, 77, 79, 0.08) 0%, rgba(255, 77, 79, 0.03) 100%)';
      case 'half_day':
        return 'linear-gradient(135deg, rgba(250, 173, 20, 0.08) 0%, rgba(250, 173, 20, 0.03) 100%)';
      default:
        return 'transparent';
    }
  };

  const getDateBorder = (calendarData, isToday) => {
    if (isToday) {
      return '2px solid #0D7139';
    }
    if (!calendarData) return 'none';
    
    switch (calendarData.day_type) {
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

  return (
    <>
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
        
        .calendar-date-cell.weekend {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%);
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
        
        .ant-picker-calendar-header .ant-picker-calendar-year-select,
        .ant-picker-calendar-header .ant-picker-calendar-month-select {
          min-width: 120px !important;
        }
      `}</style>

      <Card style={{ 
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        border: 'none',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          marginBottom: '24px',
          padding: '16px',
          background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(13, 113, 57, 0.1)'
        }}>
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

          {userRole !== 'employee' && (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center'
              }}>
                <Tooltip title="Set Weekly Holiday">
                  <Button 
                    icon={<CalendarOutlined style={{ fontSize: '14px' }} />}
                    size="middle"
                    style={{ 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      minWidth: '90px',
                      height: '36px'
                    }}
                    onClick={() => {
                      weeklyHolidayForm.resetFields();
                      setWeeklyHolidayModal(true);
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>Weekly Holiday</span>
                  </Button>
                </Tooltip>
                
                <Tooltip title="Quick Add Holiday">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined style={{ fontSize: '14px' }} />}
                    size="middle"
                    style={{
                      background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      minWidth: '80px',
                      height: '36px'
                    }}
                    onClick={() => {
                      setSelectedCalendarDate(dayjs());
                      calendarForm.resetFields();
                      calendarForm.setFieldsValue({ dayType: 'holiday' });
                      setEditModal(true);
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>Add Holiday</span>
                  </Button>
                </Tooltip>
              </div>

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
                    style={{ fontSize: '10px' }}
                  >
                    <Button 
                      type="primary"
                      icon={<SaveOutlined style={{ fontSize: '14px' }} />}
                      size="middle"
                      style={{
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        minWidth: '100px',
                        height: '36px'
                      }}
                      onClick={handlePublishChanges}
                      loading={loading}
                    >
                      <span style={{ fontSize: '12px' }}>Publish</span>
                    </Button>
                  </Badge>
                  
                  <Button 
                    icon={<CloseCircleOutlined style={{ fontSize: '14px' }} />}
                    size="middle"
                    danger
                    style={{ 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      minWidth: '80px',
                      height: '36px'
                    }}
                    onClick={handleDiscardChanges}
                  >
                    <span style={{ fontSize: '12px' }}>Discard</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {userRole !== 'employee' && (
          <Modal
            title={
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
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
                style={{ marginRight: '8px' }}
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
            width="90%"
            style={{ maxWidth: '500px' }}
            centered
          >
            <Form
              form={weeklyHolidayForm}
              layout="vertical"
              onFinish={handleWeeklyHolidaySetup}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="weekday"
                    label="Select Weekday"
                    rules={[{ required: true, message: 'Please select a weekday' }]}
                  >
                    <Select 
                      placeholder="Choose weekday"
                      size="large"
                      style={{ borderRadius: '8px' }}
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
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="year"
                    label="Select Year"
                    rules={[{ required: true, message: 'Please select a year' }]}
                  >
                    <Select 
                      placeholder="Choose year"
                      size="large"
                      style={{ borderRadius: '8px' }}
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
                  style={{ borderRadius: '8px' }}
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
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            </Form>
          </Modal>
        )}
        
        <div style={{ padding: '0 8px' }}>
          <style>{`
            .ant-picker-calendar {
              background: transparent !important;
            }
            
            @media (max-width: 768px) {
              .ant-picker-calendar .ant-picker-calendar-header {
                flex-wrap: wrap;
                gap: 8px;
              }
              
              .ant-picker-calendar .ant-picker-calendar-date {
                height: 40px;
              }
              
              .ant-picker-calendar .ant-picker-calendar-date-content {
                font-size: 12px;
              }
            }
          `}</style>
          
          <Calendar 
            key={companyCalendar.length}
            cellRender={(value, info) => {
              if (info.type === 'date') {
                return dateCellRender(value);
              }
              return info.originNode;
            }}
            onSelect={(date) => setSelectedDate(date)}
            headerRender={({ value, type, onChange, onTypeChange }) => (
              <div style={{ 
                padding: '16px', 
                background: 'white',
                borderBottom: '1px solid #f0f0f0',
                borderRadius: '12px 12px 0 0'
              }}>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <Select
                      size="large"
                      value={value.month()}
                      onChange={(month) => {
                        const newValue = value.clone().month(month);
                        onChange(newValue);
                      }}
                      style={{ 
                        minWidth: '120px',
                        flex: '1 1 auto'
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <Option key={i} value={i}>
                          {dayjs().month(i).format('MMMM')}
                        </Option>
                      ))}
                    </Select>
                    
                    <Select
                      size="large"
                      value={value.year()}
                      onChange={(year) => {
                        const newValue = value.clone().year(year);
                        onChange(newValue);
                      }}
                      style={{ 
                        minWidth: '90px',
                        flex: '0 0 auto'
                      }}
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = dayjs().year() - 5 + i;
                        return (
                          <Option key={year} value={year}>
                            {year}
                          </Option>
                        );
                      })}
                    </Select>
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Button 
                      onClick={() => {
                        const today = dayjs();
                        onChange(today);
                      }}
                      style={{ 
                        borderRadius: '6px',
                        minWidth: '70px'
                      }}
                    >
                      Today
                    </Button>
                    
                    <div style={{ 
                      display: 'flex',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <Button 
                        type={type === 'month' ? 'primary' : 'default'}
                        onClick={() => onTypeChange('month')}
                        style={{ 
                          borderRadius: '0',
                          border: 'none',
                          minWidth: '60px'
                        }}
                      >
                        Month
                      </Button>
                      <Button 
                        type={type === 'year' ? 'primary' : 'default'}
                        onClick={() => onTypeChange('year')}
                        style={{ 
                          borderRadius: '0',
                          border: 'none',
                          borderLeft: '1px solid #d9d9d9',
                          minWidth: '60px'
                        }}
                      >
                        Year
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          />
        </div>
      </Card>

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
          styles={{
            header: {
              padding: '20px 24px',
              borderBottom: '1px solid #f0f0f0'
            },
            body: {
              padding: '24px'
            }
          }}
        >
          <Form
            form={calendarForm}
            layout="vertical"
            onFinish={handleCalendarUpdate}
            initialValues={{ dayType: 'working' }}
          >
            <Form.Item
              name="dayType"
              label={
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Day Type
                </span>
              }
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
                    label={
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        Holiday Name
                      </span>
                    }
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
              label={
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Description
                </span>
              }
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
                  <Switch 
                    size="small"
                    style={{
                      background: '#52c41a'
                    }}
                  />
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
    </>
  );
};

export default LeaveCalendar;