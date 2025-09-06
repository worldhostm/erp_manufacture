'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from './auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: string;
  fallbackPath?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requiredRole,
  fallbackPath = '/auth/signin'
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthentication = async () => {
    try {
      if (!requireAuth) {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      if (!authService.isAuthenticated()) {
        router.push(fallbackPath);
        return;
      }

      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        authService.logout();
        return;
      }

      setUser(currentUser);

      // Check role requirements
      if (requiredRole) {
        const hasRequiredRole = await authService.hasRole(requiredRole);
        if (!hasRequiredRole) {
          router.push('/dashboard'); // Redirect to dashboard if no permission
          return;
        }
      }

      setAuthorized(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show nothing if not authorized (redirect is in progress)
  if (requireAuth && !authorized) {
    return null;
  }

  // Render children if authorized or no auth required
  return <>{children}</>;
}

// Hook to use current user in components
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to get user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (authService.isAuthenticated()) {
      getUser();
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading, setUser };
}

// Higher-order component for page-level authentication
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function GuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}