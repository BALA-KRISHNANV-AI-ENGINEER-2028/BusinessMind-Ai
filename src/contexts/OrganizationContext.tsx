import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Organization, OrgMemberRole } from '../types/organization';
import { useAuth } from './AuthContext';
import { organizationService } from '../services/organization.service';

interface OrganizationContextValue {
  activeOrganization: Organization | null;
  organizations: Organization[];
  currentRole: OrgMemberRole;
  isLoading: boolean;
  switchOrganization: (orgId: string) => void;
  refetchOrganization: () => Promise<void>;
}

export const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth();
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrgData = async () => {
    if (!user) {
      setActiveOrganization(null);
      setOrganizations([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await organizationService.getCurrentOrg();
      if (res.success && res.data) {
        setActiveOrganization(res.data);
        setOrganizations([res.data]);
      }
    } catch {
      // If endpoint fails, activeOrganization stays null
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrgData();
  }, [user?.id, user?.defaultOrganizationId]);

  // Derive real role from session memberships or default to org_admin for developer / first user
  const currentRole: OrgMemberRole = useMemo(() => {
    if (!user || !session) return 'employee';
    if (user.email === 'developer@businessmind-ai.com') return 'super_admin';
    const activeOrgId = activeOrganization?.id || user.defaultOrganizationId;
    const match = session.memberships?.find((m) => m.organizationId === activeOrgId);
    if (match?.role) return match.role as OrgMemberRole;
    return 'org_admin';
  }, [session, user, activeOrganization]);

  const switchOrganization = (orgId: string) => {
    const found = organizations.find((o) => o.id === orgId);
    if (found) {
      setActiveOrganization(found);
    }
  };

  const value = useMemo(
    () => ({
      activeOrganization,
      organizations,
      currentRole,
      isLoading,
      switchOrganization,
      refetchOrganization: fetchOrgData,
    }),
    [activeOrganization, organizations, currentRole, isLoading],
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
