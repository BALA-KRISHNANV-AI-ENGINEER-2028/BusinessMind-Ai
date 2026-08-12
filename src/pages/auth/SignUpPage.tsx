import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const { register, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
  const [emailExists, setEmailExists] = useState(false);

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    // Frontend validations
    if (!fullName.trim() || !email.trim() || !password || !companyName.trim()) {
      const msg = 'Please fill out all required fields (*).';
      setFormError(msg);
      showToast({ title: msg, variant: 'danger' });
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setFormError(msg);
      showToast({ title: msg, variant: 'danger' });
      return;
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setFormError(msg);
      showToast({ title: msg, variant: 'danger' });
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
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

      showToast({ title: 'Account created successfully! Welcome to BusinessMind AI.', variant: 'success' });
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check your information.';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        setEmailExists(true);
        setFormError('An account with this email already exists. Please sign in to continue.');
        showToast({ title: 'An account with this email already exists.', variant: 'danger' });
      } else {
        setEmailExists(false);
        setFormError(msg);
        showToast({ title: msg, variant: 'danger' });
      }
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="flex-col items-start gap-1 text-left">
        <CardTitle className="text-xl font-bold">Create your BusinessMind AI account</CardTitle>
        <p className="text-xs text-text-secondary">
          Get started with real-time enterprise AI assistant and knowledge automation.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center gap-2"
            onClick={() => loginWithGoogle()}
            loading={isLoading}
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign up with Google
          </Button>

          <div className="relative flex items-center justify-center text-xs">
            <span className="bg-bg-base px-2 text-text-disabled">or register with details</span>
            <div className="absolute inset-0 -z-10 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
          </div>

          {emailExists ? (
            <div className="p-3 rounded-md bg-danger/10 text-danger text-xs border border-danger/20 space-y-2">
              <p className="font-semibold">An account with this email already exists.</p>
              <p className="text-text-secondary">Please sign in to continue.</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full mt-1 border-danger/30 text-danger hover:bg-danger/10"
                onClick={() => navigate(`/login?email=${encodeURIComponent(email)}`)}
              >
                Sign In
              </Button>
            </div>
          ) : formError ? (
            <div className="p-3 rounded-md bg-danger/10 text-danger text-xs border border-danger/20 font-medium">
              {formError}
            </div>
          ) : null}

          {/* Section 1: Account Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">1. Account Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full name *"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                required
              />
              <Input
                label="Password *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars (1 upper, 1 special)"
                required
              />
              <Input
                label="Confirm password *"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          {/* Section 2: Profile Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">2. Professional Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Job title (Optional)"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Chief Executive Officer / Developer"
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

          {/* Section 3: Organization Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">3. Company & Workspace</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Company / Organization name *"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corporation"
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
            Complete Registration & Create Workspace
          </Button>

          <p className="text-xs text-text-secondary text-center mt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
