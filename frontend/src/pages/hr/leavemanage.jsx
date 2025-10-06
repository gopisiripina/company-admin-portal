import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './leavemanage.css';
import {
  Card,
  Button,
  DatePicker,
  Table,
  Modal,List,
  TimePicker,
  Row,
  Col,
  Switch,
  Typography,
  Space,
  Tag,
  InputNumber,
  Statistic,
  Select,
  Input,
  message,
  Divider,
  Avatar,
  Progress,
  Tabs,
  Badge,
  Tooltip,
  Empty,
  Spin,
  Form,
  Upload,
  Radio,
  Alert,
  Descriptions,
  Timeline,
  Drawer,
  Popconfirm,
  Calendar
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  BankOutlined,
  ExclamationCircleOutlined,
  NotificationOutlined,
  SendOutlined,
  UploadOutlined,
  PrinterOutlined,
  SearchOutlined,
  HistoryOutlined,
  ClockCircleFilled,
  CalendarTwoTone,
  CoffeeOutlined,
  SunOutlined,
  MoonOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween'; // <-- ADD THIS LINE
import { supabase } from '../../supabase/config';
import useSWR, { mutate } from 'swr';
import Analytics from './Analytics'; // Add this line - adjust path as needed
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { FaIndianRupeeSign } from "react-icons/fa6";

// import ErrorPage from '../../error/ErrorPage';

dayjs.extend(relativeTime);
dayjs.extend(isBetween); // <-- AND ADD THIS LINE
dayjs.extend(isSameOrBefore);


// Add this function after your imports
const uploadFileToSupabase = async (file, bucketName = 'leave-documents') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

 const getLeaveTypeConfig = (type) => {
    const configs = {
      'Permission': { color: '#1890ff', icon: <ClockCircleOutlined />, gradient: 'linear-gradient(45deg, #40a9ff 0%, #1890ff 100%)' },
      'Casual Leave': { color: '#52c41a', icon: <CalendarOutlined />, gradient: 'linear-gradient(45deg, #73d13d 0%, #52c41a 100%)' },
      'Earned Leave': { color: '#0D7139', icon: <BankOutlined />, gradient: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)' },
      'Medical Leave': { color: '#ff4d4f', icon: <MedicineBoxOutlined />, gradient: 'linear-gradient(45deg, #ff7875 0%, #ff4d4f 100%)' },
      'Maternity Leave': { color: '#eb2f96', icon: <MedicineBoxOutlined />, gradient: 'linear-gradient(45deg, #f759ab 0%, #eb2f96 100%)' },
      'Compensatory Leave': { color: '#722ed1', icon: <FaIndianRupeeSign/>, gradient: 'linear-gradient(45deg, #9254de 0%, #722ed1 100%)' },
      'On Duty': { color: '#13c2c2', icon: <TeamOutlined />, gradient: 'linear-gradient(45deg, #36cfc9 0%, #13c2c2 100%)' },
      'Excuses': { color: '#fa8c16', icon: <ExclamationCircleOutlined />, gradient: 'linear-gradient(45deg, #ffa940 0%, #fa8c16 100%)' },
      'Overtime': { color: '#a0d911', icon: <ThunderboltOutlined />, gradient: 'linear-gradient(45deg, #b7eb8f 0%, #a0d911 100%)' },
    };
    return configs[type] || { color: '#666', icon: <FileTextOutlined />, gradient: 'linear-gradient(45deg, #bfbfbf 0%, #666 100%)' };
  };

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Dummy data for employees
const fetcher = async (url) => {
  const [table, userId] = url.split('|');

  if (table === 'leave_applications') {
    return await fetchLeaveApplications(userId === 'null' ? null : userId);
  } else if (table === 'leave_balances') {
    return await fetchLeaveBalances(userId);
  }
};
const HRMedicalApprovalModal = ({ visible, onCancel, requests, onSelectRequest, loading }) => {
    return (
        <Modal
            title={`Pending Medical Leave Requests (${requests.length})`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
        >
            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={requests}
                renderItem={(item) => (
                    <List.Item
                        actions={[<Button type="primary" onClick={() => onSelectRequest(item)}>Review</Button>]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={item.users?.avatar_url} icon={<UserOutlined />} />}
                            title={`${item.users?.name} (${item.users?.employee_id})`}
                            description={`Requested: ${item.requested_days} day(s) from ${dayjs(item.start_date).format('DD MMM')} to ${dayjs(item.end_date).format('DD MMM')}`}
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
};

// In leavemanage.jsx, replace the existing HRRequestDetailDrawer component
const countDeductibleDays = async (startDate, endDate) => {
  try {
    console.log('Calculating days between:', startDate.format('YYYY-MM-DD'), 'and', endDate.format('YYYY-MM-DD'));
    
    // Basic validation
    if (!startDate || !endDate || !startDate.isValid() || !endDate.isValid()) {
      console.error('Invalid dates provided');
      return 0;
    }

    if (endDate.isBefore(startDate)) {
      console.error('End date is before start date');
      return 0;
    }

    // 1. Try to fetch holidays, but don't fail if it doesn't work
    let holidays = new Set();
    try {
      holidays = await fetchCompanyCalendar();
      console.log('Fetched holidays:', holidays.size);
    } catch (error) {
      console.warn('Could not fetch holidays, proceeding without them:', error);
    }

    // 2. Try to fetch working day configuration
    let workingDaysConfig = {
      monday: true, tuesday: true, wednesday: true,
      thursday: true, friday: true, saturday: false, sunday: false
    };

    try {
      const { data: configData, error: configError } = await supabase
        .from('company_calendar')
        .select('reason')
        .eq('day_type', 'working_config')
        .single();

      if (!configError && configData?.reason) {
        try {
          const parsedConfig = JSON.parse(configData.reason);
          if (parsedConfig.workingDays) {
            workingDaysConfig = parsedConfig.workingDays;
            console.log('Using custom working days config:', workingDaysConfig);
          }
        } catch (parseError) {
          console.warn('Could not parse working days config, using default');
        }
      }
    } catch (error) {
      console.warn('Could not fetch working days config, using default:', error);
    }

    // 3. Calculate deductible days with safety checks
    let deductibleDays = 0;
    let current = dayjs(startDate);
    const maxDays = 365; // Safety limit
    let dayCount = 0;

    while (current.isSameOrBefore(endDate, 'day') && dayCount < maxDays) {
      try {
        const dayName = current.format('dddd').toLowerCase();
        const dateString = current.format('YYYY-MM-DD');
        
        const isHoliday = holidays.has(dateString);
        const isWorkingDay = workingDaysConfig[dayName] === true;

        if (isWorkingDay && !isHoliday) {
          deductibleDays++;
        }

        current = current.add(1, 'day');
        dayCount++;
      } catch (dayError) {
        console.error('Error processing day:', current.format('YYYY-MM-DD'), dayError);
        current = current.add(1, 'day');
        dayCount++;
      }
    }

    console.log('Calculated deductible days:', deductibleDays);
    return deductibleDays;

  } catch (error) {
    console.error('Error in countDeductibleDays:', error);
    
    // Ultimate fallback - simple day calculation
    const simpleDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
    console.log('Using fallback calculation:', simpleDays);
    return Math.max(0, simpleDays);
  }
};
const HRRequestDetailDrawer = ({ request, visible, onClose, onApprove, onReject, loading }) => {
    const [selectedDays, setSelectedDays] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [hrComments, setHrComments] = useState('');
    const [alreadyApprovedDates, setAlreadyApprovedDates] = useState(new Set());
    
    // --- START OF FIX ---
    // More robustly identifies a half-day leave based on the total_days being a fraction.
    const isHalfDayLeave = request?.total_days > 0 && request?.total_days < 1;

    // Correctly calculates the count. If it's a half-day leave and its day is selected,
    // use the fractional value from the request itself (e.g., 0.5). Otherwise, count the full days.
    const approvedDaysCount = selectedDays.length > 0
        ? (isHalfDayLeave ? request.total_days : selectedDays.length)
        : 0;
    // --- END OF FIX ---


    useEffect(() => {
    if (request?.user_id && request.start_date && request.end_date) {
        const fetchOverlappingLeaves = async () => {
            let query = supabase
                .from('leave_applications')
                .select('approved_dates, start_date, end_date')
                .eq('user_id', request.user_id)
                .eq('status', 'Approved')
                .lte('start_date', request.end_date)
                .gte('end_date', request.start_date);

            if (typeof request.id === 'string' && request.id.length > 10) {
                query = query.neq('id', request.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching overlapping approved leaves:", error);
                return;
            }

            const approvedDaysSet = new Set();
            data.forEach(leave => {
                // *** CHANGE: Only use approved_dates if available ***
                if (leave.approved_dates && leave.approved_dates.length > 0) {
                    // Only these specific dates are blocked
                    leave.approved_dates.forEach(date => approvedDaysSet.add(date));
                } 
                // *** Remove the else block that was adding all dates in the range ***
                // This means if approved_dates is empty or missing, no dates are blocked
            });
            setAlreadyApprovedDates(approvedDaysSet);
        };
        fetchOverlappingLeaves();
    } else {
        setAlreadyApprovedDates(new Set());
    }
}, [request]);

      useEffect(() => {
        const initializeDays = async () => {
            if (request) {
                // --- START OF FIX ---
                // Determine if the leave type should include weekends/holidays.
                const isCompOrEarned = request.leave_type === 'Compensatory Leave' || request.leave_type === 'Earned Leave';
                // --- END OF FIX ---
                
                if (isHalfDayLeave) {
                    const dateStr = dayjs(request.start_date).format('YYYY-MM-DD');
                    setSelectedDays([dateStr]); 
                    setHrComments(request.hr_comments || '');
                    return; 
                }

                const start = dayjs(request.start_date);
                const end = dayjs(request.end_date);
                let initialSelection = [];
                const holidays = await fetchCompanyCalendar();
                const { data: configData } = await supabase
                    .from('company_calendar')
                    .select('reason')
                    .eq('day_type', 'working_config')
                    .single();
                const defaultConfig = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false };
                const workingDaysConfig = configData?.reason ? JSON.parse(configData.reason).workingDays || defaultConfig : defaultConfig;
                
                let current = start;
                while (current.isSameOrBefore(end, 'day')) {
                    const dateStr = current.format('YYYY-MM-DD');
                    const dayName = current.format('dddd').toLowerCase();
                    const isWorkingDay = workingDaysConfig[dayName] === true;
                    const isHoliday = holidays.has(dateStr);
                    
                    // --- START OF FIX ---
                    // The day should be selected IF:
                    // 1. It's a Compensatory/Earned leave, OR
                    // 2. It's a regular working day for other leave types.
                    const shouldSelectDay = isCompOrEarned || (isWorkingDay && !isHoliday);

                    if (shouldSelectDay && !alreadyApprovedDates.has(dateStr)) {
                        initialSelection.push(dateStr);
                    }
                    // --- END OF FIX ---
                    current = current.add(1, 'day');
                }
                
                setSelectedDays(initialSelection);
                setHrComments(request.hr_comments || '');
            } else {
                setSelectedDays([]);
            }
        };

        if (visible) {
            initializeDays();
        }
    }, [request, alreadyApprovedDates, visible, isHalfDayLeave]);


    useEffect(() => {
        if (request?.user_id) {
            const fetchHistory = async () => {
                setHistoryLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('leave_applications')
                        .select('id, leave_type, start_date, end_date, total_days, status')
                        .eq('user_id', request.user_id)
                        .eq('status', 'Approved')
                        .order('start_date', { ascending: false })
                        .limit(5);
                    if (error) throw error;
                    setHistory(data || []);
                } catch (error) {
                    console.error("Error fetching leave history:", error);
                } finally {
                    setHistoryLoading(false);
                }
            };
            fetchHistory();
        }
    }, [request]);

    if (!request) return null;
    
    const leaveTypeForDisplay = request.leave_type || 'Medical Leave';
    const config = getLeaveTypeConfig(leaveTypeForDisplay);

 // In leavemanage.jsx, inside the HRRequestDetailDrawer component

    const handleDaySelect = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        const startOfRequest = dayjs(request.start_date).startOf('day');
        const endOfRequest = dayjs(request.end_date).endOf('day');

        if (alreadyApprovedDates.has(dateStr)) {
            message.info('This day is already covered by another approved leave.');
            return;
        }

        if (date.isBetween(startOfRequest, endOfRequest, 'day', '[]')) {
             // --- START OF FIX ---
             const isCompOrEarned = request.leave_type === 'Compensatory Leave' || request.leave_type === 'Earned Leave';
             const dayName = date.format('dddd').toLowerCase();

             // Allow selection if it's a Comp/Earned leave, OR if it's not a Sunday for other leave types.
             if (isCompOrEarned || dayName !== 'sunday') {
                setSelectedDays(prev =>
                    prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
                );
             }
             // --- END OF FIX ---
        }
    };
    
   const dateFullCellRender = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const startOfRequest = dayjs(request.start_date).startOf('day');
    const endOfRequest = dayjs(request.end_date).endOf('day');

    const style = {
        width: '24px',
        height: '24px', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
        position: 'relative',
        margin: '0 auto'
    };

    if (date.isBetween(startOfRequest, endOfRequest, 'day', '[]')) {
        style.backgroundColor = '#e6f7ff';
        style.cursor = 'pointer';
    }
    
    if (selectedDays.includes(dateStr)) {
        style.backgroundColor = config.color || '#1890ff';
        style.color = '#fff';
        style.fontWeight = 'bold';
    }

    if (alreadyApprovedDates.has(dateStr)) {
        style.backgroundColor = '#f5f5f5';
        style.color = '#bfbfbf';
        style.cursor = 'not-allowed';
    }

    return (
        <div style={style}>
            {date.date()}
        </div>
    );
};

    // --- START OF FIX ---
    // This function now validates using the corrected `approvedDaysCount`.
    // It will correctly see the 0.5 value and allow the approval to proceed.
    const handleApproveClick = () => {
         if (approvedDaysCount <= 0) {
            message.warning("Please select at least one day to approve.");
            return;
        }
        onApprove(request, selectedDays, hrComments);
    };
    // --- END OF FIX ---

    return (
        <Drawer
            title="Review Leave Request"
            width={window.innerWidth > 768 ? 600 : '95%'}
            onClose={onClose}
            open={visible}
            destroyOnClose
            footer={
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} disabled={loading}>Cancel</Button>
                    <Popconfirm
                        title="Reject this request?"
                        description="This action cannot be undone."
                        onConfirm={() => onReject(request, hrComments || 'Rejected by HR.')}
                        disabled={loading}
                    >
                        <Button danger loading={loading}>Reject</Button>
                    </Popconfirm>
                    {/* --- START OF FIX --- */}
                    {/* The button text now correctly displays fractional days (e.g., 0.5). */}
                    <Button type="primary" onClick={handleApproveClick} loading={loading} style={{ background: config.color, borderColor: config.color }}>
                        Approve ({approvedDaysCount} Day{approvedDaysCount !== 1 ? 's' : ''})
                    </Button>
                    {/* --- END OF FIX --- */}
                </Space>
            }
        >
             <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card bordered={false} style={{ background: '#fafafa' }}>
                     <Space align="center" size="middle">
                        <Avatar size={48} src={request.users?.avatar_url} icon={<UserOutlined />} />
                        <div>
                            <Title level={5} style={{ margin: 0 }}>{request.users?.name}</Title>
                            <Text type="secondary">{request.users?.employee_id}</Text>
                        </div>
                    </Space>
                </Card>
                <Descriptions bordered layout="vertical" size="small">
                    <Descriptions.Item label="Leave Type" span={3}>
                       <Tag color={config.color} icon={config.icon}>{leaveTypeForDisplay}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Originally Requested" span={3}>
                        <Text strong>{`${dayjs(request.start_date).format('DD MMM')} to ${dayjs(request.end_date).format('DD MMM YYYY')}`}</Text>
                        <Tag color="blue" style={{ marginLeft: 8 }}>{request.requested_days || request.total_days} days</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Reason" span={3}>
    {/* The 'blockquote' prop was causing a warning. 
        Passing it as a string as suggested by the warning resolves the issue. */}
    <Paragraph blockquote={"true"} style={{ margin: 0 }}>{request.reason}</Paragraph>
</Descriptions.Item>
                    
                    
{(request.medical_certificate || request.attachment) && (
  <>
    <Divider>Attachments</Divider>
    <Card size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {request.medical_certificate && (
          <div>
            <Text strong>Medical Certificate:</Text>
            <br />
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => window.open(request.medical_certificate, '_blank')}
              style={{ padding: 0, height: 'auto' }}
            >
              View Medical Certificate
            </Button>
          </div>
        )}
        {request.attachment && (
          <div>
            <Text strong>Additional Document:</Text>
            <br />
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => window.open(request.attachment, '_blank')}
              style={{ padding: 0, height: 'auto' }}
            >
              View Attachment
            </Button>
          </div>
        )}
      </Space>
    </Card>
  </>
)}
                </Descriptions>
                
                <Divider>HR Action: Select Days to Approve</Divider>
              <Card>
    <Calendar 
        fullscreen={false} 
        // FIX: Renamed 'dateFullCellRender' to 'fullCellRender'
        fullCellRender={dateFullCellRender} 
        onSelect={!isHalfDayLeave ? handleDaySelect : () => {}} 
    />
</Card>
                 <Statistic
                    title="Total Days Selected for Approval"
                    value={approvedDaysCount}
                    suffix="day(s)"
                    valueStyle={{ color: '#0D7139', fontWeight: 600 }}
                    style={{ textAlign: 'center', padding: '16px', background: '#f6ffed', borderRadius: '8px' }}
                />
                
                <Input.TextArea 
                    rows={3} 
                    placeholder="Add HR comments (optional)..." 
                    value={hrComments}
                    onChange={(e) => setHrComments(e.target.value)}
                />

                <Divider>Recent Approved Leave History</Divider>
             <Spin spinning={historyLoading}>
    {history.length > 0 ? (
        <Timeline
            items={history.map(leave => ({
                key: leave.id,
                children: (
                    <>
                        <Text strong>{leave.leave_type}</Text> - {leave.total_days} day(s)
                        <br/>
                        <Text type="secondary" style={{fontSize: 12}}>{dayjs(leave.start_date).format('DD MMM')} to {dayjs(leave.end_date).format('DD MMM YYYY')}</Text>
                    </>
                )
            }))}
        />
    ) : ( <Empty description="No recent approved leaves."/> )}
</Spin>
             </Space>
        </Drawer>
    );
};
// In leavemanage.jsx, inside the LeaveManagementPage component

// const handleApproveMedicalRequest = async (request, approvedDaysArray, hrComments) => {
//     setLoading(true);
//     try {
//         const employeeId = request.user_id;
//         const userData = request.users;
//         const approvedDaysCount = approvedDaysArray.length;

//         if (!userData) throw new Error("Could not find the employee's details.");
//         if (approvedDaysCount <= 0) {
//             message.warning("Please select at least one day to approve.");
//             setLoading(false);
//             return;
//         }

//         const sortedDays = [...approvedDaysArray].sort();
//         const startDate = dayjs(sortedDays[0]);
//         const endDate = dayjs(sortedDays[sortedDays.length - 1]);

//         // 1. Update the employee's balance with the granted days
//         const { data: currentBalance, error: fetchError } = await supabase
//             .from('leave_balances')
//             .select('medical_extra_granted')
//             .eq('user_id', employeeId)
//             .single();

//         if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

//         const newExtraGranted = (currentBalance?.medical_extra_granted || 0) + approvedDaysCount;
//         await supabase
//             .from('leave_balances')
//             .update({ medical_extra_granted: newExtraGranted })
//             .eq('user_id', employeeId);

//         // 2. Create the official leave application record
//         const newLeaveApplication = {
//             user_id: employeeId,
//             employee_name: userData.name,
//             employee_code: userData.employee_id,
//             leave_type: 'Medical Leave',
//             start_date: startDate.format('YYYY-MM-DD'),
//             end_date: endDate.format('YYYY-MM-DD'),
//             total_days: approvedDaysCount,
//             reason: `(HR Granted) ${request.reason}`,
//             medical_certificate: request.medical_certificate_url,
//             status: 'Approved',
//             approved_by: currentUser?.name || 'HR',
//             approved_date: new Date().toISOString(),
//             hr_comments: hrComments,
//             approved_dates: approvedDaysArray,
//             initial_approved_dates: approvedDaysArray,
//         };

//         const { data: insertedLeave, error: insertError } = await supabase
//             .from('leave_applications')
//             .insert(newLeaveApplication)
//             .select('*, users!inner(*)') // Fetch user data along with the new leave
//             .single();

//         if (insertError) throw insertError;

