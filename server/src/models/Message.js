import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

import { MockModel } from './dbMock.js';

const MongooseMessage = mongoose.model('Message', messageSchema);
const MockMessage = new MockModel('Message');

const Message = process.env.USE_MOCK_DB === 'true' ? MockMessage : MongooseMessage;
export default Message;
