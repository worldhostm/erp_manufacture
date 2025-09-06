import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Set global Mongoose settings before connection
    mongoose.set('strictQuery', false);
    mongoose.set('sanitizeFilter', true);
    
    const conn = await mongoose.connect(mongoUri, {
      // Connection options for UTF-8 support
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    });

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during MongoDB shutdown:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};