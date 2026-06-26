const express = require('express');
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

    // Send response immediately
    console.log('📤 Sending response to client');
    res.json({
      success: true,
      message: 'Lead submitted successfully'
    });
    console.log('✅ Response sent');

    // Send email asynchronously (don't wait for it)
    sendEmail(fullName, email, requirement, trackingToken)
      .then(() => {
        console.log(`✅ Email sent successfully to ${email}`);
      })
      .catch((emailErr) => {
        console.error('Error sending email:', emailErr);
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send personalized email with tracking
async function sendEmail(name, email, requirement, trackingToken) {
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

  console.log(`📊 Email opened by token: ${token}`);

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(pixel);
});

// Link click tracking endpoint
app.get('/api/track/click/:token', (req, res) => {
  const { token } = req.params;

  console.log(`🔗 Link clicked by token: ${token}`);

  // Redirect to actual link
  res.redirect('https://example.com');
});

// Analytics dashboard API
app.get('/api/analytics', (req, res) => {
  res.json({
    totalLeads: 0,
    totalEmailsSent: 0,
    totalEmailsOpened: 0,
    openRate: 0,
    totalLinkClicks: 0,
    clickRate: 0,
    message: 'Analytics require a database. Currently running in demo mode.'
  });
});

// Get all leads
app.get('/api/leads', (req, res) => {
  res.json({
    leads: [],
    message: 'Lead history requires a database. Currently running in demo mode.'
  });
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
