import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 45, // default duration in minutes
    },
    meetingLink: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseInterview = mongoose.model('Interview', interviewSchema);
const MockInterview = new MockModel('Interview');

const Interview = process.env.USE_MOCK_DB === 'true' ? MockInterview : MongooseInterview;
export default Interview;
