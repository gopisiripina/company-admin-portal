import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Users, DollarSign, ShoppingCart,  TrendingUp, Calendar,Camera , Clock, Star, ArrowUpRight, ArrowDownRight, Activity, Zap, Menu} from 'lucide-react';
import {Row, Col, Statistic, Button, Card, Space,Typography,  Spin, Alert,Badge, Modal, Flex,DatePicker} from 'antd';
import {LeftOutlined, RightOutlined, CalendarOutlined,FilePdfOutlined, } from '@ant-design/icons';
import './Dashboard.css';
import ProfileSection from '../profile/ProfileSection';
import AdminManagement from '../admin/AdminManagement';
import EmployeeManagement from '../admin/EmployeeManagement';
import ProjectTimeline from '../project/ProjectTimeline';
import ProjectBudgeting from '../project/ProjectBudgeting';
import HRManagement from '../admin/HRManagement';
import JobDescriptionPage from '../job/JobDescriptionPage';
import JobPostPage from '../job/JobPostPage';
import JobApplyPage from '../job/JobApplyPage';
import ResumeListPage from '../job/ResumeListpage';
import InterviewManagementPage from '../job/InterviewManagementPage';
import JobApplicationPage from '../job/JobApplicationPage'
import SelectedCandidatesPage from '../job/SelectedCandidatespage';
import CampusJobApplyPage from '../job/CampusJobApplyPage';
import ExamConductPage from '../job/ExamConductPage';
import EmailClient from '../email/EmailClient';


import DirectRecruitmentPage from '../job/DirectRecruitmentPage';
import EmployeeAttendancePage from '../hr/EmployeeAttendancePage';
import { supabase } from '../../supabase/config';
import CompanyCalendarAndEventsPage from '../hr/CompanyCalendarAndEventsPage';
import LeaveManagementPage from '../hr/leavemanage';
import Webcam from "react-webcam";
import * as faceapi from 'face-api.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';
import PayrollManagement from '../hr/payroll';
const Dashboard = ({ sidebarOpen, activeSection, userData, onLogout, onSectionChange,activeEmailFolder, onToggleSidebar, isEmailAuthenticated, setIsEmailAuthenticated }) => {
  const { Text, Title } = Typography;
  const [currentJobId, setCurrentJobId] = useState(2);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const webcamRef = useRef(null);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceDetectionInterval, setFaceDetectionInterval] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [attendanceType, setAttendanceType] = useState('check-in');
  const [hasStartedDetection, setHasStartedDetection] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [userPayslips, setUserPayslips] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslipMonth, setSelectedPayslipMonth] = useState(dayjs());
  const [tabId] = useState(() => Date.now() + Math.random());
    const storageKey = `emailCredentials_${tabId}`;
useEffect(() => {
  
  
  
}, [userData]);

const loadFaceDetectionModels = async () => {
  try {
    console.log('Starting to load face detection models...');
    
    // Load from CDN instead of local files first to test
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    
    console.log('Face detection models loaded successfully');
    setIsModelLoaded(true);
    return true;
  } catch (error) {
    console.error('Failed to load face detection models:', error);
    setIsModelLoaded(false);
    return false;
  }
};

const startCamera = () => {
  setIsCameraOn(true);
  if (isModelLoaded && !hasStartedDetection) {
    setHasStartedDetection(true);
    setTimeout(startFaceDetection, 1000);
  }
};

const stopCamera = () => {
  // Stop the webcam stream
  if (webcamRef.current && webcamRef.current.stream) {
    webcamRef.current.stream.getTracks().forEach(track => track.stop());
  }
  
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
  }
  
  if (faceDetectionInterval) {
    clearInterval(faceDetectionInterval);
    setFaceDetectionInterval(null);
  }
  
  setIsCameraOn(false);
  setHasStartedDetection(false);
  setIsFaceDetected(false);
};

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
          pdf.save(`payslip_${employee.employee_name}_${dayjs(employee.pay_period).format('YYYY-MM')}.pdf`);
resolve(true);
        });
      });
    }
  };

const downloadUserPayslip = async (payslipData) => {
  try {
    await generatePayslipPDF(payslipData, false);
    console.log('Payslip downloaded successfully');
  } catch (error) {
    console.error('Error downloading payslip:', error);
    Modal.error({
      title: 'Download Failed',
      content: 'Failed to download payslip. Please try again.',
    });
  }
};

