import { useState } from 'react';

const initialState = { name: '', email: '', password: '' };

export default function AuthForm({ mode, onSubmit, loading, error }) {
  const [form, setForm] = useState(initialState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    setForm((prev) => ({ ...prev, password: '' }));
  };

  return (
    <form className="auth-card" onSubmit={submit} noValidate>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
      <p>Sign in before accessing GeNNio Chat.</p>
      {mode === 'register' && (
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} minLength={2} maxLength={50} required />
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} maxLength={255} required />
      </label>
      <label>
        Password
        <input name="password" type="password" value={form.password} onChange={handleChange} minLength={8} maxLength={128} required />
      </label>
      {error && <div className="error">{error}</div>}
      <button disabled={loading} type="submit">{loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Register'}</button>
    </form>
  );
}
