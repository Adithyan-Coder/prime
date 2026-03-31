# 📊 PRIME Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     End User Browser                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         React Frontend (Vite)                            │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Pages:                                         │    │   │
│  │  │  - Landing Page                                 │    │   │
│  │  │  - Login/Register                               │    │   │
│  │  │  - Dashboard                                    │    │   │
│  │  │  - Project Details                              │    │   │
│  │  │  - Project Creation                             │    │   │
│  │  │  - User Profile                                 │    │   │
│  │  │  - Settings                                     │    │   │
│  │  │  - Admin Dashboard                              │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  API Client (apiClient.ts)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ⬇️                                       │
│                    HTTP/REST API                                 │
│                    CORS Enabled                                  │
└─────────────────────────────────────────────────────────────────┘
                             ⬇️ ⬇️ ⬇️
┌─────────────────────────────────────────────────────────────────┐
│                    Django REST API                               │
│                   (Backend Server)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Core Functionality:                                     │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Authentication Endpoints                        │    │   │
│  │  │  - POST   /auth/login/                          │    │   │
│  │  │  - POST   /auth/register/                       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ User Management                                 │    │   │
│  │  │  - GET    /users/                               │    │   │
│  │  │  - GET    /users/{id}/                          │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Project Management                              │    │   │
│  │  │  - GET    /projects/                            │    │   │
│  │  │  - POST   /projects/create/                     │    │   │
│  │  │  - GET    /projects/{id}/                       │    │   │
│  │  │  - PUT    /projects/{id}/update/                │    │   │
│  │  │  - DELETE /projects/{id}/delete/                │    │   │
│  │  │  - GET    /projects/owner/{id}/                 │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Access Control                                  │    │   │
│  │  │  - GET    /access-requests/                     │    │   │
│  │  │  - POST   /access-requests/create/              │    │   │
│  │  │  - PUT    /access-requests/{id}/approve/        │    │   │
│  │  │  - PUT    /access-requests/{id}/reject/         │    │   │
│  │  │  - GET    /access-requests/project/{id}/        │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Admin Features                                  │    │   │
│  │  │  - GET    /landing-content/                     │    │   │
│  │  │  - PUT    /landing-content/update/              │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ⬇️                                       │
│                   Database Layer                                 │
└─────────────────────────────────────────────────────────────────┘
                             ⬇️ ⬇️ ⬇️
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tables:                                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ users        │  │ projects     │  │ team_members │   │   │
│  │  │──────────────│  │──────────────│  │──────────────│   │   │
│  │  │ id           │  │ id           │  │ id           │   │   │
│  │  │ email        │  │ title        │  │ project_id   │   │   │
│  │  │ name         │  │ abstract     │  │ name         │   │   │
│  │  │ role         │  │ domains      │  │ email        │   │   │
│  │  │ created_at   │  │ year         │  │ contribution │   │   │
│  │  │              │  │ license      │  │              │   │   │
│  │  │              │  │ techStack    │  │              │   │   │
│  │  │              │  │ status       │  │              │   │   │
│  │  │              │  │ owner        │  │              │   │   │
│  │  │              │  │ ownerId      │  │              │   │   │
│  │  │              │  │ createdAt    │  │              │   │   │
│  │  │              │  │ lastUpdated  │  │              │   │   │
│  │  │              │  │ approvedIds  │  │              │   │   │
│  │  │              │  │ approvalStat │  │              │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐             │   │
│  │  │ access_requests  │  │ landing_content  │             │   │
│  │  │──────────────────│  │──────────────────│             │   │
│  │  │ id               │  │ id               │             │   │
│  │  │ projectId        │  │ title            │             │   │
│  │  │ facultyId        │  │ subtitle         │             │   │
│  │  │ facultyName      │  │ description      │             │   │
│  │  │ status           │  │ features         │             │   │
│  │  │ timestamp        │  │                  │             │   │
│  │  └──────────────────┘  └──────────────────┘             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. User Login Flow
```
Frontend                          Backend                      Database
  │                                 │                            │
  ├─► POST /auth/login/ ────────────►│                            │
  │   {email, password, role}        │                            │
  │                                  ├─► Query users table ──────►│
  │                                  │                            │
  │                                  │◄─ User record (or new) ◄───│
  │                                  │                            │
  │◄─── User object ◄────────────────┤                            │
  │   {id, email, name, role}        │                            │
  │                                  │                            │
```

