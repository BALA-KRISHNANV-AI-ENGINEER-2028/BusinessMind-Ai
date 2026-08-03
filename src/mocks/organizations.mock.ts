export type MemberRole = 'owner' | 'admin' | 'member';

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedLabel: string;
}

export const organizationMembers: OrganizationMember[] = [
  { id: '1', name: 'Sofia Martins', email: 'sofia@businessmind.ai', role: 'owner', joinedLabel: 'Jan 2025' },
  { id: '2', name: 'David Chen', email: 'david@businessmind.ai', role: 'admin', joinedLabel: 'Mar 2025' },
  { id: '3', name: 'Amara Osei', email: 'amara@businessmind.ai', role: 'member', joinedLabel: 'Jun 2025' },
  { id: '4', name: 'Priya Nair', email: 'priya@businessmind.ai', role: 'member', joinedLabel: 'Sep 2025' },
];
