# Local Development Setup Guide

This guide will help you set up a completely isolated local environment for testing without affecting production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed locally (or use Docker)
- Git installed

## Step 1: Set Up Local Database

### Option A: Using Local PostgreSQL
1. Install PostgreSQL if not already installed
2. Create a new database:
```bash
psql -U postgres
CREATE DATABASE orgchart_local;
\q
```

### Option B: Using Docker
```bash
docker run --name orgchart-postgres -e POSTGRES_PASSWORD=localpassword -e POSTGRES_DB=orgchart_local -p 5432:5432 -d postgres
```

## Step 2: Create .env.local File

Create a `.env.local` file (this will override `.env` in development):

```bash
# Local Database (completely separate from production)
DATABASE_URL="postgresql://postgres:localpassword@localhost:5432/orgchart_local"

# Clerk Test Mode (create a separate development instance)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_DEV_KEY
CLERK_SECRET_KEY=sk_test_YOUR_DEV_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# OpenAI API Key (you can use the same key, it won't affect production)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY

# Local App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Webhook Secret (from your Clerk dev instance)
WEBHOOK_SECRET=whsec_YOUR_DEV_WEBHOOK_SECRET
```

## Step 3: Set Up Clerk (Authentication) - Development Instance

1. Go to https://dashboard.clerk.com
2. Create a NEW application called "OrgChart Local" or similar
3. This will be completely separate from your production Clerk instance
4. Enable Google OAuth in the Clerk dashboard
5. Copy the keys to your `.env.local` file

## Step 4: Initialize Local Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to local database
npm run db:push

# Optional: Open Prisma Studio to view your database
npm run db:studio
```

## Step 5: Create Test Admin User

1. Start the development server:
```bash
npm run dev
```

2. Sign up with a test email at http://localhost:3000/sign-up

3. Make yourself an admin by running this SQL in your local database:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-test-email@example.com';
```

## Step 6: Load Test Data

Use the included demo CSV file to populate your local org chart:

1. Sign in as admin
2. Go to the admin panel
3. Upload `demo_staff.csv` or create your own test CSV

### Sample Test CSV Structure:
```csv
employeeId,firstName,lastName,email,title,department,managerId,personalityType
1,John,Smith,john@test.local,CEO,Executive,,professional
2,Jane,Doe,jane@test.local,CTO,Engineering,1,technical
3,Bob,Wilson,bob@test.local,Senior Engineer,Engineering,2,analytical
```

## Step 7: Test Document Upload

1. Create test documents for employees:

**test-john.txt:**
```
John Smith - CEO Profile

Responsibilities:
- Strategic planning and vision
- Stakeholder management
- Board reporting

Current Projects:
- Q4 expansion planning
- Series B fundraising
```

2. Upload via the document upload button on employee nodes

## Step 8: Test AI Chat

The AI chat will work with your OpenAI API key. To minimize costs during testing:

1. The app uses `gpt-4o-mini` by default (cheaper model)
2. You can set spending limits in your OpenAI account
3. Test with a few messages first to ensure everything works

## Isolation Guarantees

✅ **Completely Separate:**
- Local database (no production data)
- Separate Clerk instance (different users/auth)
- Local file storage
- Different webhook endpoints

✅ **Safe to Share:**
- OpenAI API (read-only, just makes API calls)

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql postgresql://postgres:localpassword@localhost:5432/orgchart_local
```

### Clerk Issues
- Make sure you're using test keys (start with `pk_test_` and `sk_test_`)
- Ensure Google OAuth is enabled in your Clerk dev instance
- Check webhook endpoint is set to `http://localhost:3000/api/webhooks/clerk`

### OpenAI Issues
- Verify API key is valid at https://platform.openai.com/api-keys
- Check usage/billing at https://platform.openai.com/usage

## Clean Development Data

To reset your local environment:

```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE orgchart_local;
CREATE DATABASE orgchart_local;
\q

# Push schema again
npm run db:push
```

## Running Tests

```bash
# Start dev server
npm run dev

# In another terminal, run type checking
npm run typecheck

# Run linter
npm run lint
```

## Important Notes

1. **Never commit .env.local** - it's already in .gitignore
2. **Use test emails** that end with `.local` or `.test` to avoid confusion
3. **Document uploads** are stored in the database, not filesystem
4. **Calendar integration** requires additional Google Cloud setup (optional for testing)

## Quick Start Checklist

- [ ] PostgreSQL running locally
- [ ] `.env.local` created with all keys
- [ ] Clerk dev instance created
- [ ] Database initialized with `npm run db:push`
- [ ] Admin user created
- [ ] Test CSV uploaded
- [ ] Test document attached to an employee
- [ ] Successfully chatted with an AI employee

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal running `npm run dev` for server errors
3. Verify all environment variables are set correctly
4. Ensure database is accessible