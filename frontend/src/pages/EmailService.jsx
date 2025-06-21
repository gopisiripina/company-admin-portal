// emailService.js
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: 'service_65hrv3r',
  templateId: 'template_ci2yvrk', 
  publicKey: 'wNP3uWOO-_tOC-soX'
};

// Initialize EmailJS - Call this once when your app starts
export const initEmailJS = () => {
  try {
    // Use the init method with your public key
    emailjs.init({
      publicKey: EMAILJS_CONFIG.publicKey,
      // Optional: limit the number of requests per 10s to avoid rate limiting
      limitRate: {
        id: 'app_rate_limit',
        throttle: 10000,
      },
    });
    console.log('EmailJS initialized successfully');
    return true;
  } catch (error) {
    console.error('EmailJS initialization failed:', error);
    return false;
  }
};

// Send welcome email to new employee
export const sendEmployeeWelcomeEmail = async (employeeData) => {
  // Define templateParams at the top so it's available in both try and catch blocks
  const templateParams = {
    // Basic email fields
    subject: 'Welcome to Our Platform - Your Account Credentials',
    to_email: employeeData.email,
    from_name: 'HR Team', // Customize this
    title: 'Employee Account Created',
    
    // Template variables matching your HTML template
    to_name: employeeData.name,
    company_name: 'My Access', // Customize this
    user_email: employeeData.email,
    user_password: employeeData.password,
    user_role: employeeData.role,
    website_link: 'https://localhost:5173/' // Replace with your actual login URL
  };

  try {
    console.log('Sending email with data:', employeeData);
    console.log('Template params:', templateParams);
    console.log('Using service:', EMAILJS_CONFIG.serviceId);
    console.log('Using template:', EMAILJS_CONFIG.templateId);

    // Method 1: Use send without passing publicKey (since we initialized it)
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('Welcome email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    console.error('Error status:', error.status);
    console.error('Error text:', error.text);
    
    // Try alternative method if first fails
    try {
      console.log('Trying alternative method...');
      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams, // Now templateParams is available here
        {
          publicKey: EMAILJS_CONFIG.publicKey,
        }
      );
      console.log('Alternative method successful:', response);
      return { success: true, response };
    } catch (altError) {
      console.error('Alternative method also failed:', altError);
      return { 
        success: false, 
        error: altError.text || altError.message || 'Email sending failed' 
      };
    }
  }
};

// Email template variables reference (matching your HTML template)
export const EMAIL_TEMPLATE_VARIABLES = {
  // Email header fields
  subject: '{{subject}}',
  to_email: '{{to_email}}',
  from_name: '{{from_name}}',
  title: '{{title}}',
  
  // Template content variables
  to_name: '{{to_name}}',
  company_name: '{{company_name}}',
  user_email: '{{user_email}}',
  user_password: '{{user_password}}',
  user_role: '{{user_role}}',
  website_link: '{{website_link}}'
};