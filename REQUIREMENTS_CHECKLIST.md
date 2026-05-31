# SDE II Take-Home — Requirements Checklist

| Requirement | Status | Where |
|-------------|--------|-------|
| **Auth: Register** | ✅ | `POST /api/auth/register` |
| **Auth: Login** | ✅ | `POST /api/auth/login` |
| **JWT access + refresh token rotation** | ✅ | `authService.js`, `POST /api/auth/refresh` |
| **Roles: ADMIN, MANAGER, MEMBER (assigned to users)** | ✅ | Prisma `Role` enum on `User.role` |
| **ADMIN: users, projects, tasks** | ✅ | RBAC middleware + routes |
| **MANAGER: projects, tasks (no users)** | ✅ | `requireManagerOrAdmin` on projects/tasks |
| **MEMBER: assigned tasks only** | ✅ | `taskService.getTaskForUser`, list filter |
| **RBAC at middleware level** | ✅ | `middleware/rbac.js` (not in controllers) |
| **Task CRUD** | ✅ | `taskRoutes.js` |
| **Task fields (title, description, priority, status, assignee, due_date)** | ✅ | Prisma `Task` model |
| **Status transitions enforced server-side** | ✅ | `taskTransitions.js` + `POST /tasks/:id/transition` |
| **Only assignee or MANAGER advances status** | ✅ | `taskService.transitionTask` (ADMIN included as full-access) |
| **List tasks: pagination** | ✅ | `page`, `limit` query params |
| **List tasks: filter status, priority, assignee** | ✅ | Query params + Zod validation |
| **DB schema documented** | ✅ | README + `prisma/schema.prisma` |
| **Indexes: status, assignee, due_date** | ✅ | `schema.prisma` |
| **DB design decision in README** | ✅ | Organization-scoped multi-tenancy |
| **Redis cache: task list per assignee** | ✅ | `cacheService.js` |
| **Cache invalidation documented** | ✅ | README caching section |
| **Consistent error JSON** | ✅ | `AppError` + `errorHandler.js` |
| **Input validation** | ✅ | Zod schemas on all write/list endpoints |
| **Dockerfile + docker-compose** | ✅ | Root `docker-compose.yml`, service Dockerfiles |
| **docker compose up — no manual setup** | ✅ | Auto migrate + seed in `docker-start.js` |
| **Swagger/OpenAPI** | ✅ | `/api-docs` |
| **Postman collection** | ✅ | `postman/Team-Task-Tracker.postman_collection.json` |
| **Bonus: Analytics endpoint** | ✅ | `GET /api/analytics/overdue` |
| **Bonus: React task board** | ✅ | `frontend/` |
| **Bonus: Unit tests** | ✅ | `backend/tests/taskTransitions.test.js` |
| **Bonus: WebSocket/SSE** | ❌ | Not implemented (documented in README) |
| **Frontend: User management (Admin)** | ✅ | `/users` page (this update) |

## User management (API — already existed)

| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/api/users` | ADMIN |
| POST | `/api/users` | ADMIN |
| PATCH | `/api/users/:id` | ADMIN |
| DELETE | `/api/users/:id` | ADMIN |

Middleware: `router.use(authenticate, requireAdmin)` on entire `userRoutes.js`.
