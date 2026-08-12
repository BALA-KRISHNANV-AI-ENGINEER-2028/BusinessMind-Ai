import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Building, ShieldCheck, Save } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
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

  // Company details form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [companySize, setCompanySize] = useState('11-50');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState('UTC');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      setName(activeOrganization.name || '');
      setWebsite(activeOrganization.website || '');
      setIndustry(activeOrganization.industry || 'Technology');
      setCompanySize(activeOrganization.companySize || '11-50');
      setDescription(activeOrganization.description || '');
      setCountry(activeOrganization.country || 'United States');
      setTimezone(activeOrganization.timezone || 'UTC');
    }
  }, [activeOrganization]);

  const { data: membersRes, refetch } = useQuery({
    queryKey: ['organization', 'members', activeOrganization?.id],
    queryFn: () => organizationService.getMembers(activeOrganization?.id || ''),
    enabled: Boolean(activeOrganization?.id),
  });

  const members = membersRes?.success ? membersRes.data : [];

  const handleCompanyUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;
    setIsSaving(true);
    try {
      await organizationService.updateCurrentOrg({
        name: name.trim(),
        website: website.trim(),
        industry,
        companySize,
        description: description.trim(),
        country,
        timezone,
      });
      showToast({ title: 'Company profile updated successfully', variant: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update company profile';
      showToast({ title: msg, variant: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

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
    if (!activeOrganization) return;
    await organizationService.updateMemberRole(activeOrganization.id, memberId, role);
    showToast({ title: 'Role updated', variant: 'success' });
    refetch();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeOrganization) return;
    await organizationService.removeMember(activeOrganization.id, memberId);
    showToast({ title: 'Member removed', variant: 'info' });
    refetch();
  };

  if (!activeOrganization) return null;

  return (
    <div className="space-y-6 max-w-5xl">
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
                <p className="text-xs text-text-secondary">{activeOrganization.website || activeOrganization.domain || 'No website set'}</p>
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

      {/* Company Profile Details Form */}
      <HasPermission permission="org:settings:edit">
        <form onSubmit={handleCompanyUpdate}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Company Website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                />

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="Technology">Technology / Software</option>
                    <option value="Finance">Finance / Banking</option>
                    <option value="Healthcare">Healthcare / Life Sciences</option>
                    <option value="E-commerce">E-commerce / Retail</option>
                    <option value="Manufacturing">Manufacturing / Operations</option>
                    <option value="Consulting">Consulting / Services</option>
                    <option value="Education">Education / EdTech</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Company Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of company goals and vision..."
                  className="w-full resize-none rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" loading={isSaving} className="gap-2">
                <Save size={16} aria-hidden="true" />
                Save Company Details
              </Button>
            </CardFooter>
          </Card>
        </form>
      </HasPermission>

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
