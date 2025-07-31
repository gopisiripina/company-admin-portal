const express = require('express');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const multer = require('multer');

const router = express.Router();
const upload = multer().array('attachments');

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
  connTimeout: 90000,
  authTimeout: 10000,
  keepalive: {
    interval: 10000,
    forceNoop: true
  },
  family: 4 
});

const getSmtpConfig = (email, password) => ({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
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

// Helper function to find mailbox
const findMailbox = (boxes, attribute) => {
    const specialUseAttrib = `\\${attribute}`;
    for (const key in boxes) {
        if (boxes[key] && Array.isArray(boxes[key].attribs) && boxes[key].attribs.includes(specialUseAttrib)) {
            console.log(`SUCCESS: Found mailbox '${key}' with attribute '${specialUseAttrib}'`);
            return key;
        }
    }

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

const openBoxRecursive = (imap, folderNames, readOnly, callback) => {
  if (!folderNames || folderNames.length === 0) {
    return callback(new Error("Could not find a valid folder after trying all options."));
  }

  const currentFolder = folderNames[0];
  const remainingFolders = folderNames.slice(1);

  console.log(`[IMAP DEBUG] Attempting to open folder: '${currentFolder}'`);

  imap.openBox(currentFolder, readOnly, (err, box) => {
    if (err) {
      console.warn(`[IMAP DEBUG] Failed to open '${currentFolder}': ${err.message}`);
      if (err.message.toLowerCase().includes('no such mailbox') || err.message.toLowerCase().includes('does not exist')) {
        openBoxRecursive(imap, remainingFolders, readOnly, callback);
      } else {
        callback(err);
      }
    } else {
      console.log(`[IMAP DEBUG] Successfully opened folder '${currentFolder}'. It contains ${box.messages.total} messages.`);
      callback(null, box);
    }
  });
};

// Test email connection
router.post('/test-connection', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Testing connection with:', { email, host: 'imap.hostinger.com', port: 993 });
  
  const imap = new Imap(getImapConfig(email, password));
  
  const timeout = setTimeout(() => {
    imap.destroy();
    res.status(400).json({ 
      success: false, 
      error: 'Connection timeout - please check your email credentials and internet connection' 
    });
  }, 30000);
  
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
});

// Fetch emails from specific folder
router.post('/fetch', (req, res) => {
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

// Fetch trash emails
router.post('/fetch-trash', (req, res) => {
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

// Fetch sent emails
router.post('/fetch-sent', (req, res) => {
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

// Get email folders
router.post('/folders', (req, res) => {
  const { email, password } = req.body;
  
  const imap = new Imap(getImapConfig(email, password));
  
  imap.once('ready', () => {
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

// Send email
router.post('/send', upload, async (req, res) => {
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
      const transporter = nodemailer.createTransporter(getSmtpConfig(email, password));      
      
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), 30000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log(`SMTP connection verified successfully (attempt ${attempt})`);
      
      const mailOptions = {
        from: email,
        to,
        cc,
        bcc,
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
              
              let sentMessage = `From: ${email}\r\nTo: ${to}\r\n`;
              if (cc) sentMessage += `Cc: ${cc}\r\n`;
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

// Move email to trash
router.post('/move-to-trash', (req, res) => {
    const { email, password, uid, sourceFolder: friendlySourceFolder } = req.body;
    if (!uid || !friendlySourceFolder) return res.status(400).json({ success: false, error: 'Missing UID or source folder.' });

    const imap = new Imap(getImapConfig(email, password));

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

// Delete email permanently
router.post('/delete-permanently', (req, res) => {
    const { email, password, uid } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: 'Missing email UID.' });
    
    const imap = new Imap(getImapConfig(email, password));
    const trashFolderName = 'INBOX.Trash';

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

// Debug folders endpoint
router.post('/debug-folders', (req, res) => {
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
            
            const sanitizedFolders = {};
            for (const key in boxes) {
                sanitizedFolders[key] = {
                    attribs: boxes[key].attribs || []
                };
            }

            console.log('=============== [DEBUG] SERVER FOLDER LIST ===============');
            console.log(JSON.stringify(sanitizedFolders, null, 2));
            console.log('========================================================');
            
            imap.end();
            
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

module.exports = router;