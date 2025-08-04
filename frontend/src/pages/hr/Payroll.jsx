  
import React, { useState, useEffect } from 'react';
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
  Spin,
  Modal  
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
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const truncateText = (text, maxLength) => {
  return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';
};

const formatDate = (date) => {
  return dayjs(date).format('MMMM YYYY');
};

const numberToWords = (amount) => {
  return `Indian Rupee ${Math.abs(amount).toFixed(2)} Only`;
};

const PayrollManagement = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [bulkDownloadVisible, setBulkDownloadVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [submitAction, setSubmitAction] = useState('save');
  const [emailOnlyVisible, setEmailOnlyVisible] = useState(false);
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

  const handleBulkDownload = async () => {
    try {
      setLoading(true);
      
      const startOfMonth = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = selectedMonth.endOf('month').format('YYYY-MM-DD');
      
      const { data: payrollData, error } = await supabase
        .from('payroll')
        .select('*')
        .gte('pay_period', startOfMonth)
        .lt('pay_period', selectedMonth.add(1, 'month').startOf('month').format('YYYY-MM-DD'));
      
      if (error) throw error;
      
      if (!payrollData || payrollData.length === 0) {
        message.warning(`No payroll records found for ${selectedMonth.format('MMMM YYYY')}`);
        return;
      }
      
      await generateBulkPDFsAsZip(payrollData, selectedMonth.format('YYYY-MM'));
      
      message.success(`Generated ${payrollData.length} payslips for ${selectedMonth.format('MMMM YYYY')}`);
      setBulkDownloadVisible(false);
    } catch (error) {
      message.error('Error during bulk download: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendPayslipEmail = async (employeeData, pdfBlob) => {
    try {
      const formData = new FormData();
      
      formData.append('employeeName', employeeData.employee_name);
      formData.append('employeeEmail', employeeData.email_address);
      formData.append('companyName', employeeData.company_name);
      formData.append('payPeriod', dayjs(employeeData.pay_period).format('MMMM YYYY'));
      
      formData.append('senderEmail', 'suryavenkatareddy90@gmail.com');
      formData.append('senderPassword', 'vrxftrjsiekrxdnf');
      
      formData.append('payslip', pdfBlob, `payslip_${employeeData.employee_name}_${dayjs(employeeData.pay_period).format('YYYY-MM')}.pdf`);
      
      const response = await fetch('http://localhost:5000/api/payslip', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      const result = await response.json();
      message.success('Payslip email sent successfully!');
      return result;
    } catch (error) {
      message.error('Error sending email: ' + error.message);
      throw error;
    }
  };

  const generateBulkPDFsAsZip = async (payrollData, monthYear) => {
    const zip = new JSZip();
    
    for (const employee of payrollData) {
      const pdfBlob = await generatePayslipPDF(employee, true);
      const fileName = `${employee.employee_name}_${employee.employee_id}_${monthYear}.pdf`;
      zip.file(fileName, pdfBlob);
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslips_${monthYear}.zip`;
    a.click();
    URL.revokeObjectURL(url);
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
    
    const formValues = form.getFieldsValue();
    formValues[updated[index].key] = field === 'value' ? value : formValues[updated[index].key];
    form.setFieldsValue(formValues);
  };

  const updateDeduction = (index, field, value) => {
    const updated = [...deductions];
    updated[index][field] = value;
    setDeductions(updated);
    
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
      
      return data || [];
    } catch (error) {
      message.error('Error fetching users: ' + error.message);
      return [];
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadUsers();
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

  const handleEmailOnly = async () => {
    try {
      setLoading(true);
      
      const startOfMonth = selectedMonth.startOf('month').format('YYYY-MM-DD');
      
      const { data: payrollData, error } = await supabase
        .from('payroll')
        .select('*')
        .gte('pay_period', startOfMonth)
        .lt('pay_period', selectedMonth.add(1, 'month').startOf('month').format('YYYY-MM-DD'));
      
      if (error) throw error;
      
      if (!payrollData || payrollData.length === 0) {
        message.warning(`No payroll records found for ${selectedMonth.format('MMMM YYYY')}`);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const employee of payrollData) {
        try {
          if (employee.email_address) {
            const pdfBlob = await generatePayslipPDF(employee, true);
            await sendPayslipEmail(employee, pdfBlob);
            successCount++;
          } else {
            console.warn(`No email address for employee: ${employee.employee_name}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`Failed to send email to ${employee.employee_name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        message.success(`Successfully sent ${successCount} payslip emails for ${selectedMonth.format('MMMM YYYY')}`);
      }
      if (errorCount > 0) {
        message.warning(`Failed to send ${errorCount} emails. Check console for details.`);
      }
      
      setEmailOnlyVisible(false);
    } catch (error) {
      message.error('Error during email sending: ' + error.message);
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
      
      const totalEmployees = users.length;
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

  // Professional Dashboard Header with green gradient
  const renderProfessionalHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, #2d5a4a 0%, #1e3d2f 100%)',
      padding: '40px 20px',
      color: 'white'
    }}>
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={12}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <BankOutlined style={{ fontSize: '36px', marginRight: '16px', color: '#4ade80' }} />
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
                <TeamOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#4ade80' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.totalEmployees}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Employees</div>
              </div>
            </Col>
            <Col xs={8} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <BankOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#10b981' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{stats.totalPayroll.toLocaleString()}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Payroll</div>
              </div>
            </Col>
            <Col xs={8} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <DashboardOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#34d399' }} />
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{stats.thisMonth.toLocaleString()}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>This Month</div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );

  // Professional Action Cards with green accents
  const renderActionCards = () => (
    <div style={{ padding: '30px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', }}>
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
            onClick={() => setBulkDownloadVisible(true)}
          >
            <DownloadOutlined style={{ fontSize: '32px', color: '#059669', marginBottom: '12px' }} />
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
            <FilePdfOutlined style={{ fontSize: '32px', color: '#047857', marginBottom: '12px' }} />
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
            onClick={() => setEmailOnlyVisible(true)}
          >
            <SendOutlined style={{ fontSize: '32px', color: '#065f46', marginBottom: '12px' }} />
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>Email Only</div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Send to all employees</div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const generatePayslipPDF = async (employee, returnBlob = false) => {
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
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
        <div style="border-bottom: 2px solid #2d5a4a; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="margin: 0; font-size: 24px; color: #2d5a4a;">${employee.company_name || 'Company Name'}</h1>
              <p style="margin: 5px 0; color: #666;">${employee.company_address || 'Company Address'}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 14px; color: #666;">Payslip For the Month</h2>
              <h3 style="margin: 5px 0; font-size: 20px; color: #2d5a4a;">${dayjs(employee.pay_period).format('MMMM YYYY')}</h3>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; margin-bottom: 15px; text-transform: uppercase; color: #2d5a4a;">Employee Summary</h3>
          <div style="display: flex; justify-content: space-between;">
            <div style="flex: 1;">
              <p><strong>Employee Name:</strong> ${employee.employee_name || 'N/A'}</p>
              <p><strong>Employee ID:</strong> ${employee.employee_id || 'N/A'}</p>
              <p><strong>Pay Period:</strong> ${dayjs(employee.pay_period).format('MMMM YYYY')}</p>
              <p><strong>Pay Date:</strong> ${dayjs(employee.pay_date).format('DD/MM/YYYY')}</p>
            </div>
            <div style="width: 200px; background: #f0f9f4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; text-align: center;">
              <div style="font-size: 18px; font-weight: bold; color: #059669;">Rs.${netPay.toFixed(2)}</div>
              <div style="font-size: 12px; color: #059669;">Total Net Pay</div>
              <div style="margin-top: 10px; font-size: 12px;">
                <div>Paid Days: ${employee.paid_days || 0}</div>
                <div>LOP Days: ${employee.lop_days || 0}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 5px;">
            <div style="background: #f0f9f4; padding: 10px; border-bottom: 1px solid #ddd; color: #2d5a4a;">
              <strong>EARNINGS</strong>
              <span style="float: right;"><strong>AMOUNT</strong></span>
            </div>
            <div style="padding: 10px;">
              ${Object.values(earningsData).map(item => 
                `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>${item.label}</span>
                  <span>Rs.${item.value.toFixed(2)}</span>
                </div>`
              ).join('')}
              <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between; font-weight: bold; color: #059669;">
                <span>Gross Earnings</span>
                <span>Rs.${totalEarnings.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div style="flex: 1; border: 1px solid #ddd; border-radius: 5px;">
            <div style="background: #fef2f2; padding: 10px; border-bottom: 1px solid #ddd; color: #991b1b;">
              <strong>DEDUCTIONS</strong>
              <span style="float: right;"><strong>AMOUNT</strong></span>
            </div>
            <div style="padding: 10px;">
              ${Object.values(deductionsData).map(item => 
                `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>${item.label}</span>
                  <span>Rs.${item.value.toFixed(2)}</span>
                </div>`
              ).join('')}
              <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between; font-weight: bold; color: #dc2626;">
                <span>Total Deductions</span>
                <span>Rs.${totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="background: #f0f9f4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #059669;">TOTAL NET PAYABLE</h3>
          <div style="font-size: 24px; font-weight: bold; color: #047857;">Rs.${netPay.toFixed(2)}</div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px; font-size: 13px;">
          <strong>Amount In Words:</strong> ${netPay >= 0 ? `Indian Rupee ${Math.abs(netPay).toFixed(2)} Only` : `Minus Indian Rupee ${Math.abs(netPay).toFixed(2)} Only`}
        </div>
        
        <div style="text-align: center; font-size: 11px; color: #666; font-style: italic; border-top: 1px solid #ddd; padding-top: 15px;">
          -- This is a system-generated document. --
        </div>
      </div>
    `;

    if (returnBlob) {
      return new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '800px';
        tempDiv.style.background = 'white';
        document.body.appendChild(tempDiv);
        
        html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        }).then(canvas => {
          document.body.removeChild(tempDiv);
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;
          
          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          const blob = pdf.output('blob');
          resolve(blob);
        }).catch(error => {
          document.body.removeChild(tempDiv);
          console.error('Error generating PDF:', error);
          resolve(new Blob()); // Return empty blob on error
        });
      });
    } else {
      // For email sending, we also need blob
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.background = 'white';
      document.body.appendChild(tempDiv);
      
      return new Promise((resolve) => {
        html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        }).then(canvas => {
          document.body.removeChild(tempDiv);
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;
          
          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          
          // For print dialog
          const printWindow = window.open('', '_blank');
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
              printWindow.close();
            };
          };
          
          // Return blob for email
          const blob = pdf.output('blob');
          resolve(blob);
        });
      });
    }
  };
  
  const onFinish = async (values) => {
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
          basic: values.basic || 0,
          hra: values.hra || 0,
          income_tax: values.incomeTax || 0,
          pf: values.pf || 0
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        if (submitAction === 'pdf') {
          // Generate and show PDF
          await generatePayslipPDF(data[0]);
          message.success('Employee added and PDF generated successfully!');
        } else if (submitAction === 'email') {
          // Generate PDF blob and send email
          const pdfBlob = await generatePayslipPDF(data[0], true);
          await sendPayslipEmail(data[0], pdfBlob);
          message.success('Employee added and email sent successfully!');
        } else {
          message.success('Employee added successfully!');
        }
      }

      setCurrentView('dashboard');
      form.resetFields();
      fetchEmployees();
      fetchStats();
    } catch (error) {
      message.error('Error: ' + error.message);
    } finally {
      setLoading(false);
      setSubmitAction('save'); // Reset action
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
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => setCurrentView('addEmployee')} 
                  style={{ 
                    borderRadius: '6px',
                    background: '#10b981',
                    borderColor: '#10b981'
                  }}
                >
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
                      background: role === 'hr' ? '#e6f7ff' : '#f0f9f4',
                      color: role === 'hr' ? '#1890ff' : '#059669',
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
                        style={{ 
                          borderRadius: '6px',
                          background: '#10b981',
                          borderColor: '#10b981'
                        }}
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
      <div style={{ 
        background: 'linear-gradient(135deg, #2d5a4a 0%, #1e3d2f 100%)', 
        height: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 50px',
        color: 'white'
      }}>
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

        <Card style={{
          background: 'white',
          borderRadius: '8px',
          padding: '40px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
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
                <div style={{ textAlign: 'center', color: '#10b981' }}>
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

            <Title level={4} style={{ marginBottom: '24px', color: '#2d5a4a' }}>Pay Period Details</Title>

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

            <Title level={4} style={{ marginBottom: '24px', color: '#2d5a4a' }}>Employee Selection</Title>

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
                      console.log('Selected user ID:', value);
                      const selectedUser = users.find(user => user.id === value);
                      console.log('Found user:', selectedUser);
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

            <Title level={4} style={{ marginBottom: '24px', color: '#2d5a4a' }}>Income Details</Title>

            <Row gutter={24}>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Title level={5} style={{ margin: 0, color: '#059669' }}>Earnings</Title>
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={addEarning}
                    size="small"
                    style={{ borderColor: '#10b981', color: '#10b981' }}
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
                  <Title level={5} style={{ margin: 0, color: '#dc2626' }}>Deductions</Title>
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={addDeduction}
                    size="small"
                    style={{ borderColor: '#dc2626', color: '#dc2626' }}
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

            <Title level={4} style={{ marginBottom: '24px', color: '#2d5a4a' }}>Income Details</Title>

            <Row gutter={24}>
              <Col span={12}>
                <Title level={5} style={{ color: '#059669' }}>Earnings</Title>
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
                <Title level={5} style={{ color: '#dc2626' }}>Deductions</Title>
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
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
              <Title level={4} style={{ textAlign: 'center', marginBottom: '16px', color: '#2d5a4a' }}>Pay Summary</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Total Earnings</Text>
                    <div style={{ fontSize: '18px', color: '#059669', fontWeight: 'bold' }}>
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
                    <div style={{ fontSize: '18px', color: '#dc2626', fontWeight: 'bold' }}>
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
                    <div style={{ fontSize: '20px', color: '#2d5a4a', fontWeight: 'bold' }}>
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

            <Form.Item>
              <Space size="large" style={{ width: '100%', justifyContent: 'center', marginTop: '40px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size="large"
                  onClick={() => setSubmitAction('pdf')}
                  style={{ 
                    background: '#059669', 
                    borderColor: '#059669',
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
                  onClick={() => {
                    setSubmitAction('email');
                    form.submit();
                  }}
                  style={{ 
                    background: '#047857', 
                    borderColor: '#047857',
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
        {/* ADD THE MODAL HERE - RIGHT AFTER </Content> AND BEFORE </Layout> */}
    <Modal
      title="Bulk Download Payslips"
      open={bulkDownloadVisible}
      onCancel={() => setBulkDownloadVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setBulkDownloadVisible(false)}>
          Cancel
        </Button>,
        <Button key="download" type="primary" loading={loading} onClick={handleBulkDownload}>
          Download Payslips
        </Button>
      ]}
    >
      <div style={{ padding: '20px 0' }}>
        <Text strong style={{ display: 'block', marginBottom: '16px' }}>
          Select month to download all payslips:
        </Text>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={setSelectedMonth}
          style={{ width: '100%' }}
          size="large"
        />
        <div style={{ marginTop: '16px', padding: '12px', background: '#f6ffed', borderRadius: '6px' }}>
          <Text type="secondary">
            All payslips for {selectedMonth.format('MMMM YYYY')} will be generated and downloaded.
          </Text>
        </div>
      </div>
    </Modal>
    <Modal
  title="Send Payslip Emails"
  open={emailOnlyVisible}
  onCancel={() => setEmailOnlyVisible(false)}
  footer={[
    <Button key="cancel" onClick={() => setEmailOnlyVisible(false)}>
      Cancel
    </Button>,
    <Button key="send" type="primary" loading={loading} onClick={handleEmailOnly}>
      Send Emails
    </Button>
  ]}
>
  <div style={{ padding: '20px 0' }}>
    <Text strong style={{ display: 'block', marginBottom: '16px' }}>
      Select month to send payslip emails to all employees:
    </Text>
    <DatePicker
      picker="month"
      value={selectedMonth}
      onChange={setSelectedMonth}
      style={{ width: '100%' }}
      size="large"
    />
    <div style={{ marginTop: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '6px' }}>
      <Text type="secondary">
        Payslip emails for {selectedMonth.format('MMMM YYYY')} will be sent to all employees with valid email addresses.
      </Text>
    </div>
  </div>
</Modal>
      </Layout>
    );
  };

  export default PayrollManagement;