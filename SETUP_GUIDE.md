# Quick Setup Guide - Real Email Configuration

## Current Status
✅ Server is running on http://localhost:3000
✅ Database is working (2 leads already submitted)
✅ API endpoints are functional
✅ Frontend pages are ready
⚠️  Email needs configuration for real sending

## To Enable Real Email Sending

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (custom name)"
   - Copy the 16-character password

3. **Update .env File**
   ```env
   USE_ETHEREAL=false
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

4. **Restart Server**
   ```bash
   node server.js
   ```

### Option 2: SendGrid (For Production)

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com
   - Get your API key from Settings → API Keys

2. **Update .env File**
   ```env
   USE_ETHEREAL=false
   EMAIL_SERVICE=sendgrid
   EMAIL_USER=apikey
   EMAIL_PASS=your-sendgrid-api-key
   ```

3. **Restart Server**

### Option 3: Any SMTP Service

```env
USE_ETHEREAL=false
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Testing the System

### 1. Submit a Test Lead
```bash
curl -X POST http://localhost:3000/api/submit-lead \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"John Doe\",\"email\":\"john@example.com\",\"phone\":\"1234567890\",\"company\":\"Test Corp\",\"requirement\":\"Need a website\"}"
```

### 2. Check Analytics
```bash
curl http://localhost:3000/api/analytics
```

### 3. View in Browser
- Form: http://localhost:3000/
- Dashboard: http://localhost:3000/dashboard

## How It Works

1. **Lead Submission**: User fills form → Data saved to SQLite → Email sent
2. **Email Tracking**: Email contains invisible pixel + trackable link
3. **Open Tracking**: When email is opened, pixel loads → Records open event
4. **Click Tracking**: When link is clicked → Records click → Redirects to destination
5. **Dashboard**: Shows real-time stats and all leads with engagement status

## Demo Mode (Current)

Currently running in **Ethereal Demo Mode**:
- Emails are sent to test accounts
- View emails at https://ethereal.email/
- No real emails are sent to actual users
- Perfect for testing the system

## Production Mode

Set `USE_ETHEREAL=false` in .env and configure real SMTP credentials to send actual emails to real users.

## Features Implemented

✅ Lead capture form with validation
✅ SQLite database storage
✅ Automated personalized emails
✅ Email open tracking (1x1 pixel)
✅ Link click tracking
✅ Analytics dashboard
✅ Real-time statistics
✅ Lead management table
✅ Responsive design
✅ XSS protection
✅ Input validation

## Access Points

- **Lead Form**: http://localhost:3000/
- **Dashboard**: http://localhost:3000/dashboard
- **API Analytics**: http://localhost:3000/api/analytics
- **API Leads**: http://localhost:3000/api/leads

## Next Steps

1. Configure real email in .env file
2. Restart the server
3. Test with real email addresses
4. Deploy to production (Heroku, Vercel, AWS, etc.)

## Troubleshooting

**Emails not sending?**
- Check .env credentials
- For Gmail: Use App Password (not regular password)
- Verify 2FA is enabled
- Check spam folder

**Database errors?**
- Delete leads.db file
- Restart server (will recreate)

**Port already in use?**
- Change PORT in .env file
- Or kill process on port 3000