from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    app.run(debug=True)
