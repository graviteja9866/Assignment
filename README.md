# Team Task Tracker

A full-stack team task management application with JWT authentication, role-based access control (RBAC), Redis caching, and Dockerized deployment.

## Quick Start

```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| API      | http://localhost:3000        |
| Swagger  | http://localhost:3000/api-docs |
| Health   | http://localhost:3000/health |

### Demo users (seeded automatically)

Each row is a **user** (person). **Role** is the permission level assigned to that user.

| User           | Email              | Password    | Assigned role |
|----------------|--------------------|-------------|---------------|
| Sarah Johnson  | admin@acme.com     | Admin@123   | ADMIN (Administrator) |
| Mike Thompson  | manager@acme.com   | Manager@123 | MANAGER |
| Emily Davis    | member@acme.com    | Member@123  | MEMBER |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React     │────▶│  Express    │────▶│  PostgreSQL  │
│  Frontend   │     │  API        │     │              │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    └─────────────┘
```

## Database Schema

```
Organization 1──* User
Organization 1──* Project
Project      1──* Task
User         1──* Task (assignee)
User         1──* RefreshToken
```

### Entities

- **Organization** — tenant boundary; all users and projects belong to one org
- **User** — a person on the team (name, email, password). Each user has one **role** assigned.
- **Role** (enum) — permission level: `ADMIN` | `MANAGER` | `MEMBER` (not a separate “user type”)
- **Project** — grouped work within an organization
- **Task** — title, description, priority, status, assignee, due_date, project
- **RefreshToken** — hashed refresh tokens for rotation

### Indexes

| Table | Index        | Reason                                      |
|-------|--------------|---------------------------------------------|
| tasks | status       | Filter tasks by status on list endpoint     |
| tasks | assignee_id  | Filter/cache task lists per assignee        |
| tasks | due_date     | Overdue analytics queries                   |
| tasks | project_id   | Project-scoped task lookups                 |

### Design Decision: Organization-Scoped Multi-Tenancy

All queries are scoped by `organization_id` (via project or user relation) rather than using a shared global task table. This ensures RBAC checks are naturally bounded — a user can never access another organization's data even if IDs are guessed. The tradeoff is slightly more complex joins, but it eliminates an entire class of cross-tenant data leaks.

## RBAC

Enforced at **middleware level** (`src/middleware/rbac.js`), not in controllers.

| Role    | Permissions                                              |
|---------|----------------------------------------------------------|
| ADMIN   | Full access: users, projects, tasks                    |
| MANAGER | Projects + tasks; assign members; no user management   |
| MEMBER  | View/update only tasks assigned to them                  |

## Task Status Transitions

```
TODO → IN_PROGRESS → IN_REVIEW → DONE
  ↘ BLOCKED (from TODO, IN_PROGRESS, IN_REVIEW)
  BLOCKED → TODO | IN_PROGRESS | IN_REVIEW
```

Only the **assignee** or a **MANAGER/ADMIN** can transition status.

## Caching Strategy

### What is cached

Task list responses are cached in Redis when filtered by **assignee**:

```
Key: tasks:list:org:{orgId}:assignee:{assigneeId}:{queryHash}
TTL: 300 seconds (configurable via CACHE_TASK_LIST_TTL)
```

The query hash includes page, limit, status, priority, and assignee filters so different filter combinations get separate cache entries.

### Invalidation

Cache is invalidated on **write operations** (create, update, transition, delete):

1. **Assignee change** — invalidate both old and new assignee cache keys
2. **Any task mutation** — invalidate all list caches for the organization (`tasks:list:org:{orgId}:*`)

This write-through invalidation ensures members always see fresh data after task changes while still benefiting from cache on repeated reads.

## User management (Admin role required)

**Users** are people on the team. **Roles** (ADMIN / MANAGER / MEMBER) are assigned to users and control permissions.

**Backend API** — full CRUD at `/api/users` (only users with the **Administrator** role).

**Frontend UI** — sign in as Sarah Johnson (`admin@acme.com`), then open **Team Users** in the nav (`/users`).

| Method | Path              | Description        |
|--------|-------------------|--------------------|
| GET    | `/api/users`      | List org users     |
| POST   | `/api/users`      | Create user        |
| PATCH  | `/api/users/:id`  | Update name/role/password |
| DELETE | `/api/users/:id`  | Delete user        |

See [REQUIREMENTS_CHECKLIST.md](./REQUIREMENTS_CHECKLIST.md) for full assignment coverage.

## API Endpoints

| Method | Path                      | Auth     | Role           |
|--------|---------------------------|----------|----------------|
| POST   | /api/auth/register        | No       | —              |
| POST   | /api/auth/login           | No       | —              |
| POST   | /api/auth/refresh         | No       | —              |
| GET    | /api/me                   | Yes      | Any            |
| GET    | /api/users                | Yes      | ADMIN          |
| POST   | /api/users                | Yes      | ADMIN          |
| PATCH  | /api/users/:id            | Yes      | ADMIN          |
| DELETE | /api/users/:id            | Yes      | ADMIN          |
| GET    | /api/projects             | Yes      | Any            |
| POST   | /api/projects             | Yes      | MANAGER+       |
| GET    | /api/tasks                | Yes      | Any            |
| POST   | /api/tasks                | Yes      | MANAGER+       |
| POST   | /api/tasks/:id/transition | Yes      | Assignee/MGR+  |
| GET    | /api/analytics/overdue    | Yes      | MANAGER+       |

Full OpenAPI spec: http://localhost:3000/api-docs

Postman collection: [postman/Team-Task-Tracker.postman_collection.json](./postman/Team-Task-Tracker.postman_collection.json)

## Error Format

All errors follow a consistent structure:

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "due_date must be a future date"
}
```

## Local Development (without Docker)

```bash
# Start Postgres and Redis locally, then:
cp .env.example backend/.env

cd backend
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev

cd ../frontend
npm install
npm run dev
```

## What I Would Improve With More Time

1. **WebSocket notifications** — push real-time updates when assigned task status changes
2. **Integration test suite** — auth flow + RBAC + status transitions with testcontainers
3. **Rate limiting** — protect auth endpoints from brute force
4. **Audit log** — track who changed task status and when
5. **Pagination cursor** — replace offset pagination for large datasets
6. **Redis SCAN instead of KEYS** — safer cache invalidation at scale

## Tech Stack

- **Backend:** Node.js, Express, Prisma, PostgreSQL, Redis, JWT, Zod
- **Frontend:** React, Vite
- **Infrastructure:** Docker, Docker Compose, Nginx
