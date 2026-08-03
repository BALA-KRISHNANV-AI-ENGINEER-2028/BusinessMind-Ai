export interface ProfileData {
  fullName: string;
  email: string;
  jobTitle: string;
  phone: string;
  bio: string;
}

export const defaultProfileData: ProfileData = {
  fullName: 'Alex Rivera',
  email: 'alex@businessmind.ai',
  jobTitle: 'VP of Operations',
  phone: '+1 (555) 234-5678',
  bio: 'Leading strategic operations and cross-functional technology initiatives at Acme Inc.',
};
