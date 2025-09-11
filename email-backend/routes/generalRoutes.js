const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { handleAutoMarkAbsent, getAutoAbsentStats } = require('../utils/autoAbsent');

const router = express.Router();
const FormData = require('form-data');
const { supabase } = require('../supabase/config'); // Assuming you have a Supabase client config


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


router.post('/trigger-auto-absent', async (req, res) => {
  try {
    const result = await handleAutoMarkAbsent();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/auto-absent-info', async (req, res) => {
  try {
    const result = await getAutoAbsentStats();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
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


// REPLACE the entire '/send-job-offer' route with this one
// REPLACE the entire '/send-job-offer' route with this one
router.post('/send-job-offer', async (req, res) => {
  // Step 0: Validate Environment Variables
  const surepassApiUrl = process.env.SUREPASS_API_URL;
  const surepassToken = process.env.SUREPASS_TOKEN;

  if (!surepassApiUrl || !surepassToken) {
    console.error("FATAL: SUREPASS_API_URL or SUREPASS_TOKEN is not defined in .env file.");
    return res.status(500).json({
      success: false,
      error: "Server configuration error: eSign service credentials are not set."
    });
  }

  try {
    const {
      recipientEmail,
      templateData = {},
      attachments = [],
      candidateId,
      isManualOffer = false
    } = req.body;

    console.log(`Starting e-sign process for: ${recipientEmail}, Candidate ID: ${candidateId}`);

    // --- Validation ---
    if (!recipientEmail || !templateData.to_name) {
      return res.status(400).json({ success: false, error: "Missing recipient email or name" });
    }
    if (!attachments || attachments.length === 0 || !attachments[0].content) {
      return res.status(400).json({ success: false, error: "Offer letter PDF is missing" });
    }

    // --- Step 1: Initialize eSign with Surepass ---
 const initializePayload = {
  pdf_pre_uploaded: true,
  expiry_minutes: 9000,
  sign_type: "aadhaar",
 config: {
    positions: {
      "4": [
        {
          "x": 81,
          "y": 141
        }
      ]
    },
    reason: "offer letter Acceptance",
    accept_virtual_sign: true,
    track_location: true,
    allow_download: true,
    skip_otp: true,
    skip_email: true,
    stamp_paper_amount: "",
    stamp_paper_state: "",
    stamp_data: {},
    auth_mode: 1
  },
  prefill_options: {
    full_name: templateData.to_name,
    user_email: recipientEmail,
    mobile_number: templateData.candidatePhone || ''
  },
  
};


    console.log("Initializing Surepass eSign...");
    const initializeResponse = await axios.post(`${surepassApiUrl}/api/v1/esign/initialize`, initializePayload, {
      headers: { 'Authorization': `Bearer ${surepassToken}` }
    });

    if (!initializeResponse.data || !initializeResponse.data.success) {
      console.error("Surepass Initialization Error:", initializeResponse.data);
      throw new Error('Failed to initialize Surepass eSign session.');
    }

    const { client_id, url: candidateSignUrl } = initializeResponse.data.data;
    console.log(`Surepass session initialized. Client ID: ${client_id}`);
    
    // --- Step 2: Store Surepass details in your database ---
    const updateData = {
      surepass_client_id: client_id,
      surepass_url: candidateSignUrl,
      esign_status: 'initialized'
    };

    // THIS IS THE FIX: Check if the candidateId is for a manual record before updating.
    const isExistingManualRecord = candidateId && typeof candidateId === 'string' && candidateId.startsWith('manual_');

    if (!isExistingManualRecord && candidateId) {
      // This is a standard candidate, so update job_applications table.
      const { error: updateError } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', candidateId);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw new Error(`Failed to update candidate record in database: ${updateError.message}`);
      }
    } else {
      // If it's a manual record or a new manual offer (candidateId is null), skip this update.
      console.log('Skipping initial DB update for manual or new offer.');
    }


    // --- Step 3: Get the pre-signed URL for PDF upload ---
    console.log("Getting PDF upload link from Surepass...");
    const uploadLinkResponse = await axios.post(`${surepassApiUrl}/api/v1/esign/get-upload-link`, { client_id }, {
      headers: { 'Authorization': `Bearer ${surepassToken}` }
    });

    if (!uploadLinkResponse.data || !uploadLinkResponse.data.success) {
      throw new Error('Failed to get Surepass upload link');
    }
    const { url: s3Url, fields: s3Fields } = uploadLinkResponse.data.data;

    // --- Step 4: Upload the PDF to the pre-signed S3 URL ---
    const pdfBuffer = Buffer.from(attachments[0].content, 'base64');
    const form = new FormData();
    Object.entries(s3Fields).forEach(([key, value]) => {
      form.append(key, value);
    });
    form.append('file', pdfBuffer, attachments[0].filename);

    console.log("Uploading PDF to Surepass S3...");
    await axios.post(s3Url, form, {
      headers: form.getHeaders()
    });
    console.log("PDF uploaded successfully.");

    // --- Step 5: Send the eSign link to the candidate via Email ---
    const {
        senderEmail = process.env.SEND_JOB_OFFER_EMAIL,
        senderPassword = process.env.SEND_JOB_OFFER_PASSWORD,
        smtpServer = 'smtp.hostinger.in',
        smtpPort = 587
    } = req.body;
    
    const emailHtmlTemplate = `
      <!DOCTYPE html>
      <html>
      <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h2>Job Offer from ${templateData.company_name}</h2>
              <p>Dear ${templateData.to_name},</p>
              <p>Congratulations! We are pleased to offer you the position of <strong>${templateData.job_title}</strong>.</p>
              <p>Please review and sign your offer letter by clicking the button below. You will be guided through a secure e-signature process.</p>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${candidateSignUrl}" style="background-color: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                      Review and Sign Offer Letter
                  </a>
              </div>
              <p>This offer is valid until <strong>${templateData.offer_valid_until}</strong>. If you have any questions, please contact us.</p>
              <p>We look forward to welcoming you to our team!</p>
              <p>Best regards,<br><strong>The HR  at ${templateData.company_name}</strong></p>
          </div>
      </body>
      </html>`;

    const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: `Action Required: Sign Your Job Offer for ${templateData.job_title}`,
      html: emailHtmlTemplate
    };

    console.log("Sending eSign email to candidate...");
    await transporter.sendMail(mailOptions);
    console.log('eSign email sent successfully.');

    // --- Final Step: Update status in DB and send response ---
    // Apply the same logic check here before the final update
    if (!isExistingManualRecord && candidateId) {
      await supabase
        .from('job_applications')
        .update({ esign_status: 'sent', offer_sent_date: new Date().toISOString() })
        .eq('id', candidateId);
    }
    
    res.status(200).json({
      success: true,
      message: "eSign offer sent successfully!",
      recipient: recipientEmail,
      surepass_client_id: client_id,
      surepass_url: candidateSignUrl
    });

  } catch (error) {
    console.error('Error in /send-job-offer endpoint:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred during the e-sign process.',
      details: error.message
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