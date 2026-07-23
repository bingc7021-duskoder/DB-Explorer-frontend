import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  /**
   * Authenticate Google OAuth profile/token with Spring Boot backend.
   * Retrieves Google ID, Name, Email, and Profile Picture URL and sends them to backend.
   */
  async loginWithGoogle(googleTokenOrProfile: any): Promise<{ user: User; token: string }> {
    let profile = googleTokenOrProfile.profileObj || googleTokenOrProfile;

    // Fetch profile details from Google UserInfo API if only access_token is present
    if (googleTokenOrProfile.access_token && (!profile.email || !profile.name)) {
      try {
        const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleTokenOrProfile.access_token}` },
        });
        profile = {
          ...profile,
          ...userInfoRes.data,
          googleId: userInfoRes.data.sub,
          name: userInfoRes.data.name,
          email: userInfoRes.data.email,
          picture: userInfoRes.data.picture,
        };
      } catch (err) {
        console.warn('Could not fetch userinfo from Google API directly:', err);
      }
    }

    const payload = {
      token: googleTokenOrProfile.credential || googleTokenOrProfile.access_token,
      profile: {
        googleId: profile.sub || profile.googleId || profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture || profile.profilePictureUrl,
      },
    };

    const response = await api.post('/api/auth/google', payload);
    return response.data;
  },

  /**
   * Fetch all users for ADMIN management.
   */
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  /**
   * Update user role (ADMIN / USER).
   */
  async updateUserRole(userId: number | string, role: 'ADMIN' | 'USER'): Promise<void> {
    await api.put(`/api/admin/users/${userId}/role`, { role });
  },

  /**
   * Update user account status (ACTIVE / INACTIVE / SUSPENDED).
   */
  async updateUserStatus(userId: number | string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<void> {
    await api.put(`/api/admin/users/${userId}/status`, { status });
  },
};
