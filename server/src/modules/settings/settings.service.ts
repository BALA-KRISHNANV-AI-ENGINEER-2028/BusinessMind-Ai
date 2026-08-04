/** Settings Service — Placeholder. Phase 5: Implementation. */
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import type { ISettingsService } from './settings.interface';
import type { OrgSettings, UpdateOrgSettingsDto, SecuritySettings } from './settings.types';

const stub = (m: string) => new AppError(`SettingsService.${m} not implemented (Phase 5).`, HttpStatus.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED', true);

export class SettingsService implements ISettingsService {
  async getOrgSettings(_orgId: string): Promise<OrgSettings> { throw stub('getOrgSettings'); }
  async updateOrgSettings(_orgId: string, _d: UpdateOrgSettingsDto): Promise<OrgSettings> { throw stub('updateOrgSettings'); }
  async getSecuritySettings(_userId: string): Promise<SecuritySettings> { throw stub('getSecuritySettings'); }
}
export const settingsService = new SettingsService();
