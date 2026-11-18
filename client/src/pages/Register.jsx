import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { setCredentials, setError, setLoading } from '../store/authSlice.js';
import { UserPlus, User, Building, Mail, Lock, ShieldAlert, ArrowRight, Briefcase } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CANDIDATE'); // CANDIDATE or COMPANY_ADMIN
  
  // Company Admin fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');

  const [validationError, setValidationError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name || !email || !password || !role) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (role === 'COMPANY_ADMIN' && !companyName) {
      setValidationError('Please enter your Company Name.');
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === 'COMPANY_ADMIN' && { companyName, industry, website }),
      };

      const response = await axios.post(`${apiUrl}/auth/register`, payload);
      
      const { _id, name: userName, email: userEmail, role: userRole, companyId, avatar, accessToken, refreshToken } = response.data;
      
      dispatch(setCredentials({
        user: { _id, name: userName, email: userEmail, role: userRole, companyId, avatar },
        accessToken,
        refreshToken
      }));

      dispatch(setLoading(false));
      navigate('/');
    } catch (err) {
      console.error(err);
      dispatch(setLoading(false));
      const errMsg = err.response?.data?.message || 'Registration failed. Email might already be registered.';
      dispatch(setError(errMsg));
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md z-10">
        
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
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
            <UserPlus className="w-5 h-5 text-primary-400" /> Create Account
          </h2>

          {/* Errors */}
          {(error || validationError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5 animate-fade-in">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error || validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">I want to register as a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CANDIDATE')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                    role === 'CANDIDATE'
                      ? 'border-primary-500 bg-primary-950/20 text-slate-100 shadow-md shadow-primary-500/10'
                      : 'border-slate-800 bg-dark-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRole('COMPANY_ADMIN')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                    role === 'COMPANY_ADMIN'
                      ? 'border-primary-500 bg-primary-950/20 text-slate-100 shadow-md shadow-primary-500/10'
                      : 'border-slate-800 bg-dark-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  Company Admin
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>
            </div>

            {/* Company Admin specific fields */}
            {role === 'COMPANY_ADMIN' && (
              <div className="space-y-4 pt-3 border-t border-slate-800 animate-fade-in">
                <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Company Information</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Company Name *</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Tech, Finance..."
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://acme.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Toggle login */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:underline hover:text-primary-300 font-medium">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
