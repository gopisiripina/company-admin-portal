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
  },
  authTimeout: 30000,
  connTimeout: 30000,
  keepalive: {
    interval: 10000,
    idleInterval: 300000,
    forceNoop: true
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
    console.log('IMAP connection established');
    imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        console.error('Mailbox error:', err);
        return res.status(400).json({ success: false, error: 'Failed to connect to mailbox: ' + err.message });
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
    res.status(400).json({ success: false, error: 'Connection failed: ' + err.message });
  });
  
  imap.once('end', () => {
    console.log('IMAP connection closed');
  });
  
  try {
    imap.connect();
  } catch (err) {
    console.error('Connection attempt failed:', err);
    res.status(400).json({ success: false, error: 'Failed to initiate connection: ' + err.message });
  }
});
// Fetch emails from specific folder
app.post('/api/email/fetch', (req, res) => {
  const { email, password, folder = 'INBOX', limit = 100 } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  let emailsProcessed = 0;
  let totalEmails = 0;
  
  imap.once('ready', () => {
    imap.openBox(folder, true, (err, box) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      const emails = [];
      const total = box.messages.total;
      totalEmails = total;
      
      if (total === 0) {
        return res.json({ success: true, emails: [] });
      }
      
      // Fetch the most recent emails (last 'limit' emails)
      const startSeq = Math.max(1, total - limit + 1);
      const endSeq = total;
      
      console.log(`Fetching emails from ${startSeq} to ${endSeq} (total: ${total})`);
      
      const f = imap.seq.fetch(`${startSeq}:${endSeq}`, {
        bodies: '',
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
            simpleParser(buffer, (err, parsed) => {
              if (err) {
                console.error('Error parsing email:', err);
                emailsProcessed++;
                return;
              }
              
              emailData.from = parsed.from ? parsed.from.text : 'Unknown';
              emailData.to = parsed.to ? parsed.to.text : 'Unknown';
              emailData.subject = parsed.subject || 'No Subject';
              emailData.date = parsed.date ? parsed.date.toLocaleDateString() + ' ' + parsed.date.toLocaleTimeString() : new Date().toLocaleDateString();
              emailData.body = parsed.html || parsed.text || 'No content';
              
              emails.push(emailData);
              emailsProcessed++;
              
              // Check if all emails are processed
              if (emailsProcessed >= (endSeq - startSeq + 1)) {
                imap.end();
                // Sort emails by sequence number (newest first)
                emails.sort((a, b) => b.seqno - a.seqno);
                res.json({ success: true, emails });
              }
            });
          });
        });
        
        msg.once('attributes', (attrs) => {
          emailData.uid = attrs.uid;
          emailData.flags = attrs.flags;
        });
      });
      
      f.once('error', (err) => {
        console.error('Fetch error:', err);
        res.status(400).json({ success: false, error: err.message });
      });
      
      f.once('end', () => {
        // This will be handled in the message processing
        console.log('Fetch completed');
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
app.post('/api/email/send', async (req, res) => {
  const { email, password, to, subject, body, cc, bcc } = req.body;
  
  try {
    const transporter = nodemailer.createTransport(getSmtpConfig(email, password));
    
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

app.listen(PORT,"", () => {
  console.log(`Email backend server running on port ${PORT}`);
});