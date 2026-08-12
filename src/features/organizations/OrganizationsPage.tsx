import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../hooks/useToast';
import { useOrganization } from '../../hooks/useOrganization';
import { organizationService } from '../../services/organization.service';
import type { OrganizationMember, OrgMemberRole } from '../../types/organization';

const roleVariant: Record<string, BadgeVariant> = {
  owner: 'accent',
  org_admin: 'accent',
  admin: 'neutral',
  member: 'neutral',
};

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' },
];

const columns: TableColumn<OrganizationMember>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  {
    key: 'role',
    header: 'Role',
    render: (member) => <Badge variant={roleVariant[member.role] || 'neutral'}>{member.role}</Badge>,
  },
];

export function OrganizationsPage() {
  const { activeOrganization } = useOrganization();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgMemberRole>('employee');
  const { showToast } = useToast();

  const { data: membersRes, refetch } = useQuery({
    queryKey: ['organization', 'members', activeOrganization?.id],
    queryFn: () => organizationService.getMembers(activeOrganization?.id || ''),
    enabled: Boolean(activeOrganization?.id),
  });

  const members = membersRes?.success ? membersRes.data : [];

  async function handleInvite() {
    if (!activeOrganization || !email.trim()) return;
    try {
      await organizationService.inviteMember(activeOrganization.id, email.trim(), role);
      setInviteOpen(false);
      setEmail('');
      showToast({ title: 'Invitation sent', variant: 'success' });
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invite';
      showToast({ title: msg, variant: 'danger' });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Organizations"
        description="Manage members and their access levels."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} aria-hidden="true" />
            Invite member
          </Button>
        }
      />

      <Table columns={columns} data={members} keyExtractor={(member) => member.id} />

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a member"
        description="They'll receive an email invitation to join your organization."
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>Send invite</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as OrgMemberRole)}
          />
        </div>
      </Modal>
    </div>
  );
}
