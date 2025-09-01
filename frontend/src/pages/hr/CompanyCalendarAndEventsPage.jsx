import React, { useState, useEffect } from 'react';
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
  Dropdown,
  message,
  Spin
} from 'antd';
import {
  BarChartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';
import axios from 'axios';
const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

export default function CalendarManagement( userRole = 'employee', currentUserId ) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [disasterModalVisible, setDisasterModalVisible] = useState(false);
  const [holidayForm] = Form.useForm();
  const [eventForm] = Form.useForm();
  const [disasterForm] = Form.useForm();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [disasters, setDisasters] = useState([]);
  const [currentViewDate, setCurrentViewDate] = useState(dayjs());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
const [permissions, setPermissions] = useState({});
const [editingDisaster, setEditingDisaster] = useState(null);
const [workingDaysConfig, setWorkingDaysConfig] = useState({
  monday: true,
  tuesday: true, 
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false
});
  // Database state
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  
useEffect(() => {
  const actualUserRole = typeof userRole === 'object' ? userRole.userRole : userRole;
  if (!actualUserRole) return;
  const isPrivilegedRole = actualUserRole === 'superadmin' || actualUserRole === 'admin' || actualUserRole === 'hr';
  const newPermissions = {
    canManageHolidays: isPrivilegedRole,
    canManageWorkingDays: isPrivilegedRole,
    canManageEvents: isPrivilegedRole,
    canAddEmergency: isPrivilegedRole,
    canEditEmergency: isPrivilegedRole,
    canViewAll: true,
    canViewHolidays: true,
    canViewWorkingDays: true,
    canViewEvents: true
  };
  
  console.log('Setting permissions for role:', userRole, 'isPrivileged:', isPrivilegedRole, newPermissions);
  setPermissions(newPermissions);
}, [userRole]);

const fetchDisasters = async () => {
  try {
    const { data, error } = await supabase
      .from('company_calendar')
      .select('*')
      .eq('day_type', 'disaster')
      .order('date', { ascending: false });
    
    if (error) throw error;
    setDisasters(data || []);
  } catch (error) {
    console.error('Error fetching disasters:', error);
    message.error('Failed to fetch disaster events');
  }
};

const createDisaster = async (values) => {
  try {
    setLoading(true);
    const disasterData = {
      date: values.startDate.format('YYYY-MM-DD'),
      day_type: 'disaster',
      holiday_name: values.eventName,
      reason: JSON.stringify({
        description: values.impactDescription,
        disasterType: values.disasterType,
        severityLevel: values.severityLevel,
        affectedAreas: values.affectedAreas,
        responsePlan: values.responsePlan,
        assignedTeam: values.assignedTeam,
        emergencyContact: values.emergencyContact,
        estimatedCost: values.estimatedCost,
        actualCost: values.actualCost,
        recoveryTimeline: values.recoveryTimeline,
        status: values.status,
        lessonsLearned: values.lessonsLearned,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null
      }),
      created_by:currentUserId || 'unknown_user'
    };

    const { error } = await supabase
      .from('company_calendar')
      .insert([disasterData]);

    if (error) throw error;
    
    message.success('Disaster event created successfully');
    await fetchDisasters();
    setDisasterModalVisible(false);
    disasterForm.resetFields();
  } catch (error) {
    console.error('Error creating disaster:', error);
    message.error('Failed to create disaster event');
  } finally {
    setLoading(false);
  }
};
  const syncGovernmentHolidays = async (year = selectedYear) => {
  try {
    setLoading(true);
    
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const targetUrl = encodeURIComponent(`https://api.11holidays.com/v1/holidays?country=IN&year=${year}`);
    
    const response = await axios({
      method: 'GET',
      url: proxyUrl + targetUrl,
      timeout: 15000
    });
    
    const indianHolidays = JSON.parse(response.data.contents);
    
    if (!Array.isArray(indianHolidays)) {
      throw new Error('Invalid API response format');
    }

    let successCount = 0;
    for (const holiday of indianHolidays) {
      try {
        const { data: existing } = await supabase
          .from('company_calendar')
          .select('id')
          .eq('date', holiday.date)
          .eq('day_type', 'holiday')
          .single();

        if (!existing) {
          const { error } = await supabase.from('company_calendar').insert({
            date: holiday.date,
            day_type: 'holiday',
            holiday_name: holiday.name || holiday.localName,
            reason: holiday.localName ? `${holiday.localName} - Government of India` : `${holiday.name} - Government of India`,
            is_mandatory: true,
            created_by: 'system'
          });
          
          if (!error) successCount++;
        }
      } catch (insertError) {
        console.error('Error inserting holiday:', insertError);
      }
    }
    
    message.success(`${successCount} government holidays synced for ${year}`);
    await fetchHolidays();
  } catch (error) {
    console.error('Error syncing holidays:', error);
    message.error(`Failed to sync government holidays for ${year}: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
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
  }
];

const updateDisaster = async (values) => {
  try {
    setLoading(true);
    const disasterData = {
      date: values.startDate.format('YYYY-MM-DD'),
      holiday_name: values.eventName,
      reason: JSON.stringify({
        description: values.impactDescription,
        disasterType: values.disasterType,
        severityLevel: values.severityLevel,
        affectedAreas: values.affectedAreas,
        responsePlan: values.responsePlan,
        assignedTeam: values.assignedTeam,
        emergencyContact: values.emergencyContact,
        estimatedCost: values.estimatedCost,
        actualCost: values.actualCost,
        recoveryTimeline: values.recoveryTimeline,
        status: values.status,
        lessonsLearned: values.lessonsLearned,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null
      })
    };

    const { error } = await supabase
      .from('company_calendar')
      .update(disasterData)
      .eq('id', editingDisaster.id);

    if (error) throw error;
    
    message.success('Disaster event updated successfully');
    await fetchDisasters();
    setDisasterModalVisible(false);
    disasterForm.resetFields();
    setEditingDisaster(null);
  } catch (error) {
    console.error('Error updating disaster:', error);
    message.error('Failed to update disaster event');
  } finally {
    setLoading(false);
  }
};

const deleteDisaster = async (id) => {
  try {
    const { error } = await supabase
      .from('company_calendar')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    message.success('Disaster event deleted successfully');
    await fetchDisasters();
  } catch (error) {
    console.error('Error deleting disaster:', error);
    message.error('Failed to delete disaster event');
  }
};

  const handleEditDisaster = (disaster) => {
  const disasterInfo = disaster.reason ? JSON.parse(disaster.reason) : {};
  setEditingDisaster(disaster);
  disasterForm.setFieldsValue({
    eventName: disaster.holiday_name,
    startDate: dayjs(disaster.date),
    endDate: disasterInfo.endDate ? dayjs(disasterInfo.endDate) : null,
    disasterType: disasterInfo.disasterType,
    severityLevel: disasterInfo.severityLevel,
    affectedAreas: disasterInfo.affectedAreas,
    impactDescription: disasterInfo.description,
    responsePlan: disasterInfo.responsePlan,
    assignedTeam: disasterInfo.assignedTeam,
    emergencyContact: disasterInfo.emergencyContact,
    estimatedCost: disasterInfo.estimatedCost,
    actualCost: disasterInfo.actualCost,
    recoveryTimeline: disasterInfo.recoveryTimeline,
    status: disasterInfo.status,
    lessonsLearned: disasterInfo.lessonsLearned
  });
  setDisasterModalVisible(true);
};

  // Database operations
  const fetchHolidays = async () => {
  try {
    console.log('Fetching holidays...');
    const { data, error } = await supabase
      .from('company_calendar')
      .select('*')
      .eq('day_type', 'holiday')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    
    setHolidays(data || []);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    message.error('Failed to fetch holidays');
  }
};

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('Failed to fetch events');
    }
  };

  const createHoliday = async (values) => {
    if (!permissions.canManageHolidays) {
    message.error('You do not have permission to manage holidays');
    return;
  }
    try {
      setLoading(true);
      const startDate = values.startDate;
const endDate = values.endDate || values.startDate;
const holidayRecords = [];

// Generate records for each date in the range
let currentDate = startDate;
while (currentDate.isSameOrBefore(endDate, 'day')) {
  holidayRecords.push({
    date: currentDate.format('YYYY-MM-DD'),
    day_type: 'holiday',
    holiday_name: values.holidayName,
    reason: values.description || null,
    is_mandatory: values.type === 'National' ? true : false,
    holiday_type: values.type,
    created_by: currentUserId
  });
  currentDate = currentDate.add(1, 'day');
}

const { data, error } = await supabase
  .from('company_calendar')
  .insert(holidayRecords)
  .select();

      if (error) throw error;
      
      message.success('Holiday created successfully');
      await fetchHolidays();
      setHolidayModalVisible(false);
      holidayForm.resetFields();
    } catch (error) {
      console.error('Error creating holiday:', error);
      message.error('Failed to create holiday');
    } finally {
      setLoading(false);
    }
  };

  const updateHoliday = async (values) => {
  if (!permissions.canManageHolidays) {
    message.error('You do not have permission to manage holidays');
    return;
  }
  
  try {
    setLoading(true);
    
    // First, we need to handle the complexity of updating a holiday that might span multiple dates
    // The approach is to delete the old holiday record(s) and create new ones
    
    // Delete the existing holiday record
    const { error: deleteError } = await supabase
      .from('company_calendar')
      .delete()
      .eq('id', editingHoliday.id);

    if (deleteError) throw deleteError;

    // Now create new records for the date range
    const startDate = values.startDate;
    const endDate = values.endDate || values.startDate;
    const holidayRecords = [];

    // Generate records for each date in the range
    let currentDate = startDate;
    while (currentDate.isSameOrBefore(endDate, 'day')) {
      holidayRecords.push({
        date: currentDate.format('YYYY-MM-DD'),
        day_type: 'holiday',
        holiday_name: values.holidayName,
        reason: values.description || null,
        is_mandatory: values.type === 'National' ? true : false,
        holiday_type: values.type,
        created_by: currentUserId || editingHoliday.created_by // Preserve original creator if currentUserId is not available
      });
      currentDate = currentDate.add(1, 'day');
    }

    // Insert the new holiday records
    const { data, error } = await supabase
      .from('company_calendar')
      .insert(holidayRecords)
      .select();

    if (error) throw error;
    
    const dayCount = holidayRecords.length;
    message.success(`Holiday updated successfully${dayCount > 1 ? ` for ${dayCount} days` : ''}`);
    await fetchHolidays();
    setHolidayModalVisible(false);
    holidayForm.resetFields();
    setEditingHoliday(null);
  } catch (error) {
    console.error('Error updating holiday:', error);
    message.error('Failed to update holiday');
  } finally {
    setLoading(false);
  }
};
  const deleteHoliday = async (id) => {
  try {
    const { error } = await supabase
      .from('company_calendar')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    message.success('Holiday deleted successfully');
    await fetchHolidays();
  } catch (error) {
    console.error('Error deleting holiday:', error);
    message.error('Failed to delete holiday');
  }
};

  const createEvent = async (values) => {
    if (!permissions.canManageEvents) {
    message.error('You do not have permission to manage events');
    return;
  }
    try {
      setLoading(true);
      const eventData = {
        event_title: values.eventTitle,
        description: values.description || null,
        start_date: values.startDate.format('YYYY-MM-DD'),
        end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        start_time: values.startTime ? values.startTime.format('HH:mm:ss') : null,
        end_time: values.endTime ? values.endTime.format('HH:mm:ss') : null,
        event_type: values.eventType,
        priority: values.priority,
        location: values.location || null,
        attendees: values.attendees || null,
        status: values.status,
        enable_reminder: values.enableReminder || true
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select();

      if (error) throw error;
      
      message.success('Event created successfully');
      await fetchEvents();
      setEventModalVisible(false);
      eventForm.resetFields();
    } catch (error) {
      console.error('Error creating event:', error);
      message.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (values) => {
    if (!permissions.canManageEvents) {
    message.error('You do not have permission to manage events');
    return;
  }
    try {
      setLoading(true);
      const eventData = {
        event_title: values.eventTitle,
        description: values.description || null,
        start_date: values.startDate.format('YYYY-MM-DD'),
        end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        start_time: values.startTime ? values.startTime.format('HH:mm:ss') : null,
        end_time: values.endTime ? values.endTime.format('HH:mm:ss') : null,
        event_type: values.eventType,
        priority: values.priority,
        location: values.location || null,
        attendees: values.attendees || null,
        status: values.status,
        enable_reminder: values.enableReminder || true
      };

      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingEvent.id)
        .select();

      if (error) throw error;
      
      message.success('Event updated successfully');
      await fetchEvents();
      setEventModalVisible(false);
      eventForm.resetFields();
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      message.error('Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      message.success('Event deleted successfully');
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      message.error('Failed to delete event');
    }
  };

  // Load data on component mount
  // Remove the first useEffect and keep this one
useEffect(() => {
  const initializeData = async () => {
    await fetchHolidays();
    await fetchEvents();
    await fetchWorkingDaysConfig();
    await fetchDisasters();
    // Auto-sync government holidays if none exist
    if (permissions.canManageHolidays) {
      try {
        const { data } = await supabase
          .from('company_calendar')
          .select('id')
          .eq('created_by', 'system')
          .limit(1);
        
        if (!data || data.length === 0) {
          await syncGovernmentHolidays();
        }
      } catch (error) {
        console.error('Error checking existing holidays:', error);
      }
    }
  };
  
  initializeData();
}, [permissions.canManageHolidays,userRole]);

 // Calculate statistics for the current view month
const currentMonth = currentViewDate.format('YYYY-MM');
const currentMonthHolidays = holidays.filter(holiday => 
  dayjs(holiday.date).format('YYYY-MM') === currentMonth
);
const currentMonthEvents = events.filter(event => 
  dayjs(event.start_date).format('YYYY-MM') === currentMonth
);

// Calculate working days for the specific month
const daysInCurrentMonth = currentViewDate.daysInMonth();
const startOfMonth = currentViewDate.startOf('month');
let workingDaysCount = 0;
let weekendDaysCount = 0;

for (let i = 0; i < daysInCurrentMonth; i++) {
  const currentDay = startOfMonth.add(i, 'day');
  const dayOfWeek = currentDay.day();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  if (workingDaysConfig[dayName]) {
    workingDaysCount++;
  } else {
    weekendDaysCount++;
  }
}

// Subtract holidays from working days
const actualWorkingDays = workingDaysCount - currentMonthHolidays.length;

useEffect(() => {
  fetchHolidays();
  fetchEvents();
  
  // Auto-sync government holidays if none exist
  const autoSyncHolidays = async () => {
    const { data } = await supabase
      .from('company_calendar')
      .select('id')
      .eq('created_by', 'system')
      .limit(1);
    
    if (!data || data.length === 0) {
      await syncGovernmentHolidays();
    }
  };
  
  if (permissions.canManageHolidays) {
    autoSyncHolidays();
  }
}, [permissions]);
const getListData = (value) => {
  const valueDateStr = value.format('YYYY-MM-DD');
  let listData = [];

  // Check company_calendar for holidays
  holidays.forEach(holiday => {
    if (holiday.date === valueDateStr) {
      let badgeType = 'error'; // Default for holidays
      
      // Map holiday types from API
      if (holiday.is_mandatory) {
        badgeType = 'error'; // National/Public holidays - red
      } else if (holiday.created_by === 'system') {
        badgeType = 'warning'; // Restricted holidays - orange
      } else {
        badgeType = 'processing'; // Company holidays - blue
      }
      
      listData.push({ 
        type: badgeType, 
        content: holiday.is_mandatory ? 'National Holiday' : 'Holiday'
      });
    }
  });
    // Check for events
    events.forEach(event => {
      const startDateStr = dayjs(event.start_date).format('YYYY-MM-DD');
      const endDateStr = event.end_date ? dayjs(event.end_date).format('YYYY-MM-DD') : startDateStr;
      
      // Simple string comparison for dates
      if (valueDateStr >= startDateStr && valueDateStr <= endDateStr) {
        listData.push({ type: 'success', content: 'Event/Meeting' });
      }
    });

    // Check for weekends
    const dayOfWeek = value.day(); // 0=Sunday, 1=Monday, etc.
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayName = dayNames[dayOfWeek];

if (!workingDaysConfig[dayName]) {
  listData.push({ type: 'warning', content: 'Non-working Day' });
}

    return listData;
  };

  const dateCellRender = (value) => {
  const listData = getListData(value);
  
  const hasHoliday = listData.some(item => item.content.includes('Holiday'));
  const hasEvent = listData.some(item => item.content === 'Event/Meeting');
  const isNonWorking = listData.some(item => item.content === 'Non-working Day');
  
  // Apply CSS classes for styling
  setTimeout(() => {
    const cellElement = document.querySelector(`[title="${value.format('YYYY-MM-DD')}"]`)?.closest('.ant-picker-cell');
    if (cellElement) {
      // Remove existing classes
      cellElement.classList.remove('holiday-day', 'event-day', 'holiday-event-day', 'non-working-day');
      
      // Add appropriate class
      if (hasHoliday && hasEvent) {
        cellElement.classList.add('holiday-event-day');
      } else if (hasHoliday) {
        cellElement.classList.add('holiday-day');
      } else if (hasEvent) {
        cellElement.classList.add('event-day');
      } else if (isNonWorking) {
        cellElement.classList.add('non-working-day');
      }
    }
  }, 0);
  
  return null;
};

// Add this useEffect after the existing ones
useEffect(() => {
  // Add CSS for calendar day styling
  const style = document.createElement('style');
  style.textContent = `
    .ant-picker-cell {
      position: relative;
    }
    
    .ant-picker-cell.holiday-day .ant-picker-cell-inner {
      background-color: #ff4d4f !important;
      color: white !important;
    }
    
    .ant-picker-cell.event-day .ant-picker-cell-inner {
      background-color: #52c41a !important;
      color: white !important;
    }
    
    .ant-picker-cell.holiday-event-day .ant-picker-cell-inner {
      background: linear-gradient(45deg, #ff4d4f 50%, #52c41a 50%) !important;
      color: white !important;
    }
    
    .ant-picker-cell.non-working-day .ant-picker-cell-inner {
      background-color: #faad14 !important;
      color: white !important;
    }
  `;
  document.head.appendChild(style);
  
  return () => document.head.removeChild(style);
}, []);

const calendarCellStyle = {
  '.ant-picker-cell-inner': {
    position: 'relative',
    zIndex: 1
  },
  '.ant-picker-cell': {
    position: 'relative'
  }
};
  const onSelect = (newValue) => {
    setSelectedDate(newValue);
  };

const checkAPIConnection = async () => {
  try {
    const response = await fetch('https://api.11holidays.com/v1/holidays?country=IN&year=2025');
    return response.ok;
  } catch (error) {
    return false;
  }
};

const getSelectedDateEvents = () => {
  const currentSelectedDate = dayjs.isDayjs(selectedDate) ? selectedDate : dayjs(selectedDate);
  const selectedDateStr = currentSelectedDate.format('YYYY-MM-DD');
  const dateEvents = [];

  // Get holidays for selected date
  holidays.forEach(holiday => {
  if (selectedDateStr === holiday.date) {
    dateEvents.push({
      type: 'holiday',
      title: holiday.holiday_name,
      description: holiday.reason,
      time: null,
      holidayType: holiday.holiday_type || (holiday.is_mandatory ? 'National' : 'Company')

    });
  }
});

  // Get events for selected date
  events.forEach(event => {
    const startDateStr = dayjs(event.start_date).format('YYYY-MM-DD');
    const endDateStr = event.end_date ? dayjs(event.end_date).format('YYYY-MM-DD') : startDateStr;
    
    if (selectedDateStr >= startDateStr && selectedDateStr <= endDateStr) {
      dateEvents.push({
        type: 'event',
        title: event.event_title,
        description: event.description,
        time: event.start_time ? dayjs(event.start_time, 'HH:mm:ss').format('HH:mm') : null,
        location: event.location,
        priority: event.priority,
        eventType: event.event_type
      });
    }
  });

  return dateEvents;
};
  const handleEditHoliday = (holiday) => {
  setEditingHoliday(holiday);
  holidayForm.setFieldsValue({
    holidayName: holiday.holiday_name,
    startDate: dayjs(holiday.date),  // Changed from start_date to date
    description: holiday.reason,     // Changed from description to reason
    type: holiday.is_mandatory ? 'National' : 'Company'
  });
  setHolidayModalVisible(true);
};

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    eventForm.setFieldsValue({
      eventTitle: event.event_title,
      description: event.description,
      startDate: dayjs(event.start_date),
      endDate: event.end_date ? dayjs(event.end_date) : null,
      startTime: event.start_time ? dayjs(event.start_time, 'HH:mm:ss') : null,
      endTime: event.end_time ? dayjs(event.end_time, 'HH:mm:ss') : null,
      eventType: event.event_type,
      priority: event.priority,
      location: event.location,
      attendees: event.attendees,
      status: event.status,
      enableReminder: event.enable_reminder
    });
    setEventModalVisible(true);
  };

  const fetchWorkingDaysConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('company_calendar')
      .select('*')
      .eq('day_type', 'working_day_config')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }
    
    if (data && data.reason) {
      // Parse the JSON stored in reason field
      const config = JSON.parse(data.reason);
      setWorkingDaysConfig(config);
    } else {
      // Create default config if none exists
      const defaultConfig = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      };
      setWorkingDaysConfig(defaultConfig);
      await saveWorkingDaysConfig(defaultConfig);
    }
  } catch (error) {
    console.error('Error fetching working days config:', error);
    message.error('Failed to fetch working days configuration');
  }
};

const saveWorkingDaysConfig = async (config) => {
  try {
    setLoading(true);
    
    // Check if config record exists
    const { data: existing } = await supabase
      .from('company_calendar')
      .select('id')
      .eq('day_type', 'working_day_config')
      .single();
    
    const configData = {
      date: '1970-01-01', // Dummy date for config record
      day_type: 'working_day_config',
      holiday_name: 'Working Days Configuration',
      reason: JSON.stringify(config), // Store config as JSON in reason field
      created_by: 'current_user'
    };
    
    if (existing) {
      // Update existing config
      const { error } = await supabase
        .from('company_calendar')
        .update(configData)
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Insert new config
      const { error } = await supabase
        .from('company_calendar')
        .insert([configData]);
      
      if (error) throw error;
    }
    
    message.success('Working days configuration saved successfully');
  } catch (error) {
    console.error('Error saving working days config:', error);
    message.error('Failed to save working days configuration');
  } finally {
    setLoading(false);
  }
};

  const handleHolidaySubmit = async () => {
    try {
      const values = await holidayForm.validateFields();
      if (editingHoliday) {
        await updateHoliday(values);
      } else {
        await createHoliday(values);
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleEventSubmit = async () => {
    try {
      const values = await eventForm.validateFields();
      if (editingEvent) {
        await updateEvent(values);
      } else {
        await createEvent(values);
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

const upcomingEvents = [
  ...holidays.map(holiday => ({
    ...holiday,
    itemType: 'holiday',
    displayTitle: holiday.holiday_name,
    displayDate: holiday.date  // Changed from start_date to date
  })),
  ...events.map(event => ({
    ...event,
    itemType: 'event',
    displayTitle: event.event_title,
    displayDate: event.start_date
  }))
]
  .filter(item => {
    const startDate = dayjs(item.displayDate);
    return startDate.isAfter(dayjs(), 'day') || startDate.isSame(dayjs(), 'day');
  })
  .sort((a, b) => dayjs(a.displayDate).diff(dayjs(b.displayDate)))
  .slice(0, 5);

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
  {currentViewDate.format('MMMM YYYY')} Summary
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
        value={daysInCurrentMonth}
        valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
      />
    </Card>
  </Col>
  <Col span={4}>
    <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
      <Statistic
        title="Working Days"
        value={actualWorkingDays}
        valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
      />
    </Card>
  </Col>
  <Col span={4}>
    <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
      <Statistic
        title="Weekends/Offs"
        value={weekendDaysCount}
        valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
      />
    </Card>
  </Col>
  <Col span={4}>
    <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f5ff', border: '1px solid #91d5ff' }}>
      <Statistic
        title="Holidays"
        value={currentMonthHolidays.length}
        valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
      />
    </Card>
  </Col>
  <Col span={4}>
    <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f9f0ff', border: '1px solid #d3adf7' }}>
      <Statistic
        title="Events"
        value={currentMonthEvents.length}
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
        value={`${actualWorkingDays * 8}h 0m`}
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
                  <Text strong>Mon-Fri</Text>
                </Space>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={16}>
                <Card 
  title={
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>Calendar View</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button 
          type="text" 
          onClick={() => setCurrentViewDate(prev => prev.subtract(1, 'month'))}
          style={{ marginRight: 8 }}
        >
          &lt;
        </Button>
        <Text strong style={{ minWidth: '120px', textAlign: 'center' }}>
          {currentViewDate.format('MMMM YYYY')}
        </Text>
        <Button 
          type="text" 
          onClick={() => setCurrentViewDate(prev => prev.add(1, 'month'))}
          style={{ marginLeft: 8 }}
        >
          &gt;
        </Button>
      </div>
    </div>
  }
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
                      <Badge status="error" text="Holiday" />
                      <Badge status="success" text="Event/Meeting" />
                      <Badge status="warning" text="Weekend/Non-working Day" />
                    </Space>
                  </div>
                  <Calendar
  fullscreen={false}
  dateCellRender={dateCellRender}
  onSelect={onSelect}
  value={currentViewDate}
  onChange={(date) => setCurrentViewDate(date)}
/>

                </Card>
              </Col>
              
              <Col span={8}>
                <Card title={`${selectedDate.format('MMM DD, YYYY')}`} size="small">
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">Today's events</Text>
                  </div>
             {getSelectedDateEvents().length > 0 ? (
  <List
    size="small"
    dataSource={getSelectedDateEvents()}
    renderItem={(item) => (
      <List.Item>
        <div>
          <div style={{ 
            fontWeight: 500,
            color: item.type === 'holiday' ? '#cf1322' : '#389e0d'
          }}>
            {item.title}
            {item.type === 'holiday' && (
              <Tag 
                color={
                  item.holidayType === 'National' ? 'red' :
                  item.holidayType === 'Regional' ? 'orange' :
                  item.holidayType === 'Company' ? 'blue' :
                  item.holidayType === 'Religious' ? 'purple' : 'default'
                }
                size="small"
                style={{ marginLeft: 8 }}
              >
                {item.holiday_type || (item.is_mandatory ? 'National' : 
 item.created_by === 'system' ? 'Restricted' : 'Company')} Holiday
              </Tag>
            )}
            {item.type === 'event' && (
              <Tag 
                color="green"
                size="small"
                style={{ marginLeft: 8 }}
              >
                {item.eventType}
              </Tag>
            )}
          </div>
          {item.time && <Text type="secondary">Time: {item.time}</Text>}
          {item.location && <div><Text type="secondary">Location: {item.location}</Text></div>}
          {item.priority && (
            <div>
              <Tag 
                color={
                  item.priority === 'Critical' ? 'red' : 
                  item.priority === 'High' ? 'orange' : 
                  item.priority === 'Medium' ? 'yellow' : 'blue'
                }
                size="small"
              >
                {item.priority}
              </Tag>
            </div>
          )}
          {item.description && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {item.description}
              </Text>
            </div>
          )}
        </div>
      </List.Item>
    )}
  />
) : (
  <div style={{ textAlign: 'center', padding: '40px 0' }}>
    <Text type="secondary">No events for this date</Text>
  </div>
)}
                </Card>
              </Col>
            </Row>

            <Card 
              title="Upcoming Events" 
              size="small" 
              style={{ marginTop: 24 }}
              extra={<Text type="secondary">Next 5 upcoming events across all categories</Text>}
            >
              {upcomingEvents.length > 0 ? (
            <List
  size="small"
  dataSource={upcomingEvents}
  renderItem={(item) => (
    <List.Item>
      <div>
        <div style={{ fontWeight: 500 }}>
          {item.displayTitle}
        </div>
        <Text type="secondary">
          {dayjs(item.displayDate).format('MMM DD, YYYY')}
          {dayjs(item.displayDate).isSame(dayjs(), 'day') && (
            <Tag color="blue" style={{ marginLeft: 8 }}>Today</Tag>
          )}
        </Text>
        {item.itemType === 'holiday' && (
  <Tag 
    color={
      item.is_mandatory ? 'red' :
      item.created_by === 'system' ? 'gold' : 'blue'
    }
    style={{ marginLeft: 8 }}
  >
    {item.is_mandatory ? 'National' : 
     item.created_by === 'system' ? 'Restricted' : 'Company'} Holiday
  </Tag>
)}
        {item.itemType === 'event' && (
          <Tag color="green" style={{ marginLeft: 8 }}>
            {item.event_type}
          </Tag>
        )}
      </div>
    </List.Item>
  )}
/>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">No upcoming events</Text>
                </div>
              )}
            </Card>
          </div>
        )}

        {selectedTab === 'holidays' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
  <Title level={4}>Holidays Management</Title>
  <Space>
  {permissions.canManageHolidays && (<Select 
    value={selectedYear}
    onChange={setSelectedYear}
    style={{ width: 100 }}
  >
    {Array.from({length: 10}, (_, i) => {
      const year = dayjs().year() + i - 2;
      return <Option key={year} value={year}>{year}</Option>;
    })}
  </Select>)}
  {permissions.canManageHolidays && (
  <Button 
    icon={<SyncOutlined spin={loading} />}
    onClick={() => syncGovernmentHolidays(selectedYear)}
    loading={loading}
  >
    Sync Indian Holidays {selectedYear}
  </Button>
)}
  {permissions.canManageHolidays && (
    <Button 
      type="primary" 
      icon={<PlusOutlined />}
      onClick={() => {
        setEditingHoliday(null);
        holidayForm.resetFields();
        setHolidayModalVisible(true);
      }}
    >
      Add Holiday
    </Button>
  )}
</Space>
</div>
           
            <Card>
              {holidays.length > 0 ? (
                <List
  dataSource={holidays}
  renderItem={(holiday) => (
    <List.Item
  actions={permissions.canManageHolidays ? [
  <Button 
    type="text" 
    icon={<EditOutlined />}
    onClick={() => handleEditHoliday(holiday)}
  >
    Edit
  </Button>,
  <Button 
    type="text" 
    icon={<DeleteOutlined />}
    danger
    onClick={() => {
      Modal.confirm({
        title: 'Delete Holiday',
        content: 'Are you sure you want to delete this holiday?',
        okText: 'Delete',
        okType: 'danger',
        onOk: () => deleteHoliday(holiday.id)
      });
    }}
  >
    Delete
  </Button>
] : []}
>
                      <List.Item.Meta
  title={holiday.holiday_name}
  description={
    <div>
      <Text type="secondary">
        {dayjs(holiday.date).format('MMM DD, YYYY')}
      </Text>
      <div>
        <Tag color={
  holiday.holiday_type === 'National' ? 'red' :
  holiday.holiday_type === 'Regional' ? 'orange' :
  holiday.holiday_type === 'Religious' ? 'purple' :
  holiday.holiday_type === 'Company' ? 'blue' : 'gold'
}>
  {holiday.holiday_type || (holiday.is_mandatory ? 'National' : 'Company')}
</Tag>
      </div>
      {holiday.reason && (
        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          {holiday.reason}
        </Text>
      )}
    </div>
  }
/>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">No holidays configured. Click "Add Holiday" to get started.</Text>
                </div>
              )}
            </Card>
            <Alert
  message="Note"
  description="Government holidays are automatically synced."
  type="info"
  showIcon
  style={{ marginBottom: 16 }}
/>
            {/* Add/Edit Holiday Modal */}
            <Modal
  title={editingHoliday ? "Edit Holiday Type" : "Add New Holiday"}
  open={holidayModalVisible}
  onCancel={() => {
    setHolidayModalVisible(false);
    holidayForm.resetFields();
    setEditingHoliday(null);
  }}
  footer={[
    <Button key="cancel" onClick={() => {
      setHolidayModalVisible(false);
      holidayForm.resetFields();
      setEditingHoliday(null);
    }}>
      Cancel
    </Button>,
    <Button 
      key="create" 
      type="primary" 
      loading={loading}
      onClick={handleHolidaySubmit}
    >
      {editingHoliday ? 'Update Type' : 'Create'}
    </Button>
  ]}
  width={600}
>
  <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
    {editingHoliday ? 'Update holiday type (National holidays can be changed to Regional/Company)' : 'Create a new holiday entry'}
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
              {permissions.canManageWorkingDays && (
  <Button type="primary" onClick={() => saveWorkingDaysConfig(workingDaysConfig)}>
    Save Configuration
  </Button>
)}
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
  checked={workingDaysConfig[day.toLowerCase()]} 
  onChange={(checked) => {
    setWorkingDaysConfig(prev => ({
      ...prev,
      [day.toLowerCase()]: checked
    }));
  }}
  size="small"
  disabled={!permissions.canManageWorkingDays}
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
                        disabled={!permissions.canManageWorkingDays}
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
                  <Select defaultValue="UTC" style={{ width: 200 }} disabled={!permissions.canManageWorkingDays}>
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
              {permissions.canManageEvents && (
  <Button 
    type="primary" 
    icon={<PlusOutlined />}
    onClick={() => {
      setEditingEvent(null);
      eventForm.resetFields();
      setEventModalVisible(true);
    }}
  >
    Add Event
  </Button>
)}
            </div>
            <Alert
              message="Event Management"
              description="Create, schedule, and manage events and meetings."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Card>
              {events.length > 0 ? (
                <List
                  dataSource={events}
                  renderItem={(event) => (
                    <List.Item
                      actions={permissions.canManageEvents ? [
  <Button 
    type="text" 
    icon={<EditOutlined />}
    onClick={() => handleEditEvent(event)}
  >
    Edit
  </Button>,
  <Button 
    type="text" 
    icon={<DeleteOutlined />}
    danger
    onClick={() => {
      Modal.confirm({
        title: 'Delete Event',
        content: 'Are you sure you want to delete this event?',
        okText: 'Delete',
        okType: 'danger',
        onOk: () => deleteEvent(event.id)
      });
    }}
  >
    Delete
  </Button>
] : []}
                    >
                      <List.Item.Meta
                        title={event.event_title}
                        description={
                          <div>
                            <Text type="secondary">
                              {dayjs(event.start_date).format('MMM DD, YYYY')}
                              {event.end_date && ` - ${dayjs(event.end_date).format('MMM DD, YYYY')}`}
                              {event.start_time && ` at ${dayjs(event.start_time, 'HH:mm:ss').format('HH:mm')}`}
                            </Text>
                            <div style={{ marginTop: 4 }}>
                              <Tag color="blue">{event.event_type}</Tag>
                              <Tag color={
                                event.priority === 'Critical' ? 'red' :
                                event.priority === 'High' ? 'orange' :
                                event.priority === 'Medium' ? 'yellow' : 'green'
                              }>
                                {event.priority}
                              </Tag>
                              <Tag color={
                                event.status === 'Completed' ? 'green' :
                                event.status === 'In Progress' ? 'blue' :
                                event.status === 'Cancelled' ? 'red' : 'default'
                              }>
                                {event.status}
                              </Tag>
                            </div>
                            {event.location && (
                              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                                📍 {event.location}
                              </Text>
                            )}
                            {event.description && (
                              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                                {event.description}
                              </Text>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">No events configured. Click "Add Event" to get started.</Text>
                </div>
              )}
            </Card>

            {/* Add/Edit Event Modal */}
            <Modal
              title={editingEvent ? "Edit Event" : "Add New Event"}
              open={eventModalVisible}
              onCancel={() => {
                setEventModalVisible(false);
                eventForm.resetFields();
                setEditingEvent(null);
              }}
              footer={[
                <Button key="cancel" onClick={() => {
                  setEventModalVisible(false);
                  eventForm.resetFields();
                  setEditingEvent(null);
                }}>
                  Cancel
                </Button>,
                <Button 
                  key="create" 
                  type="primary" 
                  loading={loading}
                  onClick={handleEventSubmit}
                >
                  {editingEvent ? 'Update' : 'Create'}
                </Button>
              ]}
              width={700}
            >
              <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
                {editingEvent ? 'Update event details' : 'Create a new event'}
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
              {disasters.length > 0 ? (
  <List
    dataSource={disasters}
    renderItem={(disaster) => {
      const disasterInfo = disaster.reason ? JSON.parse(disaster.reason) : {};
      return (
        <List.Item actions={[
  <Button 
    type="text" 
    icon={<EditOutlined />}
    onClick={() => handleEditDisaster(disaster)}
  >
    Edit
  </Button>,
  <Button 
    type="text" 
    icon={<DeleteOutlined />}
    danger
    onClick={() => {
      Modal.confirm({
        title: 'Delete Disaster Event',
        content: 'Are you sure you want to delete this disaster event?',
        okText: 'Delete',
        okType: 'danger',
        onOk: () => deleteDisaster(disaster.id)
      });
    }}
  >
    Delete
  </Button>
]}
>
          <List.Item.Meta
            title={disaster.holiday_name}
            description={
              <div>
                <Text type="secondary">
                  {dayjs(disaster.date).format('MMM DD, YYYY')}
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="red">{disasterInfo.disasterType}</Tag>
                  <Tag color={
                    disasterInfo.severityLevel === 'Critical' ? 'red' :
                    disasterInfo.severityLevel === 'High' ? 'orange' :
                    disasterInfo.severityLevel === 'Medium' ? 'yellow' : 'blue'
                  }>
                    {disasterInfo.severityLevel}
                  </Tag>
                  <Tag>{disasterInfo.status}</Tag>
                </div>
                {disasterInfo.description && (
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    {disasterInfo.description}
                  </Text>
                )}
              </div>
            }
          />
        </List.Item>
        
      );
    }}
  />
) : (
  <div style={{ textAlign: 'center', padding: '40px 0' }}>
    <Text type="secondary">No disaster events</Text>
  </div>
)}
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
                <Button 
  key="create" 
  type="primary" 
  loading={loading}
  onClick={async () => {
  try {
    const values = await disasterForm.validateFields();
    if (editingDisaster) {
      await updateDisaster(values);
    } else {
      await createDisaster(values);
    }
  } catch (error) {
    console.error('Form validation error:', error);
  }
}}
>
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
      </Content>
    </Layout>
  );
}