const startFaceDetection = () => {
  // Prevent multiple calls
  if (faceDetectionInterval || isProcessing) {
    console.log('Detection already running or processing');
    return;
  }

  if (!webcamRef.current || !isModelLoaded) return;

  const interval = setInterval(async () => {
    if (isProcessing) {
      clearInterval(interval);
      setFaceDetectionInterval(null);
      return;
    }

    if (webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;
      
      if (video.readyState !== 4) return;
      
      try {
        const detection = await faceapi.detectSingleFace(
          video, 
          new faceapi.TinyFaceDetectorOptions()
        );
        
        if (detection && detection.score > 0.5 && !isProcessing) {
          setIsFaceDetected(true);
          clearInterval(interval);
          setFaceDetectionInterval(null);
          
          // Call only once
          handleVerifyAndCheckIn();
        } else {
          setIsFaceDetected(false);
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }
  }, 1000);

  setFaceDetectionInterval(interval);
};

useEffect(() => {
  if (userData && userData.id && selectedPayslipMonth) {
   
    fetchUserPayslips();
  }
}, [selectedPayslipMonth]);
useEffect(() => {
  if (userData && userData.id) {
    fetchAttendanceData();
    fetchUserPayslips(); // Add this line
  }
}, [userData, currentMonth]);
useEffect(() => {
  if (isCameraModalVisible && !isModelLoaded) {
    loadFaceDetectionModels();
  }
}, [isCameraModalVisible]);

const handleVerifyAndCheckIn = async () => {
  if (isProcessing || isVerifying) {
    console.log('Already processing, ignoring duplicate call');
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceData.find(d => d.date === todayStr);
  
  if (todayRecord && todayRecord.check_in && todayRecord.check_out) {
    setVerificationError('You have already completed both check-in and check-out for today.');
    return;
  }


  setVerificationError('');
  setIsProcessing(true);
  setIsVerifying(true);
  setShowRetryButton(false);

  const imageSrc = webcamRef.current.getScreenshot();
  if (!imageSrc) {
    setVerificationError("Could not capture image. Please try again.");
    setIsVerifying(false);
    setIsProcessing(false);
    setShowRetryButton(true);
    return;
  }

  const fetchRes = await fetch(imageSrc);
  const blob = await fetchRes.blob();
  const imageFile = new File([blob], "snapshot.jpg", { type: "image/jpeg" });

  const formData = new FormData();
  formData.append('email', userData.email);
  formData.append('image', imageFile);

  try {
    const apiResponse = await fetch('https://cap.myaccessio.com/api/verify-face/', {
      method: 'POST',
      body: formData,
    });

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(result.error || 'Verification failed. Please try again.');
    }

    // If verification successful, proceed with attendance marking
    await markAttendance();
    await fetchAttendanceData();
  } catch (error) {
    console.error('Verification Error:', error);
    setVerificationError(error.message);
    setShowRetryButton(true);
  } finally {
    setIsVerifying(false);
    setIsProcessing(false);
  }
};

const fetchAttendanceData = async () => {
  if (!userData || !userData.id) {
    // This check is important. If there's no user, we can't fetch data.
    return;
  }

  const userId = userData.id;
  const startOfMonth = dayjs(currentMonth).startOf('month').format('YYYY-MM-DD');
  const endOfMonth = dayjs(currentMonth).endOf('month').format('YYYY-MM-DD');
  
  // --- MODIFICATION START ---
  // Added clearer logging to diagnose fetching issues.
 
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: true });

    if (error) {
      // This will show you if Supabase itself is returning an error.
      console.error('[FETCHING DATA] Supabase Error:', error);
      return;
    }

    // This is the most critical log. Check your browser console for this output after you check in.
    // It shows you exactly what the database returned.
   

    setAttendanceData(data || []);

  } catch (error) {
    console.error('[FETCHING DATA] An unexpected error occurred:', error);
  }
  // --- MODIFICATION END ---
};

const fetchUserPayslips = async () => {
  if (!userData || !userData.id) return;
  
  try {
    // ❌ CHANGE THIS - Add month filtering
    const startOfMonth = selectedPayslipMonth.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = selectedPayslipMonth.endOf('month').format('YYYY-MM-DD');
    
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('user_id', userData.id)
      .gte('pay_period', startOfMonth)  // ❌ ADD THIS
      .lte('pay_period', endOfMonth)    // ❌ ADD THIS
      .order('pay_period', { ascending: false });
    
    if (error) throw error;
    
    setUserPayslips(data || []);
  } catch (error) {
    console.error('Error fetching payslips:', error);
  }
};

const markAttendance = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-GB');

    // Check if user already has a record for today
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userData.id)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error('Failed to check existing attendance record');
    }

    let attendanceData;
    let message;

    if (!existingRecord) {
      // First time today - Check In
      attendanceData = {
        user_id: userData.id,
        date: today,
        check_in: currentTime,
        is_present: true,
      };
      message = 'Check-in successful! Your attendance has been recorded.';
    } else if (existingRecord.check_in && !existingRecord.check_out) {
      // Already checked in - Check Out
      const checkInTime = new Date(`${today}T${existingRecord.check_in}`);
      const checkOutTime = new Date(`${today}T${currentTime}`);
      const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      attendanceData = {
        ...existingRecord,
        check_out: currentTime,
        total_hours: totalHours.toFixed(2)
      };
      message = `Check-out successful! Total hours worked: ${totalHours.toFixed(2)} hours`;
    } else {
      // Already completed both actions
      throw new Error('You have already completed check-in and check-out for today.');
    }

    const { error: attendanceError } = await supabase
      .from('attendance')
      .upsert(attendanceData, { onConflict: 'user_id,date' });

    if (attendanceError) {
      throw new Error(attendanceError.message || 'Failed to save attendance record.');
    }
    await fetchAttendanceData();
    stopCamera(); // This will handle all cleanup
    setIsCameraModalVisible(false); 

//     // Success - Always close modal after action
//     if (cameraStream) {
//   cameraStream.getTracks().forEach(track => track.stop());
//   setCameraStream(null);
// }

// stopCamera();

// Success - Always close modal after action
Modal.success({
  title: 'Attendance Marked!',
  content: message,
});

// Close modal and reset all states
// setIsCameraModalVisible(false);

  } catch (error) {
    console.error('Attendance marking error:', error);
    setVerificationError(error.message);
    setShowRetryButton(true);
  }
};
const handleRetry = () => {
  setVerificationError('');
  setShowRetryButton(false);
  setIsFaceDetected(false);
  setIsProcessing(false);
  setIsVerifying(false);
  
  // // Restart face detection
  // if (isModelLoaded) {
  //   setTimeout(startFaceDetection, 1000);
  // }
};

