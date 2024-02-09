import mongoose, { model, Schema } from "mongoose";

interface ITenancy {
  _id: mongoose.Types.ObjectId;
}

const TenancySchema = new Schema<ITenancy>({
  _id: { type: Schema.Types.ObjectId, required: true },
});

export const Tenancy = model<ITenancy>("Tenancy", TenancySchema);

export function newTenancy(userInfo: ITenancy) {
  return new Tenancy(userInfo);
}
