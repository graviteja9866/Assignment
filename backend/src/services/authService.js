const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/tokens');

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  organizationId: true,
  createdAt: true,
};

async function register({ email, password, name, organizationName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: organizationName },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'ADMIN',
        organizationId: organization.id,
      },
      select: USER_SELECT,
    });

    return { user, organization };
  });

  const tokens = await issueTokens(result.user);
  return { user: result.user, organization: result.organization, ...tokens };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: USER_SELECT,
  });

  const tokens = await issueTokens(safeUser);
  return { user: safeUser, ...tokens };
}

async function issueTokens(user) {
  const payload = { sub: user.id, role: user.role, org: user.organizationId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id, type: 'refresh' });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: USER_SELECT } },
  });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token revoked or expired');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  const tokens = await issueTokens(stored.user);
  return { user: stored.user, ...tokens };
}

async function logout(refreshToken) {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revoked: false },
    data: { revoked: true },
  });
}

module.exports = { register, login, refresh, logout };
