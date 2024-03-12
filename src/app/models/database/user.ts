/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import { UserTokenInfo } from "../../utils/token";
import { UserResponse } from "../types/authentications";

// declare initialisation arguments
interface IUserArgs {
  email: string;
  passwordHash: string;
  tenancyId: mongoose.Types.ObjectId;
}

// Declare the attributes of the model
interface IUser extends IUserArgs {
  _id: mongoose.Types.ObjectId;
}

// Declare the methods of the model
interface IUserMethods {
  toTokenInfo: () => UserTokenInfo;
  toUserResponse: () => UserResponse;
}

// Declare the Query helper
interface IUserQueryHelpers {
  // Keep Empty for now https://mongoosejs.com/docs/typescript/query-helpers.html
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

// Declare the full model along with any static methods
interface IUserModel extends Model<IUser, IUserQueryHelpers, IUserMethods> {
  NewUser: (userInfo: IUserArgs) => Promise<UserDocument>;
  AlreadyExists: (email: string) => Promise<boolean>;
  FindByEmail: (email: string) => Promise<UserDocument | null>;
}

const userSchema = new Schema<IUser, IUserModel, IUserMethods, IUserQueryHelpers>({
  _id: { type: Schema.Types.ObjectId, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  tenancyId: { type: Schema.Types.ObjectId, required: true },
});

userSchema.static("FindByEmail", async function FindByEmail(email: string): Promise<UserDocument | null> {
  return this.findOne({ email });
});

userSchema.static("NewUser", async function NewUser(userInfo: IUserArgs): Promise<UserDocument> {
  return await this.create({
    _id: new mongoose.Types.ObjectId(),
    email: userInfo.email,
    passwordHash: userInfo.passwordHash,
    tenancyId: userInfo.tenancyId,
  });
});

userSchema.static("AlreadyExists", async function AlreadyExists(email: string): Promise<boolean> {
  const existingEmail = await this.findOne({ email });
  return !!existingEmail;
});

userSchema.method("toTokenInfo", function toTokenInfo(): UserTokenInfo {
  return {
    UserId: this._id,
    email: this.email,
    tenancyId: this.tenancyId,
  };
});

userSchema.method("toUserResponse", function toUserResponse(): UserResponse {
  return {
    tenantID: this.tenancyId.toString(),
    email: this.email,
  };
});

export const User = model<IUser, IUserModel>("User", userSchema);
