import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { AuthMode, AuthPayload } from '../types';

const initialState: AuthPayload = { name: '', email: '', password: '' };

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (payload: AuthPayload) => Promise<void>;
  onModeChange: () => void;
  loading: boolean;
  error: string;
}

export default function AuthForm({ mode, onSubmit, onModeChange, loading, error }: AuthFormProps) {
  const [form, setForm] = useState(initialState);
  const handleChange = ({ target: { name, value } }: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [name]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
    setForm((prev) => ({ ...prev, password: '' }));
  };

  const login = mode === 'login';
  return (
    <div className="auth-panel">
      <div className="auth-brand"><span className="brand-mark">G</span><span>GeNNio</span></div>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-heading"><p>WELCOME</p><h1>{login ? 'Continue to GeNNio' : 'Create your account'}</h1><span>{login ? 'Enter your details to access your workspace.' : 'Start a focused conversation with your AI assistant.'}</span></div>
        {mode === 'register' && <label>Name<input name="name" value={form.name} onChange={handleChange} placeholder="Your name" autoComplete="name" minLength={2} maxLength={50} required /></label>}
        <label>Email address<input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" autoComplete="email" maxLength={255} required /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" autoComplete={login ? 'current-password' : 'new-password'} minLength={8} maxLength={128} required /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={loading} type="submit">{loading ? 'Please wait…' : login ? 'Continue' : 'Create account'}</button>
        <p className="auth-switch">{login ? 'New to GeNNio?' : 'Already have an account?'} <button type="button" onClick={onModeChange}>{login ? 'Create account' : 'Log in'}</button></p>
      </form>
      <p className="auth-legal">By continuing, you agree to our Terms and Privacy Policy.</p>
    </div>
  );
}
