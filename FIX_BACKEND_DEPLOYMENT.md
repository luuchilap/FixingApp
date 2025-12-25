# Fix: Backend Not Deploying on Vercel

## 🎯 Quick Diagnosis

Since your frontend deployed successfully but backend didn't, follow these steps:

## Step 1: Verify Backend Was Attempted

### Check Vercel Dashboard → Functions Tab

1. Go to your Vercel project
2. Click **"Functions"** tab (may be called "Serverless Functions")
3. **What do you see?**
   - ✅ `api/index.js` listed → Backend IS deployed, but may have errors
   - ❌ No `api/index.js` → Backend didn't deploy

### Check Build Logs

1. Go to **Deployments** → Click latest deployment
2. Scroll to **Build Logs**
3. **Look for:**
   ```
   Building api/index.js...
   ```
   - ✅ Found → Backend attempted to build
   - ❌ Not found → Backend build step skipped

## Step 2: Common Issues & Fixes

### Issue A: Backend Build Step Missing

**Symptom:** Build logs only show frontend build, no `api/index.js`

**Cause:** Vercel not detecting `vercel.json` or ignoring builds config

**Fix Option 1: Update Vercel Project Settings**

1. Vercel Dashboard → Settings → General
2. **Root Directory:** `.` (root)
3. **Framework Preset:** Other (don't use Next.js preset)
4. **Build Command:** Leave empty
5. **Output Directory:** Leave empty
6. Save and redeploy

**Fix Option 2: Try Alternative Configuration**

If `builds` in `vercel.json` isn't working, Vercel might be using auto-detection. 

Try creating a `vercel.json` with rewrites instead:

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

This is the same as current - but verify it's actually in your repo and committed.

**Fix Option 3: Ensure `api/index.js` is in Git**

```bash
git status
git add api/index.js
git commit -m "Ensure api/index.js is tracked"
git push
```

### Issue B: Backend Build Fails

**Symptom:** Build logs show errors for `api/index.js`

**Check for these errors:**

1. **Missing Dependencies**
   ```
   Error: Cannot find module 'express'
   ```
   **Fix:** Ensure root `package.json` has all backend dependencies

2. **Path Errors**
   ```
   Error: Cannot find module '../src/app'
   ```
   **Fix:** Verify `src/app.js` exists and is in Git

3. **Syntax Errors**
   ```
   SyntaxError: Unexpected token
   ```
   **Fix:** Test locally: `node api/index.js` (may error on missing env, but should parse)

### Issue C: Backend Builds But Routes Don't Work

**Symptom:** Functions tab shows `api/index.js` but `/health` returns 404

**Fix:** Check routes in `vercel.json` match your Express routes

**Test routes:**
- `/health` → Should route to `api/index.js`
- `/api/jobs` → Should route to `api/index.js`
- `/api-docs` → Should route to `api/index.js`

## Step 3: Detailed Troubleshooting

### A. Verify Project Structure in Vercel

Vercel should see this structure:
```
FixingApp/
├── api/
│   └── index.js          ← Backend entry
├── frontend/
│   └── app-ui/           ← Frontend
├── src/                  ← Backend source
│   └── app.js
├── package.json          ← Root dependencies
└── vercel.json          ← Config
```

### B. Check Vercel is Reading vercel.json

1. Go to Deployments → Latest
2. Check build logs for: `Reading vercel.json`
3. If not found, Vercel might be ignoring it

**Fix:** Ensure `vercel.json` is:
- ✅ In root directory
- ✅ Committed to Git
- ✅ Valid JSON (no syntax errors)

### C. Test Locally (Optional)

Test if `api/index.js` can be loaded (won't run fully without env vars):

```bash
node -e "require('./api/index.js'); console.log('✓ Loaded successfully')"
```

Should output: `✓ Loaded successfully`

If error, fix the error before deploying.

## Step 4: Manual Verification Steps

### 1. Check Files are Committed

```bash
git ls-files | grep -E "(api/index.js|vercel.json|src/app.js)"
```

Should show all three files.

### 2. Check vercel.json Syntax

```bash
node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8')); console.log('✓ Valid JSON')"
```

Should output: `✓ Valid JSON`

### 3. Verify Root package.json Has Dependencies

```bash
grep -E "(express|pg|cors)" package.json
```

Should show these dependencies.

## Step 5: Redeploy After Fixes

After making any changes:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Fix backend deployment"
   git push
   ```

2. **Or trigger redeploy in Vercel:**
   - Go to Deployments
   - Click "..." on latest deployment
   - Click "Redeploy"

3. **Monitor build logs** to see if backend builds

## Step 6: Verify Backend is Working

After redeploy, test:

```bash
# Replace with your actual Vercel URL
curl https://your-app.vercel.app/health
```

Should return:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

## 🆘 Still Not Working?

If backend still doesn't deploy:

1. **Check Vercel Support Docs:**
   - https://vercel.com/docs/concepts/functions/serverless-functions

2. **Check Build Logs Carefully:**
   - Look for any warnings or errors
   - Check if Vercel is detecting the configuration

3. **Try Simplifying:**
   - Temporarily simplify `api/index.js` to just export a simple function
   - See if that deploys
   - Then gradually add complexity back

4. **Alternative: Deploy Backend Separately**
   - Deploy backend as separate Vercel project
   - Update frontend `NEXT_PUBLIC_API_BASE_URL` to point to backend URL

## 📋 Checklist Before Redeploying

- [ ] `api/index.js` exists and is committed
- [ ] `vercel.json` exists and is valid JSON
- [ ] `src/app.js` exists and is committed
- [ ] Root `package.json` has all backend dependencies
- [ ] Vercel project settings don't override `vercel.json`
- [ ] All files are pushed to Git
- [ ] Environment variables are set in Vercel

## 🎯 Most Likely Fix

If frontend works but backend doesn't, most likely:

1. **Vercel project settings are overriding `vercel.json`**
   - Fix: Clear build/output commands in settings

2. **`vercel.json` not being read**
   - Fix: Ensure it's committed and in root

3. **Backend build step failing silently**
   - Fix: Check build logs carefully for errors

Start with checking the Functions tab - that will tell you if the backend even attempted to deploy!

