import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    skillsRequired: {
      type: [String],
      required: true,
      default: [],
    },
    salaryRange: {
      type: String,
      default: '',
    },
    experienceRequired: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE', 'INTERNSHIP'],
      default: 'FULL_TIME',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'DRAFT'],
      default: 'OPEN',
    },
    openings: {
      type: Number,
      default: 1,
    },
    screeningQuestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseJob = mongoose.model('Job', jobSchema);
const MockJob = new MockModel('Job');

const Job = process.env.USE_MOCK_DB === 'true' ? MockJob : MongooseJob;
export default Job;
