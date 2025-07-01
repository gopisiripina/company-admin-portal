from flask import Flask, request, jsonify
import requests
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

@app.route('/api/post-job', methods=['POST'])
def post_job():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print
        
        job_data = data.get('jobData')
        access_token = data.get('accessToken')
        
        print("Job data:", job_data)  # Debug print
        print("Access token length:", len(access_token) if access_token else "None")  # Debug print

        if not job_data or not access_token:
            return jsonify({
                "success": False,
                "error": "Missing jobData or accessToken"
            }), 400

        def format_job_post(job):
            post_text = f"🚀 We're Hiring: {job.get('job_title')}\n\n"
            post_text += f"📍 Location: {job.get('location', 'Not specified')}\n"
            post_text += f"🏢 Department: {job.get('department', 'Not specified')}\n"
            post_text += f"💼 Employment Type: {job.get('employment_type', 'Not specified')}\n"
            post_text += f"⭐ Experience Level: {job.get('experience_level', 'Not specified')}\n"

            if job.get('salary_range'):
                post_text += f"💰 Salary Range: {job['salary_range']}\n"

            post_text += f"\n📋 Job Description:\n{job.get('description', 'No description available')}\n\n"

            if job.get('responsibilities'):
                post_text += f"🎯 Key Responsibilities:\n{job['responsibilities']}\n\n"

            if job.get('qualifications'):
                post_text += f"✅ Qualifications:\n{job['qualifications']}\n\n"

            if job.get('skills') and isinstance(job['skills'], list):
                post_text += f"🛠️ Skills Required:\n{', '.join(job['skills'])}\n\n"

            if job.get('benefits'):
                post_text += f"🎁 Benefits:\n{job['benefits']}\n\n"

            post_text += "📧 Ready to join our team? Apply now!\n\n"
            post_text += f"#Hiring #Jobs #{job.get('department', '').replace(' ', '')} #{job.get('job_title', '').replace(' ', '')}"

            return post_text

        post_content = format_job_post(job_data)
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
                "message": "Successfully posted to LinkedIn"
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
