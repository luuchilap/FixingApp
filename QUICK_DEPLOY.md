# Quick Vercel Deployment Guide

## 🚀 Fastest Way to Deploy

### Step 1: Prepare Your Code
Make sure your code is pushed to GitHub/GitLab/Bitbucket.

### Step 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Configure:
   - **Root Directory**: Leave as root (`.`)
   - **Framework Preset**: **Other** (important: don't use Next.js preset!)
   - **Build Command**: ⚠️ **LEAVE EMPTY** (handled by `vercel.json`)
   - **Output Directory**: ⚠️ **LEAVE EMPTY** (handled by `vercel.json`)

**Why leave Build Command empty?**
- The `vercel.json` file configures both frontend AND backend builds automatically
- Setting a build command here will override `vercel.json` and **skip the backend build**
- `vercel.json` handles:
  - Frontend build: `frontend/app-ui` → Next.js
  - Backend build: `api/index.js` → Express serverless function

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://neondb_owner:npg_gSy6IBk8NHRZ@ep-curly-tooth-a4v849xt-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_API_BASE_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

**Important**: Replace `your-app-name.vercel.app` with your actual Vercel deployment URL after first deploy.

### Step 4: Deploy

Click "Deploy" and wait for build to complete

### Step 5: Run Migrations

You have **3 options** to run migrations:

#### Option 1: Via Migration Endpoint (Easiest) ⭐ Recommended

**Step 1:** Set the migration secret in Vercel:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add: `MIGRATION_SECRET=your-super-secret-key-here` (use a strong random string)
- Redeploy

**Step 2:** Call the migration endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/system/migrate \
  -H "X-Migration-Key: your-super-secret-key-here" \
  -H "Content-Type: application/json"
```

Or use a tool like Postman, or in your browser's console:
```javascript
fetch('https://your-app.vercel.app/api/system/migrate', {
  method: 'POST',
  headers: {
    'X-Migration-Key': 'your-super-secret-key-here',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log)
```

**Where to run this:**
- ✅ Your local terminal/command line
- ✅ Postman or any HTTP client
- ✅ Browser console (for testing)
- ✅ Vercel function logs (via Vercel dashboard)

#### Option 2: Run Locally (Pointing to Production DB)

On your **local machine** (your computer):

```bash
# Set your production database URL
export DATABASE_URL="postgresql://neondb_owner:npg_gSy6IBk8NHRZ@ep-curly-tooth-a4v849xt-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run migrations
npm run migrate
```

**Where:** Your local terminal/command line in the project directory

#### Option 3: Use Vercel CLI

On your **local machine**:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login and link your project
vercel login
vercel link

# Pull environment variables to .env.local
vercel env pull .env.local

# Run migrations (will use DATABASE_URL from .env.local)
npm run migrate
```

**Where:** Your local terminal/command line in the project directory

### Step 6: Update API Base URL

After deployment, update `NEXT_PUBLIC_API_BASE_URL` in Vercel with your actual URL, then redeploy.

## 📝 Files Created for Vercel

- `vercel.json` - Vercel configuration
- `api/index.js` - Serverless function wrapper for Express API
- `.vercelignore` - Files to exclude from deployment
- `DEPLOYMENT.md` - Detailed deployment guide

## ✅ What's Configured

- ✅ Next.js frontend deployment
- ✅ Express API as serverless functions
- ✅ API routes (`/api/*`) → Express backend
- ✅ Frontend routes → Next.js app
- ✅ Health check endpoint
- ✅ Swagger docs endpoint

## 🔍 Verify Deployment

After deployment, check:
- Frontend: `https://your-app.vercel.app`
- API Health: `https://your-app.vercel.app/health`
- API Docs: `https://your-app.vercel.app/api-docs`

## 🐛 Troubleshooting

**API not working?**
- Check Vercel function logs
- Verify environment variables are set
- Ensure migrations have run

**Frontend can't connect?**
- ⚠️ **CRITICAL:** Set `NEXT_PUBLIC_API_BASE_URL` to your Vercel URL (e.g., `https://your-app-name.vercel.app`)
- Must be set in Vercel Dashboard → Settings → Environment Variables
- Must redeploy after setting (push new commit or click "Redeploy" in dashboard)
- See `VERCEL_TROUBLESHOOTING.md` for detailed steps

**Database connection issues?**
- Verify `DATABASE_URL` is correct
- Check Neon database allows external connections

**"Failed to fetch" error on Vercel?**
- Most likely: `NEXT_PUBLIC_API_BASE_URL` not set or incorrect
- Check browser console for the actual URL being called
- Verify environment variable is set for all environments (Production, Preview, Development)
- **Must redeploy** after setting environment variables

