import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-warning-subtle text-warning">
        <ShieldAlert size={32} aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary">Access Denied</h1>
      <p className="mt-2 text-sm text-text-secondary">
        You don't have permission to access this resource. Please contact your organization administrator.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Go Back
        </Button>
        <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Back to Dashboard</Button>
      </div>
    </div>
  );
}
