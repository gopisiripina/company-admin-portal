const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Imap = require('imap');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { simpleParser } = require('mailparser');

const app = express();
const PORT = process.env.PORT || 5000;
const multer = require('multer');
const upload = multer().array('attachments');
const http = require('http');
const { WebSocketServer } = require('ws');
// In server.js
const server = http.createServer(app);

// Create a WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });

// Store active client connections (email -> { ws, imapConnection })
const clients = new Map();


// Create a WebSocket server and attach it to the HTTP server

// Store active client connections (email -> { ws, imapConnection })


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'https://cap.myaccessio.com',
  credentials: true
}));

// Add proxy trust
app.set('trust proxy', true);

const multerStorage = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper function to create transporter
function createTransporter(senderEmail, senderPassword, smtpServer = 'smtp.gmail.com', smtpPort = 587) {
    return nodemailer.createTransport({
        host: smtpServer,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: senderEmail,
            pass: senderPassword
        }
    });
}

// Root route
app.get('/', (req, res) => {
    res.send("Hello World");
});

// 1. SEND EMAIL ENDPOINT
app.post('/api/send-email', async (req, res) => {
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

        // HTML template - MOVE THIS TO A SEPARATE FILE OR TEMPLATE ENGINE
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

// 2. SEND RECRUITMENT EMAIL ENDPOINT
app.post('/api/send-recruitment-email', async (req, res) => {
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
app.post('/api/send-job-offer', async (req, res) => {
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
app.post('/api/post-job', async (req, res) => {
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
app.post('/api/send-interview-invitation', async (req, res) => {
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
app.post('/api/send-email-with-attachment', multerStorage.array('attachments'), async (req, res) => {
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


// Hostinger Email Configuration
const getImapConfig = (email, password) => ({
  user: email,
  password: password,
  host: 'imap.hostinger.com',
  port: 993, // SSL port from your configuration
  tls: true, // Enable TLS for SSL connection
  tlsOptions: {
    rejectUnauthorized: false
  },
 connTimeout: 90000, // increase from 60000 to 90000
authTimeout: 10000,

  keepalive: {
    interval: 10000,
    forceNoop: true
  },
  family: 4 
});


const getSmtpConfig = (email, password) => ({
  host: 'smtp.hostinger.com',
  port: 465, // SSL port from your configuration
  secure: true, // Use SSL
  auth: {
    user: email,
    pass: password
  },
  debug: true,
  logger: true,
 connectionTimeout: 180000,
socketTimeout: 180000,
greetingTimeout: 60000,

  tls: {
    rejectUnauthorized: false
  },
  family: 4 
});
// Test email connection
app.post('/api/email/test-connection', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Testing connection with:', { email, host: 'imap.hostinger.com', port: 993 });
  
  const imap = new Imap(getImapConfig(email, password));
  
  const timeout = setTimeout(() => {
    imap.destroy();
    res.status(400).json({ 
      success: false, 
      error: 'Connection timeout - please check your email credentials and internet connection' 
    });
  }, 30000); // 30 second timeout
  
  imap.once('ready', () => {
    console.log('IMAP connection established');
    clearTimeout(timeout);
    
    imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        console.error('Mailbox error:', err);
        imap.end();
        return res.status(400).json({ 
          success: false, 
          error: 'Failed to connect to mailbox: ' + err.message 
        });
      }
      
      console.log('Mailbox opened successfully');
      imap.end();
      res.json({ 
        success: true, 
        message: 'Connected successfully',
        totalMessages: box.messages.total
      });
    });
  });
  
  imap.once('error', (err) => {
    console.error('IMAP connection error:', err);
    clearTimeout(timeout);
    res.status(400).json({ 
      success: false, 
      error: 'Connection failed: ' + err.message 
    });
  });
  
  imap.once('end', () => {
    console.log('IMAP connection closed');
    clearTimeout(timeout);
  });
  
  try {
    imap.connect();
  } catch (err) {
    console.error('Connection attempt failed:', err);
    clearTimeout(timeout);
    res.status(400).json({ 
      success: false, 
      error: 'Failed to initiate connection: ' + err.message 
    });
  }
});// Fetch emails from specific folder
// In server.js, replace the existing '/api/email/fetch-trash' endpoint with this updated version.

// ✅ FINAL FIX: Fetch trash items directly from the correct folder
// In server.js, replace the existing '/api/email/fetch-trash' endpoint

// In server.js, replace the existing '/api/email/fetch-trash' endpoint

// In server.js, replace the '/api/email/fetch-trash' endpoint

// In server.js, replace the fetch-trash endpoint
// In server.js, replace the fetch-trash endpoint

// In server.js, replace the entire fetch-trash endpoint
// In server.js, replace the entire /api/email/fetch-trash endpoint
app.post('/api/email/fetch-trash', (req, res) => {
  const { email, password, limit = 10, offset = 0 } = req.body;
  const trashFolderNames = ['INBOX.Trash', 'Trash'];
  const imap = new Imap(getImapConfig(email, password));

  imap.once('ready', () => {
    openBoxRecursive(imap, trashFolderNames, true, (err, box) => {
      if (err) {
        imap.end();
        return res.status(400).json({ success: false, error: `Could not open Trash folder: ${err.message}` });
      }

      if (box.messages.total === 0) {
        imap.end();
        return res.json({ success: true, emails: [] });
      }

      const emails = [];
      const startSeq = Math.max(1, box.messages.total - (offset + limit) + 1);
      const endSeq = Math.max(1, box.messages.total - offset);

      if (startSeq > endSeq) {
          imap.end();
          return res.json({ success: true, emails: [] });
      }

      let emailsProcessed = 0;
      const totalToFetch = endSeq - startSeq + 1;

      const f = imap.seq.fetch(`${startSeq}:${endSeq}`, { bodies: '', struct: true });

      f.on('message', (msg, seqno) => {
        let emailData = { seqno };
        msg.once('attributes', (attrs) => { emailData.uid = attrs.uid; });
        msg.on('body', (stream) => {
            simpleParser(stream, (err, parsed) => {
                if (parsed) {
                    // ✅ UPDATED: Added cc and bcc here
                    emailData.from = parsed.from?.text || '';
                    emailData.to = parsed.to?.text || '';
                    emailData.cc = parsed.cc?.text || '';
                    emailData.bcc = parsed.bcc?.text || '';
                    emailData.subject = parsed.subject || '';
                    emailData.date = parsed.date?.toLocaleString() || '';
                    emailData.body = parsed.html || parsed.text || '';
                    emails.push(emailData);
                }

                emailsProcessed++;
                if (emailsProcessed === totalToFetch) {
                    imap.end();
                    emails.sort((a, b) => b.seqno - a.seqno);
                    res.json({ success: true, emails });
                }
            });
        });
      });

      f.once('error', (fetchErr) => {
        imap.end();
        res.status(500).json({ success: false, error: 'Failed to fetch emails from trash: ' + fetchErr.message });
      });
    });
  });

  imap.once('error', (err) => res.status(400).json({ success: false, error: 'IMAP Connection Error: ' + err.message }));
  imap.connect();
});

// In server.js, replace the entire /api/email/fetch endpoint
app.post('/api/email/fetch', (req, res) => {
  const { email, password, folder = 'INBOX', limit = 10, offset = 0 } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  let emailsProcessed = 0;
  
  imap.once('ready', () => {
    imap.openBox(folder, true, (err, box) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      const emails = [];
      const total = box.messages.total;
      
      if (total === 0) {
        imap.end();
        return res.json({ success: true, emails: [] });
      }
      
      const start = Math.max(1, total - offset - limit + 1);
      const end = total - offset;

      if (end < start) {
        imap.end();
        return res.json({ success: true, emails: [] });
      }

      const startSeq = Math.max(1, start);
      const endSeq = Math.max(1, end);
      
      const f = imap.seq.fetch(`${startSeq}:${endSeq}`, { bodies: '', struct: true });
      
      f.on('message', (msg, seqno) => {
        const emailData = { seqno };
        
        msg.on('body', (stream, info) => {
          simpleParser(stream, (err, parsed) => {
              if (parsed) {
                  // ✅ UPDATED: Added cc and bcc here
                  emailData.from = parsed.from?.text || '';
                  emailData.to = parsed.to?.text || '';
                  emailData.cc = parsed.cc?.text || '';
                  emailData.bcc = parsed.bcc?.text || '';
                  emailData.subject = parsed.subject || '';
                  emailData.date = parsed.date?.toLocaleString() || '';
                  emailData.body = parsed.html || parsed.text || '';
                  emails.push(emailData);
              }

              emailsProcessed++;
              if (emailsProcessed >= (endSeq - startSeq + 1)) {
                  imap.end();
                  emails.sort((a, b) => b.seqno - a.seqno);
                  res.json({ success: true, emails });
              }
          });
        });
        
        msg.once('attributes', (attrs) => {
          emailData.uid = attrs.uid;
          emailData.flags = attrs.flags;
        });
      });
      
      f.once('error', (err) => {
        console.error('Fetch error:', err);
        imap.end();
        res.status(400).json({ success: false, error: err.message });
      });
    });
  });
  
  imap.once('error', (err) => {
    console.error('IMAP error:', err);
    res.status(400).json({ success: false, error: err.message });
  });
  
  imap.connect();
});
// Send email

// Get email folders
// Get email folders
// Get email folders
app.post('/api/email/folders', (req, res) => {
  const { email, password } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  
  imap.once('ready', () => {
    // ✅ FIX: Change getBoxes() to getBoxes('*', ...).
    // The '*' wildcard tells the IMAP server to list ALL folders,
    // including nested ones like 'INBOX.Sent' and 'INBOX.Trash'.
    imap.getBoxes('*', (err, boxes) => {
      if (err) {
        imap.end();
        return res.status(400).json({ success: false, error: err.message });
      }
      
      imap.end();

      const sanitizedFolders = Object.keys(boxes).reduce((acc, key) => {
        if (boxes[key]) { 
            acc[key] = {
                attribs: boxes[key].attribs || []
            };
        }
        return acc;
      }, {});

      res.json({ success: true, folders: sanitizedFolders });
    });
  });
  
  imap.once('error', (err) => {
    res.status(400).json({ success: false, error: err.message });
  });
  
  imap.connect();
});
app.post('/api/email/send', upload, async (req, res) => {
  const { email, password, to, subject, body, cc, bcc } = req.body;
  
  if (!email || !password || !to || !subject) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: email, password, to, or subject' 
    });
  }

  const attachments = req.files?.map(file => ({
    filename: file.originalname,
    content: file.buffer
  }));

  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transporter = nodemailer.createTransport(getSmtpConfig(email, password));      
      
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), 30000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log(`SMTP connection verified successfully (attempt ${attempt})`);
      
      const mailOptions = {
        from: email,
        to,
        cc, // ✅ ADDED: CC field
        bcc, // ✅ ADDED: BCC field
        subject,
        html: body,
        attachments
      };
      
      const sendPromise = transporter.sendMail(mailOptions);
      const sendTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Send timeout')), 60000)
      );
      
      const result = await Promise.race([sendPromise, sendTimeoutPromise]);
      
      if (result.messageId) {
        try {
          const imap = new Imap(getImapConfig(email, password));
          
          imap.once('ready', () => {
            const sentFolders = ['INBOX.Sent', 'Sent', 'SENT'];
            let folderIndex = 0;
            
            const trySentFolder = () => {
              if (folderIndex >= sentFolders.length) {
                console.log('No sent folder found, email sent but not saved');
                return;
              }
              
              const folder = sentFolders[folderIndex];
              
              // ✅ UPDATED: Add Cc and Bcc headers to the raw message for storage
              let sentMessage = `From: ${email}\r\nTo: ${to}\r\n`;
              if (cc) sentMessage += `Cc: ${cc}\r\n`;
              // Note: Saving Bcc to the sent folder is for the sender's reference only.
              // Other recipients will not see the Bcc header.
              if (bcc) sentMessage += `Bcc: ${bcc}\r\n`;
              sentMessage += `Subject: ${subject}\r\nDate: ${new Date().toISOString()}\r\nMessage-ID: ${result.messageId}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n`;
              
              let bodyWithAttachments = body;
              if (attachments && attachments.length > 0) {
                bodyWithAttachments += '<hr><p><strong>Attachments:</strong></p><ul>';
                attachments.forEach(att => {
                  const mimeType = att.contentType || 'application/octet-stream';
                  const base64Content = att.content.toString('base64');
                  const fileName = att.filename;
                  const downloadLink = `data:${mimeType};base64,${base64Content}`;
                  bodyWithAttachments += `<li>📎 <a href="${downloadLink}" download="${fileName}">${fileName}</a></li>`;
                });
                bodyWithAttachments += '</ul>';
              }
              
              sentMessage += bodyWithAttachments;
              
              imap.append(sentMessage, { mailbox: folder }, (err) => {
                if (err) {
                  folderIndex++;
                  trySentFolder();
                } else {
                  console.log(`Email saved to ${folder} folder`);
                  imap.end();
                }
              });
            };
            
            trySentFolder();
          });
          
          imap.once('error', (err) => console.log('Could not save to sent folder:', err.message));
          imap.connect();
        } catch (sentError) {
          console.log('Error saving to sent folder:', sentError.message);
        }
      }      
      
      console.log('Email sent successfully:', result);
      return res.json({ 
        success: true, 
        messageId: result.messageId,
        response: result.response 
      });
      
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error);
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  res.status(400).json({ 
    success: false, 
    error: `Failed after ${maxRetries} attempts: ${lastError.message}`,
    code: lastError.code || 'UNKNOWN_ERROR'
  });
});


// Helper function to find a mailbox from a list of possible names
// ✅ REVISED AND MORE ROBUST HELPER FUNCTION
// ✅ REVISED AND MORE ROBUST HELPER FUNCTION
// This single function replaces both `findTrashFolder` and the old `findMailbox`.
// In server.js, replace the existing findMailbox function with this more robust version.

const findMailbox = (boxes, attribute) => {
    const specialUseAttrib = `\\${attribute}`; // e.g., \Sent, \Trash
    for (const key in boxes) {
        if (boxes[key] && Array.isArray(boxes[key].attribs) && boxes[key].attribs.includes(specialUseAttrib)) {
            console.log(`SUCCESS: Found mailbox '${key}' with attribute '${specialUseAttrib}'`);
            return key; // This is the correct, full name of the folder (e.g., 'INBOX.Trash')
        }
    }

    // Fallback for servers that don't use attributes, checking common names
    const commonNames = attribute === 'Sent' ? ['Sent', 'INBOX.Sent'] : ['Trash', 'Junk', 'INBOX.Trash', 'INBOX.Junk'];
    for (const name of commonNames) {
        if (boxes[name]) {
             console.log(`FALLBACK: Found mailbox by common name: '${name}'`);
            return name;
        }
    }
    
    console.error(`ERROR: Could not find any folder with attribute '${specialUseAttrib}' or a common name.`);
    return null;
};


// ✅ NEW: Endpoint to move an email to the trash folder
// ✅ NEW: Endpoint to move an email to the trash folder
// ✅ REVISED: Endpoint to move an email to the trash folder
// ✅ FINAL FIX: Endpoint to move an email to the trash folder
// ✅ FINAL, DEFINITIVE FIX: Endpoint to move an email to the trash folder
// In server.js, replace the move-to-trash endpoint
app.post('/api/email/move-to-trash', (req, res) => {
    const { email, password, uid, sourceFolder: friendlySourceFolder } = req.body;
    if (!uid || !friendlySourceFolder) return res.status(400).json({ success: false, error: 'Missing UID or source folder.' });

    const imap = new Imap(getImapConfig(email, password));

    // ✅ FINAL FIX: Hardcode the standard nested folder names
    const sourceFolderMap = {
        inbox: 'INBOX',
        sent: 'INBOX.Sent' 
    };
    const actualSourceFolder = sourceFolderMap[friendlySourceFolder.toLowerCase()];
    const trashFolderName = 'INBOX.Trash';

    if (!actualSourceFolder) {
        return res.status(404).json({ success: false, error: `Source folder '${friendlySourceFolder}' is not valid.` });
    }

    imap.once('ready', () => {
        imap.openBox(actualSourceFolder, false, (err, box) => {
            if (err) {
                imap.end();
                return res.status(500).json({ success: false, error: `Could not open source folder ${actualSourceFolder}: ${err.message}` });
            }

            imap.move(uid, trashFolderName, (err) => {
                if (err) {
                    imap.end();
                    return res.status(500).json({ success: false, error: `Failed to move email to ${trashFolderName}: ${err.message}` });
                }
                imap.end();
                res.json({ success: true, message: 'Email moved to trash successfully.' });
            });
        });
    });
    imap.once('error', (err) => res.status(400).json({ success: false, error: 'IMAP Connection Error: ' + err.message }));
    imap.connect();
});


// ✅ FINAL, DEFINITIVE FIX: Endpoint to permanently delete an email from the trash
// In server.js, replace the delete-permanently endpoint
app.post('/api/email/delete-permanently', (req, res) => {
    const { email, password, uid } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: 'Missing email UID.' });
    
    const imap = new Imap(getImapConfig(email, password));
    const trashFolderName = 'INBOX.Trash'; // ✅ FINAL FIX: Use the standard nested name

    imap.once('ready', () => {
        imap.openBox(trashFolderName, false, (err, box) => {
            if (err) {
                imap.end();
                return res.status(500).json({ success: false, error: `Could not open Trash folder: ${err.message}` });
            }

            imap.addFlags(uid, '\\Deleted', (err) => {
                if (err) {
                    imap.end();
                    return res.status(500).json({ success: false, error: 'Failed to mark email for deletion: ' + err.message });
                }
                
                imap.closeBox(true, (err) => {
                    if (err) {
                        imap.end();
                        return res.status(500).json({ success: false, error: 'Failed to expunge email: ' + err.message });
                    }
                    imap.end();
                    res.json({ success: true, message: 'Email permanently deleted.' });
                });
            });
        });
    });
    imap.once('error', (err) => res.status(400).json({ success: false, error: 'IMAP Connection Error: ' + err.message }));
    imap.connect();
});
// In server.js