useEffect(() => {
 
  
  if (userData && userData.id) {
    
    fetchAttendanceData();
  } else {
    console.log('Skipping fetch - no user data');
  }
}, [userData, currentMonth]);



// Move these calculations here, after the useEffect hooks
const presentDays = attendanceData.filter(record => record.is_present === true).length;
const absentDays = attendanceData.filter(record => record.is_present === false).length;
const totalDays = attendanceData.length;
const renderAttendanceCalendar = () => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Create attendance lookup map
  const attendanceMap = {};
  
 
  
  attendanceData.forEach(record => {
  // Handle different date formats
  let dateKey;
  if (record.date) {
    // Ensure date is in YYYY-MM-DD format
    if (typeof record.date === 'string') {
      dateKey = record.date.split('T')[0]; // Remove time part if exists
    } else {
      dateKey = new Date(record.date).toISOString().split('T')[0];
    }
    
    attendanceMap[dateKey] = {
      isPresent: record.is_present,
      checkIn: record.check_in,
      checkOut: record.check_out,
      totalHours: record.total_hours,
      // Add these fields to track current status
      hasCheckedIn: !!record.check_in,
      hasCheckedOut: !!record.check_out,
      isCurrentlyCheckedIn: !!record.check_in && !record.check_out
    };
    
  }
});

  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  
  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const attendanceInfo = attendanceMap[dateStr];
  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
  
  let dayClass = 'no-data';
  let tooltipText = `No data for ${dateStr}`;
  
  if (attendanceInfo) {
    // MODIFICATION START
    // This logic differentiates between a "checked-in" state and a completed "present" state.
    if (attendanceInfo.hasCheckedIn && !attendanceInfo.hasCheckedOut) {
      dayClass = 'checked-in'; // A new class for the checked-in but not-out state.
      tooltipText = `Checked In at ${attendanceInfo.checkIn} - Not checked out yet`;
    } else if (attendanceInfo.hasCheckedIn && attendanceInfo.hasCheckedOut) {
      dayClass = 'present'; // The user has completed check-in and check-out.
      tooltipText = `Present - Check in: ${attendanceInfo.checkIn}, Check out: ${attendanceInfo.checkOut}`;
    } else if (attendanceInfo.isPresent === false) {
      dayClass = 'absent';
      tooltipText = `Absent on ${dateStr}`;
    }
    // MODIFICATION END
  }
    
    calendarDays.push(
  <div 
    key={day}
    className={`calendar-day ${dayClass} ${isToday ? 'today' : ''}`}
    title={tooltipText} // This basic title will be overridden by the more detailed onMouseEnter tooltip.
    onMouseEnter={(e) => {
      // This logic creates a more detailed tooltip on hover.
      const attendanceInfo = attendanceMap[dateStr];
      if (attendanceInfo) {
        const tooltip = document.createElement('div');
        tooltip.className = 'calendar-tooltip';
        
        let tooltipContent = ``;
        
        if (attendanceInfo.checkIn) {
          tooltipContent += `<div class="tooltip-time check-in">Check In: ${attendanceInfo.checkIn}</div>`;
        }
        
        if (attendanceInfo.checkOut) {
          tooltipContent += `<div class="tooltip-time check-out">Check Out: ${attendanceInfo.checkOut}</div>`;
        } else if (attendanceInfo.checkIn && !attendanceInfo.checkOut) {
          // Explicitly show that the user is still checked in.
          tooltipContent += `<div class="tooltip-time pending">⏳ Not checked out yet</div>`;
        }
        
        tooltip.innerHTML = tooltipContent;
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      } else {
        const tooltip = document.createElement('div');
        tooltip.className = 'calendar-tooltip';
        tooltip.innerHTML = `
          <div class="tooltip-date">${dateStr}</div>
          <div class="tooltip-no-data">No attendance data</div>
        `;
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
      }
    }}
    onMouseLeave={() => {
      const tooltip = document.querySelector('.calendar-tooltip');
      if (tooltip) tooltip.remove();
    }}
  >
    {day}
  </div>
);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate attendance summary
  // const presentDays = attendanceData.filter(record => record.is_present === true).length;
  // const absentDays = attendanceData.filter(record => record.is_present === false).length;
  // const totalDays = attendanceData.length;

    return (
  <Card 
    size="small"
    style={{ 
      height: '100%',
      border: 'none',
      boxShadow: 'none',
      background: 'transparent'
    }}
   styles={{ body: { padding: '12px', height: '100%',
      display: 'flex',
      flexDirection: 'column' } }}
  >
    {/* Calendar Header */}
    <Flex justify="space-between" align="center" style={{ marginBottom: '15px' }}>
      <Button 
        type="text" 
        icon={<LeftOutlined />}
        size="small"
        onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          color: '#64748b',
          fontSize: '14px'
        }}
      />
      <Title 
        level={5} 
        style={{ 
          margin: 0, 
          fontWeight: 600, 
          color: '#1e293b',
          fontSize: '16px'
        }}
      >
        {monthNames[month]} {year}
      </Title>
      <Button 
        type="text" 
        icon={<RightOutlined />}
        size="small"
        onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          color: '#64748b',
          fontSize: '14px'
        }}
      />
    </Flex>
    
    {/* Attendance Summary */}
    <Card 
      size="small"
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '15px'
      }}
      styles={{ body: { padding: '10px' } }}
    >
      <Row gutter={[16, 8]} justify="space-around">
        <Col span={8}>
          <Flex vertical align="center" gap={4}>
            <Text 
              style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                fontWeight: '500' 
              }}
            >
              Present:
            </Text>
            <Text 
              style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#22c55e' 
              }}
            >
              {presentDays}
            </Text>
          </Flex>
        </Col>
        <Col span={8}>
          <Flex vertical align="center" gap={4}>
            <Text 
              style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                fontWeight: '500' 
              }}
            >
              Absent:
            </Text>
            <Text 
              style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#ef4444' 
              }}
            >
              {absentDays}
            </Text>
          </Flex>
        </Col>
        <Col span={8}>
          <Flex vertical align="center" gap={4}>
            <Text 
              style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                fontWeight: '500' 
              }}
            >
              Total:
            </Text>
            <Text 
              style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#1e293b' 
              }}
            >
              {totalDays}
            </Text>
          </Flex>
        </Col>
      </Row>
    </Card>
    
    {/* Calendar Weekdays */}
    <div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '0px',
  marginBottom: '8px',
  marginRight:"10px"
}}>
  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
    <div key={day} style={{ textAlign: 'center' }}>
      <Text 
        style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#64748b',
          padding: '8px 3px'
        }}
      >
        {day}
      </Text>
    </div>
  ))}
