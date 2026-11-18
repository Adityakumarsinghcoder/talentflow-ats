import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { setCredentials, setError, setLoading } from '../store/authSlice.js';
import { LogIn, Mail, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/auth/login`, { email, password });
      
      const { _id, name, email: userEmail, role, companyId, avatar, accessToken, refreshToken } = response.data;
      
      dispatch(setCredentials({
        user: { _id, name, email: userEmail, role, companyId, avatar },
        accessToken,
        refreshToken
      }));

      dispatch(setLoading(false));
      navigate('/');
    } catch (err) {
      console.error(err);
      dispatch(setLoading(false));
      const errMsg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      dispatch(setError(errMsg));
    }
  };

  // Mock accounts quick-login helpers for user testing! Very developer/recruiter friendly
  const handleQuickLogin = (quickEmail, quickPass) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      
      {/* Visual background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md z-10">
        
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center font-bold text-white text-xl shadow-xl shadow-primary-500/25 mb-3">
            TF
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Talent<span className="gradient-text">Flow</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5">SaaS Applicant Tracking System</p>
        </div>

        {/* Card Body */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary-400" /> Sign In
          </h2>

          {/* Error banners */}
          {(error || validationError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5 animate-fade-in">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error || validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Toggle register */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:underline hover:text-primary-300 font-medium">
              Create an account
            </Link>
          </div>
        </div>

        {/* Quick Login Helpers */}
        <div className="mt-6 glass-card rounded-xl p-4 border border-slate-800/80">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Quick Demo Logins</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button 
              onClick={() => handleQuickLogin('recruiter@talentflow.com', 'password123')}
              className="p-2 rounded bg-dark-900 border border-slate-800 text-slate-300 hover:border-primary-500 text-left truncate transition"
            >
              <strong>Recruiter/Admin</strong><br/>recruiter@talentflow.com (pwd: password123)
            </button>
            <button 
              onClick={() => handleQuickLogin('candidate@talentflow.com', 'password123')}
              className="p-2 rounded bg-dark-900 border border-slate-800 text-slate-300 hover:border-primary-500 text-left truncate transition"
            >
              <strong>Candidate</strong><br/>candidate@talentflow.com (pwd: password123)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
