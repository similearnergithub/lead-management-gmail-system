const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize SQLite Database
const db = new sqlite3.Database('./leads.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables
db.serialize(() => {
  // Leads table
  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    requirement TEXT NOT NULL,
    submission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    email_sent BOOLEAN DEFAULT 0,
    email_opened BOOLEAN DEFAULT 0,
    email_opened_at DATETIME,
    link_clicked BOOLEAN DEFAULT 0,
    link_clicked_at DATETIME,
    tracking_token TEXT UNIQUE
  )`);

  // Email events table for detailed tracking
  db.run(`CREATE TABLE IF NOT EXISTS email_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    event_type TEXT NOT NULL,
    event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  )`);
});

// Email configuration
// Set USE_ETHEREAL=false in .env to use real email service
let transporter;
const useEthereal = process.env.USE_ETHEREAL !== 'false';

async function setupEmail() {
  if (useEthereal) {
    // Demo mode: Create test account at https://ethereal.email/
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Demo Mode: Using Ethereal test email');
    console.log('   View sent emails at: https://ethereal.email/');
    console.log('   Username:', testAccount.user);
    console.log('   To use real email, set USE_ETHEREAL=false in .env file');
  } else {
    // Production mode: Use real SMTP service
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      throw new Error('EMAIL_USER and EMAIL_PASS must be set in .env file for production');
    }

    if (emailService === 'gmail') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
      console.log('📧 Production Mode: Using Gmail SMTP');
    } else if (emailService === 'sendgrid') {
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: emailPass
        }
      });
      console.log('📧 Production Mode: Using SendGrid SMTP');
    } else {
      // Custom SMTP
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
      console.log(`📧 Production Mode: Using custom SMTP (${process.env.EMAIL_HOST})`);
    }
  }
}

// Initialize email setup
setupEmail().catch(err => {
  console.error('❌ Failed to setup email:', err.message);
  console.error('   Please check your .env configuration');
});

// Generate unique tracking token
function generateTrackingToken() {
  return crypto.randomBytes(32).toString('hex');
}

// API endpoint to submit lead form
app.post('/api/submit-lead', async (req, res) => {
  console.log('📨 Received lead submission:', req.body);
  try {
    const { fullName, email, phone, company, requirement } = req.body;

    if (!fullName || !email || !requirement) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Full name, email, and requirement are required' });
    }

    const trackingToken = generateTrackingToken();
    console.log('📝 Generated tracking token:', trackingToken);

    // Store lead in database
    db.run(
      `INSERT INTO leads (full_name, email, phone, company, requirement, tracking_token)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, phone, company, requirement, trackingToken],
      function(err) {
        if (err) {
          console.error('❌ Error inserting lead:', err);
          return res.status(500).json({ error: 'Failed to save lead' });
        }

        const leadId = this.lastID;
        console.log('✅ Lead saved with ID:', leadId);

        // Respond immediately to avoid timeout
        console.log('📤 Sending response to client');
        res.json({
          success: true,
          message: 'Lead submitted successfully',
          leadId: leadId
        });
        console.log('✅ Response sent');

        // Send email asynchronously (don't wait for it)
        sendEmail(fullName, email, requirement, trackingToken, leadId)
          .then(() => {
            // Update email_sent status
            db.run(
              'UPDATE leads SET email_sent = 1 WHERE id = ?',
              [leadId],
              (err) => {
                if (err) console.error('Error updating email_sent:', err);
              }
            );
            console.log(`✅ Email sent successfully to ${email}`);
          })
          .catch((emailErr) => {
            console.error('Error sending email:', emailErr);
          });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send personalized email with tracking
async function sendEmail(name, email, requirement, trackingToken, leadId) {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  const trackingPixelUrl = `${baseUrl}/api/track/open/${trackingToken}`;
  const trackableLink = `${baseUrl}/api/track/click/${trackingToken}`;

  const fromEmail = useEthereal ? 'noreply@leadsystem.com' : (process.env.EMAIL_USER || 'your-email@gmail.com');
  const mailOptions = {
    from: fromEmail,
    to: email,
    subject: 'Thank you for reaching out!',
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hi ${name},</h2>
          <p>Thank you for reaching out.</p>
          <p>We received your requirement: "<strong>${requirement}</strong>"</p>
          <p>Learn more: <a href="${trackableLink}" style="color: #007bff; text-decoration: none;">Click here to learn more</a></p>
          <p>Regards,<br>Team</p>
          <img src="${trackingPixelUrl}" width="1" height="1" style="display: none;" alt="" />
        </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Email open tracking endpoint (tracking pixel)
app.get('/api/track/open/:token', (req, res) => {
  const { token } = req.params;

  db.get(
    'SELECT id FROM leads WHERE tracking_token = ?',
    [token],
    (err, row) => {
      if (err) {
        console.error('Error finding lead:', err);
        return res.sendStatus(404);
      }

      if (row) {
        // Update email opened status
        db.run(
          'UPDATE leads SET email_opened = 1, email_opened_at = CURRENT_TIMESTAMP WHERE id = ?',
          [row.id],
          (err) => {
            if (err) console.error('Error updating email_opened:', err);
          }
        );

        // Log event
        db.run(
          'INSERT INTO email_events (lead_id, event_type, ip_address, user_agent) VALUES (?, ?, ?, ?)',
          [row.id, 'open', req.ip, req.get('user-agent')],
          (err) => {
            if (err) console.error('Error logging open event:', err);
          }
        );
      }

      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pixel);
    }
  );
});

// Link click tracking endpoint
app.get('/api/track/click/:token', (req, res) => {
  const { token } = req.params;

  db.get(
    'SELECT id FROM leads WHERE tracking_token = ?',
    [token],
    (err, row) => {
      if (err) {
        console.error('Error finding lead:', err);
        return res.redirect('https://example.com');
      }

      if (row) {
        // Update link clicked status
        db.run(
          'UPDATE leads SET link_clicked = 1, link_clicked_at = CURRENT_TIMESTAMP WHERE id = ?',
          [row.id],
          (err) => {
            if (err) console.error('Error updating link_clicked:', err);
          }
        );

        // Log event
        db.run(
          'INSERT INTO email_events (lead_id, event_type, ip_address, user_agent) VALUES (?, ?, ?, ?)',
          [row.id, 'click', req.ip, req.get('user-agent')],
          (err) => {
            if (err) console.error('Error logging click event:', err);
          }
        );
      }

      // Redirect to actual link
      res.redirect('https://example.com');
    }
  );
});

// Analytics dashboard API
app.get('/api/analytics', (req, res) => {
  const queries = {
    totalLeads: 'SELECT COUNT(*) as count FROM leads',
    totalEmailsSent: 'SELECT COUNT(*) as count FROM leads WHERE email_sent = 1',
    totalEmailsOpened: 'SELECT COUNT(*) as count FROM leads WHERE email_opened = 1',
    totalLinkClicks: 'SELECT COUNT(*) as count FROM leads WHERE link_clicked = 1'
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  for (const [key, query] of Object.entries(queries)) {
    db.get(query, (err, row) => {
      if (err) {
        console.error(`Error fetching ${key}:`, err);
        results[key] = 0;
      } else {
        results[key] = row.count;
      }

      completed++;

      if (completed === totalQueries) {
        const totalLeads = results.totalLeads || 0;
        const totalEmailsSent = results.totalEmailsSent || 0;
        const totalEmailsOpened = results.totalEmailsOpened || 0;
        const totalLinkClicks = results.totalLinkClicks || 0;

        const openRate = totalEmailsSent > 0 ? ((totalEmailsOpened / totalEmailsSent) * 100).toFixed(2) : 0;
        const clickRate = totalEmailsSent > 0 ? ((totalLinkClicks / totalEmailsSent) * 100).toFixed(2) : 0;

        res.json({
          totalLeads,
          totalEmailsSent,
          totalEmailsOpened,
          openRate: parseFloat(openRate),
          totalLinkClicks,
          clickRate: parseFloat(clickRate)
        });
      }
    });
  }
});

// Get all leads
app.get('/api/leads', (req, res) => {
  db.all(
    'SELECT * FROM leads ORDER BY submission_time DESC',
    (err, rows) => {
      if (err) {
        console.error('Error fetching leads:', err);
        return res.status(500).json({ error: 'Failed to fetch leads' });
      }
      res.json(rows);
    }
  );
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server (only for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Form: http://localhost:${PORT}/`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
  });
}

module.exports = app;