### 2. Create Project Flow
```
Frontend                          Backend                      Database
  │                                 │                            │
  ├─► POST /projects/create/ ──────►│                            │
  │   {project data}                │                            │
  │                                 ├─► Insert project ─────────►│
  │                                 │                            │
  │                                 ├─► Insert team members ────►│
  │                                 │                            │
  │◄─── Project object ◄────────────┤                            │
  │                                  │                            │
```

### 3. Access Request Flow
```
Student Frontend                 Backend                      Database
  │                                 │                            │
  ├─► POST /access-requests/ ──────►│                            │
  │   {projectId, facultyId}        │                            │
  │                                 ├─► Insert request ─────────►│
  │                                 │   status: "pending"        │
  │◄─── Request created ◄───────────┤                            │
  │                                 │                            │
         ⬆️ ⬆️ ⬆️ APPROVAL PROCESS ⬆️ ⬆️ ⬆️
  │                                 │                            │
Faculty Frontend                     │                            │
  │                                 │                            │
  ├─► PUT /access-requests/{id}/approve/ ──►│                    │
  │                                 │                            │
  │                                 ├─► Update request ────────►│
  │                                 │   status: "approved"      │
  │                                 │                            │
  │                                 ├─► Add faculty to ────────►│
  │                                 │   approvedFacultyIds      │
  │◄─── Approval confirmed ◄────────┤                            │
  │                                  │                            │
```

---

## User Roles & Permissions

```
┌─────────────────────────────────────────────────────────┐
│                    User Roles                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  👨‍🎓 STUDENT                                              │
│  ├─ Can create projects                                 │
│  ├─ Can edit own projects                               │
│  ├─ Can add team members                                │
│  ├─ Can view public projects                            │
│  ├─ Can request access to locked projects               │
│  └─ Projects appear as "pending" until admin approval   │
│                                                          │
│  👨‍🏫 FACULTY                                              │
│  ├─ Can view all projects                               │
│  ├─ Can request access to locked projects               │
│  ├─ Can approve/reject access requests                  │
│  ├─ Own projects section in dashboard                   │
│  └─ Can see access request status                       │
│                                                          │
│  🔐 ADMIN                                                │
│  ├─ Can view all projects                               │
│  ├─ Can approve/reject project submissions              │
│  ├─ Can edit landing page content                       │
│  ├─ Can manage users                                    │
│  ├─ Can view all access requests                        │
│  └─ Full system control                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Project Status & Workflow

```
┌─────────────────────────────────────────────────────────┐
│              Project Status Workflow                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CREATION                                               │
│  Student creates project                                │
│         ⬇️                                                │
│  PROJECT STATUS: "public" or "locked"                   │
│  APPROVAL STATUS: "pending"                             │
│         ⬇️                                                │
│  ADMIN REVIEW                                           │
│  Admin approves or rejects project                      │
│         ⬇️                                                │
│  ✅ APPROVED          or          ❌ REJECTED            │
│  - Public for all                 - Not visible        │
│  - Faculty can request access     - Student can edit   │
│  - Locked: only approved faculty  - Resubmit option   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Access Control Workflow

