import { ShieldCheck, Lock, Smartphone, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../contexts/AuthContext';

export function SecuritySettings() {
  const { showToast } = useToast();
  const { session } = useAuth();

  const handleRevokeSessions = () => {
    showToast({
      title: 'Other Sessions Revoked',
      description: 'All other active device sessions have been terminated.',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Security</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {/* Google SSO Status */}
          <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent-text">
                <ShieldCheck size={18} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">Google OAuth Sign-In</p>
                  <Badge variant="success" className="gap-1 text-xs">
                    <CheckCircle2 size={12} /> Connected
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">Single sign-on active via Google Workspace.</p>
              </div>
            </div>
          </div>

          {/* Active Session Management */}
          <div className="flex items-start justify-between gap-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-muted text-text-secondary">
                <Smartphone size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Current Device Session</p>
                <p className="text-xs text-text-secondary">
                  Expires at: {session?.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : 'Active'}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRevokeSessions}>
              Revoke other sessions
            </Button>
          </div>

          {/* Password & MFA */}
          <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-muted text-text-secondary">
                <Lock size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Two-Factor Authentication (MFA)</p>
                <p className="text-xs text-text-secondary">Enforce multi-factor verification for all organization members.</p>
              </div>
            </div>
            <Badge variant="neutral">Phase 4 Ready</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
