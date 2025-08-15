const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Imap = require('imap');
const http = require('http');
const { WebSocketServer } = require('ws');
const donenv = require('dotenv');

require('dotenv').config();
// Import route modules
const emailRoutes = require('./routes/emailRoutes');
const generalRoutes = require('./routes/generalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store active client connections (email -> { ws, imapConnection })
const clients = new Map();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['https://cap.myaccessio.com', 'http://localhost:5173','http://localhost:5174'],
  credentials: true
}));

// Add proxy trust
app.set('trust proxy', true);

// Routes
app.use('/api', generalRoutes);
app.use('/api/email', emailRoutes);

// Hostinger Email Configuration for WebSocket
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

// WebSocket connection handling
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
            
            // Listen for the 'mail' event
            imap.on('mail', (numNewMsgs) => {
              console.log(`[IMAP] New mail event for ${email}:`, numNewMsgs);
              // Notify the client
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