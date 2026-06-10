import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }
    
    try {
      setError('');
      setLoading(true);
      const res = await login(email, password);
      
      // Decode JWT payload to read the user's role
      const token = res.token;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      const role = payload.role ? payload.role.toLowerCase() : '';
      
      if (role === 'teacher') {
        navigate('/teacher');
      } else if (role === 'student') {
        navigate('/student');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-soft flex items-center justify-center p-6 mesh-gradient-bg">
      <div className="w-full max-w-md bg-canvas border border-hairline rounded-lg p-8 stacked-shadow-lg">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-xl mb-4 active:scale-95 transition-transform">
            C
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-primary font-sans">Welcome back.</h2>
          <p className="text-xs text-body font-mono mt-1">Sign in to access your classrooms</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-4 bg-error-soft border border-error/20 rounded-sm flex gap-3 text-error text-xs items-start">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Sign In Failed</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-body uppercase mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-mute">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-body uppercase mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-mute">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary text-white text-sm font-semibold rounded-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {loading ? 'Signing In...' : 'Continue'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-hairline text-center text-xs text-body">
          Don't have an account?{' '}
          <Link to="/register" className="text-link hover:underline font-medium">
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
}
