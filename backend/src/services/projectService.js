const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');

async function listProjects(organizationId) {
  return prisma.project.findMany({
    where: { organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getProject(organizationId, projectId) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }
  return project;
}

async function createProject(organizationId, createdById, { name, description }) {
  return prisma.project.create({
    data: { name, description, organizationId, createdById },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

async function updateProject(organizationId, projectId, data) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  });
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      name: data.name ?? project.name,
      description: data.description !== undefined ? data.description : project.description,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

async function deleteProject(organizationId, projectId) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  });
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  await prisma.project.delete({ where: { id: projectId } });
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
