# Swagger UI Testing Guide

This guide will help you test the FixingApp API using Swagger UI.

## Prerequisites

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Ensure the database is migrated:
   ```bash
   npm run migrate
   ```

3. (Recommended) Seed the database with sample data:
   ```bash
   npm run seed
   ```
   
   This creates test accounts you can use immediately:
   - **Admin**: Phone `0999999999`, Password `admin123`
   - **Employers**: Phone `0901234567` or `0902345678`, Password `password123`
   - **Workers**: Phone `0913456789`, `0914567890`, or `0915678901`, Password `password123`

## Starting the Server

### Option 1: Production Mode
```bash
npm start
```

### Option 2: Development Mode (with auto-reload)
```bash
npm run dev
```

The server will start on port 3000 (or the port specified in `PORT` environment variable).

## Accessing Swagger UI

Once the server is running, open your browser and navigate to:

```
http://localhost:3000/api-docs
```

You should see the Swagger UI interface with all available API endpoints.

## Testing Workflow

### Step 1: Login with Seeded Account (Recommended)

If you ran `npm run seed`, you can skip registration and login directly:

1. Find the **Auth** section in Swagger UI
2. Expand `POST /api/auth/login`
3. Click **"Try it out"**
4. Fill in the request body with a seeded account:
   ```json
   {
     "phone": "0901234567",
     "password": "password123"
   }
   ```
   (Use any seeded account from the seed output)
5. Click **"Execute"**
6. Copy the `token` from the response

**OR Register a New User:**

1. Find the **Auth** section in Swagger UI
2. Expand `POST /api/auth/register-employer` or `POST /api/auth/register-worker`
3. Click **"Try it out"**
4. Fill in the request body:
   ```json
   {
     "phone": "0123456789",
     "password": "password123",
     "fullName": "Test User",
     "address": "123 Test St"
   }
   ```
   (For workers, also include `"skill": "Plumbing"`)
5. Click **"Execute"**
6. Copy the `token` from the response

### Step 2: Authenticate in Swagger UI

1. Click the **"Authorize"** button at the top right of Swagger UI
2. In the `bearerAuth` field, paste your token (without the "Bearer " prefix)
3. Click **"Authorize"** then **"Close"**
4. Now all protected endpoints will automatically include your token

### Step 3: Test Protected Endpoints

Once authenticated, you can test any protected endpoint:

- **Jobs**: Create, list, update, delete jobs
- **Applications**: Apply to jobs, view applications
- **Reviews**: Submit reviews for completed jobs
- **Complaints**: File complaints
- **Certificates**: Submit certificates (workers) or verify them (admins)
- **Notifications**: View notifications
- **Admin**: Approve/reject jobs and certificates

## Example Testing Scenarios

### Scenario 1: Complete Job Flow (Employer)

1. **Register as Employer**
   - `POST /api/auth/register-employer`
   - Save the token

2. **Create a Job**
   - `POST /api/jobs`
   - Use the token from step 1
   - Save the `jobId` from response

3. **View Your Jobs**
   - `GET /api/jobs/my`
   - Should see the job you just created

4. **View Job Applications** (after workers apply)
   - `GET /api/jobs/{jobId}/applications`
   - Replace `{jobId}` with the ID from step 2

5. **Accept a Worker**
   - `POST /api/jobs/{jobId}/accept/{workerId}`
   - Replace `{jobId}` and `{workerId}` with actual IDs

6. **Complete the Job**
   - `POST /api/jobs/{jobId}/complete`

7. **Review the Worker**
   - `POST /api/jobs/{jobId}/review`
   - Include `stars` (1-5) and optional `comment`

### Scenario 2: Worker Flow

1. **Register as Worker**
   - `POST /api/auth/register-worker`
   - Include `skill` field (e.g., "Plumbing")
   - Save the token

2. **Browse Jobs**
   - `GET /api/jobs`
   - Try query parameters: `keyword`, `category`, `minPrice`, `maxPrice`

3. **Apply to a Job**
   - `POST /api/jobs/{jobId}/apply`
   - Replace `{jobId}` with a job ID from step 2

4. **Submit Certificate**
   - `POST /api/workers/certificates`
   - Include `imageUrl`

5. **Check Certificate Status**
   - `GET /api/workers/certificates/status`

6. **View Reviews**
   - `GET /api/workers/{workerId}/reviews`
   - Replace `{workerId}` with your worker ID

### Scenario 3: Admin Flow

1. **Register as Admin** (or use existing admin account)
   - Note: Admin accounts need to be created manually in the database
   - Or use the test admin from tests

2. **View Pending Jobs**
   - `GET /api/admin/jobs/pending`

3. **Approve/Reject Jobs**
   - `POST /api/admin/jobs/{jobId}/approve`
   - `POST /api/admin/jobs/{jobId}/reject`

4. **View Pending Certificates**
   - `GET /api/admin/certificates/pending`

5. **Approve/Reject Certificates**
   - `POST /api/admin/certificates/{certId}/approve`
   - `POST /api/admin/certificates/{certId}/reject`

6. **View Pending Complaints**
   - `GET /api/admin/complaints`

7. **Resolve Complaints**
   - `POST /api/admin/complaints/{complaintId}/resolve`
   - Include `decision` ("ACCEPT" or "REJECT")

## Tips for Testing

1. **Token Persistence**: Swagger UI saves your authorization token, so you don't need to re-authenticate for each request.

2. **Response Codes**: Pay attention to HTTP status codes:
   - `200` = Success
   - `201` = Created
   - `400` = Bad Request (validation error)
   - `401` = Unauthorized (missing/invalid token)
   - `403` = Forbidden (insufficient permissions)
   - `404` = Not Found
   - `500` = Server Error

3. **Error Messages**: Check the response body for detailed error messages when requests fail.

4. **Test Data**: Use unique phone numbers for each test user to avoid conflicts.

5. **System Tasks**: Test the system task endpoint:
   - `POST /api/system/jobs/expire-handover`
   - This processes overdue jobs (no authentication required)

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify database file exists and is accessible
- Check console for error messages

### 401 Unauthorized errors
- Make sure you've clicked "Authorize" and entered your token
- Verify the token hasn't expired (tokens last 24 hours)
- Check that you're using the correct token format (without "Bearer " prefix in Swagger UI)

### 404 Not Found errors
- Verify the endpoint path is correct
- Check that the resource ID exists in the database
- Ensure the server is running

### Database errors
- Run migrations: `npm run migrate`
- Check that the database file (`app.db`) exists
- Verify foreign key constraints are satisfied

## Quick Reference

- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Swagger JSON**: http://localhost:3000/api-docs/swagger.json

## Next Steps

After testing with Swagger UI, you can:
1. Use the API from a frontend application
2. Integrate with mobile apps
3. Build automated API clients
4. Generate API documentation for your team

