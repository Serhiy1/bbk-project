import mongoose, { model, Schema } from "mongoose";

import { Project } from "./project";

interface ITenancy {
  _id: mongoose.Types.ObjectId;
  projects?: mongoose.Types.ObjectId[];
}

const TenancySchema = new Schema<ITenancy>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projects: [{ type: Schema.Types.ObjectId, ref: Project, required: false}],
});

export const Tenancy = model<ITenancy>("Tenancy", TenancySchema);

export function newTenancy(userInfo: ITenancy) {
  return new Tenancy(userInfo);
}
