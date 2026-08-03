import { useState } from 'react';
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
import { organizationMembers } from '../../mocks/organizations.mock';
import type { OrganizationMember, MemberRole } from '../../mocks/organizations.mock';

const roleVariant: Record<MemberRole, BadgeVariant> = {
  owner: 'accent',
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
    render: (member) => <Badge variant={roleVariant[member.role]}>{member.role}</Badge>,
  },
  { key: 'joinedLabel', header: 'Joined' },
];

export function OrganizationsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { showToast } = useToast();

  function handleInvite() {
    setInviteOpen(false);
    showToast({ title: 'Invitation sent', variant: 'success' });
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

      <Table columns={columns} data={organizationMembers} keyExtractor={(member) => member.id} />

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
          <Input label="Email address" type="email" placeholder="colleague@company.com" required />
          <Select label="Role" options={roleOptions} defaultValue="member" />
        </div>
      </Modal>
    </div>
  );
}
