const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'canCreateJob',
    'canDeleteJob',
    'canManageCandidates',
    'canViewAnalytics',
    'canSubmitFeedback',
    'canViewInterviews',
  ],
  COMPANY_ADMIN: [
    'canCreateJob',
    'canDeleteJob',
    'canManageCandidates',
    'canViewAnalytics',
    'canSubmitFeedback',
    'canViewInterviews',
  ],
  RECRUITER: [
    'canCreateJob',
    'canDeleteJob',
    'canManageCandidates',
    'canViewAnalytics',
    'canSubmitFeedback',
    'canViewInterviews',
  ],
  INTERVIEWER: [
    'canSubmitFeedback',
    'canViewInterviews',
  ],
  CANDIDATE: [
    'canApply',
    'canTrackStatus',
  ],
};

const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ message: `Access denied: missing permission ${permission}` });
    }
  };
};

export const canCreateJob = hasPermission('canCreateJob');
export const canDeleteJob = hasPermission('canDeleteJob');
export const canManageCandidates = hasPermission('canManageCandidates');
export const canViewAnalytics = hasPermission('canViewAnalytics');
export const canSubmitFeedback = hasPermission('canSubmitFeedback');
export const canViewInterviews = hasPermission('canViewInterviews');
export const canApply = hasPermission('canApply');

export default hasPermission;
