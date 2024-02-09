import mongoose, { model, Schema } from "mongoose";

// 1. Create an interface representing a document in MongoDB.

interface IUser {
  _id: mongoose.Types.ObjectId;
  userName: string;
  email: string;
  passwordHash: string;
  tenancyId: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUser>({
  _id: { type: Schema.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  tenancyId: { type: Schema.Types.ObjectId, required: true },
});

export const User = model<IUser>("User", userSchema);

export function newUser(userInfo: IUser) {
  return new User(userInfo);
}

export interface UserTokenInfo {
  _id: mongoose.Types.ObjectId;
  userName: string;
  email: string;
  tenancyId: mongoose.Types.ObjectId;
}
