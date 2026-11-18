import React, { useState, useEffect } from 'react';
import api, { getBackendBaseURL } from '../services/api.js';
import { 
  FileText, 
  UploadCloud, 
  Calendar, 
  Award, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  AlertCircle,
  FileCheck,
  ChevronRight
} from 'lucide-react';

export default function CandidateDashboard() {
  const [resume, setResume] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingResume, setLoadingResume] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedJobForAI, setSelectedJobForAI] = useState(null);

  // Manual Profile Form States
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch applications and resume
  useEffect(() => {
    fetchResume();
    fetchApplications();
  }, []);

  const fetchResume = async () => {
    try {
      setLoadingResume(true);
      const res = await api.get('/resumes/my-resume');
      setResume(res.data);
      if (res.data && res.data.parsedData) {
        setEditName(res.data.parsedData.name || '');
        setEditEmail(res.data.parsedData.email || '');
        setEditPhone(res.data.parsedData.phone || '');
        setEditSkills(res.data.parsedData.skills ? res.data.parsedData.skills.join(', ') : '');
        setEditExperience(res.data.parsedData.experience || '');
        setEditEducation(res.data.parsedData.education || '');
      }
      setUploadError('');
    } catch (err) {
      // 404 is expected if they haven't uploaded a resume yet
      if (err.response?.status !== 404) {
        console.error('Error fetching resume:', err);
      }
    } finally {
      setLoadingResume(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setUploadError('');
    try {
      const payload = {
        name: editName,
        email: editEmail,
        phone: editPhone,
        skills: editSkills,
        experience: editExperience,
        education: editEducation
      };
      const res = await api.put('/resumes/my-resume', payload);
      setResume(res.data);
      setShowEditForm(false);
    } catch (err) {
      console.error('Save profile error:', err);
      setUploadError(err.response?.data?.message || 'Failed to save profile details');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await api.get('/applications');
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchResume();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'File upload failed. Please use PDF, DOCX or TXT.');
    } finally {
      setUploading(false);
    }
  };

  const fetchAISuggestions = async (jobId, jobTitle) => {
    try {
      setLoadingSuggestions(true);
      setSelectedJobForAI(jobTitle);
      const res = await api.get(`/resumes/suggestions/${jobId}`);
      setAiSuggestions(res.data);
    } catch (err) {
      console.error('Error loading AI recommendations:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Compute stats
  const appliedCount = applications.length;
  const interviewsCount = applications.filter(app => app.currentStage === 'INTERVIEW').length;
  const offersCount = applications.filter(app => app.currentStage === 'OFFERED' || app.currentStage === 'HIRED').length;
  
  // Calculate mock or real resume score based on fields parsed
  const calculateResumeScore = () => {
    if (!resume || !resume.parsedData) return 0;
    const data = resume.parsedData;
    let score = 30; // base score for uploading
    if (data.email) score += 10;
    if (data.phone) score += 10;
    if (data.skills && data.skills.length > 3) score += 20;
    if (data.experience && data.experience !== '0 years') score += 15;
    if (data.education && data.education !== 'Not specified') score += 15;
    return score;
  };

  const resumeScore = calculateResumeScore();

  // Helper for stage colors
  const getStageBadgeClass = (stage) => {
    const classes = {
      APPLIED: 'bg-blue-950/45 text-blue-400 border border-blue-500/20',
      SCREENING: 'bg-amber-950/45 text-amber-400 border border-amber-500/20',
      SHORTLISTED: 'bg-indigo-950/45 text-indigo-400 border border-indigo-500/20',
      INTERVIEW: 'bg-purple-950/45 text-purple-400 border border-purple-500/20',
      OFFERED: 'bg-pink-950/45 text-pink-400 border border-pink-500/20',
      HIRED: 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20',
      REJECTED: 'bg-red-950/45 text-red-400 border border-red-500/20',
    };
    return classes[stage] || 'bg-slate-900 text-slate-400';
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">Candidate <span className="gradient-text font-sans">Dashboard</span></h1>
          <p className="text-slate-400 text-sm">Manage your profile, upload your resume, and track job applications.</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applied Jobs</span>
            <p className="text-2xl font-bold">{loadingApps ? '...' : appliedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interviews</span>
            <p className="text-2xl font-bold">{loadingApps ? '...' : interviewsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Offers Received</span>
            <p className="text-2xl font-bold">{loadingApps ? '...' : offersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resume Score</span>
            <p className="text-2xl font-bold">{loadingResume ? '...' : resume ? `${resumeScore}%` : '0%'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Resume Upload & Parsed Data) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Resume Upload Box */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-400" /> Resume Profile Portal
            </h2>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {showEditForm ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Alex Developer"
                      className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +1 555-019-2834"
                      className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Experience Level</label>
                    <input
                      type="text"
                      value={editExperience}
                      onChange={(e) => setEditExperience(e.target.value)}
                      placeholder="e.g. 3 years"
                      className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Highest Education</label>
                    <input
                      type="text"
                      value={editEducation}
                      onChange={(e) => setEditEducation(e.target.value)}
                      placeholder="e.g. B.Tech in CS"
                      className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Skills (Comma-separated)</label>
                    <input
                      type="text"
                      value={editSkills}
                      onChange={(e) => setEditSkills(e.target.value)}
                      placeholder="React, Node.js, Python"
                      className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow transition disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : 'Save Details'}
                  </button>
                </div>
              </form>
            ) : loadingResume ? (
              <div className="py-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary-500"></div>
                Loading resume profile...
              </div>
            ) : !resume ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 hover:border-primary-500/50 rounded-2xl p-8 text-center transition bg-dark-900/20 relative cursor-pointer group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-primary-400 mx-auto mb-3 transition" />
                  <p className="text-sm font-semibold text-slate-300">
                    {uploading ? 'Processing & Parsing Resume with AI...' : 'Click or Drag Resume here to upload'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX or TXT (Max 5MB)</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500">Or do you prefer to type it yourself? </span>
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="text-xs text-primary-400 font-bold hover:underline"
                  >
                    Fill Profile Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* File Upload Header */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-dark-900/60 border border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-300 truncate">Resume Profile Active</p>
                      <a 
                        href={resume.fileUrl.startsWith('/') ? `${getBackendBaseURL()}${resume.fileUrl}` : resume.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-primary-400 hover:underline cursor-pointer"
                      >
                        Download PDF File
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950/45 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-900 transition text-xs font-semibold"
                    >
                      Edit Profile
                    </button>
                    <div className="relative">
                      <button
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                        disabled={uploading}
                      >
                        {uploading ? 'Re-uploading...' : 'Update File'}
                      </button>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.txt"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>

                {/* Parsed Metadata Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-900/30 p-4 rounded-xl border border-slate-800/60">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Extracted Name</span>
                    <span className="text-sm font-semibold text-slate-300">{resume.parsedData?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Extracted Email</span>
                    <span className="text-sm font-semibold text-slate-300">{resume.parsedData?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Extracted Experience</span>
                    <span className="text-sm font-semibold text-slate-300">{resume.parsedData?.experience || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Extracted Education</span>
                    <span className="text-sm font-semibold text-slate-300 truncate block">{resume.parsedData?.education || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Parsed AI Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.parsedData?.skills && resume.parsedData.skills.length > 0 ? (
                        resume.parsedData.skills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded-md bg-primary-950/40 text-primary-400 text-xs font-medium border border-primary-500/15"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No skills parsed</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Applications Tracker */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" /> Active Job Applications
            </h2>

            {loadingApps ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                You haven't applied to any jobs yet. Check out the Job Board!
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div 
                    key={app._id} 
                    className="p-4 rounded-xl bg-dark-900/40 border border-slate-800/80 hover:border-slate-700/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-200 truncate">{app.jobId?.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStageBadgeClass(app.currentStage)}`}>
                          {app.currentStage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Applied Date: {new Date(app.appliedDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>AI Match Score:</span>
                        <span className={`font-semibold ${
                          app.aiScore >= 80 ? 'text-emerald-400' : app.aiScore >= 50 ? 'text-indigo-400' : 'text-amber-400'
                        }`}>
                          {app.aiScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchAISuggestions(app.jobId?._id, app.jobId?.title)}
                        className="px-3 py-1.5 rounded-lg bg-primary-950/25 border border-primary-500/20 hover:bg-primary-950/50 text-xs font-semibold text-primary-400 flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> AI Feedback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (AI Insights panel) */}
        <div>
          <div className="glass-card rounded-2xl p-6 border border-slate-800 sticky top-24 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-200">AI Resume Insights</h2>
            </div>

            {loadingSuggestions ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent-500"></div>
                Analyzing resume matching parameters...
              </div>
            ) : aiSuggestions ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-accent-950/10 rounded-xl border border-accent-500/15">
                  <p className="text-xs text-slate-400">Tailored improvements for:</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{selectedJobForAI}</p>
                </div>

                {/* Missing skills */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Skills to Add</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestions.missingSkills?.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 rounded bg-red-950/25 border border-red-500/20 text-red-300 text-xs font-medium"
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Weak keywords */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Weak Keywords to Avoid</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestions.weakKeywords?.map((kw, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 rounded bg-amber-950/25 border border-amber-500/20 text-amber-300 text-xs font-medium"
                      >
                        ⚠️ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Actionable Suggestions</span>
                  <ul className="space-y-2">
                    {aiSuggestions.recommendations?.map((rec, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 text-slate-600" />
                <p>Click "AI Feedback" on any job application above to see parsing feedback, missing keywords, and profile recommendations.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 bg-dark-950/10 -mx-6 -mb-6 p-4 rounded-b-2xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status Stages Explanation</span>
              <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-400">
                <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" /> APPLIED - Uploaded</div>
                <div className="flex items-center gap-1"><FileCheck className="w-3 h-3 text-amber-400" /> SCREENED - In Review</div>
                <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-indigo-400" /> SHORTLISTED - Passed</div>
                <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-purple-400" /> INTERVIEW - Live Talk</div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
