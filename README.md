# FixingApp Backend MVP

Backend MVP for a web application connecting employers with workers for task-based jobs.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Neon PostgreSQL (migrated from SQLite)
- **Authentication**: JWT
- **Testing**: Jest + Supertest
- **Frontend**: Next.js (in `frontend/app-ui/`)
- **Deployment**: Vercel (configured)

## Project Structure

```
project-root/
├── src/                    # Source code (to be implemented)
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── modules/
│   ├── middlewares/
│   ├── database/
│   └── utils/
├── tests/                  # Integration tests
│   ├── integration/
│   ├── setup.js
│   └── helpers.js
├── documentation/          # MVP documentation
├── package.json
└── README.md
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file):
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-secret-key-here
PORT=3000
```

**Note**: For Neon PostgreSQL, get your connection string from [neon.tech](https://neon.tech)

3. Run database migrations:
```bash
npm run migrate
```

4. (Optional) Seed the database with sample data:
```bash
npm run seed
```

This will create:
- 1 Admin user (phone: 0999999999, password: admin123)
- 2 Employer users (phone: 0901234567, 0902345678, password: password123)
- 3 Worker users (phone: 0913456789, 0914567890, 0915678901, password: password123)
- 4 Sample jobs
- 2 Sample certificates

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Documentation (Swagger UI)

After starting the server, access the interactive API documentation at:

**http://localhost:3000/api-docs**

The Swagger UI provides:
- Complete API documentation
- Interactive testing interface
- Request/response examples
- Bearer token authentication support

To test authenticated endpoints:
1. Use the login endpoint to get a JWT token
2. Click the "Authorize" button in Swagger UI
3. Enter: `Bearer <your-token>` (include the word "Bearer")
4. All subsequent requests will include the token automatically

**Note**: Tests are written first (Test First approach) and will fail until the actual implementation is complete.

## Development Workflow

1. ✅ Write Swagger YAML (completed)
2. ✅ Write integration tests (completed)
3. ✅ Write SQLite DDL (completed)
4. ✅ Write API code (completed)
5. ✅ Run tests (completed - 149/149 passing)
6. ✅ Manual test with Swagger (ready)

## Testing with Swagger UI

### Quick Start

1. **Start the server**:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

2. **Open Swagger UI** in your browser:
   ```
   http://localhost:3000/api-docs
   ```

3. **Test the API**:
   - Register a user (Employer or Worker)
   - Copy the token from the response
   - Click "Authorize" button in Swagger UI
   - Paste the token (without "Bearer " prefix)
   - Start testing protected endpoints!

For detailed testing instructions, see [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md)

## MVP Scope

### Included
- Authentication (Employer, Worker, Admin)
- Job CRUD operations
- Job applications
- Worker selection (accept/reject)
- Job status management
- Reviews and ratings
- Complaints handling
- Admin moderation
- Worker certificate verification

### Excluded
- Payment processing
- Real-time chat (basic chat included)
- Recommendation system
- Advanced analytics

### Included (Post-MVP)
- ✅ Frontend UI (Next.js)
- ✅ Cloud deployment (Vercel configured)

## API Endpoints

See `documentation/mvp_APIs.md` for complete API documentation.

## Database Schema

See `documentation/mvp_database.md` for complete database schema.

## Testing Strategy

- **Test First**: Write tests before implementation
- **Integration Tests Only**: No unit tests in MVP
- **Happy Path Focus**: Test successful workflows and critical business rules
- **Business Rules**: Validate constraints like no duplicate applications, status transitions, etc.

See `tests/README.md` for detailed testing documentation.

## Deployment

### Vercel Deployment

This project is configured for deployment on Vercel. See deployment guides:

- **Quick Start**: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Fast deployment steps
- **Detailed Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment documentation

**Quick Deploy Steps**:
1. Push code to GitHub
2. Import to Vercel
3. Set environment variables (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_BASE_URL)
4. Deploy!

## License

ISC

## Development Commands

**Backend**:
```bash
npm start          # Start backend server
npm run dev        # Start with auto-reload
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data
```

**Frontend**:
```bash
cd frontend/app-ui
npm run dev        # Start Next.js dev server (port 3001)
npm run build      # Build for production
npm start          # Start production server
```