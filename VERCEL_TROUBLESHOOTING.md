# Vercel Deployment Troubleshooting

## "Failed to fetch" Error on Vercel

### Most Common Cause: Missing NEXT_PUBLIC_API_BASE_URL

The frontend defaults to `http://localhost:3000` if `NEXT_PUBLIC_API_BASE_URL` is not set. On Vercel, this must point to your Vercel deployment URL.

### Fix Steps:

#### 1. Check Your Vercel Deployment URL

After deploying, your app will be at:
```
https://your-app-name.vercel.app
```

Or if you set a custom domain:
```
https://your-custom-domain.com
```

#### 2. Set Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add/Update:
```
NEXT_PUBLIC_API_BASE_URL=https://your-app-name.vercel.app
```

**Important:**
- Must include `https://`
- Use your actual Vercel URL (not localhost)
- Must be set for **Production**, **Preview**, and **Development** environments
- After setting, you **MUST redeploy** for changes to take effect

#### 3. Verify Environment Variables Are Set

Check in Vercel Dashboard:
- Settings → Environment Variables
- Make sure `NEXT_PUBLIC_API_BASE_URL` is listed
- Check the value is correct

#### 4. Redeploy After Setting Environment Variables

**Option A: Via Dashboard**
- Go to Deployments
- Click "..." on latest deployment
- Click "Redeploy"

**Option B: Via CLI**
```bash
vercel --prod
```

**Option C: Push a new commit**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

#### 5. Verify API is Working

Test these URLs in your browser:

**Health Check:**
```
https://your-app-name.vercel.app/health
```
Should return: `{"status":"ok",...}`

**API Docs:**
```
https://your-app-name.vercel.app/api-docs
```
Should show Swagger UI

**API Endpoint:**
```
https://your-app-name.vercel.app/api/jobs
```
Should return jobs (or empty array if no data)

### Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Functions** tab
3. Click on a function (e.g., `/api/index.js`)
4. View **Logs** tab
5. Look for errors

Common errors:
- Database connection issues
- Missing environment variables
- Function timeout

### Debug Frontend API Calls

**Option 1: Browser Console**
1. Open your deployed app
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Look for error messages showing the API URL being called

**Option 2: Network Tab**
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Make a request (e.g., load jobs page)
4. Check failed requests
5. See the exact URL being called

### Common Issues

#### Issue: Frontend shows "Cannot connect to API at http://localhost:3000"

**Cause:** `NEXT_PUBLIC_API_BASE_URL` not set or wrong value

**Fix:**
1. Set `NEXT_PUBLIC_API_BASE_URL=https://your-app-name.vercel.app` in Vercel
2. Redeploy

#### Issue: API returns 404

**Cause:** Routes not configured correctly in `vercel.json`

**Fix:** Check `vercel.json` routes are correct:
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

#### Issue: CORS errors

**Cause:** Backend CORS not allowing Vercel domain

**Fix:** Already handled - `app.use(cors())` allows all origins. If still having issues, check Vercel function logs.

#### Issue: Database connection errors

**Cause:** `DATABASE_URL` not set or incorrect

**Fix:**
1. Verify `DATABASE_URL` in Vercel environment variables
2. Check Neon database allows connections
3. Ensure SSL is enabled in connection string

### Quick Verification Checklist

- [ ] `NEXT_PUBLIC_API_BASE_URL` is set to your Vercel URL
- [ ] Environment variables are set for all environments (Production, Preview, Development)
- [ ] Redeployed after setting environment variables
- [ ] `DATABASE_URL` is set correctly
- [ ] Migrations have been run
- [ ] Health endpoint works: `/health`
- [ ] API docs accessible: `/api-docs`

### Test Commands

After deployment, test from your terminal:

```bash
# Test health endpoint
curl https://your-app-name.vercel.app/health

# Test API endpoint
curl https://your-app-name.vercel.app/api/jobs

# Test with your Vercel URL
curl https://your-app-name.vercel.app/api/system/health
```

### Still Not Working?

1. **Check Function Logs:**
   - Vercel Dashboard → Functions → Logs
   - Look for error messages

2. **Check Build Logs:**
   - Vercel Dashboard → Deployments → Click on deployment → View build logs

3. **Verify vercel.json:**
   - Make sure routes are configured correctly
   - Check that `api/index.js` exists

4. **Test API directly:**
   - Try accessing API endpoints directly in browser
   - Check if they return data or errors

5. **Check Network Tab:**
   - Open deployed frontend
   - Check browser Network tab for failed requests
   - See exact error messages


