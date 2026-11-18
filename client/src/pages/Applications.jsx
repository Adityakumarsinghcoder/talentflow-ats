import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { 
  FileText, 
  Clock, 
  MapPin, 
  DollarSign, 
  Search, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications');
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage) => {
    const map = {
      APPLIED: 'bg-blue-950/45 text-blue-400 border border-blue-500/20',
      SCREENING: 'bg-amber-950/45 text-amber-400 border border-amber-500/20',
      SHORTLISTED: 'bg-indigo-950/45 text-indigo-400 border border-indigo-500/20',
      INTERVIEW: 'bg-purple-950/45 text-purple-400 border border-purple-500/20',
      OFFERED: 'bg-pink-950/45 text-pink-400 border border-pink-500/20',
      HIRED: 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20',
      REJECTED: 'bg-red-950/45 text-red-400 border border-red-500/20',
    };
    return map[stage] || 'bg-slate-900 text-slate-400';
  };

  const filteredApps = applications.filter(app => 
    app.jobId?.title.toLowerCase().includes(search.toLowerCase()) ||
    app.jobId?.companyId?.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">My <span className="gradient-text font-sans">Applications</span></h1>
        <p className="text-slate-400 text-sm">Track your job applications progress steps and AI evaluation matching indices.</p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by job or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
        />
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-24 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          Retrieving applications...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500 border border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">No applications matches</p>
          <p className="text-xs text-slate-500 mt-1">Currently there are no application logs matching filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map(app => (
            <div 
              key={app._id} 
              className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              
              {/* Job info */}
              <div className="space-y-2.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-slate-200 truncate">{app.jobId?.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStageColor(app.currentStage)}`}>
                    {app.currentStage}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {app.jobId?.location || 'Remote'}</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-300"><DollarSign className="w-3.5 h-3.5 text-slate-500" /> {app.jobId?.salaryRange || 'N/A'}</span>
                </div>
              </div>

              {/* Match Score & Date progress */}
              <div className="flex items-center gap-6 shrink-0 border-t border-slate-800/40 md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI Match Score</span>
                  <span className={`text-base font-bold flex items-center gap-1 justify-end ${
                    app.aiScore >= 80 ? 'text-emerald-400' : app.aiScore >= 50 ? 'text-indigo-400' : 'text-amber-400'
                  }`}>
                    <Sparkles className="w-4 h-4 text-accent-500 shrink-0" />
                    {app.aiScore}%
                  </span>
                </div>

                <div className="text-right border-l border-slate-800/60 pl-6">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Submitted Date</span>
                  <span className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(app.appliedDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
