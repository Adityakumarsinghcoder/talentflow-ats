import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
    },
    technicalScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    communicationScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    cultureFitScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    comments: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      enum: ['HIRE', 'MAYBE', 'REJECT'],
      required: true,
    },
    rubrics: [
      {
        criterion: { type: String, required: true },
        score: { type: Number, required: true, min: 1, max: 10 },
        weight: { type: Number, required: true, min: 0, max: 100 }, // in percent
      }
    ],
    weightedAverage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseFeedback = mongoose.model('Feedback', feedbackSchema);
const MockFeedback = new MockModel('Feedback');

const Feedback = process.env.USE_MOCK_DB === 'true' ? MockFeedback : MongooseFeedback;
export default Feedback;
