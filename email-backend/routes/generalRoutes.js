const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Helper function to create transporter

function createTransporter(senderEmail, senderPassword, smtpServer = 'smtp.gmail.com', smtpPort = 587) {
    const nodemailer = require('nodemailer');
    return nodemailer.createTransport({
        host: smtpServer,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: senderEmail,
            pass: senderPassword
        }
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

// 1. SEND EMAIL ENDPOINT
router.post('/send-email', async (req, res) => {
    try {
        const data = req.body;
        console.log("Received data:", data);

        const {
            senderEmail,
            senderPassword,
            recipientEmail,
            subject = 'Welcome - Your Account Credentials',
            smtpServer = 'smtp.gmail.com',
            smtpPort = 587,
            templateData = {}
        } = data;

        // Validate required fields
        if (!senderEmail || !senderPassword || !recipientEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: senderEmail, senderPassword, or recipientEmail"
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

        // Create transporter
        const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);

        // Mail options
        const mailOptions = {
            from: senderEmail,
            to: recipientEmail,
            subject: subject,
            html: htmlTemplate
        };

        // Send email
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
    try {
        const {
            employeeName,
            employeeEmail,
            companyName,
            payPeriod,
            senderEmail,
            senderPassword,
            smtpServer = 'smtp.gmail.com',
            smtpPort = 587
        } = req.body;

        console.log("Received payslip data:", req.body);

        // Validate required fields
        if (!employeeName || !employeeEmail || !senderEmail || !senderPassword) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: employeeName, employeeEmail, senderEmail, or senderPassword"
            });
        }

        // Check if PDF file is attached
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "PDF file is required"
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: smtpPort,
    secure: false,
    auth: {
        user: senderEmail,
        pass: senderPassword
    },
    tls: {
        rejectUnauthorized: false
    }
});     
        // Verify transporter
        await transporter.verify();

        // Email template for payslip
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
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${companyName || 'Your Company'}</p>
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
                        <strong>Generated Date:</strong> ${new Date().toLocaleDateString()}
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
                        ${companyName || 'Your Company'}
                    </p>
                </div>
                
                <div class="footer">
                    <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
                    <p style="margin: 5px 0 0 0; opacity: 0.8;">© ${new Date().getFullYear()} ${companyName || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // Mail options
        const mailOptions = {
            from: {
                name: companyName || 'HR Department',
                address: senderEmail
            },
            to: employeeEmail,
            subject: `Payslip for ${payPeriod} - ${employeeName}`,
            html: emailTemplate,
            attachments: [
                {
                    filename: `Payslip_${employeeName.replace(/\s+/g, '_')}_${payPeriod.replace(/\s+/g, '_')}.pdf`,
                    content: req.file.buffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Payslip email sent successfully:', info.messageId);

        res.status(200).json({
            success: true,
            message: 'Payslip sent successfully',
            messageId: info.messageId,
            recipient: employeeEmail,
            payPeriod: payPeriod
        });

    } catch (error) {
        console.error('Error sending payslip email:', error);
        
        let errorMessage = 'Failed to send payslip email';
        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please check credentials.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'SMTP server not found. Please check server settings.';
        } else if (error.responseCode === 550) {
            errorMessage = 'Recipient email address rejected.';
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


    // 2. SEND RECRUITMENT EMAIL ENDPOINT
    router.post('/send-recruitment-email', async (req, res) => {
        try {
            const data = req.body;
            const {
                senderEmail,
                senderPassword,
                recipientEmail,
                subject = 'Campus Recruitment Exam Invitation',
                smtpServer = 'smtp.gmail.com',
                smtpPort = 587,
                templateData = {}
            } = data;

            if (!senderEmail || !senderPassword || !recipientEmail) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields"
                });
            }

            // Campus Recruitment HTML template - MOVE TO SEPARATE FILE
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

// 3. SEND JOB OFFER ENDPOINT
router.post('/send-job-offer', async (req, res) => {
    try {
        const {
            senderEmail,
            senderPassword,
            recipientEmail,
            templateData = {},
            attachments = [],
            smtpServer = 'smtp.gmail.com',
            smtpPort = 587
        } = req.body;

        const jobTitle = templateData.job_title || 'Job Position';
        const companyName = templateData.company_name || 'Our Company';
        const subject = req.body.subject || `Job Offer - ${jobTitle} Position at ${companyName}`;

        if (!senderEmail || !senderPassword || !recipientEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        // Job Offer HTML template - MOVE TO SEPARATE FILE
        let htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .content { background: white; padding: 30px; border: 1px solid #dee2e6; border-radius: 8px; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        .highlight { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .signature { margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; width: 150px; }
    </style>
</head>
<body>
    <div class="content">
        <div class="highlight">
            <strong>Subject Line:</strong> Job Offer - {{job_title}} Position at {{company_name}}
        </div>
        <div class="template-preview">
            <h3>🎉 Congratulations! Job Offer Letter</h3>

            <p>Dear <strong>{{to_name}}</strong>,</p>

            <p>We are delighted to extend an offer of employment to you for the position of <strong>{{job_title}}</strong> at <strong>{{company_name}}</strong>.</p>

            <p>After careful consideration of your qualifications, experience, and interview performance, we believe you would be a valuable addition to our team.</p>

            <h4>📋 Offer Details:</h4>
            <ul>
                <li><strong>Position:</strong> {{job_title}}</li>
                <li><strong>Company:</strong> {{company_name}}</li>
                <li><strong>Compensation:</strong> {{salary_amount}}</li>
                <li><strong>Expected Joining Date:</strong> {{joining_date}}</li>
                <li><strong>Work Location:</strong> {{work_location}}</li>
                <li><strong>Reporting Manager:</strong> {{reporting_manager}}</li>
            </ul>

            <h4>🎁 Additional Benefits:</h4>
            <p>{{additional_benefits}}</p>

            <h4>⏰ Important Information:</h4>
            <p>This offer is valid until: <strong>{{offer_valid_until}}</strong></p>
            <p>Please confirm your acceptance by replying to this email or contacting our HR team.</p>

            <h4>💬 Personal Message:</h4>
            <p>{{message}}</p>

            <p>We look forward to welcoming you to our team and are excited about the contributions you will make to our organization.</p>

            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Review this offer carefully</li>
                <li>Contact us if you have any questions</li>
                <li>Confirm your acceptance</li>
                <li>Prepare for your exciting journey with us!</li>
            </ol>

            <p>If you have any questions or need clarification about any aspect of this offer, please don't hesitate to reach out.</p>

            <p><strong>HR Contact:</strong><br>
            {{hr_contact}}</p>

            <p>Congratulations once again, and we look forward to having you on board!</p>

            <p>Best regards,<br>
            <strong>{{company_name}} HR Team</strong></p>

            <hr>
            <p style="font-size: 12px; color: #666;">
                This is an official job offer from {{company_name}}. Please keep this email for your records.
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

        const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);
        
        const mailOptions = {
            from: senderEmail,
            to: recipientEmail,
            subject: subject,
            html: htmlTemplate,
            attachments: [] // Handle attachments here
        };

        // Handle attachments (URLs or file paths)
        for (const attachmentPath of attachments) {
            if (attachmentPath.startsWith('http')) {
                // Download from URL
                const response = await axios.get(attachmentPath, { responseType: 'stream' });
                const filename = path.basename(attachmentPath) || 'attachment';
                mailOptions.attachments.push({
                    filename: filename,
                    content: response.data
                });
            } else {
                // Local file
                mailOptions.attachments.push({
                    filename: path.basename(attachmentPath),
                    path: attachmentPath
                });
            }
        }

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "Job offer email sent successfully",
            recipient: recipientEmail,
            subject: subject
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. POST JOB TO LINKEDIN ENDPOINT
// Add this route to your existing generalRoutes.js file
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
            postText += `📍 Location: ${job.location || 'Not specified'}\n`;
            postText += `🏢 Department: ${job.department || 'Not specified'}\n`;
            postText += `💼 Employment Type: ${job.employment_type || 'Not specified'}\n`;
            postText += `⭐ Experience Level: ${job.experience_level || 'Not specified'}\n`;
            if (job.salary_range) {
                postText += `💰 Salary Range: ${job.salary_range}\n`;
            }
            postText += `\n📋 Job Description:\n${job.job_description || 'No description available'}\n\n`;
            if (job.key_responsibilities) {
                postText += `🎯 Key Responsibilities:\n${job.key_responsibilities}\n\n`;
            }
            if (job.qualification_requirements) {
                postText += `✅ Qualifications:\n${job.qualification_requirements}\n\n`;
            }
            if (job.required_skills) {
                const skills = Array.isArray(job.required_skills) 
                    ? job.required_skills.join(', ') 
                    : job.required_skills;
                postText += `🛠️ Skills Required:\n${skills}\n\n`;
            }
            if (job.additional_benefits) {
                postText += `🎁 Benefits:\n${job.additional_benefits}\n\n`;
            }
            postText += `📧 Ready to join our team? Apply now: ${appUrl}\n\n`;
            postText += `#Hiring #Jobs #${job.department?.replace(/\s/g, '') || ''} #${job.job_title?.replace(/\s/g, '') || ''}`;
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
        console.error("Exception occurred:", error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. SEND INTERVIEW INVITATION ENDPOINT
router.post('/send-interview-invitation', async (req, res) => {
    try {
        const {
            senderEmail,
            senderPassword,
            recipientEmail,
            subject,
            smtpServer = 'smtp.gmail.com',
            smtpPort = 587,
            templateData = {}
        } = req.body;

        if (!senderEmail || !senderPassword || !recipientEmail) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        const candidateName = templateData.candidate_name || 'Candidate';
        const messageBody = templateData.message_body || 'We would like to invite you for an interview.';
        const emailSubject = subject || `Interview Invitation - ${candidateName}`;

        const htmlContent = `
            <html>
            <body>
                <h3>Interview Invitation</h3>
                <p>${messageBody}</p>
                <br>
            </body>
            </html>
        `;

        const transporter = createTransporter(senderEmail, senderPassword, smtpServer, smtpPort);
        
        await transporter.sendMail({
            from: senderEmail,
            to: recipientEmail,
            subject: emailSubject,
            html: htmlContent
        });

        res.status(200).json({
            success: true,
            message: "Interview invitation sent successfully",
            recipient: recipientEmail,
            subject: emailSubject,
            candidate_name: candidateName
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. SEND EMAIL WITH ATTACHMENT ENDPOINT
router.post('/send-email-with-attachment', multerStorage.array('attachments'), async (req, res) => {
    try {
        const {
            senderEmail,
            senderPassword,
            recipientEmail,
            subject = 'Email with Attachment',
            messageBody = 'Please find the attached file.',
            smtpServer = 'smtp.gmail.com',
            smtpPort = 587
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