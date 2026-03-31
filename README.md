# PRIME - Centralized Academic Project Hub

A fully functional web application for managing and sharing academic projects within a university. Built with modern technologies: **React + TypeScript** (Frontend), **Django** (Backend), and **Supabase** (Database).

![PRIME Logo](https://img.shields.io/badge/PRIME-Academic%20Hub-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

### For Students
- 📝 Create and manage academic projects
- 👥 Add team members and track contributions
- 🔍 Browse public projects from other students
- 📊 View project details and documentation
- 🎓 Manage project metadata (domains, tech stack, licenses)

### For Faculty
- 📚 Access request system to view locked projects
- ✅ Approve/reject student project submissions
- 📋 Administrative dashboard
- 📝 Landing page content management
- 🏆 Project approval workflow

### For Admin
- 🛠️ Comprehensive admin dashboard
- ✔️ Project approval management
- 📢 Edit platform-wide landing content
- 👤 User management
- 📊 System monitoring

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Supabase account (free at [supabase.com](https://supabase.com))

### Installation (5 minutes)

```bash
# 1. Navigate to project
cd PRIME_CODE

# 2. Setup Backend
cd prime_backend
python -m venv venv

# Activate virtual environment
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Edit .env with your Supabase credentials
# Then run:
python manage.py runserver

# 3. In new terminal, Setup Frontend
cd ../backupprime
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
```

**Visit:** `http://localhost:5173`

## 📁 Project Structure

```
PRIME_CODE/
│
├── 📖 Documentation
│   ├── README.md (this file)
│   ├── SETUP_GUIDE.md (detailed setup instructions)
│   ├── DEPLOYMENT_GUIDE.md (production deployment)
│   ├── API_DOCUMENTATION.md (API reference)
│   └── .env.example (environment template)
│
├── backupprime/ (React Frontend)
│   ├── src/
│   │   ├── App.tsx (main component with backend integration)
│   │   ├── components/ (UI components)
│   │   ├── lib/
│   │   │   └── apiClient.ts (API integration)
│   │   ├── data/ (static data)
│   │   └── styles/ (CSS)
│   ├── vite.config.ts
│   ├── package.json
│   └── .env (API URL configuration)
│
└── prime_backend/ (Django API)
    ├── core/ (Django settings)
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── api/ (REST API)
    │   ├── views.py (endpoints)
    │   ├── urls.py (routes)
    │   └── serializers.py (data models)
    ├── manage.py
    ├── requirements.txt (Python packages)
    ├── Procfile (Heroku deployment)
    ├── .env (Supabase configuration)
    └── README.md (backend documentation)
```

## 🔌 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **React Hook Form** - Form management

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API framework
- **Python 3.11** - Programming language
- **Gunicorn** - WSGI server

### Database
- **Supabase** - PostgreSQL + Auth
- **PostgreSQL** - Relational database
- **Supabase Realtime** - Real-time features (optional)

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/login/           # User login
POST   /api/auth/register/        # User registration
```

### Projects
```
GET    /api/projects/             # Get all projects
POST   /api/projects/create/      # Create project
GET    /api/projects/{id}/        # Get project details
PUT    /api/projects/{id}/update/ # Update project
DELETE /api/projects/{id}/delete/ # Delete project
GET    /api/projects/owner/{id}/  # Get projects by owner
```

### Users
```
GET    /api/users/                # Get all users
GET    /api/users/{id}/           # Get user details
```

### Access Requests
```
GET    /api/access-requests/                    # Get all requests
POST   /api/access-requests/create/             # Create request
PUT    /api/access-requests/{id}/approve/       # Approve request
PUT    /api/access-requests/{id}/reject/        # Reject request
GET    /api/access-requests/project/{id}/       # Get project requests
```

### Landing Content
```
GET    /api/landing-content/      # Get content
PUT    /api/landing-content/update/ # Update content (admin)
```

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🔐 Environment Setup

### Backend (.env)
```env
SECRET_KEY=your-secret-key-change-this
DEBUG=True
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('student', 'faculty', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Projects Table
```sql
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
```

### Team Members Table
```sql
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contribution TEXT NOT NULL
);
```

### Access Requests Table
```sql
CREATE TABLE access_requests (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES projects(id),
  facultyId TEXT NOT NULL,
  facultyName TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected')),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Quick Deploy

#### Backend (Render - Free)
```bash
# Automatically deploys on git push
# Just set environment variables in Render dashboard
```

#### Frontend (Vercel - Free)
```bash
# Automatically deploys on git push
# Just set VITE_API_URL environment variable
```

### Full Deployment Guide
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for:
- Render + Vercel deployment
- Heroku deployment
- AWS deployment
- Docker deployment
- Production checklist
- SSL setup
- Monitoring & logging

## 🧪 Testing

### Test Login
1. Email: `teacher@university.edu`
2. Password: anything
3. Role: faculty

### Test Project Creation
1. Create a project
2. Check Supabase dashboard to verify data

### API Testing
```bash
# Get projects
curl http://localhost:8000/api/projects/

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 🐛 Troubleshooting

### CORS Error
**Issue:** "Access to XMLHttpRequest blocked"
**Solution:** 
- Check `.env` has correct URLs
- Restart Django server
- Verify frontend is on `http://localhost:5173`

### Supabase Connection Error
**Issue:** "Failed to connect to Supabase"
**Solution:**
- Verify SUPABASE_URL and SUPABASE_KEY
- Check Supabase project is active
- Create database tables (see SETUP_GUIDE.md)

### Module Not Found
**Issue:** "Import not found"
**Solution:**
- Run `pip install -r requirements.txt` (backend)
- Run `npm install` (frontend)
- Activate virtual environment

### Port Already in Use
**Issue:** "Port 8000/5173 already in use"
**Solution:**
```bash
# Backend on different port
python manage.py runserver 8001

# Frontend on different port
npm run dev -- --port 5174
```

## 📖 Documentation

1. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup for beginners
2. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment
3. **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference
4. **[prime_backend/README.md](prime_backend/README.md)** - Backend docs
5. **[backupprime/README.md](backupprime/README.md)** - Frontend docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Features to Add

- [ ] Email notifications
- [ ] Real-time updates (WebSocket)
- [ ] File uploads (project documents)
- [ ] Comments/discussions on projects
- [ ] Project ratings/reviews
- [ ] Advanced search and filtering
- [ ] Project templates
- [ ] Export project data
- [ ] Project statistics/analytics
- [ ] Newsletter subscription

## 📧 Contact

For questions or support:
- Create an GitHub issue
- Email: support@primeacademic.com
- Documentation: See docs/ folder

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Django Documentation](https://docs.djangoproject.com/)
- [Supabase](https://supabase.com)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

## 🎓 Educational Value

This project serves as a learning resource for:
- Full-stack web development
- REST API design
- Database design
- React development
- Django development
- Cloud deployment
- DevOps practices

## 📊 Status

- ✅ Backend API complete
- ✅ Frontend application complete
- ✅ Supabase integration ready
- ✅ Deployment guides ready
- ⏳ Production testing in progress

## 🔄 Roadmap

### v1.0 (Current)
- Core project management
- User authentication
- Admin dashboard
- Project approval workflow

### v1.1
- Email notifications
- Advanced search
- Project analytics

### v2.0
- Real-time collaboration
- File uploads
- Comments/discussions
- Mobile app

---

**Ready to get started?**
1. Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for step-by-step instructions
2. Follow the Quick Start section above
3. Deploy to production using [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

Happy coding! 🎉
