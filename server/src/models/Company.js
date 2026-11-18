import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    subscriptionPlan: {
      type: String,
      enum: ['FREE', 'GROWTH', 'ENTERPRISE'],
      default: 'FREE',
    },
    recruitersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseCompany = mongoose.model('Company', companySchema);
const MockCompany = new MockModel('Company');

const Company = process.env.USE_MOCK_DB === 'true' ? MockCompany : MongooseCompany;
export default Company;
