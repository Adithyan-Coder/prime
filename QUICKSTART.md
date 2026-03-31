# ⚡ QUICK START - 5 Minute Setup

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- Supabase account (free at supabase.com)

## Step 1: Get Supabase Credentials (2 min)

1. Go to supabase.com and create account
2. Create new project
3. Go to Settings → API
4. Copy: `Project URL` and `Anon Public Key`

## Step 2: Setup Backend (2 min)

```bash
cd prime_backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
# On Windows:
copy .env.example .env
# On macOS/Linux:
cp .env.example .env

# Edit .env and add your Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-public-key
# SUPABASE_JWT_SECRET=your-jwt-secret

python manage.py runserver
```

**Output**: Django running on `http://localhost:8000/api/`

## Step 3: Setup Frontend (1 min)

**In a NEW terminal window:**

```bash
cd backupprime
npm install

# Create .env
# On Windows:
echo VITE_API_URL=http://localhost:8000/api > .env
# On macOS/Linux:
echo "VITE_API_URL=http://localhost:8000/api" > .env

npm run dev
```

**Output**: React running on `http://localhost:5173/`

## Test It!

1. Open `http://localhost:5173` in browser
2. Click "Get Started"
3. Login with any email (e.g., `teacher@university.edu`)
4. Choose role: `faculty`
5. Password: anything

✅ **You're in!**

## Setup Supabase Tables (Required!)

1. Go to your Supabase dashboard
2. Click "SQL Editor"
3. Paste this entire script:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('student', 'faculty', 'admin')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  domains TEXT[],
  year TEXT,
  license TEXT,
  techStack TEXT[],
  status TEXT CHECK(status IN ('public', 'locked', 'approved')),
  owner TEXT NOT NULL,
  ownerId TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  lastUpdated TIMESTAMP DEFAULT NOW(),
  approvedFacultyIds TEXT[],
  approvalStatus TEXT CHECK(approvalStatus IN ('pending', 'approved', 'rejected'))
);

-- Team members table
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contribution TEXT NOT NULL
);

-- Access requests table
CREATE TABLE access_requests (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES projects(id),
  facultyId TEXT NOT NULL,
  facultyName TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected')),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Landing content table
CREATE TABLE landing_content (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  features JSONB
);
```

4. Click "Run" button
5. Done! ✅

## Troubleshooting

### Port 8000 already in use?
```bash
python manage.py runserver 8001
# Update frontend .env: VITE_API_URL=http://localhost:8001/api
```

### Port 5173 already in use?
```bash
npm run dev -- --port 5174
```

### CORS Error?
- Make sure Django is running
- Check .env has correct API URL
- Restart frontend

### Supabase Connection Error?
- Check SUPABASE_URL and SUPABASE_KEY are correct
- Run the SQL queries above in Supabase
- Check project is active

## Using With Existing Frontend

Replace your App.tsx:
```bash
# Backup original
mv src/App.tsx src/App-original.tsx

# Use backend version
mv src/App-with-backend.tsx src/App.tsx
```

Or manually integrate the API client:
- Copy `src/lib/apiClient.ts`
- Import: `import { apiClient } from './lib/apiClient';`
- Use: `await apiClient.login(email, password);`

## What to Do Next

1. ✅ Get everything running locally
2. Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
3. Read [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for all endpoints
4. Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to deploy

## Quick Command Reference

```bash
# Backend
cd prime_backend
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt
python manage.py runserver

# Frontend
cd backupprime
npm install
npm run dev

# Stop servers
# Ctrl+C in both terminals
```

## API Test

```bash
# Get all projects
curl http://localhost:8000/api/projects/

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123","role":"student"}'
```

---

**Questions?** See the full documentation in README.md and SETUP_GUIDE.md

**Ready to deploy?** Follow DEPLOYMENT_GUIDE.md

🎉 **You're all set!**
