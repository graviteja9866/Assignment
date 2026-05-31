const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  organizationId: true,
  createdAt: true,
};

async function listUsers(organizationId) {
  return prisma.user.findMany({
    where: { organizationId },
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

async function createUser(organizationId, { email, password, name, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { email, passwordHash, name, role, organizationId },
    select: USER_SELECT,
  });
}

async function updateUser(organizationId, userId, data) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
  });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: USER_SELECT,
  });
}

async function deleteUser(organizationId, userId, requesterId) {
  if (userId === requesterId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Cannot delete your own account');
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
  });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  await prisma.user.delete({ where: { id: userId } });
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