</div>
    
    {/* Calendar Grid */}
    <div style={{ flex: 1, marginBottom: '15px' }}>
      <Row 
        gutter={[4, 4]} 
        style={{ 
          flex: 1, 
  marginBottom: '15px',
  display: 'grid', 
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '4px',
  alignItems: 'start'
        }}
      >
        {calendarDays}
      </Row>
    </div>
    
    {/* Calendar Legend */}
    <Flex justify="center" gap={15} style={{ fontSize: '12px' }}>
      <Flex align="center" gap={5}>
        <Badge 
          color="#22c55e" 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%' 
          }} 
        />
        <Text style={{ fontSize: '12px' }}>Present</Text>
      </Flex>
      <Flex align="center" gap={5}>
        <Badge 
          color="#ef4444" 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%' 
          }} 
        />
        <Text style={{ fontSize: '12px' }}>Absent</Text>
      </Flex>
      <Flex align="center" gap={5}>
        <Badge 
          color="#94a3b8" 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%' 
          }} 
        />
        <Text style={{ fontSize: '12px' }}>No Data</Text>
      </Flex>
    </Flex>
  </Card>
);
};

const handleEmailFolderChange = (folder) => {
  if (onSectionChange) {
    onSectionChange(folder); // ✅ Sidebar logic already handles routing + folder
  }
};

  const fuzzySearch = (query, options) => {
    if (!query) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return options
      .map(option => {
        const normalizedName = option.name.toLowerCase();
        const keywords = option.keywords || [];
        let score = 0;
        
        // Check exact match with name
        if (normalizedName === normalizedQuery) {
          score = 100;
        }
        // Check if name starts with query
        else if (normalizedName.startsWith(normalizedQuery)) {
          score = 90;
        }
        // Check if name contains query
        else if (normalizedName.includes(normalizedQuery)) {
          score = 80;
        }
        
        // Check keywords for exact matches
        for (const keyword of keywords) {
          const normalizedKeyword = keyword.toLowerCase();
          if (normalizedKeyword === normalizedQuery) {
            score = Math.max(score, 95);
          }
          else if (normalizedKeyword.startsWith(normalizedQuery)) {
            score = Math.max(score, 85);
          }
          else if (normalizedKeyword.includes(normalizedQuery)) {
            score = Math.max(score, 75);
          }
        }
        
        // Fuzzy matching - check if all characters exist in order (only if no other matches)
        if (score === 0) {
          let queryIndex = 0;
          for (let i = 0; i < normalizedName.length && queryIndex < normalizedQuery.length; i++) {
            if (normalizedName[i] === normalizedQuery[queryIndex]) {
              queryIndex++;
            }
          }
          if (queryIndex === normalizedQuery.length) {
            score = 40;
          }
        }
        
        return { ...option, score };
      })
      .filter(option => option.score > 0)
      .sort((a, b) => b.score - a.score);
  };

  const searchableSections = [
    { 
      name: 'admin', 
      section: 'admin', 
      keywords: ['admin', 'administrator', 'management', 'manage admin'] 
    },
    { 
      name: 'employee', 
      section: 'employee', 
      keywords: ['employee', 'staff', 'worker', 'manage employee'] 
    },
    { 
      name: 'hr', 
      section: 'Hr', 
      keywords: ['hr', 'human resources', 'recruitment', 'hiring'] 
    },
    { 
      name: 'job description', 
      section: 'job-description', 
      keywords: ['job description', 'jd', 'description', 'job desc'] 
    },
    { 
      name: 'job post', 
      section: 'job-post', 
      keywords: ['job post', 'posting', 'vacancy', 'post job', 'job posting'] 
    },
    { 
      name: 'job application', 
      section: 'job-application', 
      keywords: ['job application', 'application', 'apply job', 'applications'] 
    },
    { 
      name: 'job apply', 
      section: 'job-apply', 
      keywords: ['job apply', 'apply', 'apply for job', 'job applications'] 
    },
    { 
      name: 'interview', 
      section: 'interview-management', 
      keywords: ['interview', 'screening', 'interview management', 'interviews'] 
    },
    { 
      name: 'resume', 
      section: 'resume-list', 
      keywords: ['resume', 'cv', 'curriculum', 'resume list', 'resumes'] 
    },
    { 
      name: 'project timeline', 
      section: 'project-timeline', 
      keywords: ['project timeline', 'timeline', 'schedule', 'project schedule'] 
    },
    { 
      name: 'project budget', 
      section: 'project-budgeting', 
      keywords: ['project budget', 'budget', 'budgeting', 'finance', 'project finance'] 
    },
    { 
  name: 'employee attendance', 
  section: 'employee-attendance', 
  keywords: ['employee attendance', 'attendance', 'employee time', 'check in', 'check out'] 
}
  ];

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      
      const results = fuzzySearch(searchQuery, searchableSections);
      console.log('Search results:', results);
      
      if (results.length > 0) {
        console.log('Navigating to:', results[0].section);
        console.log('Match details:', {
          name: results[0].name,
          section: results[0].section,
          score: results[0].score
        });
        
        if (onSectionChange) {
          onSectionChange(results[0].section);
        }
        setSearchQuery('');
      } else {
        console.log('No results found for:', searchQuery);
        alert(`No results found for "${searchQuery}"`);
      }
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      const suggestions = fuzzySearch(value, searchableSections).slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Common header component to avoid repetition
  const renderHeader = (placeholder = "Search projects, users, or documents...") => (
    <header className="dashboard-header">
      <button 
        className="mobile-menu-button"

        onClick={onToggleSidebar}
        style={{ marginLeft: '10px' }}
      >
        <Menu size={24} />
      </button>
      
      <div className="search-container">
        <Search size={22} className="search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchInputChange}
          onKeyPress={handleSearch}
          className="search-input"
        />
        
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="search-suggestions">
            {searchSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="search-suggestion-item"
                onClick={() => handleSuggestionClick(suggestion.section)}
              >
                {suggestion.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-right">
        <button className="notification-button">
          <Bell size={22} />
          <span className="notification-badge"></span>
        </button>
        <ProfileSection userData={userData} onLogout={onLogout} storageKey={storageKey}/>
      </div>
    </header>
  );

  const statsData = [
    { 
      title: 'Total Users', 
      value: '12,543', 
      change: '+12.5%', 
      trend: 'up', 
      icon: Users, 
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    { 
      title: 'Revenue', 
      value: '$89,231', 
      change: '+8.2%', 
      trend: 'up', 
      icon: DollarSign, 
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    { 
      title: 'Orders', 
      value: '3,847', 
      change: '+23.1%', 
      trend: 'up', 
      icon: ShoppingCart, 
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    { 
      title: 'Conversion Rate', 
      value: '4.7%', 
      change: '-2.3%', 
      trend: 'down', 
      icon: TrendingUp, 
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    { 
  title: 'Attendance Calendar', 
  value: `${presentDays}/${totalDays}`, // Show present/total instead of empty
  change: `${((presentDays/totalDays) * 100 || 0).toFixed(1)}%`, // Show percentage
  trend: 'calendar', 
  icon: Calendar, 
  color: '#8b5cf6',
  bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  isCalendar: true,
  showOverview: false // Add this state flag
},
{ 
    title: 'Pay Slips', 
    value: 'Download', // or show count of available payslips
    change: 'Select Month', 
    trend: 'payslip', 
    icon: FilePdfOutlined, // Import this icon
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    isPayslip: true
  }
  ];

  const quickActions = [
    { title: 'Create New Project', icon: Zap, color: '#8b5cf6' },
    { title: 'Schedule Meeting', icon: Calendar, color: '#06b6d4' },
    { title: 'View Reports', icon: Activity, color: '#10b981' },
    { title: 'Manage Team', icon: Users, color: '#f59e0b' }
  ];

  const recentActivities = [
    { 
      action: 'New user registration', 
      detail: 'sarah.johnson@company.com', 
      time: '',
      type: 'user'
    },
    { 
      action: 'Order completed', 
      detail: 'Order #ORD-2024-1847 - $299.00', 
      time: '5 minutes ago',
      type: 'order'
    },
    { 
      action: 'Payment received', 
      detail: 'Stripe payment - $1,247.50', 
      time: '12 minutes ago',
      type: 'payment'
    },
    { 
      action: 'New message', 
      detail: 'Customer support inquiry', 
      time: '18 minutes ago',
      type: 'message'
    },
    { 
      action: 'System backup', 
      detail: 'Database backup completed successfully', 
      time: '25 minutes ago',
      type: 'system'
    }
  ];
if (activeSection === 'mails') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {renderHeader("Search emails...")}
      <main className="main-content">
        <EmailClient 
          userRole={userData?.role}
          activeFolder={activeEmailFolder}
          onFolderChange={handleEmailFolderChange}
          onAuthSuccess={() => setIsEmailAuthenticated(true)}
          onLogout={() => setIsEmailAuthenticated(false)}
          userData={userData} 
        />
      </main>
    </div>
  );
}



  // Handle email section clicks
  const handleEmailSectionClick = (section) => {
    if (section === 'inbox' || section === 'compose') {
      setActiveEmailFolder(section);
      onSectionChange('mails'); // Always go to mails section
    } else {
      onSectionChange(section);
    }
  };
  // Render different sections based on activeSection
  if (activeSection === 'admin') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search projects, users, or documents...")}
        <main className="main-content">
          <AdminManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }
  if (activeSection === 'project-budgeting') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search project budgeting...")}
        <main className="main-content">
          <ProjectBudgeting userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'employee') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search employees...")}
        <main className="main-content">
          <EmployeeManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }


  if (activeSection === 'Hr') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search HR data...")}
        <main className="main-content">
          <HRManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }
