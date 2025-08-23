import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Button, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col,
  message,
  Table,
  Divider,
  Spin,
  Modal,
  InputNumber,
  Avatar
} from 'antd';
import { 
  PlusOutlined, 
  FilePdfOutlined, 
  MailOutlined, 
  UserOutlined,
  ArrowLeftOutlined,
  DashboardOutlined, 
  TeamOutlined, 
  DownloadOutlined,
  SendOutlined,
  EditOutlined,
  StarOutlined,
  TrophyOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../supabase/config';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import myaccessRBG from '../../assets/myaccessRBG.png'
const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AppraisalLetterManagement = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalAppraisals: 0,
    thisYear: 0
  });

  // Default letter template
  const defaultLetterContent = `Dear [EMPLOYEE_NAME],

Congratulations

Subject: Recognition and Appraisal

It gives us immense pleasure to acknowledge and appreciate your exceptional contributions as a [Department] at MYACCESS PRIVATE LIMITED since [month_day_year]. Over the last three months, your consistent dedication, remarkable work ethic, and ability to deliver creative and efficient solutions have truly set you apart.


Your hard work has not only ensured the success of various projects but also inspired your colleagues and elevated the standards of our development processes. The commitment you show in understanding project requirements, your attention to detail, and your ability to deliver user-friendly and aesthetically appealing designs are commendable.

As a token of our gratitude and recognition of your outstanding performance, we are delighted to offer you an appraisal of INR  [SALARY_INCREASE] per month, effective from [EFFECTIVE_DATE]. With this increment, your revised annual salary will now be INR [NEW_SALARY]. This reflects our appreciation for your contributions and our confidence in your potential to achieve even greatermilestonesin the future.


Thank you for your hard work and dedication. We look forward to your continued excellence and innovation as a vital member of MYACCESS PRIVATE LIMITED.


Warm regards,

Surya Tamarapalli
Founder
MYACCESS PRIVATE LIMITED
Email ID: surya@myaccessio.com`;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee')
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppraisals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appraisals')
        .select(`
          *,
          users (
            name,
            employee_id,
            email,
            role,
            pay,
            department
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAppraisals(data || []);
    } catch (error) {
      message.error('Error fetching appraisals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const currentYear = dayjs().year();
      
      // Count total appraisals this year
      const { data: thisYearData, error: yearError } = await supabase
        .from('appraisals')
        .select('id')
        .gte('effective_date', `${currentYear}-01-01`)
        .lt('effective_date', `${currentYear + 1}-01-01`);
      
      if (yearError) throw yearError;

      // Count total appraisals
      const { data: totalData, error: totalError } = await supabase
        .from('appraisals')
        .select('id');
      
      if (totalError) throw totalError;

      setStats({
        totalEmployees: users.length,
        totalAppraisals: totalData?.length || 0,
        thisYear: thisYearData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadUsers();
      await fetchAppraisals();
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchStats();
    }
  }, [users, appraisals]);

  const handleEmployeeSelect = async (userId) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      // Get latest appraisal for this employee
      const { data: latestAppraisal } = await supabase
        .from('appraisals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const formValues = {
        employeeName: selectedUser.name,
        employeeId: selectedUser.employee_id,
        emailAddress: selectedUser.email,
        department: selectedUser.department,
        currentSalary: selectedUser.pay || 0,
        newSalary: latestAppraisal?.new_salary || (selectedUser.pay || 0),
        effectiveDate: dayjs(),
        reviewPeriod: `${dayjs().subtract(1, 'year').format('MMM YYYY')} - ${dayjs().format('MMM YYYY')}`,
        companyName: 'MYACCESS PRIVATE LIMITED',
        managerName: 'HR Manager',
        managerDesignation: 'Human Resources',
        letterContent: defaultLetterContent
      };
      
      form.setFieldsValue(formValues);
    }
  };

  const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
  
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
};

  const generateAppraisalPDF = async (appraisalData, returnBlob = false) => {
    try {
      // Calculate salary increase
      const annualSalary = appraisalData.new_salary * 12;
      const salaryIncrease = appraisalData.new_salary - appraisalData.current_salary;
      const increasePercentage = appraisalData.current_salary > 0 ? 
        ((salaryIncrease / appraisalData.current_salary) * 100).toFixed(2) : 0;

      // Replace placeholders in letter content
      let processedContent = appraisalData.letter_content
      
        .replace(/\[EMPLOYEE_NAME\]/g, appraisalData.employee_name)
        .replace(/\[Department\]/g, appraisalData.department || 'N/A')
        .replace(/\[REVIEW_PERIOD\]/g, appraisalData.review_period)
        .replace(/\[PREVIOUS_SALARY\]/g, appraisalData.current_salary?.toLocaleString('en-IN'))
        .replace(/\[NEW_SALARY\]/g, `INR ${annualSalary?.toLocaleString('en-IN')} (${numberToWords(annualSalary)})`)
        .replace(/\[SALARY_INCREASE\]/g, salaryIncrease?.toLocaleString('en-IN'))
        .replace(/\[INCREASE_PERCENTAGE\]/g, increasePercentage)
        .replace(/\[EFFECTIVE_DATE\]/g, dayjs(appraisalData.effective_date).format('DD MMMM YYYY'))
        .replace(/\[MANAGER_NAME\]/g, appraisalData.manager_name)
        .replace(/\[MANAGER_DESIGNATION\]/g, appraisalData.manager_designation)
        .replace(/\[COMPANY_NAME\]/g, appraisalData.company_name);

      // Convert line breaks to HTML
      processedContent = processedContent.replace(/\n/g, '<br>');

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appraisal Letter</title>
</head>
<body style="font-family: 'Times New Roman', serif; background-color: #ffffff; margin: 0; padding: 0; line-height: 1.6;">
    
    <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 20px 60px; border: 1px solid #e0e0e0;">
        
        <!-- Header -->
<div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
            <!-- Left side - Logo and Company Name -->
            <div style="display: flex; align-items: center;">
                <!-- Replace this with your actual SVG logo -->
                <div style="margin-right: 15px;">
                    <svg width="120" height="40" viewBox="0 0 120 40" style="display: block;">
                        <!-- Placeholder for your SVG logo - replace this entire SVG with your actual logo -->
                        <rect width="120" height="40" fill="#2c5aa0" rx="4"/>
                        <text x="60" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">MYACCESS</text>
                        <circle cx="105" cy="20" r="4" fill="#00ff00"/>
                    </svg>
                </div>
            </div>
            
            <!-- Right side - Contact Info -->
            <div style="text-align: right; font-size: 14px; color: #333; line-height: 1.4;">
                <div style="font-weight: bold; margin-bottom: 2px;">${appraisalData.employee_name}</div>
                <div style="margin-bottom: 2px;">${appraisalData.email_address}</div>
                <div>${dayjs(appraisalData.effective_date).format('DD MMMM YYYY')}</div>
            </div>
        </div>

        <!-- Date and Reference -->
<div style="margin-bottom: -100px;">
    <div style="text-align: right; margin-bottom: 0px;">
        <strong>Date: ${dayjs().format('DD MMMM YYYY')}</strong>
    </div>
    <div style="margin-bottom: 0px;">
        <strong>To:</strong><br>
        ${appraisalData.employee_name}<br>
        Employee ID: ${appraisalData.employee_id}<br>
        Department: ${appraisalData.department || 'N/A'}<br>
        ${appraisalData.email_address}
    </div>
</div>

        <!-- Letter Content -->
        <div style="margin-bottom: 0px; font-size: 14px; text-align: justify; color: #333;">
            ${processedContent}
        </div>

        <!-- Signature Section -->
        <div style="margin-top: 60px;">
            <div style="display: flex; justify-content: space-between;">
                <div style="width: 45%;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 10px; height: 50px;"></div>
                    <p style="margin: 0; text-align: center; font-size: 12px; color: #666;">
                        <strong>Candidate Signature</strong><br>
                        Appraisal letter for ${appraisalData.employee_name}
                        MyAccess Confidential
                    </p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; font-size: 12px; color: #999; font-style: italic;">
                This is a system-generated document. For any queries, please contact HR department.
            </p>
        </div>
        
    </div>

</body>
</html>
      `;

      // Generate PDF blob
      const pdfBlob = await new Promise((resolve) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  let yPosition = margin;

  // Add company logo/header
  pdf.addImage(myaccessRBG, 'PNG', margin, yPosition - 5, 80, 15);    
  // Add employee info on right
  pdf.setFont('helvetica', 'normal');
pdf.setTextColor(0, 0, 0);
pdf.setFontSize(10);
pdf.text(appraisalData.employee_name, pageWidth - margin, yPosition, { align: 'right' });
yPosition += 5;
pdf.text(appraisalData.email_address, pageWidth - margin, yPosition, { align: 'right' });
yPosition += 5;
pdf.text(dayjs(appraisalData.effective_date).format('DD MMMM YYYY'), pageWidth - margin, yPosition, { align: 'right' });

yPosition += 20;
  
  // Add line separator
  pdf.setDrawColor(224, 224, 224);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Add letter content with proper formatting
  pdf.setFontSize(10); // Reduced from 11 to 10
pdf.setFont('helvetica', 'normal');

// Increase left margin for content
const contentMargin = margin + 4; // Add 10mm more left margin

// Process content and add with page breaks
const contentText = processedContent.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
const lines = pdf.splitTextToSize(contentText, pageWidth - contentMargin - margin); // Adjust width for new margin

lines.forEach(line => {
  if (yPosition > pageHeight - 30) {
    pdf.addPage();
    yPosition = margin;
  }
  pdf.text(line, contentMargin, yPosition); // Use contentMargin instead of margin
  yPosition += 6;
});

  // Add signature section
  yPosition += 20;
  if (yPosition > pageHeight - 50) {
    pdf.addPage();
    yPosition = margin;
  }
  
  pdf.line(margin, yPosition, margin + 60, yPosition);
  yPosition += 10;
  pdf.setFontSize(9);
  pdf.text('Candidate Signature', margin, yPosition);
  yPosition += 5;
  pdf.text(`Appraisal letter for ${appraisalData.employee_name}`, margin, yPosition);
  yPosition += 5;
  pdf.text('MyAccess Confidential', margin, yPosition);
  
  // Add footer
  yPosition = pageHeight - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(153, 153, 153);
  const footerText = 'This is a system-generated document. For any queries, please contact HR department.';
  pdf.text(footerText, pageWidth / 2, yPosition, { align: 'center' });

  const blob = pdf.output('blob');
  resolve(blob);
});

      if (returnBlob) {
        return pdfBlob;
      } else {
        // Download PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appraisal_letter_${appraisalData.employee_name}_${dayjs(appraisalData.effective_date).format('YYYY-MM')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return pdfBlob;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Error generating PDF: ' + error.message);
      return null;
    }
  };

  const sendAppraisalEmail = async (appraisalData, pdfBlob) => {
  try {
    // Calculate salary increase for template data
    const salaryIncrease = appraisalData.new_salary - appraisalData.current_salary;
    const increasePercentage = appraisalData.current_salary > 0 ? 
      ((salaryIncrease / appraisalData.current_salary) * 100).toFixed(2) : 0;

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Add required fields
    formData.append('recipientEmail', appraisalData.email_address);
    formData.append('subject', `🎉 Performance Appraisal Letter - ${dayjs(appraisalData.effective_date).format('MMMM YYYY')}`);
    
    // Add template data as JSON string
    const templateData = {
      employee_name: appraisalData.employee_name,
      company_name: appraisalData.company_name,
      effective_date: dayjs(appraisalData.effective_date).format('MMMM YYYY'),
      review_period: appraisalData.review_period,
      salary_increase: salaryIncrease.toLocaleString('en-IN'),
      performance_rating: 'Exceeds Expectations',
      manager_message: `${appraisalData.employee_name} has consistently delivered exceptional results and shown great dedication throughout the review period.`,
      hr_contact: 'hr@myaccessio.com'
    };
    
    formData.append('templateData', JSON.stringify(templateData));
    
    // Add the PDF file
    formData.append('appraisal', pdfBlob, `appraisal_letter_${appraisalData.employee_name.replace(/\s+/g, '_')}_${dayjs(appraisalData.effective_date).format('YYYY-MM')}.pdf`);
    
    console.log('Sending appraisal email to:', appraisalData.email_address);
    
    const response = await fetch(`${baseUrl}send-appraisal`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }
    
    const result = await response.json();
    message.success(`Appraisal letter sent successfully to ${appraisalData.email_address}!`);
    return result;
  } catch (error) {
    console.error('Error sending appraisal email:', error);
    message.error('Error sending email: ' + error.message);
    throw error;
  }
};

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      const effectiveDateFormatted = values.effectiveDate.format('YYYY-MM-DD');

      // Check if record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('appraisals')
        .select('id')
        .eq('user_id', values.userId)
        .eq('effective_date', effectiveDateFormatted)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const appraisalData = {
        company_name: values.companyName,
        employee_name: values.employeeName,
        employee_id: values.employeeId,
        email_address: values.emailAddress,
        department: values.department,
        current_salary: values.currentSalary,
        new_salary: values.newSalary,
        effective_date: effectiveDateFormatted,
        review_period: values.reviewPeriod,
        manager_name: values.managerName,
        manager_designation: values.managerDesignation,
        letter_content: values.letterContent,
        user_id: values.userId
      };

      let data, error;

      if (existingRecord) {
        // Update existing record
        const { data: updateData, error: updateError } = await supabase
          .from('appraisals')
          .update(appraisalData)
          .eq('id', existingRecord.id)
          .select();

        data = updateData;
        error = updateError;
        
        if (!error) {
          message.success('Appraisal data updated successfully!');
        }
      } else {
        // Insert new record
        const { data: insertData, error: insertError } = await supabase
          .from('appraisals')
          .insert([appraisalData])
          .select();

        data = insertData;
        error = insertError;
        
        if (!error) {
          message.success('Appraisal data saved successfully!');
        }
      }

      if (error) throw error;

      setCurrentView('dashboard');
      form.resetFields();
      fetchAppraisals();
      fetchStats();
    } catch (error) {
      console.error('Error:', error);
      message.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const values = await form.validateFields();
      const appraisalData = {
        company_name: values.companyName,
        employee_name: values.employeeName,
        employee_id: values.employeeId,
        email_address: values.emailAddress,
        department: values.department,
        current_salary: values.currentSalary,
        new_salary: values.newSalary,
        effective_date: values.effectiveDate.format('YYYY-MM-DD'),
        review_period: values.reviewPeriod,
        manager_name: values.managerName,
        manager_designation: values.managerDesignation,
        letter_content: values.letterContent
      };
      
      await generateAppraisalPDF(appraisalData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Please fill all required fields');
    }
  };

  const handleSendEmail = async () => {
    try {
      const values = await form.validateFields();
      const appraisalData = {
        company_name: values.companyName,
        employee_name: values.employeeName,
        employee_id: values.employeeId,
        email_address: values.emailAddress,
        department: values.department,
        current_salary: values.currentSalary,
        new_salary: values.newSalary,
        effective_date: values.effectiveDate.format('YYYY-MM-DD'),
        review_period: values.reviewPeriod,
        manager_name: values.managerName,
        manager_designation: values.managerDesignation,
        letter_content: values.letterContent
      };
      
      const pdfBlob = await generateAppraisalPDF(appraisalData, true);
      if (pdfBlob) {
        await sendAppraisalEmail(appraisalData, pdfBlob);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('Please fill all required fields');
    }
  };

  const getMergedAppraisalData = () => {
    return users.map(user => {
      const latestAppraisal = appraisals
        .filter(app => app.user_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      
      return {
        ...user,
        latest_appraisal: latestAppraisal,
        has_appraisal: !!latestAppraisal,
        last_appraisal_date: latestAppraisal?.effective_date || null,
        salary_increase: latestAppraisal ? 
          latestAppraisal.new_salary - latestAppraisal.current_salary : 0
      };
    });
  };

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
              Appraisal Letter Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Manage employee appraisal letters efficiently.
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
                background: '#f6ffed', 
                color: '#52c41a',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '24px'
              }}>
                <TrophyOutlined />
              </div>
              <div>
                <Text type="secondary">This Year Appraisals</Text>
                <Title level={3} style={{ margin: 0 }}>{stats.thisYear}</Title>
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
                <FileTextOutlined />
              </div>
              <div>
                <Text type="secondary">Total Appraisals</Text>
                <Title level={3} style={{ margin: 0 }}>{stats.totalAppraisals}</Title>
              </div>
            </Space>
          </div>
        </Col>
      </Row>

      {/* Main Content */}
      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Employee Appraisal Records</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setCurrentView('createAppraisal')} 
          >
            Create Appraisal Letter
          </Button>
        </div>
        
        <Table
          dataSource={getMergedAppraisalData()}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
       pagination={{
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  loading:{loading},
  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
  itemRender: (current, type, originalElement) => {
    if (type === 'page') {
      return (
        <a style={{ 
          color: '#000000d9', 
          backgroundColor: 'white',
          border: '1px solid #d9d9d9'
        }}>
          {current}
        </a>
      );
    }
    return originalElement;
  }
}}
          columns={[
            {
              title: 'Employee',
              key: 'employee',
              render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    style={{ backgroundColor: '#10b981', marginRight: '12px' }} 
                    icon={<UserOutlined />}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{record.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {record.employee_id}</div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Department',
              dataIndex: 'department',
              key: 'department',
              render: (department) => department || 'N/A',
              responsive: ['md'],
            },
            {
              title: 'Current Salary',
              dataIndex: 'pay',
              key: 'pay',
              render: (amount) => (
                <span style={{ fontWeight: '600', color: '#059669' }}>
                  ₹{amount?.toLocaleString('en-IN') || 'N/A'}
                </span>
              ),
              responsive: ['sm'],
            },
            {
              title: 'Last Appraisal',
              dataIndex: 'last_appraisal_date',
              key: 'last_appraisal_date',
              render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : 'No appraisal',
              responsive: ['lg'],
            },
            {
              title: 'Status',
              key: 'status',
              render: (_, record) => {
                const lastAppraisal = record.latest_appraisal;
                if (!lastAppraisal) {
                  return (
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      background: '#fff3cd',
                      color: '#856404',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Pending
                    </span>
                  );
                }
                
                const isRecent = dayjs().diff(dayjs(lastAppraisal.effective_date), 'months') < 12;
                return (
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    background: isRecent ? '#d1ecf1' : '#f8d7da',
                    color: isRecent ? '#0c5460' : '#721c24',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {isRecent ? 'Recent' : 'Due'}
                  </span>
                );
              },
            },
            {
              title: 'Actions',
              key: 'actions',
              align: 'right',
              render: (_, record) => (
                <Space>
                  <Button 
                    size="small"
                    icon={<StarOutlined />}
                    onClick={() => {
                      const formValues = {
                        userId: record.id,
                        employeeName: record.name,
                        employeeId: record.employee_id,
                        emailAddress: record.email,
                        department: record.department,
                        currentSalary: record.pay || 0,
                        newSalary: record.latest_appraisal?.new_salary || (record.pay || 0),
                        effectiveDate: dayjs(),
                        reviewPeriod: `${dayjs().subtract(1, 'year').format('MMM YYYY')} - ${dayjs().format('MMM YYYY')}`,
                        companyName: record.latest_appraisal?.company_name || 'MYACCESS PRIVATE LIMITED',
                        managerName: record.latest_appraisal?.manager_name || 'HR Manager',
                        managerDesignation: record.latest_appraisal?.manager_designation || 'Human Resources',
                        letterContent: record.latest_appraisal?.letter_content || defaultLetterContent
                      };
                      
                      form.setFieldsValue(formValues);
                      setCurrentView('createAppraisal');
                    }}
                    type="primary"
                  >
                    Create Appraisal
                  </Button>
                  {record.has_appraisal && (
                    <>
                      <Button 
                        size="small"
                        icon={<FilePdfOutlined />}
                        onClick={() => {
                          if (record.latest_appraisal) {
                            generateAppraisalPDF(record.latest_appraisal);
                          }
                        }}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small"
                        icon={<SendOutlined />}
                        onClick={async () => {
                          if (record.latest_appraisal) {
                            const pdfBlob = await generateAppraisalPDF(record.latest_appraisal, true);
                            if (pdfBlob) {
                              await sendAppraisalEmail(record.latest_appraisal, pdfBlob);
                            }
                          }
                        }}
                      >
                        Send
                      </Button>
                    </>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );

  const renderCreateAppraisal = () => (
    <>
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
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
            Create Appraisal Letter
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: '16px' }}>
            Generate professional appraisal letters for your employees.
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
              effectiveDate: dayjs(),
              reviewPeriod: `${dayjs().subtract(1, 'year').format('MMM YYYY')} - ${dayjs().format('MMM YYYY')}`,
              companyName: 'MYACCESS PRIVATE LIMITED',
              managerName: 'HR Manager',
              managerDesignation: 'Human Resources',
              letterContent: defaultLetterContent
            }}
          >
            <Title level={4} style={{ marginBottom: '24px', color: '#10b981' }}>Company Details</Title>

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

            <Divider />

            <Title level={4} style={{ marginBottom: '24px', color: '#10b981' }}>Employee Selection</Title>

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
                    onChange={handleEmployeeSelect}
                  >
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.name} ({user.employee_id}) - {user.department || 'No Dept'}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
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
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Email Address"
                  name="emailAddress"
                  rules={[{ required: true, message: 'Email is required' }]}
                >
                  <Input size="large" placeholder="Email Address" disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Department"
                  name="department"
                >
                  <Input size="large" placeholder="Department" disabled />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={4} style={{ marginBottom: '24px', color: '#10b981' }}>Appraisal Details</Title>

            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  label="Review Period"
                  name="reviewPeriod"
                  rules={[{ required: true, message: 'Please enter review period' }]}
                >
                  <Input size="large" placeholder="Jan 2024 - Dec 2024" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Effective Date"
                  name="effectiveDate"
                  rules={[{ required: true, message: 'Please select effective date' }]}
                >
                  <DatePicker 
                    size="large" 
                    style={{ width: '100%' }}
                    placeholder="Select effective date"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Current Salary"
                  name="currentSalary"
                  rules={[{ required: true, message: 'Please enter current salary' }]}
                >
                  <InputNumber 
                    size="large" 
                    style={{ width: '100%' }} 
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    min={0}
                    placeholder="Current Salary"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="New Salary"
                  name="newSalary"
                  rules={[{ required: true, message: 'Please enter new salary' }]}
                >
                  <InputNumber 
                    size="large" 
                    style={{ width: '100%' }} 
                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    min={0}
                    placeholder="New Salary"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginTop: '30px' }}>
                  <Text strong>Salary Increase: </Text>
                  <Text style={{ fontSize: '16px', color: '#059669', fontWeight: 'bold' }}>
                    ₹{form.getFieldsValue().newSalary && form.getFieldsValue().currentSalary ? 
                      (form.getFieldsValue().newSalary - form.getFieldsValue().currentSalary).toLocaleString('en-IN') : 
                      '0'
                    }
                    {form.getFieldsValue().newSalary && form.getFieldsValue().currentSalary && form.getFieldsValue().currentSalary > 0 ? 
                      ` (${(((form.getFieldsValue().newSalary - form.getFieldsValue().currentSalary) / form.getFieldsValue().currentSalary) * 100).toFixed(2)}%)` : 
                      ''
                    }
                  </Text>
                </div>
              </Col>
            </Row>

            <Divider />

            <Title level={4} style={{ marginBottom: '24px', color: '#10b981' }}>Manager Details</Title>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Manager Name"
                  name="managerName"
                  rules={[{ required: true, message: 'Please enter manager name' }]}
                >
                  <Input size="large" placeholder="Manager Name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Manager Designation"
                  name="managerDesignation"
                  rules={[{ required: true, message: 'Please enter manager designation' }]}
                >
                  <Input size="large" placeholder="Manager Designation" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Title level={4} style={{ marginBottom: '24px', color: '#10b981' }}>Letter Content</Title>

            <Form.Item
              label="Appraisal Letter Content"
              name="letterContent"
              rules={[{ required: true, message: 'Please enter letter content' }]}
              extra="Use placeholders: [EMPLOYEE_NAME], [REVIEW_PERIOD], [PREVIOUS_SALARY], [NEW_SALARY], [SALARY_INCREASE], [INCREASE_PERCENTAGE], [EFFECTIVE_DATE], [MANAGER_NAME], [MANAGER_DESIGNATION], [COMPANY_NAME]"
            >
              <TextArea 
                rows={12} 
                placeholder="Enter letter content with placeholders"
                style={{ fontSize: '14px', lineHeight: '1.6' }}
              />
            </Form.Item>

            <Form.Item>
              <Space size="large" style={{ width: '100%', justifyContent: 'center', marginTop: '40px' }}>
                <Button 
                  size="large"
                  loading={loading}
                  onClick={handleGeneratePDF}
                  icon={<FilePdfOutlined />}
                  style={{ 
                    width: '160px',
                    height: '45px',
                    fontSize: '16px'
                  }}
                >
                  Generate PDF
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  loading={loading}
                  onClick={handleSendEmail}
                  icon={<SendOutlined />}
                  style={{ 
                    background: '#10b981', 
                    borderColor: '#10b981',
                    width: '160px',
                    height: '45px',
                    fontSize: '16px'
                  }}
                >
                  Send Email
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  style={{ 
                    background: '#059669', 
                    borderColor: '#059669',
                    width: '120px',
                    height: '45px',
                    fontSize: '16px'
                  }}
                >
                  Save
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

  if (!users) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading employees...</div>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <Content>
        {currentView === 'dashboard' ? renderDashboard() : renderCreateAppraisal()}
      </Content>
    </Layout>
  );
};

export default AppraisalLetterManagement;