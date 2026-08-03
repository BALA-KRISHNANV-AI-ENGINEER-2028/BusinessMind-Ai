import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Organization, OrgMemberRole } from '../types/organization';
import { mockOrganizations } from '../mocks/organization.mock';

interface OrganizationContextValue {
  activeOrganization: Organization | null;
  organizations: Organization[];
  currentRole: OrgMemberRole;
  switchOrganization: (orgId: string) => void;
}

export const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations] = useState<Organization[]>(mockOrganizations);
  const [activeOrgId, setActiveOrgId] = useState<string>('org_1');

  const activeOrganization = useMemo(
    () => organizations.find((org) => org.id === activeOrgId) ?? organizations[0] ?? null,
    [organizations, activeOrgId],
  );

  // Default role for demo user in active organization
  const currentRole: OrgMemberRole = activeOrgId === 'org_1' ? 'org_admin' : 'analyst';

  const switchOrganization = (orgId: string) => {
    setActiveOrgId(orgId);
  };

  const value = useMemo(
    () => ({
      activeOrganization,
      organizations,
      currentRole,
      switchOrganization,
    }),
    [activeOrganization, organizations, currentRole],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
