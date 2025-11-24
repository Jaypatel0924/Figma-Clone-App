import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface FormData {
  username?: string;
  email: string;
  password: string;
}

const LoginPage: React.FC<{ onLoginSuccess: (token: string, user: any) => void }> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://figma-clone-app-gnsu.vercel.app//api';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
      const payload = isSignUp
        ? {
            username: formData.username,
            email: formData.email,
            password: formData.password
          }
        : {
            username: formData.email || formData.username,
            password: formData.password
          };

      const response = await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { token, user } = response.data;

      // Save token to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Call success callback
      onLoginSuccess(token, user);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    // Create a guest user object
    const guestUser = {
      id: 'guest',
      username: 'Guest',
      email: 'guest@example.com'
    };
    const guestToken = 'guest123';

    localStorage.setItem('token', guestToken);
    localStorage.setItem('user', JSON.stringify(guestUser));

    onLoginSuccess(guestToken, guestUser);
    navigate('/canvas');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Canvas Editor</h1>
          <p className="text-gray-300">Create beautiful designs effortlessly</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form Title */}
          <h2 className="text-2xl font-bold text-white mb-6">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Username</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleChange}
                    placeholder="Choose your username"
                    required={isSignUp}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">
                {isSignUp ? 'Email Address' : 'Email or Username'}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type={isSignUp ? 'email' : 'text'}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={isSignUp ? 'your@email.com' : 'Enter email or username'}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isSignUp ? 'Min 6 characters' : 'Enter password'}
                  required
                  minLength={isSignUp ? 6 : undefined}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">OR</span>
            </div>
          </div>

          {/* Guest Mode Button */}
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Continue as Guest
          </button>

          {/* Toggle Sign Up / Sign In */}
          <p className="mt-6 text-center text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Footer Info */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Your designs are safely stored and synced across all your devices
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
