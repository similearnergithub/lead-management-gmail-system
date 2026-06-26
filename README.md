# Automated Lead Management & Email Tracking System

A complete system for capturing leads, sending personalized emails, and tracking email engagement through a comprehensive dashboard.

## Features

### ✅ Lead Capture Form
- Collects: Full Name, Email, Phone, Company (optional), Requirement/Message
- Form validation and user-friendly interface
- Responsive design for all devices

### ✅ Database Storage
- SQLite database for storing all lead information
- Tracks submission timestamps
- Stores email engagement data

### ✅ Automated Personalized Email
- Sends personalized emails using Nodemailer
- Dynamic content with user's name and requirement
- Includes trackable links and tracking pixels

### ✅ Email Open Tracking
- 1x1 transparent tracking pixel in emails
- Tracks when emails are opened
- Logs timestamp and user agent

### ✅ Link Click Tracking
- Trackable links in emails
- Records click events with IP and timestamp
- Redirects users to actual destination

### ✅ Analytics Dashboard
- Real-time statistics:
  - Total Leads
  - Emails Sent
  - Emails Opened
  - Open Rate %
  - Links Clicked
  - Click Rate %
- Recent leads table with engagement status
- Auto-refresh every 30 seconds

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Email**: Nodemailer
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Security**: XSS protection, input validation

## Architecture

```
┌─────────────────┐
│   Lead Form     │
│   (index.html)  │
└────────┬────────┘
         │ POST /api/submit-lead
         ▼
┌─────────────────┐
│   Express.js    │
│   Server        │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  SQLite DB   │   │  Nodemailer  │
│  (leads.db)  │   │   (Email)    │
└──────────────┘   └──────────────┘
         │                 │
         │                 │
         ▼                 ▼
┌──────────────────────────────────────┐
│      Analytics Dashboard             │
│      (dashboard.html)                │
│                                      │
│  - GET /api/analytics                │
│  - GET /api/leads                    │
│  - GET /api/track/open/:token        │
│  - GET /api/track/click/:token       │
└──────────────────────────────────────┘
```

## How Tracking Works

### Email Open Tracking
1. When an email is sent, a 1x1 transparent GIF image is embedded
2. The image source points to: `/api/track/open/:token`
3. When the email client loads the image, it hits our server
4. Server records the open event and updates the database
5. Returns the transparent pixel to the email client

### Link Click Tracking
1. All links in emails point to: `/api/track/click/:token`
2. When user clicks, server records the click event
3. Server updates database with click timestamp
4. User is redirected to the actual destination URL

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Email (Optional)**
   
   Edit `server.js` and update the email configuration:
   ```javascript
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: 'your-email@gmail.com',
       pass: 'your-app-password'
     }
   });
   ```
   
   **Note**: For Gmail, you need to:
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password (not your regular password)

   **Alternative**: Use Ethereal Email for testing (no real emails sent):
   ```javascript
   // Create test account at https://ethereal.email/
   const testAccount = await nodemailer.createTestAccount();
   const transporter = nodemailer.createTransporter({
     host: 'smtp.ethereal.email',
     port: 587,
     secure: false,
     auth: {
       user: testAccount.user,
       pass: testAccount.pass,
     },
   });
   ```

3. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development:
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Lead Form: http://localhost:3000/
   - Dashboard: http://localhost:3000/dashboard

## API Endpoints

### POST /api/submit-lead
Submit a new lead
```json
{
  "fullName": "Rahul Sharma",
  "email": "rahul@gmail.com",
  "phone": "9876543210",
  "company": "ABC Pvt Ltd",
  "requirement": "Need AI automation"
}
```

### GET /api/analytics
Get analytics data
```json
{
  "totalLeads": 250,
  "totalEmailsSent": 250,
  "totalEmailsOpened": 160,
  "openRate": 64.0,
  "totalLinkClicks": 45,
  "clickRate": 18.0
}
```

### GET /api/leads
Get all leads (most recent first)

### GET /api/track/open/:token
Email open tracking endpoint (returns 1x1 pixel)

### GET /api/track/click/:token
Link click tracking endpoint (redirects to destination)

## Database Schema

### Leads Table
```sql
- id (Primary Key)
- full_name
- email
- phone
- company
- requirement
- submission_time (Timestamp)
- email_sent (Boolean)
- email_opened (Boolean)
- email_opened_at (Timestamp)
- link_clicked (Boolean)
- link_clicked_at (Timestamp)
- tracking_token (Unique)
```

### Email Events Table
```sql
- id (Primary Key)
- lead_id (Foreign Key)
- event_type (open/click)
- event_time (Timestamp)
- ip_address
- user_agent
```

## Testing the System

1. **Submit a Test Lead**
   - Go to http://localhost:3000/
   - Fill out the form with test data
   - Submit the form

2. **Check the Dashboard**
   - Go to http://localhost:3000/dashboard
   - Verify the lead appears in the table
   - Check analytics statistics

3. **Test Email Tracking** (if email is configured)
   - Check the recipient inbox
   - Open the email (should trigger open tracking)
   - Click the link (should trigger click tracking)
   - Refresh dashboard to see updated metrics

4. **Simulate Tracking Events**
   ```bash
   # Simulate email open
   curl http://localhost:3000/api/track/open/TOKEN_HERE
   
   # Simulate link click
   curl http://localhost:3000/api/track/click/TOKEN_HERE
   ```

## Project Structure

```
evalproj/
├── package.json          # Dependencies and scripts
├── server.js            # Express server and API endpoints
├── leads.db            # SQLite database (auto-created)
├── README.md           # This file
└── public/
    ├── index.html      # Lead capture form
    └── dashboard.html  # Analytics dashboard
```

## Security Features

- XSS protection (HTML escaping)
- Input validation
- SQL injection prevention (parameterized queries)
- CORS configuration
- No sensitive data exposure

## Future Enhancements (Optional)

- AI-based lead classification
- Email templates customization
- Bulk email sending
- Advanced analytics and reporting
- Export data to CSV/Excel
- User authentication for dashboard
- Webhook integrations
- SMS notifications

## Troubleshooting

### Email not sending?
- Check your email credentials in server.js
- For Gmail, use App Password (not regular password)
- Verify SMTP settings
- Check spam folder

### Database errors?
- Ensure SQLite3 is installed
- Check file permissions for leads.db
- Delete leads.db and restart server to recreate

### Port already in use?
- Change PORT in server.js
- Or kill the process using port 3000

## License

MIT

## Support

For issues or questions, please check the code comments or create an issue in the repository.