//         // 3. Update the original request's status to 'Approved'
//         await supabase.from('medical_leave_requests').update({
//             status: 'Approved',
//             approved_days: approvedDaysCount,
//             hr_comments: hrComments,
//         }).eq('id', request.id);

//         message.success(`Request approved. A leave record for ${approvedDaysCount} day(s) has been created.`);

//         // 4. Refresh UI State
//         setLeaveData(prevData => [insertedLeave, ...prevData]);
//         setPendingMedicalRequests(prev => prev.filter(r => r.id !== request.id));
//         setSelectedMedicalRequest(null);
//         setSelectedRequestForReview(null);

//     } catch (error) {
//         console.error('Error approving extra medical request:', error);
//         message.error(`Failed to approve request: ${error.message}`);
//     } finally {
//         setLoading(false);
//     }
// };

// const handleRejectMedicalRequest = async (request, reason) => {
//     if (!request) return;
//     setLoading(true);
//     try {
//         await supabase.from('medical_leave_requests').update({
//             status: 'Rejected',
//             hr_comments: reason,
//         }).eq('id', request.id);

//         message.success('Request has been rejected.');
//         setPendingMedicalRequests(prev => prev.filter(r => r.id !== request.id));
//         setSelectedMedicalRequest(null);
//         setSelectedRequestForReview(null);
//     } catch (error) {
//         message.error('Failed to reject request.');
//     } finally {
//         setLoading(false);
//     }
// };
// // Add this debugging function temporarily
// const debugDatabaseStructure = async () => {
//   try {
//     console.log('=== DEBUGGING DATABASE STRUCTURE ===');
    
//     // Check company_calendar table structure
//     const { data: calendarData, error: calendarError } = await supabase
//       .from('company_calendar')
//       .select('*')
//       .limit(5);
    
//     console.log('Calendar table sample:', calendarData);
//     console.log('Calendar error:', calendarError);
    
//     // Check for holidays specifically
//     const { data: holidayData, error: holidayError } = await supabase
//       .from('company_calendar')
//       .select('*')
//       .eq('day_type', 'holiday');
    
//     console.log('Holiday data:', holidayData);
//     console.log('Holiday error:', holidayError);
    
//     // Check for working config
//     const { data: configData, error: configError } = await supabase
//       .from('company_calendar')
//       .select('*')
//       .eq('day_type', 'working_config');
    
//     console.log('Working config data:', configData);
//     console.log('Working config error:', configError);
    
//   } catch (error) {
//     console.error('Debug error:', error);
//   }
// };
const fetchCompanyCalendar = async () => {
  try {
    const { data, error } = await supabase
      .from('company_calendar')
      .select('date, day_type')
      .eq('day_type', 'holiday');

    if (error) {
      console.error('Error fetching company calendar:', error);
      return new Set(); // Return empty set instead of throwing
    }
    
    // Ensure data is valid before processing
    if (!data || !Array.isArray(data)) {
      console.warn('Invalid calendar data received:', data);
      return new Set();
    }
    
    return new Set(data.map(d => d.date));
  } catch (error) {
    console.error('Error fetching company calendar:', error);
    return new Set(); // Always return a Set, never throw
  }
};

const fetchWorkingDays = async (userId, holidays) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('date')
      .eq('user_id', userId)
      .eq('is_present', true);

    if (error) throw error;

    // Filter out holidays from the present days to get only working days
    const workingDays = data.filter(attendance => !holidays.has(attendance.date));
    return workingDays.length;
  } catch (error) {
    console.error('Error fetching working days:', error);
    return 0;
  }
 
};
const fetchCompensatoryOffDays = async (userId, holidays) => {
  try {
    // 1. Fetch the dynamic working day configuration set by HR
    const { data: configData, error: configError } = await supabase
      .from('company_calendar')
      .select('reason') // We only need the JSON data from the 'reason' column
      .eq('day_type', 'working_config') // Fetch the correct configuration type
      .single();

    if (configError && configError.code !== 'PGRST116') {
      throw configError;
    }

    // Define a default schedule in case no configuration is set
    const defaultConfig = {
      monday: true, tuesday: true, wednesday: true,
      thursday: true, friday: true, saturday: false, sunday: false
    };
    
    // Safely parse the configuration from the database, or use the default
    const workingDaysConfig = configData?.reason
      ? JSON.parse(configData.reason).workingDays || defaultConfig
      : defaultConfig;

    // 2. Fetch all attendance records where the user was present
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('date')
      .eq('user_id', userId)
      .eq('is_present', true);

    if (attendanceError) throw attendanceError;

    if (!attendanceData) return 0;

    // 3. Filter for days worked on a public holiday OR a configured non-working day
    const compensatoryDays = attendanceData.filter(attendance => {
      const attendanceDate = dayjs(attendance.date);
      const dayName = attendanceDate.format('dddd').toLowerCase(); // e.g., 'sunday'

      // Condition 1: Was the day a public holiday?
      const isPublicHoliday = holidays.has(attendance.date);

      // Condition 2: Was the day a configured non-working day (weekend)?
      // This checks if the day (like 'sunday') is set to 'false' in the config.
      const isConfiguredNonWorkingDay = workingDaysConfig[dayName] === false;

      // The employee earns comp-off if they worked on a public holiday OR a weekend/non-working day
      return isPublicHoliday || isConfiguredNonWorkingDay;
    });

    return compensatoryDays.length;
  } catch (error) {
    console.error('Error fetching compensatory off days:', error);
    message.error('Could not calculate compensatory days.');
    return 0; // Return 0 on error
  }
};
// Generate dummy leave data
// In leavemanage.jsx

// Update the fetchLeaveApplications function (around line 109)
// In leavemanage.jsx

