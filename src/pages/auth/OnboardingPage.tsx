import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

function parseJwt(token: string): { email?: string; fullName?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const onboardingToken = searchParams.get('token') || '';
  const { completeGoogleOnboarding, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');

  // Profile
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');

  // Company
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [companySize, setCompanySize] = useState('11-50');
  const [companyDescription, setCompanyDescription] = useState('');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState('UTC');

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!onboardingToken) {
      showToast({ title: 'Invalid or missing onboarding token', variant: 'danger' });
      navigate('/login', { replace: true });
      return;
    }

    const decoded = parseJwt(onboardingToken);
    if (decoded) {
      if (decoded.email) setEmail(decoded.email);
      if (decoded.fullName) setFullName(decoded.fullName);
    }
  }, [onboardingToken, navigate, showToast]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !companyName.trim()) {
      const msg = 'Please fill out all required fields (*).';
      setFormError(msg);
      showToast({ title: msg, variant: 'danger' });
      return;
    }

    try {
      await completeGoogleOnboarding({
        onboardingToken,
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        phone: phone.trim() || undefined,
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim() || undefined,
        industry: industry || 'Technology',
        companySize: companySize || '11-50',
        companyDescription: companyDescription.trim() || undefined,
        country: country || 'United States',
        timezone: timezone || 'UTC',
      });

      showToast({ title: 'Onboarding completed! Welcome to BusinessMind AI.', variant: 'success' });
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Onboarding failed. Please try again.';
      setFormError(msg);
      showToast({ title: msg, variant: 'danger' });
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="flex-col items-start gap-1 text-left">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-1">
          Google OAuth Verified
        </div>
        <CardTitle className="text-xl font-bold">Complete your account setup</CardTitle>
        <p className="text-xs text-text-secondary">
          Welcome! Specify your profile and organization details to finish creating your workspace.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {formError && (
            <div className="p-3 rounded-md bg-danger/10 text-danger text-xs border border-danger/20 font-medium">
              {formError}
            </div>
          )}

          {/* User Info Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">User Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Verified Email (Google)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-md border border-border bg-bg-surface px-3 py-2 text-xs text-text-disabled cursor-not-allowed font-medium opacity-80"
                />
              </div>

              <Input
                label="Full name *"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
              />

              <Input
                label="Job title (Optional)"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Product Manager / Founder"
              />

              <Input
                label="Phone number (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Company Details Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">Company & Workspace</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Company / Organization name *"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                required
              />

              <Input
                label="Company website (Optional)"
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://acme.com"
              />

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Industry *</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="Technology">Technology / Software</option>
                  <option value="Finance">Finance / Banking</option>
                  <option value="Healthcare">Healthcare / Life Sciences</option>
                  <option value="E-commerce">E-commerce / Retail</option>
                  <option value="Manufacturing">Manufacturing / Operations</option>
                  <option value="Consulting">Consulting / Services</option>
                  <option value="Education">Education / EdTech</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Company size *</label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Country *</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="India">India</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Timezone *</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Company description (Optional)</label>
              <textarea
                rows={2}
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Brief summary of your organization..."
                className="w-full resize-none rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 pt-4">
          <Button type="submit" className="w-full" loading={isLoading}>
            Complete Setup & Launch Dashboard
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
