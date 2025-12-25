# Step-by-Step Guide: Deploy Both Frontend & Backend on Vercel

## ✅ Prerequisites

1. Code pushed to GitHub/GitLab/Bitbucket
2. Vercel account ([vercel.com](https://vercel.com))
3. Neon PostgreSQL database URL ready

## 🚀 Deployment Steps

### Step 1: Configure Vercel Project Settings

Go to **Vercel Dashboard** → Your Project → **Settings** → **General**

**Important Settings:**
- **Root Directory**: Leave as `.` (root of repo)
- **Framework Preset**: **Other** ⚠️ (CRITICAL: Don't use "Next.js" preset - it will override `vercel.json`)
- **Build Command**: ⚠️ **LEAVE EMPTY** (handled by `vercel.json` - setting this will skip backend!)
- **Output Directory**: ⚠️ **LEAVE EMPTY** (handled by `vercel.json`)
- **Install Command**: `npm install` (optional: install root dependencies)

**Why this matters:**
- `vercel.json` uses `builds` to configure BOTH frontend and backend
- Setting Build Command in project settings overrides `vercel.json`
- This causes backend (`api/index.js`) to NOT be built
- Always leave Build/Output empty when using `vercel.json` with `builds`

### Step 2: Set Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

**Add these variables for ALL environments (Production, Preview, Development):**

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_gSy6IBk8NHRZ@ep-curly-tooth-a4v849xt-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API Base URL (IMPORTANT: Use your actual Vercel URL after first deploy)
NEXT_PUBLIC_API_BASE_URL=https://your-app-name.vercel.app

# Migration Secret (for running migrations via endpoint)
MIGRATION_SECRET=your-super-secret-migration-key

# Node Environment
NODE_ENV=production
```

**Critical Notes:**
- Set for **Production**, **Preview**, AND **Development**
- Replace `your-app-name.vercel.app` with your actual Vercel URL
- After first deploy, update `NEXT_PUBLIC_API_BASE_URL` with actual URL

### Step 3: Verify Configuration Files

Make sure these files exist:

#### ✅ `vercel.json` (in root)
Should contain both builds:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/app-ui/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/health",
      "dest": "/api/index.js"
    },
    {
      "src": "/api-docs",
      "dest": "/api/index.js"
    },
    {
      "src": "/api-docs/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/app-ui/$1"
    }
  ]
}
```

#### ✅ `api/index.js` (backend entry point)
Should export Express app

#### ✅ `frontend/app-ui/package.json` (frontend)
Should have Next.js configured

### Step 4: Deploy

**Option A: Via Dashboard**
1. Go to **Deployments** tab
2. Click **"Deploy"** or trigger via Git push

**Option B: Via CLI**
```bash
vercel --prod
```

**Option C: Push to Git**
```bash
git add .
git commit -m "Deploy to Vercel"
git push
```

### Step 5: Monitor Build Logs

Watch the build process in Vercel Dashboard:

1. Go to **Deployments** → Click on latest deployment
2. Check **Build Logs**

**What to look for:**
- ✅ `Installing dependencies...` (should install root + frontend dependencies)
- ✅ `Building frontend/app-ui` (Next.js build)
- ✅ `Building api/index.js` (Express serverless function)
- ❌ Any errors in red

### Step 6: Verify Backend Deployment

After deployment completes, test the backend:

**In Browser or Terminal:**

```bash
# Health check
curl https://your-app.vercel.app/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}

# API endpoint
curl https://your-app.vercel.app/api/jobs

# API docs
# Visit: https://your-app.vercel.app/api-docs
```

**Expected Results:**
- ✅ `/health` returns JSON with status "ok"
- ✅ `/api/jobs` returns jobs array (or empty array)
- ✅ `/api-docs` shows Swagger UI

### Step 7: Run Database Migrations

Your backend won't work properly until migrations are run.

**Option 1: Via Migration Endpoint (Recommended)**

1. Make sure `MIGRATION_SECRET` is set in Vercel
2. Call the endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/system/migrate \
  -H "X-Migration-Key: your-super-secret-migration-key" \
  -H "Content-Type: application/json"
```

**Option 2: Run Locally (Pointing to Production DB)**

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_gSy6IBk8NHRZ@ep-curly-tooth-a4v849xt-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npm run migrate
```

### Step 8: Update API Base URL (If Needed)

If you set a placeholder URL in Step 2:

1. Go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_API_BASE_URL` with your actual URL
3. **Redeploy** (push new commit or click "Redeploy")

### Step 9: Verify Frontend Can Connect

1. Visit: `https://your-app.vercel.app`
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Look for API calls - should show your Vercel URL, not localhost
5. Go to **Network** tab - check API requests are successful

## 🐛 Troubleshooting Backend Not Deploying

### Issue: Backend endpoints return 404

**Check:**
1. Vercel Dashboard → **Functions** tab
2. Do you see `api/index.js` listed?
3. If not, the backend didn't build

**Fix:**
- Check build logs for errors
- Verify `api/index.js` exists and exports correctly
- Check `vercel.json` has correct build configuration

### Issue: Backend builds but returns errors

**Check Vercel Function Logs:**
1. Vercel Dashboard → **Functions** → `api/index.js`
2. Click **Logs** tab
3. Look for error messages

**Common Errors:**
- Database connection: Check `DATABASE_URL`
- Missing dependencies: Check root `package.json` has all deps
- Migration errors: Run migrations (Step 7)

### Issue: "Module not found" errors

**Cause:** Dependencies not installed

**Fix:**
1. Make sure root `package.json` has all backend dependencies
2. Vercel should auto-install, but verify in build logs
3. Check `.vercelignore` doesn't exclude `node_modules`

### Issue: Build succeeds but API doesn't work

**Check:**
1. Functions tab shows `api/index.js` ✓
2. Routes in `vercel.json` are correct
3. Environment variables are set
4. Migrations have run

### Issue: Frontend works but backend doesn't

**Check:**
1. Vercel Dashboard → **Functions** tab
2. Is `api/index.js` listed? If not, backend didn't deploy
3. Check build logs for backend build step
4. Verify `api/index.js` exists in repo

## 📋 Verification Checklist

After deployment, verify:

- [ ] Frontend loads at `https://your-app.vercel.app`
- [ ] Backend health check works: `/health`
- [ ] API endpoints work: `/api/jobs`
- [ ] API docs accessible: `/api-docs`
- [ ] Vercel Functions tab shows `api/index.js`
- [ ] Environment variables are set
- [ ] Database migrations have run
- [ ] Frontend can make API calls (check browser console)

## 🎯 Quick Test Commands

```bash
# Test health
curl https://your-app.vercel.app/health

# Test API
curl https://your-app.vercel.app/api/jobs

# Test with auth (if needed)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.vercel.app/api/jobs
```

## 📚 Related Files

- `vercel.json` - Vercel configuration
- `api/index.js` - Backend serverless function entry
- `DEPLOYMENT.md` - Detailed deployment info
- `VERCEL_TROUBLESHOOTING.md` - Troubleshooting guide