if (activeSection === 'employee-attendance') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job descriptions...")}
        <main className="main-content">
          <EmployeeAttendancePage userRole={userData?.role} />
        </main>
      </div>
    );
  }
  if (activeSection === 'leave-manage') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job descriptions...")}
        <main className="main-content">
 <LeaveManagementPage 
    userRole={userData?.role} 
    currentUserId={userData?.id} 
  />

        </main>
      </div>
    );
  }

  if (activeSection === 'company-calender') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job descriptions...")}
        <main className="main-content">
 <CompanyCalendarAndEventsPage
    userRole={userData?.role} 
    currentUserId={userData?.id} 
  />

        </main>
      </div>
    );
  }
  if (activeSection === 'job-description') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job descriptions...")}
        <main className="main-content">
          <JobDescriptionPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'exam-conduct-page') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search exam conduct...")}
        <main className="main-content">
          <ExamConductPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'on-campus-data') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search campus data...")}
        <main className="main-content">
          <CampusJobApplyPage userRole={userData?.role} />
        </main>
      </div>
    );
  }
if (activeSection === 'payroll') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search payroll...")}
        <main className="main-content">
          <PayrollManagement userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'selected-list') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search selected candidates...")}
        <main className="main-content">
          <SelectedCandidatesPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'job-post') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job posts...")}
        <main className="main-content">
          <JobPostPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'selected-list') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search selected candidates...")}
        <main className="main-content">
          <SelectedCandidatesPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'job-application') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job applications...")}
        <main className="main-content">
          <JobApplicationPage userRole={userData?.role} jobId={currentJobId} />
        </main>
      </div>
    );
  }

  if (activeSection === 'interview-management') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search interview management...")}
        <main className="main-content">
          <InterviewManagementPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'job-apply') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search job applications...")}
        <main className="main-content">
          <JobApplyPage userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'resume-list') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search resume list...")}
        <main className="main-content">
          <ResumeListPage userRole={userData?.role} />
        </main>
      </div>
    );
  }
  if (activeSection === 'direct-recruitement') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("direct recruitment...")}
        <main className="main-content">
          <DirectRecruitmentPage userRole={userData?.role} />
        </main>
      </div>
    );
  }
  if (activeSection === 'project-timeline') {
    return (
      <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderHeader("Search project timeline...")}
        <main className="main-content">
          <ProjectTimeline userRole={userData?.role} />
        </main>
      </div>
    );
  }

  if (activeSection === 'employee-attendance') {
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {renderHeader("Search employee attendance...")}
      <main className="main-content">
        <EmployeeAttendancePage userRole={userData?.role} />
      </main>
    </div>
  );
}
  // Default dashboard content
  return (
    <div className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {renderHeader()}
      
      <main className="main-content">
        <div className="content-container">
          {/* Welcome Header */}
          <div className="welcome-header">
            <h1 className="welcome-title">
              Welcome back, {userData?.name || userData?.displayName || 'User'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Here's what's happening with your business today. You have 3 new notifications.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
  {statsData.map((stat, index) => (
    <div
      key={index}
      className={`stats-card ${stat.isCalendar ? 'calendar-card' : ''} ${stat.isPayslip ? 'payslip-card' : ''} animate-${index + 1}`}
      onClick={stat.isPayslip ? () => setShowPayslipModal(true) : undefined}
      style={{ cursor: stat.isPayslip ? 'pointer' : 'default' }}
    >
      <div 
        className="stats-bg-decoration"
        style={{ background: stat.bgGradient }}
      />
      
      <div className="stats-header">
        <div 
          className="stats-icon"
          style={{
            background: stat.bgGradient,
            boxShadow: `0 8px 24px ${stat.color}30`
          }}
        >
          <stat.icon size={26} color="white" />
        </div>
        {!stat.isCalendar && (
          <div className={`stats-change ${stat.trend}`}>
            {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {stat.change}
          </div>
        )}
      </div>
      
      <h3 className="stats-title">
        {stat.title}
      </h3>
      
        {stat.isCalendar ? (
  <div className="stats-calendar-container">
    <div className="calendar-summary">
  <Row gutter={[16, 16]} justify="center" align="middle" style={{ height: '100%' }}>
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Statistic 
          value={presentDays} 
          valueStyle={{ 
            color: '#22c55e', 
            fontSize: '16px', 
            fontWeight: '700',
            lineHeight: 1.2
          }}
          suffix=""
        />
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b', 
          fontWeight: '500',
          marginTop: '4px'
        }}>
          Present
        </div>
      </div>
    </Col>
    
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Statistic 
          value={absentDays} 
          valueStyle={{ 
            color: '#ef4444', 
            fontSize: '16px', 
            fontWeight: '700',
            lineHeight: 1.2
          }}
          suffix=""
        />
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b', 
          fontWeight: '500',
          marginTop: '4px'
        }}>
          Absent
        </div>
      </div>
    </Col>
    
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Statistic 
          value={totalDays} 
          valueStyle={{ 
            color: '#1e293b', 
            fontSize: '16px', 
            fontWeight: '700',
            lineHeight: 1.2
          }}
          suffix=""
        />
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b', 
          fontWeight: '500',
          marginTop: '4px'
        }}>
          Total
        </div>
      </div>
    </Col>
    
    <Col xs={6} sm={6} md={6} lg={6}>
      <div style={{ textAlign: 'center' }}>
        <Button 
          type="primary"
          size="small"
          icon={<CalendarOutlined />}
          onClick={() => setShowCalendarModal(true)}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            height: '32px',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Overview
        </Button>
      </div>
    </Col>
  </Row>
</div>
  </div>
) : (
  <div className="stats-value">
    {stat.value}
  </div>
)}

    </div>
  ))}
