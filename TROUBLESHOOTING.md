# Troubleshooting Guide

## "Failed to fetch" Error

### Problem
The frontend cannot connect to the backend API.

### Solution

**1. Start the Backend Server**

In the project root directory:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The backend should start on `http://localhost:3000`

**2. Verify Backend is Running**

Open in browser or use curl:
```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

**3. Check Frontend API Configuration**

The frontend defaults to `http://localhost:3000`. To change it:

Create `frontend/app-ui/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Or check the browser console to see what URL it's trying to connect to.

**4. Start the Frontend**

In a separate terminal:
```bash
cd frontend/app-ui
npm run dev
```

The frontend should start on `http://localhost:3001` (or another port if 3001 is taken).

**5. Verify Both Are Running**

- Backend: `http://localhost:3000/health` ✅
- Frontend: `http://localhost:3001` ✅

## Common Issues

### Backend won't start

**Error: DATABASE_URL not set**
```bash
# Make sure .env file exists in project root
# Or set it inline:
DATABASE_URL="your-db-url" npm start
```

**Error: Port 3000 already in use**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
PORT=3001 npm start
```

### Frontend can't connect

**Check API_BASE_URL:**
- Open browser console (F12)
- Look for error messages showing the API URL
- Verify it matches your backend URL

**CORS Issues:**
- The backend has CORS enabled (`app.use(cors())`)
- If still having issues, check browser console for CORS errors

### Database Connection Issues

**Error: Connection refused**
- Verify `DATABASE_URL` is correct
- Check Neon database is accessible
- Ensure SSL is enabled in connection string

## Quick Health Check

Run these commands to verify everything:

```bash
# 1. Check backend health
curl http://localhost:3000/health

# 2. Check API docs
open http://localhost:3000/api-docs

# 3. Check frontend
open http://localhost:3001
```

## Still Having Issues?

1. Check browser console for detailed error messages
2. Check backend terminal for error logs
3. Verify all environment variables are set
4. Make sure both servers are running


