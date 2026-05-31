const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.params !== undefined) {
        req.validatedParams = parsed.params;
      }

      // Express 5: req.query is read-only, so store coerced values separately
      if (parsed.query !== undefined) {
        req.validatedQuery = parsed.query;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email('email must be a valid email address');

const registerSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(8, 'password must be at least 8 characters'),
    name: z.string().min(1, 'name is required'),
    organizationName: z.string().min(1, 'organizationName is required'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1, 'password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  }),
});

const createUserSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(8, 'password must be at least 8 characters'),
    name: z.string().min(1, 'name is required'),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'], {
      errorMap: () => ({ message: 'assigned role must be ADMIN, MANAGER, or MEMBER' }),
    }),
  }),
});

const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('id must be a valid UUID'),
  }),
});

const updateUserSchema = z.object({
  params: userIdParamSchema.shape.params,
  body: z.object({
    name: z.string().min(1).optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional(),
    password: z.string().min(8).optional(),
  }),
});

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
  }),
});

const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('id must be a valid UUID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'title is required'),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    projectId: z.string().uuid('projectId must be a valid UUID'),
    assigneeId: z.string().uuid('assigneeId must be a valid UUID').optional().nullable(),
    dueDate: z.string().datetime({ message: 'dueDate must be an ISO 8601 datetime' }).optional().nullable(),
  }),
});

const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('id must be a valid UUID'),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
  }),
});

const transitionTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('id must be a valid UUID'),
  }),
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'], {
      errorMap: () => ({ message: 'status must be a valid task status' }),
    }),
  }),
});

const listTasksSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    assignee: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
  }),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  refreshSchema,
  createUserSchema,
  userIdParamSchema,
  updateUserSchema,
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  transitionTaskSchema,
  listTasksSchema,
};