// Update the fetchLeaveApplications function
const fetchLeaveApplications = async (userId = null) => {
  try {
    let query;

    if (userId) {
      query = supabase
        .from('leave_applications')
        .select(`
          id,
          employee_name,
          employee_code,
          leave_type,
          start_date,
          end_date,
          total_days,
          total_hours,
          status,
          reason,
          sub_type,
          applied_date,
          approved_by,
          approved_date,
          rejected_by,
          rejection_reason
        `)
        .eq('user_id', userId) // <-- This line is the crucial fix
        .order('applied_date', { ascending: false });

    } else {
      // HR/Admin query to fetch leaves for multiple employee types
      const { data: allLeaves, error: fetchError } = await supabase
        .from('leave_applications')
        .select(`
          *,
          users!inner (
            id,
            name,
            employee_id,
            email,
            employee_type,
            start_date
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Filter in JavaScript for HR view
      const filteredLeaves = allLeaves.filter(leave => 
        leave.users?.employee_id?.startsWith('MYAEMP') || 
        leave.users?.employee_id?.startsWith('MYAINT')
      );
      
      return filteredLeaves || [];
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leave applications:', error);
    message.error('Failed to fetch leave applications');
    return [];
  }
};

// In leavemanage.jsx
// In leavemanage.jsx
// Replace the existing fetchLeaveBalances function with this one

const fetchLeaveBalances = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        users!user_id (
          name,
          employee_id
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      const currentYear = dayjs().year();
      const lastUpdatedYear = dayjs(data.last_updated || data.created_at).year();
      const currentMonth = dayjs().month(); // 0-indexed (Jan=0, Dec=11)
      const lastMonthlyReset = dayjs(data.last_monthly_reset).month();
      const updates = {};
      let shouldUpdate = false;

      // --- START OF FIX: Corrected Monthly Renewal Logic ---
      // This logic now correctly detects a change in the calendar month.
      if (currentMonth !== lastMonthlyReset || dayjs(data.last_monthly_reset).year() < currentYear) {
        updates.permission_remaining = 4; // Reset to 4 hours
        updates.excuses_remaining = 1;    // Reset to 1 excuse
        updates.last_monthly_reset = new Date().toISOString(); // IMPORTANT: Update the timestamp
        shouldUpdate = true;
        console.log(`Monthly renewal triggered for user ${userId}. Permissions and Excuses have been reset.`);
      }
      // --- END OF FIX ---


      // --- START OF FIX: Corrected Yearly Renewal Logic ---
      // This block now implements your specific carry-forward and reset rules.
      if (currentYear > lastUpdatedYear) {
        // 1. Casual Leave: Carries over the remaining balance and adds it to the new 12 days.
        const newCasualTotal = 12 + (data.casual_remaining || 0);
        updates.casual_total = newCasualTotal;
        updates.casual_remaining = newCasualTotal;

        // 2. Medical Leave: Forfeits unused days and resets to 12.
        updates.medical_total = 12;
        updates.medical_remaining = 12;
        
        // 3. Update the yearly timestamp
        updates.last_updated = new Date().toISOString();
        shouldUpdate = true;
        console.log(`Yearly renewal triggered for user ${userId}. Casual leave carried over, Medical leave reset.`);
      }
      // --- END OF FIX ---


      // If any renewal logic was triggered, send the update to the database.
      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('leave_balances')
          .update(updates)
          .eq('user_id', userId);
        
        if (updateError) throw updateError;
        
        // Fetch the newly updated data immediately to ensure the UI shows the correct values.
        console.log('Balances updated, refetching data...');
        return await fetchLeaveBalances(userId);
      }
    }

    // If no updates were needed, return the original data.
    return data;
  } catch (error) {
    console.error("Error fetching or updating leave balances:", error);
    message.error("Could not refresh leave balances.");
    return null;
  }
};

// Replace the existing calculateLeaveBalances function with this corrected one

const calculateLeaveBalances = async (userId, currentUser) => {
  // 1. Fetch all necessary data first.
  const balanceData = await fetchLeaveBalances(userId);
  
  // Cache holidays to prevent repeated fetching
  if (!window.holidayCache) {
    window.holidayCache = await fetchCompanyCalendar();
  }
  const holidays = window.holidayCache;
  
  const totalWorkingDaysPresent = await fetchWorkingDays(userId, holidays);
  const totalCompensatoryDaysEarned = await fetchCompensatoryOffDays(userId, holidays);

  // 2. Calculate the total leaves earned based on your rules.
  const totalEarnedLeave = Math.floor(totalWorkingDaysPresent / 20);

  // 3. Handle the case for a new user with no existing balance record.
  if (!balanceData) {
    return {
      permission: { total: 2, used: 0, remaining: 2, monthlyLimit: 2 },
      casualLeave: { total: 12, used: 0, remaining: 12, monthlyLimit: 1 },
      earnedLeave: { 
        total: totalEarnedLeave, 
        used: 0, 
        remaining: totalEarnedLeave 
      },
      medicalLeave: { 
        total: 12, 
        used: 0, 
        remaining: 12,
        extraGranted: 0,
        extraUsed: 0,
        totalAvailable: 12
      },
      maternityLeave: { total: 84, used: 0, remaining: 84 },
      // --- MODIFICATION START ---
      // Compensatory leave now defaults to 0 and is only added manually by HR.
      // The `eligible` property is new, for HR to see, but isn't part of the employee's balance.
      compensatoryLeave: { 
        total: 0, 
        used: 0, 
        remaining: 0,
        eligible: totalCompensatoryDaysEarned
      },
      // --- MODIFICATION END ---
      excuses: { total: 1, used: 0, remaining: 1, monthlyLimit: 1 }
    };
  }

    const totalMedicalAvailable =  (balanceData.medical_total || 0)+ (balanceData.medical_extra_granted || 0);
  const totalMedicalUsed = (balanceData.medical_used || 0) + (balanceData.medical_extra_used || 0);

  return {
   // Replace the permission object structure
permission: {
  total: 4, // Changed from 2 to 4 (hours)
  used: balanceData.permission_used || 0, // Now in hours
  remaining: balanceData.permission_remaining || 0, // Now in hours
  monthlyLimit: 4 // Changed from 2 to 4
},
    casualLeave: {
      total: balanceData.casual_total,
      used: balanceData.casual_used,
      remaining: balanceData.casual_remaining,
    },
    earnedLeave: {
      total: totalEarnedLeave,
      used: balanceData.earned_used || 0,
      remaining: totalEarnedLeave - (balanceData.earned_used || 0)
    },
    medicalLeave: {
      total: balanceData.medical_total,
      used: balanceData.medical_used || 0,
      remaining: balanceData.medical_remaining,
      extraGranted: balanceData.medical_extra_granted || 0,
      extraUsed: balanceData.medical_extra_used || 0,
      totalAvailable: totalMedicalAvailable,
      totalUsed: totalMedicalUsed
    },
    maternityLeave: {
      total: balanceData.maternity_total,
      used: balanceData.maternity_used,
      remaining: balanceData.maternity_remaining
    },
    // --- MODIFICATION START ---
    // The balance now comes directly from the database fields which are only updated by HR.
    // The `eligible` count is still calculated to show HR what can be awarded.
    compensatoryLeave: {
      total: balanceData.compensatory_total || 0,
      used: balanceData.compensatory_used || 0,
      remaining: balanceData.compensatory_remaining || 0,
      eligible: totalCompensatoryDaysEarned
    },
    // --- MODIFICATION END ---
    excuses: {
      total: balanceData.excuses_total,
      used: balanceData.excuses_used,
      remaining: balanceData.excuses_remaining,
      monthlyLimit: 1
    }
  };
};
// In leavemanage.jsx

const LeaveHistoryDrawer = ({ visible, onClose, leaveData, currentUser, onEdit, onCancel }) => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredHistory = useMemo(() => {
    return leaveData
      .filter(leave => {
        const statusMatch = statusFilter === 'All' || leave.status === statusFilter;
        const typeMatch = typeFilter === 'All' || leave.leave_type === typeFilter;
        return statusMatch && typeMatch;
      })
      .sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));
  }, [leaveData, statusFilter, typeFilter]);

  const leaveTypes = useMemo(() => [...new Set(leaveData.map(l => l.leave_type))], [leaveData]);

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>{currentUser?.name}'s Leave History</span>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={window.innerWidth > 768 ? 500 : '90%'}
      destroyOnClose // Use destroyOnClose to reset state
    >
      {/* Filter Controls */}
      <Card style={{ marginBottom: '16px', background: '#fafafa' }} size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="Filter by Status"
            >
              <Option value="All">All Statuses</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Rejected">Rejected</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              placeholder="Filter by Leave Type"
            >
              <Option value="All">All Leave Types</Option>
              {leaveTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

        {filteredHistory.length > 0 ? (
        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '8px' }}>
          <Timeline>
     
{filteredHistory.map(leave => {
  const config = getLeaveTypeConfig(leave.leave_type);
  return (
    <Timeline.Item key={leave.id} dot={config.icon} color={config.color}>
      <div style={{ marginBottom: '12px' }}>
        <Row justify="space-between" align="top">
          <Col>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {leave.leave_type}
              <Tag color={
                leave.status === 'Approved' ? 'success' :
                leave.status === 'Rejected' ? 'error' : 'warning'
              } style={{ marginLeft: '8px' }}>
                {leave.status}
              </Tag>
            </p>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {/* Show original requested dates */}
              Applied: {dayjs(leave.start_date).format('MMM DD')} - {dayjs(leave.end_date).format('MMM DD, YYYY')}
              
              {/* Show exact approved dates if available */}
              {leave.status === 'Approved' && leave.approved_dates && leave.approved_dates.length > 0 && (
                <>
                  <br />
                  <span style={{ color: '#52c41a', fontSize: '11px', fontWeight: 'bold' }}>
                    HR Approved Days: 
                  </span>
                  <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {leave.approved_dates.sort().map(date => (
                      <Tag key={date} color="success" size="small" style={{ fontSize: '10px', margin: '1px' }}>
                        {dayjs(date).format('MMM DD')}
                      </Tag>
                    ))}
                  </div>
                  <Text style={{ color: '#52c41a', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                    Total: {leave.approved_dates.length} day(s) approved
                  </Text>
                </>
              )}
              
              {/* Show if some days were not approved */}
              {leave.status === 'Approved' && leave.approved_dates && leave.approved_dates.length > 0 && 
               leave.approved_dates.length < leave.total_days && (
                <Text style={{ color: '#fa8c16', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                  ({leave.total_days - leave.approved_dates.length} day(s) not granted by HR)
                </Text>
              )}
              
               {leave.totalHours > 0 && `       • ${formatPermissionHours(leave.totalHours)}`}
            </Text>
          </Col>
          
          <Col>
            {leave.status === 'Pending' && (
              <Space>
                <Tooltip title="Edit Request">
                  <Button icon={<EditOutlined />} size="small" type="text" onClick={() => onEdit(leave)} />
                </Tooltip>
                <Tooltip title="Cancel Request">
                  <Button icon={<DeleteOutlined />} size="small" type="text" danger onClick={() => onCancel(leave)} />
                </Tooltip>
              </Space>
            )}
          </Col>
        </Row>
        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }} style={{ fontSize: '13px', marginTop: '4px', color: '#666' }}>
          Reason: {leave.reason}
        </Paragraph>
      </div>
    </Timeline.Item>
  );
})}
          </Timeline>
        </div>
      ) : (
        <Empty description="No leave history found." />
      )}
    </Drawer>
  );
};



const CompensatoryLeaveModal = ({ visible, onCancel, employees }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Data state
  // --- MODIFICATION: This now stores the full details (check-in/out) for each day ---
  const [attendanceDetails, setAttendanceDetails] = useState(new Map());
  const [eligibleDays, setEligibleDays] = useState([]);
  const [allocatedDates, setAllocatedDates] = useState([]);

  // State for multi-selection
  const [selection, setSelection] = useState([]);
  const [selectionMode, setSelectionMode] = useState(null);

  // Helper function to calculate and format work hours
  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) {
      return <Text type="secondary">N/A</Text>;
    }
    try {
      const start = dayjs(`1970-01-01T${checkIn}`);
      const end = dayjs(`1970-01-01T${checkOut}`);
      if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        return <Text type="danger">Invalid</Text>;
      }
      const diffMinutes = end.diff(start, 'minute');
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return <Text strong style={{ color: '#0D7139' }}>{`${hours}h ${minutes}m`}</Text>;
    } catch (e) {
      return <Text type="danger">Error</Text>;
    }
  };

  const fetchDataForEmployee = async (userId, date) => {
    if (!userId || !date) return;
    setLoading(true);
    setSelection([]);
    setSelectionMode(null);
    try {
      const startDate = date.startOf('month').format('YYYY-MM-DD');
      const endDate = date.endOf('month').format('YYYY-MM-DD');

      // 1. Fetch config and holidays
      const { data: configData } = await supabase.from('company_calendar').select('reason').eq('day_type', 'working_config').single();
      const defaultConfig = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false };
      const workingDaysConfig = configData?.reason ? JSON.parse(configData.reason).workingDays || defaultConfig : defaultConfig;
      const holidays = await fetchCompanyCalendar();
      
      // 2. --- MODIFICATION: Fetch detailed attendance with check-in/out times ---
      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('date, is_present, check_in, check_out') // Ensure these columns are selected
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);
      if (attError) throw attError;
      
      // Store the full details in the map
      const attMap = new Map(attendanceData.map(att => [att.date, { isPresent: att.is_present, checkIn: att.check_in, checkOut: att.check_out }]));
      setAttendanceDetails(attMap);
      
      // 3. Fetch already allocated dates
      const { data: balanceData } = await supabase.from('leave_balances').select('allocated_comp_off_dates').eq('user_id', userId).single();
      const allocated = balanceData?.allocated_comp_off_dates || [];
      setAllocatedDates(allocated);

      // 4. Calculate eligible days
      const eligible = [];
      for (const [dayStr, details] of attMap.entries()) {
        if (details.isPresent) {
          const day = dayjs(dayStr);
          const isHoliday = holidays.has(dayStr);
          const isNonWorking = workingDaysConfig[day.format('dddd').toLowerCase()] === false;
          if ((isHoliday || isNonWorking) && !allocated.includes(dayStr)) {
            eligible.push(dayStr);
          }
        }
      }
      setEligibleDays(eligible);

    } catch (error) {
      console.error(error);
      message.error("Failed to fetch employee's compensatory leave data.");
    } finally {
      setLoading(false);
    }
  };

  const onDateSelect = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isEligible = eligibleDays.includes(dateStr);
    const isAllocated = allocatedDates.includes(dateStr);
    if (!isEligible && !isAllocated) return;
    const clickedMode = isAllocated ? 'revoking' : 'allocating';
    if (selectionMode && selectionMode !== clickedMode) {
      setSelection([dateStr]);
      setSelectionMode(clickedMode);
      return;
    }
    setSelectionMode(clickedMode);
    setSelection(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  };

  const handleAllocateSelection = async () => { /* ... Function remains the same ... */ 
      if (selection.length === 0) return;
    setActionLoading(true);
    try {
      const { data: currentBalance } = await supabase.from('leave_balances').select('compensatory_total, compensatory_remaining, allocated_comp_off_dates').eq('user_id', selectedEmployeeId).single();
      
      const newDaysCount = selection.length;
      const newTotal = (currentBalance?.compensatory_total || 0) + newDaysCount;
      const newRemaining = (currentBalance?.compensatory_remaining || 0) + newDaysCount;
      const newAllocatedDates = [...(currentBalance?.allocated_comp_off_dates || []), ...selection];

      await supabase.from('leave_balances').update({
        compensatory_total: newTotal,
        compensatory_remaining: newRemaining,
        allocated_comp_off_dates: newAllocatedDates
      }).eq('user_id', selectedEmployeeId);
      
      message.success(`${newDaysCount} day(s) allocated successfully!`);
      fetchDataForEmployee(selectedEmployeeId, selectedMonth); // Refresh data
    } catch (error) {
      console.error('Error batch allocating:', error);
      message.error('Failed to allocate leaves.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleRevokeSelection = async () => { /* ... Function remains the same ... */ 
      if (selection.length === 0) return;
    setActionLoading(true);
    try {
      const { data: currentBalance } = await supabase.from('leave_balances').select('compensatory_total, compensatory_remaining, allocated_comp_off_dates').eq('user_id', selectedEmployeeId).single();
      
      const revokedDaysCount = selection.length;
      const currentAllocated = currentBalance?.allocated_comp_off_dates || [];

      const newTotal = Math.max(0, (currentBalance?.compensatory_total || 0) - revokedDaysCount);
      const newRemaining = Math.max(0, (currentBalance?.compensatory_remaining || 0) - revokedDaysCount);
      const newAllocatedDates = currentAllocated.filter(d => !selection.includes(d));

      await supabase.from('leave_balances').update({
        compensatory_total: newTotal,
        compensatory_remaining: newRemaining,
        allocated_comp_off_dates: newAllocatedDates
      }).eq('user_id', selectedEmployeeId);

      message.success(`${revokedDaysCount} day(s) revoked successfully.`);
      fetchDataForEmployee(selectedEmployeeId, selectedMonth); // Refresh data
    } catch (error) {
      console.error('Error batch revoking:', error);
      message.error('Failed to revoke leaves.');
    } finally {
      setActionLoading(false);
    }
  };

  const dateCellRender = (date) => { /* ... Function remains the same ... */ 
      const dateStr = date.format('YYYY-MM-DD');
    const isEligible = eligibleDays.includes(dateStr);
    const isAllocated = allocatedDates.includes(dateStr);
    const isSelected = selection.includes(dateStr);

    let style = { borderRadius: '4px', transition: 'all 0.2s' };
    if (isSelected) {
      style.border = `2px solid ${selectionMode === 'allocating' ? '#0D7139' : '#ff4d4f'}`;
      style.backgroundColor = selectionMode === 'allocating' ? '#f6ffed' : '#fff1f0';
    } else if (isAllocated) {
      style.backgroundColor = '#d3adf7';
    } else if (isEligible) {
      style.backgroundColor = '#f9f0ff';
    }
    
    return <div className="ant-picker-cell-inner" style={style}>{date.date()}</div>;
  };

  return (
    <Drawer
      title="Manual Compensatory Leave Allocation"
      width={window.innerWidth > 992 ? 900 : '95%'}
      onClose={onCancel}
      open={visible}
      destroyOnClose
    >
      <Spin spinning={loading || actionLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Select showSearch placeholder="Select an Employee" style={{ width: '100%' }} onChange={value => { setSelectedEmployeeId(value); fetchDataForEmployee(value, selectedMonth); }} filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
              {employees.map(emp => <Option key={emp.id} value={emp.id}>{emp.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <DatePicker.MonthPicker value={selectedMonth} onChange={date => { setSelectedMonth(date); if (selectedEmployeeId) { fetchDataForEmployee(selectedEmployeeId, date); } }} style={{ width: '100%' }} disabled={!selectedEmployeeId} />
          </Col>
        </Row>
        <Divider />
        {selectedEmployeeId ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="Click on days to select/deselect for batch actions">
                 <Calendar fullscreen={false} value={selectedMonth} dateFullCellRender={dateCellRender} onSelect={onDateSelect} />
                 <Space style={{ marginTop: '16px' }} wrap>
                    <Badge color="#f9f0ff" text="Eligible" />
                    <Badge color="#d3adf7" text="Allocated" />
                    <Badge color="#f6ffed" text="Selected to Add" />
                    <Badge color="#fff1f0" text="Selected to Revoke" />
                 </Space>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Selected Days Details & Actions">
                {selection.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* --- START: NEW DETAILED VIEW --- */}
                    <div style={{ flexGrow: 1, maxHeight: '350px', overflowY: 'auto', marginBottom: '16px' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {selection.sort().map(date => {
                          const details = attendanceDetails.get(date);
                          return (
                            <Card key={date} size="small" style={{ background: '#fafafa' }}>
                              <Row justify="space-between" align="middle">
                                <Col>
                                  <Text strong>{dayjs(date).format('ddd, DD MMM YYYY')}</Text>
                                </Col>
                                <Col>{calculateWorkHours(details?.checkIn, details?.checkOut)}</Col>
                              </Row>
                              <Row justify="space-between" style={{ fontSize: '12px', marginTop: '4px' }}>
                                <Col><Text type="secondary">In: {details?.checkIn || 'N/A'}</Text></Col>
                                <Col><Text type="secondary">Out: {details?.checkOut || 'N/A'}</Text></Col>
                              </Row>
                            </Card>
                          );
                        })}
                      </Space>
                    </div>
                    {/* --- END: NEW DETAILED VIEW --- */}
                    <Divider style={{ margin: '8px 0' }} />
                    <Statistic title="Total Days Selected" value={selection.length} />
                    {selectionMode === 'allocating' && (
                      <Popconfirm title={`Are you sure you want to allocate these ${selection.length} days?`} onConfirm={handleAllocateSelection} okText="Yes, Allocate" cancelText="No">
                        <Button type="primary" block icon={<CheckCircleOutlined />} style={{ marginTop: '16px' }}>Allocate {selection.length} Day(s)</Button>
                      </Popconfirm>
                    )}
                    {selectionMode === 'revoking' && (
                      <Popconfirm title={`Are you sure you want to REVOKE these ${selection.length} days?`} onConfirm={handleRevokeSelection} okText="Yes, Revoke" cancelText="No">
                        <Button danger block icon={<DeleteOutlined />} style={{ marginTop: '16px' }}>Revoke {selection.length} Day(s)</Button>
                      </Popconfirm>
                    )}
                  </div>
                ) : (
                  <Empty description="Select one or more days from the calendar to see details and perform an action." />
                )}
              </Card>
            </Col>
          </Row>
        ) : (
          <Empty description="Please select an employee to begin." />
        )}
      </Spin>
    </Drawer>
  );
};


const handleEditLeave = (leave) => {
    if (leave.isExtraRequest) {
        message.info("Extra medical requests cannot be edited. Please cancel and submit a new one if changes are needed.");
        return;
    }
    
    // This will now correctly access the 'form' instance
    form.setFieldsValue({
        leaveType: leave.leave_type,
        subType: leave.sub_type,
        startDate: dayjs(leave.start_date),
        endDate: dayjs(leave.end_date),
        startTime: leave.start_time ? dayjs(leave.start_time, 'HH:mm') : null,
        endTime: leave.end_time ? dayjs(leave.end_time, 'HH:mm') : null,
        reason: leave.reason,
        session: leave.sub_type?.split(' - ')[1],
    });
    
    form.setFieldValue('editingId', leave.id);
    
    setLeaveHistoryDrawer(false);
    setApplyLeaveModal(true);
};
// --- END: REPLACE THE ENTIRE CompensatoryLeaveModal COMPONENT ---
const LeaveManagementPage = ({ userRole = 'hr', currentUserId = '1' }) => {
  // if (userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'hr') {
  //   return <ErrorPage errorType="403" />;
  // }
  const [employees, setEmployees] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [leaveBalanceRaw, setLeaveBalanceRaw] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedEmployeeForMedical, setSelectedEmployeeForMedical] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(false); // <--- setLoading is defined here
  const [isLoaded, setIsLoaded] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [casualSubType, setCasualSubType] = useState('');
    const [extraMedicalRequest, setExtraMedicalRequest] = useState(null);

  // Modal states
  const [applyLeaveModal, setApplyLeaveModal] = useState(false);
  const [leaveDetailsModal, setLeaveDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveHistoryDrawer, setLeaveHistoryDrawer] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDate, setExportDate] = useState(dayjs());
  // Form and filter states
  const [form] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('All');
    const [activeTab, setActiveTab] = useState('dashboard');
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [balanceWarning, setBalanceWarning] = useState('');

  // ADD THESE LINES FOR PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentUser, setCurrentUser] = useState(null);
   const [compOffModalVisible, setCompOffModalVisible] = useState(false);
   const [extraMedicalRequestModal, setExtraMedicalRequestModal] = useState(false);
const [hrMedicalApprovalModal, setHrMedicalApprovalModal] = useState(false);
const [pendingMedicalRequests, setPendingMedicalRequests] = useState([]);
const [selectedMedicalRequest, setSelectedMedicalRequest] = useState(null);
const [hrApprovalForm] = Form.useForm();
 const [extraMedicalRequestDrawer, setExtraMedicalRequestDrawer] = useState(false);
 const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
const [editingLeave, setEditingLeave] = useState(null);
const [editForm] = Form.useForm();
const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
const [isAdjustDrawerVisible, setIsAdjustDrawerVisible] = useState(false); // Renamed for clarity




useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (error) {
        console.error('Error fetching current user:', error);
        // Create a fallback user object
        setCurrentUser({
          id: currentUserId,
          name: 'Current User',
          employeeId: 'EMP001',
          department: 'General',
          position: 'Employee',
          email: 'user@company.com',
          joinDate: dayjs().format('YYYY-MM-DD'),
          type: 'Full-time',
          workingDays: 0
        });
      } else {
        setCurrentUser(data);
      }
    } catch (err) {
      console.error('Error:', err);
      // Fallback user
      setCurrentUser({
        id: currentUserId,
        name: 'Current User',
        employeeId: 'EMP001',
        department: 'General',
        position: 'Employee',
        email: 'user@company.com',
        joinDate: dayjs().format('YYYY-MM-DD'),
        type: 'Full-time',
        workingDays: 0
      });
    }
  };

  fetchCurrentUser();
}, [currentUserId]);
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
useEffect(() => {
    // This effect clears the 'Approved' or 'Rejected' status after 5 seconds to show the button again.
    if (extraMedicalRequest?.status === 'Approved' || extraMedicalRequest?.status === 'Rejected') {
        const timer = setTimeout(() => {
            setExtraMedicalRequest(null); // Resetting the status will make the button reappear
        }, 5000); // Display the status for 5 seconds

        return () => clearTimeout(timer); // Clean up the timer if the component unmounts
    }
}, [extraMedicalRequest]);
useEffect(() => {
  if (!dataLoaded && currentUser?.id && activeTab === 'dashboard') {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (userRole === 'employee') {
          await initializeUserLeaveBalance(currentUserId);
        }
        
        // --- CHANGE: Use a new combined fetch function ---
        const leaves = userRole === 'employee' 
          ? await fetchCombinedEmployeeHistory(currentUserId)
          : await fetchLeaveApplications(null);
        
        let balances = {};
        if (userRole === 'employee') {
          balances = await calculateLeaveBalances(currentUserId, currentUser);
          await fetchLastExtraMedicalRequest(currentUserId);
        }
        
        setLeaveData(leaves);
        setLeaveBalances(balances);
        setDataLoaded(true);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    };
    
    loadInitialData();
  }
}, [currentUser?.id, dataLoaded, activeTab, userRole]);
// Move these functions INSIDE the LeaveManagementPage component (around line 600)
const handleCancelLeave = async (leave) => {
    Modal.confirm({
        title: 'Are you sure you want to cancel this leave request?',
        icon: <ExclamationCircleOutlined />,
        content: 'This action cannot be undone.',
        okText: 'Yes, Cancel It',
        okType: 'danger',
        async onOk() {
            try {
                const tableToDeleteFrom = leave.isExtraRequest ? 'medical_leave_requests' : 'leave_applications';
                
                const { error } = await supabase
                    .from(tableToDeleteFrom)
                    .delete()
                    .eq('id', leave.id);

                if (error) throw error;

                // Update state immediately
                setLeaveData(prevData => prevData.filter(item => item.id !== leave.id));
                message.success('Leave request cancelled successfully.');

            } catch (error) {
                console.error('Error cancelling leave:', error);
                message.error('Failed to cancel the leave request.');
            }
        },
    });
};

const handleEditLeave = (leave) => {
    if (leave.isExtraRequest) {
        message.info("Extra medical requests cannot be edited. Please cancel and submit a new one if changes are needed.");
        return;
    }
    
    // Access the form instance correctly
    form.setFieldsValue({
        leaveType: leave.leave_type,
        subType: leave.sub_type,
        startDate: dayjs(leave.start_date),
        endDate: dayjs(leave.end_date),
        startTime: leave.start_time ? dayjs(leave.start_time, 'HH:mm') : null,
        endTime: leave.end_time ? dayjs(leave.end_time, 'HH:mm') : null,
        reason: leave.reason,
        session: leave.sub_type?.split(' - ')[1],
        editingId: leave.id // Set the editing ID
    });
    
    setLeaveHistoryDrawer(false);
    setApplyLeaveModal(true);
};
const LeaveEditDrawer = ({ visible, onClose, leave, onSave, loading }) => {
    const [form] = Form.useForm();
    const [adjustedDays, setAdjustedDays] = useState(0);

    useEffect(() => {
        if (leave) {
            const startDate = dayjs(leave.start_date);
            const endDate = dayjs(leave.end_date);
            form.setFieldsValue({
                dates: [startDate, endDate],
                hr_comments: leave.hr_comments || '',
            });
            setAdjustedDays(leave.total_days);
        }
    }, [leave, form]);
    
    const handleDateChange = async (dates) => {
        if (dates && dates.length === 2) {
            const [start, end] = dates;
            const days = await countDeductibleDays(start, end);
            setAdjustedDays(days);
        } else {
            setAdjustedDays(0);
        }
    };

    if (!leave) return null;

    return (
        <Drawer
            title="Adjust Leave Dates"
            width={500}
            onClose={onClose}
            open={visible}
            destroyOnClose
            footer={
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="primary" onClick={() => form.submit()} loading={loading}>Save Changes</Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical" onFinish={(values) => onSave(leave, values, adjustedDays)}>
                <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Employee">{leave.users?.name}</Descriptions.Item>
                    <Descriptions.Item label="Leave Type">{leave.leave_type}</Descriptions.Item>
                    <Descriptions.Item label="Original Total Days">
                        <Tag color="blue">{leave.total_days}</Tag>
                    </Descriptions.Item>
                </Descriptions>

                <Form.Item name="dates" label="Adjusted Start and End Dates" rules={[{ required: true }]}>
                    <RangePicker style={{ width: '100%' }} onChange={handleDateChange} />
                </Form.Item>
                
                <Statistic
                    title="New Total Deductible Days"
                    value={adjustedDays}
                    suffix="day(s)"
                    valueStyle={{ color: '#0D7139' }}
                    style={{ textAlign: 'center', marginBottom: 24, padding: '10px', background: '#f6ffed', borderRadius: '8px' }}
                />

                <Form.Item name="hr_comments" label="Reason for Adjustment (HR Comments)">
                    <Input.TextArea rows={4} placeholder="e.g., Employee returned to work early." />
                </Form.Item>
            </Form>
        </Drawer>
    );
};
// In leavemanage.jsx, replace the existing handleAdjustLeave function with this one.
// In leavemanage.jsx, replace the existing handleAdjustLeave function with this one.
const handleAdjustLeave = async (originalLeave, newApprovedDays, dayDifference) => {
    setLoading(true);
    try {
        // --- START OF FIX ---
        // We add a check here. If the leave is an extra request, we will
        // completely skip the logic that updates the employee's leave balance.
        if (!originalLeave.isExtraRequest) {
            // This logic now ONLY runs for REGULAR leave types (Casual, standard Medical, etc.)
            const { data: balance } = await supabase
                .from('leave_balances')
                .select('*').eq('user_id', originalLeave.user_id).single();

            if (!balance) throw new Error("User's leave balance not found.");

            const updates = {};
            const fieldMap = {
                'Casual Leave': 'casual', 'Medical Leave': 'medical',
                'Earned Leave': 'earned', 'Compensatory Leave': 'compensatory', 'Excuses': 'excuses' 
            };
            const field = fieldMap[originalLeave.leave_type];

            // Step 1: Update the user's balance based on the calculated difference.
          if (field && dayDifference !== 0) {
        // For refunds (dayDifference > 0), we ADD back to remaining and SUBTRACT from used
        // For revokes (dayDifference < 0), we SUBTRACT from remaining and ADD to used
        updates[`${field}_used`] = Math.max(0, (balance[`${field}_used`] || 0) - dayDifference);
        updates[`${field}_remaining`] = (balance[`${field}_remaining`] || 0) + dayDifference;
        
        await supabase.from('leave_balances').update(updates).eq('user_id', originalLeave.user_id);
    }
}
        // If originalLeave.isExtraRequest is true, the entire block above is skipped.
        // --- END OF FIX ---


        // Step 2: ALWAYS update the original leave application record.
        // This part runs for ALL leave types, including extra medical, which is correct.
        const newTotalDaysForRecord = originalLeave.total_days - dayDifference;

        const { error: updateError } = await supabase
            .from('leave_applications')
            .update({
                total_days: newTotalDaysForRecord,
                approved_dates: newApprovedDays,
            })
            .eq('id', originalLeave.id);

        if (updateError) throw updateError;

        // Step 3: Update the UI state to reflect the changes.
        const updatedLeaveData = { 
            ...originalLeave, 
            total_days: newTotalDaysForRecord, 
            approved_dates: newApprovedDays 
        };
        
        setLeaveData(prev => prev.map(l => l.id === originalLeave.id ? updatedLeaveData : l));
        setFilteredLeaves(prev => prev.map(l => l.id === originalLeave.id ? updatedLeaveData : l));
        
        if (dayDifference > 0) {
            // Give a specific message for extra leaves
            const messageText = originalLeave.isExtraRequest
                ? `${dayDifference} day(s) have been adjusted. The record is retained without updating the balance.`
                : `${dayDifference} day(s) refunded successfully. The record is retained.`;
            message.success(messageText);
        } else if (dayDifference < 0) {
            message.success(`${Math.abs(dayDifference)} day(s) have been re-deducted.`);
        }

        setIsAdjustDrawerVisible(false);
        setEditingLeave(null);

    } catch (error) {
        console.error("Error adjusting leave:", error);
        message.error("Failed to adjust leave record.");
    } finally {
        setLoading(false);
    }
};

const fetchCombinedEmployeeHistory = async (userId) => {
    // 1. Fetch regular leave applications
    const { data: regularLeaves, error: regularError } = await supabase
        .from('leave_applications')
        .select('*')
        .eq('user_id', userId);

    if (regularError) throw regularError;

    // 2. Fetch ONLY PENDING extra medical leave requests
    const { data: medicalRequests, error: medicalError } = await supabase
        .from('medical_leave_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'Pending'); // <-- CRUCIAL FIX: Only fetch pending requests
        
    if (medicalError) throw medicalError;

    // 3. Map PENDING medical requests to a common format
    const formattedMedicalRequests = medicalRequests.map(req => ({
        ...req, 
        leave_type: 'Medical Leave (Extra)',
        total_days: req.requested_days,
        applied_date: req.created_at,
        sub_type: 'Extra Request',
        isExtraRequest: true, // Flag to identify these for cancellation logic
    }));

    // 4. Combine and sort the data
    const combinedData = [...(regularLeaves || []), ...formattedMedicalRequests];
    combinedData.sort((a, b) => dayjs(b.applied_date || b.created_at).diff(dayjs(a.applied_date || a.created_at)));

    return combinedData;
}

 useEffect(() => {
  let filtered = leaveData;
  
  if (filterStatus !== 'All') {
    filtered = filtered.filter(leave => leave.status === filterStatus);
  }
  
  if (filterType !== 'All') {
    filtered = filtered.filter(leave => leave.leave_type === filterType);
  }
  
  if (filterEmployee !== 'All') {
    // UPDATED: Corrected the filter to use user_id
    filtered = filtered.filter(leave => leave.user_id === filterEmployee);
  }
  
  setFilteredLeaves(filtered);
}, [leaveData, filterStatus, filterType, filterEmployee]);
  // Animation styles
  const animationStyles = {
    container: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    headerCard: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-30px)',
      transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
    },
    statsCard: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-40px)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
    },
    mainCard: {
      opacity: isLoaded ? 1 : 0,
      transform: isLoaded ? 'translateY(0)' : 'translateY(-50px)',
      transition: 'all 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
    },
  };
// Add this component before LeaveManagementPage
// In leavemanage.jsx, add these new functions inside the LeaveManagementPage component
// In leavemanage.jsx, add this new function inside the LeaveManagementPage component

const fetchLastExtraMedicalRequest = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('medical_leave_requests')
            .select('status')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) // Get the most recent one
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // 'PGRST116' means no rows found, which is not an error here
            throw error;
        }

        setExtraMedicalRequest(data); // This will be the request object { status: '...' } or null
    } catch (error) {
        console.error("Error fetching last extra medical leave request:", error);
        setExtraMedicalRequest(null); // Ensure state is null on error
    }
};

const fetchPendingMedicalRequests = async () => {
    if (userRole === 'employee') return;
    try {
        const { data, error } = await supabase
            .from('medical_leave_requests')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    employee_id,
                    department,
                    email,
                    start_date,
                    employee_type
                )
            `)
            .eq('status', 'Pending');

        if (error) throw error;
        
        // Log to verify medical_certificate_url is present
        console.log('Fetched medical requests with certificates:', data);
        
        setPendingMedicalRequests(data || []);
    } catch (error) {
        console.error('Error fetching pending medical requests:', error);
        message.error(`Could not fetch pending requests: ${error.message}`);
    }
};

const handleExtraMedicalRequestSubmit = async (values) => {
    try {
        const { startDate, endDate, reason, medicalCertificate } = values;

        const { data: overlappingLeaves, error: overlapError } = await supabase
            .from('leave_applications')
            .select('id')
            .eq('user_id', currentUserId)
            .in('status', ['Approved', 'Pending'])
            .lte('start_date', endDate.format('YYYY-MM-DD'))
            .gte('end_date', startDate.format('YYYY-MM-DD'));

        if (overlapError) throw overlapError;

        if (overlappingLeaves && overlappingLeaves.length > 0) {
             message.error('You already have a leave application for these dates. Please check your history.');
             return; 
        }

        const calculatedDays = await countDeductibleDays(startDate, endDate);
        if (calculatedDays <= 0) {
            message.error("The selected date range contains no working days.");
            return;
        }

        const certificateUrl = await uploadFileToSupabase(medicalCertificate[0].originFileObj, 'medical-certificates');

        const newRequest = {
            user_id: currentUserId,
            start_date: startDate.format('YYYY-MM-DD'),
            end_date: endDate.format('YYYY-MM-DD'),
            reason,
            medical_certificate_url: certificateUrl,
            requested_days: calculatedDays,
            status: 'Pending',
        };

        const { data: insertedRequest, error } = await supabase.from('medical_leave_requests').insert(newRequest).select().single();
        if (error) throw error;
        
        // --- START: NEW INSTANT UI UPDATE LOGIC ---
        // Manually add the new pending request to the local state to show it immediately
        const newLeaveForHistory = {
            ...insertedRequest,
            leave_type: 'Medical Leave (Extra)',
            total_days: insertedRequest.requested_days,
            applied_date: insertedRequest.created_at,
            sub_type: 'Extra Request',
            isExtraRequest: true,
        };
        setLeaveData(prevData => [newLeaveForHistory, ...prevData]);
        // --- END: NEW INSTANT UI UPDATE LOGIC ---

        setExtraMedicalRequest({ status: 'Pending' }); 
        message.success('Your request for additional medical leave has been submitted to HR.');
        
        setExtraMedicalRequestDrawer(false); 
        form.resetFields();

    } catch (error) {
        console.error('Error submitting extra medical leave request:', error);
        message.error('Failed to submit your request.');
    } 
};
// In leavemanage.jsx, replace the existing handleApproveMedicalRequest function

// In leavemanage.jsx, replace the entire handleApproveMedicalRequest function with this one.

// In leavemanage.jsx
// This is a new function from the previous step, now with the required fix.
// Make sure this function exists inside your LeaveManagementPage component.

// In leavemanage.jsx
// Replace the existing handleApproveMedicalRequest function with this one.

const handleApproveMedicalRequest = async (request, approvedDaysArray, hrComments) => {
    setLoading(true);
    try {
        const employeeId = request.user_id;
        const userData = request.users;
        const approvedDaysCount = approvedDaysArray.length;

        if (!userData) throw new Error("Could not find the employee's details.");
        if (approvedDaysCount <= 0) {
            message.warning("Please select at least one day to approve.");
            setLoading(false);
            return;
        }

        const sortedDays = [...approvedDaysArray].sort();
        const startDate = dayjs(sortedDays[0]);
        const endDate = dayjs(sortedDays[sortedDays.length - 1]);

        const newLeaveApplication = {
            user_id: employeeId,
            employee_name: userData.name,
            employee_code: userData.employee_id,
            department: userData.department || 'General',
            position: userData.position || 'Employee', 
            leave_type: 'Medical Leave',
            start_date: startDate.format('YYYY-MM-DD'),
            end_date: endDate.format('YYYY-MM-DD'),
            total_days: approvedDaysCount,
            reason: `(HR Granted) ${request.reason}`,
            medical_certificate: request.medical_certificate_url,
            status: 'Approved',
            approved_by: currentUser?.name || 'HR',
            approved_date: new Date().toISOString(),
            hr_comments: hrComments,
            approved_dates: approvedDaysArray, // FIX: Ensure this is included
            initial_approved_dates: approvedDaysArray,
            isExtraRequest: true
        };

        const { data: insertedLeave, error: insertError } = await supabase
            .from('leave_applications')
            .insert(newLeaveApplication)
            .select('*, users!inner(*)')
            .single();

        if (insertError) throw insertError;

        await supabase.from('medical_leave_requests').update({
            status: 'Approved',
            approved_days: approvedDaysCount,
            hr_comments: hrComments,
        }).eq('id', request.id);

        message.success(`Request approved. Extra medical leave for ${approvedDaysCount} day(s) granted.`);

        // FIX: Add the new leave record with all fields including approved_dates
        setLeaveData(prevData => [insertedLeave, ...prevData]);
        setFilteredLeaves(prevData => [insertedLeave, ...prevData]);
        
        setPendingMedicalRequests(prev => prev.filter(r => r.id !== request.id));
        setSelectedMedicalRequest(null);
        setSelectedRequestForReview(null);

    } catch (error) {
        console.error('Error approving extra medical request:', error);
        message.error(`Failed to approve request: ${error.message}`);
    } finally {
        setLoading(false);
    }
};


// Add a simple reject handler as well
const handleRejectMedicalRequest = async (reason) => {
    if (!selectedMedicalRequest) return;
    setLoading(true);
    try {
        await supabase.from('medical_leave_requests').update({
            status: 'Rejected',
            hr_comments: reason,
            approved_by: currentUser?.id
        }).eq('id', selectedMedicalRequest.id);
        
        message.success('Request has been rejected.');
        setHrMedicalApprovalModal(false);
        setSelectedMedicalRequest(null);
        fetchPendingMedicalRequests(); // Refresh list
    } catch (error) {
        message.error('Failed to reject request.');
    } finally {
        setLoading(false);
    }
};
// In leavemanage.jsx...

// In leavemanage.jsx...

const RequestExtraMedicalLeaveDrawer = ({ visible, onCancel, onSubmit }) => {
    const [form] = Form.useForm();
    const [daysCount, setDaysCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false); // Internal loading state

    const calculateDays = async () => {
        const { startDate, endDate } = form.getFieldsValue();
        if (startDate && endDate && (endDate.isAfter(startDate) || endDate.isSame(startDate))) {
            const deductibleDays = await countDeductibleDays(startDate, endDate);
            setDaysCount(deductibleDays);
        } else {
            setDaysCount(0);
        }
    };

    const handleFormSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            await onSubmit(values);
            // On successful submission, the parent will close the drawer via the 'visible' prop
        } catch (error) {
            // Error is handled in the parent, but we must stop loading here
            console.error("Submission failed in drawer:", error);
        } finally {
            setIsSubmitting(false); // Stop loading regardless of outcome
        }
    };
    
    // --- START: MODIFIED SECTION ---
    const handleValuesChange = (changedValues, allValues) => {
        // If the startDate is changed, automatically update the endDate
        if (changedValues.startDate) {
            form.setFieldsValue({ endDate: changedValues.startDate });
        }
        calculateDays();
    };
    // --- END: MODIFIED SECTION ---


    return (
        <Drawer
            title="Request Additional Medical Leave"
            width={window.innerWidth > 768 ? 500 : '95%'}
            onClose={onCancel}
            open={visible}
            destroyOnClose
            footer={
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                    <Button type="primary" onClick={() => form.submit()} loading={isSubmitting}>
                        Submit to HR
                    </Button>
                </Space>
            }
        >
            {/* --- START: MODIFIED SECTION --- */}
            <Form form={form} layout="vertical" onFinish={handleFormSubmit} onValuesChange={handleValuesChange}>
            {/* --- END: MODIFIED SECTION --- */}
                <Alert
                    message="Your standard medical leave balance is zero."
                    description="Please fill this form to request additional leave. Your request and medical certificate will be reviewed by HR."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="startDate" label="From Date" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="endDate" label="To Date" rules={[{ required: true }]}>
                            {/* --- START: MODIFIED SECTION --- */}
                            <DatePicker 
                                style={{ width: '100%' }}
                                disabledDate={(current) => {
                                    const startDate = form.getFieldValue('startDate');
                                    return current && startDate && current < startDate;
                                }}
                             />
                             {/* --- END: MODIFIED SECTION --- */}
                        </Form.Item>
                    </Col>
                </Row>
                {daysCount > 0 && (
                    <Statistic
                        title="Total Working Days in Request"
                        value={daysCount}
                        suffix="day(s)"
                        style={{ textAlign: 'center', marginBottom: 24, padding: '10px', background: '#f6ffed', borderRadius: '8px' }}
                    />
                )}
                <Form.Item name="reason" label="Reason for Leave" rules={[{ required: true }]}>
                    <Input.TextArea rows={3} placeholder="Describe the medical reason..." />
                </Form.Item>
                <Form.Item
                    name="medicalCertificate"
                    label="Medical Certificate (Required)"
                    rules={[{ required: true, message: 'A medical certificate is mandatory' }]}
                    valuePropName="fileList"
                    getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
                >
                    <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
                        <div><PlusOutlined /> <div style={{ marginTop: 8 }}>Upload</div></div>
                    </Upload>
                </Form.Item>
            </Form>
        </Drawer>
    );
};


