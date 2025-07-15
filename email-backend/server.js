const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Imap = require('imap');
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Hostinger Email Configuration
const getImapConfig = (email, password) => ({
  user: email,
  password: password,
  host: 'imap.hostinger.com',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
});

const getSmtpConfig = (email, password) => ({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: email,
    pass: password
  }
});

// Test email connection
app.post('/api/email/test-connection', (req, res) => {
  const { email, password } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  
  imap.once('ready', () => {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        return res.status(400).json({ success: false, error: 'Failed to connect to mailbox' });
      }
      
      imap.end();
      res.json({ 
        success: true, 
        message: 'Connected successfully',
        totalMessages: box.messages.total
      });
    });
  });
  
  imap.once('error', (err) => {
    res.status(400).json({ success: false, error: err.message });
  });
  
  imap.connect();
});

// Fetch emails from specific folder
app.post('/api/email/fetch', (req, res) => {
  const { email, password, folder = 'INBOX', limit = 50 } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  
  imap.once('ready', () => {
    imap.openBox(folder, true, (err, box) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      const emails = [];
      const total = box.messages.total;
      
      if (total === 0) {
        return res.json({ success: true, emails: [] });
      }
      
      // Fetch recent emails
      const fetchRange = `${Math.max(1, total - limit + 1)}:${total}`;
      
      const f = imap.seq.fetch(fetchRange, {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
        struct: true
      });
      
      f.on('message', (msg, seqno) => {
        const emailData = { seqno };
        
        msg.on('body', (stream, info) => {
          let buffer = '';
          
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
          
          stream.once('end', () => {
            if (info.which === 'TEXT') {
              emailData.body = buffer;
            } else {
              // Parse header
              const lines = buffer.split('\r\n');
              lines.forEach(line => {
                if (line.startsWith('From:')) emailData.from = line.substring(5).trim();
                if (line.startsWith('To:')) emailData.to = line.substring(3).trim();
                if (line.startsWith('Subject:')) emailData.subject = line.substring(8).trim();
                if (line.startsWith('Date:')) emailData.date = line.substring(5).trim();
              });
            }
          });
        });
        
        msg.once('attributes', (attrs) => {
          emailData.uid = attrs.uid;
          emailData.flags = attrs.flags;
          emailData.date = attrs.date;
        });
        
        msg.once('end', () => {
          emails.push(emailData);
        });
      });
      
      f.once('error', (err) => {
        res.status(400).json({ success: false, error: err.message });
      });
      
      f.once('end', () => {
        imap.end();
        // Sort emails by date (newest first)
        emails.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json({ success: true, emails });
      });
    });
  });
  
  imap.once('error', (err) => {
    res.status(400).json({ success: false, error: err.message });
  });
  
  imap.connect();
});

// Send email
app.post('/api/email/send', async (req, res) => {
  const { email, password, to, subject, body, cc, bcc } = req.body;
  
  try {
    const transporter = nodemailer.createTransporter(getSmtpConfig(email, password));
    
    const mailOptions = {
      from: email,
      to: to,
      subject: subject,
      html: body,
      cc: cc || '',
      bcc: bcc || ''
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId 
    });
    
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get email folders
app.post('/api/email/folders', (req, res) => {
  const { email, password } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  
  imap.once('ready', () => {
    imap.getBoxes((err, boxes) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      imap.end();
      res.json({ success: true, folders: boxes });
    });
  });
  
  imap.once('error', (err) => {
    res.status(400).json({ success: false, error: err.message });
  });
  
  imap.connect();
});

app.listen(PORT,"192.168.68.133", () => {
  console.log(`Email backend server running on port ${PORT}`);
});