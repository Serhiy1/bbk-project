import { afterAll, beforeAll } from "@jest/globals";
import {jest} from '@jest/globals'
import mongoose from "mongoose";

jest.retryTimes(2)


beforeAll(async () => {
  await mongoose.connect(process.env["MONGO_URI"] as string);
});

afterAll(async () => {
  await mongoose.disconnect();
});
