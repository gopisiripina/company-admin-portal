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
          pf: values.pf || 0,
          gender: values.gender || null,
          designation: values.designation || null,
          transaction_id: values.transactionId || null,
          pan_number: values.panNumber || null,
          employee_bank: values.employeeBank || null,
          bank_account: values.bankAccount || null,
          uan_number: values.uanNumber || null,
          esi_number: values.esiNumber || null
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
  .select(`
    *,
    users (
      name,
      employee_id,
      email
    )
  `)
  .gte('pay_period', startOfMonth)
  .lt('pay_period', selectedMonth.add(1, 'month').startOf('month').format('YYYY-MM-DD'));

if (error) throw error;

const enrichedPayrollData = payrollData?.map(record => {
  const employeeName = record.employee_name || record.users?.name || 'N/A';
  const employeeId = record.employee_id || record.users?.employee_id || 'N/A';
  const emailAddress = record.email_address || record.users?.email || 'N/A';
  
  const earningsData = {
    basic: { label: 'Basic', value: Number(record.basic) || 0 },
    hra: { label: 'House Rent Allowance', value: Number(record.hra) || 0 }
  };
  
  const deductionsData = {
    incomeTax: { label: 'Income Tax', value: Number(record.income_tax) || 0 },
    pf: { label: 'Provident Fund', value: Number(record.pf) || 0 }
  };
  
  const totalEarnings = Number(record.gross_earnings) || Object.values(earningsData).reduce((sum, item) => sum + (item.value || 0), 0);
  const totalDeductions = Number(record.total_deductions) || Object.values(deductionsData).reduce((sum, item) => sum + (item.value || 0), 0);
  const netPay = Number(record.net_pay) || (totalEarnings - totalDeductions);

  return {
    ...record,
    employee_name: employeeName,
    employee_id: employeeId,
    email_address: emailAddress,
    basic: Number(record.basic) || 0,
    hra: Number(record.hra) || 0,
    income_tax: Number(record.income_tax) || 0,
    pf: Number(record.pf) || 0,
    paid_days: Number(record.paid_days) || 0,
    lop_days: Number(record.lop_days) || 0,
    gross_earnings: totalEarnings,
    total_deductions: totalDeductions,
    net_pay: netPay,
    earnings_data: earningsData,
    deductions_data: deductionsData,
    total_earnings: totalEarnings
  };
}) || [];
      
      if (!payrollData || payrollData.length === 0) {
        message.warning(`No payroll records found for ${selectedMonth.format('MMMM YYYY')}`);
        return;
      }
      
      await generateBulkPDFsAsZip(enrichedPayrollData, selectedMonth.format('YYYY-MM'));
      
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
      
      
      formData.append('payslip', pdfBlob, `payslip_${employeeData.employee_name}_${dayjs(employeeData.pay_period).format('YYYY-MM')}.pdf`);
      
      const response = await fetch('https://cap.myaccessio.com/api/payslip', {
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
    try {
      const pdfBlob = await new Promise((resolve) => {
        const tempEmployee = {
          ...employee,
          employee_name: employee.employee_name || employee.users?.name || 'N/A',
          employee_id: employee.employee_id || employee.users?.employee_id || 'N/A',
          email_address: employee.email_address || employee.users?.email || 'N/A'
        };
        
        generatePayslipPDF(tempEmployee, true).then(resolve);
      });
      
      const fileName = `${employee.employee_name || employee.users?.name || 'Unknown'}_${employee.employee_id || employee.users?.employee_id || 'Unknown'}_${monthYear}.pdf`;
      zip.file(fileName, pdfBlob);
    } catch (error) {
      console.error(`Error generating PDF for employee ${employee.employee_name}:`, error);
    }
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
  .select(`
    *,
    users (
      name,
      employee_id,
      email
    )
  `)
  .gte('pay_period', startOfMonth)
  .lt('pay_period', selectedMonth.add(1, 'month').startOf('month').format('YYYY-MM-DD'));

if (error) throw error;

const enrichedPayrollData = payrollData?.map(record => ({
  ...record,
  employee_name: record.employee_name || record.users?.name,
  employee_id: record.employee_id || record.users?.employee_id,
  email_address: record.email_address || record.users?.email
})) || [];
      
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

  const generatePayslipPDF = async (employee, returnBlob = false) => {
  console.log('PDF Generation - Employee data:', employee);
  
  const employeeData = {
    employee_name: employee.employee_name || employee.users?.name || 'N/A',
    employee_id: employee.employee_id || employee.users?.employee_id || 'N/A', 
    email_address: employee.email_address || employee.users?.email || 'N/A',
    company_name: employee.company_name || 'MYACCESS PRIVATE LIMITED',
    company_address: employee.company_address || 'NASSCOM CoE - IoT & AU, Andhra University Visakhapatnam - 530003\nAndhra Pradesh India',
    pay_period: employee.pay_period,
    pay_date: employee.pay_date,
    paid_days: Number(employee.paid_days) || 0,
    lop_days: Number(employee.lop_days) || 0,
    basic: Number(employee.basic) || 0,
    hra: Number(employee.hra) || 0,
    income_tax: Number(employee.income_tax) || 0,
    pf: Number(employee.pf) || 0,
    gender: employee.gender || 'N/A',
    designation: employee.designation || 'N/A',
    transaction_id: employee.transaction_id || 'N/A',
    pan_number: employee.pan_number || 'N/A',
    employee_bank: employee.employee_bank || 'N/A',
    bank_account: employee.bank_account || 'N/A',
    uan_number: employee.uan_number || '-',
    esi_number: employee.esi_number || '-'
  };
  
  const earningsData = employee.earnings_data || {
    basic: { label: 'Basic', value: employeeData.basic },
    hra: { label: 'House Rent Allowance', value: employeeData.hra }
  };
  
  const deductionsData = employee.deductions_data || {
    incomeTax: { label: 'Income Tax', value: employeeData.income_tax },
    pf: { label: 'Provident Fund', value: employeeData.pf }
  };
  
  const totalEarnings = employee.total_earnings || Object.values(earningsData).reduce((sum, item) => sum + (item.value || 0), 0);
  const totalDeductions = employee.total_deductions || Object.values(deductionsData).reduce((sum, item) => sum + (item.value || 0), 0);
  const netPay = employee.net_pay || (totalEarnings - totalDeductions);

  const numberToWords = (num) => {
    if (num === 0) return "Zero";
    return `${num.toLocaleString('en-IN')} Only`;
  };
    
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyAccess Payslip</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    
    <div style="max-width: 800px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
        
        <div style="background-color: white; padding: 20px; border-bottom: 1px solid #e0e0e0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="background-color: #2c5aa0; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px;">
                            MYACCESS
                        </div>
                        <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">${employeeData.company_name}</h1>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">
                        ${employeeData.company_address.replace(/\n/g, '<br>')}
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Payslip For the Month</div>
                    <div style="font-size: 18px; font-weight: bold; color: #333;">${dayjs(employeeData.pay_period).format('MMMM YYYY')}</div>
                </div>
            </div>
        </div>

        <div style="display: flex; padding: 20px; gap: 20px;">
            <div style="flex: 1;">
                <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #666; font-weight: normal;">EMPLOYEE SUMMARY</h3>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Employee Name</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.employee_name}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Employee ID</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.employee_id}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Pay Period</span>
                    <span style="font-size: 12px; color: #333;">: ${dayjs(employeeData.pay_period).format('MMMM YYYY')}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Pay Date</span>
                    <span style="font-size: 12px; color: #333;">: ${dayjs(employeeData.pay_date).format('YYYY-MM-DD')}</span>
                </div>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; min-width: 200px; overflow: hidden;">
                <div style="padding: 20px; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 85px; background-color: #e8f5e8;"></div>
                    <div style="position: relative; z-index: 1;">
                        <div style="border-left: 4px solid #4caf50; padding-left: 12px; margin-bottom: 15px;">
                            <div style="font-size: 24px; font-weight: bold; color: #2e7d32; margin-bottom: 5px;">Rs.${netPay.toLocaleString('en-IN')}</div>
                            <div style="font-size: 12px; color: #4caf50;">Employee Net Pay</div>
                        </div>
                        
                        <div style="border-top: 1px dashed #ccc; padding-top: 15px;">
                            <div style="margin-bottom: 8px;">
                                <span style="display: inline-block; width: 80px; font-size: 12px; color: #666;">Paid Days</span>
                                <span style="font-size: 12px; color: #333;">: ${employeeData.paid_days}</span>
                            </div>
                            <div>
                                <span style="display: inline-block; width: 80px; font-size: 12px; color: #666;">LOP Days</span>
                                <span style="font-size: 12px; color: #333;">: ${employeeData.lop_days}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div style="display: flex; padding: 0 20px 20px 20px; gap: 40px;">
            <div style="flex: 1;">
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Gender</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.gender}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Designation</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.designation}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Transaction ID</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.transaction_id}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">PAN Number</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.pan_number}</span>
                </div>
            </div>
            
            <div style="flex: 1;">
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Employee Bank</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.employee_bank}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">Bank Account</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.bank_account}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">UAN Number</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.uan_number}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="display: inline-block; width: 120px; font-size: 12px; color: #666;">ESI Number</span>
                    <span style="font-size: 12px; color: #333;">: ${employeeData.esi_number}</span>
                </div>
            </div>
        </div>

        <div style="margin: 20px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: white;">
            <div style="display: flex;">
                <div style="flex: 1; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px dotted #ddd;">
                        <span style="font-size: 14px; font-weight: bold; color: #333;">EARNINGS</span>
                        <span style="font-size: 14px; font-weight: bold; color: #333;">AMOUNT</span>
                    </div>
                    
                    ${Object.values(earningsData).map(item => 
                        `<div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-size: 13px; color: #333;">${item.label}</span>
                                <span style="font-size: 13px; color: #333; font-weight: 600;">Rs.${item.value.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>
                        </div>`
                    ).join('')}
                    
                    <div style="padding-top: 15px; border-top: 1px solid #e0e0e0;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 14px; font-weight: bold; color: #333;">Gross Earnings</span>
                            <span style="font-size: 14px; font-weight: bold; color: #333; margin-left: auto;">Rs.${totalEarnings.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>

                <div style="flex: 1; padding: 20px; border-left: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px dotted #ddd;">
                        <span style="font-size: 14px; font-weight: bold; color: #333;">DEDUCTIONS</span>
                        <span style="font-size: 14px; font-weight: bold; color: #333;">AMOUNT</span>
                    </div>
                    
                    ${Object.values(deductionsData).map(item => 
                        `<div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-size: 13px; color: #333;">${item.label}</span>
                                <span style="font-size: 13px; color: #333; font-weight: 600;">Rs.${item.value.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                            </div>
                        </div>`
                    ).join('')}
                    
                    <div style="padding-top: 15px; border-top: 1px solid #e0e0e0;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 14px; font-weight: bold; color: #333;">Total Deductions</span>
                            <span style="font-size: 14px; font-weight: bold; color: #333; margin-left: auto;">Rs.${totalDeductions.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div style="margin: 20px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: white;">
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px;">TOTAL NET PAYABLE</div>
                        <div style="font-size: 13px; color: #666;">Gross Earnings - Total Deductions</div>
                    </div>
                    <div style="background-color: #e8f5e8; padding: 15px 20px; border-radius: 8px;">
                        <div style="font-size: 26px; font-weight: bold; color: #2e7d32;">Rs.${netPay.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="margin: 0 20px 20px 20px; text-align: center;">
            <div style="font-size: 12px; color: #666;">Amount In Words : Indian Rupee ${numberToWords(netPay)}</div>
        </div>
        
    </div>

</body>
</html>
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
          resolve(new Blob());
        });
      });
    } else {
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
          
          const printWindow = window.open('', '_blank');
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
              printWindow.close();
            };
          };
          
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
          await generatePayslipPDF(data[0]);
          message.success('Employee added and PDF generated successfully!');
        } else if (submitAction === 'email') {
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
      setSubmitAction('save');
    }
  };

  const getMergedEmployeeData = () => {
    return users.map(user => {
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

  // NEW: Professional Dashboard Component
  const renderDashboard = () => (
    <div style={{ background: '#f7fafc', minHeight: '100vh', padding: '24px' }}>
      <style>
        {`
          .ant-btn-primary { background: #10b981; border-color: #10b981; }
          .ant-btn-primary:hover { background: #059669; border-color: #059669; }
          .ant-table-thead > tr > th { background: #f8f9fa !important; color: #475569; font-weight: 600; }
          .ant-table-tbody > tr > td { border-bottom: 1px solid #e2e8f0; }
          .ant-table-tbody > tr:hover > td { background: #f8f9fa; }
          .ant-card { border: 1px solid #e2e8f0; }
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }
          .stat-card:hover {
             transform: translateY(-5px);
             box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
        `}
      </style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
              Payroll Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Manage your employee payroll efficiently.
            </Text>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div style={{ 
                background: '#e6f7ff', 
                color: '#1890ff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '24px'
              }}>
                <TeamOutlined />
              </div>
              <div>
                <Text type="secondary">Total Employees</Text>
                <Title level={3} style={{ margin: 0 }}>{stats.totalEmployees}</Title>
              </div>
            </Space>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div style={{ 
                background: '#fffbe6', 
                color: '#faad14',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '24px'
              }}>
                <BankOutlined />
              </div>
              <div>
                <Text type="secondary">Total Payroll</Text>
                <Title level={3} style={{ margin: 0 }}>₹{stats.totalPayroll.toLocaleString()}</Title>
              </div>
            </Space>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="stat-card">
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div style={{ 
                background: '#f6ffed', 
                color: '#52c41a',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '24px'
              }}>
                <DashboardOutlined />
              </div>
              <div>
                <Text type="secondary">This Month's Payroll</Text>
                <Title level={3} style={{ margin: 0 }}>₹{stats.thisMonth.toLocaleString()}</Title>
              </div>
            </Space>
          </div>
        </Col>
      </Row>

      {/* Main Content */}
      {employees.length === 0 ? (
        <Card style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          border: '2px dashed #e2e8f0',
          borderRadius: '12px',
          background: '#fafbfc'
        }}>
          <TeamOutlined style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '24px' }} />
          <Title level={2} style={{ color: '#475569', marginBottom: '16px' }}>
            No Payroll Records Found
          </Title>
          <Text style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px', display: 'block' }}>
            Get started by adding your first employee to the payroll system.
          </Text>
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />}
            onClick={() => setCurrentView('addEmployee')}
          >
            Add First Employee
          </Button>
        </Card>
      ) : (
        <Card style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Employee Records</Title>
            <Space wrap>
              <Button icon={<DownloadOutlined />} onClick={() => setBulkDownloadVisible(true)}>
                Bulk Download
              </Button>
              <Button icon={<SendOutlined />} onClick={() => setEmailOnlyVisible(true)}>
                Email All
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => setCurrentView('addEmployee')} 
              >
                Add Payroll
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
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
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
              },
              {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                responsive: ['sm'],
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
                responsive: ['md'],
              },
              {
                title: 'Last Pay Period',
                dataIndex: 'pay_period',
                key: 'pay_period',
                render: (date) => date ? dayjs(date).format('MMM YYYY') : 'N/A',
                responsive: ['lg'],
              },
              {
                title: 'Last Net Pay',
                dataIndex: 'net_pay',
                key: 'net_pay',
                render: (amount) => (
                  <span style={{ fontWeight: '600', color: '#059669' }}>
                    ₹{amount?.toLocaleString() || 0}
                  </span>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                align: 'right',
                render: (_, record) => (
                  <Space>
                    <Button 
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        const latestPayroll = employees
                          .filter(emp => emp.user_id === record.id)
                          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                        
                        const formValues = {
                          userId: record.id,
                          employeeName: record.name,
                          employeeId: record.employee_id,
                          emailAddress: record.email,
                          payPeriod: dayjs(),
                          payDate: dayjs(),
                        };
                        
                        if (latestPayroll) {
                          formValues.companyName = latestPayroll.company_name;
                          formValues.companyAddress = latestPayroll.company_address;
                          formValues.city = latestPayroll.city;
                          formValues.country = latestPayroll.country;
                          formValues.paidDays = latestPayroll.paid_days;
                          formValues.lopDays = latestPayroll.lop_days;
                          formValues.basic = latestPayroll.basic;
                          formValues.hra = latestPayroll.hra;
                          formValues.incomeTax = latestPayroll.income_tax;
                          formValues.pf = latestPayroll.pf;
                        }
                        
                        form.setFieldsValue(formValues);
                        setCurrentView('addEmployee');
                      }}
                      type="primary"
                    >
                      Run Payroll
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
                      >
                        Payslip
                      </Button>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );

  if (!users) {
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
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div style={{ padding: '30px 50px', background: '#f5f5f5', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#262626', marginBottom: '8px' }}>
            Create New Payroll
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

            <Title level={4} style={{ marginBottom: '24px', color: '#2d5a4a' }}>Additional Employee Details</Title>

<Row gutter={24}>
  <Col span={8}>
    <Form.Item label="Gender" name="gender">
      <Select size="large" placeholder="Select gender">
        <Option value="Male">Male</Option>
        <Option value="Female">Female</Option>
        <Option value="Other">Other</Option>
      </Select>
    </Form.Item>
  </Col>
  <Col span={8}>
    <Form.Item label="Designation" name="designation">
      <Input size="large" placeholder="Employee designation" />
    </Form.Item>
  </Col>
  <Col span={8}>
    <Form.Item label="Transaction ID" name="transactionId">
      <Input size="large" placeholder="Transaction ID" />
    </Form.Item>
  </Col>
</Row>

<Row gutter={24}>
  <Col span={8}>
    <Form.Item label="PAN Number" name="panNumber">
      <Input size="large" placeholder="PAN Number" />
    </Form.Item>
  </Col>
  <Col span={8}>
    <Form.Item label="Employee Bank" name="employeeBank">
      <Input size="large" placeholder="Bank name" />
    </Form.Item>
  </Col>
  <Col span={8}>
    <Form.Item label="Bank Account" name="bankAccount">
      <Input size="large" placeholder="Account number" />
    </Form.Item>
  </Col>
</Row>

<Row gutter={24}>
  <Col span={8}>
    <Form.Item label="UAN Number" name="uanNumber">
      <Input size="large" placeholder="UAN Number" />
    </Form.Item>
  </Col>
  <Col span={8}>
    <Form.Item label="ESI Number" name="esiNumber">
      <Input size="large" placeholder="ESI Number" />
    </Form.Item>
  </Col>
</Row>

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
                      fontSize: '16px'
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
      <Layout style={{ minHeight: '100vh', background: '#f7fafc' }}>
        <Content>
          {currentView === 'dashboard' ? renderDashboard() : renderAddEmployee()}
        </Content>
        
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