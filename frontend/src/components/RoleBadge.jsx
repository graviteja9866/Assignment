import { getRoleLabel, ROLE_BADGE } from '../constants/roles';

/** Shows the permission role assigned to a user (not the user's identity). */
export default function RoleBadge({ role, className = '' }) {
  if (!role) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${ROLE_BADGE[role] || ROLE_BADGE.MEMBER} ${className}`}
      title={`Assigned role: ${getRoleLabel(role)}`}
    >
      <span className="text-[10px] font-normal uppercase tracking-wide opacity-70">Role</span>
      {getRoleLabel(role)}
    </span>
  );
}
