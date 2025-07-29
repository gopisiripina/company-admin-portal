  import React, { useState,useEffect } from 'react';
  import { 
    Layout, 
    Button, 
    Form, 
    Input, 
    Select, 
    DatePicker, 
    InputNumber, 
    Card, 
    Typography, 
    Space, 
    Row, 
    Col,
    Upload,
    message,
    Table,
    Divider,
    Spin 
  } from 'antd';
  import { 
    PlusOutlined, 
    FilePdfOutlined, 
    MailOutlined, 
    UserOutlined,
    UploadOutlined,
    ArrowLeftOutlined,
    DashboardOutlined, 
    TeamOutlined, 
    DownloadOutlined,
    SendOutlined,
    BankOutlined
  } from '@ant-design/icons';
  import dayjs from 'dayjs';
  import { supabase } from '../../supabase/config';


  const { Header, Content } = Layout;
  const { Title, Text } = Typography;
  const { Option } = Select;

  const PayrollManagement = () => {
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'addEmployee'
    const [employees, setEmployees] = useState([]);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    thisMonth: 0
  });
  const [earnings, setEarnings] = useState([
    { key: 'basic', label: 'Basic', value: 0 },
    { key: 'hra', label: 'House Rent Allowance', value: 0 }
  ]);
  const [deductions, setDeductions] = useState([
    { key: 'incomeTax', label: 'Income Tax', value: 0 },
    { key: 'pf', label: 'Provident Fund', value: 0 }
  ]);
  const addEarning = () => {
    const newKey = `earning_${Date.now()}`;
    setEarnings([...earnings, { key: newKey, label: '', value: 0 }]);
  };

  const onSaveData = async (values) => {
  try {
    setLoading(true);
    
    // Validate required fields
    if (!values.companyName) {
      message.error('Company name is required');
      return;
    }
    if (!values.userId) {
      message.error('Please select an employee');
      return;
    }
    if (!values.payPeriod) {
      message.error('Pay period is required');
      return;
    }
    if (!values.payDate) {
      message.error('Pay date is required');
      return;
    }
    
    // Format dates safely
    const payPeriodFormatted = values.payPeriod && values.payPeriod.format ? 
      values.payPeriod.format('YYYY-MM-DD') : 
      dayjs(values.payPeriod).format('YYYY-MM-DD');
      
    const payDateFormatted = values.payDate && values.payDate.format ? 
      values.payDate.format('YYYY-MM-DD') : 
      dayjs(values.payDate).format('YYYY-MM-DD');
    
    const { data, error } = await supabase
      .from('payroll')
      .insert([{
        company_name: values.companyName,
        company_address: values.companyAddress || null,
        city: values.city || null,
        country: values.country || 'India',
        employee_name: values.employeeName || null,
        employee_id: values.employeeId || null,
        email_address: values.emailAddress || null,
        pay_period: payPeriodFormatted,
        pay_date: payDateFormatted,
        paid_days: values.paidDays || 0,
        lop_days: values.lopDays || 0,
        user_id: values.userId,
        // Only use the basic fields that exist in your schema
        basic: values.basic || 0,
        hra: values.hra || 0,
        income_tax: values.incomeTax || 0,
        pf: values.pf || 0
      }])
      .select();

    if (error) throw error;

    message.success('Payroll data saved successfully!');
    form.resetFields();
    fetchEmployees();
    fetchStats();
  } catch (error) {
    console.error('Save error:', error);
    message.error('Error saving payroll data: ' + error.message);
  } finally {
    setLoading(false);
  }
};


  const addDeduction = () => {
    const newKey = `deduction_${Date.now()}`;
    setDeductions([...deductions, { key: newKey, label: '', value: 0 }]);
  };

  const removeEarning = (index) => {
    if (earnings.length > 1) {
      setEarnings(earnings.filter((_, i) => i !== index));
    }
  };

  const removeDeduction = (index) => {
    if (deductions.length > 1) {
      setDeductions(deductions.filter((_, i) => i !== index));
    }
  };
  const updateEarning = (index, field, value) => {
    const updated = [...earnings];
    updated[index][field] = value;
    setEarnings(updated);
    
    // Update form values
    const formValues = form.getFieldsValue();
    formValues[updated[index].key] = field === 'value' ? value : formValues[updated[index].key];
    form.setFieldsValue(formValues);
  };

  const updateDeduction = (index, field, value) => {
    const updated = [...deductions];
    updated[index][field] = value;
    setDeductions(updated);
    
    // Update form values
    const formValues = form.getFieldsValue();
    formValues[updated[index].key] = field === 'value' ? value : formValues[updated[index].key];
    form.setFieldsValue(formValues);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, employee_id, email, role')
        .in('role', ['employee', 'hr'])
      
      if (error) throw error;
      console.log('Fetched users:', data);
      return data || [];
    } catch (error) {
      message.error('Error fetching users: ' + error.message);
      return [];
    }
  };

  useEffect(() => {
  const initializeData = async () => {
    await loadUsers(); // Make sure this completes first
    await fetchEmployees();
    fetchStats();
  };
  
  initializeData();
}, []);

  const loadUsers = async () => {
  try {
    setLoading(true);
    const usersData = await fetchUsers();
    setUsers(usersData);
    console.log('Users loaded:', usersData.length, 'users');
    
    if (usersData.length === 0) {
      message.warning('No employees found. Please add employees first.');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    message.error('Failed to load employees');
  } finally {
    setLoading(false);
  }
};

  // Supabase functions
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      message.error('Error fetching employees: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('net_pay, pay_period');
    
    if (error) throw error;
    
    const totalEmployees = users.length; // Count from users table
    const totalPayroll = data.reduce((sum, emp) => sum + (emp.net_pay || 0), 0);
    const currentMonth = dayjs().format('YYYY-MM');
    const thisMonth = data
      .filter(emp => dayjs(emp.pay_period).format('YYYY-MM') === currentMonth)
      .reduce((sum, emp) => sum + (emp.net_pay || 0), 0);
    
    setStats({ totalEmployees, totalPayroll, thisMonth });
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

  // Professional Dashboard Header (replaces mainHeaderStyle section)
  const renderProfessionalHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      padding: '40px 20px',
      color: 'white'
    }}>
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={12}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <BankOutlined style={{ fontSize: '36px', marginRight: '16px', color: '#4fc3f7' }} />
            <div>
              <Title level={1} style={{ color: 'white', margin: 0, fontSize: 'clamp(24px, 4vw, 32px)' }}>
                Payroll Management
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                Professional payroll processing made simple
              </Text>
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={16}>
            <Col xs={8} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <TeamOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#4fc3f7' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.totalEmployees}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Employees</div>
              </div>
            </Col>
            <Col xs={8} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <BankOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#81c784' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{stats.totalPayroll.toLocaleString()}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Payroll</div>
              </div>
            </Col>
            <Col xs={8} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <DashboardOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#ffb74d' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{stats.thisMonth.toLocaleString()}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>This Month</div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );

  // Professional Action Cards (replaces buttonGroupStyle section)
  const renderActionCards = () => (
    <div style={{ padding: '30px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              textAlign: 'center', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => setCurrentView('addEmployee')}
          >
            <PlusOutlined style={{ fontSize: '32px', color: '#10b981', marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>Add Employee</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Create new payroll entry</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              textAlign: 'center', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <DownloadOutlined style={{ fontSize: '32px', color: '#3b82f6', marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>Bulk Download</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Generate all payslips</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              textAlign: 'center', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <FilePdfOutlined style={{ fontSize: '32px', color: '#f59e0b', marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>PDF & Email</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Generate and send</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              textAlign: 'center', 
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <SendOutlined style={{ fontSize: '32px', color: '#8b5cf6', marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>Email Only</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Send to all employees</div>
          </Card>
        </Col>
      </Row>
    </div>
  );

    const mainHeaderStyle = {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 50px',
      color: 'white'
    };

    const buttonGroupStyle = {
      padding: '30px 50px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

    const contentStyle = {
      minHeight: 'calc(100vh - 260px)',
      background: '#f5f5f5',
      padding: '50px'
    };

    const addEmployeeCardStyle = {
      background: 'white',
      borderRadius: '8px',
      padding: '40px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    };

  const generatePayslipPDF = (employee) => {
    // Calculate totals
    const earningsData = employee.earnings_data || {
      basic: { label: 'Basic', value: employee.basic || 0 },
      hra: { label: 'House Rent Allowance', value: employee.hra || 0 }
    };
    
    const deductionsData = employee.deductions_data || {
      incomeTax: { label: 'Income Tax', value: employee.income_tax || 0 },
      pf: { label: 'Provident Fund', value: employee.pf || 0 }
    };
    
    const totalEarnings = employee.total_earnings || Object.values(earningsData).reduce((sum, item) => sum + item.value, 0);
    const totalDeductions = employee.total_deductions || Object.values(deductionsData).reduce((sum, item) => sum + item.value, 0);
    const netPay = employee.net_pay || (totalEarnings - totalDeductions);
    
    // Create HTML content for PDF with exact UI match
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            padding: 20px;
            color: #333;
            line-height: 1.4;
            font-size: 13px;
          }
          
          .payslip-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 25px 30px;
            border-bottom: 1px solid #eee;
          }
          
          .company-info h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
          }
          
          .company-info p {
            font-size: 13px;
            color: #666;
            margin: 2px 0;
          }
          
          .payslip-title {
            text-align: right;
          }
          
          .payslip-title h2 {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 5px;
            color: #666;
          }
          
          .payslip-title h3 {
            font-size: 28px;
            font-weight: 600;
            color: #333;
          }
          
          .content {
            padding: 25px 30px;
          }
          
          .employee-summary {
            margin-bottom: 25px;
          }
          
          .employee-summary h3 {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            letter-spacing: 0.5px;
          }
          
          .summary-layout {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .summary-left {
            flex: 1;
          }
          
          .summary-right {
            width: 200px;
            margin-left: 30px;
          }
          
          .summary-row {
            display: flex;
            margin-bottom: 12px;
            align-items: center;
          }
          
          .summary-row span:first-child {
            color: #666;
            font-size: 13px;
            width: 120px;
            flex-shrink: 0;
          }
          
          .summary-row span:last-child {
            font-weight: 500;
            color: #333;
            font-size: 13px;
          }
          
          .net-pay-box {
            background: #f0f9f0;
            border: 2px solid #22c55e;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin-bottom: 15px;
          }
          
          .net-pay-box .amount {
            font-size: 20px;
            font-weight: 700;
            color: #16a34a;
            margin-bottom: 3px;
          }
          
          .net-pay-box .label {
            font-size: 12px;
            color: #16a34a;
            font-weight: 500;
          }
          
          .days-row {
            display: flex;
            gap: 30px;
            margin-top: 15px;
          }
          
          .pay-details {
            display: flex;
            gap: 30px;
            margin: 25px 0;
          }
          
          .earnings-section, .deductions-section {
            flex: 1;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
          }
          
          .section-header {
            background: #f8f9fa;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .section-header span {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .pay-items {
            background: white;
          }
          
          .pay-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .pay-item:last-child {
            border-bottom: none;
            background: #f8f9fa;
            font-weight: 600;
            color: #1f2937;
          }
          
          .pay-item span:first-child {
            color: #4b5563;
            font-size: 13px;
          }
          
          .pay-item span:last-child {
            font-weight: 500;
            color: #1f2937;
            font-size: 13px;
          }
          
          .pay-item:last-child span {
            font-weight: 600;
          }
          
          .net-payable-section {
            background: #f0fdf4;
            border: 2px solid #22c55e;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          
          .net-payable-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #15803d;
            margin-bottom: 3px;
          }
          
          .net-payable-section .subtitle {
            font-size: 12px;
            color: #16a34a;
            margin-bottom: 12px;
          }
          
          .net-payable-section .amount {
            font-size: 28px;
            font-weight: 700;
            color: #15803d;
          }
          
          .amount-words {
            text-align: center;
            margin: 25px 0;
            font-size: 13px;
            color: #555;
          }
          
          .amount-words strong {
            color: #333;
          }
          
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            color: #666;
            font-size: 11px;
            font-style: italic;
          }
          
          @media print {
            body { 
              background: white;
              padding: 0;
            }
            .payslip-container {
              border: none;
            }
          }
          
          @page {
            size: A4;
            margin: 0.5in;
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <div class="header">
            <div class="company-info">
              <h1>${employee.company_name || 'access'}</h1>
              <p>${employee.company_address || 'nothing kakinada,533001 India'}</p>
            </div>
            <div class="payslip-title">
              <h2>Payslip For the Month</h2>
              <h3>${dayjs(employee.pay_period).format('MMMM YYYY') || 'June 2025'}</h3>
            </div>
          </div>
          
          <div class="content">
            <div class="employee-summary">
              <h3>EMPLOYEE SUMMARY</h3>
              <div class="summary-layout">
                <div class="summary-left">
                  <div class="summary-row">
                    <span>Employee Name</span>
                    <span>: ${employee.employee_name || 'surya'}</span>
                  </div>
                  <div class="summary-row">
                    <span>Employee ID</span>
                    <span>: ${employee.employee_id || '1234'}</span>
                  </div>
                  <div class="summary-row">
                    <span>Pay Period</span>
                    <span>: ${dayjs(employee.pay_period).format('MMMM YYYY') || 'June 2025'}</span>
                  </div>
                  <div class="summary-row">
                    <span>Pay Date</span>
                    <span>: ${dayjs(employee.pay_date).format('DD/MM/YYYY') || '01/06/2025'}</span>
                  </div>
                </div>
                <div class="summary-right">
                  <div class="net-pay-box">
                    <div class="amount">Rs.${netPay.toFixed(2)}</div>
                    <div class="label">Total Net Pay</div>
                  </div>
                  <div class="days-row">
                    <div class="summary-row" style="margin-bottom: 8px;">
                      <span>Paid Days</span>
                      <span>: ${employee.paid_days || 22}</span>
                    </div>
                    <div class="summary-row" style="margin-bottom: 8px;">
                      <span>LOP Days</span>
                      <span>: ${employee.lop_days || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="pay-details">
              <div class="earnings-section">
                <div class="section-header">
                  <span>EARNINGS</span>
                  <span>AMOUNT</span>
                </div>
                <div class="pay-items">
                  ${Object.values(earningsData).map(item => 
                    `<div class="pay-item">
                      <span>${item.label}</span>
                      <span>Rs.${item.value.toFixed(2)}</span>
                    </div>`
                  ).join('')}
                  <div class="pay-item">
                    <span>Gross Earnings</span>
                    <span>Rs.${totalEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div class="deductions-section">
                <div class="section-header">
                  <span>DEDUCTIONS</span>
                  <span>AMOUNT</span>
                </div>
                <div class="pay-items">
                  ${Object.values(deductionsData).map(item => 
                    `<div class="pay-item">
                      <span>${item.label}</span>
                      <span>Rs.${item.value.toFixed(2)}</span>
                    </div>`
                  ).join('')}
                  <div class="pay-item">
                    <span>Total Deductions</span>
                    <span>Rs.${totalDeductions.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="net-payable-section">
              <h3>TOTAL NET PAYABLE</h3>
              <div class="subtitle">Gross Earnings - Total Deductions</div>
              <div class="amount">Rs.${netPay.toFixed(2)}</div>
            </div>
            
            <div class="amount-words">
              <strong>Amount In Words:</strong> ${netPay >= 0 ? `Indian Rupee ${Math.abs(netPay).toFixed(2)} Only` : `Minus Indian Rupee ${Math.abs(netPay).toFixed(2)} Only`}
            </div>
            
            <div class="footer">
              -- This is a system-generated document. --
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = function() {
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
    
    message.success('Payslip PDF generated successfully!');
  };const onFinish = async (values) => {
  try {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('payroll')
      .insert([{
        company_name: values.companyName,
        company_address: values.companyAddress,
        city: values.city,
        country: values.country,
        employee_name: values.employeeName,
        employee_id: values.employeeId,
        email_address: values.emailAddress,
        pay_period: values.payPeriod.format('YYYY-MM-DD'),
        pay_date: values.payDate.format('YYYY-MM-DD'),
        paid_days: values.paidDays,
        lop_days: values.lopDays,
        user_id: values.userId,
        // Only use the basic fields
        basic: values.basic || 0,
        hra: values.hra || 0,
        income_tax: values.incomeTax || 0,
        pf: values.pf || 0
      }])
      .select();

    if (error) throw error;

    message.success('Employee added successfully!');
    setCurrentView('dashboard');
    form.resetFields();
    fetchEmployees();
    fetchStats();
  } catch (error) {
    message.error('Error adding employee: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const getMergedEmployeeData = () => {
  return users.map(user => {
    // Find the latest payroll record for this user
    const latestPayroll = employees
      .filter(emp => emp.user_id === user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    return {
      ...user,
      pay_period: latestPayroll?.pay_period || null,
      net_pay: latestPayroll?.net_pay || 0,
      pay_date: latestPayroll?.pay_date || null,
      hasPayroll: !!latestPayroll
    };
  });
};

  const renderDashboard = () => (
    <>
      {renderProfessionalHeader()}
      {renderActionCards()}
      
      <div style={{ padding: '30px 20px', background: '#ffffff', minHeight: 'calc(100vh - 300px)' }}>
        {employees.length === 0 ? (
          <Card style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            border: '2px dashed #e2e8f0',
            borderRadius: '12px',
            background: '#fafbfc'
          }}>
            <TeamOutlined style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '24px' }} />
            <Title level={2} style={{ color: '#475569', marginBottom: '16px', fontSize: 'clamp(20px, 3vw, 28px)' }}>
              No Employees Added Yet
            </Title>
            <Text style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px', display: 'block' }}>
              Get started by adding your first employee to the payroll system.
            </Text>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />}
              onClick={() => setCurrentView('addEmployee')}
              style={{ 
                background: '#10b981', 
                borderColor: '#10b981',
                height: '48px',
                fontSize: '16px',
                borderRadius: '8px',
                paddingLeft: '32px',
                paddingRight: '32px'
              }}
            >
              Add First Employee
            </Button>
          </Card>
        ) : (
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={3} style={{ margin: 0, color: '#1e293b' }}>Employee Payroll Records</Title>
              <Space wrap>
                <Button icon={<DownloadOutlined />} style={{ borderRadius: '6px' }}>
                  Export CSV
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCurrentView('addEmployee')} style={{ borderRadius: '6px' }}>
                  Add Employee
                </Button>
              </Space>
            </div>
            <Table
               dataSource={getMergedEmployeeData()}
              rowKey="id"
              loading={loading}
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`
              }}
              columns={[
                {
                  title: 'Employee',
                  key: 'employee',
                  render: (_, record) => (
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{record.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {record.employee_id}</div>
                    </div>
                  ),
                  responsive: ['xs', 'sm', 'md', 'lg']
                },
                {
                  title: 'Email',
                  dataIndex: 'email',
                  key: 'email',
                  responsive: ['sm', 'md', 'lg']
                },
                {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        render: (role) => (
          <span style={{ 
            padding: '4px 8px', 
            borderRadius: '4px', 
            background: role === 'hr' ? '#e6f7ff' : '#f6ffed',
            color: role === 'hr' ? '#1890ff' : '#52c41a',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {role.toUpperCase()}
          </span>
        ),
        responsive: ['md', 'lg']
      },
                {
                  title: 'Pay Period',
                  dataIndex: 'pay_period',
                  key: 'pay_period',
                  render: (date) => dayjs(date).format('MMM YYYY'),
                  responsive: ['md', 'lg']
                },
                {
                  title: 'Net Pay',
                  dataIndex: 'net_pay',
                  key: 'net_pay',
                  render: (amount) => (
                    <span style={{ fontWeight: '600', color: '#059669' }}>
                      ₹{amount?.toLocaleString() || 0}
                    </span>
                  ),
                  responsive: ['xs', 'sm', 'md', 'lg']
                },
                {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button 
            type="primary" 
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              form.setFieldsValue({
                userId: record.id,
                employeeName: record.name,
                employeeId: record.employee_id,
                emailAddress: record.email
              });
              setCurrentView('addEmployee');
            }}
            style={{ borderRadius: '6px' }}
          >
            Create Payroll
          </Button>
          {record.hasPayroll && (
            <Button 
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => {
                const latestPayroll = employees
                  .filter(emp => emp.user_id === record.id)
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                if (latestPayroll) {
                  generatePayslipPDF(latestPayroll);
                }
              }}
              style={{ borderRadius: '6px' }}
            >
              PDF
            </Button>
          )}
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg']
    },
    ]}
            />
          </Card>
        )}
      </div>
    </>
  );
  if (!users || users.length === 0) {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <Spin size="large" />
      <div style={{ marginTop: '16px' }}>Loading employees...</div>
    </div>
  );
}
    const renderAddEmployee = () => (
      <>
        <div style={{ ...mainHeaderStyle, height: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => setCurrentView('dashboard')}
              style={{ color: 'white', marginRight: '20px', fontSize: '16px' }}
            >
              Back to Employees
            </Button>
          </div>
        </div>

        <div style={{ padding: '30px 50px', background: '#f5f5f5', minHeight: 'calc(100vh - 120px)' }}>
          <div style={{ marginBottom: '30px' }}>
            <Title level={2} style={{ color: '#262626', marginBottom: '8px' }}>
              Add New Employee
            </Title>
            <Text style={{ color: '#8c8c8c', fontSize: '16px' }}>
              Create professional payslips for your employees with ease.
            </Text>
          </div>

          <Card style={addEmployeeCardStyle}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              validateTrigger="onSubmit"
              initialValues={{
                country: 'India',
                payPeriod: dayjs(),
                payDate: dayjs(),
                lopDays: 0,
                paidDays: 0,
                basic: 0,
                hra: 0,
                incomeTax: 0,
                pf: 0
              }}
            >
              <div style={{ marginBottom: '30px' }}>
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  style={{ marginBottom: '20px' }}
                >
                  <div style={{ textAlign: 'center', color: '#1890ff' }}>
                    <UploadOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <div>Upload Logo</div>
                  </div>
                </Upload>
              </div>

              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item
                    label="Company Name"
                    name="companyName"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input size="large" placeholder="Company Name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item label="Company Address" name="companyAddress">
                    <Input size="large" placeholder="Company Address" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={18}>
                  <Form.Item label="City, Pincode" name="city">
                    <Input size="large" placeholder="City, Pincode" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Country" name="country">
                    <Select size="large">
                      <Option value="India">India</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
  <Divider />

  <Title level={4} style={{ marginBottom: '24px' }}>Pay Period Details</Title>

<Row gutter={24}>
  <Col span={12}>
    <Form.Item
      label="Pay Period"
      name="payPeriod"
      rules={[{ required: true, message: 'Please select pay period' }]}
    >
      <DatePicker 
        size="large" 
        style={{ width: '100%' }}
        picker="month"
        placeholder="Select pay period"
      />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item
      label="Pay Date"
      name="payDate"
      rules={[{ required: true, message: 'Please select pay date' }]}
    >
      <DatePicker 
        size="large" 
        style={{ width: '100%' }}
        placeholder="Select pay date"
      />
    </Form.Item>
  </Col>
</Row>

<Row gutter={24}>
  <Col span={12}>
    <Form.Item
      label="Paid Days"
      name="paidDays"
      rules={[{ required: true, message: 'Please enter paid days' }]}
    >
      <InputNumber 
        size="large" 
        style={{ width: '100%' }}
        min={0}
        max={31}
        placeholder="Enter paid days"
      />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item
      label="LOP Days"
      name="lopDays"
    >
      <InputNumber 
        size="large" 
        style={{ width: '100%' }}
        min={0}
        max={31}
        placeholder="Enter LOP days"
      />
    </Form.Item>
  </Col>
</Row>

  <Title level={4} style={{ marginBottom: '24px' }}>Employee Selection</Title>

  <Row gutter={24}>
  <Col span={8}>

  <Form.Item
  label="Select Employee"
  name="userId"
  rules={[{ required: true, message: 'Please select an employee' }]}
>
  <Select 
    size="large" 
    placeholder="Select an employee"
    showSearch
    loading={users.length === 0}
    notFoundContent={users.length === 0 ? <Spin size="small" /> : 'No employees found'}
    filterOption={(input, option) => {
      const optionText = option.children.toString().toLowerCase();
      return optionText.includes(input.toLowerCase());
    }}
    onChange={(value) => {
      console.log('Selected user ID:', value); // Debug log
      const selectedUser = users.find(user => user.id === value);
      console.log('Found user:', selectedUser); // Debug log
      if (selectedUser) {
        form.setFieldsValue({
          employeeName: selectedUser.name,
          employeeId: selectedUser.employee_id,
          emailAddress: selectedUser.email
        });
      } else {
        message.error('Selected user not found');
      }
    }}
  >
    {users.map(user => (
      <Option key={user.id} value={user.id}>
        {user.name} ({user.employee_id}) - {user.role}
      </Option>
    ))}
  </Select>
</Form.Item>

    <Form.Item
      label="Employee Name"
      name="employeeName"
      rules={[{ required: true, message: 'Employee name is required' }]}
    >
      <Input size="large" placeholder="Employee Name" disabled />
    </Form.Item>
  </Col>
  <Col span={8}>
    <Form.Item
      label="Employee ID"
      name="employeeId"
      rules={[{ required: true, message: 'Employee ID is required' }]}
    >
      <Input size="large" placeholder="Employee ID" disabled />
    </Form.Item>
  </Col>
  <Col span={8}>
    <Form.Item
      label="Email Address"
      name="emailAddress"
    >
      <Input size="large" placeholder="Email Address" disabled />
    </Form.Item>
  </Col>
</Row>

  <Title level={4} style={{ marginBottom: '24px' }}>Income Details</Title>

  <Row gutter={24}>
    <Col span={12}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>Earnings</Title>
        <Button 
          type="dashed" 
          icon={<PlusOutlined />} 
          onClick={addEarning}
          size="small"
        >
          Add Earning
        </Button>
      </div>
      
      {earnings.map((earning, index) => (
        <div key={earning.key} style={{ marginBottom: '16px', border: '1px solid #f0f0f0', padding: '12px', borderRadius: '6px' }}>
          <Row gutter={8}>
            <Col span={16}>
              <Input
                placeholder="Earning name"
                value={earning.label}
                onChange={(e) => updateEarning(index, 'label', e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <Form.Item name={earning.key} style={{ margin: 0 }}>
                <InputNumber 
                  size="large" 
                  style={{ width: '100%' }} 
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  min={0}
                  onChange={(value) => updateEarning(index, 'value', value || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {earnings.length > 1 && (
                <Button 
                  type="text" 
                  danger 
                  onClick={() => removeEarning(index)}
                  style={{ marginTop: '32px' }}
                >
                  Remove
                </Button>
              )}
            </Col>
          </Row>
        </div>
      ))}
    </Col>
    
    <Col span={12}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>Deductions</Title>
        <Button 
          type="dashed" 
          icon={<PlusOutlined />} 
          onClick={addDeduction}
          size="small"
        >
          Add Deduction
        </Button>
      </div>
      
      {deductions.map((deduction, index) => (
        <div key={deduction.key} style={{ marginBottom: '16px', border: '1px solid #f0f0f0', padding: '12px', borderRadius: '6px' }}>
          <Row gutter={8}>
            <Col span={16}>
              <Input
                placeholder="Deduction name"
                value={deduction.label}
                onChange={(e) => updateDeduction(index, 'label', e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <Form.Item name={deduction.key} style={{ margin: 0 }}>
                <InputNumber 
                  size="large" 
                  style={{ width: '100%' }} 
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  min={0}
                  onChange={(value) => updateDeduction(index, 'value', value || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {deductions.length > 1 && (
                <Button 
                  type="text" 
                  danger 
                  onClick={() => removeDeduction(index)}
                  style={{ marginTop: '32px' }}
                >
                  Remove
                </Button>
              )}
            </Col>
          </Row>
        </div>
      ))}
    </Col>
  </Row>

              <Divider />

              <Title level={4} style={{ marginBottom: '24px' }}>Income Details</Title>

              <Row gutter={24}>
                <Col span={12}>
                  <Title level={5}>Earnings</Title>
                  <Form.Item label="Basic" name="basic">
                    <InputNumber 
                      size="large" 
                      style={{ width: '100%' }} 
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                      min={0}
                    />
                  </Form.Item>
                  <Form.Item label="House Rent Allowance" name="hra">
                    <InputNumber 
                      size="large" 
                      style={{ width: '100%' }} 
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Title level={5}>Deductions</Title>
                  <Form.Item label="Income Tax" name="incomeTax">
                    <InputNumber 
                      size="large" 
                      style={{ width: '100%' }} 
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                      min={0}
                    />
                  </Form.Item>
                  <Form.Item label="Provident Fund" name="pf">
                    <InputNumber 
                      size="large" 
                      style={{ width: '100%' }} 
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                      min={0}
                    />
                    <Divider />

  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
    <Title level={4} style={{ textAlign: 'center', marginBottom: '16px' }}>Pay Summary</Title>
    <Row gutter={24}>
      <Col span={8}>
        <div style={{ textAlign: 'center' }}>
          <Text strong>Total Earnings</Text>
          <div style={{ fontSize: '18px', color: '#52c41a', fontWeight: 'bold' }}>
            ₹{form.getFieldsValue() ? 
              earnings.reduce((sum, earning) => sum + (form.getFieldValue(earning.key) || 0), 0).toLocaleString() : 
              '0'
            }
          </div>
        </div>
      </Col>
      <Col span={8}>
        <div style={{ textAlign: 'center' }}>
          <Text strong>Total Deductions</Text>
          <div style={{ fontSize: '18px', color: '#ff4d4f', fontWeight: 'bold' }}>
            ₹{form.getFieldsValue() ? 
              deductions.reduce((sum, deduction) => sum + (form.getFieldValue(deduction.key) || 0), 0).toLocaleString() : 
              '0'
            }
          </div>
        </div>
      </Col>
      <Col span={8}>
        <div style={{ textAlign: 'center' }}>
          <Text strong>Net Pay</Text>
          <div style={{ fontSize: '20px', color: '#1890ff', fontWeight: 'bold' }}>
            ₹{form.getFieldsValue() ? 
              (earnings.reduce((sum, earning) => sum + (form.getFieldValue(earning.key) || 0), 0) - 
              deductions.reduce((sum, deduction) => sum + (form.getFieldValue(deduction.key) || 0), 0)).toLocaleString() : 
              '0'
            }
          </div>
        </div>
      </Col>
    </Row>
  </div>

                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space size="large" style={{ width: '100%', justifyContent: 'center', marginTop: '40px' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    size="large"
                    style={{ 
                      background: '#f5222d', 
                      borderColor: '#f5222d',
                      width: '200px',
                      height: '45px',
                      fontSize: '16px'
                    }}
                  >
                    Generate PDF & Save
                  </Button>
                  <Button 
                    type="primary" 
                    size="large"
                    style={{ 
                      background: '#f5222d', 
                      borderColor: '#f5222d',
                      width: '220px',
                      height: '45px',
                      fontSize: '16px'
                    }}
                  >
                    Generate PDF & Send Email
                  </Button>
                  <Button 
    size="large"
    loading={loading}
    onClick={() => {
      form.validateFields()
        .then(values => {
          onSaveData(values);
        })
        .catch(errorInfo => {
          console.log('Validation Failed:', errorInfo);
          message.error('Please fill in all required fields');
        });
    }}
    style={{ 
      width: '120px',
      height: '45px',
      fontSize: '16px'
    }}
  >
    Save Data
  </Button>
                  <Button 
                    size="large"
                    style={{ 
                      width: '100px',
                      height: '45px',
                      fontSize: '16px',
                      background: '#8c8c8c',
                      borderColor: '#8c8c8c',
                      color: 'white'
                    }}
                    onClick={() => form.resetFields()}
                  >
                    Reset
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </>
    );

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content>
          {currentView === 'dashboard' ? renderDashboard() : renderAddEmployee()}
        </Content>
      </Layout>
    );
  };

  export default PayrollManagement;