// Helper to count only working days (exclude weekends + holidays)
// In leavemanage.jsx, replace the existing countDeductibleDays function




// In leavemanage.jsx, replace the existing calculateLeaveDays function
// In leavemanage.jsx, replace the existing calculateLeaveDays function

const calculateLeaveDays = async () => {
  const startDate = form.getFieldValue('startDate');
  const endDate = form.getFieldValue('endDate');
  const leaveType = form.getFieldValue('leaveType');
  const subType = form.getFieldValue('subType'); // This will be 'HDL' or 'FDL'

  if (!startDate || !leaveType) {
    setCalculatedDays(0);
    setBalanceWarning('');
    return;
  }

  // In calculateLeaveDays function, replace the day calculation logic:

let days = 0;

if (!startDate || !leaveType) {
  setCalculatedDays(0);
  setBalanceWarning('');
  return;
}

if (leaveType === 'Permission') {
  days = 0;
} else if (leaveType === 'Excuses') {
  days = 1;
} else if (leaveType === 'Casual Leave' && subType === 'HDL') {
  days = 0.5;
} else if (leaveType === 'Compensatory Leave' || leaveType === 'Earned Leave') {
  // FIXED: Count ALL days including weekends/holidays
const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate || startDate).startOf('day');
  days = end.diff(start, 'day') + 1; // +1 to include the start day
  console.log('DEBUG Comp/Earned:', { 
    start: start.format('YYYY-MM-DD'), 
    end: end.format('YYYY-MM-DD'), 
    diff: end.diff(start, 'days'),
    days 
  });

} else if (leaveType === 'Casual Leave' && subType === 'FDL') {
  days = await countDeductibleDays(startDate, endDate || startDate);
} else if (leaveType === 'Medical Leave') {
  days = await countDeductibleDays(startDate, endDate || startDate);
} else {
  // Fallback for other types
  const start = dayjs(startDate);
  const end = dayjs(endDate || startDate);
  days = end.diff(start, 'days') + 1;
}

setCalculatedDays(days);
console.log('DEBUG calculateLeaveDays final:', { leaveType, subType, days });

  const currentBalance = getCurrentBalance(leaveType);
  if (days > 0 && days > currentBalance && leaveType !== 'On Duty' && leaveType !== 'Overtime') {
    setBalanceWarning(`ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ You don't have enough balance for ${leaveType}. Only ${currentBalance} available.`);
  } else if (days > 0) {
    setBalanceWarning(`ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ This will deduct ${days} day(s) from your ${leaveType} balance.`);
  } else {
    setBalanceWarning('');
  }
};
// Helper function to get current balance
const getCurrentBalance = (leaveType) => {
  switch (leaveType) {
case 'Permission': 
  return leaveBalances.permission?.remaining || 0; 
    case 'Casual Leave': 
      return leaveBalances.casualLeave?.remaining || 0;
    case 'Earned Leave': return leaveBalances.earnedLeave?.remaining || 0;
    case 'Medical Leave': return leaveBalances.medicalLeave?.remaining || 0;
    case 'Maternity Leave': return leaveBalances.maternityLeave?.remaining || 0;
    case 'Compensatory Leave': return leaveBalances.compensatoryLeave?.remaining || 0;
    case 'Excuses': return leaveBalances.excuses?.remaining || 0;
    default: return 999; // For leaves without balance like 'On Duty'
  }
};

// Add watchers to form fields
useEffect(() => {
  calculateLeaveDays();
}, [form.getFieldValue('startDate'), form.getFieldValue('endDate'), form.getFieldValue('leaveType'), form.getFieldValue('subType')]);


// In leavemanage.jsx, REPLACE the entire handleApplyLeave function with this one.

const handleApplyLeave = async (values) => {
  setLoading(true);
  try {
    // CRITICAL FIX: Extract editingId from form FIRST
    const editingId = form.getFieldValue('editingId');
    
    const { startDate, endDate, leaveType, subType, startTime, endTime, session } = values;
    const effectiveEndDate = (leaveType === 'Casual Leave' && subType === 'HDL') || 
                             leaveType === 'Permission' || 
                             leaveType === 'Excuses'
                             ? startDate
                             : (endDate || startDate);

    // 1. Fetch overlapping leaves
    const { data: overlappingLeaves, error: overlapError } = await supabase
      .from('leave_applications')
      .select('id, leave_type, start_date, end_date, status, total_days, sub_type, approved_dates')
      .eq('user_id', currentUserId)
      .in('status', ['Approved', 'Pending'])
      .lte('start_date', effectiveEndDate.format('YYYY-MM-DD'))
      .gte('end_date', startDate.format('YYYY-MM-DD'));

    if (overlapError) throw overlapError;

    // 2. Check for pending overlaps - EXCLUDE the leave being edited
    const hasPendingOverlap = overlappingLeaves?.some(leave => {
        // CRITICAL: If editing, skip the current leave being edited
        if (editingId && String(leave.id) === String(editingId)) {
            return false;
        }

        // Only check Pending status
        if (leave.status !== 'Pending') {
            return false;
        }

        // Check for date range intersection
        const pendingStart = dayjs(leave.start_date);
        const pendingEnd = dayjs(leave.end_date);
        const newRequestStart = dayjs(startDate);
        const newRequestEnd = dayjs(effectiveEndDate);

        return pendingStart.isSameOrBefore(newRequestEnd, 'day') && 
               newRequestStart.isSameOrBefore(pendingEnd, 'day');
    });

    if (hasPendingOverlap) {
      Modal.warning({
        title: 'Pending Leave Exists',
        content: `You already have a pending leave request covering this period. Please wait for it to be processed before submitting another.`,
        onOk: () => setLeaveHistoryDrawer(true),
        okText: 'View History'
      });
      setLoading(false);
      return;
    }

    // 3. Calculate already approved days from the fetched leaves (This is from the previous fix and remains correct)
    const alreadyApprovedDays = overlappingLeaves
      ?.filter(leave => leave.status === 'Approved' && leave.approved_dates?.includes(startDate.format('YYYY-MM-DD')))
      .reduce((sum, leave) => {
          // Handle half-day logic
          const dayValue = (leave.sub_type && leave.sub_type.includes('HDL')) ? 0.5 : 1;
          return sum + dayValue;
      }, 0) || 0;


    // In handleApplyLeave, find the totalDays calculation and replace:

let totalDays = 0;

if (leaveType === 'Permission') {
  totalDays = 0;
} else if (leaveType === 'Excuses') {
  totalDays = 1;
} else if (leaveType === 'Casual Leave' && subType === 'HDL') {
  totalDays = 0.5;
} else if (leaveType === 'Compensatory Leave' || leaveType === 'Earned Leave') {
   const start = dayjs(startDate).startOf('day');
  const end = dayjs(effectiveEndDate).startOf('day');
  totalDays = end.diff(start, 'day') + 1; // +1 to include the start day
  console.log('DEBUG handleApplyLeave Comp/Earned:', {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
    diff: end.diff(start, 'days'),
    totalDays
  });

} else if (leaveType === 'Casual Leave' || leaveType === 'Medical Leave') {
  totalDays = await countDeductibleDays(startDate, effectiveEndDate);
} else {
  // Fallback for other types (Maternity, On Duty, etc.)
  const start = dayjs(startDate);
  const end = dayjs(effectiveEndDate);
  totalDays = end.diff(start, 'days') + 1;
}

console.log('DEBUG handleApplyLeave final totalDays:', { leaveType, totalDays });

    // 4. Adjust the deduction amount based on existing approved leave
    const finalDeductionDays = Math.max(0, totalDays - alreadyApprovedDays);

   // Correct
    if (totalDays > 0 && finalDeductionDays <= 0) {
      Modal.info({
        title: 'Leave Already Covered',
        content: `The dates you selected are already covered by an approved leave. No new application will be created.`
      });
      setLoading(false);
      return;
    }

    if (totalDays > 0 && finalDeductionDays < totalDays) {
      message.info(`Adjusted deduction: Only ${finalDeductionDays} day(s) will be deducted as you already have approved leave on this day.`);
    }

    // 5. Use the 'finalDeductionDays' for balance validation (No changes below this line)
    const currentBalance = getCurrentBalance(leaveType);
    const isValidationRequired = !['On Duty', 'Overtime'].includes(leaveType);

   if (isValidationRequired && finalDeductionDays > currentBalance) {
        message.error(`You don't have enough ${leaveType}. You need ${finalDeductionDays} day(s), but only ${currentBalance} are available.`);
        setLoading(false);
        return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUserId)
      .single();

    if (!userData) {
      message.error('User information not found');
      setLoading(false);
      return;
    }

    let medicalCertificateUrl = null;
    let attachmentUrl = null;

    if (values.medicalCertificate && values.medicalCertificate.length > 0) {
      medicalCertificateUrl = await uploadFileToSupabase(values.medicalCertificate[0].originFileObj);
    }

    if (values.attachment && values.attachment.length > 0) {
      attachmentUrl = await uploadFileToSupabase(values.attachment[0].originFileObj);
    }

   let permissionHours = 0;
    if (values.leaveType === 'Permission' && values.startTime && values.endTime) {
        const diffInMinutes = values.endTime.diff(values.startTime, 'minute');
        permissionHours = Math.round((diffInMinutes / 60) * 100) / 100;
    }

    let correctedSubType = subType;
    if (finalDeductionDays > 0 && finalDeductionDays < 1 && subType !== 'HDL') {
        correctedSubType = 'HDL - (Auto-Adjusted)';
    }

   const leaveDataPayload  = {
      user_id: currentUserId,
      employee_name: userData.name,
      employee_code: userData.employee_id,
      department: userData.department || 'General',
      position: userData.position || 'Employee',
      email: userData.email,
      join_date: userData.start_date,
      employee_type: userData.employee_type,
      leave_type: values.leaveType,
      sub_type: correctedSubType === 'HDL' ? `${correctedSubType} - ${session}` : correctedSubType,
      start_date: values.startDate.format('YYYY-MM-DD'),
      end_date: subType === 'HDL' ? values.startDate.format('YYYY-MM-DD') : (values.endDate || values.startDate).format('YYYY-MM-DD'),
      start_time: values.startTime ? values.startTime.format('HH:mm') : null,
      end_time: values.endTime ? values.endTime.format('HH:mm') : null,
      total_days: finalDeductionDays, // Use the adjusted days for the record
      total_hours: permissionHours,
      reason: values.reason,
      medical_certificate: medicalCertificateUrl,
      attachment: attachmentUrl,
      status: 'Pending',
      working_days_at_application: currentUser?.workingDays || 0
    };

    if (editingId) {
        const { error } = await supabase
            .from('leave_applications')
            .update(leaveDataPayload)
            .eq('id', editingId);
        if (error) throw error;
        setLeaveData(prevData =>
            prevData.map(item => item.id === editingId ? {...item, ...leaveDataPayload} : item)
        );
        message.success('Leave application updated successfully!');
    } else {
      const { error } = await supabase
        .from('leave_applications')
       .insert([leaveDataPayload]);
      if (error) throw error;
      message.success('Leave application submitted successfully!');
    }

    clearCache();
    const updatedLeaves = await fetchCombinedEmployeeHistory(currentUserId);
    setLeaveData(updatedLeaves);

    if (userRole === 'employee') {
      const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
      setLeaveBalances(updatedBalances);
    }

    setApplyLeaveModal(false);
    form.resetFields();
    setBalanceWarning('');
    setCalculatedDays(0);

  } catch (error) {
    console.error('Error submitting/updating leave:', error);
    message.error('Failed to process leave application.');
  } finally {
    setLoading(false);
  }
};
// In LeaveManagementPage.jsx
{/* Add this after the date selection Row */}
{balanceWarning && (
  <Alert
    message={balanceWarning}
    type={balanceWarning.includes('ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢') ? 'error' : 'success'}
    showIcon
    style={{ marginBottom: '16px' }}
  />
)}
const updateLeaveBalance = async (userId, leaveType, days, subType = null) => {
  try {
    // First ensure user has a balance record
    await initializeUserLeaveBalance(userId);
    
    const { data: currentBalances, error: fetchError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching leave balances:', fetchError.message);
      return;
    }

    const updates = { updated_at: new Date().toISOString() };
    // FIX: Define 'actualDays' here to make it available throughout the function's scope.
    // It's initialized with the default 'days' value.
    let actualDays = days;
        
    switch (leaveType) {
      case 'Permission':
        const hoursUsed = days; // 'days' parameter now represents hours for Permission
        updates.permission_used = (currentBalances.permission_used || 0) + hoursUsed;
        updates.permission_remaining = Math.max(0, (currentBalances.permission_remaining || 4) - hoursUsed);
        // FIX: Re-assign the value for logging purposes.
        actualDays = hoursUsed;
        break;
        
      case 'Casual Leave':
        // FIX: Re-assign the value, remove the block-scoped 'const'.
        actualDays = subType && subType.includes('HDL') ? 0.5 : days;
        updates.casual_used = (currentBalances.casual_used || 0) + actualDays;
        updates.casual_remaining = Math.max(0, (currentBalances.casual_remaining || 12) - actualDays);
        break;
        
      case 'Earned Leave':
        updates.earned_used = (currentBalances.earned_used || 0) + days;
        updates.earned_remaining = Math.max(0, (currentBalances.earned_remaining || 0) - days);
        break;
        
      case 'Medical Leave':
        updates.medical_used = (currentBalances.medical_used || 0) + days;
        updates.medical_remaining = Math.max(0, (currentBalances.medical_remaining || 12) - days);
        break;

      case 'Maternity Leave':
        updates.maternity_used = (currentBalances.maternity_used || 0) + days;
        updates.maternity_remaining = Math.max(0, (currentBalances.maternity_remaining || 84) - days);
        break;
        
      case 'Compensatory Leave':
        updates.compensatory_used = (currentBalances.compensatory_used || 0) + days;
        updates.compensatory_remaining = Math.max(0, (currentBalances.compensatory_remaining || 0) - days);
        break;
        
      case 'Excuses':
        updates.excuses_used = (currentBalances.excuses_used || 0) + 1;
        updates.excuses_remaining = Math.max(0, (currentBalances.excuses_remaining || 1) - 1);
        break;
      
      default:
        return;
    }

    const { error: updateError } = await supabase
      .from('leave_balances')
      .update(updates)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating leave balances:', updateError.message);
    } else {
      // FIX: Use the correctly scoped 'actualDays' variable.
      console.log(`Leave balance updated: ${actualDays} days deducted for user:`, userId);
    }

  } catch (error) {
    console.error('Error in updateLeaveBalance:', error);
  }
};
// Add this new helper function
const formatPermissionHours = (decimalHours) => {
  if (!decimalHours || decimalHours <= 0) {
    return '';
  }
  // Convert decimal hours to total minutes to avoid floating point issues
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  return parts.length > 0 ? parts.join(' ') : '0m';
};
const calculateEarnedLeaveTotal = async (userId) => {
  // Cache holidays to prevent repeated fetching
  if (!window.holidayCache) {
    window.holidayCache = await fetchCompanyCalendar();
  }
  const holidays = window.holidayCache;
  
  const totalWorkingDaysPresent = await fetchWorkingDays(userId, holidays);
  return Math.floor(totalWorkingDaysPresent / 20);
};

