# Vercel Deployment Guide

This guide will help you deploy the FixingApp to Vercel.

## Architecture

- **Frontend**: Next.js app in `frontend/app-ui/`
- **Backend**: Express API as Vercel serverless functions in `api/`
- **Database**: Neon PostgreSQL (configured via environment variables)

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A Neon PostgreSQL database (get connection string from [neon.tech](https://neon.tech))
3. Vercel CLI installed (optional, for CLI deployment):
   ```bash
   npm i -g vercel
   ```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import project in Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Configure Project Settings**:
   - **Root Directory**: Leave as root (or set to `frontend/app-ui` if you only want frontend)
   - **Framework Preset**: Next.js
   - **Build Command**: `cd frontend/app-ui && npm run build`
   - **Output Directory**: `frontend/app-ui/.next`

4. **Set Environment Variables** in Vercel Dashboard:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   JWT_SECRET=your-secret-key-here
   NODE_ENV=production
   NEXT_PUBLIC_API_BASE_URL=https://your-app.vercel.app
   ```

5. **Deploy**: Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add NEXT_PUBLIC_API_BASE_URL
   ```

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### Required

- `DATABASE_URL` - Your Neon PostgreSQL connection string
  ```
  postgresql://user:password@host/database?sslmode=require
  ```

- `JWT_SECRET` - Secret key for JWT token signing
  ```
  (use a strong random string)
  ```

- `NEXT_PUBLIC_API_BASE_URL` - Your Vercel deployment URL
  ```
  https://your-app.vercel.app
  ```

### Optional

- `NODE_ENV` - Set to `production` (defaults to production on Vercel)
- `PORT` - Not needed on Vercel (auto-assigned)
- `AWS_ACCESS_KEY_ID` - If using S3 for file uploads
- `AWS_SECRET_ACCESS_KEY` - If using S3 for file uploads
- `AWS_REGION` - If using S3 for file uploads
- `AWS_S3_BUCKET` - If using S3 for file uploads

## Post-Deployment Steps

1. **Run Database Migrations**:
   After first deployment, you need to run migrations. You can:
   - Use Vercel's function logs to run migrations
   - Or run migrations locally pointing to production database:
     ```bash
     DATABASE_URL="your-production-db-url" npm run migrate
     ```

2. **Seed Database (Optional)**:
   ```bash
   DATABASE_URL="your-production-db-url" npm run seed
   ```

3. **Verify Deployment**:
   - Frontend: `https://your-app.vercel.app`
   - API Health: `https://your-app.vercel.app/health`
   - API Docs: `https://your-app.vercel.app/api-docs`

## Project Structure for Vercel

```
FixingApp/
├── api/
│   └── index.js          # Vercel serverless function wrapper
├── frontend/
│   └── app-ui/           # Next.js frontend
├── src/                  # Express backend source
├── vercel.json          # Vercel configuration
└── .vercelignore        # Files to ignore in deployment
```

## Troubleshooting

### API Routes Not Working

- Check that `vercel.json` routes are configured correctly
- Verify environment variables are set
- Check Vercel function logs for errors

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check Neon database allows connections from Vercel IPs
- Ensure SSL is enabled in connection string

### Frontend Can't Connect to API

- Set `NEXT_PUBLIC_API_BASE_URL` to your Vercel deployment URL
- Check CORS settings in `src/app.js`
- Verify API routes are accessible

### Migrations Not Running

- Migrations run on server startup
- Check Vercel function logs for migration errors
- You may need to run migrations manually first time

## Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_API_BASE_URL` to your custom domain
4. Redeploy

## Monitoring

- **Logs**: Vercel Dashboard → Your Project → Logs
- **Analytics**: Vercel Dashboard → Your Project → Analytics
- **Function Logs**: Check individual function execution logs

## Notes

- Vercel serverless functions have a 10-second timeout for Hobby plan, 60 seconds for Pro
- Large file uploads (50MB limit) may timeout - consider using direct S3 uploads
- Database connections are pooled automatically
- Cold starts may occur on first request after inactivity

