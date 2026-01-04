# Email Service Setup Guide

This guide explains how to configure email notifications for BioTrack, specifically for team invitation emails.

## Current Status

Email service is **optional** but recommended for production use. The application currently logs email content to console instead of sending actual emails.

**What works without email configuration:**
- Team invitations are created in the database
- Invitation tokens are generated
- Invitations can be accepted via direct URL
- All team management features work

**What requires email configuration:**
- Automatic sending of invitation emails to new team members
- Trial ending reminders
- Payment failure notifications
- Subscription cancellation confirmations

---

## Email Service Options

### Option 1: SendGrid (Recommended)

SendGrid offers a free tier (100 emails/day) and is easy to set up.

#### Step 1: Create SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Create a free account
3. Verify your email address

#### Step 2: Create API Key

1. Go to https://app.sendgrid.com/settings/api_keys
2. Click **"Create API Key"**
3. Name: `BioTrack Production` (or similar)
4. Permissions: **"Full Access"** (or at least "Mail Send" permissions)
5. Click **"Create & View"**
6. **Copy the API key** (starts with `SG.`) - you won't be able to see it again
7. Store it securely

#### Step 3: Verify Sender Identity

SendGrid requires sender verification (anti-spam):

**Single Sender Verification** (easier, good for testing):
1. Go to https://app.sendgrid.com/settings/sender_auth/senders
2. Click **"Create New Sender"**
3. Fill in your details (use your real email)
4. Click **"Create"**
5. Check your email and verify
6. Use this email as `FROM_EMAIL`

**Domain Authentication** (recommended for production):
1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click **"Authenticate Your Domain"**
3. Follow DNS setup instructions
4. Use `noreply@yourdomain.com` as `FROM_EMAIL`

#### Step 4: Update Backend Environment

Add to `backend/.env`:

```bash
# Email Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
FROM_EMAIL=noreply@yourdomain.com  # Must be verified
FRONTEND_URL=http://localhost:5173/biotrack
```

#### Step 5: Enable Email Sending in Code

Currently, email sending is commented out with `# TODO` markers. To enable:

1. Install SendGrid package (already in requirements):
   ```bash
   # Already included in backend/requirements.txt
   # sendgrid==6.10.0
   ```

2. Update `backend/app/services/email.py` to actually send emails:

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

async def send_invitation_email(to_email: str, team_name: str, invited_by: str, token: str) -> bool:
    """Send a team invitation email."""
    invitation_link = f"{FRONTEND_URL}/invitations/accept/{token}"
    
    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject=f"You've been invited to join {team_name} on BioTrack",
        html_content=f"""
        <html>
          <body>
            <h2>Team Invitation</h2>
            <p>{invited_by} has invited you to join the team "{team_name}" on BioTrack.</p>
            <p><a href="{invitation_link}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a></p>
            <p>Or copy this link: {invitation_link}</p>
            <p><small>This invitation will expire in 7 days.</small></p>
          </body>
        </html>
        """
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email sent to {to_email}, status: {response.status_code}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
```

3. Uncomment the email sending calls in `backend/app/routers/invitations.py`:

```python
# Line 101-102 (after creating invitation)
from ..services.email import send_invitation_email
await send_invitation_email(
    to_email=invitation.email,
    team_name=team.name,
    invited_by=current_user.name or current_user.email,
    token=new_invitation.token
)

