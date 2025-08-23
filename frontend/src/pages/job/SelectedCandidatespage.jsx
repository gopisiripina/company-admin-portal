import React, { useState, useEffect } from 'react';
import {
  Table, Card, Select, Input, DatePicker, Button, Tag, Form, 
  Space, Modal, Avatar, Badge, Row, Col, Typography, Divider, 
  message, Drawer, Timeline, Tooltip, InputNumber, Descriptions,
  Alert, Steps, Progress, Statistic
} from 'antd';
import jsPDF from 'jspdf';
import {
  SearchOutlined, EyeOutlined, DownloadOutlined, MailOutlined, 
  UserOutlined, FileTextOutlined, TrophyOutlined, CloseCircleOutlined,
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  SendOutlined, PhoneOutlined, EnvironmentOutlined, DollarOutlined,
  HistoryOutlined, ReloadOutlined, StarOutlined, TeamOutlined,
  BankOutlined, IdcardOutlined, HomeOutlined, ContactsOutlined,
  UpOutlined, DownOutlined
} from '@ant-design/icons';
import suryaSignature from '../../assets/surya.png'; // Add this line for the founder's signature
import naveenSignature from '../../assets/naveen.png'; 
import ErrorPage from '../../error/ErrorPage';
import logoImage from '../../assets/logo.png'; // Ensure you have a logo image in assets
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const baseUrl = import.meta.env.VITE_API_BASE_URL;
// Supabase configuration
import { supabase} from '../../supabase/config';

const SelectedCandidatesPage = ({ userRole }) => {
  if (userRole !== 'superadmin' && userRole !== 'admin' && userRole!=='hr') {
    return <ErrorPage errorType="403" />;
  }
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [jobTitles, setJobTitles] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  // Add this new state after your existing modal states
const [offerTypeModalVisible, setOfferTypeModalVisible] = useState(false);
const [selectedOfferType, setSelectedOfferType] = useState(null);

  // Modal states
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

const [screenSize, setScreenSize] = useState({
  isMobile: window.innerWidth < 576,
  isTablet: window.innerWidth >= 576 && window.innerWidth < 992,
  isDesktop: window.innerWidth >= 992,
  isLargeDesktop: window.innerWidth >= 1200
});

useEffect(() => {
  const handleResize = () => {
    setScreenSize({
      isMobile: window.innerWidth < 576,
      isTablet: window.innerWidth >= 576 && window.innerWidth < 992,
      isDesktop: window.innerWidth >= 992,
      isLargeDesktop: window.innerWidth >= 1200
    });
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);


const fetchSelectedCandidates = async () => {
  setLoading(true);
  try {
    // Fetch selected candidates from job_applications
    const { data: selectedData, error: selectedError } = await supabase
      .from('job_applications')
      .select(`
        *,
        interview_type,
        interview_date,
        interview_time,
        interview_link,
        interview_platform,
        mail_sent_date,
        interview_status,
        technical_rating,
        communication_rating,
        interview_feedback,
        interviewer_name,
        mail_history
      `)
      .eq('status', 'selected')
      .order('applied_at', { ascending: false });

    // Fetch manual offers
    const { data: manualData, error: manualError } = await supabase
      .from('manual_offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedError) {
      console.error('Error fetching selected candidates:', selectedError);
      message.error('Failed to load selected candidates');
      return;
    }

    if (manualError) {
      console.error('Error fetching manual offers:', manualError);
      message.error('Failed to load manual offers');
      return;
    }

    // Transform selected candidates data
    const transformedSelected = selectedData.map(candidate => ({
      id: candidate.id,
      name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone,
      jobTitle: candidate.job_title,
      department: candidate.current_company || 'Not specified',
      selectedDate: candidate.applied_at,
      experience: candidate.experience_years,
      skills: candidate.skills ? candidate.skills.split(',') : [],
      status: candidate.status,
      resumeUrl: candidate.resume_url,
      location: candidate.location,
      expectedSalary: candidate.expected_salary,
      currentPosition: candidate.current_position,
      education: candidate.education,
      linkedinUrl: candidate.linkedin_url,
      portfolioUrl: candidate.portfolio_url,
      technicalRating: candidate.technical_rating,
      communicationRating: candidate.communication_rating,
      interviewFeedback: candidate.interview_feedback,
      interviewerName: candidate.interviewer_name,
      interviewDate: candidate.interview_date,
      interviewTime: candidate.interview_time,
      mailHistory: candidate.mail_history || [],
      offerSent: candidate.mail_history ? candidate.mail_history.some(mail => mail.type === 'offer') : false,
      offerSentDate: candidate.mail_history ? 
        candidate.mail_history.find(mail => mail.type === 'offer')?.sentDate : null,
      isManual: false // Flag to identify source
    }));

    // Transform manual offers data
    const transformedManual = manualData.map(manual => ({
      id: `manual_${manual.id}`, // Prefix to avoid ID conflicts
      name: manual.candidate_name,
      email: manual.candidate_email,
      phone: manual.candidate_phone,
      jobTitle: manual.job_title,
      department: manual.company_name,
      selectedDate: manual.created_at,
      experience: 'N/A',
      skills: [],
      status: 'manual_offer',
      resumeUrl: null,
      location: manual.work_location,
      expectedSalary: manual.salary_amount,
      currentPosition: 'External Candidate',
      education: 'N/A',
      linkedinUrl: null,
      portfolioUrl: null,
      technicalRating: null,
      communicationRating: null,
      interviewFeedback: null,
      interviewerName: null,
      interviewDate: null,
      interviewTime: null,
      mailHistory: [{
        type: 'offer',
        sentDate: manual.sent_date,
        offerDetails: {
          jobTitle: manual.job_title,
          companyName: manual.company_name,
          salaryAmount: manual.salary_amount,
          joiningDate: manual.joining_date,
          workLocation: manual.work_location,
          reportingManager: manual.reporting_manager,
          additionalBenefits: manual.additional_benefits,
          offerValidUntil: manual.offer_valid_until,
          candidatePhone: manual.candidate_phone,
          candidateAddress: manual.candidate_address,
          hrContact: manual.hr_contact,
          message: manual.message
        },
        emailStatus: manual.email_status
      }],
      offerSent: true, // Manual offers are always sent
      offerSentDate: manual.sent_date,
      isManual: true // Flag to identify source
    }));

    // Combine both datasets
    const allCandidates = [...transformedSelected, ...transformedManual];
    setCandidates(allCandidates);
    
    // Extract unique job titles from both sources
    const uniqueTitles = [...new Set(allCandidates.map(item => item.jobTitle))];
    setJobTitles(uniqueTitles);

  } catch (error) {
    console.error('Error loading candidates:', error);
    message.error('Failed to load candidates');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchSelectedCandidates();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...candidates];

    if (searchText) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (jobTitleFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.jobTitle === jobTitleFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'offer_sent') {
        filtered = filtered.filter(candidate => candidate.offerSent);
      } else if (statusFilter === 'offer_pending') {
        filtered = filtered.filter(candidate => !candidate.offerSent);
      }
    }

    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(candidate => {
        const candidateDate = new Date(candidate.selectedDate);
        return candidateDate >= start && candidateDate <= end;
      });
    }

    setFilteredCandidates(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, jobTitleFilter, statusFilter, dateRange, candidates]);

const sendOfferLetter = async (offerData) => {
  setLoading(true);
  try {
    // For manual offers, create a temporary candidate object
    const candidateData = selectedCandidate || {
      id: null,
      name: offerData.candidateName,
      email: offerData.candidateEmail,
      phone: offerData.candidatePhone,
      jobTitle: offerData.jobTitle
    };

    console.log('Sending email with data:', offerData);
    console.log('Candidate data:', candidateData);
    
    // Format the joining date properly
    const formattedJoiningDate = offerData.joiningDate 
      ? (typeof offerData.joiningDate === 'string' 
          ? offerData.joiningDate 
          : new Date(offerData.joiningDate).toLocaleDateString())
      : '';
    
    // Generate PDF with updated data including new fields
   const pdfBlob = generateOfferLetterPDF(candidateData, {
      ...offerData,
      joiningDate: formattedJoiningDate
    });
    
  // Convert blob to base64 for email attachment
const base64PDF = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const result = reader.result;
      const base64Data = result.split(',')[1];
      if (!base64Data) {
        throw new Error('Failed to extract base64 data');
      }
      resolve(base64Data);
    } catch (error) {
      reject(error);
    }
  };
  reader.onerror = () => reject(new Error('FileReader failed'));
  reader.readAsDataURL(pdfBlob);
});
    
    // Prepare email template parameters - UPDATED to include all fields
    const emailParams = {
      to_name: candidateData.name, // Changed from selectedCandidate.name
      to_email: candidateData.email, // Changed from selectedCandidate.email
      job_title: offerData.jobTitle,
      company_name: offerData.companyName,
      salary_amount: offerData.salaryAmount,
      joining_date: formattedJoiningDate,
      work_location: offerData.workLocation,
      reporting_manager: offerData.reportingManager,
      additional_benefits: offerData.additionalBenefits,
      hr_contact: offerData.hrContact,
      offer_valid_until: offerData.offerValidUntil,
      message: offerData.message || ''
    };

    console.log('Email params:', emailParams);


    const response = await fetch(`${baseUrl}send-job-offer`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    recipientEmail: candidateData.email,
    subject: `Job Offer - ${offerData.jobTitle} Position at ${offerData.companyName}`,
    templateData: {
      to_name: candidateData.name,
      job_title: offerData.jobTitle,
      company_name: offerData.companyName,
      salary_amount: offerData.salaryAmount,
      joining_date: formattedJoiningDate,
      work_location: offerData.workLocation,
      reporting_manager: offerData.reportingManager,
      additional_benefits: offerData.additionalBenefits,
      offer_valid_until: offerData.offerValidUntil,
      message: offerData.message || '',
      hr_contact: offerData.hrContact,
    },
    attachments: [{
      filename: `Offer_Letter_${candidateData.name.replace(/\s+/g, '_')}.pdf`,
      content: base64PDF,
      contentType: 'application/pdf',
    }],
  }),
});


    const response = await fetch('http://localhost:5000/api/send-job-offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderEmail: "suryavenkatareddy90@gmail.com",
        senderPassword: "vrxftrjsiekrxdnf",
        recipientEmail: candidateData.email,
        subject: `Job Offer - ${offerData.jobTitle} Position at ${offerData.companyName}`,
        smtpServer: "smtp.gmail.com",
        smtpPort: 587,
        templateData: {
          to_name: candidateData.name, // Changed from selectedCandidate.name
          job_title: offerData.jobTitle,
          company_name: offerData.companyName,
          salary_amount: offerData.salaryAmount,
          joining_date: formattedJoiningDate,
          work_location: offerData.workLocation,
          reporting_manager: offerData.reportingManager,
          additional_benefits: offerData.additionalBenefits,
          offer_valid_until: offerData.offerValidUntil,
          message: offerData.message || '',
          hr_contact: offerData.hrContact
        },
    attachments: [{
  filename: `Offer_Letter_${candidateData.name.replace(/\s+/g, '_')}.pdf`,
  content: base64PDF,
  contentType: 'application/pdf',
  encoding: 'base64'
}]
      })
    });


    const result = await response.json();
    console.log('Email result:', result);

  // Add this section inside sendOfferLetter function after successful email sending
