// Client-side authentication utilities for Express.js + MongoDB backend
import React from 'react';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: string;
  token?: string;
  data?: {
    user: User;
  };
  message?: string;
}

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  }

  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  // Set token in localStorage
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  }

  // Remove token from localStorage
  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  }

  // Get authorization headers
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
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
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        status: 'error',
        message: 'Network error occurred',
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
        }
        return null;
      }

      const data = await response.json();
      return data.data?.user || data;
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
    try {
      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
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

  // Change password
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          passwordCurrent: currentPassword,
          password: newPassword,
          passwordConfirm: confirmPassword,
        }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        status: 'error',
        message: 'Network error occurred',
      };
    }
  }

  // Logout user
  logout(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Check if user has specific role
  async hasRole(requiredRole: string): Promise<boolean> {
    const user = await this.getCurrentUser();
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
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });
  }
}

// Create singleton instance
export const authService = new AuthService();

// Hook for using auth in React components
export const useAuth = () => {
  return {
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    getCurrentUser: authService.getCurrentUser.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    changePassword: authService.changePassword.bind(authService),
    isAuthenticated: authService.isAuthenticated.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    getToken: authService.getToken.bind(authService),
    getAuthHeaders: authService.getAuthHeaders.bind(authService),
    makeAuthenticatedRequest: authService.makeAuthenticatedRequest.bind(authService),
  };
};

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const AuthenticatedComponent = (props: P) => {
    const auth = useAuth();
    
    // This would typically be implemented with useEffect and state management
    // For now, just return the component
    // eslint-disable-next-line react/jsx-props-no-spreading
    return React.createElement(Component, props);
  };
  
  return AuthenticatedComponent;
};

// Utility function to check authentication status
export const checkAuth = async (): Promise<User | null> => {
  return authService.getCurrentUser();
};