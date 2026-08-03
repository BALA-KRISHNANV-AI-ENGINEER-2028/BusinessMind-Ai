import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Building, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { HasPermission } from '../../components/auth/HasPermission';
import { MemberTable } from './components/MemberTable';
import { InviteMemberModal } from './components/InviteMemberModal';
import { useOrganization } from '../../hooks/useOrganization';
import { useToast } from '../../hooks/useToast';
import { organizationService } from '../../services/organization.service';
import type { OrgMemberRole } from '../../types/organization';

export function OrganizationSettingsPage() {
  const { activeOrganization, currentRole } = useOrganization();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { showToast } = useToast();

  const { data: membersRes, refetch } = useQuery({
    queryKey: ['organization', 'members', activeOrganization?.id],
    queryFn: () => organizationService.getMembers(activeOrganization?.id || 'org_1'),
    enabled: Boolean(activeOrganization),
  });

  const members = membersRes?.success ? membersRes.data : [];

  const handleInvite = async (email: string, role: OrgMemberRole) => {
    if (!activeOrganization) return;
    await organizationService.inviteMember(activeOrganization.id, email, role);
    showToast({
      title: 'Invitation Sent',
      description: `Invited ${email} as ${role} to ${activeOrganization.name}.`,
      variant: 'success',
    });
    refetch();
  };

  const handleRoleChange = async (memberId: string, role: OrgMemberRole) => {
    await organizationService.updateMemberRole(memberId, role);
    showToast({ title: 'Role updated', variant: 'success' });
    refetch();
  };

  const handleRemoveMember = async (memberId: string) => {
    await organizationService.removeMember(memberId);
    showToast({ title: 'Member removed', variant: 'info' });
    refetch();
  };

  if (!activeOrganization) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Manage multi-tenant organization profile, members, and access controls."
        actions={
          <HasPermission permission="org:members:invite">
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus size={16} aria-hidden="true" />
              Invite Member
            </Button>
          </HasPermission>
        }
      />

      {/* Org Profile Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-accent-subtle text-accent-text font-bold text-lg">
                <Building size={24} aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base">{activeOrganization.name}</CardTitle>
                <p className="text-xs text-text-secondary">{activeOrganization.domain || 'No custom domain set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="accent">{activeOrganization.plan.toUpperCase()} PLAN</Badge>
              <Badge variant="neutral" className="gap-1">
                <ShieldCheck size={12} className="text-accent-text" />
                Your Role: <span className="font-bold">{currentRole}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Member Management Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Organization Members ({members.length})
          </h2>
        </div>

        <MemberTable
          members={members}
          onRoleChange={handleRoleChange}
          onRemove={handleRemoveMember}
        />
      </div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
