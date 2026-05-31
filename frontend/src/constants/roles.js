/** Permission roles assigned to users — not user types themselves. */
export const ROLES = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full access: manage users, projects, and tasks',
  },
  {
    value: 'MANAGER',
    label: 'Manager',
    description: 'Manage projects and tasks; assign team members',
  },
  {
    value: 'MEMBER',
    label: 'Member',
    description: 'View and update only tasks assigned to them',
  },
];

export const ROLE_VALUES = ROLES.map((r) => r.value);

export const ROLE_BADGE = {
  ADMIN: 'bg-violet-500/20 text-violet-300 ring-violet-500/30',
  MANAGER: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  MEMBER: 'bg-slate-500/20 text-slate-300 ring-slate-500/30',
};

export function getRoleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function getRoleDescription(role) {
  return ROLES.find((r) => r.value === role)?.description ?? '';
}