if (response.ok && result.success) {
  // For selected candidates (existing logic)
  if (selectedCandidate && selectedCandidate.id && !selectedCandidate.isManual) {
    // ... existing database update logic for job_applications table
    
  } 
  // Replace the manual offer database insert section in sendOfferLetter function

// NEW: For manual offers, store in manual_offers table
else {
  try {
    // Format the joining date properly for PostgreSQL
    let formattedJoiningDateForDB = null;
    if (offerData.joiningDate) {
      // If it's a moment object from DatePicker, convert to JS Date first
      const dateObj = offerData.joiningDate._isAMomentObject ? 
        offerData.joiningDate.toDate() : 
        new Date(offerData.joiningDate);
      
      // Format as YYYY-MM-DD for PostgreSQL
      formattedJoiningDateForDB = dateObj.toISOString().split('T')[0];
    }

    // Format offer valid until date if it's a date
    let formattedValidUntilForDB = null;
    if (offerData.offerValidUntil && offerData.offerValidUntil !== '7 days from offer date') {
      try {
        const validUntilDate = new Date(offerData.offerValidUntil);
        if (!isNaN(validUntilDate.getTime())) {
          formattedValidUntilForDB = validUntilDate.toISOString().split('T')[0];
        } else {
          formattedValidUntilForDB = offerData.offerValidUntil; // Keep as text if not a valid date
        }
      } catch (e) {
        formattedValidUntilForDB = offerData.offerValidUntil; // Keep as text if parsing fails
      }
    } else {
      formattedValidUntilForDB = offerData.offerValidUntil; // Keep as text
    }

    const { error: insertError } = await supabase
      .from('manual_offers')
      .insert({
        candidate_name: candidateData.name,
        candidate_email: candidateData.email,
        candidate_phone: offerData.candidatePhone,
        candidate_address: offerData.candidateAddress,
        job_title: offerData.jobTitle,
        company_name: offerData.companyName,
        salary_amount: offerData.salaryAmount,
        joining_date: formattedJoiningDateForDB, // Use properly formatted date
        work_location: offerData.workLocation,
        reporting_manager: offerData.reportingManager,
        offer_valid_until: formattedValidUntilForDB, // Use properly formatted date or text
        hr_contact: offerData.hrContact,
        additional_benefits: offerData.additionalBenefits,
        message: offerData.message,
        email_status: 'sent',
        sent_date: new Date().toISOString() // Current timestamp in proper format
      });

    if (insertError) {
      console.error('Error saving manual offer:', insertError);
      message.warning('Email sent but failed to save record in database');
    } else {
      console.log('Manual offer saved successfully');
      // Refresh the candidates list to show the new manual offer
      fetchSelectedCandidates();
    }
  } catch (error) {
    console.error('Error saving manual offer:', error);
    message.warning('Email sent but failed to save record');
  }
}
  
  setOfferModalVisible(false);
  message.success(`Offer letter sent successfully to ${candidateData.name}!`);
} else {
      throw new Error('Email service returned error: ' + result.message);
    }
  } catch (error) {
    console.error('Error sending offer letter:', error);
    
    if (error.text) {
      message.error('Failed to send email: ' + error.text);
    } else if (error.message) {
      message.error('Failed to send offer letter: ' + error.message);
    } else {
      message.error('Failed to send offer letter. Please check your configuration.');
    }
  } finally {
    setLoading(false);
  }
};


