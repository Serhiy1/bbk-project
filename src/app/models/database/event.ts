import mongoose, { HydratedDocument, model, Schema } from "mongoose";

import { EventRequest, EventResponse } from "../types/projects";
import { Project, ProjectDocument } from "./project";
import { Tenancy, TenancyDocument } from "./tenancy";

interface IEventArgs {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  eventDate: Date;
  eventName: string;
  eventType: string;
  customMetaData: { [key: string]: string };
  attachments: mongoose.Types.ObjectId[];
  // Can be owner or collaborator
  eventCreator: mongoose.Types.ObjectId;
}

interface IEvent extends IEventArgs {
  _id: mongoose.Types.ObjectId;
}

interface IEventMethods {
  ToEventResponse: () => Promise<EventResponse>;
  IspartOfProject: (projectId: ProjectDocument) => Promise<boolean>;
  IsVisibleToCollaborator: (collaboratorId: mongoose.Types.ObjectId) => boolean;
}

interface IEvenntQueryHelpers {}

export type EventDocument = HydratedDocument<IEvent, IEventMethods>;

interface IEventModel extends mongoose.Model<IEvent, IEvenntQueryHelpers, IEventMethods> {
  NewEventFromRequest: (
    eventInfo: EventRequest,
    projectId: ProjectDocument,
    tenant: TenancyDocument
  ) => Promise<EventDocument>;
}

const EventSchema = new Schema<IEvent, IEventModel>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projectId: { type: Schema.Types.ObjectId, required: true },
  eventDate: { type: Date, required: true },
  eventName: { type: String, required: true },
  eventType: { type: String, required: true },
  customMetaData: { type: Map, of: String },
  attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
  eventCreator: { type: Schema.Types.ObjectId, required: true },
});

EventSchema.static(
  "NewEventFromRequest",
  async function NewEventFromRequest(
    eventInfo: EventRequest,
    project: ProjectDocument,
    tenant: TenancyDocument
  ): Promise<EventDocument> {
    const customMetaData = (eventInfo?.customMetaData as { [key: string]: string }) || {};

    const eventObj: IEvent = {
      _id: new mongoose.Types.ObjectId(),
      projectId: project.ProjectId,
      eventDate: new Date(),
      eventName: eventInfo.eventName,
      eventType: eventInfo.eventType,
      customMetaData: customMetaData,
      attachments: [],
      eventCreator: tenant._id,
    };

    const event = await this.create(eventObj);

    // Prepare promises for updating all collaborators in parallel
    const updatePromises = project.collaborators.map(async (collaboratorId) => {
      const tenancy = await Tenancy.findById(collaboratorId);
      if (tenancy === null) {
        return null; // Skip this collaborator if not found
      }

      const projectToUpdate = await Project.FindByProjectId(project.ProjectId, tenancy);
      if (projectToUpdate === null) {
        return null; // Skip if the project is not found for this tenancy
      }

      projectToUpdate.events.push(eventObj._id);
      await projectToUpdate.save(); // Save the updated project document
    });

    // Execute all update operations in parallel
    await Promise.all(updatePromises);
    return event;
  }
);

EventSchema.method("ToEventResponse", async function ToEventResponse(): Promise<EventResponse> {
  const tenancy = await Tenancy.findById(this.eventCreator);
  let tenancyInfo: { friendlyName: string; tenantID: string };
  if (tenancy === null) {
    tenancyInfo = { friendlyName: "Unknown", tenantID: "Unknown" };
  } else {
    tenancyInfo = tenancy.toProjectCollaboratorResponse();
  }

  const obj: EventResponse = {
    eventId: this._id.toString(),
    projectId: this.projectId.toString(),
    eventDate: this.eventDate.toString(),
    eventName: this.eventName,
    eventType: this.eventType,
    customMetaData: this.customMetaData,
    eventCreator: tenancyInfo,
  };
  return obj;
});

EventSchema.method("IspartOfProject", async function IspartOfProject(project: ProjectDocument): Promise<boolean> {
  const IspartOfProject = project.events.includes(this._id);
  if (!IspartOfProject) {
    return false;
  }

  return true;
});

export const Event = model<IEvent, IEventModel>("Event", EventSchema);
