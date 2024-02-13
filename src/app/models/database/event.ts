import mongoose, { model, Schema } from "mongoose";

interface IEvent {
  eventId: mongoose.Types.ObjectId;
  eventDate: Date;
  eventName: string;
  eventType: string;
  customMetaData: { [key: string]: string };
  attachments: mongoose.Types.ObjectId[];
}

const EventSchema = new Schema<IEvent>({
  eventId: { type: Schema.Types.ObjectId, required: true },
  eventDate: { type: Date, required: true },
  eventName: { type: String, required: true },
  eventType: { type: String, required: true },
  customMetaData: { type: Map, of: String },
  attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
});

export const Event = model<IEvent>("Event", EventSchema);

export function newEvent(eventInfo: IEvent) {
  return new Event(eventInfo);
}
