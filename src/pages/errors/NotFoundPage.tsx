import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-bg-muted text-text-secondary">
        <FileQuestion size={32} aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary">Page not found</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
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