const generateOfferLetterPDF = (candidateData, offerData) => {
  const doc = new jsPDF();

  // --- Professional Theme Configuration (Light Green Combination) ---
  const primaryColor = '#2d5016'; // Dark Forest Green
  const secondaryColor = '#7cb342'; // Light Green Accent
  const textColor = '#333333';
  const lightGrayColor = '#f8f9fa';
  const headerFooterColor = '#6a6a6a';
  const blackColor = '#000000'; // Added for bold black headings

  // --- Page Dimensions ---
  const leftMargin = 20;
  const rightMargin = 20;
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let yPosition = 20;
  let pageNumber = 1;

  // --- Add Poppins Font ---
  const primaryFont = 'helvetica'; // Use helvetica as fallback for Poppins
  
  // --- Helper Functions ---
  const addHeader = (companyName) => {
    try {
      doc.addImage(logoImage, 'PNG', leftMargin, 21, 48, 13);
    } catch (error) {
      doc.setFillColor(primaryColor);
      doc.roundedRect(leftMargin, 15, 35, 15, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(primaryFont, 'bold');
      doc.text('LOGO', leftMargin + 12, 24);
    }

    doc.setFontSize(19);
    doc.setFont(primaryFont, 'bold');
    doc.setTextColor(blackColor); // Changed to bold black
    doc.text(companyName || 'MyAccess Private Limited', leftMargin + 55, 30);
    
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(1.5);
    doc.line(leftMargin, 40, pageWidth - rightMargin, 40);

    yPosition = 55;
  };

  const addFooter = () => {
    doc.setFontSize(9);
    doc.setFont(primaryFont, 'normal');
    doc.setTextColor(headerFooterColor);
    const footerText = `MyAccess Confidential - Page ${pageNumber}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
  };
  
  const addNewPage = () => {
    addFooter();
    doc.addPage();
    pageNumber++;
    yPosition = 20;
    addHeader(offerData.companyName);
    addFooter();
  };

  const checkPageBreak = (requiredHeight) => {
    if (yPosition + requiredHeight > pageHeight - 30) {
      addNewPage();
      return true;
    }
    return false;
  };

  const addSectionTitle = (title) => {
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont(primaryFont, 'bold');
    doc.setTextColor(blackColor); // Changed to bold black
    doc.text(title, leftMargin, yPosition);
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPosition + 3, leftMargin + 30, yPosition + 3);
    yPosition += 15;
  };

  const addText = (text, options = {}) => {
    const {
      x = leftMargin,
      fontSize = 10,
      fontStyle = 'normal',
      color = textColor,
      maxWidth = contentWidth,
      lineSpacing = 6
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont(primaryFont, fontStyle);
    doc.setTextColor(color);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    checkPageBreak(lines.length * lineSpacing);

    lines.forEach((line) => {
      doc.text(line, x, yPosition);
      yPosition += lineSpacing;
    });
  };

 const addOfferDetailsTable = () => {
  checkPageBreak(80);
  
  const tableStartY = yPosition;
  const rowHeight = 11;
  const lineColor = '#E0E0E0';
  const col1X = leftMargin + 2;
  const col2X = leftMargin + (contentWidth / 2) + 5;

  addSectionTitle('OFFER DETAILS');
  
  // Different table data based on offer type
  let tableData;
  
  if (selectedOfferType === 'internship') {
    tableData = [
      ['Position:', offerData.jobTitle],
      ['Internship Duration:', offerData.internshipDuration || '6 months'],
      ['Start Date:', offerData.joiningDate],
      ['Reporting Location:', offerData.reportingLocation || offerData.workLocation],
      ['Offer Valid Until:', offerData.offerValidUntil]
    ];
    
    // Add stipend only if provided
    if (offerData.salaryAmount && offerData.salaryAmount.trim()) {
      tableData.splice(2, 0, ['Stipend:', offerData.salaryAmount]);
    }
  } else {
    tableData = [
      ['Position:', offerData.jobTitle],
      ['Annual Salary:', offerData.salaryAmount],
      ['Start Date:', offerData.joiningDate],
      ['Work Location:', offerData.workLocation],
      ['Reporting Manager:', offerData.reportingManager],
      ['Offer Valid Until:', offerData.offerValidUntil]
    ];
  }
  
  doc.setFontSize(10);
  doc.setLineWidth(0.25);
  doc.setDrawColor(lineColor);
  
  let currentY = yPosition;

  tableData.forEach((row, index) => {
    doc.setFont(primaryFont, 'bold');
    doc.setTextColor(textColor);
    doc.text(row[0], col1X, currentY + 8);
    
    doc.setFont(primaryFont, 'normal');
    doc.setTextColor(textColor);
    doc.text(row[1], col2X, currentY + 8);
    
    currentY += rowHeight;
    
    if (index < tableData.length) {
      doc.line(leftMargin, currentY + 1, pageWidth - rightMargin, currentY + 1);
    }
  });
  
  yPosition = currentY + 10;
};
  // --- Document Generation Starts ---
  addHeader(offerData.companyName);
  addFooter();

  // Date and Candidate Details
  yPosition += 10;
  
  checkPageBreak(30);
  addText(candidateData.name, { fontSize: 11, fontStyle: 'bold' });
  addText(offerData.candidateAddress);
  addText(`Phone: ${offerData.candidatePhone || candidateData.phone}`);
  addText(`Email: ${candidateData.email}`);
  
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  addText(currentDate, { fontSize: 11, lineSpacing: 5 });
  yPosition += 15;

  // Offer Subject
  checkPageBreak(20);
  addText(`Subject: Offer of Employment - ${offerData.jobTitle}`, { fontSize: 12, fontStyle: 'bold', color: primaryColor });
  yPosition += 10;

  // Salutation
  checkPageBreak(15);
  addText(`Dear ${candidateData.name.split(' ')[0]},`);
  yPosition += 10;

  // Introduction Paragraph
  checkPageBreak(30);
   let introParagraph;
  
  if (selectedOfferType === 'internship') {
    introParagraph = `On behalf of ${offerData.companyName || 'MyAccess Pvt. Ltd.'} (the "Company"), we are pleased to offer you the position of ${offerData.jobTitle}. This letter clarifies and confirms the terms of your internship with the Company.

Please note that this is an internship for a duration of ${offerData.internshipDuration || '6 months'}. Your internship will begin on ${offerData.joiningDate}, and will conclude on [End Date].

As an intern, you will have the opportunity to work on cutting-edge projects, gaining hands-on experience in developing solutions, analyzing data, and integrating technology solutions into practical applications. We are confident that this opportunity will provide significant learning and development to enhance your skills and prepare you for future career opportunities.`;
  } else {
   introParagraph = `On behalf of ${offerData.companyName || 'MyAccess Pvt. Ltd.'} (the "Company"), we are delighted to offer you the position of ${offerData.jobTitle}. We were impressed with your qualifications and experience, and we are excited about the prospect of you joining our team. This letter clarifies and confirms the terms of your employment with the Company.`;
  }addText(introParagraph);
  yPosition += 15;


  // --- Detailed Sections ---
  
if (selectedOfferType === 'internship') {
  // For internship - only show stipend section if stipend is provided
  if (offerData.salaryAmount && offerData.salaryAmount.trim()) {
    addSectionTitle('STIPEND & BENEFITS');
    const stipendText = `You will receive a stipend of ${offerData.salaryAmount}, payable monthly in accordance with the Company's standard procedures. The stipend is designed to support you during your learning period.`;
    addText(stipendText);
    yPosition += 5;
  } else {
    addSectionTitle('INTERNSHIP BENEFITS');
    const benefitsText = `This internship is designed as a learning opportunity to gain hands-on experience and develop your professional skills. You will receive mentorship, training, and exposure to real-world projects.`;
    addText(benefitsText);
    yPosition += 5;
  }

  if (offerData.additionalBenefits && offerData.additionalBenefits.trim()) {
    checkPageBreak(20);
    addText('In addition, you will have access to the following benefits:', { fontStyle: 'bold' });
    yPosition += 2;
    addText(offerData.additionalBenefits);
    yPosition += 10;
  }
} else {
  // Existing employment compensation section
  addSectionTitle('COMPENSATION & BENEFITS');
  const compensationText = `You will receive an annual salary of ${offerData.salaryAmount}, payable monthly in accordance with the Company's standard payroll procedures. Your position is exempt from overtime pay, and your salary will compensate you for all hours worked.You will receive your full salary in any work week that you perform work subject to limited deductions permitted by law as applicable to your status as a salaried exempt employee. The company reserves the right to modify compensation and benefits from time to time as deemed necessary.`;
  addText(compensationText);
  yPosition += 5;

  if (offerData.additionalBenefits && offerData.additionalBenefits.trim()) {
    checkPageBreak(20);
    addText('In addition, you will be eligible for the following benefits:', { fontStyle: 'bold' });
    yPosition += 2;
    addText(offerData.additionalBenefits);
    yPosition += 5;
  }
  
  const esopText = `As part of your compensation, you will be granted Employee Stock Options (ESOPs). A separate letter with the detailed terms and conditions, including the vesting schedule, will be provided to you.`;
  addText(esopText);
  yPosition += 10;
}
  
  
  
  addNewPage();
  
  

  addSectionTitle('CONDITIONS OF EMPLOYMENT');
  const backgroundText = 'This offer is contingent upon the successful completion of a background verification. Any misrepresentation of your academic or employment details may result in the termination of this offer without notice.';
  addText(backgroundText);
  yPosition += 5;

  const confidentialityText = `As a condition of employment, you are required to sign the Company's Confidentiality and Non-Disclosure Agreement, which will be provided to you separately.`;
  addText(confidentialityText);
  yPosition += 10;

  addSectionTitle('JOINING FORMALITIES & DOCUMENTATION');
  addText('To complete your joining process, please submit photocopies of the following documents on your first day. Please also bring the original documents for verification.');
  yPosition += 10;
  
  checkPageBreak(120);
  doc.setFontSize(10);
  doc.setFont(primaryFont, 'bold');
  
  const colWidth = contentWidth / 2 - 5;
  const docCol1 = leftMargin + 5;
  const docCol2 = leftMargin + colWidth + 10;
  let y1 = yPosition;
  let y2 = yPosition;
  

  const addDocItem = (text, col) => {
    doc.setFont(primaryFont, 'normal');
    const lines = doc.splitTextToSize(`•  ${text}`, colWidth);
    if (col === 1) {
      if (checkPageBreak(lines.length * 6)) y1 = yPosition;
      lines.forEach(line => { doc.text(line, docCol1, y1); y1 += 6; });
    } else {
      if (checkPageBreak(lines.length * 6)) y2 = yPosition;
      lines.forEach(line => { doc.text(line, docCol2, y2); y2 += 6; });
    }
  };

  addDocItem('All Educational Certificates (Xth, XIIth, Degree, etc.)', 1);
  addDocItem('PAN Card (Mandatory)', 1);
  addDocItem('Aadhar Card / Voter ID / Driving License', 1);
  addDocItem('Valid Passport (if available)', 1);
  addDocItem('Recent Passport-sized Photographs (2)', 2);
  addDocItem('Previous Employment Documents (if applicable)', 2);
  addDocItem('Last 3 Months Salary Slips (if applicable)', 2);
  
  yPosition = Math.max(y1, y2) + 15;

  addSectionTitle('Annexure – A');
  
  checkPageBreak(50);
  addText('01. Training Period:', { fontStyle: 'bold' });
  const trainingText = `You will be on training for a period of six months from the date of joining. The training program would consist of classroom training and on-the-job training. Your confirmation will be based on your positive contribution to the Company's objectives. Based on your performance and business requirements, the period of training can be extended for a further period of three months or part thereof. Your continued employment with the Company is subject to your meeting the qualifying criteria during and at the end of the training.`;
  addText(trainingText);
  yPosition += 10;

  checkPageBreak(50);
  addText('02. Service Agreement:', { fontStyle: 'bold' });
  const agreementText = `Our offer to you as  ${offerData.jobTitle} is subject to the execution of the necessary Services Agreement. You will be required to complete the formalities of the Service Agreement at the time of joining. The service agreement details the scope, terms and conditions of your employment and the contractual obligation to be with MyAccess Pvt. Ltd., from the date of your joining. Please note, the non-execution of Service Agreement at the time of your joining may result in denial of joining in the services of the Company.`;
  addText(agreementText);
  yPosition += 10;
  
  checkPageBreak(50);
  addText('03. Date of Joining Extension:', { fontStyle: 'bold' });
  const extensionText = `As per the Company policy, only one extension in the Date of Joining would be granted based on medical exigencies. The extension can be done for a maximum period of one month from the initial date of joining. Please note that any request for extension must be supported with documentary evidence (Medical record and certificate). The Company will review the documents provided on a Case-to-Case basis and we may extend the Date of Joining based on business requirements. All such requests for the date of joining extension have to be made at least a week before the initial date of joining. Granting this extension is solely at the discretion of the Company.`;
  addText(extensionText);
  yPosition += 15;
  if (selectedOfferType === 'internship') {
  checkPageBreak(100);
  addText('04. Internship Completion:', { fontStyle: 'bold' });
  const internshipCompletionText = `Upon successful completion of your ${offerData.internshipDuration || '6 months'} internship, you will receive a Certificate of Internship from ${offerData.companyName || 'MyAccess Pvt. Ltd.'}. Completion of the internship does not guarantee a permanent role, but exceptional performance may be considered for future employment opportunities.`;
  addText(internshipCompletionText);
  yPosition += 10;

  checkPageBreak(50);
  addText('05. Code of Conduct:', { fontStyle: 'bold' });
  const codeOfConductText = `As an intern, you are expected to adhere to the company's policies and code of conduct. Any behavior or actions in violation of these policies may result in immediate termination of your internship.`;
  addText(codeOfConductText);
  yPosition += 10;

  checkPageBreak(50);
  addText('06. Learning Objectives:', { fontStyle: 'bold' });
  const learningObjectivesText = `This internship is designed to provide you with practical experience and professional development opportunities. You will work under the guidance of experienced professionals and participate in meaningful projects.`;
  addText(learningObjectivesText);
  yPosition += 15;
}


  addOfferDetailsTable();

  // --- Closing Section ---
  addSectionTitle('ACCEPTANCE OF OFFER');
  const acceptanceText = `We are excited about the possibility of you joining our team. If you wish to accept this offer, please sign and return a copy of this letter by ${offerData.offerValidUntil}.`;
  addText(acceptanceText);
  yPosition += 10;
  
  const closingText = `We look forward to a productive and mutually beneficial working relationship. Please feel free to contact our HR department at ${offerData.hrContact} if you have any questions.`;
  addText(closingText);
  yPosition += 15;

  addText(`Welcome to the ${(offerData.companyName || 'MYACCESS').toUpperCase()} family!`, { fontSize: 11, fontStyle: 'bold', color: secondaryColor });
  yPosition += 10;

  // --- UPDATED Signature Area ---
  checkPageBreak(80); // Ensure enough space
  addText('Yours sincerely,', { fontStyle: 'italic' });
  yPosition += 5;

  const sig1X = leftMargin;
  const sig2X = leftMargin + contentWidth / 2;
  const sigWidth = contentWidth / 2 - 10;
  const imageY = yPosition;
  const imageH = 20; // Height of signature image
  const imageW = 40; // Width of signature image

  // Add signature images with error handling
  try {
    doc.addImage(suryaSignature, 'PNG', sig1X, imageY, imageW, imageH);
  } catch (e) {
    console.error("Could not add Surya signature image:", e);
  }

  try {
    doc.addImage(naveenSignature, 'PNG', sig2X, imageY, imageW, imageH);
  } catch (e) {
    console.error("Could not add Naveen signature image:", e);
  }

  const sigLineY = imageY + imageH + 2; // Position line just below image

  doc.setDrawColor(textColor);
  doc.setLineWidth(0.3);

  // Draw signature lines
  doc.line(sig1X, sigLineY, sig1X + sigWidth, sigLineY);
  doc.line(sig2X, sigLineY, sig2X + sigWidth, sigLineY);

  const textY = sigLineY + 5;
  doc.setFontSize(10);
  doc.setFont(primaryFont, 'normal');

  // Manually place text below lines to ensure correct alignment
  doc.text('Surya Tamarapalli', sig1X, textY);
  doc.text('Founder', sig1X, textY + 5);

  doc.text('Naveen Kumar Gavara', sig2X, textY);
  doc.text('Co-founder', sig2X, textY + 5);
  
  // Update main yPosition to be below the signature block
  yPosition = textY + 15;

  // --- Candidate Acceptance Section ---
  doc.setFillColor(lightGrayColor);
  doc.roundedRect(leftMargin, yPosition, contentWidth, 40, 3, 3, 'F');
  yPosition += 10;
  
  // Use the addText helper to handle word wrapping for the acceptance paragraph
  const originalY = yPosition; // Save current Y
  addText('I accept the offer of employment and agree to the terms and conditions outlined in this letter.', { x: leftMargin + 5, maxWidth: contentWidth - 10 });
  yPosition = originalY + 15; // Reset Y to a predictable position after the text

  const acceptSigX = leftMargin + 5;
  const dateSigX = leftMargin + contentWidth / 2;
  
  doc.line(acceptSigX, yPosition, acceptSigX + sigWidth, yPosition);
  doc.line(dateSigX, yPosition, dateSigX + sigWidth, yPosition);

  yPosition += 5;
  addText('Candidate Signature', { x: acceptSigX, maxWidth: sigWidth });
  
  yPosition -= 5; // Align date text with signature line
  addText('Date', { x: dateSigX, maxWidth: sigWidth });
try {
  const pdfBlob = doc.output('blob');
  if (!pdfBlob || pdfBlob.size === 0) {
    throw new Error('Generated PDF is empty');
  }
  return pdfBlob;
} catch (error) {
  console.error('Error generating PDF:', error);
  throw new Error('Failed to generate PDF: ' + error.message);
}}

  const getColumns = () => {
  if (screenSize.isMobile) {
    return [
      {
        title: 'Candidate',
        key: 'candidate',
        render: (_, record) => (
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.jobTitle}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>{record.email}</div>
            <div style={{ marginTop: '4px' }}>
              {record.offerSent ? (
                <Tag color="green" size="small">Offer Sent</Tag>
              ) : (
                <Tag color="orange" size="small">Pending</Tag>
              )}
            </div>
          </div>
        ),
      },
{
  title: 'Actions',
  key: 'actions',
  width: 100,
  render: (_, record) => (
    <Space direction="vertical" size="small">
      <Button 
        size="small" 
        block
        icon={<EyeOutlined />}
        onClick={() => {
          setSelectedCandidate(record);
          setCandidateModalVisible(true);
        }}
      >
        Details
      </Button>
      <Button
        size="small"
        block
        type="primary"
        icon={<SendOutlined />}
        onClick={() => {
          setSelectedCandidate(record);
          setOfferTypeModalVisible(true); // Changed from setOfferModalVisible(true)
        }}
      >
        {record.offerSent ? 'Resend Offer' : 'Send Offer'}
      </Button>
    </Space>
  ),
}
    ];
  }
  
  if (screenSize.isTablet) {
    return [
      {
        title: 'Candidate',
        key: 'candidate',
        width: 200,
        render: (_, record) => (
          <Space>
            <Avatar size={32} icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div>
              <Text type="secondary" style={{ fontSize: '11px' }}>{record.jobTitle}</Text>
            </div>
          </Space>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 100,
        render: (_, record) => (
          <div>
            {record.offerSent ? (
              <Tag color="green" size="small">Sent</Tag>
            ) : (
              <Tag color="orange" size="small">Pending</Tag>
            )}
          </div>
        ),
      },
{
  title: 'Actions',
  key: 'actions',
  width: 120,
  render: (_, record) => (
    <Space size="small">
      <Button 
        size="small"
        icon={<EyeOutlined />}
        onClick={() => {
          setSelectedCandidate(record);
          setCandidateModalVisible(true);
        }}
      />
      <Button
        size="small"
        type="primary"
        icon={<SendOutlined />}
        onClick={() => {
          setSelectedCandidate(record);
          setOfferTypeModalVisible(true); // Changed from setOfferModalVisible(true)
        }}
      />
    </Space>
  ),
}
    ];
  }
  
  // Desktop - return your existing full columns array
  return [
  {
    title: 'Candidate',
    key: 'candidate',
    fixed: 'left',
    width: 180, // Reduced from 200
    render: (_, record) => (
      <Space>
        <Badge dot={!record.offerSent} status="processing">
          <Avatar size={32} icon={<UserOutlined />} /> {/* Reduced from 40 */}
        </Badge>
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div> {/* Reduced font */}
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
          <div style={{ fontSize: '10px', color: '#1890ff' }}>
            <StarOutlined /> Selected
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Job Details',
    key: 'jobDetails',
    width: 150, // Reduced from 180
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 500, fontSize: '12px' }}>{record.jobTitle}</div>
        <Text type="secondary" style={{ fontSize: '11px' }}>{record.department}</Text>
        <div style={{ fontSize: '10px', color: '#52c41a' }}>
          <TrophyOutlined /> Exp: {record.experience} years
        </div>
      </div>
    ),
  },
  {
      title: 'Source',
      key: 'source',
      width: 80,
      render: (_, record) => (
        <Tag color={record.isManual ? 'orange' : 'blue'} size="small">
          {record.isManual ? 'Manual' : 'Selected'}
        </Tag>
      ),
    },
  {
    title: 'Ratings',
    key: 'ratings',
    width: 120, // Reduced from 150
    render: (_, record) => (
      <div>
        <div style={{ marginBottom: '2px' }}>
          <Text style={{ fontSize: '10px' }}>Tech: </Text>
          <Tag color={record.technicalRating >= 4 ? 'green' : record.technicalRating >= 3 ? 'orange' : 'red'} 
               size="small">
            {record.technicalRating || 'N/A'}/5
          </Tag>
        </div>
        <div>
          <Text style={{ fontSize: '10px' }}>Comm: </Text>
          <Tag color={record.communicationRating >= 4 ? 'green' : record.communicationRating >= 3 ? 'orange' : 'red'} 
               size="small">
            {record.communicationRating || 'N/A'}/5
          </Tag>
        </div>
      </div>
    ),
  },
  {
    title: 'Selected Date',
    dataIndex: 'selectedDate',
    key: 'selectedDate',
    width: 100, // Reduced from 120
    render: (date) => (
      <div style={{ fontSize: '11px' }}>
        <CalendarOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
        {new Date(date).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric'
        })}
      </div>
    ),
  },
  {
    title: 'Offer Status',
    key: 'offerStatus',
    width: 110, // Reduced from 130
    render: (_, record) => (
      <div>
        {record.offerSent ? (
          <div>
            <Tag color="green" icon={<CheckCircleOutlined />} size="small">
              Sent
            </Tag>
            <div style={{ fontSize: '9px', color: '#666' }}>
              {new Date(record.offerSentDate).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <Tag color="orange" icon={<ClockCircleOutlined />} size="small">
            Pending
          </Tag>
        )}
      </div>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 80, // Reduced from 100
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="View Details">
          <Button 
            type="text" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedCandidate(record);
              setCandidateModalVisible(true);
            }}
          />
        </Tooltip>
        <Tooltip title="Download Resume">
          <Button 
            type="text" 
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open(record.resumeUrl, '_blank')}
          />
        </Tooltip>
      </Space>
    ),
  },
{
  title: 'Send Offer',
  key: 'sendOffer',
  width: 100,
  render: (_, record) => (
    <Button
      type="primary"
      size="small"
      icon={<SendOutlined />}
      onClick={() => {
        setSelectedCandidate(record);
        setOfferTypeModalVisible(true); // Changed from setOfferModalVisible(true)
      }}
      style={{ fontSize: '11px' }}
    >
      {record.offerSent ? 'Resend' : 'Send'}
    </Button>
  ),
},
  {
    title: 'History',
    key: 'history',
    width: 70, // Reduced from 80
    render: (_, record) => (
      <Button
        type="link"
        size="small"
        icon={<HistoryOutlined />}
        onClick={() => {
          setSelectedCandidate(record);
          setHistoryDrawerVisible(true);
        }}
        style={{ fontSize: '11px' }}
      >
        View
      </Button>
    ),
  }
];
};


  return (
    <div style={{ 
  padding: screenSize.isMobile ? '8px' : screenSize.isTablet ? '12px' : '16px',
  maxWidth: '100%',
  margin: '0 auto', 
  width: '100%',
  minHeight: '100vh'
}}>
    {/* Header */}
<div style={{ 
  marginBottom: '24px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start',
  flexWrap: 'wrap'
}}>
  <div>
    <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
      <TrophyOutlined /> Selected Candidates
    </Title>
    <Text type="secondary">
      Manage selected candidates and send offer letters
    </Text>
  </div>
  <Button 
    type="primary" 
    icon={<SendOutlined />}
 onClick={() => {
  setSelectedCandidate(null);
  setOfferTypeModalVisible(true); // Changed this line
}}
    style={{ 
      height: '40px',
      marginTop: screenSize.isMobile ? '12px' : '0'
    }}
  >
    {screenSize.isMobile ? 'Manual Offer' : 'Send Manual Offer'}
  </Button>
</div>

      {/* Statistics Cards */}
<Row gutter={[screenSize.isMobile ? 4 : screenSize.isTablet ? 8 : 16, 8]} style={{ marginBottom: '24px' }}>
  <Col xs={12} sm={12} md={6} lg={6} xl={4}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title={screenSize.isMobile ? "Selected" : "Total Selected"}
        value={candidates.length}
        prefix={<TeamOutlined />}
        valueStyle={{ 
          color: '#3f8600',
          fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px'
        }}
      />
    </Card>
  </Col>

  <Col xs={12} sm={12} md={6} lg={6} xl={4}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title="Offers Sent"
        value={candidates.filter(c => c.offerSent).length}
        prefix={<SendOutlined />}
        valueStyle={{ color: '#1890ff' ,fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px'}}
      />
    </Card>
  </Col>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title="Pending Offers"
        value={candidates.filter(c => !c.offerSent).length}
        prefix={<ClockCircleOutlined />}
        valueStyle={{ color: '#cf1322',fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px' }}
      />
    </Card>
  </Col>
  <Col xs={12} sm={12} md={6} lg={6} xl={6}>
    <Card size={screenSize.isMobile ? "small" : "default"}>
      <Statistic
        title="Completion Rate"
        value={candidates.length > 0 ? Math.round((candidates.filter(c => c.offerSent).length / candidates.length) * 100) : 0}
        suffix="%"
        prefix={<CheckCircleOutlined />}
        valueStyle={{ color: '#722ed1',fontSize: screenSize.isMobile ? '16px' : screenSize.isTablet ? '20px' : '24px' }}
      />
    </Card>
  </Col>
</Row>

      {/* Filters */}
<Card style={{ marginBottom: '24px' }}>
  {screenSize.isMobile ? (
    <div>

      {filtersVisible && (
        <div style={{ marginTop: '16px' }}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Select
                value={jobTitleFilter}
                onChange={setJobTitleFilter}
                style={{ width: '100%' }}
                placeholder="Job Title"
              >
                <Option value="all">All Job Titles</Option>
                {jobTitles.map(title => (
                  <Option key={title} value={title}>{title}</Option>
                ))}
              </Select>
            </Col>
            <Col span={24}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                placeholder="Offer Status"
              >
                <Option value="all">All Status</Option>
                <Option value="offer_sent">Offer Sent</Option>
                <Option value="offer_pending">Offer Pending</Option>
              </Select>
            </Col>
          </Row>
        </div>
      )}
    </div>
  ) : (
    <Row gutter={[12, 12]}>
      {/* Your existing desktop filters */}
    </Row>
  )}
  <Row gutter={[screenSize.isMobile ? 8 : screenSize.isTablet ? 12 : 16, 12]}>
    <Col xs={24} sm={12} md={8} lg={6} xl={5}> {/* Made responsive */}
      <div style={{ marginBottom: '8px' }}>
        <Text strong style={{ fontSize: screenSize.isMobile ? '12px' : '14px' }}>Search</Text>
      </div>
      <Input
         size={screenSize.isMobile ? "small" : "middle"}
        placeholder={screenSize.isMobile ? "Search..." : "Search by name or email"}
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
      />
    </Col>
    <Col xs={12} sm={6} md={4} lg={4} xl={4}> {/* Reduced width */}
      <div style={{ marginBottom: '8px' }}>
        <Text strong>Job Title</Text>
      </div>
      <Select
        value={jobTitleFilter}
        onChange={setJobTitleFilter}
        style={{ width: '100%' }}
      >
        <Option value="all">All Job Titles</Option>
        {jobTitles.map(title => (
          <Option key={title} value={title}>{title}</Option>
        ))}
      </Select>
    </Col>
    <Col xs={12} sm={6} md={4} lg={4} xl={4}> {/* Reduced width */}
      <div style={{ marginBottom: '8px' }}>
        <Text strong>Offer Status</Text>
      </div>
      <Select
        value={statusFilter}
        onChange={setStatusFilter}
        style={{ width: '100%' }}
      >
        <Option value="all">All Status</Option>
        <Option value="offer_sent">Offer Sent</Option>
        <Option value="offer_pending">Offer Pending</Option>
      </Select>
    </Col>
    <Col xs={24} sm={12} md={6} lg={6} xl={6}> {/* Made responsive */}
      <div style={{ marginBottom: '8px' }}>
        <Text strong>Date Range</Text>
      </div>
      <RangePicker
        style={{ width: '100%' }}
        onChange={setDateRange}
      />
    </Col>
    <Col xs={24} sm={12} md={4} lg={4} xl={4}> {/* Reduced width */}
      <div style={{ marginBottom: '8px', opacity: 0 }}>
        <Text>Action</Text>
      </div>
      <Button
        icon={<ReloadOutlined />}
        onClick={fetchSelectedCandidates}
        title="Refresh Data"
        style={{ width: '100%' }} // Full width on mobile
      />
    </Col>
  </Row>
</Card>

      {/* Selected Candidates Table */}
      <Card>
        <Table
  columns={getColumns()}
  dataSource={filteredCandidates}
  rowKey="id"
  loading={loading}
  pagination={{
    pageSize: screenSize.isMobile ? 5 : screenSize.isTablet ? 8 : 10,
    showSizeChanger: screenSize.isDesktop,
    showQuickJumper: screenSize.isDesktop,
    showTotal: screenSize.isDesktop ? (total, range) =>
      `${range[0]}-${range[1]} of ${total} candidates` : null,
    simple: screenSize.isMobile
  }}
  scroll={{ 
    x: screenSize.isMobile ? 350 : screenSize.isTablet ? 500 : 900 
  }}
  size={screenSize.isMobile ? "small" : "middle"}
/>
      </Card>

      {/* Candidate Details Modal */}
<Modal
  title={selectedCandidate ? `${selectedCandidate.name} - Candidate Details` : 'Candidate Details'}
  open={candidateModalVisible}
  onCancel={() => setCandidateModalVisible(false)}
  width={screenSize.isMobile ? '95%' : screenSize.isTablet ? '80%' : screenSize.isDesktop ? 900 : 1000}
  style={{ top: screenSize.isMobile ? 20 : 40 }}
        footer={[
          <Button key="close" onClick={() => setCandidateModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedCandidate && window.open(selectedCandidate.resumeUrl, '_blank')}
          >
            Download Resume
          </Button>
        ]}

      >
        {selectedCandidate && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Full Name" span={1}>
                <UserOutlined /> {selectedCandidate.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={1}>
                <MailOutlined /> {selectedCandidate.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone" span={1}>
                <PhoneOutlined /> {selectedCandidate.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Location" span={1}>
                <EnvironmentOutlined /> {selectedCandidate.location}
              </Descriptions.Item>
              <Descriptions.Item label="Current Position" span={1}>
                <BankOutlined /> {selectedCandidate.currentPosition}
              </Descriptions.Item>
              <Descriptions.Item label="Experience" span={1}>
                <TrophyOutlined /> {selectedCandidate.experience} years
              </Descriptions.Item>
              <Descriptions.Item label="Education" span={2}>
                <FileTextOutlined /> {selectedCandidate.education}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Salary" span={1}>
                <DollarOutlined /> {selectedCandidate.expectedSalary}
              </Descriptions.Item>
              <Descriptions.Item label="Technical Rating" span={1}>
                <Tag color="blue">{selectedCandidate.technicalRating || 'N/A'}/5</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Communication Rating" span={1}>
                <Tag color="green">{selectedCandidate.communicationRating || 'N/A'}/5</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Interviewer" span={1}>
                {selectedCandidate.interviewerName || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />
            
            <div>
              <Text strong>Skills:</Text>
              <div style={{ marginTop: '8px' }}>
                {selectedCandidate.skills.map(skill => (
                  <Tag key={skill} color="blue" style={{ marginBottom: '4px' }}>
                    {skill.trim()}
                  </Tag>
                ))}
              </div>
            </div>

            {selectedCandidate.interviewFeedback && (
              <>
                <Divider />
                <div>
                  <Text strong>Interview Feedback:</Text>
                  <Paragraph style={{ marginTop: '8px', background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                    {selectedCandidate.interviewFeedback}
                  </Paragraph>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
{/* Offer Type Selection Modal - ADD THIS NEW MODAL */}
<Modal
  title="Select Offer Type"
  open={offerTypeModalVisible}
  onCancel={() => setOfferTypeModalVisible(false)}
  footer={null}
  width={400}
  centered
>
  <div style={{ textAlign: 'center', padding: '20px 0' }}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button
        type="primary"
        size="large"
        icon={<FileTextOutlined />}
        onClick={() => {
          setSelectedOfferType('employment');
          setOfferTypeModalVisible(false);
          setOfferModalVisible(true);
        }}
        style={{ width: '100%', height: '60px', fontSize: '16px' }}
      >
        Employment Offer
      </Button>
      
      <Button
        type="default"
        size="large"
        icon={<UserOutlined />}
        onClick={() => {
          setSelectedOfferType('internship');
          setOfferTypeModalVisible(false);
          setOfferModalVisible(true);
        }}
        style={{ width: '100%', height: '60px', fontSize: '16px' }}
      >
        Internship Offer
      </Button>
    </Space>
  </div>
</Modal>


<Modal
  destroyOnHidden
title={selectedCandidate ? 
  `Send ${selectedOfferType === 'internship' ? 'Internship' : 'Employment'} Offer Letter` : 
  `Send Manual ${selectedOfferType === 'internship' ? 'Internship' : 'Employment'} Offer Letter`
}  open={offerModalVisible}
  onCancel={() => setOfferModalVisible(false)}
  footer={null}
  width={900}
>
  <Form
    layout="vertical"
    onFinish={sendOfferLetter}
    key={selectedCandidate?.id || 'manual'}
   initialValues={selectedCandidate ? {
  candidateName: selectedCandidate.name,
  candidateEmail: selectedCandidate.email,
  candidatePhone: selectedCandidate.phone,
  candidateAddress: selectedCandidate.location || '',
  jobTitle: selectedCandidate?.jobTitle || (selectedOfferType === 'internship' ? 'AI Intern' : ''),      
  companyName: 'MyAccess Private Limited',
  salaryAmount: selectedOfferType === 'internship' ? '' : selectedCandidate.expectedSalary, // Empty for internship
  workLocation: selectedOfferType === 'internship' ? '' : '',
  reportingLocation: selectedOfferType === 'internship' ? 'NASSCOM CoE IoT & AI, Andhra University, Visakhapatnam' : '',
  internshipDuration: selectedOfferType === 'internship' ? '6 months' : '',
  reportingManager: '',
  offerValidUntil: '7 days from offer date'
} : {
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  candidateAddress: '',
  jobTitle: selectedOfferType === 'internship' ? 'AI Intern' : '',
  companyName: 'MyAccess Private Limited',
  salaryAmount: '',
  workLocation: '',
  reportingLocation: selectedOfferType === 'internship' ? 'NASSCOM CoE IoT & AI, Andhra University, Visakhapatnam' : '',
  internshipDuration: selectedOfferType === 'internship' ? '6 months' : '',
  reportingManager: '',
  offerValidUntil: '7 days from offer date'
}}
  >
    <Alert
      message={selectedCandidate ? "Offer Letter Details" : "Manual Offer Letter"}
      description={selectedCandidate ? 
        "Please fill in all the required details for the offer letter." :
        "Enter candidate details manually to send offer letter to external candidates."
      }
      type="info"
      showIcon
      style={{ marginBottom: '16px' }}
    />

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Candidate Name" name="candidateName" rules={[{ required: true }]}>
          <Input 
            disabled={!!selectedCandidate} 
            placeholder="Enter candidate full name" 
          />
        </Form.Item>

        <Form.Item label="Candidate Email" name="candidateEmail" rules={[{ required: true, type: 'email' }]}>
          <Input 
            disabled={!!selectedCandidate} 
            placeholder="Enter candidate email" 
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Candidate Phone" name="candidatePhone" rules={[{ required: true }]}>
          <Input placeholder="Enter candidate phone number" />
        </Form.Item>
        <Form.Item label="Candidate Address" name="candidateAddress" rules={[{ required: true }]}>
          <Input placeholder="Enter candidate full address" />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Job Title" name="jobTitle" rules={[{ required: true }]}>
          <Input placeholder="Enter job title" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Company Name" name="companyName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>

  

<Row gutter={16}>
  <Col span={12}>
    <Form.Item 
      label={selectedOfferType === 'internship' ? "Stipend Amount (Optional)" : "Salary Amount"} 
      name="salaryAmount" 
      rules={selectedOfferType === 'internship' ? [] : [{ required: true }]}
    >
      <Input 
        prefix={<DollarOutlined />} 
        placeholder={selectedOfferType === 'internship' ? 
          "e.g., ₹15,000 per month (optional)" : 
          "e.g., $75,000 per annum"
        } 
      />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item label="Joining Date" name="joiningDate" rules={[{ required: true }]}>
      <DatePicker style={{ width: '100%' }} />
    </Form.Item>
  </Col>
</Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Work Location" name="workLocation" rules={[{ required: true }]}>
          <Input 
            placeholder="Enter work location (e.g., Hyderabad, India / Remote / New York Office)"
            addonBefore={<EnvironmentOutlined />}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Reporting Manager" name="reportingManager" rules={[{ required: true }]}>
          <Input placeholder="Enter reporting manager name" />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Offer Valid Until" name="offerValidUntil" rules={[{ required: true }]}>
          <Input placeholder="e.g., 7 days from offer date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="HR Contact" name="hrContact" rules={[{ required: true }]}>
          <Input placeholder="HR name and contact details" />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item label="Additional Benefits" name="additionalBenefits">
      <TextArea 
        rows={3} 
        placeholder="Health insurance, provident fund, flexible hours, etc."
      />
    </Form.Item>{selectedOfferType === 'internship' && (
  <>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Internship Duration" name="internshipDuration" rules={[{ required: true }]}>
          <Input placeholder="e.g., 6 months" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Reporting Location" name="reportingLocation" rules={[{ required: true }]}>
          <Input placeholder="NASSCOM CoE IoT & AI, Andhra University, Visakhapatnam" />
        </Form.Item>
      </Col>
    </Row>
  </>
)}

    <Form.Item label="Additional Message" name="message">
      <TextArea 
        rows={4} 
        placeholder="Any additional message or instructions for the candidate..."
        defaultValue={selectedCandidate ? `Dear ${selectedCandidate.name},

Congratulations! We are pleased to extend this offer of employment to you.

We look forward to welcoming you to our team.

Best regards,
HR Team` : `Dear Candidate,

Congratulations! We are pleased to extend this offer of employment to you.

We look forward to welcoming you to our team.

Best regards,
HR Team`}
      />
    </Form.Item>

    <div style={{ textAlign: 'right' }}>
      <Space>
        <Button onClick={() => setOfferModalVisible(false)}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
          Send Offer Letter
        </Button>
      </Space>
    </div>
  </Form>
</Modal>
      <style>{`@media (max-width: 575px) {
  .ant-table-thead > tr > th {
    padding: 8px 4px !important;
    font-size: 12px !important;
  }
  .ant-table-tbody > tr > td {
    padding: 8px 4px !important;
    font-size: 11px !important;
  }
}

@media (min-width: 576px) and (max-width: 991px) {
  .ant-table-thead > tr > th {
    padding: 10px 6px !important;
    font-size: 13px !important;
  }
}

@media (min-width: 1200px) {
  .ant-table-thead > tr > th {
    padding: 12px 8px !important;
  }
}`}</style>
      {/* History Drawer */}
      <Drawer
        title={selectedCandidate ? `${selectedCandidate.name} - Complete History` : 'Complete History'}
  placement="right"
  open={historyDrawerVisible}
  onClose={() => setHistoryDrawerVisible(false)}
  width={screenSize.isMobile ? '95%' : screenSize.isTablet ? '70%' : screenSize.isDesktop ? 600 : 700}
      >
        {selectedCandidate && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <div style={{ marginTop: '12px' }}>
                <Title level={4} style={{ margin: 0 }}>{selectedCandidate.name}</Title>
                <Text type="secondary">{selectedCandidate.jobTitle}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag color="green" icon={<TrophyOutlined />}>
                    SELECTED CANDIDATE
                  </Tag>
                </div>
              </div>
            </div>
            
            <Divider />
            


<Timeline
  items={[
    {
      color: 'green',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Application Submitted</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(selectedCandidate.selectedDate).toLocaleDateString()}
          </Text>
        </div>
      ),
    },
    {
      color: 'blue',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Resume Shortlisted</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Moved to interview process
          </Text>
        </div>
      ),
    },
    // Fixed conditional interview item
    ...(selectedCandidate.interviewDate ? [{
      color: 'cyan',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Interview Completed</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(selectedCandidate.interviewDate).toLocaleDateString()}
          </Text>
          <div style={{ marginTop: '4px' }}>
            <Tag color="blue" size="small">Technical: {selectedCandidate.technicalRating}/5</Tag>
            <Tag color="green" size="small">Communication: {selectedCandidate.communicationRating}/5</Tag>
          </div>
        </div>
      ),
    }] : []),
    {
      color: 'gold',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>Candidate Selected</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Moved to selected candidates list
          </Text>
        </div>
      ),
    },
    // Fixed mail history items - convert dates to strings properly
    ...((selectedCandidate.mailHistory || []).map((mail, index) => ({
      color: mail.type === 'offer' ? 'green' : 'blue',
      children: (
        <div key={`mail-${index}`}>
          <div style={{ fontWeight: 500 }}>
            {mail.type === 'offer' ? 'Offer Letter Sent' : 'Email Sent'}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(mail.sentDate).toLocaleDateString()} at {new Date(mail.sentDate).toLocaleTimeString()}
          </Text>
          {mail.type === 'offer' && mail.offerDetails && (
            <div style={{ marginTop: '8px', background: '#f6ffed', padding: '8px', borderRadius: '4px' }}>
              <Text style={{ fontSize: '12px' }}>
                <strong>Salary:</strong> {mail.offerDetails.salaryAmount}<br/>
                {/* Fix the joining date rendering */}
                <strong>Joining:</strong> {typeof mail.offerDetails.joiningDate === 'string' 
                  ? mail.offerDetails.joiningDate 
                  : new Date(mail.offerDetails.joiningDate).toLocaleDateString()}<br/>
                <strong>Location:</strong> {mail.offerDetails.workLocation}
              </Text>
            </div>
          )}
        </div>
      ),
    })))
  ]}
/>
            {selectedCandidate.mailHistory && selectedCandidate.mailHistory.length > 0 && (
              <>
                <Divider />
                <div>
                  <Title level={5}>Email History</Title>
                  {selectedCandidate.mailHistory.map((mail, index) => (
                    <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Tag color={mail.type === 'offer' ? 'green' : 'blue'}>
                            {mail.type.toUpperCase()}
                          </Tag>
                          <Text style={{ fontSize: '12px' }}>
                            {new Date(mail.sentDate).toLocaleString()}
                          </Text>
                        </div>
                        <Badge status={mail.emailStatus === 'sent' ? 'success' : 'error'} 
                               text={mail.emailStatus} />
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SelectedCandidatesPage;