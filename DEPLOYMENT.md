# Agentive MVP Deployment Guide

This guide will walk you through deploying the Agentive MVP to Vercel (frontend) and Supabase (backend).

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Supabase account](https://app.supabase.io/signup)
- [GitHub account](https://github.com/join) (for source code hosting)
- [Stripe account](https://dashboard.stripe.com/register) (for payment processing)

## Step 1: Set Up Supabase Project

1. **Create a new Supabase project**:
   - Go to [Supabase Dashboard](https://app.supabase.io/)
   - Click "New Project"
   - Enter a name for your project (e.g., "agentive-mvp")
   - Choose a region close to your target users
   - Set a secure database password
   - Click "Create new project"

2. **Run database migrations**:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/migrations/20250422_initial_schema.sql`
   - Paste into the SQL Editor and run the query

3. **Set up Edge Functions**:
   - Install Supabase CLI: `npm install -g supabase`
   - Login to Supabase: `supabase login`
   - Link your project: `supabase link --project-ref <your-project-id>`
   - Deploy functions: `supabase functions deploy api`
   - Verify deployment: `supabase functions list`

4. **Configure environment variables**:
   - In your Supabase dashboard, go to Settings > API
   - Navigate to "Project Settings" > "API" > "Environment Variables"
   - Add the following variables:
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `API_KEY_SALT`: A random string for hashing API keys
     - `WEBHOOK_HMAC_SECRET`: A random string for signing webhooks

## Step 2: Set Up Vercel Project

1. **Push your code to GitHub**:
   - Create a new GitHub repository
   - Push your code to the repository

2. **Import project to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Select the "frontend" directory as the root directory
   - Configure the project:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Configure environment variables**:
   - In the Vercel project settings, go to "Environment Variables"
   - Add the following variables:
     - `NEXT_PUBLIC_API_BASE_URL`: Your Supabase Edge Functions URL (e.g., `https://<your-project-id>.functions.supabase.co`)
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

4. **Update vercel.json**:
   - Edit `/frontend/vercel.json` to replace `<your-supabase-project>` with your actual Supabase project ID in both the rewrites and env sections

5. **Deploy the project**:
   - Click "Deploy"
   - Wait for the deployment to complete
   - Your frontend will be available at `https://your-project-name.vercel.app`

## Step 3: Connect Stripe (Optional)

If you want to enable real payments:

1. **Configure Stripe webhook**:
   - In your Stripe dashboard, go to "Developers" > "Webhooks"
   - Add a new endpoint: `https://<your-project-id>.functions.supabase.co/api/stripe-webhook`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

2. **Update Stripe webhook secret**:
   - After creating the webhook, Stripe will provide a signing secret
   - Add this as an environment variable in Supabase:
     - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret

## Step 4: Testing Your Deployment

1. **Test the frontend**:
   - Visit your Vercel deployment URL
   - Verify that the UI loads correctly

2. **Test the API in sandbox mode**:
   - Use the sandbox mode in the UI to test API functionality
   - Verify that you can:
     - View usage statistics
     - Purchase credits (in sandbox mode)
     - Register webhooks

3. **Test with real API keys** (if applicable):
   - Create a bot through the Supabase database
   - Use the generated API key to test real API functionality

## Troubleshooting

- **CORS issues**: Ensure the Supabase functions have the correct CORS headers
- **API connection issues**: Verify that the `NEXT_PUBLIC_API_BASE_URL` is set correctly
- **Database errors**: Check the Supabase logs for any SQL errors

## Monitoring and Maintenance

- **Supabase Dashboard**: Monitor database usage and function executions
- **Vercel Dashboard**: Monitor frontend deployments and analytics
- **Stripe Dashboard**: Monitor payments and subscription status

## Next Steps

- Set up a custom domain for your Vercel deployment
- Implement user authentication with Supabase Auth
- Set up monitoring and alerting for production usage
- Create a CI/CD pipeline for automated deployments
