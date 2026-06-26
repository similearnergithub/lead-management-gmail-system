# Deployment Guide

## GitHub Repository
✅ **Repository Created**: https://github.com/similearnergithub/lead-management-system

## Quick Deployment Options

### Option 1: Vercel (Recommended - Easiest)

#### Method A: Using Vercel CLI (if you have space)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? lead-management-system
# - In which directory? ./
# - Want to modify settings? No
```

#### Method B: Using Vercel Dashboard (No CLI needed)
1. **Go to**: https://vercel.com/new
2. **Import** your GitHub repository: `similearnergithub/lead-management-system`
3. **Configure**:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
4. **Add Environment Variables**:
   ```
   USE_ETHEREAL=false
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
5. **Click Deploy**

Your app will be live at: `https://lead-management-system.vercel.app`

---

### Option 2: Netlify

#### Method A: Using Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Method B: Using Netlify Dashboard
1. **Go to**: https://app.netlify.com/start
2. **Connect** to GitHub
3. **Select** repository: `similearnergithub/lead-management-system`
4. **Configure**:
   - Build command: (leave empty)
   - Publish directory: ./
5. **Add Environment Variables** (same as Vercel)
6. **Deploy**

Your app will be live at: `https://lead-management-system.netlify.app`

---

### Option 3: Railway (Alternative)

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → Deploy from GitHub repo
4. **Select**: `similearnergithub/lead-management-system`
5. **Add Environment Variables**
6. **Deploy**

---

### Option 4: Render

1. **Go to**: https://render.com
2. **New** → Web Service
3. **Connect** GitHub repository
4. **Configure**:
   - Name: lead-management-system
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. **Add Environment Variables**
6. **Create Web Service**

---

## Important Notes for Production

### 1. Environment Variables
You MUST set these in your deployment platform:

```env
# Required for real email sending
USE_ETHEREAL=false
EMAIL_SERVICE=gmail  # or sendgrid, smtp
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional
PORT=3000
```

### 2. Database Considerations
- **SQLite** works for small to medium apps
- For production with multiple instances, consider:
  - **PostgreSQL** (Supabase, Neon, Railway)
  - **MongoDB** (MongoDB Atlas)
  - **MySQL** (PlanetScale)

### 3. Email Service Setup

#### For Gmail:
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-digit password in EMAIL_PASS

#### For SendGrid:
1. Sign up: https://sendgrid.com
2. Create API Key
3. Set EMAIL_SERVICE=sendgrid
4. Set EMAIL_USER=apikey
5. Set EMAIL_PASS=your-api-key

#### For Other SMTP:
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

---

## Testing Your Deployment

### 1. Test Lead Submission
```bash
curl -X POST https://your-app-url.com/api/submit-lead \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test User\",\"email\":\"test@example.com\",\"requirement\":\"Testing deployment\"}"
```

### 2. Check Analytics
```bash
curl https://your-app-url.com/api/analytics
```

### 3. Test in Browser
- Visit: https://your-app-url.com/
- Submit form
- Check dashboard: https://your-app-url.com/dashboard

---

## Post-Deployment Checklist

- [ ] Application is accessible via URL
- [ ] Form submission works
- [ ] Emails are being sent (check spam folder)
- [ ] Dashboard loads correctly
- [ ] Analytics are updating
- [ ] Tracking links work
- [ ] Open tracking works (check by opening email)
- [ ] Click tracking works (click link in email)

---

## Custom Domain (Optional)

### Vercel:
```bash
vercel domains add yourdomain.com
```

### Netlify:
1. Go to Domain Settings
2. Add custom domain
3. Update DNS records

---

## Monitoring & Maintenance

### View Logs
- **Vercel**: Dashboard → Your Project → Logs
- **Netlify**: Dashboard → Your Site → Logs
- **Railway**: Dashboard → Your Project → Logs

### Database Backups
- Regularly backup your SQLite database
- Consider migrating to cloud database for production

### Email Deliverability
- Monitor bounce rates
- Set up SPF/DKIM records for your domain
- Use dedicated email service (SendGrid, Mailgun) for high volume

---

## Troubleshooting

### "Application Error"
- Check environment variables are set correctly
- Verify email credentials
- Check logs for specific errors

### "Emails not sending"
- Verify USE_ETHEREAL=false
- Check email service credentials
- For Gmail: Use App Password, not regular password
- Check spam/junk folder

### "Database errors"
- SQLite file might not persist on some platforms
- Consider using cloud database (PostgreSQL recommended)

### "Tracking not working"
- Ensure tracking URLs use your production domain
- Check that email client allows images
- Verify redirect URLs are correct

---

## Cost Estimates

### Free Tiers:
- **Vercel**: Free for personal projects (100GB bandwidth/month)
- **Netlify**: Free (100GB bandwidth/month, 300 build minutes)
- **Railway**: $5/month after trial
- **Render**: Free tier available

### Email Services:
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free (first 3 months)
- **Gmail**: Free (500 emails/day for regular accounts)

---

## Support

- **GitHub Issues**: https://github.com/similearnergithub/lead-management-system/issues
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com

---

## Next Steps After Deployment

1. **Test thoroughly** with real email addresses
2. **Set up custom domain** (optional)
3. **Configure email templates** (customize in server.js)
4. **Add analytics** (Google Analytics, etc.)
5. **Implement lead scoring** (optional AI feature)
6. **Add user authentication** for dashboard
7. **Set up backups** for database
8. **Monitor performance** and optimize

---

**Your GitHub Repository**: https://github.com/similearnergithub/lead-management-system

Choose a deployment platform above and follow the steps to get your app live!