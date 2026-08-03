import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export function LoginPage() {
  const [email, setEmail] = useState('alex@businessmind.ai');
  const [password, setPassword] = useState('••••••••••••');
  const { login, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email);
      showToast({ title: 'Signed in successfully', variant: 'success' });
      navigate('/');
    } catch {
      showToast({ title: 'Sign in failed', variant: 'danger' });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      showToast({ title: 'Signed in with Google', variant: 'success' });
      navigate('/');
    } catch {
      showToast({ title: 'Google authentication failed', variant: 'danger' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-1 text-left">
        <CardTitle className="text-lg font-bold">Sign in to your account</CardTitle>
        <p className="text-xs text-text-secondary">
          Welcome back! Enter your details to access your workspace.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center gap-2"
            onClick={handleGoogleSignIn}
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
            Sign in with Google
          </Button>

          <div className="relative flex items-center justify-center text-xs">
            <span className="bg-bg-base px-2 text-text-disabled">or continue with email</span>
            <div className="absolute inset-0 -z-10 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" loading={isLoading}>
            Sign In
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
