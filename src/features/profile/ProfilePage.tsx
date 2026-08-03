import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../hooks/useToast';
import { defaultProfileData } from '../../mocks/profile.mock';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(200, 'Bio must be under 200 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultProfileData,
  });

  const fullName = watch('fullName');

  const onSubmit = async (_data: ProfileFormData) => {
    await new Promise((r) => setTimeout(r, 500));
    showToast({ title: 'Profile updated successfully', variant: 'success' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar section */}
          <div className="flex items-center gap-4">
            <Avatar name={fullName || 'User'} size="lg" />
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  showToast({
                    title: 'Photo upload coming soon',
                    description: 'Avatar uploads will be available once file storage is connected.',
                    variant: 'info',
                  })
                }
              >
                Change photo
              </Button>
              <p className="mt-1 text-xs text-text-secondary">JPG, PNG or GIF. Max 2 MB.</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Job title"
              {...register('jobTitle')}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              {...register('phone')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Bio
            </label>
            <textarea
              rows={3}
              placeholder="A short description about yourself..."
              className="w-full resize-none rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled transition-colors focus:border-accent focus:outline-none"
              {...register('bio')}
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-danger">{errors.bio.message}</p>
            )}
          </div>
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
