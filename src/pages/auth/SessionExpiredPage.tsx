import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-warning-subtle text-warning">
          <Clock size={28} aria-hidden="true" />
        </div>
        <CardTitle className="text-xl font-bold">Session Expired</CardTitle>
        <p className="text-sm text-text-secondary">
          Your session has timed out due to inactivity or security policy. Please sign in again to continue.
        </p>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Button onClick={() => navigate('/login')} className="w-full justify-center gap-2">
          <LogIn size={16} aria-hidden="true" />
          Sign back in
        </Button>
      </CardFooter>
    </Card>
  );
}
