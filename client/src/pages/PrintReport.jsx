import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { ShieldAlert, Printer, Sparkles } from 'lucide-react';

export default function PrintReport() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/analytics');
      setAnalytics(res.data);
      
      // Automatically trigger browser print dialog once data is loaded
      setTimeout(() => {
        window.print();
      }, 800);
    } catch (err) {
      console.error('Error fetching print analytics:', err);
      setError('Failed to fetch analytics statistics for printing.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Sparkles className="w-8 h-8 text-primary-400 animate-spin" />
        <span className="text-xs">Preparing your hiring report and print layout...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>{error || 'No analytics data available.'}</span>
        </div>
      </div>
    );
  }

  const { metrics, funnel, sources, monthly } = analytics;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 max-w-4xl mx-auto print:p-0 print:m-0 space-y-8 font-sans">
      
      {/* Header Info */}
      <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">TalentFlow ATS</h1>
          <p className="text-sm text-slate-600 mt-1">Hiring & Pipeline Analytics Summary Report</p>
        </div>
        <div className="text-right text-xs text-slate-500 space-y-0.5">
          <p>Generated: {new Date().toLocaleDateString()}</p>
          <p>Tenant: TalentFlow Corporate Profile</p>
          <button 
            onClick={() => window.print()} 
            className="print:hidden mt-2 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition"
          >
            <Printer className="w-4 h-4" /> Print Again
          </button>
        </div>
      </div>

      {/* KPI Stats Block */}
      <div className="grid grid-cols-5 gap-4">
        <div className="border border-slate-300 p-4 rounded-lg text-center bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Open Positions</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.openJobs}</span>
        </div>
        <div className="border border-slate-300 p-4 rounded-lg text-center bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Candidates</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.totalCandidates}</span>
        </div>
        <div className="border border-slate-300 p-4 rounded-lg text-center bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Interviews Today</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.interviewsToday}</span>
        </div>
        <div className="border border-slate-300 p-4 rounded-lg text-center bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Offers Sent</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.offersSent}</span>
        </div>
        <div className="border border-slate-300 p-4 rounded-lg text-center bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hiring Rate</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.hiringRate}%</span>
        </div>
      </div>

      {/* Pipeline & Channels grid */}
      <div className="grid grid-cols-2 gap-8">
        
        {/* Funnel distribution list */}
        <div className="border border-slate-300 rounded-lg p-5 bg-slate-50">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-300">Hiring Pipeline Distribution</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 font-bold border-b border-slate-300/60 pb-1">
                <th>Pipeline Stage</th>
                <th className="text-right">Candidates Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/40">
              {Object.entries(funnel).map(([stage, count]) => (
                <tr key={stage} className="py-2 block table-row">
                  <td className="font-semibold text-slate-700 capitalize py-1.5">{stage.toLowerCase()}</td>
                  <td className="text-right font-bold text-slate-900 py-1.5">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Source Channels */}
        <div className="border border-slate-300 rounded-lg p-5 bg-slate-50 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-300">Acquisition Channels</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 font-bold border-b border-slate-300/60 pb-1">
                  <th>Channel Source</th>
                  <th className="text-right">Applications Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/40">
                {Object.entries(sources).map(([source, count]) => (
                  <tr key={source} className="py-2 block table-row">
                    <td className="font-semibold text-slate-700 capitalize py-1.5">{source.replace('_', ' ').toLowerCase()}</td>
                    <td className="text-right font-bold text-slate-900 py-1.5">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 border-t border-slate-300/80 pt-3 text-[10px] text-slate-500 leading-normal">
            <strong>Notes:</strong> This report is simulated under the local mock database scope. The data matches current active JSON candidate application structures.
          </div>
        </div>

      </div>

      {/* Monthly trends table */}
      <div className="border border-slate-300 rounded-lg p-5 bg-slate-50">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-300">Monthly Recruitment Submissions</h2>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-slate-500 border-b border-slate-300 pb-1">
              <th>Month / Year</th>
              <th>Submitted Applications Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300/40">
            {Object.entries(monthly).map(([month, count]) => (
              <tr key={month}>
                <td className="py-2 font-semibold text-slate-700">{month}</td>
                <td className="py-2 font-bold text-slate-900">{count} applicants</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
