# Stripe Integration Setup Guide

This guide will walk you through configuring Stripe for BioTrack's subscription management.

## Prerequisites

- Stripe account (create free at https://stripe.com)
- Backend running in Docker
- Access to backend/.env file

---

## Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"
3. Keep this tab open, you'll need these values

---

## Step 2: Create Subscription Products

### Create Basic Plan

1. Go to https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Fill in the form:
   - **Name**: `BioTrack Basic`
   - **Description**: `Basic plan - Up to 5 team members`
   - **Pricing model**: `Standard pricing`
   - **Price**: `29.00` (or your desired price)
   - **Billing period**: `Monthly`
   - **Currency**: `USD` (or your currency)
4. Click **"Add product"**
5. **Copy the Price ID** (starts with `price_`) - you'll need this

### Create Premium Plan

1. Still on https://dashboard.stripe.com/test/products
2. Click **"+ Add product"** again
3. Fill in the form:
   - **Name**: `BioTrack Premium`
   - **Description**: `Premium plan - Up to 20 team members`
   - **Pricing model**: `Standard pricing`
   - **Price**: `99.00` (or your desired price)
   - **Billing period**: `Monthly`
   - **Currency**: `USD` (or your currency)
4. Click **"Add product"**
5. **Copy the Price ID** (starts with `price_`) - you'll need this

---

## Step 3: Configure Webhook Endpoint

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Fill in the form:
   - **Endpoint URL**: `http://localhost:8000/api/v1/subscriptions/webhooks/stripe`
   - **Description**: `BioTrack subscription events`
4. Click **"Select events"** and choose:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **"Add events"** then **"Add endpoint"**
6. **Copy the Signing secret** (starts with `whsec_`) from the endpoint details page

**Note**: For local development, you'll need to use Stripe CLI or ngrok to test webhooks. For production, use your actual domain.

---

## Step 4: Update Backend Environment Variables

1. Create or update `backend/.env` file:

```bash
# Database Configuration (keep existing)
DATABASE_URL=postgresql://user:password@db:5432/biotrack

# JWT Configuration (keep existing)
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe Configuration (ADD THESE)
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE

# Stripe Price IDs (from Step 2)
STRIPE_BASIC_PRICE_ID=price_YOUR_BASIC_PRICE_ID
STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_PRICE_ID

# Frontend URL
FRONTEND_URL=http://localhost:5173/biotrack
```

2. **Replace** the placeholder values with your actual Stripe keys from Steps 1-3

---

## Step 5: Restart Backend

```bash
cd backend
docker-compose restart backend
```

Verify the backend picks up the new environment variables:

```bash
docker-compose logs backend | grep -i stripe
```

---

## Step 6: Test Subscription Flow

### Test Checkout

1. Make sure you're logged out or using a test user without a team
2. Navigate to http://localhost:5173/biotrack/subscription/checkout
3. Click **"Start Free Trial"** on either plan
4. You should be redirected to Stripe Checkout
5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
6. Complete the checkout
7. You should be redirected back to team setup

### Test Customer Portal

1. Login with a user that has a team with an active subscription
2. Navigate to http://localhost:5173/biotrack/team/settings
3. Click **"Manage Subscription"**
4. You should be redirected to Stripe Customer Portal
5. Test updating payment method, viewing invoices, etc.

---

## Step 7: Test Webhooks (Optional - Advanced)

For local webhook testing, use Stripe CLI:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local backend:
   ```bash
   stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhooks/stripe
   ```
4. Copy the webhook signing secret from the CLI output
5. Update `STRIPE_WEBHOOK_SECRET` in `backend/.env` with the CLI secret
6. Restart backend
7. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## Pricing Recommendations

Based on your session notes, here are suggested prices:

- **Basic Plan**: $29/month
  - 5 team members
  - All core features
  - Email support

- **Premium Plan**: $99/month
  - 20 team members
  - All core features
  - Priority support
  - Advanced analytics (when implemented)

You can adjust these in the Stripe Dashboard at any time.

---

## Common Issues

### "No Stripe customer associated with this team"

**Cause**: Team was created manually (not through Stripe checkout) and doesn't have `stripe_customer_id`

**Solution**: 
- For test teams, create a new team through the checkout flow
- Or manually update the database (not recommended for production):
  ```sql
  UPDATE teams SET stripe_customer_id = 'cus_test_123' WHERE id = 'team-id';
  ```

### "Stripe is not configured"

**Cause**: Environment variables not set or using placeholder values

**Solution**: Verify `backend/.env` has actual Stripe keys, not placeholders ending in `_placeholder`

### Webhooks not working

**Cause**: Stripe can't reach localhost

**Solution**: Use Stripe CLI (see Step 7) or deploy to a public URL with ngrok

---

## Production Deployment

When deploying to production:

1. Switch to **live mode** keys:
   - Get live keys from https://dashboard.stripe.com/apikeys (toggle "Test mode" OFF)
   - Create products in live mode
   - Set up production webhook endpoint with your domain

2. Update environment variables with live keys

3. Test thoroughly in production environment before launching

4. Set up monitoring for failed payments and webhook errors

---

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Test Cards: https://stripe.com/docs/testing
- BioTrack Issues: Check backend logs with `docker-compose logs backend`
