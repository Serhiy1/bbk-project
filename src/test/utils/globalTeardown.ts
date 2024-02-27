import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

export = async function globalTeardown() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE;
  await mongoose.disconnect();
  await instance.stop();
};
