import mongoose, { model, Schema } from "mongoose";

import { EventRequest, EventResponse } from "../types/projects";

interface IEvent {
  eventId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
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

function newEvent(eventInfo: IEvent) {
  return new Event(eventInfo);
}
EventSchema.set("toObject", {
  transform(doc, ret) {
    const obj: EventResponse = {
      eventId: ret.eventId,
      eventDate: ret.eventDate,
      eventName: ret.eventName,
      eventType: ret.eventType,
      customMetaData: ret.customMetaData,
    };

    return obj;
  },
});

export function newEventFromRequest(eventInfo: EventRequest, projectId: mongoose.Types.ObjectId) {
  const customMetaData = (eventInfo?.customMetaData as { [key: string]: string }) || {};

  return newEvent({
    eventId: new mongoose.Types.ObjectId(),
    projectId: projectId,
    eventDate: new Date(),
    eventName: eventInfo.eventName,
    eventType: eventInfo.eventType,
    customMetaData: customMetaData,
    attachments: [],
  });
}
