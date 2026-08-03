import { Table } from '../../../components/ui/Table';
import type { TableColumn } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import type { BadgeVariant } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { HasPermission } from '../../../components/auth/HasPermission';
import { ROLE_DEFINITIONS } from '../../../constants/rbac.constants';
import type { OrganizationMember, OrgMemberRole } from '../../../types/organization';

const roleVariants: Record<OrgMemberRole, BadgeVariant> = {
  super_admin: 'danger',
  org_admin: 'accent',
  manager: 'warning',
  analyst: 'neutral',
  employee: 'neutral',
};

interface MemberTableProps {
  members: OrganizationMember[];
  onRoleChange?: (memberId: string, role: OrgMemberRole) => void;
  onRemove?: (memberId: string) => void;
}

export function MemberTable({ members, onRoleChange, onRemove }: MemberTableProps) {
  const columns: TableColumn<OrganizationMember>[] = [
    {
      key: 'fullName',
      header: 'Member',
      sortable: true,
      render: (member) => (
        <div className="flex items-center gap-3">
          <Avatar name={member.fullName} src={member.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-text-primary">{member.fullName}</p>
            <p className="text-xs text-text-secondary">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job Title',
      render: (member) => <span className="text-xs text-text-secondary">{member.jobTitle || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (member) => {
        const roleInfo = ROLE_DEFINITIONS[member.role];
        return (
          <HasPermission
            permission="org:members:change_role"
            fallback={<Badge variant={roleVariants[member.role]}>{roleInfo?.label || member.role}</Badge>}
          >
            <select
              value={member.role}
              onChange={(e) => onRoleChange?.(member.id, e.target.value as OrgMemberRole)}
              className="rounded-md border border-border bg-bg-base px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              {Object.values(ROLE_DEFINITIONS).map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </HasPermission>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (member) => (
        <Badge variant={member.status === 'active' ? 'success' : 'warning'}>{member.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (member) => (
        <HasPermission permission="org:members:remove">
          <button
            type="button"
            onClick={() => onRemove?.(member.id)}
            className="text-xs font-medium text-danger hover:underline"
          >
            Remove
          </button>
        </HasPermission>
      ),
    },
  ];

  return <Table columns={columns} data={members} keyExtractor={(member) => member.id} />;
}
