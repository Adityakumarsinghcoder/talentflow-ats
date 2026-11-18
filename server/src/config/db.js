import mongoose from 'mongoose';

const connectDB = async () => {
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('Using File-Based JSON Mock Database. Skip Mongoose connection.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talentflow_ats');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
