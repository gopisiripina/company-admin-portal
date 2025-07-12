from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def hello_world():
    return "Hello World"


@app.route('/api/send-email', methods=['POST'])
def send_email():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print

        # Get email configuration
        sender_email = data.get('senderEmail')
        sender_password = data.get('senderPassword')  # App password
        smtp_server = data.get('smtpServer', 'smtp.gmail.com')
        smtp_port = data.get('smtpPort', 587)
        
        # Get email details
        recipient_email = data.get('recipientEmail')
        subject = data.get('subject', 'Welcome - Your Account Credentials')
        
        # Get template variables
        template_data = data.get('templateData', {})
        
        # Validate required fields
        if not sender_email or not sender_password or not recipient_email:
            return jsonify({
                "success": False,
                "error": "Missing required fields: senderEmail, senderPassword, or recipientEmail"
            }), 400

        # Read HTML template from your provided code
        html_template = """<!DOCTYPE html>
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
</html>"""

        # Replace template variables
        for key, value in template_data.items():
            html_template = html_template.replace(f"{{{{{key}}}}}", str(value))

        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = recipient_email

        # Create HTML part
        html_part = MIMEText(html_template, "html")
        message.attach(html_part)

        # Send email
        print("Connecting to SMTP server...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
            print("Email sent successfully!")

        return jsonify({
            "success": True,
            "message": "Email sent successfully",
            "recipient": recipient_email
        }), 200

    except Exception as e:
        print("Exception occurred:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/send-recruitment-email', methods=['POST'])
def send_recruitment_email():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print

        # Get email configuration
        sender_email = data.get('senderEmail')
        sender_password = data.get('senderPassword')  # App password
        smtp_server = data.get('smtpServer', 'smtp.gmail.com')
        smtp_port = data.get('smtpPort', 587)
        
        # Get email details
        recipient_email = data.get('recipientEmail')
        subject = data.get('subject', 'Campus Recruitment Exam Invitation')
        
        # Get template variables
        template_data = data.get('templateData', {})
        
        # Validate required fields
        if not sender_email or not sender_password or not recipient_email:
            return jsonify({
                "success": False,
                "error": "Missing required fields: senderEmail, senderPassword, or recipientEmail"
            }), 400

        # Campus Recruitment HTML template
        html_template = """<!DOCTYPE html>
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
</html>"""

        # Replace template variables
        for key, value in template_data.items():
            html_template = html_template.replace(f"{{{{{key}}}}}", str(value))

        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = recipient_email

        # Create HTML part
        html_part = MIMEText(html_template, "html")
        message.attach(html_part)

        # Send email
        print("Connecting to SMTP server...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
            print("Campus recruitment email sent successfully!")

        return jsonify({
            "success": True,
            "message": "Campus recruitment email sent successfully",
            "recipient": recipient_email
        }), 200

    except Exception as e:
        print("Exception occurred:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/send-job-offer', methods=['POST'])
def send_job_offer():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print

        # Get email configuration
        sender_email = data.get('senderEmail')
        sender_password = data.get('senderPassword')  # App password
        smtp_server = data.get('smtpServer', 'smtp.gmail.com')
        smtp_port = data.get('smtpPort', 587)
        
        # Get email details
        recipient_email = data.get('recipientEmail')
        template_data = data.get('templateData', {})
        
        # Create dynamic subject line
        job_title = template_data.get('job_title', 'Job Position')
        company_name = template_data.get('company_name', 'Our Company')
        subject = data.get('subject', f'Job Offer - {job_title} Position at {company_name}')
        
        # Validate required fields
        if not sender_email or not sender_password or not recipient_email:
            return jsonify({
                "success": False,
                "error": "Missing required fields: senderEmail, senderPassword, or recipientEmail"
            }), 400

        # Job Offer HTML template
        html_template = """<!DOCTYPE html>
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
</html>"""

        # Replace template variables
        for key, value in template_data.items():
            html_template = html_template.replace(f"{{{{{key}}}}}", str(value))

        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = recipient_email

        # Create HTML part
        html_part = MIMEText(html_template, "html")
        message.attach(html_part)

        # Send email
        print("Connecting to SMTP server...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
            print("Job offer email sent successfully!")

        return jsonify({
            "success": True,
            "message": "Job offer email sent successfully",
            "recipient": recipient_email,
            "subject": subject
        }), 200

    except Exception as e:
        print("Exception occurred:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500



@app.route('/api/post-job', methods=['POST'])
def post_job():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print

        job_data = data.get('jobData')
        access_token = data.get('accessToken')
        application_url = data.get('applicationUrl')  # Get the dynamic URL

        print("Job data:", job_data)  # Debug print
        print("Application URL:", application_url)  # Debug print
        print("Access token length:", len(access_token) if access_token else "None")  # Debug print

        if not job_data or not access_token:
            return jsonify({
                "success": False,
                "error": "Missing jobData or accessToken"
            }), 400

        def format_job_post(job, app_url):
            post_text = f"🚀 We're Hiring: {job.get('job_title')}\n\n"
            post_text += f"📍 Location: {job.get('location', 'Not specified')}\n"
            post_text += f"🏢 Department: {job.get('department', 'Not specified')}\n"
            post_text += f"💼 Employment Type: {job.get('employment_type', 'Not specified')}\n"
            post_text += f"⭐ Experience Level: {job.get('experience_level', 'Not specified')}\n"

            if job.get('salary_range'):
                post_text += f"💰 Salary Range: {job['salary_range']}\n"

            post_text += f"\n📋 Job Description:\n{job.get('job_description', 'No description available')}\n\n"

            if job.get('key_responsibilities'):
                post_text += f"🎯 Key Responsibilities:\n{job['key_responsibilities']}\n\n"

            if job.get('qualification_requirements'):
                post_text += f"✅ Qualifications:\n{job['qualification_requirements']}\n\n"

            if job.get('required_skills'):
                skills = job['required_skills']
                if isinstance(skills, list):
                    skills_text = ', '.join(skills)
                else:
                    skills_text = skills
                post_text += f"🛠️ Skills Required:\n{skills_text}\n\n"

            if job.get('additional_benefits'):
                post_text += f"🎁 Benefits:\n{job['additional_benefits']}\n\n"

            # Add the dynamic application URL
            post_text += f"📧 Ready to join our team? Apply now: {app_url}\n\n"
            post_text += f"#Hiring #Jobs #{job.get('department', '').replace(' ', '')} #{job.get('job_title', '').replace(' ', '')}"

            return post_text

        # Use the dynamic application URL or fallback to generic
        final_app_url = application_url or "http://localhost:5173/job-application"
        post_content = format_job_post(job_data, final_app_url)
        print("Post content length:", len(post_content))  # Debug print

        linkedin_payload = {
            "author": "urn:li:person:DWYai5SUO4",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": post_content
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }

        print("Making LinkedIn API request...")  # Debug print
        response = requests.post("https://api.linkedin.com/v2/ugcPosts",
                                 json=linkedin_payload, headers=headers)

        print("LinkedIn API response status:", response.status_code)  # Debug print
        print("LinkedIn API response:", response.text)  # Debug print

        if response.status_code >= 200 and response.status_code < 300:
            return jsonify({
                "success": True,
                "postId": response.json().get('id'),
                "message": "Successfully posted to LinkedIn",
                "applicationUrl": final_app_url  # Return the URL that was used
            }), 200
        else:
            # Return the actual LinkedIn error
            try:
                error_data = response.json()
            except:
                error_data = {"message": response.text}

            return jsonify({
                "success": False,
                "error": error_data,
                "status_code": response.status_code
            }), 422  # Return 422 to match what frontend expects

    except Exception as e:
        print("Exception occurred:", str(e))  # Debug print
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/send-interview-invitation', methods=['POST'])
def send_interview_invitation():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print

        # Extract data from request
        sender_email = data.get('senderEmail')
        sender_password = data.get('senderPassword')
        recipient_email = data.get('recipientEmail')
        subject = data.get('subject')
        smtp_server = data.get('smtpServer')
        smtp_port = data.get('smtpPort')
        template_data = data.get('templateData', {})
        
        print("Sender email:", sender_email)  # Debug print
        print("Recipient email:", recipient_email)  # Debug print
        print("Subject:", subject)  # Debug print
        print("SMTP server:", smtp_server)  # Debug print
        print("SMTP port:", smtp_port)  # Debug print
        print("Template data:", template_data)  # Debug print

        # Validate required fields
        if not sender_email or not sender_password or not recipient_email:
            return jsonify({
                "success": False,
                "error": "Missing senderEmail, senderPassword, or recipientEmail"
            }), 400

        if not smtp_server or not smtp_port:
            return jsonify({
                "success": False,
                "error": "Missing smtpServer or smtpPort"
            }), 400

        # Get template data
        candidate_name = template_data.get('candidate_name', 'Candidate')
        message_body = template_data.get('message_body', 'We would like to invite you for an interview.')
        
        # Use provided subject or create default
        email_subject = subject if subject else f"Interview Invitation - {candidate_name}"

        def create_email_content(candidate_name, message_body):
            # Create the HTML email content
            html_content = f"""
            <html>
            <body>
                <h3>Interview Invitation</h3>
                <p>{message_body}</p>
                <br>
            </body>
            </html>
            """
            return html_content

        # Format the email content
        email_content = create_email_content(candidate_name, message_body)
        
        # Email configuration
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = email_subject
            msg['From'] = sender_email
            msg['To'] = recipient_email
            
            # Create HTML part
            html_part = MIMEText(email_content, 'html')
            msg.attach(html_part)
            
            print("Connecting to SMTP server...")  # Debug print
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            
            print("Sending email...")  # Debug print
            text = msg.as_string()
            server.sendmail(sender_email, recipient_email, text)
            server.quit()
            
            print("Email sent successfully!")  # Debug print
            
            return jsonify({
                "success": True,
                "message": "Interview invitation sent successfully",
                "recipient": recipient_email,
                "subject": email_subject,
                "candidate_name": candidate_name
            }), 200
            
        except smtplib.SMTPAuthenticationError:
            return jsonify({
                "success": False,
                "error": "SMTP Authentication failed. Please check email credentials."
            }), 401
            
        except smtplib.SMTPException as smtp_error:
            return jsonify({
                "success": False,
                "error": f"SMTP Error: {str(smtp_error)}"
            }), 422
            
        except Exception as email_error:
            return jsonify({
                "success": False,
                "error": f"Email sending failed: {str(email_error)}"
            }), 422

    except Exception as e:
        print("Exception occurred:", str(e))  # Debug print
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/send-email-with-attachment', methods=['POST'])
def send_email_with_attachment():
    try:
        # Get form data and files
        sender_email = request.form.get('senderEmail')
        sender_password = request.form.get('senderPassword')
        recipient_email = request.form.get('recipientEmail')
        subject = request.form.get('subject', 'Email with Attachment')
        message_body = request.form.get('messageBody', 'Please find the attached file.')
        smtp_server = request.form.get('smtpServer', 'smtp.gmail.com')
        smtp_port = int(request.form.get('smtpPort', 587))
        
        print(f"Sender: {sender_email}")
        print(f"Recipient: {recipient_email}")
        print(f"Subject: {subject}")
        print(f"SMTP Server: {smtp_server}:{smtp_port}")
        
        # Validate required fields
        if not sender_email or not sender_password or not recipient_email:
            return jsonify({
                "success": False,
                "error": "Missing required fields: senderEmail, senderPassword, or recipientEmail"
            }), 400
        
        # Get uploaded files
        uploaded_files = request.files.getlist('attachments')
        print(f"Number of files uploaded: {len(uploaded_files)}")
        
        if not uploaded_files or all(f.filename == '' for f in uploaded_files):
            return jsonify({
                "success": False,
                "error": "No files uploaded"
            }), 400
        
        # Create message
        message = MIMEMultipart()
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = recipient_email
        
        # Add body to email
        message.attach(MIMEText(message_body, "plain"))
        
        # Process attachments
        attachment_info = []
        for file in uploaded_files:
            if file.filename != '':
                print(f"Processing file: {file.filename}")
                
                # Read file content
                file_content = file.read()
                file_size = len(file_content)
                
                # Create attachment
                from email.mime.base import MIMEBase
                from email import encoders
                
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(file_content)
                encoders.encode_base64(part)
                
                # Add header
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {file.filename}'
                )
                
                # Attach the part to message
                message.attach(part)
                
                attachment_info.append({
                    "filename": file.filename,
                    "size": file_size,
                    "content_type": file.content_type
                })
                
                print(f"Attached file: {file.filename} ({file_size} bytes)")
        
        # Send email
        print("Connecting to SMTP server...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
            print("Email with attachments sent successfully!")
        
        return jsonify({
            "success": True,
            "message": "Email with attachments sent successfully",
            "recipient": recipient_email,
            "subject": subject,
            "attachments": attachment_info,
            "total_attachments": len(attachment_info)
        }), 200
        
    except smtplib.SMTPAuthenticationError:
        return jsonify({
            "success": False,
            "error": "SMTP Authentication failed. Please check email credentials."
        }), 401
        
    except smtplib.SMTPException as smtp_error:
        return jsonify({
            "success": False,
            "error": f"SMTP Error: {str(smtp_error)}"
        }), 422
        
    except Exception as e:
        print("Exception occurred:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
