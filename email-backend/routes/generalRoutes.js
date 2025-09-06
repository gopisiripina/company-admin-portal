const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js')
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for backend operations
);



const handleAutoMarkAbsent = async (targetDate = null) => {
  try {
    // Use provided date or yesterday if none provided
    const dateToProcess = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]; // Yesterday's date in YYYY-MM-DD format
    
    console.log(`Processing auto-absent for date: ${dateToProcess}`);

    // Get all employees (excluding admins/hr/superadmins)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .in('employee_type', ['full-time', 'internship', 'temporary'])
      .not('role', 'in', '(superadmin,admin,hr)');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Get existing attendance records for the date
    const { data: existingAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('user_id')
      .eq('date', dateToProcess);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      throw attendanceError;
    }

    // Find employees without attendance records
    const employeesWithRecords = existingAttendance?.map(record => record.user_id) || [];
    const employeesWithoutRecords = allUsers?.filter(user => 
      !employeesWithRecords.includes(user.id)
    ) || [];

    if (employeesWithoutRecords.length === 0) {
      console.log('All employees already have attendance records for', dateToProcess);
      return {
        success: true,
        message: 'All employees already have attendance records',
        count: 0,
        date: dateToProcess
      };
    }

    // Create absent records
    const absentRecords = employeesWithoutRecords.map(employee => ({
      user_id: employee.id,
      date: dateToProcess,
      check_in: null,
      check_out: null,
      total_hours: 0,
      is_present: false
    }));

    const { error: insertError } = await supabase
      .from('attendance')
      .insert(absentRecords);

    if (insertError) {
      console.error('Error inserting absent records:', insertError);
      throw insertError;
    }
    
    console.log(`Marked ${employeesWithoutRecords.length} employees as absent for ${dateToProcess}`);
    
    return {
      success: true,
      message: `Marked ${employeesWithoutRecords.length} employees as absent`,
      count: employeesWithoutRecords.length,
      date: dateToProcess,
      employees: employeesWithoutRecords.map(emp => emp.name)
    };
    
  } catch (error) {
    console.error('Error in handleAutoMarkAbsent:', error);
    throw error;
  }
};

// Route to manually trigger auto-absent (for testing) - without date (uses yesterday)
router.post('/trigger-auto-absent', async (req, res) => {
  try {
    const result = await handleAutoMarkAbsent();
    
    res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Manual auto-absent trigger failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark employees as absent',
      error: error.message
    });
  }
});

// Route to manually trigger auto-absent with specific date
router.post('/trigger-auto-absent/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await handleAutoMarkAbsent(date);
    
    res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Manual auto-absent trigger failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark employees as absent',
      error: error.message
    });
  }
});

// Route to get auto-absent status/info
router.get('/auto-absent-info', async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    // Check how many employees were auto-marked absent yesterday
    const { data: absentRecords, error } = await supabase
      .from('attendance')
      .select('user_id, users(name)')
      .eq('date', yesterday)
      .eq('is_present', false)
      .is('check_in', null);

    if (error) throw error;

    res.status(200).json({
      success: true,
      date: yesterday,
      autoAbsentCount: absentRecords?.length || 0,
      employees: absentRecords?.map(record => record.users?.name) || []
    });

  } catch (error) {
    console.error('Error getting auto-absent info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-absent information',
      error: error.message
    });
  }
});


// Create transporter function with Hostinger defaults
function createTransporter(senderEmail, senderPassword, smtpServer = 'smtp.hostinger.com', smtpPort = 587) {
    return nodemailer.createTransport({
        host: smtpServer,
        port: smtpPort,
        secure: false,
        auth: {
            user: senderEmail,
            pass: senderPassword
        }, connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: true,
        maxConnections: 1,
        rateDelta: 20000,
        rateLimit: 5,
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        requireTLS: true,
        connectionTimeout: 60000,
        socketTimeout: 60000,
        debug: true // Enable debug for troubleshooting
    });
}



const multerStorage = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Root route
router.get('/', (req, res) => {
    res.send("Hello World");
});

router.get('/test', (req, res) => {
    res.json({ message: 'General routes working!' });
});

// SEND EMAIL ENDPOINT
router.post('/send-email', async (req, res) => {
  try {
    const data = req.body;
    console.log("Received data:", data);

    // Always use environment variables for sensitive fields!
    const senderEmail = process.env.SEND_EMAIL;
    const senderPassword = process.env.SEND_PASSWORD;
    const smtpServer = process.env.SMTP_SERVER || "smtp.hostinger.in";
    const smtpPort = process.env.SMTP_PORT || 587;

    const {
      recipientEmail,
      subject = 'Welcome - Your Account Credentials',
      templateData = {}
    } = data;

    // Validate required client fields
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: recipientEmail"
      });
    }

        // HTML template
        let htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome - Your Account Credentials</title>
