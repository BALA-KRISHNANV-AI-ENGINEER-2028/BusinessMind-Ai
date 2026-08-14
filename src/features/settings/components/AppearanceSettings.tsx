/**
 * AppearanceSettings — Workspace & Regional Preferences.
 *
 * Persists to MongoDB Atlas via two separate API calls:
 *   1. PATCH /organizations/current  → updates organization name (company/workspace name)
 *   2. PATCH /users/preferences      → updates timezone, language, currency for the authenticated user
 *
 * All form fields are initialised from live MongoDB data:
 *   - workspaceName: from activeOrganization.name (Organization document)
 *   - timezone, language: from user.preferences (User document)
 *   - currency: from user.preferences.currency (User document)
 *
 * Never falls back to hardcoded mock data.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { useUser } from '../../../hooks/useUser';
import { useOrganization } from '../../../hooks/useOrganization';
import { organizationService } from '../../../services/organization.service';
import { authApi } from '../../../services/auth.api';
import { useAuth } from '../../../contexts/AuthContext';

const SUPPORTED_TIMEZONES: { label: string; value: string }[] = [
  { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  { label: 'Eastern Time — New York (UTC-5)', value: 'America/New_York' },
  { label: 'Central Time — Chicago (UTC-6)', value: 'America/Chicago' },
  { label: 'Pacific Time — Los Angeles (UTC-8)', value: 'America/Los_Angeles' },
  { label: 'Central European Time (UTC+1)', value: 'Europe/Paris' },
  { label: 'Greenwich Mean Time — London', value: 'Europe/London' },
  { label: 'India Standard Time (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'Singapore Time (UTC+8)', value: 'Asia/Singapore' },
  { label: 'Japan Standard Time (UTC+9)', value: 'Asia/Tokyo' },
  { label: 'Australian Eastern Time (UTC+10)', value: 'Australia/Sydney' },
];

const SUPPORTED_LANGUAGES: { label: string; value: string }[] = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Spanish (Español)', value: 'es' },
  { label: 'German (Deutsch)', value: 'de' },
  { label: 'French (Français)', value: 'fr' },
  { label: 'Japanese (日本語)', value: 'ja' },
];

const SUPPORTED_CURRENCIES: { label: string; value: string }[] = [
  { label: 'USD — US Dollar', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — British Pound', value: 'GBP' },
  { label: 'INR — Indian Rupee', value: 'INR' },
  { label: 'AUD — Australian Dollar', value: 'AUD' },
  { label: 'CAD — Canadian Dollar', value: 'CAD' },
  { label: 'SGD — Singapore Dollar', value: 'SGD' },
  { label: 'JPY — Japanese Yen', value: 'JPY' },
];

const workspaceSchema = z.object({
  workspaceName: z.string().trim().min(2, 'Workspace name must be at least 2 characters').max(100),
  timezone: z.string().max(60),
  language: z.string().max(10),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'JPY']),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;


export function AppearanceSettings() {
  const { showToast } = useToast();
  const { preferences } = useUser();
  const { activeOrganization, refetchOrganization } = useOrganization();
  const { updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      workspaceName: activeOrganization?.name ?? '',
      timezone: preferences.timezone ?? 'UTC',
      language: preferences.language ?? 'en-US',
      currency: (preferences.currency as WorkspaceFormData['currency']) ?? 'USD',
    },
  });

  // Re-sync form when real data arrives (org or user loaded after mount)
  useEffect(() => {
    reset({
      workspaceName: activeOrganization?.name ?? '',
      timezone: preferences.timezone ?? 'UTC',
      language: preferences.language ?? 'en-US',
      currency: (preferences.currency as WorkspaceFormData['currency']) ?? 'USD',
    });
  }, [activeOrganization?.name, preferences.timezone, preferences.language, preferences.currency, reset]);

  const onSubmit = async (data: WorkspaceFormData) => {
    let orgError: string | null = null;
    let prefsError: string | null = null;

    // 1. Update organization name in MongoDB (Organization document)
    if (activeOrganization) {
      try {
        const orgRes = await organizationService.updateCurrentOrg({
          name: data.workspaceName,
        });
        if (!orgRes.success) {
          orgError = orgRes.message || 'Failed to update company name';
        } else {
          await refetchOrganization();
        }
      } catch (err) {
        orgError = err instanceof Error ? err.message : 'Failed to update company name';
      }
    }

    // 2. Update user preferences in MongoDB (User document)
    try {
      const updatedUser = await authApi.updatePreferences({
        timezone: data.timezone,
        language: data.language,
        currency: data.currency,
      });
      // Sync AuthContext so the session reflects the persisted values
      updateUser(updatedUser);
    } catch (err) {
      prefsError = err instanceof Error ? err.message : 'Failed to update preferences';
    }

    if (orgError || prefsError) {
      const msg = [orgError, prefsError].filter(Boolean).join(' | ');
      showToast({ title: 'Save failed', description: msg, variant: 'danger' });
      return;
    }

    showToast({
      title: 'Preferences saved',
      description: 'Workspace name, timezone, language, and currency updated.',
      variant: 'success',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Workspace &amp; Regional Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Workspace / Company name"
            error={errors.workspaceName?.message}
            {...register('workspaceName')}
          />
          <Select
            label="Timezone"
            options={SUPPORTED_TIMEZONES}
            {...register('timezone')}
          />
          <Select
            label="Language Preference"
            options={SUPPORTED_LANGUAGES}
            {...register('language')}
          />
          <Select
            label="Default Currency"
            options={SUPPORTED_CURRENCIES}
            error={errors.currency?.message}
            {...register('currency')}
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