const calculateCompensatoryLeaveTotal = async (userId) => {
  // Cache holidays to prevent repeated fetching
  if (!window.holidayCache) {
    window.holidayCache = await fetchCompanyCalendar();
  }
  const holidays = window.holidayCache;
  
  return await fetchCompensatoryOffDays(userId, holidays);
};
// 7. Add function to get available leave types:
  const getAvailableLeaveTypes = () => {
    const available = [];
    
    // These leaves are only available if there is a balance
    if (leaveBalances.permission?.remaining > 0) available.push('Permission');
if (leaveBalances.casualLeave?.remaining > 0) available.push('Casual Leave');    if (leaveBalances.earnedLeave?.remaining > 0) available.push('Earned Leave');
    if (leaveBalances.maternityLeave?.remaining > 0) available.push('Maternity Leave');
    if (leaveBalances.compensatoryLeave?.remaining > 0) available.push('Compensatory Leave');
    if (leaveBalances.excuses?.remaining > 0) available.push('Excuses');
    
    if ((leaveBalances.medicalLeave?.remaining || 0) > 0) {
  available.push('Medical Leave');
}

    
    // These are always available (no balance limits)
    available.push('On Duty', 'Overtime');
    
    return available;
  };


 // In leavemanage.jsx
// Replace the existing initializeUserLeaveBalance function with this one

