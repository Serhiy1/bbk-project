import mongoose, { HydratedDocument, model, Schema } from "mongoose";

import { EventRequest, EventResponse } from "../types/projects";

interface IEventArgs {
  _Id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  eventDate: Date;
  eventName: string;
  eventType: string;
  customMetaData: { [key: string]: string };
  attachments: mongoose.Types.ObjectId[];
}

interface IEvent extends IEventArgs {
  _id: mongoose.Types.ObjectId;
}

interface IEventMethods {
  ToEventResponse: () => EventResponse;
  IspartOfProject: (projectId: mongoose.Types.ObjectId) => boolean;
}

interface IEvenntQueryHelpers {}

export type EventDocument = HydratedDocument<IEvent, IEventMethods>;

interface IEventModel extends mongoose.Model<IEvent, IEvenntQueryHelpers, IEventMethods> {
  NewEventFromRequest: (eventInfo: EventRequest, projectId: mongoose.Types.ObjectId) => Promise<EventDocument>;
}

const EventSchema = new Schema<IEvent, IEventModel>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projectId: { type: Schema.Types.ObjectId, required: true },
  eventDate: { type: Date, required: true },
  eventName: { type: String, required: true },
  eventType: { type: String, required: true },
  customMetaData: { type: Map, of: String },
  attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
});

EventSchema.static(
  "NewEventFromRequest",
  async function NewEventFromRequest(
    eventInfo: EventRequest,
    projectId: mongoose.Types.ObjectId
  ): Promise<EventDocument> {
    const customMetaData = (eventInfo?.customMetaData as { [key: string]: string }) || {};
    return this.create({
      _id: new mongoose.Types.ObjectId(),
      projectId: projectId,
      eventDate: new Date(),
      eventName: eventInfo.eventName,
      eventType: eventInfo.eventType,
      customMetaData: customMetaData,
      attachments: [],
    });
  }
);

EventSchema.method("ToEventResponse", function ToEventResponse(): EventResponse {
  const obj: EventResponse = {
    eventId: this._id.toString(),
    projectId: this.projectId.toString(),
    eventDate: this.eventDate.toString(),
    eventName: this.eventName,
    eventType: this.eventType,
    customMetaData: this.customMetaData,
  };
  return obj;
});

EventSchema.method("IspartOfProject", function IspartOfProject(projectId: mongoose.Types.ObjectId): boolean {
  return this.projectId.equals(projectId);
});

export const Event = model<IEvent, IEventModel>("Event", EventSchema);