// ✅ NEW HELPER FUNCTION: Tries multiple folder names to find the correct one.
// This function adds resilience and detailed logging.
const openBoxRecursive = (imap, folderNames, readOnly, callback) => {
  if (!folderNames || folderNames.length === 0) {
    return callback(new Error("Could not find a valid folder after trying all options."));
  }

  const currentFolder = folderNames[0];
  const remainingFolders = folderNames.slice(1);

  console.log(`[IMAP DEBUG] Attempting to open folder: '${currentFolder}'`);

  imap.openBox(currentFolder, readOnly, (err, box) => {
    // Check for "mailbox does not exist" or similar errors
    if (err) {
      console.warn(`[IMAP DEBUG] Failed to open '${currentFolder}': ${err.message}`);
      // If the folder doesn't exist, try the next one in the list
      if (err.message.toLowerCase().includes('no such mailbox') || err.message.toLowerCase().includes('does not exist')) {
        openBoxRecursive(imap, remainingFolders, readOnly, callback);
      } else {
        // A more serious error occurred (e.g., authentication), so we stop.
        callback(err);
      }
    } else {
      // Success!
      console.log(`[IMAP DEBUG] Successfully opened folder '${currentFolder}'. It contains ${box.messages.total} messages.`);
      callback(null, box); // Pass success result back
    }
  });
};
// =================================================================
// TEMPORARY DEBUG ENDPOINT - To discover the real folder names
// =================================================================
// =================================================================
// CORRECTED TEMPORARY DEBUG ENDPOINT - This will not crash
// =================================================================
app.post('/api/email/debug-folders', (req, res) => {
    const { email, password } = req.body;
    console.log(`[DEBUG] Attempting to fetch all folders for: ${email}`);
    
    const imap = new Imap(getImapConfig(email, password));

    imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
            if (err) {
                console.error('[DEBUG] Error getting boxes:', err);
                imap.end();
                return res.status(500).json({ success: false, error: 'Failed to get mailboxes: ' + err.message });
            }
            
            // ✅ FIX: Create a clean object to avoid circular references
            const sanitizedFolders = {};
            for (const key in boxes) {
                // We only care about the folder's name (the 'key') and its attributes
                sanitizedFolders[key] = {
                    attribs: boxes[key].attribs || []
                };
            }

            console.log('=============== [DEBUG] SERVER FOLDER LIST ===============');
            // Log the clean, non-circular folder structure
            console.log(JSON.stringify(sanitizedFolders, null, 2));
            console.log('========================================================');
            
            imap.end();
            
            // Send the clean list back as a response
            res.json({
                success: true,
                message: "Successfully retrieved all available mailboxes from the server.",
                folders: sanitizedFolders
            });
        });
    });

    imap.once('error', (err) => {
        console.error('[DEBUG] IMAP connection error:', err);
        res.status(400).json({ success: false, error: 'IMAP Connection Error: ' + err.message });
    });

    imap.connect();
});


