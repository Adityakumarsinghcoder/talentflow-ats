import nodemailer from 'nodemailer';

const isEmailConfigured = 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASS && 
  !process.env.EMAIL_USER.includes('mock');

let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail', // Standard gmail or general SMTP
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Helper: send or simulate email dispatch
const sendMail = async ({ to, subject, html, text }) => {
  if (isEmailConfigured && transporter) {
    try {
      await transporter.sendMail({
        from: `"TalentFlow Recruitment" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`[EMAIL] Sent email successfully to ${to}. Subject: "${subject}"`);
      return true;
    } catch (error) {
      console.error('[EMAIL] Failed to send real email, logging simulation instead:', error.message);
    }
  }

  // Fallback Simulation Logger
  console.log(`
========================================================================
[SIMULATED EMAIL LOG]
TO: ${to}
SUBJECT: ${subject}
BODY TEXT: ${text}
------------------------------------------------------------------------
HTML CONTENT EMITTED (PREMIUM DESIGN TEMPLATE):
${html.substring(0, 400)}... (truncated for readability)
========================================================================
  `);
  return true;
};

// 1. Application Received Template
export const sendApplicationReceived = async (email, name, jobTitle) => {
  const subject = `Application Received: ${jobTitle} at TalentFlow`;
  const text = `Hi ${name},\n\nThank you for applying to the ${jobTitle} position! We have received your profile and our AI matching engine is currently reviewing it. We will notify you once a recruiter updates your status.\n\nBest regards,\nTalentFlow Hiring Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #cbd5e1; padding: 25px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h2 style="color: #6366f1; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">TalentFlow ATS</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for applying to the position of <strong>${jobTitle}</strong>!</p>
      <p>We have successfully received your application. Our recruitment team (and our matching engine) is evaluating your profile against the job criteria.</p>
      <p>You can track the progress of your application live in your TalentFlow Candidate Dashboard.</p>
      <br>
      <p style="font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 10px;">This is an automated notification from TalentFlow SaaS Platform.</p>
    </div>
  `;
  return await sendMail({ to: email, subject, text, html });
};

// 2. Interview Scheduled Template
export const sendInterviewScheduled = async (email, name, jobTitle, dateStr, meetingLink) => {
  const dateFormatted = new Date(dateStr).toLocaleString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const subject = `Interview Invitation: ${jobTitle} | TalentFlow`;
  const text = `Hi ${name},\n\nAn interview has been scheduled for the ${jobTitle} position.\nDate: ${dateFormatted}\nMeeting Link: ${meetingLink}\n\nPlease join on time.\n\nBest regards,\nTalentFlow Hiring Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #cbd5e1; padding: 25px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h2 style="color: #6366f1; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">Interview Invitation</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We are pleased to invite you for a virtual interview for the position of <strong>${jobTitle}</strong>.</p>
      <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #334155;">
        <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${dateFormatted}</p>
        <p style="margin: 0;"><strong>Virtual Meeting Link:</strong> <a href="${meetingLink}" style="color: #4f46e5; text-decoration: underline;">Join Google Meet</a></p>
      </div>
      <p>Please ensure you have a stable connection and join the meeting link 5 minutes prior to the schedule.</p>
      <br>
      <p style="font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 10px;">Best regards,<br>TalentFlow Hiring Team</p>
    </div>
  `;
  return await sendMail({ to: email, subject, text, html });
};

// 3. Offer Letter Template
export const sendOfferLetter = async (email, name, jobTitle, companyName) => {
  const subject = `Job Offer: ${jobTitle} at ${companyName} | TalentFlow`;
  const text = `Congratulations ${name}!\n\nWe are thrilled to offer you the position of ${jobTitle} at ${companyName}. Our hiring managers will follow up with the detailed offer package shortly.\n\nWelcome aboard!\n\nBest regards,\n${companyName} HR Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #cbd5e1; padding: 25px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h2 style="color: #10b981; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">Congratulations! 🎉</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We are delighted to extend a formal job offer for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>!</p>
      <p>The recruitment team was highly impressed by your qualifications and interview evaluations. We believe your skills will add immense value to our team.</p>
      <p>A representative from our Human Resources department will be in touch with you shortly to deliver your official employment agreement and onboarding package.</p>
      <p>Welcome to the team!</p>
      <br>
      <p style="font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 10px;">Best regards,<br>${companyName} HR Team</p>
    </div>
  `;
  return await sendMail({ to: email, subject, text, html });
};

// 4. Rejection Email Template
export const sendRejectionEmail = async (email, name, jobTitle) => {
  const subject = `Application Status Update: ${jobTitle}`;
  const text = `Dear ${name},\n\nThank you for your interest in the ${jobTitle} position at our company. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe appreciate the time you took to apply and wish you the best in your search.\n\nBest regards,\nHiring Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #cbd5e1; padding: 25px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h2 style="color: #ef4444; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">Application Update</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for taking the time to apply and interview for the position of <strong>${jobTitle}</strong>.</p>
      <p>Our team received many competitive profiles, and after careful consideration, we have decided to move forward with other candidates whose profiles align more closely with our immediate requirements.</p>
      <p>We appreciate your interest in our company and wish you success in your future professional endeavors.</p>
      <br>
      <p style="font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 10px;">Best regards,<br>Recruitment Team</p>
    </div>
  `;
  return await sendMail({ to: email, subject, text, html });
};
