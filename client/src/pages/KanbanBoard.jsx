import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getBackendBaseURL } from '../services/api.js';
import { 
  Trello, 
  User, 
  MapPin, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Briefcase,
  X,
  MessageSquare,
  FileText
} from 'lucide-react';

const STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'];

const STAGE_TITLES = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFERED: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

const STAGE_COLORS = {
  APPLIED: 'border-t-blue-500 bg-blue-500/5',
  SCREENING: 'border-t-amber-500 bg-amber-500/5',
  SHORTLISTED: 'border-t-indigo-500 bg-indigo-500/5',
  INTERVIEW: 'border-t-purple-500 bg-purple-500/5',
  OFFERED: 'border-t-pink-500 bg-pink-500/5',
  HIRED: 'border-t-emerald-500 bg-emerald-500/5',
  REJECTED: 'border-t-red-500 bg-red-500/5',
};

export default function KanbanBoard() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [candidateResume, setCandidateResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);

  const fetchCandidateResume = async (candidateId) => {
    try {
      setLoadingResume(true);
      setCandidateResume(null);
      const res = await api.get(`/resumes/my-resume?candidateId=${candidateId}`);
      setCandidateResume(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching candidate resume:', err);
      }
    } finally {
      setLoadingResume(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedJobId) params.jobId = selectedJobId;
      const res = await api.get('/applications', { params });
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Event Handlers (HTML5 Native)
  const handleDragStart = (e, applicationId) => {
    e.dataTransfer.setData('applicationId', applicationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    if (dragOverColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const applicationId = e.dataTransfer.getData('applicationId');

    if (!applicationId) return;

    // Optimistic Update
    const originalApps = [...applications];
    setApplications(apps => apps.map(app => 
      app._id === applicationId ? { ...app, currentStage: targetStage } : app
    ));

    try {
      await api.put(`/applications/${applicationId}/stage`, { stage: targetStage });
    } catch (err) {
      console.error('Drop error:', err);
      setError('Failed to update stage in database. Rolling back...');
      setApplications(originalApps);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in flex flex-col h-[85vh]">
      
      {/* Board Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl flex items-center gap-2">
            <Trello className="w-7 h-7 text-primary-400" /> Hiring <span className="gradient-text font-sans">Pipeline</span>
          </h1>
          <p className="text-slate-400 text-sm">Drag and drop applicant cards to update their recruitment stage.</p>
        </div>

        {/* Job selector filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Job:</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-400 focus:outline-none focus:border-primary-500 transition cursor-pointer min-w-56"
          >
            <option value="">All Job Positions</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-center gap-2 shrink-0 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Kanban columns flex scroll */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          Loading pipeline board...
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start select-none">
          {STAGES.map(stage => {
            const stageApps = applications.filter(app => app.currentStage === stage);
            const isOver = dragOverColumn === stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                className={`flex flex-col w-72 max-h-[72vh] shrink-0 rounded-2xl border-t-2 border-slate-800/80 p-3 transition-colors ${STAGE_COLORS[stage]} ${
                  isOver ? 'bg-primary-950/20 border-t-primary-500' : 'bg-dark-900/40'
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{STAGE_TITLES[stage]}</span>
                  <span className="px-2 py-0.5 rounded-md bg-dark-900/80 border border-slate-800 text-[10px] font-bold text-slate-400">
                    {stageApps.length}
                  </span>
                </div>

                {/* Column card scroll wrapper */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 max-h-[62vh]">
                  {stageApps.length === 0 ? (
                    <div className="text-center py-12 text-[10px] text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                      Empty column
                    </div>
                  ) : (
                    stageApps.map(app => (
                      <div
                        key={app._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app._id)}
                        onClick={() => {
                          setSelectedApplication(app);
                          setShowDetailModal(true);
                          if (app.candidateId?._id) {
                            fetchCandidateResume(app.candidateId._id);
                          }
                        }}
                        className="p-3.5 rounded-xl bg-dark-900 border border-slate-800/80 hover:border-slate-700/60 transition cursor-pointer shadow-lg select-none space-y-3 hover:shadow-primary-500/5 group"
                      >
                        {/* Name and avatar */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-slate-300 border border-slate-700 shrink-0 text-xs uppercase">
                            {app.candidateId?.avatar ? (
                              <img src={app.candidateId.avatar} alt="avatar" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                              app.candidateId?.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-primary-400 transition truncate">{app.candidateId?.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 text-slate-500" /> {app.jobId?.title}
                            </p>
                          </div>
                        </div>

                        {/* Match Score & Date */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/40 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(app.appliedDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-accent-500" />
                            Match: <span className={`font-semibold ${
                              app.aiScore >= 80 ? 'text-emerald-400' : app.aiScore >= 50 ? 'text-indigo-400' : 'text-amber-400'
                            }`}>{app.aiScore}%</span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recruiter Candidate Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in bg-dark-950">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-200 truncate">{selectedApplication.candidateId?.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedApplication.candidateId?.email}</p>
              </div>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedApplication(null);
                  setCandidateResume(null);
                }} 
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Job & Match Score */}
              <div className="grid grid-cols-2 gap-4 bg-dark-900/40 p-4 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Applied Position</span>
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {selectedApplication.jobId?.title}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">AI Match Suitability</span>
                  <span className={`text-slate-300 font-semibold flex items-center gap-1 ${
                    selectedApplication.aiScore >= 80 ? 'text-emerald-400' : selectedApplication.aiScore >= 50 ? 'text-indigo-400' : 'text-amber-400'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 text-accent-500 shrink-0" />
                    {selectedApplication.aiScore}%
                  </span>
                </div>
              </div>

              {/* Extra Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Application Date</span>
                  <span className="text-slate-300 font-medium">
                    {new Date(selectedApplication.appliedDate).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Acquisition Channel</span>
                  <span className="text-slate-300 font-medium capitalize">
                    {selectedApplication.source?.toLowerCase().replace(/_/g, ' ') || 'Career Portal'}
                  </span>
                </div>
              </div>

              {/* Screening Answers */}
              <div className="space-y-3 pt-4 border-t border-slate-800/40">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Screening Questionnaire Answers
                </h4>
                
                {!selectedApplication.screeningAnswers || selectedApplication.screeningAnswers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No pre-screening questions were configured for this job listing.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedApplication.screeningAnswers.map((sa, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-300">
                          <span className="text-primary-400 font-bold">Q:</span> {sa.question}
                        </p>
                        <p className="text-xs text-slate-400 leading-normal pl-4 border-l-2 border-primary-500/30">
                          <span className="text-slate-500 font-medium text-[10px] block uppercase mb-0.5">Answer:</span>
                          {sa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Profile / Resume Extracted Data */}
              <div className="space-y-3 pt-4 border-t border-slate-800/40">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary-400" /> Candidate Resume Profile
                </h4>
                
                {loadingResume ? (
                  <div className="py-4 text-center text-xs text-slate-500">Loading candidate profile details...</div>
                ) : !candidateResume ? (
                  <p className="text-xs text-slate-500 italic">No resume profile details uploaded by candidate yet.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 bg-dark-900/30 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</span>
                        <span className="text-slate-300 font-medium">{candidateResume.parsedData?.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Experience Level</span>
                        <span className="text-slate-300 font-medium">{candidateResume.parsedData?.experience || 'N/A'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Highest Education</span>
                        <span className="text-slate-300 font-medium truncate block">{candidateResume.parsedData?.education || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Skills Profile</span>
                      <div className="flex flex-wrap gap-1">
                        {candidateResume.parsedData?.skills && candidateResume.parsedData.skills.length > 0 ? (
                          candidateResume.parsedData.skills.map((skill, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-0.5 rounded bg-primary-950/45 text-primary-400 text-[10px] font-medium border border-primary-500/15"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">No skills registered</span>
                        )}
                      </div>
                    </div>

                    {candidateResume.fileUrl && (
                      <div className="pt-2">
                        <a
                          href={candidateResume.fileUrl.startsWith('/') ? `${getBackendBaseURL()}${candidateResume.fileUrl}` : candidateResume.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-855 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700/60 transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-400" /> View / Download Original Resume PDF
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-dark-950/40 flex items-center justify-between">
              <button
                onClick={() => navigate(`/messages?partnerId=${selectedApplication.candidateId?._id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-xs font-semibold text-white shadow shadow-primary-500/20 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Message Candidate
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedApplication(null);
                  setCandidateResume(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
