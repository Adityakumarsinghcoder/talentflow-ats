import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { 
  Briefcase, 
  Users,
  Calendar, 
  Send, 
  TrendingUp, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function RecruiterDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/analytics/activity-logs');
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Safe defaults if database counts are empty (Demo Onboarding Experience)
  const isDataEmpty = !analytics || analytics.metrics.totalCandidates === 0;

  const metrics = !isDataEmpty ? analytics.metrics : {
    openJobs: 4,
    totalCandidates: 48,
    interviewsToday: 3,
    offersSent: 8,
    hiringRate: 16,
  };

  const funnelDataRaw = !isDataEmpty ? analytics.funnel : {
    APPLIED: 18,
    SCREENING: 12,
    SHORTLISTED: 8,
    INTERVIEW: 5,
    OFFERED: 3,
    HIRED: 2,
    REJECTED: 4,
  };

  const sourceDataRaw = !isDataEmpty ? analytics.sources : {
    CAREER_PORTAL: 15,
    LINKEDIN: 25,
    REFERRAL: 8,
  };

  const monthlyDataRaw = !isDataEmpty ? analytics.monthly : {
    'Jan 26': 8,
    'Feb 26': 14,
    'Mar 26': 12,
    'Apr 26': 18,
    'May 26': 22,
    'Jun 26': 48,
  };

  // ----------------------------------------------------
  // Chart Config 1: Applications by Month (Line)
  // ----------------------------------------------------
  const lineChartData = {
    labels: Object.keys(monthlyDataRaw),
    datasets: [
      {
        label: 'Monthly Applications',
        data: Object.values(monthlyDataRaw),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#d946ef',
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  // ----------------------------------------------------
  // Chart Config 2: Source Analysis (Doughnut)
  // ----------------------------------------------------
  const doughnutData = {
    labels: Object.keys(sourceDataRaw).map(s => s.replace('_', ' ')),
    datasets: [
      {
        data: Object.values(sourceDataRaw),
        backgroundColor: ['#4f46e5', '#d946ef', '#c084fc', '#6366f1'],
        borderWidth: 1,
        borderColor: '#0f172a',
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } }
      }
    }
  };

  // ----------------------------------------------------
  // Chart Config 3: Hiring Funnel (Bar)
  // ----------------------------------------------------
  const barData = {
    labels: Object.keys(funnelDataRaw).map(k => k.charAt(0) + k.slice(1).toLowerCase()),
    datasets: [
      {
        label: 'Candidates',
        data: Object.values(funnelDataRaw),
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        hoverBackgroundColor: '#6366f1',
        borderRadius: 6,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Dashboard Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">Recruiter <span className="gradient-text font-sans">Dashboard</span></h1>
          <p className="text-slate-400 text-sm">Hiring pipeline analytics, open roles status, and candidate distribution.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/print-report', '_blank')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            Export PDF Report
          </button>
          {isDataEmpty && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/25 text-xs text-indigo-400 font-semibold shadow shadow-indigo-500/10">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Active Demo Mode
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Open Positions</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-200">{loading ? '...' : metrics.openJobs}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Candidates</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-200">{loading ? '...' : metrics.totalCandidates}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Interviews Today</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-200">{loading ? '...' : metrics.interviewsToday}</span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Offers Sent</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-200">{loading ? '...' : metrics.offersSent}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Send className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-28 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hiring Rate</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-200">{loading ? '...' : `${metrics.hiringRate}%`}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === 'analytics' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Overview Charts
        </button>
        <button
          onClick={() => {
            setActiveTab('audit');
            fetchAuditLogs();
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === 'audit' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Recruitment Audit Logs
        </button>
      </div>

      {activeTab === 'analytics' ? (
        /* Analytics Charts Panels */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Line monthly chart) */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-200">Applications Trend</h2>
              <p className="text-slate-500 text-xs mt-0.5">Tracking candidate submission volumes over the last six months.</p>
            </div>
            <div className="h-64 relative">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Right Column (Acquisition Source doughnut) */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-200">Acquisition Channels</h2>
              <p className="text-slate-500 text-xs mt-0.5">Distribution of candidate referrals and application portals.</p>
            </div>
            <div className="h-56 relative flex items-center justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          {/* Funnel distribution bar chart */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-200">Hiring Pipeline Funnel</h2>
              <p className="text-slate-500 text-xs mt-0.5">Distribution of active candidates across your hiring steps.</p>
            </div>
            <div className="h-60 relative">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

        </div>
      ) : (
        /* Audit Logs Panel */
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 animate-fade-in">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-200">System Activity Audit Logs</h2>
            <p className="text-slate-500 text-xs mt-0.5">Audit log trail detailing administrative changes, stage updates, and job listings.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-800">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] pb-2">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loadingLogs ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">Loading activity logs...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">No activity logs recorded yet. Try creating jobs or moving candidate stages.</td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log._id} className="hover:bg-slate-800/20 transition">
                      <td className="py-3 px-4 font-semibold text-slate-300">
                        {log.userId?.name || 'System / Auto'} <span className="text-[10px] text-slate-500">({log.userId?.email})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-indigo-400 border border-slate-700/60 uppercase">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{log.targetType}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
