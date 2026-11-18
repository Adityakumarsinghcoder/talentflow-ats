import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice.js';
import api from '../services/api.js';
import { 
  Calendar, 
  Plus, 
  Video, 
  User, 
  Star, 
  Clock, 
  CheckCircle, 
  X, 
  AlertCircle,
  FileText,
  UserCheck,
  ChevronRight
} from 'lucide-react';

export default function Interviews() {
  const user = useSelector(selectCurrentUser);
  const isRecruiter = user?.role === 'RECRUITER' || user?.role === 'COMPANY_ADMIN';
  const isInterviewer = user?.role === 'INTERVIEWER';

  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackViewModal, setShowFeedbackViewModal] = useState(false);
  
  // Selected interview contexts
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [activeFeedback, setActiveFeedback] = useState(null);

  // Schedule Form fields
  const [appId, setAppId] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(45);
  
  // Feedback Form fields
  const [rubrics, setRubrics] = useState([
    { criterion: 'Coding & Tech Capability', score: 5, weight: 30 },
    { criterion: 'System Design & Problem Solving', score: 5, weight: 30 },
    { criterion: 'Communication Skills', score: 5, weight: 20 },
    { criterion: 'Culture Fit & Alignment', score: 5, weight: 20 },
  ]);
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('HIRE');

  // Mock team members list for assigning interviews (normally fetched from users API)
  const [teamMembers, setTeamMembers] = useState([
    { _id: 'interviewer_1', name: 'Dr. Sarah Jenkins (Tech Lead)', role: 'INTERVIEWER' },
    { _id: 'interviewer_2', name: 'Mike Miller (Senior Architect)', role: 'INTERVIEWER' },
    { _id: 'recruiter@talentflow.com', name: 'Self / Org Admin', role: 'RECRUITER' }
  ]);

  useEffect(() => {
    fetchInterviews();
    if (isRecruiter) {
      fetchApplications();
    }
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interviews');
      setInterviews(res.data);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      // Only list applications that are in SHORTLISTED, SCREENING or APPLIED stage for scheduling
      const schedulable = res.data.filter(app => 
        ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW'].includes(app.currentStage)
      );
      setApplications(schedulable);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!appId || !interviewerId || !date) {
      setError('Please select Candidate, Interviewer, and Date.');
      return;
    }

    try {
      // Map self recruiter account or custom interviewer account
      let selectedInterviewerId = interviewerId;
      if (interviewerId === 'recruiter@talentflow.com') {
        selectedInterviewerId = user._id; // Assign to self
      } else if (interviewerId.startsWith('interviewer_')) {
        // Mock interviewer bypass: create actual user in mock db if needed, 
        // or since we are in mock mode, our dbMock will resolve user reference.
        // For simple support, we pass our logged in recruiter ID or interviewer ID.
        selectedInterviewerId = user._id; 
      }

      await api.post('/interviews', {
        applicationId: appId,
        interviewerId: selectedInterviewerId,
        date,
        duration: parseInt(duration),
      });

      setSuccess('Interview scheduled successfully! Notifications sent.');
      setShowScheduleModal(false);
      fetchInterviews();
      fetchApplications();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to schedule interview.');
    }
  };

  const handleOpenFeedbackModal = (interview) => {
    setSelectedInterview(interview);
    setRubrics([
      { criterion: 'Coding & Tech Capability', score: 5, weight: 30 },
      { criterion: 'System Design & Problem Solving', score: 5, weight: 30 },
      { criterion: 'Communication Skills', score: 5, weight: 20 },
      { criterion: 'Culture Fit & Alignment', score: 5, weight: 20 },
    ]);
    setComments('');
    setRecommendation('HIRE');
    setError('');
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post(`/interviews/${selectedInterview._id}/feedback`, {
        rubrics,
        comments,
        recommendation,
      });

      setSuccess('Feedback submitted successfully!');
      setShowFeedbackModal(false);
      fetchInterviews();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  const handleViewFeedback = async (interview) => {
    try {
      setSelectedInterview(interview);
      const res = await api.get(`/interviews/${interview._id}/feedback`);
      setActiveFeedback(res.data);
      setShowFeedbackViewModal(true);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      alert('Feedback could not be loaded.');
    }
  };

  const getRecommendationBadge = (rec) => {
    const map = {
      HIRE: 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20',
      MAYBE: 'bg-amber-950/45 text-amber-400 border border-amber-500/20',
      REJECT: 'bg-red-950/45 text-red-400 border border-red-500/20',
    };
    return map[rec] || 'bg-slate-900 text-slate-400';
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-400" /> Interview <span className="gradient-text font-sans">Scheduler</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {isRecruiter 
              ? 'Organize meetings, assign interviewers, and view candidate feedback.'
              : isInterviewer
                ? 'Check your assigned candidate meetings and submit scorecard evaluations.'
                : 'Review your upcoming interview schedule and link credentials.'
            }
          </p>
        </div>
        {isRecruiter && (
          <button
            onClick={() => {
              setAppId('');
              setInterviewerId('');
              setDate('');
              setShowScheduleModal(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Schedule Interview
          </button>
        )}
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2.5 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-sm text-red-400 flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="py-24 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          Retrieving interview calendar...
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500 border border-slate-800">
          <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">No scheduled interviews found</p>
          <p className="text-xs text-slate-500 mt-1">Currently there are no interview events on the list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interviews.map(inv => {
            const isCompleted = inv.status === 'COMPLETED';
            const candidate = inv.applicationId?.candidateId;
            const job = inv.applicationId?.jobId;

            return (
              <div 
                key={inv._id} 
                className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-4"
              >
                {/* Interviewer/Candidate headers */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Candidate details</span>
                    <h3 className="text-sm font-bold text-slate-200">{candidate?.name || 'Candidate profile'}</h3>
                    <p className="text-xs text-slate-400">{job?.title || 'Job Opening'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    isCompleted 
                      ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20'
                      : 'bg-purple-950/45 text-purple-400 border border-purple-500/20 animate-pulse'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                {/* Date and Time Info */}
                <div className="bg-dark-900/30 p-3 rounded-xl border border-slate-800/60 grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>
                      {new Date(inv.date).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} ({inv.duration} min)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span className="truncate">Interviewer: {inv.interviewerId?.name || 'Hiring Manager'}</span>
                  </div>
                </div>

                {/* Meet Link / Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                  <a 
                    href={inv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-semibold"
                  >
                    <Video className="w-4 h-4" /> Join Google Meet
                  </a>

                  {/* Contextual Action Button */}
                  <div>
                    {isCompleted ? (
                      <button
                        onClick={() => handleViewFeedback(inv)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950/25 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 hover:bg-emerald-950/40 transition"
                      >
                        View Scorecard
                      </button>
                    ) : (
                      // If recruiter or assigned interviewer, show feedback form
                      (isRecruiter || isInterviewer || user._id === inv.interviewerId?._id) && (
                        <button
                          onClick={() => handleOpenFeedbackModal(inv)}
                          className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-[11px] font-bold text-white shadow shadow-primary-500/20 transition"
                        >
                          Submit Scorecard
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. Schedule Interview Modal */}
      {/* ======================================================== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl flex flex-col animate-fade-in bg-dark-950">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-200">Schedule Interview</h2>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-5 space-y-4">
              {/* Candidate Application selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Candidate / Application</label>
                <select
                  required
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
                >
                  <option value="">-- Choose Candidate --</option>
                  {applications.map(app => (
                    <option key={app._id} value={app._id}>
                      {app.candidateId?.name} ({app.jobId?.title})
                    </option>
                  ))}
                </select>
              </div>

              {/* Interviewer selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assign Interviewer</label>
                <select
                  required
                  value={interviewerId}
                  onChange={(e) => setInterviewerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
                >
                  <option value="">-- Choose Interviewer --</option>
                  {teamMembers.map(tm => (
                    <option key={tm._id} value={tm._id}>{tm.name}</option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-400 focus:outline-none focus:border-primary-500 transition cursor-pointer"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={90}>90 Minutes</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow shadow-primary-500/20 transition"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Submit Feedback Modal (Interviewer Scorecard) */}
      {/* ======================================================== */}
      {showFeedbackModal && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-fade-in bg-dark-950">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-200">Submit Scorecard</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Candidate: {selectedInterview.applicationId?.candidateId?.name}</p>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Live Weighted Average */}
              <div className="bg-indigo-950/20 border border-indigo-500/25 p-3 rounded-xl flex items-center justify-between text-xs mb-2 shadow-inner">
                <span className="font-semibold text-slate-300">Live Weighted Score:</span>
                <span className="font-extrabold text-indigo-400 text-sm">
                  {Math.round(rubrics.reduce((sum, r) => sum + r.score * (r.weight / 100), 0) * 10) / 10} / 10
                </span>
              </div>

              {/* Rubrics Sliders */}
              {rubrics.map((r, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-300 capitalize">{r.criterion} ({r.weight}%)</label>
                    <span className="font-bold text-primary-400">{r.score} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={r.score}
                    onChange={(e) => {
                      const updated = [...rubrics];
                      updated[idx].score = parseInt(e.target.value);
                      setRubrics(updated);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              ))}

              {/* Written Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Feedback Comments</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Notes on candidate's technical skills, answers, strengths, and weaknesses..."
                  className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Hiring Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-primary-500 transition cursor-pointer"
                >
                  <option value="HIRE">Hire (Recommend moving forward)</option>
                  <option value="MAYBE">Maybe (Borderline candidate)</option>
                  <option value="REJECT">Reject (Do not proceed)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow shadow-primary-500/20 transition"
                >
                  Submit Scorecard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. View Scorecard Modal */}
      {/* ======================================================== */}
      {showFeedbackViewModal && selectedInterview && activeFeedback && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl flex flex-col animate-fade-in bg-dark-950">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-200">Interviewer Scorecard</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Candidate: {selectedInterview.applicationId?.candidateId?.name}</p>
              </div>
              <button onClick={() => setShowFeedbackViewModal(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              
              {/* Recommendation Badge */}
              <div className="flex items-center justify-between bg-dark-900/40 p-3 rounded-xl border border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Assessment</span>
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${getRecommendationBadge(activeFeedback.recommendation)}`}>
                  {activeFeedback.recommendation}
                </span>
              </div>

              {/* Competency Ratings */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Competency Ratings</span>
                  {activeFeedback.weightedAverage !== undefined && (
                    <span className="text-xs font-bold text-indigo-400">Weighted Average: {activeFeedback.weightedAverage} / 10</span>
                  )}
                </div>

                {activeFeedback.rubrics && activeFeedback.rubrics.length > 0 ? (
                  activeFeedback.rubrics.map((r, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-350">
                        <span>{r.criterion} ({r.weight}%)</span>
                        <span>{r.score} / 10</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-500 h-full" style={{ width: `${r.score * 10}%` }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Tech */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>Technical Capabilities</span>
                        <span>{activeFeedback.technicalScore} / 10</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-500 h-full" style={{ width: `${activeFeedback.technicalScore * 10}%` }}></div>
                      </div>
                    </div>

                    {/* Comm */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>Communication Skills</span>
                        <span>{activeFeedback.communicationScore} / 10</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-500 h-full" style={{ width: `${activeFeedback.communicationScore * 10}%` }}></div>
                      </div>
                    </div>

                    {/* Culture */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>Culture Fit & Core Values</span>
                        <span>{activeFeedback.cultureFitScore} / 10</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-500 h-full" style={{ width: `${activeFeedback.cultureFitScore * 10}%` }}></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Written Comments */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Interviewer Comments</span>
                <div className="p-3 bg-dark-900/30 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {activeFeedback.comments || 'No written notes provided.'}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFeedbackViewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Close Scorecard
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
