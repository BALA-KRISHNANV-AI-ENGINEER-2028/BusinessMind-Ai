/**
 * NotificationSettings — Email and marketing notification preferences.
 *
 * Persists to MongoDB Atlas via:
 *   PATCH /users/preferences → updates emailNotifications and marketingEmails on the User document.
 *
 * All form fields are initialised from live MongoDB data (user.preferences),
 * not from mock/hardcoded defaults.
 *
 * Shows correct Saving / Saved / Save failed states based on actual API response.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { useUser } from '../../../hooks/useUser';
import { useAuth } from '../../../contexts/AuthContext';
import { authApi } from '../../../services/auth.api';

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean(),
});

type NotificationsFormData = z.infer<typeof notificationsSchema>;

const notificationItems: Array<{
  key: keyof NotificationsFormData;
  label: string;
  description: string;
}> = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive email updates for new AI recommendations, agent activity, and important alerts',
  },
  {
    key: 'marketingEmails',
    label: 'Marketing Emails',
    description: 'Receive product updates, tips, and promotional content from BusinessMind AI',
  },
];

export function NotificationSettings() {
  const { showToast } = useToast();
  const { preferences } = useUser();
  const { updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: preferences.emailNotifications ?? true,
      marketingEmails: preferences.marketingEmails ?? false,
    },
  });

  // Re-sync when the real user data loads from MongoDB after mount
  useEffect(() => {
    reset({
      emailNotifications: preferences.emailNotifications ?? true,
      marketingEmails: preferences.marketingEmails ?? false,
    });
  }, [preferences.emailNotifications, preferences.marketingEmails, reset]);

  const onSubmit = async (data: NotificationsFormData) => {
    try {
      const updatedUser = await authApi.updatePreferences({
        emailNotifications: data.emailNotifications,
        marketingEmails: data.marketingEmails,
      });
      // Sync AuthContext so logout/login returns the same persisted values
      updateUser(updatedUser);
      showToast({
        title: 'Notification preferences saved',
        description: 'Your email notification settings have been updated.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save notification preferences';
      showToast({ title: 'Save failed', description: message, variant: 'danger' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {notificationItems.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.description}</p>
              </div>
              <input
                type="checkbox"
                {...register(item.key)}
                className="mt-0.5 size-4 shrink-0 rounded border-border accent-accent"
              />
            </label>
          ))}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save preferences
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
