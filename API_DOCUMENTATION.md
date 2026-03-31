# PRIME API Documentation

Complete REST API documentation for the PRIME Backend.

## Base URL

Development: `http://localhost:8000/api`
Production: `https://your-backend-url/api`

## Authentication

Currently using simple login (production should use JWT tokens).

### Login
```http
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "student"
}

Response (201):
{
  "id": "user-id-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "student"
}
```

### Register
```http
POST /auth/register/
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "student"
}

Response (201):
{
  "id": "user-id-uuid",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "student",
  "created_at": "2024-03-25T10:00:00Z"
}
```

## Users Endpoints

### Get All Users
```http
GET /users/

Response (200):
[
  {
    "id": "user-1",
    "email": "user1@example.com",
    "name": "User One",
    "role": "student",
    "created_at": "2024-03-25T10:00:00Z"
  },
  {
    "id": "user-2",
    "email": "user2@example.com",
    "name": "User Two",
    "role": "faculty",
    "created_at": "2024-03-25T10:05:00Z"
  }
]
```

### Get User by ID
```http
GET /users/{user_id}/

Response (200):
{
  "id": "user-1",
  "email": "user@example.com",
  "name": "User Name",
  "role": "student",
  "created_at": "2024-03-25T10:00:00Z"
}

Response (404):
{
  "error": "User not found"
}
```

## Projects Endpoints

### Get All Projects
```http
GET /projects/

Response (200):
[
  {
    "id": "proj-1",
    "title": "AI Chatbot",
    "abstract": "An intelligent chatbot...",
    "domains": ["AI", "NLP"],
    "year": "2024-25",
    "license": "MIT",
    "techStack": ["Python", "TensorFlow"],
    "status": "public",
    "owner": "John Doe",
    "ownerId": "user-1",
    "teamMembers": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "contribution": "Lead Developer"
      }
    ],
    "createdAt": "2024-03-25T10:00:00Z",
    "lastUpdated": "2024-03-25T10:00:00Z",
    "approvedFacultyIds": [],
    "approvalStatus": "pending"
  }
]
```

### Get Project by ID
```http
GET /projects/{project_id}/

Response (200):
{
  "id": "proj-1",
  "title": "AI Chatbot",
  "abstract": "An intelligent chatbot...",
  "domains": ["AI", "NLP"],
  "year": "2024-25",
  "license": "MIT",
  "techStack": ["Python", "TensorFlow"],
  "status": "public",
  "owner": "John Doe",
  "ownerId": "user-1",
  "teamMembers": [...],
  "createdAt": "2024-03-25T10:00:00Z",
  "lastUpdated": "2024-03-25T10:00:00Z",
  "approvedFacultyIds": ["faculty-1"],
  "approvalStatus": "approved"
}
```

### Create Project
```http
POST /projects/create/
Content-Type: application/json

{
  "title": "New Project",
  "abstract": "Project description",
  "domains": ["AI", "ML"],
  "year": "2024-25",
  "license": "MIT",
  "techStack": ["Python", "React"],
  "status": "public",
  "owner": "John Doe",
  "ownerId": "user-1",
  "teamMembers": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "contribution": "Lead Developer"
    }
  ]
}

Response (201):
{
  "id": "proj-new-uuid",
  "title": "New Project",
  ...
  "approvalStatus": "pending"
}
```

### Update Project
```http
PUT /projects/{project_id}/update/
Content-Type: application/json

{
  "title": "Updated Title",
  "abstract": "Updated description",
  "status": "locked",
  "approvalStatus": "approved"
}

Response (200):
{
  "id": "proj-1",
  "title": "Updated Title",
  ...
}
```

### Delete Project
```http
DELETE /projects/{project_id}/delete/

Response (200):
{
  "message": "Project deleted"
}
```

### Get Projects by Owner
```http
GET /projects/owner/{owner_id}/

Response (200):
[
  { /* project 1 */ },
  { /* project 2 */ }
]
```

### Get Project Messages
```http
GET /projects/{project_id}/messages/?userId={user_id}

Response (200):
[
  {
    "id": "msg-1",
    "projectId": "proj-1",
    "senderId": "user-1",
    "senderName": "John Doe",
    "senderEmail": "john@example.com",
    "senderRole": "student",
    "message": "Let's push the API changes today.",
    "createdAt": "2026-03-31T12:30:00Z"
  }
]
```

### Create Project Message
```http
POST /projects/{project_id}/messages/create/
Content-Type: application/json

{
  "userId": "user-1",
  "message": "I updated the repository docs."
}

Response (201):
{
  "id": "msg-new-uuid",
  "projectId": "proj-1",
  "senderId": "user-1",
  "senderName": "John Doe",
  "senderEmail": "john@example.com",
  "senderRole": "student",
  "message": "I updated the repository docs.",
  "createdAt": "2026-03-31T12:35:00Z"
}
```

