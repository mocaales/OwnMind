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

export default function App() {
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
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
        setUser({ email: firebaseUser.email, name: firebaseUser.displayName || '' });
        return;
      }

      const data = await response.json();
      setUser(data.user);
    });

    return () => unsub();
  }, []);

  const submitAuth = async (payload) => {
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
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAuthMode('login');
  };

  const getToken = async () => {
    const current = auth.currentUser;
    if (!current) throw new Error('No active session');
    return current.getIdToken();
  };

  if (user) return <ChatUI user={user} getToken={getToken} onLogout={onLogout} />;

  return (
    <div className="auth-shell">
      <AuthForm mode={authMode} onSubmit={submitAuth} loading={loading} error={error} />
      <button className="mode-switch" onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}>
        {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}
      </button>
    </div>
  );
}