const initializeUserLeaveBalance = async (userId) => {
  try {
    // Check if balance record already exists
    const { data: existingBalance } = await supabase
      .from('leave_balances')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingBalance) {
      return; // Balance already exists
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    if (!userData) {
      console.error('User not found:', userId);
      return;
    }

    // --- NEW: Prorated Leave Calculation ---
    // Calculates leaves based on months remaining in the year.
    // dayjs().month() is 0-indexed (Jan=0), so we add 1.
    const currentMonth = dayjs().month() + 1; 
    const proratedLeaves = 12 - currentMonth + 1; // +1 to include the current month

    // Create initial balance record
    const { error } = await supabase
      .from('leave_balances')
      .insert([{
        user_id: userId,
    employee_name: userData.name,
    permission_total: 4, // Changed from 2
    permission_used: 0, // Now stores hours
    permission_remaining: 4, // Changed from 2
        // --- UPDATED: Use prorated values for the first year ---
        casual_total: proratedLeaves,
        casual_used: 0,
        casual_remaining: proratedLeaves,
        earned_total: 0,
        earned_used: 0,
        earned_remaining: 0,
        medical_total: proratedLeaves,
        medical_used: 0,
        medical_remaining: proratedLeaves,
        // --- End of Update ---
        maternity_total: 84,
        maternity_used: 0,
        maternity_remaining: 84,
        compensatory_total: 0,
        compensatory_used: 0,
        compensatory_remaining: 0,
        excuses_total: 1,
        excuses_used: 0,
        excuses_remaining: 1
      }]);

    if (error) {
      console.error('Error initializing leave balance:', error);
    } else {
      console.log(`Leave balance initialized for user ${userId} with ${proratedLeaves} prorated leaves.`);
    }

  } catch (error) {
    console.error('Error in initializeUserLeaveBalance:', error);
  }
};
// In leavemanage.jsx
// In leavemanage.jsx, replace the existing handleApproveLeave function
const handleApproveLeave = async (leave, selectedDays, comments) => {
    setLoading(true);
    try {
        // Handle Permission leave differently (no day selection needed)
        if (leave.leave_type === 'Permission') {
            const updates = {
                status: 'Approved',
                approved_by: currentUser?.name || 'Admin',
                approved_date: new Date().toISOString(),
                hr_comments: comments || 'Permission approved',
            };

            const { error } = await supabase
                .from('leave_applications')
                .update(updates)
                .eq('id', leave.id);

            if (error) throw error;

            // Update leave balance with hours
            await updateLeaveBalance(leave.user_id, leave.leave_type, leave.total_hours, leave.sub_type);

            setLeaveData(prev => prev.map(l => 
                l.id === leave.id 
                    ? { ...l, ...updates }
                    : l
            ));
            
            setFilteredLeaves(prev => prev.map(l => 
                l.id === leave.id 
                    ? { ...l, ...updates }
                    : l
            ));

            message.success(`Permission approved for ${leave.total_hours} hours.`);
            return; // Exit early for Permission
        }

        // --- START OF FIX ---
        // For half-day leaves, we must use the original fractional value (0.5).
        // For all other leaves, the new total is the count of days HR explicitly selected.
        const isHalfDay = leave.sub_type && leave.sub_type.includes('HDL');
        const newTotalDays = isHalfDay ? leave.total_days : selectedDays.length;
        // --- END OF FIX ---

        if (newTotalDays <= 0 && !isHalfDay) { // Allow 0.5 to pass
             message.error("Cannot approve leave with zero days selected.");
             setLoading(false);
             return;
        }

        // The start and end dates are determined by what HR selects in the UI.
        const sortedDays = selectedDays.sort((a, b) => new Date(a) - new Date(b));
        const newStartDate = sortedDays[0];
        const newEndDate = sortedDays[sortedDays.length - 1];

        const updates = {
            status: 'Approved',
            approved_by: currentUser?.name || 'Admin',
            approved_date: new Date().toISOString(),
            hr_comments: comments,
            start_date: newStartDate,
            end_date: newEndDate,
            total_days: newTotalDays, // Use the CORRECT calculated value
            approved_dates: selectedDays,
            initial_approved_dates: selectedDays,
        };

        const { error } = await supabase
            .from('leave_applications')
            .update(updates)
            .eq('id', leave.id);

        if (error) throw error;

        // The correct deduction amount (e.g., 3 days) is now passed to the balance update function.
        await updateLeaveBalance(leave.user_id, leave.leave_type, newTotalDays, leave.sub_type);

        setSelectedRequestForReview(null);
        
        setLeaveData(prev => prev.map(l => 
            l.id === leave.id 
                ? { ...l, ...updates }
                : l
        ));
        
        setFilteredLeaves(prev => prev.map(l => 
            l.id === leave.id 
                ? { ...l, ...updates }
                : l
        ));

        message.success(`Leave approved for ${newTotalDays} days.`);

    } catch (error) {
        console.error('Error approving leave:', error);
        message.error('Failed to approve leave.');
    } finally {
        setLoading(false);
    }
};
// Update the handleLeaveAction function:
const handleLeaveAction = async (leave, selectedDays, comments) => {
    // This function now handles approvals from the new calendar drawer. Rejection can be simpler.
    setLoading(true);
    try {
        // Sort days to find the new start and end date for the record
        const sortedDays = selectedDays.sort((a, b) => new Date(a) - new Date(b));
        const newStartDate = sortedDays[0];
        const newEndDate = sortedDays[sortedDays.length - 1];
        const newTotalDays = selectedDays.length;

        const updates = {
            status: 'Approved',
            approved_by: currentUser?.name || 'Admin',
            approved_date: new Date().toISOString(),
            // CRUCIAL: Store the exact approved dates
            // NOTE: You must add a column named `approved_dates` of type `jsonb` or `text[]` to your `leave_applications` table in Supabase.
            approved_dates: selectedDays,
            hr_comments: comments,
            start_date: newStartDate,
            end_date: newEndDate,
            total_days: newTotalDays,
        };
        
        const { error } = await supabase
            .from('leave_applications')
            .update(updates)
            .eq('id', leave.id);
        
        if (error) throw error;
        
        // Update the employee's balance with the new total days
        await updateLeaveBalance(leave.user_id, leave.leave_type, newTotalDays, leave.sub_type);
        
        // This closes the drawer by resetting the state in the parent component
        setSelectedMedicalRequest(null); 
        
        // Refresh data on screen
        setLeaveData(prev => prev.map(l => l.id === leave.id ? { ...l, ...updates } : l));

        message.success(`Leave approved for ${newTotalDays} days.`);

    } catch (error) {
        console.error('Error approving leave:', error);
        message.error('Failed to approve leave.');
    } finally {
        setLoading(false);
    }
};
const handleRejectLeave = async (leaveId, reason) => {
    setLoading(true);
    try {
        const updates = { 
            status: 'Rejected', 
            rejection_reason: reason, 
            rejected_by: currentUser?.name || 'Admin',
            rejected_date: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('leave_applications')
            .update(updates)
            .eq('id', leaveId);

        if (error) throw error;

        // FIX: Update both leaveData and filteredLeaves immediately
        setLeaveData(prev => prev.map(l => 
            l.id === leaveId 
                ? { ...l, ...updates }
                : l
        ));
        
        setFilteredLeaves(prev => prev.map(l => 
            l.id === leaveId 
                ? { ...l, ...updates }
                : l
        ));

        message.success('Leave has been rejected.');
        setSelectedRequestForReview(null);
        
    } catch (error) {
        console.error('Error rejecting leave:', error);
        message.error('Failed to reject leave.');
    } finally {
        setLoading(false);
    }
};
  // Get permission time icon
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

  // Employee Dashboard Component
const EmployeeDashboard = () => (
  <Spin spinning={loading} tip="Fetching your leave data..." size="large">
    <div style={animationStyles.container}>
      {/* Mobile-Responsive Header */}
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
            <Space size="large" direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar 
                  size={{ xs: 48, sm: 64 }} 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: '#0D7139', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Title 
                    level={2} 
                    style={{ 
                      margin: 0, 
                      color: '#0D7139',
                      fontSize: 'clamp(18px, 4vw, 24px)' // Responsive font size
                    }}
                  >
                    Leave Dashboard
                  </Title>
                  <Text type="secondary" style={{ 
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    display: 'block'
                  }}>
                    {currentUser?.position}       • {currentUser?.department}
                  </Text>
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setApplyLeaveModal(true)}
              block // Make button full width on mobile
              style={{
                background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '50px'
              }}
            >
              Apply Leave
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Leave Balance Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: '24px' }}>
        {loading ? (
          // Skeleton Loading State
          Array.from({ length: 7 }).map((_, index) => (
            <Col xs={12} sm={8} md={6} lg={4} xl={4} key={index}>
              <Card 
                style={{ 
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
                styles={{ body: { padding: '12px' } }}
              >
                <div style={{ textAlign: 'center', height: '135px' }}>
                  <Spin />
                </div>
              </Card>
            </Col>
          ))
        ) : (
          // Actual Data
          Object.entries(leaveBalances).map(([key, balance]) => {
            const leaveTypeNames = {
              permission: 'Permission',
              casualLeave: 'Casual Leave',
              earnedLeave: 'Earned Leave',
              medicalLeave: 'Medical Leave',
              maternityLeave: 'Maternity Leave',
              compensatoryLeave: 'Compensatory Leave',
              excuses: 'Excuses'
            };

            const config = getLeaveTypeConfig(leaveTypeNames[key]);
            const percentage = balance.total > 0 ? (balance.remaining / balance.total) * 100 : 0;
            return (
              <Col xs={12} sm={8} md={6} lg={4} xl={4} key={key}>
                <Card 
                  style={{ 
                    borderRadius: '12px',
                    background: '#ffffff', 
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    ...animationStyles.statsCard 
                  }}
                  styles={{ body: { padding: '12px' } }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: 'clamp(18px, 4vw, 24px)',
                      color: config.color, 
                      marginBottom: '6px' 
                    }}>
                      {config.icon}
                    </div>
                    <Title level={5} style={{ 
                      margin: '0 0 6px 0', 
                      color: config.color,
                      fontSize: 'clamp(11px, 2.5vw, 14px)',
                      lineHeight: '1.2'
                    }}>
                      {leaveTypeNames[key]}
                    </Title>
                  <div style={{ marginBottom: '8px' }}>
  <Text style={{ 
    fontSize: 'clamp(16px, 4vw, 20px)', 
    fontWeight: 'bold', 
    color: config.color 
  }}>
      {key === 'permission' ? formatPermissionHours(balance.remaining) : balance.remaining}
  </Text>
  <Text type="secondary" style={{ 
    fontSize: 'clamp(10px, 2vw, 12px)', 
    marginLeft: '2px' 
  }}>
    / {key === 'permission' ? balance.total + 'h' : (key === 'medicalLeave' ? balance.totalAvailable || balance.total : balance.total)}
  </Text>
</div>
                    {key === 'medicalLeave' && balance.extraGranted > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <Text style={{ fontSize: '9px', color: '#ff4d4f' }}>
                          +{balance.extraGranted} HR granted
                        </Text>
                      </div>
                    )}
                    <Progress 
                      percent={percentage}
                      strokeColor={config.color}
                      showInfo={false}
                      size="small"
                    />
                    <div style={{ marginTop: '6px' }}>
                      <Text type="secondary" style={{ fontSize: 'clamp(9px, 2vw, 11px)' }}>
                       Used: {key === 'permission' ? formatPermissionHours(balance.used) : balance.used}
                      </Text>
                    </div>
                  <div style={{ minHeight: '38px', marginTop: '10px' }}>
  {key === 'medicalLeave' && balance.remaining <= 0 && (
    <>
      {extraMedicalRequest?.status === 'Pending' && (
        <Tag icon={<ClockCircleOutlined />} color="warning" style={{ width: '100%', padding: '5px', fontSize: '12px' }}>
          Request Pending
        </Tag>
      )}
      {extraMedicalRequest?.status === 'Approved' && (
        <Tag icon={<CheckCircleOutlined />} color="success" style={{ width: '100%', padding: '5px', fontSize: '12px' }}>
          Request Approved
        </Tag>
      )}
      {extraMedicalRequest?.status === 'Rejected' && (
        <Tag icon={<CloseCircleOutlined />} color="error" style={{ width: '100%', padding: '5px', fontSize: '12px' }}>
          Request Rejected
        </Tag>
      )}
      {!extraMedicalRequest && ( // Only show button if there is no request status to display
        <Button
          type="primary"
          danger
          block
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setExtraMedicalRequestDrawer(true)}
        >
          Request Extra Leave
        </Button>
      )}
    </>
  )}
</div>
                  </div>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      {/* Recent Leave Applications */}
      <Card style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        ...animationStyles.mainCard
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={4} style={{ margin: 0, color: '#0D7139' }}>
            <HistoryOutlined style={{ marginRight: '8px' }} />
            Recent Applications
          </Title>
          <Button 
            type="text" 
            onClick={() => setLeaveHistoryDrawer(true)}
            style={{ color: '#0D7139' }}
          >
            View All
          </Button>
        </div>
        
        <div style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
          {/* Timeline or Empty State */}
          {!loading && filteredLeaves.length === 0 ? (
            <Empty description="No recent applications found." />
          ) : (
            // In the EmployeeDashboard component, update the Timeline items mapping:
<Timeline
  items={filteredLeaves.slice(0, 5).map(leave => {
    const config = getLeaveTypeConfig(leave.leave_type || leave.leaveType);
    return {
      key: leave.id,
      dot: <div style={{ 
        width: '12px', 
        height: '12px', 
        borderRadius: '50%', 
        background: config.gradient,
        border: '2px solid white', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
      }} />,
      children: (
        <Card 
          size="small" 
          style={{ 
            marginBottom: '8px',
            borderRadius: '8px',
            border: `1px solid ${config.color}20`,
            background: `linear-gradient(135deg, ${config.color}08 0%, ${config.color}03 100%)`
          }}
          styles={{ body: { padding: '12px' } }}
        >
          <Row align="middle" justify="space-between">
            <Col flex="auto">
              <Space>
                {config.icon}
                <div>
                  <Text strong style={{ color: config.color }}>
                    {leave.leave_type || leave.leaveType}
                    {(leave.sub_type || leave.subType) && ` (${leave.sub_type || leave.subType})`}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {/* Show original dates */}
                    Applied: {dayjs(leave.start_date || leave.startDate).format('MMM DD')} - {dayjs(leave.end_date || leave.endDate).format('MMM DD, YYYY')}
                    
                    {/* Show approved dates if available */}
                    {leave.status === 'Approved' && leave.approved_dates && leave.approved_dates.length > 0 && (
                      <>
                        <br />
                        <span style={{ color: '#52c41a', fontSize: '11px' }}>
                          Approved: {leave.approved_dates.length} day(s)       • {dayjs(leave.approved_dates[0]).format('MMM DD')} 
                          {leave.approved_dates.length > 1 && ` - ${dayjs(leave.approved_dates[leave.approved_dates.length - 1]).format('MMM DD')}`}
                        </span>
                      </>
                    )}
                    
                    {leave.totalHours > 0 && `       • ${formatPermissionHours(leave.totalHours)}`}
                    {leave.total_days > 0 && `       • ${leave.total_days} day${leave.total_days > 1 ? 's' : ''}`}
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Tag 
                color={leave.status === 'Approved' ? 'success' : 
                      leave.status === 'Rejected' ? 'error' : 'warning'}
              >
                {leave.status}
              </Tag>
            </Col>
          </Row>
        </Card>
      )
    };
  })}
/>
          )}
        </div>
      </Card>
    </div>
  </Spin>
);

  // HR/Admin Table Columns
const getTableColumns = () => {
  const isMobile = window.innerWidth < 768;
  
  const baseColumns = [
    // Employee Column (Enhanced)
    ...(userRole !== 'employee' ? [{
      title: (
        <Space>
          <UserOutlined className="employee-icon" />
          <span className="column-title">Employee</span>
        </Space>
      ),
      key: 'employee',
      render: (_, record) => (
        <Space direction="horizontal" size={12}>
          <Avatar 
            className="employee-avatar"
            size={isMobile ? 36 : 42}
          >
            {(record.users?.name || record.employee_name)?.charAt(0)}
          </Avatar>
          <div className="employee-info">
            <div className="employee-name">
              {record.users?.name || record.employee_name}
            </div>
            {/* <Text className="employee-id">
              {record.users?.employee_id || record.employee_code}
            </Text>
            {!isMobile && (
              <div className="employee-department">
                {record.department}
              </div>
            )} */}
          </div>
        </Space>
      ),
      width: isMobile ? 120 : 180,
      fixed: !isMobile ? 'left' : false,
    }] : []),

    // Leave Type Column (Enhanced)
    {
      title: (
        <Space>
          <CalendarOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Leave Type</span>
        </Space>
      ),
      key: 'leaveType',
      render: (_, record) => {
        const config = getLeaveTypeConfig(record.leave_type);
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                padding: '4px',
                background: `${config.color}15`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: config.color, fontSize: '14px' }}>
                  {config.icon}
                </span>
              </div>
              <Tag 
                style={{ 
                  background: config.gradient,
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: isMobile ? '10px' : '12px',
                  padding: isMobile ? '2px 6px' : '4px 8px',
                  margin: 0
                }}
              >
                {isMobile ? 
                  (record.leave_type.length > 8 ? 
                    record.leave_type.substring(0, 8) + '...' : 
                    record.leave_type
                  ) : 
                  record.leave_type
                }
              </Tag>
            </div>
            {record.sub_type && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {record.leave_type === 'Permission' && (
                  <span style={{ fontSize: '10px' }}>
                    {getPermissionTimeIcon(record.sub_type)}
                  </span>
                )}
                <Text type="secondary" style={{ 
                  fontSize: isMobile ? '9px' : '11px',
                  background: '#f8f9fa',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  {record.sub_type}
                </Text>
              </div>
            )}
          </Space>
        );
      },
      width: isMobile ? 100 : 160,
    },

    // Duration Column (Enhanced)
    {
      title: (
        <Space>
          <ClockCircleOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Duration</span>
        </Space>
      ),
      key: 'duration',
      render: (_, record) => (
        <div style={{ lineHeight: '1.4' }}>
          <div className="leave-duration-dates">
            {dayjs(record.start_date).format(isMobile ? 'DD/MM' : 'DD MMM')}
            {record.end_date !== record.start_date && 
              ` - ${dayjs(record.end_date).format(isMobile ? 'DD/MM' : 'DD MMM')}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {record.total_hours > 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: isMobile ? '9px' : '10px',
                fontWeight: 500,
                color: '#1565c0'
              }}>
                {formatPermissionHours(record.total_hours)}
              </div>
            ) : record.total_days > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: isMobile ? '9px' : '10px',
                fontWeight: 500,
                color: '#2e7d32'
              }}>
                {record.total_days}d
              </div>
            )}
            {record.start_time && record.end_time && !isMobile && (
              <Text type="secondary" style={{ fontSize: '9px' }}>
                {record.start_time}-{record.end_time}
              </Text>
            )}
          </div>
        </div>
      ),
      width: isMobile ? 80 : 120,
    },

    // Status Column (Enhanced)
    {
      title: (
        <Space>
          <NotificationOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Status</span>
        </Space>
      ),
      key: 'status',
      render: (_, record) => {
        const statusConfig = {
          'Approved': { 
            color: '#52c41a', 
            bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            icon: <CheckCircleOutlined />
          },
          'Rejected': { 
            color: '#ff4d4f', 
            bg: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
            icon: <CloseCircleOutlined />
          },
          'Pending': { 
            color: '#faad14', 
            bg: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
            icon: <ClockCircleOutlined />
          }
        };
        
        const config = statusConfig[record.status] || statusConfig['Pending'];
        
        return (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: config.bg,
              padding: '6px 10px',
              borderRadius: '20px',
              border: `1px solid ${config.color}30`,
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 600,
              color: config.color
            }}>
              <span style={{ fontSize: '10px' }}>{config.icon}</span>
              {isMobile ? record.status.substring(0, 4) : record.status}
            </div>
            {!isMobile && record.status === 'Approved' && record.approved_by && (
              <div style={{ marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '9px' }}>
                  by {record.approved_by}
                </Text>
              </div>
            )}
            {!isMobile && record.status === 'Rejected' && record.rejected_by && (
              <div style={{ marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '9px' }}>
                  by {record.rejected_by}
                </Text>
              </div>
            )}
          </div>
        );
      },
      width: isMobile ? 70 : 120,
    },

    // Applied Date Column (Enhanced)
    {
      title: (
        <Space>
          <HistoryOutlined style={{ color: '#0D7139' }} />
          <span style={{ fontWeight: 600 }}>Applied</span>
        </Space>
      ),
      dataIndex: 'created_at',
      render: (date) => (
        <div style={{ textAlign: 'center' }}>
          <div className="leave-duration-dates">
            {dayjs(date).format(isMobile ? 'DD/MM' : 'DD MMM')}
          </div>
          <Text type="secondary" style={{ 
            fontSize: isMobile ? '8px' : '10px',
            display: 'block'
          }}>
            {dayjs(date).format(isMobile ? 'YY' : 'YYYY')}
          </Text>
          {!isMobile && (
            <Text type="secondary" style={{ fontSize: '9px', display: 'block' }}>
              {dayjs(date).fromNow()}
            </Text>
          )}
        </div>
      ),
      width: isMobile ? 60 : 100,
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },

    // Actions Column (Enhanced)
  {
  title: (
    <div style={{ textAlign: 'center' }}>
      <Text style={{ fontWeight: 600, color: '#6b7280' }}>Actions</Text>
    </div>
  ),
  key: 'actions',
  render: (_, record) => (
    <Space size={4} direction={isMobile ? 'vertical' : 'horizontal'} style={{ justifyContent: 'center', width: '100%' }}>
      <Tooltip title="View Details">
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            setSelectedLeave(record);
            setLeaveDetailsModal(true);
          }}
        />
      </Tooltip>
      
     {userRole !== 'employee' && record.status === 'Pending' && (
  <Tooltip title={record.leave_type === 'Permission' ? 'Approve Permission' : 'Review & Approve'}>
    <Button
      type="text"
      icon={<CheckCircleOutlined />}
      size="small"
      style={{ color: '#52c41a' }}
      onClick={() => {
        // Direct approval for Permission leave
        if (record.leave_type === 'Permission') {
          Modal.confirm({
            title: 'Approve Permission Request?',
            content: `Approve ${formatPermissionHours(record.total_hours)} permission for ${record.users?.name || record.employee_name}?`,
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            okText: 'Approve',
            cancelText: 'Cancel',
            onOk: async () => {
              await handleApproveLeave(record, [], ''); // Empty array for selectedDays since it's permission
            }
          });
        } else {
          // Open drawer for other leave types
          setSelectedRequestForReview(record);
        }
      }}
    />
  </Tooltip>
)}
{userRole !== 'employee' && record.status === 'Approved' && record.leave_type !== 'Permission' && (
    <Tooltip title="Adjust Approved Days">
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          style={{ color: '#722ed1' }}
          onClick={() => {
              setEditingLeave(record);
              setIsAdjustDrawerVisible(true);
          }}
        />
    </Tooltip>
)}
      
      {userRole !== 'employee' && record.status === 'Pending' && (
          <Tooltip title="Reject Leave">
            <Popconfirm
              title="Reject this leave application?"
              onConfirm={() => handleRejectLeave(record.id, 'Rejected by HR')}
              okText="Yes, Reject"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<CloseCircleOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
      )}
    </Space>
  ),
  width: isMobile ? 60 : 120,
  fixed: !isMobile ? 'right' : false,
},
  ];

  return baseColumns;
};
const actionButtonStyles = `
  /* Enhanced Action Buttons */
  .action-btn:hover {
    background: rgba(13, 113, 57, 0.08) !important;
    border-color: #0D7139 !important;
    transform: scale(1.1);
  }

  .approve-btn:hover {
    background: rgba(82, 196, 26, 0.08) !important;
    border-color: #52c41a !important;
    transform: scale(1.1);
  }

  .reject-btn:hover {
    background: rgba(255, 77, 79, 0.08) !important;
    border-color: #ff4d4f !important;
    transform: scale(1.1);
  }

  /* Enhanced Popconfirm Styling */
  .ant-popconfirm .ant-popconfirm-message-title {
    font-weight: 600 !important;
    color: #1f2937 !important;
  }

  .ant-popconfirm .ant-popconfirm-description {
    color: #6b7280 !important;
  }

  /* Loading States */
  .ant-table-tbody > tr.ant-table-row-loading > td {
    background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%) !important;
    background-size: 200% 100% !important;
    animation: loading 1.5s infinite !important;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Responsive Table Improvements */
  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 4px !important;
      font-size: 11px !important;
    }
    
    .ant-table-tbody > tr > td {
      padding: 6px 4px !important;
    }
    
    .ant-space-item {
      margin-bottom: 2px !important;
    }
  }
`;

// 5. Export the complete updated styles to be added to your component
const completeStyles = professionalStyles + actionButtonStyles;
 // In leavemanage.jsx, replace the existing ApplyLeaveForm component

 const ApplyLeaveForm = () => {
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [casualLeaveDuration, setCasualLeaveDuration] = useState('FDL');
    const availableLeaveTypes = getAvailableLeaveTypes();
    const isMedicalDisabled = !leaveBalances.medicalLeave || leaveBalances.medicalLeave.remaining <= 0;
    const isPermissionDisabled = leaveBalances.permission?.remaining <= 0;
    const isCasualDisabled = !leaveBalances.casualLeave || leaveBalances.casualLeave.remaining < 0.5;
    const isEarnedDisabled = !leaveBalances.earnedLeave || leaveBalances.earnedLeave.remaining <= 0;
    const isCompensatoryDisabled = !leaveBalances.compensatoryLeave || leaveBalances.compensatoryLeave.remaining <= 0;
    const isExcusesDisabled = leaveBalances.excuses?.remaining <= 0;

     useEffect(() => {
      const validatePermissionTime = () => {
        if (selectedLeaveType === 'Permission') {
          const startTime = form.getFieldValue('startTime');
          const endTime = form.getFieldValue('endTime');
          
          if (startTime && endTime) {
            const hours = endTime.diff(startTime, 'hours');
            if (hours > 2) {
              form.setFields([
                {
                  name: 'endTime',
                  errors: ['Permission cannot exceed 2 hours.'],
                },
              ]);
            } else {
              form.setFields([{ name: 'endTime', errors: [] }]);
            }
          }
        }
      };

      validatePermissionTime();
    }, [form.getFieldValue('startTime'), form.getFieldValue('endTime'), selectedLeaveType]);
    
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleApplyLeave}
        initialValues={{
          startDate: dayjs(),
          endDate: dayjs(),
          
        }}
        // --- START: NEW onFieldsChange HANDLER ---
        onFieldsChange={(changedFields, allFields) => {
          if (changedFields.length > 0 && changedFields[0].name[0] === 'startDate') {
            const newStartDate = changedFields[0].value;
            if (newStartDate) {
              // Automatically set the end date to be the same as the start date
              form.setFieldsValue({ endDate: newStartDate });
            }
          }
        }}
        // --- END: NEW onFieldsChange HANDLER ---
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="leaveType"
              label="Leave Type"
              rules={[{ required: true, message: 'Please select leave type' }]}
            >
              <Select 
                placeholder="Select leave type"
                onChange={(value) => {
                  setSelectedLeaveType(value);
                  form.resetFields(['subType', 'startTime', 'endTime', 'endDate', 'session']);
                  if (value === 'Casual Leave') {
                     setCasualLeaveDuration('FDL');
                     form.setFieldsValue({ subType: 'FDL' });
                  }
                }}
                size="large"
              >
                
<Option value="Permission" disabled={isPermissionDisabled}>
  <Space>
    <ClockCircleOutlined style={{ color: '#1890ff' }} />
    Permission ({formatPermissionHours(leaveBalances.permission?.remaining)} remaining)
  </Space>
</Option>
                <Option value="Casual Leave" disabled={isCasualDisabled}>
                  <Space>
                    <CalendarOutlined style={{ color: '#52c41a' }} />
                    Casual Leave ({leaveBalances.casualLeave?.remaining} remaining)
                  </Space>
                </Option>
                 <Option value="Earned Leave" disabled={isEarnedDisabled}>
                  <Space>
                    <BankOutlined style={{ color: '#0D7139' }} />
                    Earned Leave ({leaveBalances.earnedLeave?.remaining || 0} remaining)
                  </Space>
                </Option>
                <Option value="Medical Leave" disabled={isMedicalDisabled}>
                    <Space>
                        <MedicineBoxOutlined style={{ color: '#ff4d4f' }} />
                        Medical Leave ({leaveBalances.medicalLeave?.remaining} remaining)
                    </Space>
                </Option>
                <Option value="Maternity Leave">
                   <Space>
                    <MedicineBoxOutlined style={{ color: '#eb2f96' }} />
                    Maternity Leave
                  </Space>
                </Option>
               <Option value="Compensatory Leave" disabled={isCompensatoryDisabled}>
                   <Space>
                    <FaIndianRupeeSign  style={{ color: '#722ed1' }} />
                    Compensatory Leave ({leaveBalances.compensatoryLeave?.remaining || 0} remaining)
                  </Space>
                </Option>
                <Option value="Excuses" disabled={isExcusesDisabled}>
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                    Excuses ({leaveBalances.excuses?.remaining || 0} remaining)
                  </Space>
                </Option>
                {/* <Option value="On Duty">
                  <Space>
                    <TeamOutlined style={{ color: '#13c2c2' }} />
                    On Duty
                  </Space>
                </Option>
                <Option value="Overtime">
                  <Space>
                    <ThunderboltOutlined style={{ color: '#a0d911' }} />
                    Overtime
                  </Space>
                </Option> */}
              </Select>
            </Form.Item>
          </Col>

          {selectedLeaveType === 'Casual Leave' && (
            <Col xs={24} md={12}>
              <Form.Item
                name="subType"
                label="Leave Duration"
                rules={[{ required: true, message: 'Please select duration' }]}
              >
                <Radio.Group 
                  onChange={(e) => setCasualLeaveDuration(e.target.value)} 
                  size="large"
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="FDL">Full Day</Radio.Button>
                  <Radio.Button value="HDL">Half Day</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          )}

          {selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL' && (
            <Col xs={24} md={12}>
              <Form.Item
                name="session"
                label="Select Session"
                rules={[{ required: true, message: 'Please select a session' }]}
              >
                <Select placeholder="Select morning or afternoon" size="large">
                  <Option value="Morning">Morning</Option>
                  <Option value="Afternoon">Afternoon</Option>
                </Select>
              </Form.Item>
            </Col>
          )}
          

{selectedLeaveType === 'Permission' && (
  <Col xs={24} md={12}>
    <Form.Item
      name="subType"
      label="Permission Time Slot"
      rules={[{ required: true, message: 'Please select time slot' }]}
    >
      <Select 
        placeholder="Select time slot"
        size="large"
      >
        <Option value="Morning">
          <Space>
            <SunOutlined style={{ color: '#faad14' }} />
            Morning 
          </Space>
        </Option>
        <Option value="Before Lunch">
          <Space>
            <CoffeeOutlined style={{ color: '#8c4a2b' }} />
            Before Lunch 
          </Space>
        </Option>
        <Option value="Middle">
          <Space>
            <ClockCircleFilled style={{ color: '#1890ff' }} />
            Middle
          </Space>
        </Option>
        <Option value="After Lunch">
          <Space>
            <CoffeeOutlined style={{ color: '#52c41a' }} />
            After Lunch
          </Space>
        </Option>
        <Option value="Evening">
          <Space>
            <MoonOutlined style={{ color: '#722ed1' }} />
            Evening
          </Space>
        </Option>
      </Select>
    </Form.Item>
  </Col>
)}

        </Row>
        
        <Row gutter={16}>
            <Col xs={24} md={
              (selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL') || selectedLeaveType === 'Excuses' || selectedLeaveType === 'Permission' 
              ? 24 
              : 12
            }>
            <Form.Item
                name="startDate"
                label={
                    selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL' ? 'Date' :
                    selectedLeaveType === 'Excuses' ? 'Date of Excuse' : 'Start Date'
                }
                rules={[{ required: true, message: 'Please select a date' }]}
            >
                <DatePicker 
                style={{ width: '100%' }}
                size="large"
                format="DD/MM/YYYY"
                disabledDate={(current) => selectedLeaveType === 'Excuses' ? current && current > dayjs().endOf('day') : false}
                />
            </Form.Item>
            </Col>

            {selectedLeaveType !== 'Permission' && selectedLeaveType !== 'Excuses' && !(selectedLeaveType === 'Casual Leave' && casualLeaveDuration === 'HDL') && (
            <Col xs={24} md={12}>
                <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
                >
                <DatePicker 
                    style={{ width: '100%' }}
                    size="large"
                    format="DD/MM/YYYY"
                    disabledDate={(current) => {
                    const startDate = form.getFieldValue('startDate');
                    // Prevent selecting a date before the start date
                    return current && startDate && current < startDate;
                    }}
                />
                </Form.Item>
            </Col>
            )}

            {selectedLeaveType === 'Permission' && (
                <>
                <Col xs={12} md={8}>
                    <Form.Item
                    name="startTime"
                    label="Start Time"
                    rules={[{ required: true, message: 'Please select start time' }]}
                    >
                    <TimePicker 
                        format="HH:mm"
                        style={{ width: '100%' }}
                        size="large"
                    />
                    </Form.Item>
                </Col>
                <Col xs={12} md={8}>
                    <Form.Item
                    name="endTime"
                    label="End Time"
                    rules={[{ required: true, message: 'Please select end time' }]}
                    >
                    <TimePicker 
                        format="HH:mm"
                        style={{ width: '100%' }}
                        size="large"
                    />
                    </Form.Item>
                </Col>
                </>
            )}
        </Row>


        <Form.Item
          name="reason"
          label="Reason for Leave"
          rules={[{ required: true, message: 'Please provide reason' }]}
        >
          <TextArea
            rows={3}
            placeholder="Please provide detailed reason for your leave request..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        {(selectedLeaveType === 'Medical Leave' || selectedLeaveType === 'Maternity Leave') && (
          <Form.Item
            name="medicalCertificate"
            label="Medical Certificate"
            rules={[{ required: false, message: 'Please upload medical certificate' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
          >
            <Upload
              listType="picture-card"
              maxCount={3}
              beforeUpload={() => false}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              showUploadList={{ showPreviewIcon: false }}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        )}

        <Form.Item 
          name="attachment" 
          label="Additional Documents (Optional)"
          valuePropName="fileList"
          getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
        >
          <Upload
            listType="picture-card"
            maxCount={3}
            beforeUpload={() => false}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>
        {selectedLeaveType && (
  <Alert
    message={`Available Balance: ${
      selectedLeaveType === 'Permission' ? leaveBalances.permission.remaining.toFixed(1) + ' hours' :
      selectedLeaveType === 'Casual Leave' ? leaveBalances.casualLeave.remaining + ' days' :
      selectedLeaveType === 'Earned Leave' ? leaveBalances.earnedLeave.remaining + ' days' :
      selectedLeaveType === 'Medical Leave' ? leaveBalances.medicalLeave.remaining + ' days' :
      selectedLeaveType === 'Maternity Leave' ? leaveBalances.maternityLeave.remaining + ' days' :
      selectedLeaveType === 'Compensatory Leave' ? leaveBalances.compensatoryLeave.remaining + ' days' :
      selectedLeaveType === 'Excuses' ? leaveBalances.excuses.remaining + ' excuses' : 'Check with HR'
    }`}
    type={
      (selectedLeaveType === 'Permission' && leaveBalances.permission.remaining <= 0) ||
      (selectedLeaveType === 'Casual Leave' && leaveBalances.casualLeave.remaining < 0.5) ||
      (selectedLeaveType === 'Earned Leave' && leaveBalances.earnedLeave.remaining <= 0) ||
      (selectedLeaveType === 'Medical Leave' && leaveBalances.medicalLeave.remaining <= 0) ||
      (selectedLeaveType === 'Excuses' && leaveBalances.excuses.remaining <= 0)
        ? 'warning' : 'info'
    }
    showIcon
    style={{ marginBottom: '16px' }}
  />
)}
      </Form>
    );
  };

// In leavemanage.jsx, replace the entire "LeaveAdjustDrawer" component.

const LeaveAdjustDrawer = ({ visible, onClose, leave, onSave, loading }) => {
    const [currentlyApprovedDays, setCurrentlyApprovedDays] = useState([]);

    useEffect(() => {
        if (leave) {
            // Initialize with the currently approved dates from the leave record
            setCurrentlyApprovedDays(leave.approved_dates || []);
        }
    }, [leave]);

    if (!leave) return null;

    // --- START OF FIX ---
    // The value of the record as it currently exists in the database.
    const originalDaysValueForThisRecord = leave.total_days || 0;
    
    // The days that were part of the very first approval, to define the calendar's boundaries.
    const initialScopeDays = leave.initial_approved_dates || leave.approved_dates || [];

    const handleDayToggle = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        // Prevent toggling days that weren't part of the original approval scope.
        if (!initialScopeDays.includes(dateStr)) {
            message.info("This day was not part of the original leave approval.");
            return;
        }
        // Add or remove the date from the list of currently approved days.
        setCurrentlyApprovedDays(prev =>
            prev.includes(dateStr)
                ? prev.filter(d => d !== dateStr)
                : [...prev, dateStr]
        );
    };

    const dateCellRender = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        // Only render overlays for days within the original leave's scope.
        if (!initialScopeDays.includes(dateStr)) {
            return null;
        }

        const isCurrentlyApproved = currentlyApprovedDays.includes(dateStr);
        const overlayStyle = {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid transparent'
        };

        let tooltipTitle = '';

        if (isCurrentlyApproved) {
            overlayStyle.backgroundColor = 'rgba(82, 196, 26, 0.15)';
            overlayStyle.border = '2px solid #52c41a';
            tooltipTitle = 'Approved. Click to mark for REFUND.';
        } else {
            overlayStyle.backgroundColor = 'rgba(191, 191, 191, 0.3)';
            overlayStyle.border = '2px dashed #d9d9d9';
            overlayStyle.textDecoration = 'line-through';
            tooltipTitle = 'Refunded. Click to REVOKE refund.';
        }

        return (
            <Tooltip title={tooltipTitle}>
                <div style={overlayStyle}></div>
            </Tooltip>
        );
    };
    
    // Correctly determine if the leave was a half-day leave.
    const isHalfDayLeave = leave.sub_type?.includes('HDL');

    // Recalculate the new value based on the current selection in the UI.
    // This is the crucial change.
    const newValueForThisRecord = isHalfDayLeave
        ? currentlyApprovedDays.length * 0.5
        : currentlyApprovedDays.length;

    // Calculate the difference between the old value and the new value.
    // This will be positive for a refund and negative for a revoke.
    const dayDifference = originalDaysValueForThisRecord - newValueForThisRecord;
    
    // --- END OF FIX ---

    const handleSaveChanges = () => {
        // Pass the calculated difference to the onSave handler (handleAdjustLeave)
        onSave(leave, currentlyApprovedDays, dayDifference);
    };

    let buttonText = "No Changes Made";
    let buttonType = "default";
    let popconfirmTitle = "Are you sure?";

    if (dayDifference > 0) {
        buttonText = `Confirm Refund of ${dayDifference} Day(s)`;
        buttonType = "primary";
        popconfirmTitle = `This will return ${dayDifference} day(s) to the employee's balance. Proceed?`;
    } else if (dayDifference < 0) {
        buttonText = `Confirm Revoke of ${Math.abs(dayDifference)} Day(s)`;
        buttonType = "danger";
        popconfirmTitle = `This will REVOKE the refund and re-deduct ${Math.abs(dayDifference)} day(s) from the employee's balance. Are you sure?`;
    }

    return (
        <Drawer
            title="Adjust & Refund Approved Leave"
            width={500}
            onClose={onClose}
            open={visible}
            destroyOnClose
            footer={
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} disabled={loading}>Cancel</Button>
                    <Popconfirm
                        title={popconfirmTitle}
                        onConfirm={handleSaveChanges}
                        okText="Yes, Confirm"
                        cancelText="No"
                        disabled={dayDifference === 0}
                    >
                        <Button type={buttonType} loading={loading} disabled={dayDifference === 0}>
                            {buttonText}
                        </Button>
                    </Popconfirm>
                </Space>
            }
        >
            <Alert
                message="Click a day to toggle its status"
                description={
                     <div>
                        - Clicking a <Tag color="success">Green Day</Tag> marks it for REFUND (it turns Grey).<br/>
                        - Clicking a <Tag color="default">Grey Day</Tag> REVOKES the refund (it turns Green again).
                    </div>
                }
                type="info" showIcon style={{ marginBottom: 24 }}
            />
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Employee">{leave.users?.name}</Descriptions.Item>
                <Descriptions.Item label="Current Value of This Leave Record">
                    <Tag color="purple">{originalDaysValueForThisRecord} days</Tag>
                </Descriptions.Item>
            </Descriptions>
            
            <Card style={{ marginTop: 24 }}>
                <Calendar 
                    fullscreen={false} 
                    onSelect={handleDayToggle} 
                    cellRender={(current, info) => {
                        if (info.type === 'date') {
                            return dateCellRender(current);
                        }
                        return null;
                    }}
                />
            </Card>

            <Statistic
                title="New Value of This Record (After Save)"
                value={newValueForThisRecord}
                valueStyle={{ color: dayDifference !== 0 ? (dayDifference > 0 ? '#fa8c16' : '#ff4d4f') : '#333' , fontWeight: 600 }}
                style={{ textAlign: 'center', marginTop: 24, padding: '10px', background: '#fafafa' }}
            />
        </Drawer>
    );
};
    // Leave Details Modal Component
  const LeaveDetailsModal = () => {
  if (!selectedLeave) return null;

  const [employeeLeaveBalance, setEmployeeLeaveBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const config = getLeaveTypeConfig(selectedLeave.leave_type || selectedLeave.leaveType);

  // Fetch the specific employee's leave balance when the modal opens
  useEffect(() => {
    const fetchBalanceForEmployee = async () => {
      if (selectedLeave && selectedLeave.user_id) {
        setBalanceLoading(true);
        try {
          const balances = await calculateLeaveBalances(selectedLeave.user_id);
          setEmployeeLeaveBalance(balances);
        } catch (error) {
          console.error("Failed to fetch employee balance for modal:", error);
          setEmployeeLeaveBalance(null); // Reset on error
        } finally {
          setBalanceLoading(false);
        }
      }
    };

    fetchBalanceForEmployee();
  }, [selectedLeave]); // Re-run when a new leave is selected

  // Helper to get the specific balance details based on the leave type
  const getBalanceForType = (type) => {
    if (!employeeLeaveBalance) return null;
    switch (type) {
      case 'Permission': return employeeLeaveBalance.permission;
      case 'Casual Leave': return employeeLeaveBalance.casualLeave;
      case 'Earned Leave': return employeeLeaveBalance.earnedLeave;
      case 'Medical Leave': return employeeLeaveBalance.medicalLeave;
      case 'Maternity Leave': return employeeLeaveBalance.maternityLeave;
      case 'Compensatory Leave': return employeeLeaveBalance.compensatoryLeave;
      case 'Excuses': return employeeLeaveBalance.excuses;
      default: return null;
    }
  };

  const relevantBalance = getBalanceForType(selectedLeave.leave_type || selectedLeave.leaveType);

return (
    <Modal
      title={
        <Space>
          <div style={{ color: config.color }}>{config.icon}</div>
          <span>Leave Details</span>
        </Space>
      }
      open={leaveDetailsModal}
      onCancel={() => {
        setLeaveDetailsModal(false);
        setSelectedLeave(null);
      }}
      // --- CHANGE: Removed action buttons from the footer ---
      footer={[
        <Button key="close" onClick={() => {
          setLeaveDetailsModal(false);
          setSelectedLeave(null);
        }}>
          Close
        </Button>,
      ]}
      width={600}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Employee">
          <Space>
            <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#0D7139' }} />
            <div>
              <div style={{ fontWeight: 600 }}>
                {selectedLeave.users?.name || selectedLeave.employee_name || selectedLeave.employeeName}
              </div>
              <Text type="secondary">
                {selectedLeave.users?.employee_id || selectedLeave.employee_code || selectedLeave.employeeCode}       • {selectedLeave.department}
              </Text>
            </div>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Leave Type">
          <Space>
            <Tag color={config.color} style={{ borderRadius: '6px' }}>
              {selectedLeave.leave_type || selectedLeave.leaveType}
            </Tag>
            {(selectedLeave.sub_type || selectedLeave.subType) && (
              <Tag color="default">
                {(selectedLeave.leave_type || selectedLeave.leaveType) === 'Permission' &&
                  getPermissionTimeIcon(selectedLeave.sub_type || selectedLeave.subType)}
                {' '}{selectedLeave.sub_type || selectedLeave.subType}
              </Tag>
            )}
          </Space>
        </Descriptions.Item>

        {/* --- NEW: Added Leave Balance Information Row --- */}
        {relevantBalance && (
           <Descriptions.Item label={`${selectedLeave.leave_type} Balance`}>
            {balanceLoading ? (
              <Spin size="small" />
            ) : (
              <Space split={<Divider type="vertical" />}>
                <Statistic title="Total" value={relevantBalance.total} valueStyle={{ fontSize: '16px', color: '#333' }} />
                <Statistic title="Used" value={relevantBalance.used} valueStyle={{ fontSize: '16px', color: '#fa8c16' }} />
                <Statistic title="Remaining" value={relevantBalance.remaining} valueStyle={{ fontSize: '16px', color: '#52c41a' }} />
              </Space>
            )}
           </Descriptions.Item>
        )}

    
<Descriptions.Item label="Duration">
  <div>
    <Text strong>
      Applied Dates: {dayjs(selectedLeave.start_date || selectedLeave.startDate).format('DD MMM YYYY')}
      {(selectedLeave.end_date || selectedLeave.endDate) !== (selectedLeave.start_date || selectedLeave.startDate) &&
        ` - ${dayjs(selectedLeave.end_date || selectedLeave.endDate).format('DD MMM YYYY')}`}
    </Text>
    
    {/* Show approved/rejected dates breakdown for approved requests */}
    {selectedLeave.status === 'Approved' && selectedLeave.approved_dates && selectedLeave.approved_dates.length > 0 && (
      <div style={{ marginTop: '12px' }}>
        <Text type="success" strong>HR Approved Dates:</Text>
        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {selectedLeave.approved_dates.sort().map(date => (
            <Tag key={date} color="success">
              {dayjs(date).format('DD MMM')}
            </Tag>
          ))}
        </div>
        
        {/* Show rejected/not granted dates */}
        {(() => {
          const start = dayjs(selectedLeave.start_date);
          const end = dayjs(selectedLeave.end_date);
          const allRequestedDates = [];
          let current = start;
          while (current.isSameOrBefore(end)) {
            allRequestedDates.push(current.format('YYYY-MM-DD'));
            current = current.add(1, 'day');
          }
          const notApprovedDates = allRequestedDates.filter(date => 
            !selectedLeave.approved_dates.includes(date)
          );
          
          return notApprovedDates.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <Text type="danger" strong>Not Granted:</Text>
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {notApprovedDates.map(date => (
                  <Tag key={date} color="error">
                    {dayjs(date).format('DD MMM')}
                  </Tag>
                ))}
              </div>
            </div>
          );
        })()}
        
        <div style={{ marginTop: '8px' }}>
          <Text type="secondary">
            Total Days Approved: {selectedLeave.approved_dates.length} / {selectedLeave.total_days + (selectedLeave.approved_dates.length - selectedLeave.total_days)} requested
          </Text>
        </div>
      </div>
    )}
    
    {selectedLeave.hr_comments && selectedLeave.status === 'Approved' && (
      <div style={{ marginTop: '8px', padding: '8px', background: '#f6ffed', borderRadius: '4px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>HR Comments:</strong> {selectedLeave.hr_comments}
        </Text>
      </div>
    )}
  </div>
</Descriptions.Item>

        <Descriptions.Item label="Reason">
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {selectedLeave.reason}
          </Paragraph>
        </Descriptions.Item>

        <Descriptions.Item label="Applied Date">
          {dayjs(selectedLeave.created_at || selectedLeave.appliedDate).format('DD MMM YYYY, hh:mm A')}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Badge
            status={selectedLeave.status === 'Approved' ? 'success' :
                   selectedLeave.status === 'Rejected' ? 'error' : 'processing'}
            text={selectedLeave.status}
          />
          {selectedLeave.status === 'Approved' && (selectedLeave.approved_by || selectedLeave.approvedBy) && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Approved by {selectedLeave.approved_by || selectedLeave.approvedBy} on {dayjs(selectedLeave.approved_date || selectedLeave.approvedDate).format('DD MMM YYYY')}
              </Text>
            </div>
          )}
          {selectedLeave.status === 'Rejected' && (selectedLeave.rejected_by || selectedLeave.rejected_by) && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Rejected by {selectedLeave.rejected_by || selectedLeave.rejected_by} on {dayjs(selectedLeave.approved_date || selectedLeave.approvedDate).format('DD MMM YYYY')}
              </Text>
            </div>
          )}
        </Descriptions.Item>

        {((selectedLeave.medical_certificate || selectedLeave.medicalCertificate) || (selectedLeave.attachment)) && (
          <Descriptions.Item label="Attachments">
            <Space direction="vertical">
              {(selectedLeave.medical_certificate || selectedLeave.medicalCertificate) && (
                <Button
                  type="link"
                  icon={<FileTextOutlined />}
                  style={{ padding: 0, height: 'auto' }}
                  onClick={() => window.open(selectedLeave.medical_certificate || selectedLeave.medicalCertificate, '_blank')}
                >
                Medical Certificate
              </Button>
              )}
              {selectedLeave.attachment && (
                <Button
                  type="link"
                  icon={<FileTextOutlined />}
                  onClick={() => window.open(selectedLeave.attachment || selectedLeave.attachment, '_blank')}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Attachment
                </Button>
              )}
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};




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
}, [])
// In leavemanage.jsx

// In leavemanage.jsx

useEffect(() => {
  // Only set up realtime after initial data is loaded and for the dashboard tab
  if (!dataLoaded || activeTab !== 'dashboard' || !currentUser?.id) return;

  console.log('Setting up realtime subscriptions for user:', currentUserId);

  // --- LEAVE APPLICATIONS SUBSCRIPTION ---
  const leaveChannel = supabase
    .channel('realtime-leave-applications')
    .on('postgres_changes', {
      event: '*', // Listen for insert, update, delete
      schema: 'public',
      table: 'leave_applications',
      // Filter for employee's own applications OR all applications for HR
      ...(userRole === 'employee' && { filter: `user_id=eq.${currentUserId}` })
    }, async (payload) => {
      console.log('Realtime: Leave application change detected!', payload);

      // --- START OF FIX ---
      // This logic directly updates the local state without a refetch, ensuring all data is current.
      const newRecord = payload.new;
      const oldRecord = payload.old;

      setLeaveData(currentLeaves => {
        let updatedLeaves = [...currentLeaves];

        if (payload.eventType === 'INSERT') {
          // Add the new leave to the top of the list
          updatedLeaves.unshift(newRecord);
        }
        
        else if (payload.eventType === 'UPDATE') {
          // Find the index of the leave that was updated
          const index = updatedLeaves.findIndex(leave => leave.id === newRecord.id);
          if (index !== -1) {
            // Replace the old record with the new one from the payload
            updatedLeaves[index] = newRecord;
          } else {
            // If for some reason it wasn't in the list, add it
            updatedLeaves.unshift(newRecord);
          }
        }
        
        else if (payload.eventType === 'DELETE') {
          // Filter out the deleted leave
          updatedLeaves = updatedLeaves.filter(leave => leave.id !== oldRecord.id);
        }

        // Re-sort the array by date to maintain consistent order
        updatedLeaves.sort((a, b) => dayjs(b.applied_date || b.created_at).diff(dayjs(a.applied_date || a.created_at)));

        return updatedLeaves;
      });
      // --- END OF FIX ---
      
      // Balance updates should still happen as they rely on fresh calculations
      if (userRole === 'employee' && (newRecord?.user_id === currentUserId || oldRecord?.user_id === currentUserId)) {
        console.log('Updating balances for employee after leave change');
        try {
            const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
            setLeaveBalances(updatedBalances);
        } catch (error) {
            console.error("Error recalculating balances on realtime update:", error);
        }
      }
    })
    .subscribe();

  // --- LEAVE BALANCES SUBSCRIPTION (remains the same) ---
  const balanceChannel = supabase
    .channel('realtime-leave-balances')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leave_balances',
      ...(userRole === 'employee' && { filter: `user_id=eq.${currentUserId}` })
    }, async (payload) => {
      console.log('Realtime: Leave balance change detected!', payload);
      try {
        if (userRole === 'employee') {
          if (payload.new?.user_id === currentUserId || payload.old?.user_id === currentUserId) {
            const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
            setLeaveBalances(updatedBalances);
            console.log('Employee balance updated via realtime');
          }
        }
      } catch (error) {
        console.error('Error handling balance change:', error);
      }
    })
    .subscribe();
    
   // --- MEDICAL REQUEST SUBSCRIPTION (remains the same as it handles a more complex, two-table update) ---
   let medicalRequestChannel;
  if (userRole === 'employee') {
    medicalRequestChannel = supabase
      .channel('realtime-medical-requests-employee')
      .on('postgres_changes', {
        event: 'UPDATE', 
        schema: 'public',
        table: 'medical_leave_requests',
        filter: `user_id=eq.${currentUserId}`
      }, async (payload) => {
        console.log('Realtime: Extra medical request status updated!', payload);
        
        await fetchLastExtraMedicalRequest(currentUserId);
        const updatedHistory = await fetchCombinedEmployeeHistory(currentUserId);
        setLeaveData(updatedHistory);
        
        if (payload.new.status === 'Approved') {
           const updatedBalances = await calculateLeaveBalances(currentUserId, currentUser);
           setLeaveBalances(updatedBalances);
        }
      })
      .subscribe();
  }

  // Enhanced cleanup function
 return () => {
    console.log('Cleaning up realtime subscriptions');
    supabase.removeChannel(leaveChannel);
    supabase.removeChannel(balanceChannel);
    if (medicalRequestChannel) {
      supabase.removeChannel(medicalRequestChannel);
    }
  };
}, [dataLoaded, currentUserId, userRole, currentUser?.id, activeTab]);
// Add cache clearing utility
const clearCache = () => {
  delete window.holidayCache;
};
// Add this useEffect hook inside LeaveManagementPage
useEffect(() => {
    const fetchEmployees = async () => {
        if (userRole !== 'employee' && activeTab === 'dashboard' && employees.length === 0) {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, employee_id') // Only essential fields
                .or('employee_id.like.MYAEMP%,employee_id.like.MYAINT%') // Server-side filtering
                .order('name', { ascending: true });
            
            if (error) {
                console.error("Error fetching employees:", error);
            } else {
                setEmployees(data || []);
            }
        }
    };

    fetchEmployees();
}, [userRole, activeTab, employees.length]);
  // HR/Admin Dashboard Component
   const HRDashboard = () => (
  <div style={animationStyles.container}>
    {/* Professional HR Header */}
    <Card style={{
      marginBottom: '24px',
      background: 'linear-gradient(135deg, #f8fffe 0%, #e6f7ff 50%, #f0f9ff 100%)',
      border: '1px solid #e8f4fd',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(13, 113, 57, 0.08)',
      overflow: 'hidden',
      ...animationStyles.headerCard
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '200px',
        height: '100px',
        background: 'linear-gradient(135deg, rgba(13, 113, 57, 0.05) 0%, rgba(82, 196, 26, 0.03) 100%)',
        borderRadius: '0 0 0 100px',
        zIndex: 1
      }} />
      
      <Row align="middle" justify="space-between" gutter={[24, 16]} style={{ position: 'relative', zIndex: 2 }}>
        <Col xs={24} md={14} lg={16}>
          <Space size={24} direction="horizontal" style={{ width: '100%' }}>
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(13, 113, 57, 0.2)'
            }}>
              <TeamOutlined style={{ fontSize: '32px', color: 'white' }} />
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                background: '#52c41a',
                borderRadius: '50%',
                border: '2px solid white'
              }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <Title level={2} style={{
                margin: '0 0 4px 0',
                background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: 700,
                letterSpacing: '-0.5px'
              }}>
                Leave Management Hub
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Text style={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  HR Administrative Dashboard
                </Text>
                <div style={{ 
                  padding: '4px 12px',
                  background: 'rgba(13, 113, 57, 0.1)',
                  border: '1px solid rgba(13, 113, 57, 0.2)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#0D7139',
                  fontWeight: 600
                }}>
                  Admin Access
                </div>
              </div>
            </div>
          </Space>
          
        </Col>
        
        {/* --- THIS IS THE CORRECTED SECTION FOR THE BUTTONS --- */}
        <Col xs={24} md={10} lg={8}>
          <Space 
            size={[8, 16]} 
            wrap 
            style={{ width: '100%', justifyContent: 'flex-end' }}
          >
              <Tooltip title="Export Leave Reports">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => setExportModalVisible(true)}
                  style={{
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0D7139 0%, #52c41a 100%)',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(13, 113, 57, 0.24)',
                    transition: 'all 0.3s ease'
                  }}
                  className="professional-primary-btn"
                >
                  Export Report
                </Button>
              </Tooltip>
              
              <Tooltip title="Manually Allocate Compensatory Leave">
                <Button
                  icon={<FaIndianRupeeSign />}
                  onClick={() => setCompOffModalVisible(true)}
                  style={{
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(114, 46, 209, 0.24)',
                  }}
                >
                  Allocate Comp Off
                </Button>
              </Tooltip>
                 <Tooltip title="Review Extra Medical Leave Requests">
                  <Button
                      icon={<MedicineBoxOutlined />}
                      onClick={() => {
                          fetchPendingMedicalRequests(); // Fetch latest requests
                          setHrMedicalApprovalModal(true);
                      }}
                      style={{
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                          border: 'none',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 4px 16px rgba(255, 77, 79, 0.24)',
                      }}
                  >
                      <Badge count={pendingMedicalRequests.length} size="small" offset={[10, -5]}>
                          <span>Leave Requests</span>
                      </Badge>
                  </Button>
              </Tooltip>
          </Space>
        </Col>
        {/* --- END OF CORRECTED SECTION --- */}
      </Row>
    </Card>

    {/* The rest of the HRDashboard component remains unchanged... */}
    <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
      <Col xs={12} sm={6} lg={6}>
        <Card style={{
          borderRadius: '16px',
          border: '1px solid rgba(82, 196, 26, 0.12)',
          background: 'white',
          boxShadow: '0 4px 20px rgba(82, 196, 26, 0.08)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          ...animationStyles.statsCard
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(82, 196, 26, 0.1)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(82, 196, 26, 0.1)',
                borderRadius: '10px',
                display: 'inline-flex'
              }}>
                <CheckCircleOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
              </div>
             
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#52c41a',
                lineHeight: 1
              }}>
                {filteredLeaves.filter(l => l.status === 'Approved').length}
              </Text>
            </div>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Approved Leaves
            </Text>
            <Text style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '4px'
            }}>
              This month
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={12} sm={6} lg={6}>
        <Card style={{
          borderRadius: '16px',
          border: '1px solid rgba(250, 173, 20, 0.12)',
          background: 'white',
          boxShadow: '0 4px 20px rgba(250, 173, 20, 0.08)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          ...animationStyles.statsCard
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(250, 173, 20, 0.1)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(250, 173, 20, 0.1)',
                borderRadius: '10px',
                display: 'inline-flex'
              }}>
                <ClockCircleOutlined style={{ fontSize: '20px', color: '#faad14' }} />
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#faad14',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#faad14',
                lineHeight: 1
              }}>
                {filteredLeaves.filter(l => l.status === 'Pending').length}
              </Text>
            </div>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Pending Review
            </Text>
            <Text style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '4px'
            }}>
              Requires attention
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={12} sm={6} lg={6}>
        <Card style={{
          borderRadius: '16px',
          border: '1px solid rgba(255, 77, 79, 0.12)',
          background: 'white',
          boxShadow: '0 4px 20px rgba(255, 77, 79, 0.08)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          ...animationStyles.statsCard
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 77, 79, 0.1)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                background: 'rgba(255, 77, 79, 0.1)',
                borderRadius: '10px',
                display: 'inline-flex'
              }}>
                <CloseCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
              </div>
             
            </div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#ff4d4f',
                lineHeight: 1
              }}>
                {filteredLeaves.filter(l => l.status === 'Rejected').length}
              </Text>
            </div>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Rejected Leaves
            </Text>
            <Text style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '4px'
            }}>
              This month
            </Text>
          </div>
        </Card>
      </Col>

     
    </Row>

    {/* Enhanced Leave Applications Table */}
    <Card style={{
      background: 'white',
      border: '1px solid #f0f0f0',
      borderRadius: '20px',
      boxShadow: '0 6px 30px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      ...animationStyles.mainCard
    }}>
      {/* Professional Table Header */}
      <div className="leave-header">
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={12} md={14}>
            <Space size={16}>
              <div className="leave-icon-container">
                <NotificationOutlined style={{ fontSize: '20px', color: 'white' }} />
              </div>
              <div>
                <Title level={3} className="leave-title">
                  Leave Applications
                </Title>
                <Text className="leave-subtitle">
                  Manage and review employee leave requests
                </Text>
              </div>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={10}>
            <Row gutter={[12, 12]} justify="end">
  <Col xs={24} sm={12} md={6}>
    <Select
      placeholder="Status"
      value={filterStatus}
      onChange={setFilterStatus}
      style={{ width: '100%' }}
      size="large"
      suffixIcon={<FilterOutlined style={{ color: '#9ca3af' }} />}
      className="professional-select"
    >
      <Option value="All">All Status</Option>
      <Option value="Pending">
        <Space>
          <div style={{ width: '8px', height: '8px', background: '#faad14', borderRadius: '50%' }} />
          Pending
        </Space>
      </Option>
      <Option value="Approved">
        <Space>
          <div style={{ width: '8px', height: '8px', background: '#52c41a', borderRadius: '50%' }} />
          Approved
        </Space>
      </Option>
      <Option value="Rejected">
        <Space>
          <div style={{ width: '8px', height: '8px', background: '#ff4d4f', borderRadius: '50%' }} />
          Rejected
        </Space>
      </Option>
    </Select>
  </Col>
  
  {/* NEW DATE RANGE PICKER */}
  <Col xs={24} sm={12} md={6}>
    <RangePicker
      style={{ width: '100%' }}
      size="large"
      placeholder={['Start Date', 'End Date']}
      onChange={(dates) => {
        // Add date filtering logic here
        if (dates && dates.length === 2) {
          // Filter leaves by date range
          const filtered = leaveData.filter(leave => {
            const leaveDate = dayjs(leave.start_date);
            return leaveDate.isBetween(dates[0], dates[1], 'day', '[]');
          });
          setFilteredLeaves(filtered);
        } else {
          // Reset to show all leaves when date range is cleared
          setFilteredLeaves(leaveData);
        }
      }}
      className="professional-select"
    />
  </Col>
  
  <Col xs={24} sm={12} md={6}>
    <Select
      placeholder="Employee"
      value={filterEmployee}
      onChange={setFilterEmployee}
      style={{ width: '100%' }}
      size="large"
      suffixIcon={<UserOutlined style={{ color: '#9ca3af' }} />}
      className="professional-select"
    >
      <Option value="All">All Employees</Option>
      {employees.map(emp => (
        <Option key={emp.id} value={emp.id}>
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#0D7139' }}>
              {emp.name.charAt(0)}
            </Avatar>
            {emp.name}
          </Space>
        </Option>
      ))}
    </Select>
  </Col>
