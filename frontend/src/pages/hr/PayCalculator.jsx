import React, { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, Select, message, Spin, Typography, Row, Col, Switch, Modal } from 'antd';
import { CalendarOutlined, DollarOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons';
import {IndianRupee} from 'lucide-react';
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';

const { Title, Text } = Typography;
const { Option } = Select;

const PayCalculator = ({ onPayCalculated, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [payCalculations, setPayCalculations] = useState([]);
  const [workingConfig, setWorkingConfig] = useState(null);
  const [monthlyWorkingDays, setMonthlyWorkingDays] = useState(0);
  const [includeBreakHours, setIncludeBreakHours] = useState(true);
  
  useEffect(() => {
    fetchUsersAndPay();
    fetchWorkingConfig();
  }, []);

  useEffect(() => {
    if (workingConfig) {
      calculateWorkingDaysFromDB();
    }
  }, [selectedMonth, workingConfig]);

  useEffect(() => {
    if (users.length > 0 && monthlyWorkingDays > 0) {
      calculateMonthlyPay();
    }
  }, [users, monthlyWorkingDays, includeBreakHours]);

  const fetchUsersAndPay = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, employee_id, email, role')
        .in('role', ['employee']);

      if (userError) throw userError;

      const usersWithPay = await Promise.all(
        (userData || []).map(async (user) => {
          const { data: payrollData, error: payrollError } = await supabase
            .from('payroll')
            .select('earnings, deductions')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let totalEarnings = 0;
          if (payrollData && payrollData.earnings) {
            totalEarnings = payrollData.earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
          }

          return {
            ...user,
            pay: totalEarnings,
            payrollData: payrollData
          };
        })
      );

      setUsers(usersWithPay);
    } catch (error) {
      console.error('Error fetching users and pay:', error);
      message.error('Error fetching users: ' + error.message);
    }
  };

  const fetchWorkingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('company_calendar')
        .select('*')
        .eq('holiday_name', 'Working Configuration')
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data && data.reason) {
        const config = typeof data.reason === 'string' ? JSON.parse(data.reason) : data.reason;
        setWorkingConfig(config);
      }
    } catch (error) {
      console.error('Error fetching working config:', error);
      setWorkingConfig({
        workingDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: false
        },
        workingHours: {
          startTime: "09:00",
          endTime: "18:00",
          breakStart: "12:00",
          breakEnd: "13:00",
          timezone: "IST"
        }
      });
    }
  };

  const calculateWorkingDaysFromDB = async () => {
    try {
      const startOfMonth = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = selectedMonth.endOf('month').format('YYYY-MM-DD');

      const { data: calendarData, error } = await supabase
        .from('company_calendar')
        .select('date, day_type, holiday_name')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date');

      if (error) throw error;

      const workingDaysFromDB = (calendarData || []).filter(day => 
        day.day_type !== 'holiday' && day.holiday_name !== 'Working Configuration'
      ).length;

      if (workingDaysFromDB > 0) {
        setMonthlyWorkingDays(workingDaysFromDB);
      } else {
        const manualWorkingDays = calculateWorkingDaysManually();
        setMonthlyWorkingDays(manualWorkingDays);
      }

    } catch (error) {
      console.error('Error calculating working days from DB:', error);
      const manualWorkingDays = calculateWorkingDaysManually();
      setMonthlyWorkingDays(manualWorkingDays);
    }
  };

  const calculateWorkingDaysManually = () => {
    if (!workingConfig?.workingDays) return 25;
    
    const startOfMonth = selectedMonth.startOf('month');
    const endOfMonth = selectedMonth.endOf('month');
    let workingDays = 0;
    
    let currentDate = startOfMonth;
    while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth, 'day')) {
      const dayName = currentDate.format('dddd').toLowerCase();
      
      if (workingConfig.workingDays[dayName]) {
        workingDays++;
      }
      
      currentDate = currentDate.add(1, 'day');
    }
    
    return workingDays;
  };

  const calculateWorkingHours = () => {
    if (!workingConfig?.workingHours) return 8;
    
    const { startTime, endTime, breakStart, breakEnd } = workingConfig.workingHours;
    
    const baseDate = '2000-01-01';
    const start = dayjs(`${baseDate} ${startTime}`);
    const end = dayjs(`${baseDate} ${endTime}`);
    const breakStartTime = dayjs(`${baseDate} ${breakStart}`);
    const breakEndTime = dayjs(`${baseDate} ${breakEnd}`);
    
    const totalHours = end.diff(start, 'hour', true);
    const breakHours = includeBreakHours ? 0 : breakEndTime.diff(breakStartTime, 'hour', true);
    return totalHours - breakHours;
  };

  const fetchAttendanceForUser = async (userId, month) => {
    try {
      const startOfMonth = month.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = month.endOf('month').format('YYYY-MM-DD');

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  };

  const calculateMonthlyPay = async () => {
    setLoading(true);
    try {
      const workingHoursPerDay = calculateWorkingHours();
      const calculations = [];
      
      for (const user of users) {
        if (!user.pay || user.pay === 0) {
          calculations.push({
            key: user.id,
            user_id: user.id,
            name: user.name,
            employee_id: user.employee_id,
            email: user.email,
            monthly_salary: 0,
            working_days: monthlyWorkingDays,
            working_hours_per_day: workingHoursPerDay,
            per_day_pay: 0,
            per_hour_pay: 0,
            actual_working_days: 0,
            actual_working_hours: 0,
            calculated_pay: 0,
            pay_status: 'No payroll data found',
            payrollData: user.payrollData
          });
          continue;
        }

        const monthlySalary = parseFloat(user.pay);
        const perDayPay = monthlySalary / monthlyWorkingDays;
        const perHourPay = perDayPay / workingHoursPerDay;

        const attendanceData = await fetchAttendanceForUser(user.id, selectedMonth);
        
        const actualWorkingDays = attendanceData.filter(att => att.is_present).length;
        const actualWorkingHours = attendanceData.reduce((total, att) => {
          return total + (parseFloat(att.total_hours) || 0);
        }, 0);

        const calculatedPay = actualWorkingHours * perHourPay;

        calculations.push({
          key: user.id,
          user_id: user.id,
          name: user.name,
          employee_id: user.employee_id,
          email: user.email,
          monthly_salary: monthlySalary,
          working_days: monthlyWorkingDays,
          working_hours_per_day: workingHoursPerDay,
          per_day_pay: perDayPay,
          per_hour_pay: perHourPay,
          actual_working_days: actualWorkingDays,
          actual_working_hours: actualWorkingHours,
          calculated_pay: calculatedPay,
          pay_status: actualWorkingDays > 0 ? 'Calculated' : 'No attendance'
        });
      }

      setPayCalculations(calculations);
      
      if (onPayCalculated) {
        onPayCalculated(calculations);
      }
      
    } catch (error) {
      message.error('Error calculating pay: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.employee_id}</div>
        </div>
      ),
    },
    {
      title: 'Monthly Salary',
      dataIndex: 'monthly_salary',
      key: 'monthly_salary',
      width: 120,
      render: (amount) => (
        <span style={{ fontWeight: 600, color: '#1890ff' }}>
          ₹{amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Working Days',
      key: 'days',
      width: 130,
      render: (_, record) => (
        <div>
          <div>{record.actual_working_days}/{record.working_days}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>Present/Total</div>
        </div>
      ),
    },
    {
      title: 'Per Day Pay',
      dataIndex: 'per_day_pay',
      key: 'per_day_pay',
      width: 130,
      render: (amount) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Per Hour Pay',
      dataIndex: 'per_hour_pay',
      key: 'per_hour_pay',
      width: 130,
      render: (amount) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Working Hours',
      key: 'hours',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.actual_working_hours.toFixed(1)}h</div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Expected: {(record.working_hours_per_day * record.working_days).toFixed(1)}h
          </div>
        </div>
      ),
    },
    {
      title: 'Calculated Pay',
      dataIndex: 'calculated_pay',
      key: 'calculated_pay',
      width: 150,
      render: (amount, record) => (
        <div>
          <div style={{ 
            fontWeight: 600, 
            color: record.pay_status === 'Calculated' ? '#52c41a' : '#faad14' 
          }}>
            ₹{amount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {record.pay_status}
          </div>
        </div>
      ),
    },
  ];

  const totalCalculatedPay = payCalculations.reduce((sum, calc) => sum + calc.calculated_pay, 0);

  return (
    <Modal
      title={null}
      open={true}
      onCancel={onClose}
      footer={null}
      width="95%"
      style={{ top: 20 }}
      closable={false}
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
            //   background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#8ac185',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '28px'
            }}>
              <IndianRupee />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
                Monthly Pay Calculator
              </Title>
              <Text style={{ color: '#64748b', fontSize: '16px' }}>
                Calculate employee pay based on attendance and working hours
              </Text>
            </div>
          </div>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose}
            style={{ 
              fontSize: '16px',
              padding: '8px',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Stats Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={6}>
            <Card style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px #8ac185'
            }}>
              <div style={{ textAlign: 'center' }}>
                <CalendarOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                <div style={{ marginBottom: '8px', fontSize: '14px', opacity: 0.9,color:"black" }}>Select Month</div>
                <DatePicker
                  picker="month"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card style={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'black',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px #8ac185',
              textAlign: 'center'
            }}>
              <IndianRupee style={{ fontSize: '32px', marginBottom: '12px' }} />
              <div style={{ marginBottom: '8px', fontSize: '14px', opacity: 0.9 }}>Total Monthly Pay</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                ₹{totalCalculatedPay.toLocaleString()}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card style={{
              background: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px #8ac185',
              textAlign: 'center'
            }}>
              <ClockCircleOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
              <div style={{ marginBottom: '8px', fontSize: '14px',color:"black", opacity: 0.9 }}>Break Hours</div>
              <Switch
                checked={includeBreakHours}
                onChange={setIncludeBreakHours}
                checkedChildren="Include"
                unCheckedChildren="Exclude"
                style={{ marginBottom: '8px' }}
              />
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px #8ac185',
              textAlign: 'center'
            }}>
              <CalendarOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
              <div style={{ marginBottom: '8px', fontSize: '14px', opacity: 0.9,color:"black" }}>Working Days</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px', color:"black" }}>
                {monthlyWorkingDays} days
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9, color:"black" }}>
                {calculateWorkingHours()}h/day
              </div>
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Card style={{ 
          borderRadius: '16px', 
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0'
        }}>
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={payCalculations}
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} employees`,
                style: { marginTop: '24px' }
              }}
              style={{ 
                '& .ant-table-thead > tr > th': {
                  background: '#f8fafc',
                  fontWeight: 600,
                  color: '#475569',
                  borderBottom: '2px solid #e2e8f0'
                }
              }}
            />
          </Spin>
        </Card>

        {/* Working Configuration Info */}
        {workingConfig && (
          <Card style={{ 
            marginTop: '24px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}>
            <Title level={5} style={{ marginBottom: '16px', color: '#475569' }}>
              Working Configuration
            </Title>
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Text style={{ color: '#64748b' }}>
                  <strong>Working Hours:</strong> {workingConfig.workingHours?.startTime} - {workingConfig.workingHours?.endTime} 
                  (Break: {workingConfig.workingHours?.breakStart} - {workingConfig.workingHours?.breakEnd})
                </Text>
              </Col>
              <Col span={24}>
                <Text style={{ color: '#64748b' }}>
                  <strong>Working Days:</strong> {Object.entries(workingConfig.workingDays || {})
                    .filter(([day, active]) => active)
                    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
                    .join(', ')}
                </Text>
              </Col>
              <Col span={24}>
                <Text style={{ color: '#64748b' }}>
                  <strong>Monthly Working Days:</strong> {monthlyWorkingDays} (calculated from company calendar)
                </Text>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default PayCalculator;