// ✅ FINAL, DEFINITIVE FIX: Fetch sent items directly from the correct folder
// ✅ FINAL, DEFINITIVE FIX: Fetch sent items directly from the correct folder
// In server.js, replace the existing '/api/email/fetch-sent' endpoint

// In server.js, replace the '/api/email/fetch-sent' endpoint

// In server.js, replace the fetch-sent endpoint
// In server.js, replace the fetch-sent endpoint

// In server.js, replace the entire fetch-sent endpoint
app.post('/api/email/fetch-sent', (req, res) => {
    const { email, password, limit = 10, offset = 0 } = req.body;
    const sentFolderNames = ['INBOX.Sent', 'Sent'];
    const imap = new Imap(getImapConfig(email, password));

    imap.once('ready', () => {
        openBoxRecursive(imap, sentFolderNames, true, (err, box) => {
            if (err) {
                imap.end();
                return res.status(400).json({ success: false, error: `Could not open Sent folder: ${err.message}` });
            }

            if (box.messages.total === 0) {
                imap.end();
                return res.json({ success: true, emails: [] });
            }

            const emails = [];
            const startSeq = Math.max(1, box.messages.total - (offset + limit) + 1);
            const endSeq = Math.max(1, box.messages.total - offset);

            if (startSeq > endSeq) {
                imap.end();
                return res.json({ success: true, emails: [] });
            }
            
            let emailsProcessed = 0;
            const totalToFetch = endSeq - startSeq + 1;

            const f = imap.seq.fetch(`${startSeq}:${endSeq}`, { bodies: '', struct: true });

            f.on('message', (msg, seqno) => {
                const emailData = { seqno };
                msg.once('attributes', (attrs) => { emailData.uid = attrs.uid; });
                
                msg.on('body', (stream) => {
                    simpleParser(stream, (err, parsed) => {
                        if (parsed) {
                            // ✅ UPDATED: Add cc and bcc fields
                            emailData.from = parsed.from?.text || '';
                            emailData.to = parsed.to?.text || '';
                            emailData.cc = parsed.cc?.text || '';
                            emailData.bcc = parsed.bcc?.text || '';
                            emailData.subject = parsed.subject || '';
                            emailData.date = parsed.date?.toLocaleString() || '';
                            emailData.body = parsed.html || parsed.text || '';
                            emails.push(emailData);
                        }
                        
                        emailsProcessed++;
                        if (emailsProcessed === totalToFetch) {
                            imap.end();
                            emails.sort((a, b) => b.seqno - a.seqno);
                            res.json({ success: true, emails });
                        }
                    });
                });
            });

            f.once('error', (fetchErr) => {
                imap.end();
                res.status(500).json({ success: false, error: 'Failed to fetch emails from sent: ' + fetchErr.message });
            });
        });
    });

    imap.once('error', (err) => res.status(400).json({ success: false, error: 'IMAP Connection Error: ' + err.message }));
    imap.connect();
});