# Line 212-213 (resend invitation)
await send_invitation_email(
    to_email=invitation.email,
    team_name=team.name,
    invited_by=current_user.name or current_user.email,
    token=invitation.token
)
```

#### Step 6: Restart Backend

```bash
cd backend
docker-compose restart backend
```

#### Step 7: Test Email Sending

1. Go to http://localhost:5173/biotrack/team/settings
2. Invite a team member with a real email address
3. Check the email inbox (may take 1-2 minutes)
4. Check SendGrid Activity: https://app.sendgrid.com/email_activity

---

### Option 2: SMTP (Gmail, Outlook, etc.)

Use standard SMTP for sending emails. Good for self-hosted solutions.

#### Using Gmail

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Generate password for "Mail" on "Other (Custom name)"
   - Name it "BioTrack"
   - Copy the 16-character password

3. Update `backend/.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
```

4. Update `backend/app/services/email.py` to use SMTP:

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

async def send_invitation_email(to_email: str, team_name: str, invited_by: str, token: str) -> bool:
    """Send a team invitation email via SMTP."""
    invitation_link = f"{FRONTEND_URL}/invitations/accept/{token}"
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"You've been invited to join {team_name} on BioTrack"
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    
    html = f"""
    <html>
      <body>
        <h2>Team Invitation</h2>
        <p>{invited_by} has invited you to join the team "{team_name}" on BioTrack.</p>
        <p><a href="{invitation_link}">Accept Invitation</a></p>
        <p>Link: {invitation_link}</p>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html'))
    
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False
```

---

## Testing Without Email Service

You can still test the invitation flow without email:

1. Create an invitation in Team Settings
2. Check backend logs for the invitation token:
   ```bash
   docker-compose logs backend | grep "EMAIL"
   ```
3. Copy the invitation link from logs
4. Open the link in a browser (or send it manually)
5. Complete the invitation acceptance

Example log output:
```
[EMAIL] Would send invitation to user@example.com
[EMAIL] Subject: You've been invited to join Test Team on BioTrack
[EMAIL] Link: http://localhost:5173/biotrack/invitations/accept/abc123def456...
```

---

## Email Templates

The application sends these types of emails:

1. **Team Invitation** - When someone is invited to join a team
2. **Trial Ending Reminder** - 7, 3, and 1 day before trial expires (TODO)
3. **Payment Failed** - When subscription payment fails (TODO)
4. **Subscription Cancelled** - Confirmation when subscription is cancelled (TODO)

All templates are in `backend/app/services/email.py`.

---

## Production Considerations

### Email Deliverability

1. **Use a verified domain**: Don't use Gmail/Yahoo for production
2. **Set up SPF, DKIM, DMARC**: Prevents emails going to spam
3. **Monitor bounce rate**: Keep it under 5%
4. **Add unsubscribe links**: Required for transactional emails in some jurisdictions

### Rate Limits

- **SendGrid Free**: 100 emails/day
- **SendGrid Essentials**: $19.95/month for 50,000 emails
- **Gmail SMTP**: ~500 emails/day (not recommended for production)

### Email Queue (Advanced)

For high-volume production use, consider:
- Celery + Redis for async email sending
- Retry logic for failed sends
- Email status tracking

---

## Troubleshooting

### "Authentication failed" with SendGrid

- Verify API key is correct (starts with `SG.`)
- Check API key permissions include "Mail Send"
- Ensure no extra spaces in .env file

### Emails going to spam

- Verify sender domain with SPF/DKIM
- Use a professional from address (`noreply@yourdomain.com`)
- Avoid spammy words in subject/body
- Test with https://www.mail-tester.com/

### Gmail App Password not working

- Ensure 2FA is enabled on Google account
- Generate new app password if issues persist
- Check if "Less secure app access" is off (should be)

### Emails not sending (no errors)

- Check backend logs: `docker-compose logs backend | grep -i email`
- Verify environment variables loaded: `docker exec backend-backend-1 env | grep EMAIL`
- Test SendGrid API directly: https://app.sendgrid.com/guide/integrate

---

## Alternative: Manual Invitation Flow

If you prefer not to set up email:

1. Admin creates invitation in Team Settings
2. Copy the invitation token from database or logs
3. Share the invitation link manually (Slack, text, etc.)
4. User clicks link and accepts invitation

This works perfectly fine for small teams!

---

## Next Steps

1. Choose email provider (SendGrid recommended)
2. Create account and get API key
3. Update `backend/.env` with credentials
4. Update `backend/app/services/email.py` to send emails
5. Uncomment email calls in invitations router
6. Restart backend and test
7. Monitor email delivery and adjust as needed
