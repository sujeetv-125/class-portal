import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ShieldAlert, GraduationCap, Presentation } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student'); // 'Student' or 'Teacher'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      return setError('Please fill in all fields.');
    }
    if (password.length < 6) {
      return setError('Password should be at least 6 characters.');
    }

    try {
      setError('');
      setLoading(true);
      await register(email, password, name, role);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to register account. Check connection or try another email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-soft flex items-center justify-center p-6 mesh-gradient-bg">
      <div className="w-full max-w-lg bg-canvas border border-hairline rounded-lg p-8 stacked-shadow-lg">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-xl mb-4 active:scale-95 transition-transform">
            C
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-primary font-sans">Create your account.</h2>
          <p className="text-xs text-body font-mono mt-1">ClassPortal Classroom Portal Platform</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-4 bg-error-soft border border-error/20 rounded-sm flex gap-3 text-error text-xs items-start">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Registration Failed</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-body uppercase mb-1">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-mute">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Alan Turing or Ada Lovelace"
                className="w-full pl-9 pr-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
              />
            </div>
          </div>

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
                placeholder="•••••••• (Min 6 chars)"
                className="w-full pl-9 pr-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-mono font-medium text-body uppercase mb-2">Select Your Role</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('Student')}
                className={`p-4 border rounded-md flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:translate-y-[-1px] ${
                  role === 'Student'
                    ? 'border-primary bg-primary/5 text-primary stacked-shadow-md'
                    : 'border-hairline bg-canvas text-body hover:border-hairline-strong stacked-shadow-sm'
                }`}
              >
                <GraduationCap className={`w-8 h-8 mb-2 ${role === 'Student' ? 'text-primary' : 'text-mute'}`} />
                <span className="text-sm font-semibold block">Student</span>
                <span className="text-[10px] opacity-75 mt-0.5">Join classes, submit work</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('Teacher')}
                className={`p-4 border rounded-md flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:translate-y-[-1px] ${
                  role === 'Teacher'
                    ? 'border-primary bg-primary/5 text-primary stacked-shadow-md'
                    : 'border-hairline bg-canvas text-body hover:border-hairline-strong stacked-shadow-sm'
                }`}
              >
                <Presentation className={`w-8 h-8 mb-2 ${role === 'Teacher' ? 'text-primary' : 'text-mute'}`} />
                <span className="text-sm font-semibold block">Teacher</span>
                <span className="text-[10px] opacity-75 mt-0.5">Manage classes, grade work</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary text-white text-sm font-semibold rounded-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center mt-6"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-hairline text-center text-xs text-body">
          Already have an account?{' '}
          <Link to="/login" className="text-link hover:underline font-medium">
            Log in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
