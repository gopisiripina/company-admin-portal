import React, { useState, useEffect } from 'react';
import { Mail, Send, Inbox,  Trash,  Loader, RefreshCw, Pencil } from 'lucide-react';

const EmailClient = ({ userRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailCredentials, setEmailCredentials] = useState({ email: '', password: '' });
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });

  const API_BASE = 'http://192.168.68.133:5000/api/email';

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailCredentials)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsAuthenticated(true);
        fetchEmails();
      } else {
        alert('Authentication failed: ' + result.error);
      }
    } catch (error) {
      alert('Connection error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async (folder = 'INBOX') => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailCredentials,
          folder,
          limit: 50
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEmails(result.emails);
      } else {
        alert('Failed to fetch emails: ' + result.error);
      }
    } catch (error) {
      alert('Error fetching emails: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailCredentials,
          ...composeData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Email sent successfully!');
        setComposeData({ to: '', subject: '', body: '' });
        setActiveFolder('inbox');
        fetchEmails();
      } else {
        alert('Failed to send email: ' + result.error);
      }
    } catch (error) {
      alert('Error sending email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAuthForm = () => (
    <div className="email-auth-container" style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Connect to Your Hostinger Email</h2>
      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email"
          placeholder="Your Hostinger Email"
          value={emailCredentials.email}
          onChange={(e) => setEmailCredentials({...emailCredentials, email: e.target.value})}
          required
          style={{ padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
        />
        <input
          type="password"
          placeholder="Email Password"
          value={emailCredentials.password}
          onChange={(e) => setEmailCredentials({...emailCredentials, password: e.target.value})}
          required
          style={{ padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '0.75rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.375rem',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? <Loader className="animate-spin" /> : 'Connect Email'}
        </button>
      </form>
    </div>
  );

  const renderEmailList = () => (
    <div style={{ flex: 1, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Inbox ({emails.length})</h3>
        <button 
          onClick={() => fetchEmails()}
          style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '0.375rem' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader className="animate-spin" />
          <p>Loading emails...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {emails.map((email, index) => (
            <div
              key={index}
              onClick={() => setSelectedEmail(email)}
              style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                backgroundColor: selectedEmail === email ? '#f3f4f6' : 'white'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{email.from}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{email.subject}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{email.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompose = () => (
    <div style={{ flex: 1, padding: '1rem' }}>
      <h3>Compose Email</h3>
      <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email"
          placeholder="To"
          value={composeData.to}
          onChange={(e) => setComposeData({...composeData, to: e.target.value})}
          required
          style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
        <input
          type="text"
          placeholder="Subject"
          value={composeData.subject}
          onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
          required
          style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
        <textarea
          placeholder="Email body"
          value={composeData.body}
          onChange={(e) => setComposeData({...composeData, body: e.target.value})}
          required
          rows={10}
          style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
        <button 
          type="submit"
          disabled={loading}
          style={{ 
            padding: '0.75rem', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.375rem'
          }}
        >
          {loading ? <Loader className="animate-spin" /> : 'Send Email'}
        </button>
      </form>
    </div>
  );

  const renderEmailInterface = () => (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: '250px', backgroundColor: '#f9fafb', padding: '1rem', borderRight: '1px solid #e5e7eb' }}>
        <button 
          onClick={() => setActiveFolder('inbox')}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            marginBottom: '0.5rem',
            backgroundColor: activeFolder === 'inbox' ? '#3b82f6' : 'transparent',
            color: activeFolder === 'inbox' ? 'white' : 'black',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          <Inbox size={16} style={{ marginRight: '0.5rem' }} />
          Inbox
        </button>
        <button 
          onClick={() => setActiveFolder('compose')}
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            backgroundColor: activeFolder === 'compose' ? '#3b82f6' : 'transparent',
            color: activeFolder === 'compose' ? 'white' : 'black',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
         <Pencil size={16} style={{ marginRight: '0.5rem' }} />
          Compose
        </button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeFolder === 'inbox' && renderEmailList()}
        {activeFolder === 'compose' && renderCompose()}
      </div>
      
      {selectedEmail && activeFolder === 'inbox' && (
        <div style={{ width: '400px', borderLeft: '1px solid #e5e7eb', padding: '1rem' }}>
          <h4>{selectedEmail.subject}</h4>
          <p><strong>From:</strong> {selectedEmail.from}</p>
          <p><strong>Date:</strong> {selectedEmail.date}</p>
          <hr />
          <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="email-client" style={{ height: '100%' }}>
      {!isAuthenticated ? renderAuthForm() : renderEmailInterface()}
    </div>
  );
};

export default EmailClient;