</Row>
          </Col>
        </Row>
      </div>
      
      {/* Table with padding */}
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Table
          columns={getTableColumns()}
          dataSource={filteredLeaves}
          rowKey="id"
          loading={loading}
          pagination={filteredLeaves.length > 0 ? {
  current: currentPage,
  pageSize: pageSize,
  total: filteredLeaves.length, // Change this from totalEmployees to filteredLeaves.length
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`, // Change "employees" to "applications"
  pageSizeOptions: ['5', '10', '20', '50'],
  onChange: (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  },
  onShowSizeChange: (current, size) => {
    setCurrentPage(1);
    setPageSize(size);
  },
  itemRender: (current, type, originalElement) => {
    if (type === 'page') {
      return (
        <a style={{
          color: current === currentPage ? '#0D7139' : '#d9d9d9',
          backgroundColor:current === currentPage ? "#ffffffff" : '#faf8f8ff' ,
          border: `1px solid ${current === currentPage ? '#0D7139' : '#d9d9d9'}`,
          borderRadius: '6px',
          fontWeight: current === currentPage ? 600 : 400,
          padding: '0px 7px',
          textDecoration: 'none'
        }}>
          {current}
        </a>
      );
    }
    return originalElement;
  }
} : false}
          scroll={filteredLeaves.length > 0 ? {
            x: 'max-content',
            scrollToFirstRowOnChange: true
          } : undefined}
          size="middle"
          rowClassName={(record) => {
            if (record.status === 'Pending') return 'pending-row';
            if (record.status === 'Approved') return 'approved-row';
            if (record.status === 'Rejected') return 'rejected-row';
            return '';
          }}
          locale={{
            emptyText: (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
                borderRadius: '16px',
                margin: '20px 0'
              }}>
                <div style={{
                  padding: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  <NotificationOutlined style={{ fontSize: '32px', color: '#d1d5db' }} />
                </div>
                <Title level={4} style={{ color: '#6b7280', marginBottom: '8px' }}>
                  No Leave Applications
                </Title>
                <Text style={{ color: '#9ca3af' }}>
                  No leave applications found matching your criteria
                </Text>
              </div>
            )
          }}
        />
      </div>
    </Card>
  </div>
);


  return (
    <div style={{ 
      padding: '24px',
      background: 'transparent',
      minHeight: '100vh'
    }}>
      <style>{`
  
    /* Add this to your existing style block */

/* Prevent horizontal scrollbar on empty tables */
.ant-table-empty .ant-table-tbody {
  overflow-x: hidden !important;
}

/* Consistent card heights */
.ant-card {
  height: fit-content;
}

/* Remove unnecessary scrollbars from empty containers */
.ant-table-placeholder {
  overflow: hidden !important;
}

/* Timeline container fixes */
.ant-timeline {
  overflow: visible !important;
}

/* Ensure consistent row heights */
.ant-table-tbody > tr {
  min-height: 54px;
}

/* Fix empty table container */
.ant-table-container {
  overflow-x: auto;
}

.ant-table-container:has(.ant-empty) {
  overflow-x: hidden;
}

/* Responsive adjustments for empty states */
@media (max-width: 768px) {
  .ant-empty {
    padding: 20px 10px !important;
  }
  
  .ant-table-empty .ant-table-tbody {
    min-height: 200px;
  }
}
`}</style>

       <Tabs 
  activeKey={activeTab} 
  onChange={setActiveTab}
  style={{ marginBottom: '24px' }}
  destroyOnHidden={false} 
  items={[
          userRole === 'employee' ? {
            key: 'dashboard',
            label: (
              <Space>
                <UserOutlined />
                <span>My Dashboard</span>
              </Space>
            ),
            children: <EmployeeDashboard />
          } : {
            key: 'dashboard',
            label: (
              <Space>
                <TeamOutlined />
                <span>HR Dashboard</span>
              </Space>
            ),
            children: <HRDashboard />
          },
          
          userRole !== 'employee' &&
     {
      key: 'analytics',
      label: (
        <Space>
          <BankOutlined />
          <span>Analytics</span>
        </Space>
      ),
      children: (
        <Analytics 
          currentUserId={currentUserId}
          userRole={userRole}
          leaveData={leaveData}
        />
      )
    }
        ].filter(Boolean)}
      />

      {/* Apply Leave Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#0D7139' }} />
            <span>Apply for Leave</span>
          </Space>
        }
        open={applyLeaveModal}
        onCancel={() => {
          setApplyLeaveModal(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setApplyLeaveModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => form.submit()}
            loading={loading}
            style={{
              background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)',
              border: 'none'
            }}
          >
            Submit Application
          </Button>
        ]}
        width={800}
       destroyOnHidden
      >
        <ApplyLeaveForm />
      </Modal>

      {/* Leave Details Modal */}
      <LeaveDetailsModal />

      {/* Leave History Drawer */}
    {/* Remove this entire component usage */}
  <LeaveHistoryDrawer
        visible={leaveHistoryDrawer}
        onClose={() => setLeaveHistoryDrawer(false)}
        leaveData={leaveData} 
        currentUser={currentUser}
        onEdit={handleEditLeave}     // <-- Pass the function here
        onCancel={handleCancelLeave} // <-- Pass the function here
      />
      
       <ExportReportModal 
  visible={exportModalVisible}
  onCancel={() => setExportModalVisible(false)}
  leaveData={filteredLeaves}
/>
 
       <CompensatoryLeaveModal
        visible={compOffModalVisible}
        onCancel={() => setCompOffModalVisible(false)}
        employees={employees}
        currentUser={currentUser}
      />
       <RequestExtraMedicalLeaveDrawer
          visible={extraMedicalRequestDrawer}
          onCancel={() => setExtraMedicalRequestDrawer(false)}
          onSubmit={handleExtraMedicalRequestSubmit}
      />

     <HRMedicalApprovalModal
    visible={hrMedicalApprovalModal}
    onCancel={() => {
        setHrMedicalApprovalModal(false);
        setSelectedMedicalRequest(null);
    }}
    requests={pendingMedicalRequests}
    onSelectRequest={(req) => {
        setSelectedMedicalRequest(req);
        setHrMedicalApprovalModal(false); // Close the modal
        // The drawer will automatically open because selectedMedicalRequest is now set
    }}
    loading={loading}
/>


<HRRequestDetailDrawer
    visible={!!(selectedRequestForReview || selectedMedicalRequest)}
    onClose={() => {
        setSelectedRequestForReview(null);
        setSelectedMedicalRequest(null);
    }}
    request={selectedRequestForReview || selectedMedicalRequest}
    onApprove={(request, selectedDays, comments) => {
        // This logic correctly routes to the right approval function.
        // `requested_days` only exists on extra medical requests.
        if (request.hasOwnProperty('requested_days')) {
            handleApproveMedicalRequest(request, selectedDays, comments);
        } else {
            handleApproveLeave(request, selectedDays, comments);
        }
    }}
    onReject={(request, reason) => {
        // This logic correctly routes to the right rejection function.
        if (request.hasOwnProperty('requested_days')) {
            handleRejectMedicalRequest(request, reason);
        } else {
            handleRejectLeave(request.id, reason);
        }
    }}
    loading={loading}
/>
      <LeaveAdjustDrawer
        visible={isAdjustDrawerVisible}
        onClose={() => {
            setIsAdjustDrawerVisible(false);
            setEditingLeave(null);
        }}
        leave={editingLeave}
        onSave={handleAdjustLeave} // <-- Use the new handler
        loading={loading}
    />
    </div>
  );
};
const professionalStyles = `
  /* Professional Button Styles */
  .professional-btn:hover {
    background: #f8f9fa !important;
    border-color: #0D7139 !important;
    color: #0D7139 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }

  .professional-primary-btn:hover {
    background: linear-gradient(135deg, #52c41a 0%, #0D7139 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(13, 113, 57, 0.32) !important;
  }

  /* Professional Select Styles */
  .professional-select .ant-select-selector {
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
    transition: all 0.3s ease !important;
  }

  .professional-select:hover .ant-select-selector {
    border-color: #0D7139 !important;
    box-shadow: 0 2px 8px rgba(13, 113, 57, 0.12) !important;
  }

  .professional-select.ant-select-focused .ant-select-selector {
    border-color: #0D7139 !important;
    box-shadow: 0 0 0 3px rgba(13, 113, 57, 0.1) !important;
  }

  /* Enhanced Row Styling */
  .pending-row {
    background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%) !important;
    border-left: 4px solid #faad14 !important;
  }

  .approved-row {
    background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%) !important;
    border-left: 4px solid #52c41a !important;
  }

  .rejected-row {
    background: linear-gradient(135deg, #fff1f0 0%, #fff2f0 100%) !important;
    border-left: 4px solid #ff4d4f !important;
  }

  .ant-table-tbody > tr:hover.pending-row > td {
    background: linear-gradient(135deg, #fff7e6 0%, #ffefd3 100%) !important;
  }

  .ant-table-tbody > tr:hover.approved-row > td {
    background: linear-gradient(135deg, #f0f9ff 0%, #e8f4fd 100%) !important;
  }

  .ant-table-tbody > tr:hover.rejected-row > td {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
  }

  /* Card Hover Effects */
  .ant-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
  }

  /* Stats Card Animation */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Professional Table Headers */
  .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%) !important;
    border-bottom: 2px solid #e9ecef !important;
    font-weight: 600 !important;
    color: #495057 !important;
    padding: 16px 16px !important;
  }

  
  /* Responsive Improvements */
  @media (max-width: 768px) {
    .ant-card-body {
      padding: 16px !important;
    }
    
    .ant-table-tbody > tr > td {
      padding: 8px 6px !important;
    }
    
    .ant-statistic-content-value {
      font-size: 20px !important;
    }
  }
`;
// 2. Add Export Modal Component (add this before the LeaveManagementPage component)
// In leavemanage.jsx, place this before the `const LeaveManagementPage = ...` line.

const ExportReportModal = ({ visible, onCancel, leaveData }) => {
  const [exportForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleExport = async (values) => {
    setLoading(true);
    try {
      const { month, year } = values;
      const startDate = dayjs().year(year).month(month).startOf('month');
      const endDate = dayjs().year(year).month(month).endOf('month');

      // Filter leaves for the selected month/year
      const filteredLeaves = leaveData.filter(leave => {
        const leaveDate = dayjs(leave.start_date);
        return leaveDate.isBetween(startDate, endDate, 'day', '[]');
      });

      if (filteredLeaves.length === 0) {
        message.warning('No leave data found for the selected month/year');
        setLoading(false);
        return;
      }

      // Prepare data for export
      const exportData = filteredLeaves.map(leave => ({
        'Employee Name': leave.users?.name || leave.employee_name,
        'Employee ID': leave.users?.employee_id || leave.employee_code,
        'Department': leave.department,
        'Leave Type': leave.leave_type,
        'Sub Type': leave.sub_type || '-',
        'Start Date': dayjs(leave.start_date).format('DD/MM/YYYY'),
        'End Date': dayjs(leave.end_date).format('DD/MM/YYYY'),
        'Total Days': leave.total_days || 0,
        'Status': leave.status,
        'Applied Date': dayjs(leave.created_at).format('DD/MM/YYYY'),
        'Approved By': leave.approved_by || '-',
        'Reason': leave.reason?.replace(/,/g, ';') || '-' // Sanitize commas for CSV
      }));

      // Create CSV content
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => `"${row[header]}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leave_report_${startDate.format('MMM_YYYY')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`Report for ${startDate.format('MMMM YYYY')} downloaded.`);
      onCancel();

    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined style={{ color: '#0D7139' }} />
          <span>Export Leave Report</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button
          key="export"
          type="primary"
          onClick={() => exportForm.submit()}
          loading={loading}
          icon={<DownloadOutlined />}
          style={{ background: 'linear-gradient(45deg, #8ac185 0%, #0D7139 100%)', border: 'none' }}
        >
          Export
        </Button>
      ]}
      width={400}
      destroyOnHidden
    >
      <Form
        form={exportForm}
        layout="vertical"
        onFinish={handleExport}
        initialValues={{ month: dayjs().month(), year: dayjs().year() }}
      >
        <Form.Item name="month" label="Select Month" rules={[{ required: true }]}>
          <Select placeholder="Choose month">
            {Array.from({ length: 12 }, (_, i) => (
              <Option key={i} value={i}>{dayjs().month(i).format('MMMM')}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="year" label="Select Year" rules={[{ required: true }]}>
          <Select placeholder="Choose year">
            {Array.from({ length: 5 }, (_, i) => {
              const year = dayjs().year() - i;
              return <Option key={year} value={year}>{year}</Option>;
            })}
          </Select>
        </Form.Item>
        <Alert
          message="The report will be downloaded as a CSV file for the selected period."
          type="info"
          showIcon
        />
      </Form>
    </Modal>
  );
};

export default LeaveManagementPage;