</head>
<body style="margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Welcome to {{company_name}}!
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
                Your account has been created successfully
            </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0; line-height: 1.5;">
                Hi <strong>{{to_name}}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #333333; margin: 0 0 30px 0; line-height: 1.5;">
                Welcome to our platform! Your <strong>{{user_role}}</strong> account has been created and you can now access the system using the credentials below.
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                    🔐 Your Login Credentials
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <strong style="color: #495057; display: inline-block; width: 80px;">Email:</strong>
                    <span style="background-color: #ffffff; padding: 8px 12px; border-radius: 4px; border: 1px solid #dee2e6; font-family: 'Courier New', monospace; font-size: 14px;">{{user_email}}</span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong style="color: #495057; display: inline-block; width: 80px;">Password:</strong>
                    <span style="background-color: #ffffff; padding: 8px 12px; border-radius: 4px; border: 1px solid #dee2e6; font-family: 'Courier New', monospace; font-size: 14px;">{{user_password}}</span>
                </div>
                
                <div>
                    <strong style="color: #495057; display: inline-block; width: 80px;">Role:</strong>
                    <span style="background-color: #e7f3ff; color: #0066cc; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; font-weight: 600;">{{user_role}}</span>
                </div>
            </div>

            <!-- Login Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{website_link}}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Login to Your Account
                </a>
            </div>

            <!-- Security Notice -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 25px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.4;">
                    <strong>🔒 Security Notice:</strong> Please change your password after your first login for security purposes. Keep your credentials safe and do not share them with others.
                </p>
            </div>

            <p style="font-size: 16px; color: #333333; margin: 30px 0 20px 0; line-height: 1.5;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>

            <p style="font-size: 16px; color: #333333; margin: 0; line-height: 1.5;">
                Best regards,<br>
                <strong>{{from_name}}</strong><br>
                <span style="color: #666666;">{{company_name}} Team</span>
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 40px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                This is an automated message. Please do not reply to this email.
            </p>
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 12px;">
                © 2024 {{company_name}}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;

        // Replace template variables
        Object.keys(templateData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlTemplate = htmlTemplate.replace(regex, templateData[key] || '');
    });

    // Call your utility to create the transporter
    const transporter = createTransporter(
      senderEmail,
      senderPassword,
      smtpServer,
      smtpPort
    );

    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject,
      html: htmlTemplate
    };

    console.log("Sending email...");
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      recipient: recipientEmail
    });

  } catch (error) {
    console.error("Exception occurred:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const pay_upload = multer({ storage: multer.memoryStorage() });
router.post('/payslip', pay_upload.single('payslip'), async (req, res) => {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const {
                employeeName,
                employeeEmail,
                companyName,
                payPeriod,
                senderEmail = process.env.PAYSLIP_EMAIL,
                senderPassword = process.env.PAYSLIP_PASSWORD,
                smtpServer = 'smtp.hostinger.in',
                smtpPort = 587
            } = req.body;

            console.log(`Attempt ${attempt}: Received payslip data:`, req.body);

            if (!employeeName || !employeeEmail || !req.file) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields or PDF file"
                });
            }

            const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);
            
            // ADD THIS EMAIL TEMPLATE HERE:
            const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payslip - ${payPeriod}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .greeting {
                        font-size: 18px;
                        margin-bottom: 20px;
                        color: #2c3e50;
                    }
                    .info-box {
                        background: #f8f9fa;
                        border-left: 4px solid #667eea;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 5px;
                    }
                    .footer {
                        background: #2c3e50;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 14px;
                    }
                    .attachment-note {
                        background: #e8f5e8;
                        border: 1px solid #4caf50;
                        border-radius: 5px;
                        padding: 15px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .attachment-icon {
                        font-size: 24px;
                        color: #4caf50;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>💼 Payslip Notification</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">${companyName || 'My Access'}</p>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            Dear ${employeeName},
                        </div>
                        
                        <p>We hope this email finds you well. Your payslip for <strong>${payPeriod}</strong> is now ready and attached to this email.</p>
                        
                        <div class="info-box">
                            <strong>📋 Payslip Details:</strong><br>
                            <strong>Employee:</strong> ${employeeName}<br>
                            <strong>Pay Period:</strong> ${payPeriod}<br>
                            <strong>Generated Date:</strong> ${new Date().toLocaleDateString()}<br>
                            <strong>Company:</strong> ${companyName || 'My Access'}
                        </div>
                        
                        <div class="attachment-note">
                            <div class="attachment-icon">📎</div>
                            <strong>Your payslip is attached as a PDF file</strong><br>
                            <small>Please download and save this document for your records</small>
                        </div>
                        
                        <p>If you have any questions regarding your payslip or notice any discrepancies, please don't hesitate to contact the HR department.</p>
                        
                        <p style="margin-top: 30px;">
                            Best regards,<br>
                            <strong>HR Department</strong><br>
                            ${companyName || 'My Access'}
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
                        <p style="margin: 5px 0 0 0; opacity: 0.8;">© ${new Date().getFullYear()} ${companyName || 'My Access'}. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            // Mail options (same as before)
            const mailOptions = {
                from: {
                    name: companyName || 'HR Department',
                    address: senderEmail
                },
                to: employeeEmail,
                subject: `Payslip for ${payPeriod} - ${employeeName}`,
                html: emailTemplate, // Now this is defined
                attachments: [
                    {
                        filename: `Payslip_${employeeName.replace(/\s+/g, '_')}_${payPeriod.replace(/\s+/g, '_')}.pdf`,
                        content: req.file.buffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            console.log(`Attempt ${attempt}: Sending payslip email using SMTP: ${smtpServer}:${smtpPort}`);
            const info = await transporter.sendMail(mailOptions);
            
            console.log(`Attempt ${attempt}: Email sent successfully:`, info.messageId);

            return res.status(200).json({
                success: true,
                message: `Payslip sent successfully on attempt ${attempt}`,
                messageId: info.messageId,
                recipient: employeeEmail,
                payPeriod: payPeriod,
                sentFrom: senderEmail,
                attempt: attempt
            });

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            lastError = error;
            
            // If it's the last attempt, don't wait
            if (attempt < maxRetries) {
                console.log(`Waiting 5 seconds before retry attempt ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
            }
        }
    }

    // All attempts failed
    console.error('All retry attempts failed:', lastError);
    
    let errorMessage = 'Failed to send payslip email after multiple attempts';
    if (lastError.code === 'EMESSAGE' && lastError.response?.includes('timeout')) {
        errorMessage = 'Email server timeout. The PDF might be too large or server is busy.';
    } else if (lastError.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. Please check credentials.';
    }

    res.status(500).json({
        success: false,
        error: errorMessage,
        attempts: maxRetries,
        details: process.env.NODE_ENV === 'development' ? lastError.message : undefined
    });
});


// FIXED SEND JOB OFFER LETTER ENDPOINT
router.post('/send-job-offer', async (req, res) => {
  try {
    const {
      senderEmail = process.env.SEND_JOB_OFFER_EMAIL,
      senderPassword = process.env.SEND_JOB_OFFER_PASSWORD,
      recipientEmail,
      subject,
      templateData = {},
      attachments = [],
      smtpServer = process.env.SMTP_HOST || 'smtp.hostinger.in',
      smtpPort = process.env.SMTP_PORT || 587
    } = req.body;

    console.log('Received job offer request for:', recipientEmail);
    console.log('Attachments count:', attachments.length);

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: recipientEmail"
      });
    }

    // Validate template data
    const jobTitle = templateData.job_title || 'Job Position';
    const companyName = templateData.company_name || 'Our Company';
    const finalSubject = subject || `Job Offer - ${jobTitle} Position at ${companyName}`;

    // Email template
    let htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Job Offer from {{company_name}}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6;
        }
        .container { 
            max-width: 650px; 
            margin: auto; 
            background-color: white; 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
            padding: 30px; 
            background-color: #f8f9fa; 
            border-bottom: 1px solid #e0e0e0; 
            text-align: center;
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            color: #333; 
        }
        .header p { 
            margin: 5px 0 0; 
            font-size: 16px; 
            color: #555; 
        }
        .content { 
            padding: 30px; 
        }
        .content p { 
            line-height: 1.6; 
            margin-bottom: 16px;
        }
        .offer-details { 
            background-color: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 25px 0; 
        }
        .offer-details h4 { 
            margin-top: 0; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 10px; 
        }
        .offer-details table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        .offer-details td { 
            padding: 8px 0; 
            vertical-align: top; 
        }
        .offer-details .label { 
            font-weight: bold; 
            width: 150px; 
            color: #343a40; 
        }
        .cta-section { 
            background-color: #e6f7ff; 
            border: 1px solid #91d5ff; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 6px; 
            text-align: center; 
        }
        .footer { 
            padding: 30px; 
            text-align: left; 
            font-size: 14px; 
            color: #555; 
            border-top: 1px solid #e0e0e0; 
        }
        .highlight { 
            color: #1890ff; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Job Offer</h1>
            <p><strong>{{company_name}}</strong></p>
        </div>
        <div class="content">
            <p>Dear <strong>{{to_name}}</strong>,</p>
            
            <p>Following our recent discussions, we are very pleased to formally offer you the position of <strong class="highlight">{{job_title}}</strong> with {{company_name}}.</p>
            
            <p>We were highly impressed with your qualifications and experience, and we believe you will be an excellent addition to our team. We are excited about the potential contributions you will bring to our organization.</p>
            
            <div class="offer-details">
                <h4>📋 Key Terms of Offer</h4>
                <table>
                    <tr><td class="label">Position:</td><td><strong>{{job_title}}</strong></td></tr>
                    {{#if salary_amount}}
                    
                    {{/if}}
                    <tr><td class="label">Start Date:</td><td><strong>{{joining_date}}</strong></td></tr>
                    <tr><td class="label">Work Location:</td><td><strong>{{work_location}}</strong></td></tr>
                    {{#if reporting_manager}}
                    <tr><td class="label">Reporting Manager:</td><td><strong>{{reporting_manager}}</strong></td></tr>
                    {{/if}}
                </table>
            </div>

            {{#if additional_benefits}}
            <div class="offer-details">
                <h4> Additional Benefits</h4>
                <p>{{additional_benefits}}</p>
            </div>
            {{/if}}

            {{#if message}}
            <div style="background-color: #fff7e6; border-left: 4px solid #faad14; padding: 16px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Personal Message:</strong></p>
                <p style="margin: 8px 0 0; font-style: italic;">{{message}}</p>
            </div>
            {{/if}}

            <div class="cta-section">
                <h4 style="margin-top:0;">📝 Next Steps</h4>
                <p>This offer is contingent upon the successful completion of any pre-employment checks and will remain open until <strong>{{offer_valid_until}}</strong>.</p>
                <p>📎 <strong>Please find the detailed offer letter attached to this email.</strong></p>
                <p>To accept this offer, please reply to this email confirming your acceptance. If you have any questions, please feel free to contact us directly.</p>
            </div>
        </div>
        <div class="footer">
            <p>We look forward to welcoming you to our team! 🎉</p>
            <p>Warm regards,<br>
            <strong>The HR Team</strong><br>
            {{company_name}}<br>
            {{hr_contact}}</p>
        </div>
    </div>
</body>
</html>`;

    // Replace template variables - FIXED VERSION
    Object.keys(templateData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = templateData[key] || '';
      htmlTemplate = htmlTemplate.replace(regex, value);
    });

    // Handle conditional sections
    htmlTemplate = htmlTemplate.replace(/{{#if salary_amount}}[\s\S]*?{{\/if}}/g, 
      templateData.salary_amount ? 
        `<tr><td class="label">Annual Salary:</td><td><strong>${templateData.salary_amount}</strong></td></tr>` : 
        ''
    );

    htmlTemplate = htmlTemplate.replace(/{{#if reporting_manager}}[\s\S]*?{{\/if}}/g, 
      templateData.reporting_manager ? 
        `<tr><td class="label">Reporting Manager:</td><td><strong>${templateData.reporting_manager}</strong></td></tr>` : 
        ''
    );

    htmlTemplate = htmlTemplate.replace(/{{#if additional_benefits}}[\s\S]*?{{\/if}}/g, 
      templateData.additional_benefits ? 
        `<div class="offer-details"><h4>Additional Benefits</h4><p>${templateData.additional_benefits}</p></div>` : 
        ''
    );

    htmlTemplate = htmlTemplate.replace(/{{#if message}}[\s\S]*?{{\/if}}/g, 
      templateData.message ? 
        `<div style="background-color: #fff7e6; border-left: 4px solid #faad14; padding: 16px; margin: 20px 0;"><p style="margin: 0;"><strong>Personal Message:</strong></p><p style="margin: 8px 0 0; font-style: italic;">${templateData.message}</p></div>` : 
        ''
    );

    // Create transporter
    const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);
    
    // Prepare mail options
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: finalSubject,
      html: htmlTemplate,
      attachments: []
    };

    // FIXED: Process attachments properly
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      console.log('Processing attachments...');
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        
        try {
          if (attachment.content && attachment.filename) {
            // This is base64 content from frontend
            console.log(`Processing attachment ${i + 1}: ${attachment.filename}`);
            console.log('Content type:', attachment.contentType);
            console.log('Content length:', attachment.content.length);
            
            mailOptions.attachments.push({
              filename: attachment.filename,
              content: Buffer.from(attachment.content, 'base64'),
              contentType: attachment.contentType || 'application/pdf'
            });
            
            console.log(`Attachment ${i + 1} processed successfully`);
          } else if (typeof attachment === 'string') {
            // This is a URL or file path (legacy support)
            if (attachment.startsWith('http')) {
              const response = await axios.get(attachment, { responseType: 'stream' });
              const filename = path.basename(attachment) || 'attachment';
              mailOptions.attachments.push({
                filename: filename,
                content: response.data
              });
            } else {
              mailOptions.attachments.push({
                filename: path.basename(attachment),
                path: attachment
              });
            }
          }
        } catch (attachmentError) {
          console.error(`Error processing attachment ${i + 1}:`, attachmentError);
          // Continue with other attachments rather than failing completely
        }
      }
      
      console.log(`Total attachments to send: ${mailOptions.attachments.length}`);
    }

    // Send email
    console.log(`Sending job offer email to: ${recipientEmail}`);
    console.log(`Using SMTP: ${smtpServer}:${smtpPort} with email: ${senderEmail}`);
    console.log(`Subject: ${finalSubject}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);

    res.status(200).json({
      success: true,
      message: "Job offer email sent successfully",
      messageId: info.messageId,
      recipient: recipientEmail,
      subject: finalSubject,
      attachmentCount: mailOptions.attachments.length
    });

  } catch (error) {
    console.error('Error sending job offer:', error);
    
    // Better error logging
    if (error.code === 'EAUTH') {
      console.error('Authentication failed - check email credentials');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed - check SMTP settings');
    } else if (error.code === 'EMESSAGE') {
      console.error('Message composition failed - check template data');
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

    // 2. SEND RECRUITMENT EMAIL ENDPOINT
    router.post('/send-recruitment-email', async (req, res) => {
    try {
        const data = req.body;
        const {
            senderEmail = process.env.SEND_RECRUITMENT_EMAIL,
            senderPassword = process.env.SEND_RECRUITMENT_PASSWORD,
            recipientEmail,
            subject = 'Campus Recruitment Exam Invitation',
            smtpServer = process.env.SMTP_HOST,
            smtpPort = process.env.SMTP_PORT,
            templateData = {}
        } = data;

        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required field: recipientEmail"
            });
        }

        // Campus Recruitment HTML template
        let htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: white;">
        <div style="background-color: #1890ff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Campus Recruitment Exam Invitation</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>{{to_name}}</strong>,</p>
            
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                You are invited to participate in the campus recruitment exam for the following position:
            </p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #1890ff;">
                <p style="margin: 5px 0;"><strong>Exam Title:</strong> {{exam_title}}</p>
                <p style="margin: 5px 0;"><strong>Job ID:</strong> {{job_id}}</p>
                <p style="margin: 5px 0;"><strong>College:</strong> {{college}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{exam_link}}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                    Start Exam
                </a>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <h3 style="margin-top: 0; color: #856404;">Important Instructions:</h3>
                <ul style="margin-bottom: 0; color: #856404;">
                    <li>Ensure you have a stable internet connection</li>
                    <li>Complete the exam within the given time limit</li>
                    <li>Do not refresh the page during the exam</li>
                    <li>Do not close the browser tab until submission</li>
                    <li>Contact support if you face any technical issues</li>
                </ul>
            </div>
            
            <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
                <p style="font-size: 14px; line-height: 1.6;">{{message}}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    HR Team<br>
                    Campus Recruitment Department
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

        // Replace template variables
        Object.keys(templateData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlTemplate = htmlTemplate.replace(regex, templateData[key] || '');
        });

        const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);
        
        console.log(`Sending recruitment email using SMTP: ${smtpServer}:${smtpPort} with email: ${senderEmail}`);
        await transporter.sendMail({
            from: senderEmail,
            to: recipientEmail,
            subject: subject,
            html: htmlTemplate
        });

        res.status(200).json({
            success: true,
            message: "Campus recruitment email sent successfully",
            recipient: recipientEmail
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// SEND APPRAISAL LETTER ENDPOINT
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper function to create transporter (similar to your job offer endpoint)
function createTransporter(email, password, smtpHost, smtpPort) {
  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: false, // true for 465, false for other ports
    auth: {
      user: email,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

router.post('/send-appraisal', upload.single('appraisal'), async (req, res) => {
  try {
    const {
      senderEmail = process.env.SEND_EMAIL,
      senderPassword = process.env.SEND_PASSWORD,
      recipientEmail,
      smtpServer = process.env.SMTP_HOST,
      smtpPort = process.env.SMTP_PORT
    } = req.body;

    // Parse templateData if it's a JSON string
    let templateData = {};
    try {
      templateData = req.body.templateData ? JSON.parse(req.body.templateData) : {};
    } catch (parseError) {
      console.error('Error parsing templateData:', parseError);
      templateData = req.body.templateData || {};
    }

    const employeeName = templateData.employee_name || 'Employee';
    const companyName = templateData.company_name || 'Our Company';
    const effectiveDate = templateData.effective_date || 'Current Period';
    const subject = req.body.subject || `🎉 Performance Appraisal Letter - ${effectiveDate}`;

    const appraisalPDF = req.file;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: recipientEmail"
      });
    }

    if (!appraisalPDF) {
      return res.status(400).json({
        success: false,
        error: 'No appraisal letter attached'
      });
    }

    // Appraisal Letter HTML template
    let htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-content { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #10b981; }
        .congratulations-banner { background-color: #10b981; color: white; padding: 10px 20px; border-radius: 8px; display: inline-block; margin-bottom: 15px; }
        .company-name { color: #2d5a4a; margin: 0; font-size: 24px; }
        .content { margin-bottom: 30px; }
        .greeting { color: #2d5a4a; margin-bottom: 15px; }
        .highlight-box { background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .highlight-text { margin: 0; font-size: 18px; color: #2d5a4a; }
        .call-to-action { text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
        .content-text { line-height: 1.6; color: #333; font-size: 16px; }
        .attachment-info { margin: 0 0 15px 0; color: #666; font-size: 14px; }
        .contact-info { margin: 0; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-content">
            <!-- Header -->
            <div class="header">
                <div class="congratulations-banner">
                    <h2 style="margin: 0; font-size: 18px;">🎉 CONGRATULATIONS! 🎉</h2>
                </div>
                <h1 class="company-name">{{company_name}}</h1>
            </div>

            <!-- Content -->
            <div class="content">
                <h3 class="greeting">Dear {{employee_name}},</h3>
                
                <p class="content-text">
                    We are delighted to inform you that your performance appraisal has been completed for the period ending <strong>{{effective_date}}</strong>.
                </p>
                
                <div class="highlight-box">
                    <p class="highlight-text">
                        <strong>🎯 Your dedication and hard work have earned you a salary increase of ₹{{salary_increase}}!</strong>
                    </p>
                </div>
                
                <p class="content-text">
                    Please find your detailed appraisal letter attached to this email. This document contains all the specifics regarding your performance review and compensation updates.
                </p>

                <h4 style="color: #2d5a4a;">📋 Appraisal Summary:</h4>
                <ul>
                    <li><strong>Employee Name:</strong> {{employee_name}}</li>
                    <li><strong>Review Period:</strong> {{review_period}}</li>
                    <li><strong>Effective Date:</strong> {{effective_date}}</li>
                    <li><strong>Salary Increase:</strong> ₹{{salary_increase}}</li>
                    <li><strong>Performance Rating:</strong> {{performance_rating}}</li>
                </ul>

                <h4 style="color: #2d5a4a;">💬 Manager's Note:</h4>
                <p class="content-text">{{manager_message}}</p>
                
                <p class="content-text">
                    We appreciate your continued excellence and look forward to your ongoing contributions to our organization.
                </p>
            </div>

            <!-- Call to Action -->
            <div class="call-to-action">
                <p class="attachment-info">
                    <strong>📎 Your appraisal letter is attached as a PDF document</strong>
                </p>
                <p class="contact-info">
                    If you have any questions, please don't hesitate to contact the HR department at {{hr_contact}}.
                </p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0;">
                    Best regards,<br>
                    <strong>Human Resources Department</strong><br>
                    {{company_name}}
                </p>
                <p style="margin: 10px 0 0 0;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Replace template variables
    Object.keys(templateData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlTemplate = htmlTemplate.replace(regex, templateData[key] || '');
    });

    const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);
    
    const mailOptions = {
      from: `"HR Department" <${senderEmail}>`,
      to: recipientEmail,
      cc: senderEmail, // CC to HR
      subject: subject,
      html: htmlTemplate,
      attachments: [
        {
          filename: `Appraisal_Letter_${(templateData.employee_name || 'Employee').replace(/\s+/g, '_')}_${(templateData.effective_date || 'Current').replace(/\s+/g, '_')}.pdf`,
          content: appraisalPDF.buffer,
          contentType: 'application/pdf',
        },
      ]
    };

    // Handle additional attachments from request body if any
    if (req.body.attachments && Array.isArray(req.body.attachments)) {
      req.body.attachments.forEach(attachment => {
        mailOptions.attachments.push({
          filename: attachment.filename,
          content: Buffer.from(attachment.content, 'base64'),
          contentType: attachment.contentType || 'application/pdf'
        });
      });
    }

    console.log(`Sending appraisal email using SMTP: ${smtpServer}:${smtpPort} with email: ${senderEmail}`);
    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: `Appraisal letter sent successfully to ${recipientEmail}`,
      recipient: recipientEmail,
      subject: subject,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending appraisal email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// 4. POST JOB TO LINKEDIN ENDPOINT
router.post('/post-job', async (req, res) => {
    try {
        const { jobData, accessToken, applicationUrl } = req.body;
        
        if (!jobData || !accessToken) {
            return res.status(400).json({
                success: false,
                error: "Missing jobData or accessToken"
            });
        }

        function formatJobPost(job, appUrl) {
    let postText = `🚀 We're Hiring: ${job.job_title}\n\n`;
    postText += `📍 ${job.location || 'Remote'} | 🏢 ${job.department || 'Various'}\n`;
    postText += `💼 ${job.employment_type || 'Full-time'} | ⭐ ${job.experience_level || 'All levels'}\n`;
    if (job.salary_range) {
        postText += `💰 ${job.salary_range}\n`;
    }
    postText += `\n`;

    // Truncate job description to fit within limit
    const maxDescLength = 600;
    const description = job.job_description || 'Great opportunity to join our team!';
    const truncatedDesc = description.length > maxDescLength 
        ? description.substring(0, maxDescLength).trim() + '...' 
        : description;
    
    postText += `📋 ${truncatedDesc}\n\n`;

    // Add responsibilities only if there's space and keep it short
    if (job.key_responsibilities && postText.length < 1800) {
        const maxRespLength = 400;
        const responsibilities = job.key_responsibilities.length > maxRespLength
            ? job.key_responsibilities.substring(0, maxRespLength).trim() + '...'
            : job.key_responsibilities;
        postText += `🎯 Key Responsibilities:\n${responsibilities}\n\n`;
    }

    // Add qualifications only if there's space
    if (job.qualification_requirements && postText.length < 2200) {
        const maxQualLength = 300;
        const qualifications = job.qualification_requirements.length > maxQualLength
            ? job.qualification_requirements.substring(0, maxQualLength).trim() + '...'
            : job.qualification_requirements;
        postText += `✅ Qualifications:\n${qualifications}\n\n`;
    }

    // Add skills if there's space
    if (job.required_skills && postText.length < 2500) {
        const skills = Array.isArray(job.required_skills) 
            ? job.required_skills.slice(0, 5).join(', ') // Limit to 5 skills
            : job.required_skills.substring(0, 150);
        postText += `🛠️ Skills: ${skills}\n\n`;
    }

    postText += `📧 Apply: ${appUrl}\n\n`;
    postText += `#Hiring #Jobs #${job.department?.replace(/\s/g, '') || 'Career'}`;

    // Final safety check - ensure under 3000 characters
    if (postText.length > 2950) {
        postText = postText.substring(0, 2900).trim() + '...\n\n📧 Apply: ' + appUrl;
    }

    console.log(`LinkedIn post length: ${postText.length} characters`);
    return postText;
}

        const finalAppUrl = applicationUrl || "http://localhost:5173/job-application";
        const postContent = formatJobPost(jobData, finalAppUrl);

        const linkedinPayload = {
            author: "urn:li:person:DWYai5SUO4", // UPDATE THIS TO YOUR LINKEDIN URN
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: postContent
                    },
                    shareMediaCategory: "NONE"
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        };

        const response = await axios.post("https://api.linkedin.com/v2/ugcPosts", linkedinPayload, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
        });

        if (response.status >= 200 && response.status < 300) {
            res.status(200).json({
                success: true,
                postId: response.data.id,
                message: "Successfully posted to LinkedIn",
                applicationUrl: finalAppUrl
            });
        } else {
            res.status(422).json({
                success: false,
                error: response.data,
                status_code: response.status
            });
        }
    } catch (error) {
    console.error("LinkedIn API Full Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
    });
     res.status(500).json({
        success: false,
        error: error.message,
        linkedinDetails: error.response?.data // Add this to see LinkedIn's exact error
    });
    }   
});

// 5. SEND INTERVIEW INVITATION ENDPOINT
router.post('/send-interview-invitation', async (req, res) => {
    try {
        const {
            senderEmail = process.env.SEND_INTERVIEW_INVITATION_EMAIL,
            senderPassword = process.env.SEND_INTERVIEW_INVITATION_PASSWORD,
            recipientEmail,
            interviewerEmail,
            subject,
            smtpServer = process.env.SMTP_HOST,
            smtpPort = process.env.SMTP_PORT,
            templateData = {}
        } = req.body;

        if (!senderEmail || !senderPassword || !recipientEmail || !interviewerEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: senderEmail, senderPassword, recipientEmail, or interviewerEmail"
            });
        }

        const candidateName = templateData.candidate_name || 'Candidate';
        const jobTitle = templateData.job_title || 'Position';
        
        // Extract interview details from templateData or req.body
        const interviewDetails = {
            date: templateData.interview_date || req.body.interview_date,
            time: templateData.interview_time || req.body.interview_time,
            platform: templateData.interview_platform || req.body.interview_platform,
            meetingLink: templateData.interview_link || req.body.interview_link,
            type: templateData.interview_type || req.body.interview_type
        };
        
        const messageBody = templateData.message_body || 'We would like to invite you for an interview.';
        const candidateEmailSubject = subject || `Interview Invitation - ${jobTitle}`;

        // Create transporter
        const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);

        // Email content for candidate
        const candidateHtmlContent = `
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">
                        Interview Invitation
                    </h2>
                    ${messageBody}
                    <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2c5aa0;">
                        <h3 style="margin-top: 0; color: #2c5aa0;">Interview Details:</h3>
                        <p><strong>Position:</strong> ${jobTitle}</p>
                        <p><strong>Date:</strong> ${interviewDetails.date || 'To be confirmed'}</p>
                        <p><strong>Time:</strong> ${interviewDetails.time || 'To be confirmed'}</p>
                        <p><strong>Platform:</strong> ${interviewDetails.platform || 'To be confirmed'}</p>
                        ${interviewDetails.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${interviewDetails.meetingLink}" style="color: #2c5aa0;">${interviewDetails.meetingLink}</a></p>` : ''}
                    </div>
                    <p>Please confirm your availability and join the meeting on time.</p>
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>HR Team</strong>
                    </p>
                </div>
            </body>
            </html>
        `;

        // Email content for interviewer
        const interviewerEmailSubject = `Interview Scheduled - ${candidateName} for ${jobTitle}`;
        const interviewerHtmlContent = `
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">
                        Interview Scheduled - Action Required
                    </h2>
                    <p>Dear Interviewer,</p>
                    <p>An interview has been scheduled with a candidate for the <strong>${jobTitle}</strong> position. Please find the details below:</p>
                    
                    <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2c5aa0;">
                        <h3 style="margin-top: 0; color: #2c5aa0;">Interview Details:</h3>
                        <p><strong>Candidate Name:</strong> ${candidateName}</p>
                        <p><strong>Position:</strong> ${jobTitle}</p>
                        <p><strong>Interview Type:</strong> ${interviewDetails.type || 'Standard Interview'}</p>
                        <p><strong>Date:</strong> ${interviewDetails.date}</p>
                        <p><strong>Time:</strong> ${interviewDetails.time}</p>
                        <p><strong>Platform:</strong> ${interviewDetails.platform}</p>
                        <p><strong>Meeting Link:</strong> <a href="${interviewDetails.meetingLink}" style="color: #2c5aa0;">${interviewDetails.meetingLink}</a></p>
                    </div>

                    <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                        <h3 style="margin-top: 0; color: #856404;">Candidate Information:</h3>
                        ${templateData.candidate_phone ? `<p><strong>Phone:</strong> ${templateData.candidate_phone}</p>` : ''}
                        ${templateData.candidate_experience ? `<p><strong>Experience:</strong> ${templateData.candidate_experience}</p>` : ''}
                        ${templateData.candidate_skills ? `<p><strong>Skills:</strong> ${templateData.candidate_skills}</p>` : ''}
                        ${templateData.candidate_location ? `<p><strong>Location:</strong> ${templateData.candidate_location}</p>` : ''}
                    </div>

                    <p><strong>Action Required:</strong> Please block your calendar for the scheduled time and prepare for the interview.</p>
                    
                    <p>If you need to reschedule or have any questions, please contact HR immediately.</p>
                    
                    <p style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>HR Team</strong>
                    </p>
                </div>
            </body>
            </html>
        `;

        // Send email to candidate
        const candidateEmailResult = await transporter.sendMail({
            from: senderEmail,
            to: recipientEmail,
            subject: candidateEmailSubject,
            html: candidateHtmlContent
        });

        // Send email to interviewer
        const interviewerEmailResult = await transporter.sendMail({
            from: senderEmail,
            to: interviewerEmail,
            subject: interviewerEmailSubject,
            html: interviewerHtmlContent
        });

        res.status(200).json({
            success: true,
            message: "Interview invitations sent successfully to both candidate and interviewer",
            candidate_recipient: recipientEmail,
            interviewer_recipient: interviewerEmail,
            candidate_subject: candidateEmailSubject,
            interviewer_subject: interviewerEmailSubject,
            candidate_name: candidateName,
            job_title: jobTitle,
            candidate_message_id: candidateEmailResult.messageId,
            interviewer_message_id: interviewerEmailResult.messageId,
            emails_sent: 2
        });

    } catch (error) {
        console.error('Error sending interview invitations:', error);
        
        // Check if error occurred during candidate email or interviewer email
        let errorDetails = {
            success: false,
            error: error.message,
            candidate_email_sent: false,
            interviewer_email_sent: false
        };

        // You might want to add more specific error handling here
        // For example, if candidate email succeeds but interviewer fails
        
        res.status(500).json(errorDetails);
    }
});


// 6. SEND EMAIL WITH ATTACHMENT ENDPOINT
router.post('/send-email-with-attachment', multerStorage.array('attachments'), async (req, res) => {
    try {
        const {
            senderEmail = process.env.SENDER_EMAIL,
            senderPassword = process.env.SENDER_PASSWORD,
            recipientEmail,
            subject = 'Email with Attachment',
            messageBody = 'Please find the attached file.',
            smtpServer = process.env.SMTP_HOST,
            smtpPort = process.env.SMTP_PORT
        } = req.body;

        console.log(`Sender: ${senderEmail}`);
        console.log(`Recipient: ${recipientEmail}`);
        console.log(`Number of files uploaded: ${req.files?.length || 0}`);

        if (!senderEmail || !senderPassword || !recipientEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No files uploaded"
            });
        }

        const transporter = createTransporter(senderEmail, senderPassword, smtpServer, parseInt(smtpPort));

        const attachmentInfo = [];
        const attachments = req.files.map(file => {
            const fileInfo = {
                filename: file.originalname,
                size: file.size,
                content_type: file.mimetype
            };
            attachmentInfo.push(fileInfo);

            return {
                filename: file.originalname,
                path: file.path
            };
        });

        await transporter.sendMail({
            from: senderEmail,
            to: recipientEmail,
            subject: subject,
            text: messageBody,
            attachments: attachments
        });

        // Clean up uploaded files
        req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        });

        res.status(200).json({
            success: true,
            message: "Email with attachments sent successfully",
            recipient: recipientEmail,
            subject: subject,
            attachments: attachmentInfo,
            total_attachments: attachmentInfo.length
        });

    } catch (error) {
        console.error("Exception occurred:", error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


module.exports = router;