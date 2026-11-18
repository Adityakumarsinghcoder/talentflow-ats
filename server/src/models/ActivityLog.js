import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseActivityLog = mongoose.model('ActivityLog', activityLogSchema);
const MockActivityLog = new MockModel('ActivityLog');

const ActivityLog = process.env.USE_MOCK_DB === 'true' ? MockActivityLog : MongooseActivityLog;
export default ActivityLog;
