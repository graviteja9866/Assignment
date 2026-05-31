const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/authenticate');
const { requireManagerOrAdmin } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate, requireManagerOrAdmin);

router.get('/overdue', async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const now = new Date();

    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        assignedTasks: {
          where: {
            status: { not: 'DONE' },
            dueDate: { lt: now },
          },
          select: { id: true },
        },
      },
    });

    const overdueByUser = users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      overdueCount: u.assignedTasks.length,
    }));

    const completedTasks = await prisma.task.findMany({
      where: {
        project: { organizationId: orgId },
        status: 'DONE',
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
    });

    let avgCompletionHours = 0;
    if (completedTasks.length > 0) {
      const totalHours = completedTasks.reduce((sum, t) => {
        const ms = t.completedAt.getTime() - t.createdAt.getTime();
        return sum + ms / (1000 * 60 * 60);
      }, 0);
      avgCompletionHours = Math.round((totalHours / completedTasks.length) * 100) / 100;
    }

    res.json({
      overdueByUser,
      avgCompletionHours,
      completedTaskCount: completedTasks.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
