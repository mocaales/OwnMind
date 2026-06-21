import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import AuthForm from './components/AuthForm';
import ChatUI from './components/ChatUI';
import { auth } from './firebase';
import type { AppUser, AuthMode, AuthPayload } from './types';

const authErrorMessage = (mode: AuthMode, code?: string): string => {
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait and try again.';
  if (code === 'auth/network-request-failed') return 'Unable to connect. Check your connection and try again.';
  return mode === 'login' ? 'Email or password is incorrect.' : 'Unable to create the account with those details.';
};

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        setUser({ email: firebaseUser.email || '', name: firebaseUser.displayName || '' });
        return;
      }

      const data = await response.json() as { user: AppUser };
      setUser(data.user);
    });

    return () => unsub();
  }, []);

  const submitAuth = async (payload: AuthPayload): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      if (authMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
        if (payload.name?.trim()) {
          await updateProfile(cred.user, { displayName: payload.name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, payload.email, payload.password);
      }
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : undefined;
      setError(authErrorMessage(authMode, code));
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setAuthMode('login');
  };

  const getToken = async (): Promise<string> => {
    const current = auth.currentUser;
    if (!current) throw new Error('No active session');
    return current.getIdToken();
  };

  if (user) return <ChatUI user={user} getToken={getToken} onLogout={onLogout} />;

  return (
    <div className="auth-shell">
      <AuthForm
        mode={authMode}
        onSubmit={submitAuth}
        loading={loading}
        error={error}
        onModeChange={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
      />
    </div>
  );
}