</div>
 {/* Calendar Modal */}
      <Modal
        title="Attendance Calendar"
        open={showCalendarModal}
        onCancel={() => setShowCalendarModal(false)}
        footer={null}
        width={600}
        centered
      >
        {renderAttendanceCalendar()}
      </Modal>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">
              Quick Actions
            </h2>
            <div className="quick-actions-grid">
                  <div
      key="take-attendance"
      className="quick-action-card animate-1"
      onClick={() => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceData.find(d => d.date === todayStr);
  
  // Check current status and show appropriate message
  if (todayRecord && todayRecord.check_in && todayRecord.check_out) {
    Modal.info({
      title: 'Attendance Complete',
      content: `You have already completed both check-in (${todayRecord.check_in}) and check-out (${todayRecord.check_out}) for today.`,
    });
    return; // Don't open camera modal
  }
  
  // Set attendance type based on current status
  if (todayRecord && todayRecord.check_in && !todayRecord.check_out) {
    setAttendanceType('check-out');
  } else {
    setAttendanceType('check-in');
  }
  
  // Reset all states and open modal
  setHasStartedDetection(false);
  setIsCameraModalVisible(true);
  setVerificationError('');
  setShowRetryButton(false);
  setIsProcessing(false);
  setIsVerifying(false);
  setIsFaceDetected(false);
  setAlreadyCheckedIn(false);
}}

    >
      <div className="quick-action-content">
        <div
          className="quick-action-icon"
          style={{
            backgroundColor: '#3b82f6',
            boxShadow: `0 4px 15px #3b82f630`
          }}
        >
          <Camera size={22} color="white" />
        </div>
        <span className="quick-action-title">
          Take Attendance
        </span>
      </div>
    </div>

              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className={`quick-action-card animate-${index + 1}`}
                >
                  <div className="quick-action-content">
                    <div 
                      className="quick-action-icon"
                      style={{
                        backgroundColor: action.color,
                        boxShadow: `0 4px 15px ${action.color}30`
                      }}
                    >
                      <action.icon size={22} color="white" />
                    </div>
                    <span className="quick-action-title">
                      {action.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

       <Modal
  title={
    <div style={{ 
      textAlign: 'center', 
      padding: '10px 0',
      borderBottom: '1px solid #f0f0f0',
      marginBottom: '20px'
    }}>
      <FilePdfOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
      <span style={{ fontSize: '18px', fontWeight: '600' }}>Download Pay Slips</span>
    </div>
  }
  open={showPayslipModal}
  onCancel={() => setShowPayslipModal(false)}
  footer={null}
  width={700}
  centered
  style={{ borderRadius: '12px' }}
  styles={{
    body: { padding: '20px 0' }  // Changed from bodyStyle to styles.body
  }}
>
  <div style={{ padding: '20px 0' }}>
    {/* Month Selector */}
    <div style={{ marginBottom: '24px' }}>
      <Text strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
        Select Month:
      </Text>
      <DatePicker
        picker="month"
        value={selectedPayslipMonth}
        onChange={(date) => {
          setSelectedPayslipMonth(date);
        }}
        style={{ 
          width: '100%', 
          height: '45px',
          borderRadius: '8px'
        }}
        placeholder="Select month to view payslips"
      />
    </div>

    {/* Payslips List */}
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {userPayslips.filter(payslip => 
        dayjs(payslip.pay_period).format('YYYY-MM') === selectedPayslipMonth.format('YYYY-MM')
      ).map(payslip => (
        <Card 
          key={payslip.id} 
          size="small"
          style={{ 
            marginBottom: '16px',
            borderRadius: '8px',
            border: '1px solid #e6f7ff',
            background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)'
          }}
          styles={{ body: { padding: '16px' } }}
        >
          <Row gutter={[16, 8]} align="middle">
            <Col xs={24} sm={14}>
              <div>
                <Text strong style={{ fontSize: '16px', color: '#1e293b' }}>
                  {payslip.employee_name}
                </Text>
                <div style={{ marginTop: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    Pay Period: {dayjs(payslip.pay_period).format('MMMM YYYY')}
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={5}>
              <Statistic
                title="Net Pay"
                value={payslip.net_pay}
                prefix="₹"
                valueStyle={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  color: '#059669'
                }}
              />
            </Col>
            <Col xs={12} sm={5}>
              <Button 
                type="primary" 
                onClick={() => downloadUserPayslip(payslip)}
                icon={<FilePdfOutlined />}
                style={{
                  height: '40px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
                }}
                block
              >
                Download
              </Button>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
    
    {/* Empty State */}
    {userPayslips.filter(payslip => 
      dayjs(payslip.pay_period).format('YYYY-MM') === selectedPayslipMonth.format('YYYY-MM')
    ).length === 0 && (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        background: '#fafafa',
        borderRadius: '8px',
        border: '2px dashed #d9d9d9'
      }}>
        <FilePdfOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
        <Title level={4} type="secondary">
          No payslip found
        </Title>
        <Text type="secondary">
          No payslip available for {selectedPayslipMonth.format('MMMM YYYY')}
        </Text>
      </div>
    )}
  </div>
</Modal>

          {/* Recent Activity */}
          <div className="activity-card">
            <div className="activity-header">
              <h2 className="section-title">
                Recent Activity
              </h2>
              <span className="activity-subtitle">
                Last 24 hours
              </span>
            </div>
            
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-dot ${activity.type}`} />
                  <div className="activity-content">
                    <div className="activity-action">
                      {activity.action}
                    </div>
                    <div className="activity-detail">
                      {activity.detail}
                    </div>
                  </div>
                  <div className="activity-time">
                    <Clock size={14} />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
<Modal
  title={`Take Attendance via Face Recognition - ${
    attendanceType === 'check-in' ? 'Check In' : 
    attendanceType === 'check-out' ? 'Check Out' : 'Completed'
  }`}
  open={isCameraModalVisible}
  onCancel={() => {
    stopCamera();
    setIsCameraModalVisible(false);
    setIsProcessing(false);
    setIsVerifying(false);
    setAttendanceType('check-in');
    if (faceDetectionInterval) {
      clearInterval(faceDetectionInterval);
      setFaceDetectionInterval(null);
    }
    setHasStartedDetection(false);
    setIsFaceDetected(false);
  }}
  centered
  footer={null}
  width="100%"
  style={{ 
    maxWidth: '680px',
    margin: '0 16px'
  }}
  styles={{
    body: { padding: '16px 8px' }  // Changed from bodyStyle to styles.body
  }}
>
  <div style={{ padding: '20px 0' }}>
    {alreadyCheckedIn ? (
      <Alert
        message="Already Checked In"
        description="You have already marked your attendance for today."
        type="success"
        showIcon
      />
    ) : (
      <>
        <div style={{ 
  position: 'relative', 
  width: '100%', // Changed from fixed 640px
  maxWidth: '640px', // Add max width
  height: 'auto', // Changed from fixed 480px
  aspectRatio: '4/3', // Maintain aspect ratio
  background: '#000', 
  borderRadius: '8px', 
  overflow: 'hidden', 
  margin: '0 auto',
  border: isFaceDetected ? '3px solid #52c41a' : '3px solid #ff4d4f'
}}>
  {isVerifying && (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <Spin size="large" />
      <span style={{ marginTop: '20px', fontSize: '16px' }}>Verifying your identity...</span>
    </div>
  )}
  
  {!isCameraOn ? (
    // Camera OFF state - show button to turn on
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'white',
      background: '#1f1f1f'
    }}>
      <Camera size={64} style={{ marginBottom: '20px' }} />
      <Button 
        type="primary" 
        size="large"
        onClick={startCamera}
        icon={<Camera />}
        style={{ 
          height: '50px',
          fontSize: '16px',
          borderRadius: '8px'
        }}
      >
        Turn On Camera
      </Button>
    </div>
  ) : (
    // Camera ON state - show webcam
    <Webcam
  audio={false}
  ref={webcamRef}
  screenshotFormat="image/jpeg"
  width="100%" // Changed from fixed width
  height="100%" // Changed from fixed height
  onUserMedia={(stream) => {
    console.log('Camera initialized');
    setCameraStream(stream);
    if (hasStartedDetection || isProcessing) {
      return;
    }
    
    const checkAndStart = () => {
      if (isModelLoaded && webcamRef.current?.video?.readyState === 4 && !hasStartedDetection) {
        setHasStartedDetection(true);
        setTimeout(startFaceDetection, 1000);
      } else if (!hasStartedDetection) {
        setTimeout(checkAndStart, 500);
      }
    };
    checkAndStart();
  }}
  videoConstraints={{ 
    width: { ideal: 1280, min: 640 }, // Add min width
    height: { ideal: 720, min: 480 }, // Add min height
    facingMode: "user" 
  }}
  style={{ 
    width: '100%',
    height: '100%',
    objectFit: 'cover' 
  }}
/>
  )}
</div>

{/* Camera Controls - Show only when camera is on */}
{isCameraOn && (
  <Row gutter={[8, 8]} justify="center" style={{ marginTop: '15px' }}>
    <Col xs={24} sm={12} style={{ textAlign: 'center' }}>
      <Button 
        danger
        onClick={stopCamera}
        icon={<Camera />}
        size="large"
        block // Make button full width on mobile
      >
        Turn Off Camera
      </Button>
    </Col>
    <Col xs={24} sm={12} style={{ textAlign: 'center' }}>
      <span style={{ 
        fontSize: '14px', // Slightly smaller for mobile
        color: isFaceDetected ? '#52c41a' : '#ff4d4f',
        fontWeight: '500',
        display: 'block', // Stack on mobile
        marginTop: '8px'
      }}>
        {attendanceType === 'completed' ? 
          '✅ Attendance Complete for Today' :
          isFaceDetected ? 
            `✅ Face Detected - ${attendanceType === 'check-in' ? 'Checking In' : 'Checking Out'}...` : 
            `❌ Please position your face for ${attendanceType === 'check-in' ? 'Check In' : 'Check Out'}`
        }
      </span>
    </Col>
  </Row>
)}

        {verificationError && (
          <Alert message={verificationError} type="error" showIcon style={{ marginTop: '20px' }} />
        )}
      </>
    )}
  </div>
  {verificationError && (
  <div style={{ marginTop: '20px' }}>
    <Alert message={verificationError} type="error" showIcon />
    {showRetryButton && (
      <Button
        type="primary"
        size="large"
        block
        onClick={handleRetry}
        style={{ marginTop: '15px', height: '50px', fontSize: '18px' }}
      >
        Try Again
      </Button>
    )}
  </div>
)}
</Modal>

    </div>
  );
};

export default Dashboard;