```
┌─────────────────────────────────────────────────────────┐
│           Access Request Workflow                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1️⃣  FACULTY REQUESTS ACCESS                             │
│      Faculty views locked project                       │
│      Clicks "Request Access"                            │
│             ⬇️                                            │
│                                                          │
│  2️⃣  REQUEST CREATED                                     │
│      Status: "pending"                                  │
│      Stored in database                                 │
│             ⬇️                                            │
│                                                          │
│  3️⃣  STUDENT NOTIFIED (future: email)                   │
│      Can see pending requests                           │
│             ⬇️                                            │
│                                                          │
│  4️⃣  STUDENT APPROVES/REJECTS                            │
│      Clicks approve or reject button                    │
│             ⬇️                                            │
│                                                          │
│  5️⃣  APPROVED ✅              or          REJECTED ❌   │
│      Faculty added to                  Faculty removed │
│      "approvedFacultyIds"             from list        │
│      Can now access project           Cannot access    │
│      (if locked)                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## File Upload & Data Flow

```
Frontend                    API Server                  Supabase
  │                              │                         │
  ├─ User fills form             │                         │
  │  - Project details           │                         │
  │  - Team members              │                         │
  │  - Tech stack                │                         │
  │                              │                         │
  ├─ Validates input             │                         │
  │  - Check required fields     │                         │
  │  - Validate formats          │                         │
  │                              │                         │
  ├─ Submits POST request ───────►│                         │
  │  {project_data}              │                         │
  │                              ├─ Validate data         │
  │                              │                         │
  │                              ├─ Generate UUIDs        │
  │                              │                         │
  │                              ├─ Insert project ──────►│
  │                              │                         │
  │                              ├─ Insert team ────────►│
  │                              │  members (1-n)         │
  │                              │                         │
  │◄─ Success response ◄──────────┤                         │
  │  {id, status: created}       │                         │
  │                              │                         │
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Production Environment                     │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │   Vercel/Netlify │         │  Render/Heroku   │           │
│  │   (Frontend)     │         │  (Backend)       │           │
│  │                  │         │                  │           │
│  │  React Build     │         │  Django App      │           │
│  │  Static Files    │         │  Gunicorn        │           │
│  │  CDN             │         │  Environment     │           │
│  │  https://...     │         │  https://...api  │           │
│  └────────┬─────────┘         └────────┬─────────┘           │
│           │                            │                      │
│           └────────────────┬───────────┘                      │
│                            │                                  │
│                    HTTPS/REST API                             │
│                            │                                  │
│                            ⬇️                                  │
│              ┌──────────────────────┐                         │
│              │  Supabase Cloud      │                         │
│              │  (Database)          │                         │
│              │                      │                         │
│              │  PostgreSQL          │                         │
│              │  Backups             │                         │
│              │  SSL Encryption      │                         │
│              │  Row-Level Security  │                         │
│              └──────────────────────┘                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────┐
│         Frontend Stack                          │
├─────────────────────────────────────────────────┤
│ React 18          - UI Library                  │
│ TypeScript        - Type Safety                 │
│ Vite              - Build Tool                  │
│ Tailwind CSS      - Styling                     │
│ Radix UI          - Components                  │
│ React Hook Form   - Form Management             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         Backend Stack                           │
├─────────────────────────────────────────────────┤
│ Django 4.2        - Web Framework               │
│ DRF               - REST API Framework          │
│ Python 3.11       - Language                    │
│ Gunicorn          - WSGI Server                 │
│ python-dotenv     - Configuration               │
│ Supabase SDK      - Database Access             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         Database Stack                          │
├─────────────────────────────────────────────────┤
│ PostgreSQL        - Relational DB               │
│ Supabase          - Database as a Service       │
│ Row-Level Security- Data Protection             │
│ Automated Backups - Data Recovery               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         DevOps Stack                            │
├─────────────────────────────────────────────────┤
│ Docker            - Containerization            │
│ Docker Compose    - Orchestration               │
│ Git               - Version Control             │
│ GitHub            - Repository Hosting          │
│ Render/Vercel     - Deployment Platforms        │
└─────────────────────────────────────────────────┘
```

---

## Request/Response Flow Example

### Login Request
```
REQUEST:
POST /api/auth/login/
Content-Type: application/json

{
  "email": "teacher@university.edu",
  "password": "password123",
  "role": "faculty"
}

RESPONSE (201):
{
  "id": "f8c6d2a3-9e4b-4c5d-8f1a-2b3c4d5e6f7g",
  "email": "teacher@university.edu",
  "name": "Dr. Smith",
  "role": "faculty"
}
```

### Create Project Request
```
REQUEST:
POST /api/projects/create/
Content-Type: application/json

{
  "title": "AI Chatbot System",
  "abstract": "A chatbot for student support",
  "domains": ["AI", "NLP"],
  "year": "2024-25",
  "license": "MIT",
  "techStack": ["Python", "TensorFlow", "React"],
  "status": "public",
  "owner": "John Doe",
  "ownerId": "user-123",
  "teamMembers": [
    {
      "name": "John Doe",
      "email": "john@university.edu",
      "contribution": "Lead Developer"
    }
  ]
}

RESPONSE (201):
{
  "id": "proj-uuid-123",
  "title": "AI Chatbot System",
  ...
  "approvalStatus": "pending",
  "createdAt": "2024-03-25T10:00:00Z"
}
```

---

## Summary

This architecture provides:
- ✅ Scalable backend API
- ✅ Modern frontend framework
- ✅ Reliable database
- ✅ Clear separation of concerns
- ✅ Easy deployment
- ✅ Secure data handling
- ✅ Real-time capable
- ✅ Production ready

---

**Last Updated**: March 25, 2026
**Status**: ✅ Complete & Ready
**Version**: 1.0
