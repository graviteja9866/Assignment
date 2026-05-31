const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Acme Corp',
    },
  });

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: { name: 'Sarah Johnson', role: 'ADMIN' },
    create: {
      email: 'admin@acme.com',
      passwordHash,
      name: 'Sarah Johnson',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const managerHash = await bcrypt.hash('Manager@123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: { name: 'Mike Thompson', role: 'MANAGER' },
    create: {
      email: 'manager@acme.com',
      passwordHash: managerHash,
      name: 'Mike Thompson',
      role: 'MANAGER',
      organizationId: org.id,
    },
  });

  const memberHash = await bcrypt.hash('Member@123', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@acme.com' },
    update: { name: 'Emily Davis', role: 'MEMBER' },
    create: {
      email: 'member@acme.com',
      passwordHash: memberHash,
      name: 'Emily Davis',
      role: 'MEMBER',
      organizationId: org.id,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Platform Redesign',
      description: 'Redesign the core platform UI',
      organizationId: org.id,
      createdById: admin.id,
    },
  });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  const dueIn7Days = new Date();
  dueIn7Days.setDate(dueIn7Days.getDate() + 7);

  const dueIn21Days = new Date();
  dueIn21Days.setDate(dueIn21Days.getDate() + 21);

  const dueIn3Days = new Date();
  dueIn3Days.setDate(dueIn3Days.getDate() + 3);

  const completedAt = new Date();
  completedAt.setDate(completedAt.getDate() - 2);

  const completedLastWeek = new Date();
  completedLastWeek.setDate(completedLastWeek.getDate() - 7);

  const seedTasks = [
    {
      id: '00000000-0000-0000-0000-000000000100',
      title: 'Design login page',
      description: 'Create wireframes for login flow',
      priority: 'HIGH',
      status: 'TODO',
      assigneeId: member.id,
      createdById: manager.id,
      dueDate: futureDate,
    },
    {
      id: '00000000-0000-0000-0000-000000000101',
      title: 'API integration',
      description: 'Connect frontend to auth API',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      assigneeId: member.id,
      createdById: manager.id,
      dueDate: futureDate,
    },
    {
      id: '00000000-0000-0000-0000-000000000102',
      title: 'Set up component library',
      description: 'Configure shared UI components and design tokens',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: manager.id,
      createdById: admin.id,
      dueDate: dueIn21Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000103',
      title: 'Write unit tests for auth',
      description: 'Cover login, refresh token, and logout flows',
      priority: 'HIGH',
      status: 'IN_REVIEW',
      assigneeId: member.id,
      createdById: manager.id,
      dueDate: dueIn7Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000104',
      title: 'Deploy staging environment',
      description: 'Ship latest build to staging for QA sign-off',
      priority: 'LOW',
      status: 'DONE',
      assigneeId: manager.id,
      createdById: admin.id,
      dueDate: futureDate,
      completedAt,
    },
    {
      id: '00000000-0000-0000-0000-000000000105',
      title: 'Fix navbar responsiveness',
      description: 'Mobile menu overlaps content on tablet breakpoints',
      priority: 'MEDIUM',
      status: 'BLOCKED',
      assigneeId: member.id,
      createdById: manager.id,
      dueDate: dueIn7Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000106',
      title: 'User onboarding flow',
      description: 'Design first-run experience for new team members',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assigneeId: admin.id,
      createdById: manager.id,
      dueDate: dueIn21Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000107',
      title: 'Performance audit',
      description: 'Profile task board load time and API response latency',
      priority: 'LOW',
      status: 'TODO',
      assigneeId: manager.id,
      createdById: admin.id,
      dueDate: dueIn21Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000108',
      title: 'Documentation update',
      description: 'Refresh README and API docs for user management',
      priority: 'LOW',
      status: 'IN_REVIEW',
      assigneeId: admin.id,
      createdById: manager.id,
      dueDate: futureDate,
    },
    {
      id: '00000000-0000-0000-0000-000000000109',
      title: 'Migrate legacy task data',
      description: 'Import historical tasks from the old spreadsheet tracker',
      priority: 'HIGH',
      status: 'DONE',
      assigneeId: admin.id,
      createdById: admin.id,
      dueDate: dueIn7Days,
      completedAt,
    },
    {
      id: '00000000-0000-0000-0000-000000000110',
      title: 'Implement dark mode toggle',
      description: 'Add theme switcher with persisted user preference',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: member.id,
      createdById: admin.id,
      dueDate: dueIn21Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000111',
      title: 'Set up CI pipeline',
      description: 'Automate lint, test, and Docker build on every push',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assigneeId: manager.id,
      createdById: admin.id,
      dueDate: dueIn7Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000112',
      title: 'Review accessibility checklist',
      description: 'Verify keyboard navigation and screen reader labels',
      priority: 'MEDIUM',
      status: 'IN_REVIEW',
      assigneeId: member.id,
      createdById: admin.id,
      dueDate: dueIn3Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000113',
      title: 'Configure error monitoring',
      description: 'Wire up alerts for API 5xx errors and failed logins',
      priority: 'HIGH',
      status: 'DONE',
      assigneeId: admin.id,
      createdById: manager.id,
      dueDate: futureDate,
      completedAt: completedLastWeek,
    },
    {
      id: '00000000-0000-0000-0000-000000000114',
      title: 'Resolve database migration conflict',
      description: 'Waiting on DBA approval for schema change in production',
      priority: 'HIGH',
      status: 'BLOCKED',
      assigneeId: manager.id,
      createdById: admin.id,
      dueDate: dueIn3Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000115',
      title: 'Build task filter UI',
      description: 'Add assignee and project filters to the task board',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: member.id,
      createdById: manager.id,
      dueDate: futureDate,
    },
    {
      id: '00000000-0000-0000-0000-000000000116',
      title: 'Integrate email notifications',
      description: 'Send alerts when tasks are assigned or status changes',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assigneeId: admin.id,
      createdById: manager.id,
      dueDate: dueIn21Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000117',
      title: 'Security penetration test',
      description: 'Run OWASP scan against auth and user management endpoints',
      priority: 'HIGH',
      status: 'IN_REVIEW',
      assigneeId: manager.id,
      createdById: admin.id,
      dueDate: dueIn7Days,
    },
    {
      id: '00000000-0000-0000-0000-000000000118',
      title: 'Archive completed sprint',
      description: 'Move finished tasks to sprint archive and update metrics',
      priority: 'LOW',
      status: 'DONE',
      assigneeId: member.id,
      createdById: manager.id,
      dueDate: dueIn7Days,
      completedAt,
    },
    {
      id: '00000000-0000-0000-0000-000000000119',
      title: 'Update dependency versions',
      description: 'Bump React, Vite, and Prisma to latest stable releases',
      priority: 'LOW',
      status: 'TODO',
      assigneeId: admin.id,
      createdById: admin.id,
      dueDate: dueIn21Days,
    },
  ];

  for (const task of seedTasks) {
    const { id, ...data } = task;
    await prisma.task.upsert({
      where: { id },
      update: {},
      create: { id, projectId: project.id, ...data },
    });
  }

  console.log('Seed completed (users with assigned roles):');
  console.log('  Sarah Johnson  admin@acme.com   / Admin@123   [role: ADMIN]');
  console.log('  Mike Thompson  manager@acme.com / Manager@123 [role: MANAGER]');
  console.log('  Emily Davis    member@acme.com  / Member@123  [role: MEMBER]');
  console.log(`  ${seedTasks.length} sample tasks seeded across all board columns.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
