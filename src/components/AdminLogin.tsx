import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.message || 'Invalid username or password');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF6EC] flex flex-col justify-center py-12 sm:px-6 lg:px-8" id="admin-login-view">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-14 h-14 bg-[#24344B] rounded-2xl mx-auto flex items-center justify-center text-[#FFFDF9] shadow-md">
          <Lock size={26} />
        </div>
        <h2 className="mt-4 text-center font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#24344B]">
          Content Management System
        </h2>
        <p className="mt-1 text-center text-sm text-[#55483A]">
          SheRoots Foundation • Home Training Blueprint
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FFFDF9] py-8 px-6 shadow-xl rounded-2xl border border-[rgba(36,52,75,0.12)] sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit} id="admin-login-form">
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
                id="login-error-alert"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-username"
                className="block text-sm font-medium text-[#241C15]"
              >
                Username or Email
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#55483A]">
                  <User size={18} />
                </div>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg text-[#241C15] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A64B2A] text-sm"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#241C15]"
              >
                Admin Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#55483A]">
                  <Lock size={18} />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg text-[#241C15] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A64B2A] text-sm"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1.5 text-xs text-[#55483A]">
                Credentials: <code className="bg-[#F3EAD9] px-1.5 py-0.5 rounded text-[#24344B]">admin</code> / <code className="bg-[#F3EAD9] px-1.5 py-0.5 rounded text-[#24344B]">blueprint2025</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#A64B2A] hover:bg-[#8A3C21] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A64B2A] disabled:opacity-50 transition cursor-pointer"
              id="admin-submit-button"
            >
              {loading ? 'Authenticating...' : 'Sign in to CMS'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="mt-6 border-t border-[rgba(36,52,75,0.1)] pt-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#55483A]">
              <ShieldCheck size={14} className="text-[#5C6B4E]" />
              <span>Restricted admin access • Changes reflect immediately on live site</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
