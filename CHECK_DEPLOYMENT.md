# Quick Check: Is Backend Deploying?

## 🔍 Step 1: Check Vercel Dashboard

### A. Check Functions Tab

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Functions"** tab (or "Serverless Functions")
3. Look for `api/index.js` in the list

**What you should see:**
- ✅ `api/index.js` listed → Backend is deployed!
- ❌ Nothing listed or only Next.js functions → Backend didn't deploy

### B. Check Build Logs

1. Go to **Deployments** tab
2. Click on your latest deployment
3. Click **"Build Logs"** or scroll down to see logs

**What to look for:**
- ✅ `Building api/index.js...`
- ✅ `@vercel/node` mentions
- ❌ Only frontend build logs
- ❌ Errors related to `api/index.js`

### C. Check Deployment Output

In build logs, you should see:

```
Installing dependencies...
Installing dependencies for frontend/app-ui...
Building frontend/app-ui...
✓ Compiled successfully

Building api/index.js...
✓ Built api/index.js
```

## 🧪 Step 2: Test Backend Directly

Try these URLs (replace with your actual Vercel URL):

```bash
# Health check
https://your-app.vercel.app/health

# API endpoint
https://your-app.vercel.app/api/jobs

# API docs
https://your-app.vercel.app/api-docs
```

**Expected Results:**
- ✅ `/health` returns: `{"status":"ok",...}`
- ✅ `/api/jobs` returns: `[]` or array of jobs
- ✅ `/api-docs` shows Swagger UI
- ❌ 404 Not Found → Backend not deployed
- ❌ 500 Internal Server Error → Backend deployed but has errors

## 🐛 Common Issues & Fixes

### Issue 1: Functions Tab Shows No `api/index.js`

**Possible Causes:**
1. `vercel.json` not being read correctly
2. `api/index.js` not found during build
3. Build configuration error

**Fixes:**
1. **Verify files exist:**
   ```bash
   ls -la api/index.js
   ls -la vercel.json
   ```

2. **Check `vercel.json` syntax:**
   - Make sure it's valid JSON
   - No trailing commas
   - Proper quotes

3. **Try alternative configuration:**
   - See `DEPLOY_BOTH_GUIDE.md` for alternative configs

### Issue 2: Build Succeeds but Backend Returns 404

**Possible Causes:**
1. Routes in `vercel.json` incorrect
2. Function deployed but routes not configured
3. Path mismatch

**Fixes:**
1. Check `vercel.json` routes section
2. Verify routes match your API paths
3. Check Vercel Functions tab for the function path

### Issue 3: Backend Build Fails

**Check Build Logs for:**
- Missing dependencies
- Syntax errors in `api/index.js`
- Import errors from `src/app.js`
- Database connection errors

**Fixes:**
1. Check root `package.json` has all dependencies
2. Test locally: `node api/index.js` (might fail locally but that's OK)
3. Check all imports in `src/app.js` are correct

### Issue 4: Backend Deploys but Returns 500

**Check Function Logs:**
1. Vercel Dashboard → Functions → `api/index.js`
2. Click **"Logs"** tab
3. Look for error messages

**Common Errors:**
- Database connection: Set `DATABASE_URL`
- Missing env vars: Check all required vars are set
- Migration errors: Run migrations first

## ✅ Verification Checklist

Run through this checklist:

- [ ] `api/index.js` exists in repository
- [ ] `vercel.json` exists and has correct config
- [ ] Root `package.json` has all backend dependencies
- [ ] Environment variables set in Vercel
- [ ] Functions tab shows `api/index.js`
- [ ] Build logs show backend build step
- [ ] `/health` endpoint works
- [ ] `/api/jobs` endpoint works (or returns expected error)
- [ ] Function logs show no errors

## 🚀 Next Steps

If backend is NOT deploying:

1. **Check DEPLOY_BOTH_GUIDE.md** for step-by-step instructions
2. **Review build logs** for specific errors
3. **Verify configuration files** are correct
4. **Test locally** (if possible) to isolate issues

If backend IS deploying but not working:

1. **Check function logs** for runtime errors
2. **Verify environment variables** are set correctly
3. **Run database migrations** (see QUICK_DEPLOY.md)
4. **Test API endpoints directly** in browser/Postman

