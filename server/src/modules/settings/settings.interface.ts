/** Settings Module — Interface. */
import type { OrgSettings, UpdateOrgSettingsDto, SecuritySettings } from './settings.types';

export interface ISettingsService {
  getOrgSettings(orgId: string): Promise<OrgSettings>;
  updateOrgSettings(orgId: string, data: UpdateOrgSettingsDto): Promise<OrgSettings>;
  getSecuritySettings(userId: string): Promise<SecuritySettings>;
}