## Access Requests Endpoints

### Get All Access Requests
```http
GET /access-requests/

Response (200):
[
  {
    "id": "req-1",
    "projectId": "proj-1",
    "facultyId": "faculty-1",
    "facultyName": "Dr. Smith",
    "status": "pending",
    "timestamp": "2024-03-25T10:00:00Z"
  }
]
```

### Get Access Requests for Project
```http
GET /access-requests/project/{project_id}/

Response (200):
[
  {
    "id": "req-1",
    "projectId": "proj-1",
    "facultyId": "faculty-1",
    "facultyName": "Dr. Smith",
    "status": "pending",
    "timestamp": "2024-03-25T10:00:00Z"
  }
]
```

### Create Access Request
```http
POST /access-requests/create/
Content-Type: application/json

{
  "projectId": "proj-1",
  "facultyId": "faculty-1",
  "facultyName": "Dr. Smith"
}

Response (201):
{
  "id": "req-new-uuid",
  "projectId": "proj-1",
  "facultyId": "faculty-1",
  "facultyName": "Dr. Smith",
  "status": "pending",
  "timestamp": "2024-03-25T10:00:00Z"
}
```

### Approve Access Request
```http
PUT /access-requests/{request_id}/approve/

Response (200):
{
  "message": "Request approved"
}
```

### Reject Access Request
```http
PUT /access-requests/{request_id}/reject/

Response (200):
{
  "message": "Request rejected"
}
```

## Landing Content Endpoints

### Get Landing Content
```http
GET /landing-content/

Response (200):
{
  "id": "content-1",
  "title": "Welcome to PRIME",
  "subtitle": "Centralized Academic Project Hub",
  "description": "A platform for sharing...",
  "features": [
    { "name": "Feature 1", "description": "..." },
    { "name": "Feature 2", "description": "..." }
  ]
}
```

### Update Landing Content (Admin)
```http
PUT /landing-content/update/
Content-Type: application/json

{
  "title": "New Title",
  "subtitle": "New Subtitle",
  "description": "New description",
  "features": [...]
}

Response (200):
{
  "title": "New Title",
  "subtitle": "New Subtitle",
  "description": "New description",
  "features": [...]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Email and password required"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection error"
}
```

## Request/Response Format

All requests should include:
```
Content-Type: application/json
```

All responses are in JSON format.

## Data Types

### User
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  created_at?: string;
}
```

### Project
```typescript
{
  id: string;
  title: string;
  abstract: string;
  domains: string[];
  year: string;
  license: string;
  techStack: string[];
  status: 'public' | 'locked' | 'approved';
  owner: string;
  ownerId: string;
  teamMembers: TeamMember[];
  createdAt: string;
  lastUpdated: string;
  approvedFacultyIds: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
}
```

### TeamMember
```typescript
{
  name: string;
  email: string;
  contribution: string;
}
```

### AccessRequest
```typescript
{
  id: string;
  projectId: string;
  facultyId: string;
  facultyName: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}
```

## Example Usage

### JavaScript/Fetch
```javascript
// Login
const response = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    role: 'student'
  })
});

const user = await response.json();
console.log(user);

// Get Projects
const projectsRes = await fetch('http://localhost:8000/api/projects/');
const projects = await projectsRes.json();
console.log(projects);
```

### Python/Requests
```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/api/auth/login/',
    json={
        'email': 'user@example.com',
        'password': 'password123',
        'role': 'student'
    }
)
user = response.json()
print(user)

# Get Projects
projects = requests.get('http://localhost:8000/api/projects/').json()
print(projects)
```

### cURL
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "student"
  }'

# Get Projects
curl http://localhost:8000/api/projects/
```

## Rate Limiting

Currently no rate limiting. Consider implementing:
- 100 requests per hour per IP
- 1000 requests per hour per user

## Pagination

Currently no pagination. Will return all results.
Future: Implement limit/offset pagination.

## Filtering & Searching

Currently not implemented. Future enhancements:
- Filter projects by status
- Filter by owner
- Search projects by title/abstract

## Sorting

Not yet implemented. Future: Sort by creation date, last updated, etc.

## Versioning

Current API version: v1 (implicit)
Future: Support versioned endpoints (v1/, v2/)

## CORS

Enabled for:
- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

Configure in `.env` as needed.

## Status Codes

- `200 OK` - Successful GET request
- `201 Created` - Successful POST/CREATE request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Missing/invalid parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Future Enhancements

- JWT token-based authentication
- Rate limiting
- API key support
- Webhooks
- GraphQL support
- Batch operations
- File upload endpoints
- Real-time updates (WebSocket)

## Support

For API questions, check:
- [Django REST Framework docs](https://www.django-rest-framework.org/)
- [Supabase API docs](https://supabase.com/docs/reference)
- Backend README.md
