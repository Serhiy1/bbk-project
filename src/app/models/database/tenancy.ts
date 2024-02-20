import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import { UserInputError } from "../../errors/errors";
import { collaboratorsRequest, collaboratorsResponse } from "../types/collaborators";
import { CollaboratorsResponse, ProjectResponse } from "../types/projects";
import { Project } from "./project";
import { RelationshipManager } from "./relationshipManager";

// Declare the attributes of the model
interface ITenancy {
  _id: mongoose.Types.ObjectId;
  projects: mongoose.Types.ObjectId[];
  relationships: mongoose.Types.ObjectId[];
  sharedProjects: mongoose.Types.ObjectId[];
}

// declare the methods of the model
interface ITenancyMethods {
  ListProjects: () => Promise<ProjectResponse[]>;
  AssertProjectInTenancy: (projectId: mongoose.Types.ObjectId) => Promise<boolean>;
  ListOpenInvites: () => Promise<collaboratorsResponse[]>;
  ListPendingInvites: () => Promise<collaboratorsResponse[]>;
  AddCollaborator: (collaboratorTenancy: mongoose.Types.ObjectId) => Promise<collaboratorsResponse | null>;
  RemoveCollaborator: (collaboratorTenancy: mongoose.Types.ObjectId) => Promise<void>;
}

// Declare the byEmail Query helper
interface ITenancyQueryHelpers {
  // Keep Empty for now https://mongoosejs.com/docs/typescript/query-helpers.html
}

export type TenancyDocument = HydratedDocument<ITenancy, ITenancyMethods>;

// declare the Full Model along with any static methods
export interface ITenancyModel extends Model<ITenancy, ITenancyQueryHelpers, ITenancyMethods> {
  NewTenancy: () => Promise<HydratedDocument<ITenancy, ITenancyMethods>>;
}

// Create the schema
const TenancySchema = new Schema<ITenancy, ITenancyModel, ITenancyMethods>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projects: [{ type: Schema.Types.ObjectId, ref: Project, required: true }],
});

TenancySchema.static("NewTenancy", async function NewTenancy(): Promise<HydratedDocument<ITenancy, ITenancyMethods>> {
  return this.create({
    _id: new mongoose.Types.ObjectId(),
    projects: [],
  });
});

TenancySchema.method("ListProjects", async function ListProjects(): Promise<ProjectResponse[]> {
  const projectIDs = this.projects;

  // call toObject to convert the Mongoose Document to a plain JS object
  const projects = await Project.find({ _id: { $in: projectIDs } });
  const projectResponses: ProjectResponse[] = [];

  for (const project of projects) {
    projectResponses.push(project.ToProjectResponse());
  }

  return projectResponses;
});

/* Lists the invites the tenancy has sent but not yet accepted */
TenancySchema.method("ListPendingInvites", async function ListPendingInvites(): Promise<collaboratorsResponse[]> {
  const pendingInvites: collaboratorsResponse[] = [];

  for (const collaboratorID of this.relationships) {
    const collaborator = await RelationshipManager.findById(collaboratorID);

    if (collaborator == null) {
      continue;
    }

    // if the status is not pending, skip
    if (collaborator.status() !== "PENDING") {
      continue;
    }

    // if the current tenant has not accepted the invite, skip
    if (collaborator.collaberatorsInfo.get(this._id)?.accepted === true) {
      continue;
    }

    pendingInvites.push(collaborator.toCollaboratorResponse(this._id));
  }

  return pendingInvites;
});

/* Lists the invites the tenancy has received but not yet accepted */
TenancySchema.method("ListOpenInvites", async function ListOpenInvites(): Promise<collaboratorsResponse[]> {
  const openInvites: collaboratorsResponse[] = [];

  for (const collaboratorID of this.relationships) {
    const collaborator = await RelationshipManager.findById(collaboratorID);

    if (collaborator == null) {
      continue;
    }

    // if the status is not pending, skip
    if (collaborator.status() !== "PENDING") {
      continue;
    }

    // if the current tenant has not accepted the invite, skip
    if (collaborator.collaberatorsInfo.get(this._id)?.accepted === false) {
      openInvites.push(collaborator.toCollaboratorResponse(this._id));
    }
  }

  return openInvites;
});

TenancySchema.method(
  "AddCollaborator",
  async function AddCollaborator(collaberatorRequest: collaboratorsRequest): Promise<CollaboratorsResponse> {
    const otherTenancy = await Tenancy.findById(collaberatorRequest.tenantID);

    if (!otherTenancy) {
      throw new UserInputError("collaberator Tenant does not exist");
    }

    // check if there is an open invite
    let relationship = await RelationshipManager.findByCollaborators(
      this._id,
      new mongoose.Types.ObjectId(collaberatorRequest.tenantID)
    );

    if (relationship == null) {
      // if there is no open invite, create a new one
      relationship = await RelationshipManager.newRelationship(this._id, collaberatorRequest);
    } else {
      // if there is an open invite, accept it
      relationship.acceptInvite(collaberatorRequest);
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      this.relationships.push(relationship._id);
      otherTenancy.relationships.push(relationship._id);
      await relationship.save();
      await this.save();
      await session.commitTransaction();
    } catch (error) {
      session.abortTransaction();
      throw error;
    }

    return relationship.toCollaboratorResponse(this._id);
  }
);

TenancySchema.method(
  "removeCollaborator",
  async function RemoveCollaborator(collaboratorTenancy: mongoose.Types.ObjectId) {
    const relationship = await RelationshipManager.findByCollaborators(this._id, collaboratorTenancy);

    if (relationship == null) {
      throw new UserInputError("Collaborator does not exist");
    }

    relationship.collaberatorsInfo.set(this._id, {
      tenantID: this._id,
      friendlyName: "",
      accepted: false,
      projects: [],
    });

    await relationship.save();
  }
);

TenancySchema.method(
  "AssertProjectInTenancy",
  async function AssertProjectInTenancy(projectId: mongoose.Types.ObjectId): Promise<boolean> {
    return this.projects.includes(projectId);
  }
);

export const Tenancy = model<ITenancy, ITenancyModel>("Tenancy", TenancySchema);