// In server.js

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected.');

  // 1. When a client sends its credentials for authentication
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'auth' && data.email && data.password) {
        const { email, password } = data;
        console.log(`[WebSocket] Authenticating user: ${email}`);

        // If this user already has a connection, close the old one
        if (clients.has(email)) {
          clients.get(email).imap.end();
          clients.get(email).ws.close();
        }
        
        // Create a new persistent IMAP connection for this user
        const imap = new Imap(getImapConfig(email, password));
        
        // Store the new connection details
        clients.set(email, { ws, imap });

        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err, box) => {
            if (err) {
              console.error(`[IMAP Error for ${email}]`, err);
              return;
            }
            console.log(`[IMAP] Inbox opened for ${email}. Listening for new mail.`);
            
            // 2. The magic: Listen for the 'mail' event
            imap.on('mail', (numNewMsgs) => {
              console.log(`[IMAP] New mail event for ${email}:`, numNewMsgs);
              // 3. Notify the client
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'new_mail', count: numNewMsgs }));
              }
            });
          });
        });

        imap.once('error', (err) => {
          console.error(`[IMAP Error for ${email}]`, err.message);
          clients.delete(email);
        });

        imap.once('end', () => {
          console.log(`[IMAP] Connection ended for ${email}.`);
          clients.delete(email);
        });

        imap.connect();
      }
    } catch (e) {
      console.error('[WebSocket] Error processing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected.');
    // Find and close the associated IMAP connection to clean up resources
    for (let [email, clientData] of clients.entries()) {
      if (clientData.ws === ws) {
        clientData.imap.end();
        clients.delete(email);
        break;
      }
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Email backend server running on port ${PORT}`);
});
