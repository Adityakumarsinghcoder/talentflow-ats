import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    currentStage: {
      type: String,
      enum: ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'],
      default: 'APPLIED',
    },
    source: {
      type: String,
      default: 'CAREER_PORTAL',
    },
    aiScore: {
      type: Number,
      default: 0, // Out of 100
    },
    screeningAnswers: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      }
    ],
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseApplication = mongoose.model('Application', applicationSchema);
const MockApplication = new MockModel('Application');

const Application = process.env.USE_MOCK_DB === 'true' ? MockApplication : MongooseApplication;
export default Application;
