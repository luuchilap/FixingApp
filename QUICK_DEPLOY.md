# Quick Vercel Deployment Guide

## 🚀 Fastest Way to Deploy

### Step 1: Prepare Your Code
Make sure your code is pushed to GitHub/GitLab/Bitbucket.

### Step 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Configure:
   - **Root Directory**: Leave as root (`.`)
   - **Framework Preset**: Other (we'll configure manually)
   - **Build Command**: `cd frontend/app-ui && npm install && npm run build`
   - **Output Directory**: `frontend/app-ui/.next`

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

After first deployment, run migrations:

```bash
DATABASE_URL="your-database-url" npm run migrate
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
DATABASE_URL="..." npm run migrate
```

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
- Set `NEXT_PUBLIC_API_BASE_URL` to your Vercel URL
- Redeploy after setting the variable

**Database connection issues?**
- Verify `DATABASE_URL` is correct
- Check Neon database allows external connections

