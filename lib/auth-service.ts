import { useAuthStore, User } from './store/auth-store';

export interface AuthResponse {
  status: string;
  token?: string;
  data?: {
    user: User;
  };
  message?: string;
  error?: any;
}

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }

  // Get authorization headers using Zustand store
  getAuthHeaders(): Record<string, string> {
    const { token } = useAuthStore.getState();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    const { setLoading, login, clearAuth } = useAuthStore.getState();
    
    try {
      setLoading(true);
      
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.token && data.data?.user) {
        login(data.token, data.data.user);
      } else {
        clearAuth();
      }

      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      clearAuth();
      console.error('Login error:', error);
      return {
        status: 'error',
        message: 'Network error occurred',
      };
    }
  }

  // Register user
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    position?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const { setLoading, login, clearAuth } = useAuthStore.getState();
    
    try {
      setLoading(true);
      
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.token && data.data?.user) {
        login(data.token, data.data.user);
      } else {
        clearAuth();
      }

      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      clearAuth();
      console.error('Registration error:', error);
      return {
        status: 'error',
        message: 'Network error occurred',
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { token, setUser, clearAuth } = useAuthStore.getState();
    
    try {
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearAuth();
        }
        return null;
      }

      const data = await response.json();
      const user = data.data?.user || data;
      
      if (user) {
        setUser(user);
      }
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updates: {
    name?: string;
    department?: string;
    position?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const { token } = useAuthStore.getState();
    
    try {
      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        status: 'error',
        message: 'Network error occurred',
      };
    }
  }

  // Logout user (server-side)
  async logout(): Promise<void> {
    const { token, logout } = useAuthStore.getState();
    
    try {
      if (token) {
        await fetch(`${this.baseURL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const { isAuthenticated } = useAuthStore.getState();
    return isAuthenticated;
  }

  // Check if user has specific role
  async hasRole(requiredRole: string): Promise<boolean> {
    const { user } = useAuthStore.getState();
    if (!user) return false;

    const roleHierarchy = {
      'ADMIN': 3,
      'MANAGER': 2,
      'USER': 1,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const { token } = useAuthStore.getState();
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  }
}

// Create singleton instance
export const authService = new AuthService();

// Hook for using auth in React components
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    ...store,
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    getCurrentUser: authService.getCurrentUser.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    makeAuthenticatedRequest: authService.makeAuthenticatedRequest.bind(authService),
  };
};