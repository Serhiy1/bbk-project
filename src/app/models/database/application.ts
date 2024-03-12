/* Mongoose Object representing an App Registration that a someone can use to make */

import bcrypt from "bcrypt";
import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import { UserTokenInfo } from "../../utils/token";
import { ApplicationResponse } from "../types/applications";
import { UserDocument } from "./user";

interface IApplication {
  _id: mongoose.Types.ObjectId;
  tenancyId: mongoose.Types.ObjectId;
  OwnerEmail: string;
  appId: mongoose.Types.UUID;
  secret: mongoose.Types.UUID;
}

interface IApplicationMethods {
  toResponse: () => ApplicationResponse;
  rollSecret: () => Promise<ApplicationResponse>;
  toTokenInfo: () => UserTokenInfo;
  delete: () => Promise<void>;
  isOwner: (user: UserDocument) => boolean;
  passwordHash: string;
}

interface IApplicationQueryHelpers {
  // Keep Empty for now https://mongoosejs.com/docs/typescript/query-helpers.html
}

export type ApplicationDocument = HydratedDocument<IApplication, IApplicationMethods>;

interface IApplicationModel extends Model<IApplication, IApplicationQueryHelpers, IApplicationMethods> {
  NewApplication: (user: UserDocument) => Promise<ApplicationDocument>;
  findByAppId: (appId: mongoose.Types.UUID | string) => Promise<ApplicationDocument | null>;
}

const applicationSchema = new Schema<IApplication, IApplicationModel, IApplicationMethods, IApplicationQueryHelpers>({
  _id: { type: Schema.Types.ObjectId, required: true },
  appId: { type: Schema.Types.UUID, required: true },
  secret: { type: Schema.Types.UUID, required: true },
  tenancyId: { type: Schema.Types.ObjectId, required: true },
  OwnerEmail: { type: String, required: true },
});

applicationSchema.static(
  "NewApplication",
  async function NewApplication(user: UserDocument): Promise<ApplicationDocument> {
    const appInfo: IApplication = {
      _id: new mongoose.Types.ObjectId(),
      appId: new mongoose.Types.UUID(),
      secret: new mongoose.Types.UUID(),
      // info of the user who created it
      tenancyId: user.tenancyId,
      OwnerEmail: user.email,
    };
    return await this.create(appInfo);
  }
);

applicationSchema.static(
  "findByAppId",
  async function findByAppId(appId: mongoose.Types.UUID | string): Promise<ApplicationDocument | null> {
    // check if the appId is a string and validate it
    if (typeof appId === "string") {
      if (!mongoose.Types.UUID.isValid(appId)) {
        return null;
      }
    }

    return await this.findOne({ appId });
  }
);

applicationSchema.method("isOwner", function isOwner(user: UserDocument): boolean {
  return this.tenancyId.equals(user.tenancyId) && this.OwnerEmail === user.email;
});

applicationSchema.method("toResponse", function toResponse(): ApplicationResponse {
  return {
    appID: this.appId.toString(),
    secret: this.secret.toString(),
  };
});

applicationSchema.method("rollSecret", async function rollSecret(): Promise<ApplicationResponse> {
  this.secret = new mongoose.Types.UUID();
  await this.save();
  return this.toResponse();
});

applicationSchema.method("delete", async function deleteApp(): Promise<void> {
  await this.deleteOne({ _id: this._id });
});

applicationSchema.method("toTokenInfo", function toTokenInfo(): UserTokenInfo {
  return {
    UserId: this._id,
    email: this.OwnerEmail,
    tenancyId: this.tenancyId,
  };
});

applicationSchema.virtual("passwordHash").get(function () {
  return bcrypt.hashSync(this.secret.toString(), 10);
});

export const Application = model<IApplication, IApplicationModel>("Application", applicationSchema);
