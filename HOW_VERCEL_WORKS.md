# How Both Backend & Frontend Deploy on Vercel

## ✅ Current Configuration

Your project is already configured to deploy **both** the Express backend and Next.js frontend on Vercel in a single deployment!

## 📋 Architecture

```
Vercel Deployment
│
├── Frontend (Next.js)
│   └── All routes except /api/* → Next.js app
│   └── Located in: frontend/app-ui/
│
└── Backend (Express API)
    └── All /api/* routes → Express serverless function
    └── Located in: api/index.js → wraps src/app.js
```

## 🛣️ Routing Configuration

From `vercel.json`:

### Backend Routes (Express API)
- `/api/*` → Express backend (`/api/index.js`)
- `/health` → Express backend
- `/api-docs` → Express backend (Swagger)

### Frontend Routes (Next.js)
- `/*` (everything else) → Next.js app

## 🔧 How It Works

### 1. Frontend Build
```json
{
  "src": "frontend/app-ui/package.json",
  "use": "@vercel/next"
}
```
- Vercel detects Next.js in `frontend/app-ui/`
- Runs `npm run build` in that directory
- Deploys as static site + serverless functions

### 2. Backend Build
```json
{
  "src": "api/index.js",
  "use": "@vercel/node"
}
```
- Vercel detects `api/index.js` entry point
- Wraps your Express app as a serverless function
- All `/api/*` requests route to this function

### 3. Request Routing
When a request comes in:

1. **API Request** (`/api/jobs`, `/health`, etc.)
   - Matches route pattern: `/api/(.*)` or `/health`
   - Routes to: `/api/index.js` (Express backend)
   - Handled by: Your Express app

2. **Frontend Request** (`/`, `/dashboard`, etc.)
   - Matches catch-all: `/(.*)`
   - Routes to: `/frontend/app-ui/$1` (Next.js)
   - Handled by: Next.js app

## 🚀 Single Deployment = Both Apps

When you deploy to Vercel:

1. **Both are built:**
   - ✅ Next.js frontend gets built
   - ✅ Express backend gets packaged as serverless function

2. **Both are deployed:**
   - ✅ Frontend available at: `https://your-app.vercel.app/`
   - ✅ Backend available at: `https://your-app.vercel.app/api/*`

3. **Same domain, different paths:**
   - Frontend: `https://your-app.vercel.app/dashboard`
   - Backend: `https://your-app.vercel.app/api/jobs`

## ⚙️ Environment Variables

Set these in Vercel for **both** to work:

### For Backend (Express)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
MIGRATION_SECRET=your-migration-secret
```

### For Frontend (Next.js)
```
NEXT_PUBLIC_API_BASE_URL=https://your-app.vercel.app
```

**Note:** `NEXT_PUBLIC_*` variables are exposed to the browser.

## 📝 File Structure

```
FixingApp/
├── vercel.json              ← Routes both apps
├── api/
│   └── index.js            ← Backend entry point (wraps Express)
├── frontend/
│   └── app-ui/             ← Frontend (Next.js)
│       ├── package.json
│       └── src/
└── src/                    ← Backend source code
    └── app.js              ← Express app
```

## ✅ Benefits

1. **Single Deployment** - Deploy once, both apps go live
2. **Same Domain** - No CORS issues between frontend and backend
3. **Shared Environment** - Same environment variables
4. **Easy Updates** - Push code, both update together

## 🔍 Verify Both Are Working

After deployment, test:

**Frontend:**
```
https://your-app.vercel.app/
https://your-app.vercel.app/dashboard
```

**Backend:**
```
https://your-app.vercel.app/health
https://your-app.vercel.app/api/jobs
https://your-app.vercel.app/api-docs
```

## 🐛 Troubleshooting

### Backend not working?
- Check `api/index.js` exists
- Check Vercel function logs
- Verify routes in `vercel.json`

### Frontend not working?
- Check `frontend/app-ui/package.json` exists
- Check build logs in Vercel
- Verify `NEXT_PUBLIC_API_BASE_URL` is set

### Both not deploying?
- Check `vercel.json` is in root
- Verify build commands are correct
- Check for build errors in Vercel logs

