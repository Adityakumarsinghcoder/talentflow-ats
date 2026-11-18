import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice.js';
import api from '../services/api.js';
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  DollarSign, 
  Clock, 
  Search, 
  SlidersHorizontal,
  X, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Ban,
  AlertCircle,
  FileCheck,
  Send,
  Sparkles
} from 'lucide-react';

export default function Jobs() {
  const user = useSelector(selectCurrentUser);
  const isRecruiter = user?.role === 'RECRUITER' || user?.role === 'COMPANY_ADMIN';

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null); // for edit or detail view
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [experienceRequired, setExperienceRequired] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [openings, setOpenings] = useState(1);
  const [status, setStatus] = useState('OPEN');
  
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Premium Custom screening questions & answers
  const [screeningQuestions, setScreeningQuestions] = useState([]);
  const [screeningAnswers, setScreeningAnswers] = useState([]);
  const [generatingJD, setGeneratingJD] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, locationFilter, typeFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (locationFilter) params.location = locationFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await api.get('/jobs', { params });
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateJD = async () => {
    if (!title) {
      setFormError('Please enter a Job Title first to generate a description.');
      return;
    }
    try {
      setGeneratingJD(true);
      setFormError('');
      const res = await api.post('/jobs/generate-jd', {
        title,
        experienceRequired,
        skillsRequired
      });
      setDescription(res.data.description);
      setActionSuccess('Job description generated successfully!');
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error generating job description');
    } finally {
      setGeneratingJD(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedJob(null);
    setTitle('');
    setDescription('');
    setSkillsRequired('');
    setSalaryRange('');
    setExperienceRequired('');
    setLocation('');
    setEmploymentType('FULL_TIME');
    setOpenings(1);
    setStatus('OPEN');
    setScreeningQuestions([]);
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (job) => {
    setSelectedJob(job);
    setTitle(job.title);
    setDescription(job.description);
    setSkillsRequired(job.skillsRequired.join(', '));
    setSalaryRange(job.salaryRange);
    setExperienceRequired(job.experienceRequired);
    setLocation(job.location);
    setEmploymentType(job.employmentType);
    setOpenings(job.openings);
    setStatus(job.status);
    setScreeningQuestions(job.screeningQuestions || []);
    setFormError('');
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionSuccess('');

    if (!title || !description || !skillsRequired) {
      setFormError('Job Title, Description, and Required Skills are required.');
      return;
    }

    const payload = {
      title,
      description,
      skillsRequired: skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
      salaryRange,
      experienceRequired,
      location,
      employmentType,
      openings: parseInt(openings) || 1,
      status,
      screeningQuestions: screeningQuestions.filter(q => q.trim().length > 0)
    };

    try {
      if (selectedJob) {
        // Edit Mode
        await api.put(`/jobs/${selectedJob._id}`, payload);
        setActionSuccess('Job updated successfully!');
      } else {
        // Create Mode
        await api.post('/jobs', payload);
        setActionSuccess('Job posted successfully!');
      }
      setShowFormModal(false);
      fetchJobs();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error processing job submission');
    }
  };

  const handleCloseJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job opening?')) return;
    try {
      await api.put(`/jobs/${jobId}`, { status: 'CLOSED' });
      setActionSuccess('Job marked as CLOSED.');
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting permanently?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setActionSuccess('Job removed successfully.');
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyToJob = async (jobId) => {
    setApplying(true);
    setApplyError('');
    setActionSuccess('');

    if (selectedJob?.screeningQuestions && selectedJob.screeningQuestions.length > 0) {
      const missingAnswer = screeningAnswers.some(sa => !sa.answer || sa.answer.trim().length === 0);
      if (missingAnswer) {
        setApplyError('Please answer all screening questions before applying.');
        setApplying(false);
        return;
      }
    }

    try {
      await api.post('/applications', { 
        jobId,
        screeningAnswers
      });
      setActionSuccess('Application submitted successfully! Check your Dashboard to track status.');
      setShowDetailModal(false);
    } catch (err) {
      console.error(err);
      setApplyError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setApplyError('');
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      setScreeningAnswers(job.screeningQuestions.map(q => ({ question: q, answer: '' })));
    } else {
      setScreeningAnswers([]);
    }
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">
            {isRecruiter ? 'Manage' : 'Job'} <span className="gradient-text font-sans">Postings</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {isRecruiter 
              ? 'Add, edit, track, and close job postings for your organization.' 
              : 'Browse open opportunities, see your match suitability, and apply with your parsed profile.'
            }
          </p>
        </div>
        {isRecruiter && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Post New Job
          </button>
        )}
      </div>

      {/* Success banner */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2.5 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, description, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
          />
        </div>
        
        {/* Location filter */}
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Location filter (e.g. Remote)..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
          />
        </div>

        {/* Employment type filter */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-400 focus:outline-none focus:border-primary-500 transition cursor-pointer"
          >
            <option value="">All Job Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="REMOTE">Remote</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-24 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          Retrieving job list...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500 border border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">No job openings found</p>
          <p className="text-xs text-slate-500 mt-1">Try relaxing your search terms or filters.</p>
        </div>
      ) : isRecruiter ? (
        
        /* Recruiter Table View */
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-dark-900/60 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Job Title</th>
                  <th className="px-6 py-4.5">Location</th>
                  <th className="px-6 py-4.5">Employment Type</th>
                  <th className="px-6 py-4.5">Openings</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-200">{job.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {job.skillsRequired.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-dark-800 text-slate-400 text-[10px] font-medium border border-slate-700/50">
                              {s}
                            </span>
                          ))}
                          {job.skillsRequired.length > 3 && (
                            <span className="text-[10px] text-slate-500 pt-0.5 ml-1">+{job.skillsRequired.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {job.location || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 capitalize">
                      {job.employmentType.toLowerCase().replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{job.openings}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                        job.status === 'OPEN'
                          ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-950/45 text-red-400 border border-red-500/20'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleOpenEditModal(job)}
                          className="p-1 rounded text-slate-400 hover:text-primary-400 hover:bg-slate-800 transition"
                          title="Edit Job"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {job.status === 'OPEN' && (
                          <button
                            onClick={() => handleCloseJob(job._id)}
                            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                            title="Close Job"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* Candidate Job Grid Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map(job => (
            <div 
              key={job._id} 
              className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between h-56 cursor-pointer"
              onClick={() => handleViewJobDetails(job)}
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-base font-bold text-slate-200 leading-snug line-clamp-2">{job.title}</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-950/50 text-primary-400 border border-primary-500/25 shrink-0 uppercase font-bold tracking-wider">
                    {job.employmentType.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {job.skillsRequired.slice(0, 3).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-dark-900 text-slate-400 text-[10px] font-medium border border-slate-800">
                      {s}
                    </span>
                  ))}
                  {job.skillsRequired.length > 3 && (
                    <span className="text-[10px] text-slate-500 pt-0.5 ml-1">+{job.skillsRequired.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800/40 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {job.location || 'Remote'}
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" /> {job.salaryRange || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. Recruiter Form Modal (Create / Edit) */}
      {/* ======================================================== */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-fade-in bg-dark-950">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-200">
                {selectedJob ? 'Edit Job Posting' : 'Post New Job Opportunity'}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description *</label>
                  <button
                    type="button"
                    onClick={handleGenerateJD}
                    disabled={generatingJD}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/55 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold hover:bg-indigo-900 transition disabled:opacity-55"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 animate-pulse" />
                    {generatingJD ? 'Generating...' : 'AI Generate JD'}
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize roles, responsibilities and jd details..."
                  className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Skills Required *</label>
                <span className="text-[10px] text-slate-500 block mb-1.5">Separate with commas (e.g. React, TypeScript, Redux)</span>
                <input
                  type="text"
                  required
                  value={skillsRequired}
                  onChange={(e) => setSkillsRequired(e.target.value)}
                  placeholder="React, Node, TypeScript"
                  className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>

              {/* Location & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote / New York"
                    className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-400 focus:outline-none focus:border-primary-500 transition"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="REMOTE">Remote</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
              </div>

              {/* Salary & Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Salary Range</label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. $100k - $120k"
                    className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Experience Required</label>
                  <input
                    type="text"
                    value={experienceRequired}
                    onChange={(e) => setExperienceRequired(e.target.value)}
                    placeholder="e.g. 3+ years"
                    className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                  />
                </div>
              </div>

              {/* Openings & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Number of Openings</label>
                  <input
                    type="number"
                    min={1}
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Post Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-sm text-slate-400 focus:outline-none focus:border-primary-500 transition"
                  >
                    <option value="OPEN">Open (Published)</option>
                    <option value="CLOSED">Closed (Archived)</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              {/* Custom Screening Questions Config */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Custom Pre-Screening Questions
                </label>
                <p className="text-[10px] text-slate-500 font-medium">
                  Add questions candidate applicants must answer before submitting application.
                </p>
                
                <div className="space-y-2">
                  {screeningQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={q}
                        onChange={(e) => {
                          const updated = [...screeningQuestions];
                          updated[idx] = e.target.value;
                          setScreeningQuestions(updated);
                        }}
                        placeholder={`Question #${idx + 1}`}
                        className="flex-1 px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScreeningQuestions(screeningQuestions.filter((_, i) => i !== idx));
                        }}
                        className="p-2 rounded-xl bg-red-950/45 border border-red-500/20 text-red-400 hover:bg-red-900 transition shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setScreeningQuestions([...screeningQuestions, ''])}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow shadow-primary-500/20 transition"
                >
                  {selectedJob ? 'Save Changes' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Candidate Job Detail Modal */}
      {/* ======================================================== */}
      {showDetailModal && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in bg-dark-950">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-200 truncate">{selectedJob.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedJob.companyId?.companyName || 'TF Organization'}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {applyError && (
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{applyError}</span>
                </div>
              )}

              {/* Meta tags */}
              <div className="grid grid-cols-3 gap-3 bg-dark-900/40 p-3.5 rounded-xl border border-slate-800/80 text-center text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Location</span>
                  <span className="text-slate-300 font-semibold flex items-center justify-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedJob.location || 'Remote'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Salary</span>
                  <span className="text-slate-300 font-semibold flex items-center justify-center gap-0.5"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> {selectedJob.salaryRange || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Experience</span>
                  <span className="text-slate-300 font-semibold">{selectedJob.experienceRequired || 'Entry'}</span>
                </div>
              </div>

              {/* JD description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Job Description</h4>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {/* Skills required */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skillsRequired.map((s, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded bg-primary-950/20 text-primary-400 text-xs font-semibold border border-primary-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom Screening Questionnaire */}
              {!isRecruiter && selectedJob.screeningQuestions && selectedJob.screeningQuestions.length > 0 && (
                <div className="space-y-3.5 pt-4 border-t border-slate-800/40">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-primary-400" /> Screening Questionnaire
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">Please answer the questions below to submit with your application profile:</p>
                  
                  {screeningAnswers.map((sa, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        {idx + 1}. {sa.question}
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={sa.answer}
                        onChange={(e) => {
                          const updated = [...screeningAnswers];
                          updated[idx] = { ...updated[idx], answer: e.target.value };
                          setScreeningAnswers(updated);
                        }}
                        placeholder="Type your response answer here..."
                        className="w-full px-4 py-2 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Apply panel */}
            <div className="p-4 border-t border-slate-800 bg-dark-950/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyToJob(selectedJob._id)}
                disabled={applying}
                className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow shadow-primary-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {applying ? 'Applying...' : 'Apply with Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
