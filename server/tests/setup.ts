import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set test environment
if (process.env.NODE_ENV !== 'test') {
  (process.env as any).NODE_ENV = 'test';
}

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(uri);
});

afterAll(async () => {
  // Clean up and close connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  // Clean up data between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});