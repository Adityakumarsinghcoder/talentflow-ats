import Message from '../models/Message.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !text) {
      return res.status(400).json({ message: 'Receiver ID and text are required' });
    }

    // Candidate strict chat constraints
    if (req.user.role === 'CANDIDATE') {
      const applications = await Application.find({ candidateId: senderId }).populate('jobId');
      const hasValidApplication = applications.some(app => {
        if (!app.jobId) return false;
        const recruiterIdStr = app.jobId.recruiterId ? app.jobId.recruiterId.toString() : '';
        return recruiterIdStr === receiverId.toString() && app.currentStage !== 'APPLIED';
      });

      if (!hasValidApplication) {
        return res.status(403).json({ message: 'Access denied: You can only chat with recruiters of jobs where you have cleared at least one round.' });
      }

      // Verify that recruiter has initiated/replied to candidate first
      const recruiterInitiated = await Message.findOne({ senderId: receiverId, receiverId: senderId });
      if (!recruiterInitiated) {
        return res.status(403).json({ message: 'Access denied: You can only message recruiters who have initiated contact with you first.' });
      }
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text,
    });

    // Simulated sandbox auto-reply from Recruiter to Candidate
    if (req.user.role === 'CANDIDATE') {
      const recruiter = await User.findById(receiverId);
      if (recruiter && (recruiter.role === 'RECRUITER' || recruiter.role === 'COMPANY_ADMIN')) {
        // Schedule a mock response in 2 seconds
        setTimeout(async () => {
          try {
            const replies = [
              "Hi there! Thanks for reaching out. I've received your message and will review your profile shortly.",
              "Hello! Thanks for follow-up. Let me check the schedule options with the team and get back to you.",
              "Hi! Your application matching score looks solid. I am looking forward to our scheduled session.",
              "Thank you for the message. I will sync with the hiring team and keep you updated on next steps."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            await Message.create({
              senderId: receiverId,
              receiverId: senderId,
              text: randomReply,
            });
          } catch (err) {
            console.error('Failed to create mock automated reply:', err.message);
          }
        }, 2000);
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error sending message', error: error.message });
  }
};

// @desc    Get messages thread between two users
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;

    // Find all messages where (sender is me and receiver is other) OR (sender is other and receiver is me)
    const allMsgs = await Message.find({});
    const thread = allMsgs.filter(m => 
      (m.senderId.toString() === myId.toString() && m.receiverId.toString() === otherId.toString()) ||
      (m.senderId.toString() === otherId.toString() && m.receiverId.toString() === myId.toString())
    );

    // Sort by date/createdAt
    thread.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(thread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving messages', error: error.message });
  }
};

// @desc    Get chat partners list
// @route   GET /api/messages/partners
// @access  Private
export const getChatPartners = async (req, res) => {
  try {
    const myId = req.user.id;
    const myRole = req.user.role;

    let partnerIds = new Set();

    if (myRole === 'CANDIDATE') {
      // Get all applications candidate submitted
      const applications = await Application.find({ candidateId: myId }).populate('jobId');
      
      // Find all messages received by candidate to see which recruiters have initiated contact
      const receivedMessages = await Message.find({ receiverId: myId });
      const recruitersWhoMessaged = new Set(receivedMessages.map(m => m.senderId.toString()));

      for (const app of applications) {
        if (app.jobId && app.jobId.recruiterId) {
          const recruiterIdStr = app.jobId.recruiterId.toString();
          // Candidate cleared a round (stage is not 'APPLIED') AND recruiter has sent them a message
          const hasClearedRound = app.currentStage !== 'APPLIED';
          const hasRecruiterMessaged = recruitersWhoMessaged.has(recruiterIdStr);

          if (hasClearedRound && hasRecruiterMessaged) {
            partnerIds.add(recruiterIdStr);
          }
        }
      }
    } else {
      // Recruiter/Admin - get all candidates who applied to their jobs
      const companyId = req.user.companyId;
      const jobs = await Job.find({ companyId });
      const jobIds = jobs.map(j => j._id.toString());

      const allApps = await Application.find({});
      const companyApps = allApps.filter(app => {
        const jId = app.jobId._id ? app.jobId._id.toString() : app.jobId.toString();
        return jobIds.includes(jId);
      });

      for (const app of companyApps) {
        if (app.candidateId) {
          const candIdStr = app.candidateId._id ? app.candidateId._id.toString() : app.candidateId.toString();
          partnerIds.add(candIdStr);
        }
      }
    }

    // Load user objects for these partners
    const partnersArray = Array.from(partnerIds);
    let users = [];
    if (partnersArray.length > 0) {
      users = await User.find({ _id: { $in: partnersArray } }).select('-password');
    } else {
      // Fallback: If no applications exist yet, return other roles for demo purposes
      const allUsers = await User.find({});
      if (myRole === 'CANDIDATE') {
        users = allUsers.filter(u => u.role === 'COMPANY_ADMIN' || u.role === 'RECRUITER');
      } else {
        users = allUsers.filter(u => u.role === 'CANDIDATE');
      }
    }

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching chat partners', error: error.message });
  }
};
