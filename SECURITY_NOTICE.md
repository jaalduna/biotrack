# Security Best Practices

## Environment Variables

This project uses environment variables for sensitive configuration. Never commit actual secrets to git.

### Setup

1. Copy the example env file:
   ```bash
   cp backend/.env.example backend/.env.local
   ```

2. Edit `backend/.env.local` with your actual values:
   - `SENDGRID_API_KEY` - Get from https://app.sendgrid.com/settings/api_keys
   - `STRIPE_*` keys - Get from https://dashboard.stripe.com/test/apikeys

3. The app loads from `.env.local` first, falling back to `.env.example` defaults.

### Prevention

- Never commit `.env` or `.env.local` files (already in `.gitignore`)
- Never share API keys in chat/email/docs
- Rotate keys regularly
- Use environment-specific keys (dev/staging/production)
