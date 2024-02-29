import { MongoMemoryServer } from "mongodb-memory-server";

export = async function globalSetup() {
  // it's needed in global space, because we don't want to create a new instance every test-suite
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).__MONGOINSTANCE = instance;
  process.env.MONGO_URI = uri;
};
