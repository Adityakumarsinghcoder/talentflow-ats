import fs from 'fs';
import path from 'path';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Interview from '../models/Interview.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get recruiter dashboard analytics
// @route   GET /api/analytics
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const getRecruiterAnalytics = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // 1. Fetch Company Jobs
    const jobs = await Job.find({ companyId });
    const openJobsCount = jobs.filter(j => j.status === 'OPEN').length;
    const jobIds = jobs.map(j => j._id.toString());

    // 2. Fetch Applications for these jobs
    const allApps = await Application.find({});
    // Filter by company jobs
    const companyApps = allApps.filter(app => {
      if (!app.jobId) return false;
      const appIdStr = app.jobId._id ? app.jobId._id.toString() : app.jobId.toString();
      return jobIds.includes(appIdStr);
    });
    const totalCandidates = companyApps.length;

    // 3. Count stages
    const funnel = {
      APPLIED: 0,
      SCREENING: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      OFFERED: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    
    const sources = {};
    const monthlyData = {};

    companyApps.forEach(app => {
      // Funnel
      if (funnel[app.currentStage] !== undefined) {
        funnel[app.currentStage]++;
      }

      // Source
      const source = app.source || 'CAREER_PORTAL';
      sources[source] = (sources[source] || 0) + 1;

      // Monthly Grouping
      const date = new Date(app.appliedDate);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });

    // 4. Interviews today
    const allInterviews = await Interview.find({});
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const companyInterviews = allInterviews.filter(inv => {
      const isDateToday = new Date(inv.date) >= startOfToday && new Date(inv.date) <= endOfToday;
      
      // Check if interview belongs to company application
      const isCompanyApp = originalAppIdMatches(inv.applicationId, jobIds);
      return isDateToday && isCompanyApp;
    });

    const interviewsTodayCount = companyInterviews.length;

    // 5. Offers and Hiring Rate
    const offersSentCount = companyApps.filter(app => ['OFFERED', 'HIRED'].includes(app.currentStage)).length;
    const hiredCount = companyApps.filter(app => app.currentStage === 'HIRED').length;
    const hiringRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

    res.json({
      metrics: {
        openJobs: openJobsCount,
        totalCandidates,
        interviewsToday: interviewsTodayCount,
        offersSent: offersSentCount,
        hiringRate, // in %
      },
      funnel,
      sources,
      monthly: monthlyData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving analytics data', error: error.message });
  }
};

// Helper: check if interview's applicationId matches company jobIds
const originalAppIdMatches = (appId, companyJobIds) => {
  try {
    if (!appId) return false;
    const file = path.resolve('src/.data/applications.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const appIdStr = appId._id ? appId._id.toString() : appId.toString();
      const found = data.find(d => d._id.toString() === appIdStr);
      if (found && found.jobId) {
        const jobIdStr = found.jobId._id ? found.jobId._id.toString() : found.jobId.toString();
        return companyJobIds.includes(jobIdStr);
      }
    }
  } catch (e) {
    // ignore
  }
  return false;
};

// @desc    Get activity logs for the recruiter's company
// @route   GET /api/analytics/activity-logs
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const getActivityLogs = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const logs = await ActivityLog.find({})
      .populate('userId', 'name email role companyId')
      .sort({ createdAt: -1 });

    const companyLogs = logs.filter(log => {
      if (!log.userId) return false;
      const userCompId = log.userId.companyId ? log.userId.companyId._id ? log.userId.companyId._id.toString() : log.userId.companyId.toString() : null;
      return userCompId && userCompId === companyId.toString();
    });

    res.json(companyLogs.slice(0, 50));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving activity logs', error: error.message });
  }
};
