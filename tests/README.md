# Testing Strategy

This directory contains integration tests for the MVP backend following the **Test First** approach.

## Test Structure

- `setup.js` - Database initialization and cleanup utilities
- `helpers.js` - Test helper functions for creating test data
- `integration/` - Integration test files organized by module

## Test Files

- `auth.test.js` - Authentication (register, login, logout)
- `jobs.test.js` - Job CRUD operations
- `applications.test.js` - Job applications (apply, accept, reject)
- `job-status.test.js` - Job status management (complete, reset)
- `reviews.test.js` - Worker reviews and ratings
- `complaints.test.js` - Complaint creation and resolution
- `admin.test.js` - Admin functions (approve/reject jobs, certificates)
- `certificates.test.js` - Worker certificate upload and status
- `business-rules.test.js` - Critical business logic validation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Database

Tests use a separate SQLite database (`test.db`) that is:
- Created fresh before each test suite
- Cleaned up after tests complete
- Isolated from the main application database

## Test Approach

### Integration Tests Only
- No unit tests in MVP
- Tests cover full request/response cycle
- Tests verify database state changes

### Happy Path Focus
- Primary focus on successful workflows
- Critical business rules are tested
- Error cases covered for important validations

### Business Rules Tested
- Cannot apply to completed jobs (`DA_XONG`)
- Cannot edit job when worker is accepted
- Cannot review same job twice
- Cannot accept more than one worker per job
- Job status transitions are validated
- Completed jobs hidden from public list
- Unique application per job-worker pair

## Test Data

Tests use helper functions to create:
- Test users (employers, workers, admins)
- Test jobs with various statuses
- Test applications
- Test certificates
- Test reviews and complaints

All test data is isolated and cleaned up automatically.

## Notes

- Tests will fail until the actual Express app is implemented
- Tests assume JWT authentication with Bearer tokens
- Tests verify both API responses and database state
- Status logs are verified for audit trail compliance

