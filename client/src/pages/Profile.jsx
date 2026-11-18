import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice.js';
import api, { getBackendBaseURL } from '../services/api.js';
import { 
  User, 
  Mail, 
  Briefcase, 
  Building, 
  ShieldCheck, 
  Activity, 
  CheckCircle,
  Clock,
  Sparkles,
  UploadCloud,
  FileText,
  Phone,
  GraduationCap,
  Save,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export default function Profile() {
  const user = useSelector(selectCurrentUser);
  const isCandidate = user?.role === 'CANDIDATE';

  // State variables for Admin/Recruiter view
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // State variables for Candidate Profile Builder
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (isCandidate) {
      fetchResume();
    } else {
      // Simulating fetching activity logs for admin/recruiter
      const timer = setTimeout(() => {
        setLogs([
          { id: 1, action: 'Onboarded Organization Profile', target: 'Acme Corp', date: '1 hour ago' },
          { id: 2, action: 'Posted Software Engineer Job', target: 'Job Board', date: '45 minutes ago' },
          { id: 3, action: 'Scheduled Interview slot', target: 'Google Meet integration', date: '10 minutes ago' },
        ]);
        setLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const fetchResume = async () => {
    try {
      setLoadingResume(true);
      const res = await api.get('/resumes/my-resume');
      setResume(res.data);
      if (res.data && res.data.parsedData) {
        setEditName(res.data.parsedData.name || user.name || '');
        setEditEmail(res.data.parsedData.email || user.email || '');
        setEditPhone(res.data.parsedData.phone || '');
        setEditSkills(res.data.parsedData.skills ? res.data.parsedData.skills.join(', ') : '');
        setEditExperience(res.data.parsedData.experience || '');
        setEditEducation(res.data.parsedData.education || '');
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching resume:', err);
      } else {
        // Safe fallback defaults for fresh onboarding
        setEditName(user.name || '');
        setEditEmail(user.email || '');
      }
    } finally {
      setLoadingResume(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setActionSuccess('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResume(res.data);
      if (res.data && res.data.parsedData) {
        setEditName(res.data.parsedData.name || '');
        setEditEmail(res.data.parsedData.email || '');
        setEditPhone(res.data.parsedData.phone || '');
        setEditSkills(res.data.parsedData.skills ? res.data.parsedData.skills.join(', ') : '');
        setEditExperience(res.data.parsedData.experience || '');
        setEditEducation(res.data.parsedData.education || '');
      }
      setActionSuccess('Resume uploaded and parsed successfully by AI!');
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'File upload failed. Please use PDF, DOCX or TXT.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setUploadError('');
    setActionSuccess('');

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
      setActionSuccess('Profile details saved successfully!');
    } catch (err) {
      console.error('Save profile error:', err);
      setUploadError(err.response?.data?.message || 'Failed to save profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) return null;

  const getRolePermissions = (role) => {
    const permissions = {
      SUPER_ADMIN: ['Full Platform Controls', 'Manage Tenants', 'Subscription Audits', 'Platform Analytics'],
      COMPANY_ADMIN: ['Post Job Openings', 'Update Pipeline Stages', 'Manage Company Teammates', 'Schedule Interviews', 'Hiring Analytics'],
      RECRUITER: ['Post Job Openings', 'Update Pipeline Stages', 'Schedule Interviews', 'Review Applicants', 'Hiring Analytics'],
      INTERVIEWER: ['View Assigned Interviews', 'Submit Candidate Feedback', 'Score Capabilities'],
      CANDIDATE: ['Register Profiles', 'Upload Resume Document', 'Apply to Jobs', 'Track Application Status', 'View Resume Matching Score'],
    };
    return permissions[role] || [];
  };

  // ========================================================
  // CANDIDATE PROFILE ONBOARDING VIEW
  // ========================================================
  if (isCandidate) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">
            Candidate <span className="gradient-text font-sans">Profile & Resume</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Onboard your credentials by uploading a resume document or filling in your profile details manually.
          </p>
        </div>

        {/* Success/Error Banners */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2.5 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-sm text-red-300 flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {loadingResume ? (
          <div className="py-24 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            Loading profile credentials...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left/Middle Column - Profile Fields Form */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <User className="w-5 h-5 text-primary-400" /> Profile Credentials Info
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Alex Developer"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="alex@gmail.com"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+1 555-019-2834"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Experience Level</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={editExperience}
                        onChange={(e) => setEditExperience(e.target.value)}
                        placeholder="e.g. 3 years / Senior level"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  {/* Education */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Highest Education</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={editEducation}
                        onChange={(e) => setEditEducation(e.target.value)}
                        placeholder="e.g. B.Tech in Computer Science / State College"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Professional Skills</label>
                    <span className="text-[10px] text-slate-500 block mb-1.5">Separate with commas (e.g. React, Node.js, Python, MongoDB)</span>
                    <textarea
                      rows={2}
                      value={editSkills}
                      onChange={(e) => setEditSkills(e.target.value)}
                      placeholder="React, Redux, Node.js, TypeScript, SQL"
                      className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-800/60">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-primary-500/15 transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Saving...' : 'Save Profile details'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Resume File Upload */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <FileCheck className="w-5 h-5 text-accent-500" /> Resume Document
              </h2>

              {!resume ? (
                <div className="border-2 border-dashed border-slate-800 hover:border-primary-500/50 rounded-2xl p-6 text-center transition bg-dark-900/10 relative cursor-pointer group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-primary-400 mx-auto mb-2 transition" />
                  <p className="text-xs font-bold text-slate-300">
                    {uploading ? 'Parsing with AI...' : 'Upload Resume File'}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">Supports PDF, DOCX, TXT</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-900 border border-slate-800">
                    <FileText className="w-8 h-8 text-red-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-300 truncate">Resume Document Active</p>
                      <a
                        href={resume.fileUrl.startsWith('/') ? `${getBackendBaseURL()}${resume.fileUrl}` : resume.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary-400 hover:underline"
                      >
                        Download PDF File
                      </a>
                    </div>
                  </div>

                  {/* Re-upload Zone */}
                  <div className="relative border border-dashed border-slate-800 rounded-xl p-4 text-center hover:border-slate-700/80 transition cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.docx,.txt"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                    <span className="text-[10px] font-semibold text-slate-400">
                      {uploading ? 'Processing File...' : 'Replace Resume File'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-dark-900/30 rounded-xl border border-slate-800/80 text-[10px] text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-400 block mb-1">💡 Smart AI Onboarding</span>
                Uploading a resume file automatically extracts all details (name, email, skills, education) using our AI parser and populates your profile form!
              </div>
            </div>

          </div>
        )}
      </div>
    );
  }

  // ========================================================
  // RECRUITER / ADMIN SECURITY PROFILE VIEW
  // ========================================================
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">My <span className="gradient-text font-sans">Profile</span></h1>
        <p className="text-slate-400 text-sm">View your system account details, security roles, and activity records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-primary-500/25 border-2 border-slate-800">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-200">{user.name}</h2>
            <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</p>
          </div>
          
          <div className="pt-2 w-full">
            <span className="inline-block px-3 py-1 rounded bg-primary-950/45 text-xs font-bold text-primary-400 border border-primary-500/25 uppercase tracking-wider">
              {user.role.replace('_', ' ')}
            </span>
          </div>

          <div className="w-full border-t border-slate-800/60 pt-4 text-left space-y-3 text-xs text-slate-400">
            {user.companyId && (
              <div className="flex items-center gap-2">
                <Building className="w-4.5 h-4.5 text-slate-500" />
                <span>Tenant ID: <strong className="text-slate-300 font-medium">{user.companyId}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-slate-500" />
              <span>Role Privilege Class: <strong className="text-slate-300 font-medium">{user.role}</strong></span>
            </div>
          </div>
        </div>

        {/* Permissions & Security list */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-400" /> Access Privileges
          </h3>
          <p className="text-xs text-slate-500 leading-normal">
            Your account role is granted the following functional permissions within TalentFlow:
          </p>

          <ul className="space-y-2.5">
            {getRolePermissions(user.role).map((perm, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-primary-500 shrink-0" />
                <span>{perm}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Audit Activity Logs */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-500" /> Activity Records
          </h3>
          <p className="text-xs text-slate-500 leading-normal">
            Audited audit events triggered by your account:
          </p>

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Loading audit history...</div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3 text-xs leading-normal">
                  <div className="mt-1 shrink-0 w-2 h-2 rounded-full bg-accent-500 shadow shadow-accent-500/20" />
                  <div className="min-w-0">
                    <p className="text-slate-300 font-semibold">{log.action}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Target: {log.target} • {log.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
