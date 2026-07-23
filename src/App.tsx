import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './hooks/useAuth';
import { GoogleLogin } from './components/Auth/GoogleLogin';
import { Dashboard } from './components/Layout/Dashboard';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '46742105539-2ku9v0j01fg47bel3ec7hh2733svodbg.apps.googleusercontent.com';

export function App() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleLogin onLoginSuccess={login} isLoading={isLoading} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Dashboard user={user} onLogout={logout} />
    </GoogleOAuthProvider>
  );
}

export default App;
