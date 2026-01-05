# Email Deliverability Guide - Avoiding Spam Folder

This guide explains how to improve email deliverability and avoid the spam folder.

## Current Status

✅ **Implemented Improvements:**
- Plain text + HTML multipart emails
- Professional email template using tables
- Personalized subject line (includes sender name)
- Reply-to header
- Clear unsubscribe/context notice
- Proper HTML structure with DOCTYPE

⚠️ **Still Going to Spam?** Follow the steps below.

---

## Why Emails Go to Spam

Common reasons:
1. **No domain authentication** - Gmail doesn't trust emails from unverified senders
2. **Using personal Gmail** - Gmail flags emails from Gmail to Gmail as suspicious
3. **New SendGrid account** - No sending reputation yet
4. **Localhost links** - Links to localhost look suspicious

---

## Immediate Solutions

### Solution 1: Use a Custom Domain (RECOMMENDED)

Instead of sending from `jaalduna@gmail.com`, use a professional domain like `noreply@biotrack.com` or `team@yourdomain.com`.

#### Steps:

1. **Buy a domain** (if you don't have one):
   - GoDaddy, Namecheap, Google Domains, etc.
   - Cost: ~$10-15/year

2. **Authenticate your domain in SendGrid**:
   - Go to https://app.sendgrid.com/settings/sender_auth
   - Click **"Authenticate Your Domain"**
   - Select your DNS provider
   - Follow DNS setup instructions (add CNAME records)
   - Wait 24-48 hours for DNS propagation

3. **Update `.env`**:
   ```bash
   FROM_EMAIL=team@yourdomain.com
   ```

4. **Restart backend**:
   ```bash
   cd backend && docker-compose restart backend
   ```

**This is the #1 most effective solution.**

---

### Solution 2: Warm Up Your SendGrid Account

New SendGrid accounts have no reputation. Gradually increase sending volume.

#### Steps:

1. **Send to engaged users first**:
   - Start with 10-20 emails/day
   - Send to people who will open and click
   - Increase gradually over 2-4 weeks

2. **Monitor your sender reputation**:
   - Check: https://app.sendgrid.com/statistics
   - Look for high open rates, low bounce rates

3. **Avoid spam traps**:
   - Only send to valid email addresses
   - Don't buy email lists
   - Remove bounced emails

---

### Solution 3: Verify Your Gmail Sender

If you must use Gmail as the sender:

1. **Go to SendGrid Sender Authentication**:
   - https://app.sendgrid.com/settings/sender_auth/senders

2. **Create Single Sender Verification**:
   - Click **"Create New Sender"**
   - Use `jaalduna@gmail.com`
   - Fill in your details
   - Click "Create"

3. **Verify your email**:
   - Check your Gmail inbox
   - Click the verification link

4. **Wait 24-48 hours** for reputation to build

---

### Solution 4: Ask Recipients to Whitelist

Tell users to:

1. **Check spam folder**
2. **Mark as "Not Spam"**
3. **Add sender to contacts**
4. **Create a filter** to always move to inbox

---

## DNS Authentication (Advanced)

### SPF Record

Add this TXT record to your domain DNS:

```
Host: @
Value: v=spf1 include:sendgrid.net ~all
```

### DKIM (via SendGrid)

SendGrid sets this up automatically when you authenticate your domain.

### DMARC Record

Add this TXT record:

```
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:your-email@yourdomain.com
```

---

## Testing Email Deliverability

### Test Your Email Score

1. **Go to Mail Tester**:
   - https://www.mail-tester.com/

2. **Get test email address**:
   - Copy the unique email shown

3. **Send invitation to that email**:
   - In BioTrack, invite the test email

4. **Check your score**:
   - Go back to mail-tester.com
   - Click "Then check your score"
   - Fix any issues shown

**Aim for 8/10 or higher.**

---

## Quick Wins for Better Deliverability

### ✅ Already Implemented

- [x] Plain text version of email
- [x] HTML with proper structure
- [x] Personalized subject line
- [x] Professional template design
- [x] Reply-to header
- [x] Unsubscribe notice

### 🔧 You Should Do

- [ ] Authenticate your domain in SendGrid
- [ ] Use custom domain email (not Gmail)
- [ ] Test with mail-tester.com
- [ ] Send small batches initially
- [ ] Monitor bounce/spam reports

---

## For Gmail Specifically

Gmail is very strict about spam. To improve:

1. **Ask recipients to**:
   - Move email from spam to inbox
   - Click "Not spam"
   - Add to contacts
   - Reply to the email (signals engagement)

2. **Ensure high engagement**:
   - Users should click the invitation link
   - High click-through rate improves reputation

3. **Use Gmail Postmaster Tools**:
   - https://postmaster.google.com/
   - Add your domain
   - Monitor reputation

---

## Monitoring & Troubleshooting

### Check SendGrid Activity

```bash
# Go to SendGrid dashboard
https://app.sendgrid.com/email_activity

# Look for:
- Delivered: Good
- Bounced: Bad (remove these emails)
- Spam Report: Very bad (remove these emails)
```

### Check Backend Logs

```bash
docker logs -f backend-backend-1 | grep "Email sent"
```

Look for status code `202` (accepted) or `200` (sent).

### Common Issues

| Issue | Solution |
|-------|----------|
| Emails to Gmail go to spam | Authenticate domain, use custom domain |
| Bounced emails | Verify email addresses are valid |
| Low open rates | Improve subject line, warm up sender reputation |
| Marked as spam | Review email content, avoid spam trigger words |

---

## Spam Trigger Words to Avoid

In subject lines and email body, avoid:
- "Free", "Winner", "Click here"
- All caps: "URGENT", "LIMITED TIME"
- Multiple exclamation marks!!!
- "Act now", "Offer expires"
- "$$$", "Make money fast"

**Our current subject is good**: "Team invitation from {sender_name}"

---

## Production Recommendations

### For Serious Production Use:

1. **Use a dedicated email service**:
   - SendGrid (what we use)
   - Mailgun
   - Amazon SES
   - Postmark

2. **Use your own domain**:
   - Don't use Gmail/Yahoo/Hotmail
   - Authenticate with SPF/DKIM/DMARC

3. **Monitor reputation**:
   - Keep bounce rate < 5%
   - Keep complaint rate < 0.1%
   - Track open/click rates

4. **Implement feedback loop**:
   - Remove emails that bounce
   - Honor unsubscribe requests
   - Remove spam reporters

5. **Use email warm-up service** (optional):
   - Warmup Inbox
   - Mailreach
   - Sends automated engagement emails to build reputation

---

## Testing Different Email Providers

Test how your emails perform with different providers:

```bash
# Send test invitations to:
test@gmail.com          # Gmail
test@outlook.com        # Microsoft
test@yahoo.com          # Yahoo
test@protonmail.com     # ProtonMail
```

Check which ones go to spam and adjust accordingly.

---

## Quick Fix: Current Situation

Since you're using `jaalduna@gmail.com` as sender:

**Option A: Accept that Gmail → Gmail often goes to spam**
- Tell recipients to check spam
- Mark as "Not Spam"
- This will train Gmail for future emails

**Option B: Switch to temporary verified sender**
- Create free domain on Freenom or use subdomain
- Authenticate in SendGrid
- Use `noreply@yourtempdomain.com`

**Option C: Use your existing domain** (if you have one)
- Do you own any domain?
- We can authenticate it and send from there

---

## Next Steps

1. **Immediate**: Ask email recipients to mark as "Not Spam"
2. **Short-term**: Verify your Gmail sender in SendGrid
3. **Long-term**: Get a custom domain and authenticate it

Want me to help you set up domain authentication? Let me know if you have a domain!
