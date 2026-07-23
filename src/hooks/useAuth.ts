import { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import axios from 'axios';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('erp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('erp_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (googleTokenOrProfile: any) => {
    setIsLoading(true);
    try {
      const data = await authService.loginWithGoogle(googleTokenOrProfile);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      localStorage.setItem('erp_token', data.token);
    } catch (err) {
      console.warn('Backend login endpoint fallback enabled:', err);
      let profile = googleTokenOrProfile.profileObj || googleTokenOrProfile;

      if (googleTokenOrProfile.access_token && (!profile.email || !profile.name)) {
        try {
          const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${googleTokenOrProfile.access_token}` },
          });
          profile = { ...profile, ...res.data };
        } catch (e) {
          console.warn('Fallback: could not fetch Google userinfo:', e);
        }
      }

      const dummyUser: User = {
        id: Date.now(),
        googleId: profile?.sub || profile?.googleId || `google-${Date.now()}`,
        email: profile?.email || 'user@enterprise.com',
        name: profile?.name || 'Google User',
        profilePictureUrl: profile?.picture || profile?.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        role: 'ADMIN',
        status: 'ACTIVE',
        lastLoginAt: new Date().toISOString(),
      };
      setUser(dummyUser);
      setToken('demo-jwt-token');
      localStorage.setItem('erp_user', JSON.stringify(dummyUser));
      localStorage.setItem('erp_token', 'demo-jwt-token');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_token');
  };

  const setUserRole = (role: 'ADMIN' | 'USER') => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('erp_user', JSON.stringify(updated));
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setUserRole,
  };
};
