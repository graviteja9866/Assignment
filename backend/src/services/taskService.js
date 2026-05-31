const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { canTransition } = require('../utils/taskTransitions');
const {
  taskListCacheKey,
  getCachedTaskList,
  setCachedTaskList,
  invalidateTaskCaches,
  hashQuery,
} = require('./cacheService');

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

function validateDueDate(dueDate) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dueDate must be a valid date');
  }
  if (date <= new Date()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'dueDate must be a future date');
  }
  return date;
}

async function verifyAssigneeInOrg(organizationId, assigneeId) {
  if (!assigneeId) return;
  const assignee = await prisma.user.findFirst({
    where: { id: assigneeId, organizationId },
  });
  if (!assignee) {
    throw new AppError(400, 'VALIDATION_ERROR', 'assignee must be a user in your organization');
  }
}

async function verifyProjectInOrg(organizationId, projectId) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  });
  if (!project) {
    throw new AppError(400, 'VALIDATION_ERROR', 'projectId must belong to your organization');
  }
  return project;
}

async function getTaskForUser(organizationId, taskId, user) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { organizationId },
    },
    include: TASK_INCLUDE,
  });

  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }

  if (user.role === 'MEMBER' && task.assigneeId !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'Members can only access tasks assigned to them');
  }

  return task;
}

async function listTasks(organizationId, user, query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const { status, priority, assignee, projectId } = query;

  if (user.role === 'MEMBER') {
    if (assignee && assignee !== user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Members can only list their own assigned tasks');
    }
  }

  const effectiveAssignee = user.role === 'MEMBER' ? user.id : assignee;

  if (effectiveAssignee) {
    const queryHash = hashQuery({ ...query, assignee: effectiveAssignee });
    const cacheKey = taskListCacheKey(organizationId, effectiveAssignee, queryHash);
    const cached = await getCachedTaskList(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  const where = {
    project: { organizationId },
    ...(status && { status }),
    ...(priority && { priority }),
    ...(effectiveAssignee && { assigneeId: effectiveAssignee }),
    ...(projectId && { projectId }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  const result = {
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    cached: false,
  };

  if (effectiveAssignee) {
    const queryHash = hashQuery({ ...query, assignee: effectiveAssignee });
    const cacheKey = taskListCacheKey(organizationId, effectiveAssignee, queryHash);
    await setCachedTaskList(cacheKey, result);
  }

  return result;
}

async function getTask(organizationId, taskId, user) {
  return getTaskForUser(organizationId, taskId, user);
}

async function createTask(organizationId, createdBy, data) {
  await verifyProjectInOrg(organizationId, data.projectId);
  if (data.assigneeId) {
    await verifyAssigneeInOrg(organizationId, data.assigneeId);
  }

  const dueDate = data.dueDate ? validateDueDate(data.dueDate) : null;

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      projectId: data.projectId,
      assigneeId: data.assigneeId || null,
      dueDate,
      createdById: createdBy.id,
    },
    include: TASK_INCLUDE,
  });

  await invalidateTaskCaches(organizationId, null, task.assigneeId);
  return task;
}

async function updateTask(organizationId, taskId, user, data) {
  const task = await getTaskForUser(organizationId, taskId, user);

  if (user.role === 'MEMBER') {
    const allowedFields = ['title', 'description'];
    const hasDisallowed = Object.keys(data).some((k) => !allowedFields.includes(k));
    if (hasDisallowed) {
      throw new AppError(403, 'FORBIDDEN', 'Members can only update title and description');
    }
  }

  if (data.assigneeId !== undefined && user.role === 'MEMBER') {
    throw new AppError(403, 'FORBIDDEN', 'Members cannot change assignee');
  }

  if (data.assigneeId) {
    await verifyAssigneeInOrg(organizationId, data.assigneeId);
  }

  let dueDate = task.dueDate;
  if (data.dueDate !== undefined) {
    dueDate = data.dueDate ? validateDueDate(data.dueDate) : null;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title ?? task.title,
      description: data.description !== undefined ? data.description : task.description,
      priority: data.priority ?? task.priority,
      assigneeId: data.assigneeId !== undefined ? data.assigneeId : task.assigneeId,
      dueDate,
    },
    include: TASK_INCLUDE,
  });

  await invalidateTaskCaches(organizationId, task.assigneeId, updated.assigneeId);
  return updated;
}

async function transitionTask(organizationId, taskId, user, newStatus) {
  const task = await getTaskForUser(organizationId, taskId, user);

  const isAssignee = task.assigneeId === user.id;
  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN';

  if (!isAssignee && !isManager) {
    throw new AppError(403, 'FORBIDDEN', 'Only the assignee or a manager can advance task status');
  }

  if (!canTransition(task.status, newStatus)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Invalid status transition from ${task.status} to ${newStatus}`
    );
  }

  const updateData = { status: newStatus };
  if (newStatus === 'DONE') {
    updateData.completedAt = new Date();
  } else if (task.status === 'DONE') {
    updateData.completedAt = null;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: TASK_INCLUDE,
  });

  await invalidateTaskCaches(organizationId, task.assigneeId, task.assigneeId);
  return updated;
}

async function deleteTask(organizationId, taskId, user) {
  const task = await getTaskForUser(organizationId, taskId, user);

  if (user.role === 'MEMBER') {
    throw new AppError(403, 'FORBIDDEN', 'Members cannot delete tasks');
  }

  await prisma.task.delete({ where: { id: taskId } });
  await invalidateTaskCaches(organizationId, task.assigneeId, null);
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  transitionTask,
  deleteTask,
};
