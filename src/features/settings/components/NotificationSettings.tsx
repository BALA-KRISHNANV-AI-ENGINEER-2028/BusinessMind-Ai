import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { defaultNotificationSettings } from '../../../mocks/settings.mock';

const notificationsSchema = z.object({
  emailNewRecommendation: z.boolean(),
  emailAgentError: z.boolean(),
  weeklySummaryDigest: z.boolean(),
  slackAlerts: z.boolean(),
});

type NotificationsFormData = z.infer<typeof notificationsSchema>;

const notificationItems: Array<{ key: keyof NotificationsFormData; label: string; description: string }> = [
  {
    key: 'emailNewRecommendation',
    label: 'New AI Recommendations',
    description: 'Email me when the AI generates a new business recommendation',
  },
  {
    key: 'emailAgentError',
    label: 'Agent Errors',
    description: 'Email me when an agent encounters an error or gets stuck',
  },
  {
    key: 'weeklySummaryDigest',
    label: 'Weekly Summary Digest',
    description: 'Receive a weekly summary of key business insights and decisions',
  },
  {
    key: 'slackAlerts',
    label: 'Slack Alerts',
    description: 'Send important notifications to your connected Slack workspace',
  },
];

export function NotificationSettings() {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: defaultNotificationSettings,
  });

  const onSubmit = async (_data: NotificationsFormData) => {
    await new Promise((r) => setTimeout(r, 400));
    showToast({ title: 'Notification preferences saved', variant: 'success' });
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
