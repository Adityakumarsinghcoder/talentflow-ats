import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import Resume from '../src/models/Resume.js';
import Interview from '../src/models/Interview.js';
import Feedback from '../src/models/Feedback.js';

// Setup environment for testing
import dotenv from 'dotenv';
dotenv.config();
process.env.PORT = '5001'; // use separate port for test

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting TalentFlow ATS Backend Integration Verification...\n');
  await connectDB();
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failedCount++;
    }
  };

  try {
    // ----------------------------------------------------
    // Test 1: User Registration (COMPANY_ADMIN) & Tenant Onboarding
    // ----------------------------------------------------
    console.log('--- TEST 1: Registering Company Admin & Onboarding Company ---');
    const adminEmail = `admin_${Date.now()}@talentflow.com`;
    const regAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Admin',
        email: adminEmail,
        password: 'password123',
        role: 'COMPANY_ADMIN',
        companyName: 'InnoTech Solutions',
        industry: 'Software Development',
        website: 'https://innotech.io',
      }),
    });
    const regAdmin = await regAdminRes.json();
    assert(regAdminRes.status === 201, 'Response status should be 201 Created');
    assert(regAdmin._id && regAdmin.companyId, 'Admin registered with ID and Company ID references');
    
    const adminToken = regAdmin.accessToken;

    // ----------------------------------------------------
    // Test 2: User Login
    // ----------------------------------------------------
    console.log('\n--- TEST 2: User Login Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Response status should be 200 OK');
    assert(loginData.accessToken && loginData.refreshToken, 'Tokens generated successfully');

    // ----------------------------------------------------
    // Test 3: Create Job Listing (Protected by RBAC)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Create Job Postings ---');
    const jobRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Full Stack React Engineer',
        description: 'Looking for a React developer with Node and TypeScript experience.',
        skillsRequired: 'React, Node, TypeScript, MongoDB',
        salaryRange: '$110k - $130k',
        experienceRequired: '2 years',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        openings: 2,
      }),
    });
    const job = await jobRes.json();
    assert(jobRes.status === 201, 'Response status should be 201 Created');
    assert(job._id && job.status === 'OPEN', 'Job created with status OPEN');

    // ----------------------------------------------------
    // Test 4: Register Candidate
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Candidate Registration ---');
    const candidateEmail = `cand_${Date.now()}@talentflow.com`;
    const regCandRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Developer',
        email: candidateEmail,
        password: 'password123',
        role: 'CANDIDATE',
      }),
    });
    const candidate = await regCandRes.json();
    assert(regCandRes.status === 201, 'Response status should be 201 Created');
    assert(candidate._id && candidate.role === 'CANDIDATE', 'Candidate registered successfully');
    
    const candidateToken = candidate.accessToken;

    // ----------------------------------------------------
    // Test 5: Verify Mock Resume Setup & AI Parsing
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Verify Resume Profile Mocking ---');
    // Simulate candidate resume entry inside database
    const ResumeModel = (await import('../src/models/Resume.js')).default;
    const mockResume = await ResumeModel.create({
      candidateId: candidate._id,
      fileUrl: '/uploads/mock_resume.pdf',
      parsedData: {
        name: 'Alex Developer',
        email: candidateEmail,
        phone: '123-456-7890',
        skills: ['React', 'Node', 'TypeScript', 'Javascript', 'MongoDB', 'Python'],
        experience: '3 years',
        education: 'B.Tech in Computer Science',
      },
    });
    assert(mockResume._id, 'Mock Resume record created in database');

    // ----------------------------------------------------
    // Test 6: Apply to Job & Trigger Resume Matching Engine
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Job Application & Match Calculation ---');
    const appRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candidateToken}`,
      },
      body: JSON.stringify({
        jobId: job._id,
        source: 'LINKEDIN',
      }),
    });
    const application = await appRes.json();
    assert(appRes.status === 201, 'Response status should be 201 Created');
    assert(application._id && application.currentStage === 'APPLIED', 'Application created at APPLIED stage');
    
    // Formula weight check: Job requires React, Node, TypeScript, MongoDB (4 skills). Candidate has all 4 + Python (100% skills = 50 pts).
    // Experience required: 2 years. Candidate has 3 years (100% experience = 30 pts).
    // Education required: CS degree (B.Tech matches, giving 80% education = 16 pts).
    // Expected final score: 50 + 30 + 16 = 96% match.
    assert(application.aiScore >= 80, `Resume matching engine score calculated correctly (${application.aiScore}%)`);

    // ----------------------------------------------------
    // Test 7: Schedule Interview
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Schedule Interview ---');
    const interviewRes = await fetch(`${BASE_URL}/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        applicationId: application._id,
        interviewerId: regAdmin._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 45,
      }),
    });
    const interview = await interviewRes.json();
    assert(interviewRes.status === 201, 'Response status should be 201 Created');
    assert(interview.meetingLink && interview.meetingLink.includes('meet.google.com'), 'Interview scheduled with Google Meet link');

    // Verify stage promoted
    const checkAppRes = await fetch(`${BASE_URL}/applications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const adminApps = await checkAppRes.json();
    const updatedApp = adminApps.find(a => a._id === application._id);
    assert(updatedApp && updatedApp.currentStage === 'INTERVIEW', 'Application stage promoted to INTERVIEW automatically');

    // ----------------------------------------------------
    // Test 8: Submit Interview Scorecard Feedback
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Submit Competency Scorecard ---');
    const feedbackRes = await fetch(`${BASE_URL}/interviews/${interview._id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        technicalScore: 9,
        communicationScore: 8,
        cultureFitScore: 8,
        comments: 'Excellent core React skills, good system design communication.',
        recommendation: 'HIRE',
      }),
    });
    const feedback = await feedbackRes.json();
    assert(feedbackRes.status === 201, 'Response status should be 201 Created');
    assert(feedback._id && feedback.recommendation === 'HIRE', 'Scorecard feedback submitted successfully');

    // ----------------------------------------------------
    // Test 9: Fetch Analytics
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Recruiter Dashboard Analytics ---');
    const analyticsRes = await fetch(`${BASE_URL}/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const analytics = await analyticsRes.json();
    assert(analyticsRes.status === 200, 'Response status should be 200 OK');
    assert(analytics.metrics.totalCandidates > 0, 'Dashboard candidates count active');
    assert(analytics.funnel.INTERVIEW > 0, 'Funnel stages aggregates working');

    // ----------------------------------------------------
    // Test 10: Custom Screening Questions & Answers
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Custom Screening Questions & Answers ---');
    // 1. Create a job listing with screening questions configured
    const jobQuestionsRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Senior DevOps Architect',
        description: 'Design and support global production cloud solutions.',
        skillsRequired: 'Kubernetes, AWS, Terraform, Ansible',
        salaryRange: '$140k - $170k',
        experienceRequired: '5 years',
        location: 'Remote',
        employmentType: 'FULL_TIME',
        screeningQuestions: [
          'What is your experience running multi-region Kubernetes clusters?',
          'Have you managed large scale infrastructure using Terraform?'
        ]
      }),
    });
    const jobWithQ = await jobQuestionsRes.json();
    assert(jobQuestionsRes.status === 201, 'DevOps Job with screening questions created successfully');

    // 2. Candidate tries to apply WITHOUT screening answers (should fail)
    const appFailRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candidateToken}`,
      },
      body: JSON.stringify({
        jobId: jobWithQ._id,
        source: 'CAREER_PORTAL'
      }),
    });
    const appFail = await appFailRes.json();
    assert(appFailRes.status === 400, 'Candidate application fails with 400 when missing answers');
    assert(appFail.message.includes('Screening questions must be answered') || appFail.message.includes('must be answered'), 'Failure error message matches expected questionnaire requirements');

    // 3. Candidate applies WITH screening answers (should succeed)
    const appSuccessRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candidateToken}`,
      },
      body: JSON.stringify({
        jobId: jobWithQ._id,
        source: 'CAREER_PORTAL',
        screeningAnswers: [
          { question: 'What is your experience running multi-region Kubernetes clusters?', answer: 'Managed 3 production EKS clusters across US/EU regions' },
          { question: 'Have you managed large scale infrastructure using Terraform?', answer: 'Yes, styled via Terragrunt across 20+ envs' }
        ]
      }),
    });
    const appSuccess = await appSuccessRes.json();
    assert(appSuccessRes.status === 201, 'Candidate application succeeds with 201 when answers are submitted');
    assert(appSuccess.screeningAnswers && appSuccess.screeningAnswers.length === 2, 'Candidate screening answers saved inside application schema');

    // ----------------------------------------------------
    // Test 11: Direct Messaging Center
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Direct Messaging Threads & Simulated Bot Responses ---');
    // 1. Recruiter sends message to candidate first (since candidate is in INTERVIEW stage)
    const adminMsgRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        receiverId: candidate._id,
        text: 'Hi Alex, I saw your application. Let us connect!'
      }),
    });
    assert(adminMsgRes.status === 201, 'Recruiter initiated message successfully');

    // 2. Candidate replies to the Recruiter
    const msgRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candidateToken}`,
      },
      body: JSON.stringify({
        receiverId: regAdmin._id,
        text: 'Hello, is this position still open and accepting remote candidates?'
      }),
    });
    const msg = await msgRes.json();
    assert(msgRes.status === 201, 'Candidate reply submitted successfully');
    assert(msg.text === 'Hello, is this position still open and accepting remote candidates?', 'Message content saved correctly');

    // 2. Retrieve Conversation threads
    const partnersRes = await fetch(`${BASE_URL}/messages/partners`, {
      headers: { 'Authorization': `Bearer ${candidateToken}` },
    });
    const partners = await partnersRes.json();
    assert(partnersRes.status === 200, 'Conversations list retrieved successfully');
    assert(partners.length > 0, 'Thread partner list includes admin contact profile');

    // 3. Retrieve conversation history
    const conversationRes = await fetch(`${BASE_URL}/messages/${regAdmin._id}`, {
      headers: { 'Authorization': `Bearer ${candidateToken}` },
    });
    const conversation = await conversationRes.json();
    assert(conversationRes.status === 200, 'Conversation history loaded successfully');
    assert(conversation.length >= 1, 'At least one message retrieved in thread');

    // ----------------------------------------------------
    // Test 12: Rubrics Scoring & Weighted Scorecard Evaluation
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Weighted Rubric Evaluation Scorecard ---');
    
    // Create an interview for the newly submitted DevOps application
    const devopsInterviewRes = await fetch(`${BASE_URL}/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        applicationId: appSuccess._id,
        interviewerId: regAdmin._id,
        date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        duration: 60,
      }),
    });
    const devopsInterview = await devopsInterviewRes.json();
    assert(devopsInterviewRes.status === 201, 'Interview scheduled for DevOps candidate');

    // 1. Submit feedback with incorrect rubric weights (e.g. weights sum to 90 instead of 100)
    const rubricsFailRes = await fetch(`${BASE_URL}/interviews/${devopsInterview._id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        recommendation: 'HIRE',
        comments: 'Outstanding DevOps credentials',
        rubrics: [
          { criterion: 'Kubernetes/Cloud Tech', score: 10, weight: 50 },
          { criterion: 'System Design', score: 9, weight: 40 }
        ]
      }),
    });
    const rubricsFail = await rubricsFailRes.json();
    assert(rubricsFailRes.status === 400, 'Submitting scorecard with incorrect weight sums fails with 400');
    assert(rubricsFail.message.includes('must sum to 100%'), 'Error message specifies weight sums constraint');

    // 2. Submit feedback with correct weights (weights sum to 100)
    const rubricsSuccessRes = await fetch(`${BASE_URL}/interviews/${devopsInterview._id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        recommendation: 'HIRE',
        comments: 'Outstanding DevOps credentials across all categories',
        rubrics: [
          { criterion: 'Kubernetes/Cloud Tech', score: 10, weight: 50 },
          { criterion: 'System Design', score: 9, weight: 30 },
          { criterion: 'Communication Skills', score: 8, weight: 20 }
        ]
      }),
    });
    const rubricsSuccess = await rubricsSuccessRes.json();
    assert(rubricsSuccessRes.status === 201, 'Submitting scorecard with 100% weight sum succeeds with 201');
    assert(rubricsSuccess.weightedAverage === 9.3, `Weighted average calculation matches expected arithmetic (Calculated: ${rubricsSuccess.weightedAverage})`);

    // ----------------------------------------------------
    // Test 13: Candidate Manual Profile Onboarding & Update
    // ----------------------------------------------------
    console.log('\n--- TEST 13: Candidate Manual Profile Onboarding & Update ---');
    const updateProfileRes = await fetch(`${BASE_URL}/resumes/my-resume`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${candidateToken}`,
      },
      body: JSON.stringify({
        name: 'Alex Developer (Manual)',
        email: candidateEmail,
        phone: '+1 999-999-9999',
        skills: 'React, Node.js, Typescript, AWS, Kubernetes',
        experience: '4 years',
        education: 'Master of Science in Computer Science'
      }),
    });
    const updateProfile = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, 'Profile details manual updates return 200 OK');
    assert(updateProfile.parsedData && updateProfile.parsedData.name === 'Alex Developer (Manual)', 'Extracted name updated in resume record');
    assert(updateProfile.parsedData.skills.includes('Kubernetes'), 'Comma-separated skills split into array properly');
    assert(updateProfile.parsedData.phone === '+1 999-999-9999', 'Phone number saved successfully');
    assert(updateProfile.parsedData.experience === '4 years', 'Experience level details saved successfully');

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log(`VERIFICATION SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
    console.log('======================================================');
    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error during verification run:', error);
    process.exit(1);
  }
}

runTests();
