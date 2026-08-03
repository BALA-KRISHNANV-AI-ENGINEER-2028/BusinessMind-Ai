import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { useUser } from '../../../hooks/useUser';
import { defaultWorkspaceSettings } from '../../../mocks/settings.mock';

const workspaceSchema = z.object({
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters'),
  timezone: z.string(),
  language: z.string(),
  defaultCurrency: z.string(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const timezoneOptions = [
  { label: 'Eastern Time (UTC-5)', value: 'et' },
  { label: 'Pacific Time (UTC-8)', value: 'pt' },
  { label: 'Central European Time (UTC+1)', value: 'cet' },
  { label: 'India Standard Time (UTC+5:30)', value: 'ist' },
];

const languageOptions = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'Spanish (Español)', value: 'es' },
  { label: 'German (Deutsch)', value: 'de' },
  { label: 'French (Français)', value: 'fr' },
];

const currencyOptions = [
  { label: 'USD — US Dollar', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — British Pound', value: 'GBP' },
  { label: 'INR — Indian Rupee', value: 'INR' },
];

export function AppearanceSettings() {
  const { showToast } = useToast();
  const { preferences, updatePreferences } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      ...defaultWorkspaceSettings,
      timezone: preferences.timezone,
      language: preferences.language,
    },
  });

  const onSubmit = async (data: WorkspaceFormData) => {
    await new Promise((r) => setTimeout(r, 400));
    updatePreferences({ timezone: data.timezone, language: data.language });
    showToast({ title: 'Preferences saved', description: 'Timezone and language updated.', variant: 'success' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Workspace & Regional Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Workspace name"
            error={errors.workspaceName?.message}
            {...register('workspaceName')}
          />
          <Select
            label="Timezone"
            options={timezoneOptions}
            {...register('timezone')}
          />
          <Select
            label="Language Preference"
            options={languageOptions}
            {...register('language')}
          />
          <Select
            label="Default Currency"
            options={currencyOptions}
            {...register('defaultCurrency')}
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
