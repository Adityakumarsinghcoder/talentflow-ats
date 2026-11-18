import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice.js';
import RecruiterDashboard from './RecruiterDashboard.jsx';
import CandidateDashboard from './CandidateDashboard.jsx';

export default function Dashboard() {
  const user = useSelector(selectCurrentUser);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (user.role === 'CANDIDATE') {
    return <CandidateDashboard />;
  }

  // Default for COMPANY_ADMIN, RECRUITER, etc.
  return <RecruiterDashboard />;
}
