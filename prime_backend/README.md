# PRIME Backend - Django + Supabase

A fully functional Django REST API backend for the Centralized Academic Project Hub, powered by Supabase for database and authentication.

## Project Structure

```
prime_backend/
├── core/                 # Django core settings
│   ├── settings.py      # Django configuration
│   ├── urls.py          # URL routing
│   ├── wsgi.py          # WSGI configuration
│   └── __init__.py
├── api/                 # Main API app
│   ├── views.py         # API endpoints
│   ├── urls.py          # API routes
│   ├── serializers.py   # Data serializers
│   ├── apps.py
│   └── __init__.py
├── manage.py            # Django management script
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Features

### Authentication
- User login/registration
- Role-based access (student, faculty, admin)
- JWT token support (via Supabase)

### Project Management
- Create, read, update, delete projects
- Project details with team members
- Status management (public, locked, approved)
- Approval workflow for admins

### Access Management
- Faculty access requests to projects
- Approve/reject requests
- Track approved faculty members

### Admin Features
- Landing page content management
- Project approval system
- User management

## Prerequisites

Before you begin, ensure you have:
- Python 3.8+
- pip (Python package manager)
- Supabase account (free at https://supabase.com)

## Setup Instructions

### 1. Clone or Extract the Project

```bash
cd prime_backend
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your `Project URL` and `Anon Public Key`
4. Get your `JWT Secret` from the same page

### 5. Create Database Tables in Supabase

Run these SQL queries in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('student', 'faculty', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  domains TEXT[],
  year TEXT,
  license TEXT,
  techStack TEXT[],
  status TEXT CHECK(status IN ('public', 'locked', 'approved')),
  owner TEXT NOT NULL,
  ownerId UUID NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  lastUpdated TIMESTAMP DEFAULT NOW(),
  approvedFacultyIds UUID[],
  approvalStatus TEXT CHECK(approvalStatus IN ('pending', 'approved', 'rejected'))
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contribution TEXT NOT NULL
);

-- Access requests table
CREATE TABLE access_requests (
  id UUID PRIMARY KEY,
  projectId UUID NOT NULL REFERENCES projects(id),
  facultyId UUID NOT NULL,
  facultyName TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected')),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Landing content table
CREATE TABLE landing_content (
  id UUID PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  features JSONB
);

-- Team-only project chat
CREATE TABLE project_messages (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_role TEXT CHECK(sender_role IN ('student', 'faculty', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret-key
```

### 7. Run the Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login user
- `POST /api/auth/register/` - Register new user

### Users
- `GET /api/users/` - Get all users
- `GET /api/users/<user_id>/` - Get user details

### Projects
- `GET /api/projects/` - Get all projects
- `POST /api/projects/create/` - Create new project
- `GET /api/projects/<project_id>/` - Get project details
- `PUT /api/projects/<project_id>/update/` - Update project
- `DELETE /api/projects/<project_id>/delete/` - Delete project
- `GET /api/projects/<project_id>/messages/?userId=<user_id>` - Get team chat messages
- `POST /api/projects/<project_id>/messages/create/` - Send a team chat message
- `GET /api/projects/owner/<owner_id>/` - Get projects by owner

### Access Requests
- `GET /api/access-requests/` - Get all requests
- `GET /api/access-requests/project/<project_id>/` - Get requests for project
- `POST /api/access-requests/create/` - Create access request
- `PUT /api/access-requests/<request_id>/approve/` - Approve request
- `PUT /api/access-requests/<request_id>/reject/` - Reject request

### Landing Content
- `GET /api/landing-content/` - Get landing page content
- `PUT /api/landing-content/update/` - Update landing content (admin)

## Frontend Integration

Update your React frontend to use the backend API:

```javascript
const API_URL = 'http://localhost:8000/api';

// Login example
const response = await fetch(`${API_URL}/auth/login/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

## Deployment

For production deployment:

1. Set `DEBUG=False` in `.env`
2. Update `SECRET_KEY` with a secure value
3. Configure allowed hosts
4. Set up HTTPS
5. Use a production WSGI server like Gunicorn:

```bash
gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

## Technologies Used

- **Django 4.2** - Web framework
- **Django REST Framework** - API framework
- **Supabase** - Backend as a Service (PostgreSQL + Auth)
- **Python-dotenv** - Environment configuration
- **CORS Headers** - Cross-origin requests handling

## Next Steps

1. Configure your frontend to communicate with this backend
2. Update API endpoints in your React components
3. Implement proper error handling
4. Add authentication tokens to requests
5. Deploy both frontend and backend

## Troubleshooting

### CORS Issues
Make sure `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend URL.

### Supabase Connection Errors
Verify your `SUPABASE_URL` and `SUPABASE_KEY` are correct.

### Import Errors
Ensure virtual environment is activated and all packages are installed:
```bash
pip install -r requirements.txt
```

## Support

For issues or questions, refer to:
- [Django Documentation](https://docs.djangoproject.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)
