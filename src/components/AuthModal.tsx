import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Lock, User as UserIcon, AlertCircle, Sparkles } from 'lucide-react';
import { loginUser, registerUser } from '../lib/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear states when toggled or closed
  useEffect(() => {
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }, [isRegister, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isRegister) {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const result = await registerUser(username.trim(), password);
        onSuccess(result.user);
        onClose();
      } else {
        const result = await loginUser(username.trim(), password);
        onSuccess(result.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Modal Container */}
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[#FAF6F2] border border-[#EFE9E2] p-8 shadow-2xl transition-all duration-300 z-10"
      >
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8C3B3B]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#8C3B3B]/10 flex items-center justify-center text-[#8C3B3B] mb-3">
            <Sparkles size={22} />
          </div>
          <h2 className="font-serif italic font-bold text-2xl text-slate-900 tracking-tight">
            {isRegister ? 'Begin Your Journey' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegister 
              ? 'Create an account to securely save and access your travel itineraries.' 
              : 'Sign in to access your planned adventures and details.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-xs text-red-600 animate-fadeIn">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                className="w-full bg-white border border-[#EFE9E2] focus:border-[#8C3B3B] focus:ring-1 focus:ring-[#8C3B3B] outline-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-white border border-[#EFE9E2] focus:border-[#8C3B3B] focus:ring-1 focus:ring-[#8C3B3B] outline-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Confirm Password (Register Only) */}
          {isRegister && (
            <div className="animate-slideDown">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-white border border-[#EFE9E2] focus:border-[#8C3B3B] focus:ring-1 focus:ring-[#8C3B3B] outline-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 transition-all duration-200"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8C3B3B] hover:bg-[#702F2F] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-xs mt-2 disabled:bg-slate-400 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Toggle link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#8C3B3B] hover:text-[#702F2F] font-semibold hover:underline"
          >
            {isRegister 
              ? 'Already have an account? Sign In' 
              : "Don't have an account yet? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
