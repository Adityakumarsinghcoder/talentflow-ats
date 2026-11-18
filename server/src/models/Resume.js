import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    parsedData: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      skills: { type: [String], default: [] },
      experience: { type: String, default: '' },
      education: { type: String, default: '' },
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseResume = mongoose.model('Resume', resumeSchema);
const MockResume = new MockModel('Resume');

const Resume = process.env.USE_MOCK_DB === 'true' ? MockResume : MongooseResume;
export default Resume;
