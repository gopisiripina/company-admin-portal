const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Imap = require('imap');
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');

const app = express();
const PORT = process.env.PORT || 5000;
const multer = require('multer');
const upload = multer().array('attachments');

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
  }
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
  }
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
app.post('/api/email/fetch-trash', (req, res) => {
  const { email, password, limit = 100 } = req.body;
  const imap = new Imap(getImapConfig(email, password));

  imap.once('ready', () => {
    // ✅ FIX: Try multiple trash folder names with INBOX prefix
    const possibleTrashFolders = ['INBOX.Trash', 'Trash', 'INBOX.Deleted Items', 'Deleted Items'];
    let currentFolderIndex = 0;
    
    const tryNextFolder = () => {
      if (currentFolderIndex >= possibleTrashFolders.length) {
        return res.status(400).json({ success: false, error: 'No trash folder found' });
      }
      
      const folder = possibleTrashFolders[currentFolderIndex];
      
      imap.openBox(folder, true, (err, box) => {
        if (err) {
          currentFolderIndex++;
          tryNextFolder();
          return;
        }

        const emails = [];
        const startSeq = Math.max(1, box.messages.total - limit + 1);
        const f = imap.seq.fetch(`${startSeq}:${box.messages.total}`, { bodies: '', struct: true });

        f.on('message', (msg, seqno) => {
          const emailData = { seqno };

          msg.on('body', stream => {
            let buffer = '';
            stream.on('data', chunk => buffer += chunk.toString('utf8'));
            stream.on('end', () => {
              simpleParser(buffer, (err, parsed) => {
                if (!err) {
                  emailData.from = parsed.from?.text || '';
                  emailData.to = parsed.to?.text || '';
                  emailData.subject = parsed.subject || '';
                  emailData.date = parsed.date?.toLocaleString() || '';
                  emailData.body = parsed.html || parsed.text;
                  emails.push(emailData);
                }
              });
            });
          });

          msg.once('attributes', attrs => {
            emailData.uid = attrs.uid;
            emailData.flags = attrs.flags;
          });
        });

        f.once('end', () => {
          emails.sort((a, b) => b.seqno - a.seqno);
          res.json({ success: true, emails });
        });
      });
    };
    
    tryNextFolder();
  });

  imap.once('error', err => res.status(400).json({ success: false, error: err.message }));
  imap.connect();
});
app.post('/api/email/fetch', (req, res) => {
const { email, password, folder = 'INBOX', limit = 10, offset = 0 } = req.body;
  
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
   const start = Math.max(1, total - offset - limit + 1);
const end = total - offset;

// ✅ Prevent invalid fetch range (start > end)
if (end < start) {
  imap.end();
  return res.json({ success: true, emails: [] });
}

const startSeq = Math.max(1, start);
const endSeq = Math.max(1, end);


      
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
app.post('/api/email/send', upload, async (req, res) => {
  const { email, password, to, subject, body } = req.body;
  
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

  // Retry logic
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
const transporter = nodemailer.createTransport(getSmtpConfig(email, password));      
      // Set timeout for verification
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), 30000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log(`SMTP connection verified successfully (attempt ${attempt})`);
      
      const mailOptions = {
        from: email,
        to,
        subject,
        html: body,
        attachments
      };
      
      // Set timeout for sending
      const sendPromise = transporter.sendMail(mailOptions);
      const sendTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Send timeout')), 60000)
      );
      
      const result = await Promise.race([sendPromise, sendTimeoutPromise]);
      
      // ✅ NEW: Save to sent folder after successful send
// ✅ NEW: Save to sent folder after successful send with attachments
if (result.messageId) {
  try {
    const imap = new Imap(getImapConfig(email, password));
    
    imap.once('ready', () => {
      const sentFolders = ['INBOX.Sent', 'Sent', 'SENT'];
      let folderIndex = 0;
      
      const trySentFolder = () => {
        if (folderIndex >= sentFolders.length) {
          console.log('No sent folder found, email sent but not saved to sent folder');
          return;
        }
        
        const folder = sentFolders[folderIndex];
        
        // ✅ FIX: Create proper email message with attachments info
        let sentMessage = `From: ${email}\r\nTo: ${to}\r\nSubject: ${subject}\r\nDate: ${new Date().toISOString()}\r\nMessage-ID: ${result.messageId}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n`;
        
        // Add attachment info to body if attachments exist
        let bodyWithAttachments = body;
   if (attachments && attachments.length > 0) {
  bodyWithAttachments += '<hr><p><strong>Attachments:</strong></p><ul>';
  attachments.forEach(att => {
    const mimeType = att.contentType || 'application/octet-stream';
    const base64Content = att.content.toString('base64');
    const fileName = att.filename;

    // Create download link
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
            console.log(`Email with ${attachments?.length || 0} attachments saved to ${folder} folder`);
            imap.end();
          }
        });
      };
      
      trySentFolder();
    });
    
    imap.once('error', (err) => {
      console.log('Could not save to sent folder:', err.message);
    });
    
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
        console.log(`Retrying in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  res.status(400).json({ 
    success: false, 
    error: `Failed after ${maxRetries} attempts: ${lastError.message}`,
    code: lastError.code || 'UNKNOWN_ERROR'
  });
});// Add this new endpoint after the existing fetch endpoint
app.post('/api/email/fetch-sent', (req, res) => {
  const { email, password, limit = 100 } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  let emailsProcessed = 0;
  let totalEmails = 0;
  
  imap.once('ready', () => {
    // Try different possible sent folder names
    const possibleSentFolders = ['INBOX.Sent', 'Sent', 'SENT', 'Sent Items', 'Sent Mail'];
    
    let currentFolderIndex = 0;
    
    const tryNextFolder = () => {
      if (currentFolderIndex >= possibleSentFolders.length) {
        return res.status(400).json({ success: false, error: 'No sent folder found' });
      }
      
      const folder = possibleSentFolders[currentFolderIndex];
      
      imap.openBox(folder, true, (err, box) => { // ✅ Fixed: Use the correct folder variable
        if (err) {
          currentFolderIndex++;
          tryNextFolder();
          return;
        }
        
        const emails = [];
        const total = box.messages.total;
        totalEmails = total;
        
        if (total === 0) {
          return res.json({ success: true, emails: [] });
        }
        
        // Same email fetching logic as inbox
        const startSeq = Math.max(1, total - limit + 1);
        const endSeq = total;
        
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
                
                if (emailsProcessed >= (endSeq - startSeq + 1)) {
                  imap.end();
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
      });
    };
    
    tryNextFolder();
  });
  
  imap.once('error', (err) => {
    console.error('IMAP error:', err);
    res.status(400).json({ success: false, error: err.message });
  });
  
  imap.connect();
});
app.listen(PORT, () => {
  console.log(`Email backend server running on port ${PORT}`);
});