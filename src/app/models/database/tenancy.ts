import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import { ServerError, UserInputError } from "../../errors/errors";
import { collaboratorsRequest, collaboratorsResponse } from "../types/collaborators";
import { CollaboratorsResponse, ProjectResponse } from "../types/projects";
import { Project } from "./project";
import { RelationshipManager } from "./relationshipManager";

// Declare the attributes of the model
interface ITenancy {
  _id: mongoose.Types.ObjectId;
  projects: mongoose.Types.ObjectId[];
  relationships: mongoose.Types.ObjectId[];
}

// declare the methods of the model
interface ITenancyMethods {
  ListProjects: () => Promise<ProjectResponse[]>;
  AssertProjectInTenancy: (projectId: mongoose.Types.ObjectId) => Promise<boolean>;
  listActiveCollaborators: () => Promise<collaboratorsResponse[]>;
  ListOpenInvites: () => Promise<collaboratorsResponse[]>;
  ListPendingInvites: () => Promise<collaboratorsResponse[]>;
  AddCollaborator: (collaboratorTenancy: collaboratorsRequest) => Promise<collaboratorsResponse>;
  removeCollaborator: (collaboratorTenancy: mongoose.Types.ObjectId) => Promise<void>;
  findCollaborator: (collaboratorTenancy: mongoose.Types.ObjectId) => Promise<CollaboratorsResponse>;
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
  relationships: [{ type: Schema.Types.ObjectId, ref: RelationshipManager }],
});

TenancySchema.static("NewTenancy", async function NewTenancy(): Promise<HydratedDocument<ITenancy, ITenancyMethods>> {
  return this.create({
    _id: new mongoose.Types.ObjectId(),
    projects: [],
    relationships: [],
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

TenancySchema.method("listActiveCollaborators", async function listActiveCollaborators(): Promise<
  collaboratorsResponse[]
> {
  const activeCollaborators: collaboratorsResponse[] = [];

  for (const collaboratorID of this.relationships) {
    const collaborator = await RelationshipManager.findById(collaboratorID);

    if (collaborator == null) {
      continue;
    }
    if (collaborator.status() === "ACTIVE") {
      activeCollaborators.push(collaborator.toCollaboratorResponse(this._id));
    }
  }

  return activeCollaborators;
});

/* Lists the invites the tenancy has sent but not yet accepted */
TenancySchema.method("ListPendingInvites", async function ListPendingInvites(): Promise<collaboratorsResponse[]> {
  const pendingInvites: collaboratorsResponse[] = [];

  for (const collaboratorID of this.relationships) {
    const collaborator = await RelationshipManager.findById(collaboratorID);

    if (collaborator == null) {
      continue;
    }

    // if the current tenant has not accepted the invite, but the status is pending, that
    // means an invite has been sent but not yet accepted
    if (collaborator.collaberatorsInfo.get(this._id)?.accepted === true && collaborator.status() === "PENDING") {
      pendingInvites.push(collaborator.toCollaboratorResponse(this._id));
    }
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

    // if the current tenant has not accepted the invite, skip
    if (collaborator.collaberatorsInfo.get(this._id)?.accepted === false && collaborator.status() === "PENDING") {
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

    const session = await mongoose.startSession();
    session.startTransaction();

    if (relationship == null) {
      // if there is no open invite, create a new one
      relationship = await RelationshipManager.newRelationship(this._id, collaberatorRequest);
      this.relationships.push(relationship._id);
      otherTenancy.relationships.push(relationship._id);
    } else {
      // if there is an open invite, accept it
      relationship.acceptInvite(this.id, collaberatorRequest);
    }

    Promise.all([this.save(), otherTenancy.save()]);
    await session.commitTransaction();

    return relationship.toCollaboratorResponse(this._id);
  }
);

TenancySchema.method(
  "removeCollaborator",
  async function removeCollaborator(collaboratorTenancy: mongoose.Types.ObjectId) {
    const relationship = await RelationshipManager.findByCollaborators(this._id, collaboratorTenancy);

    if (relationship == null) {
      throw new UserInputError("unknown collaborator");
    }

    const collaberatorInfo = relationship.collaberatorsInfo.get(this._id);

    if (collaberatorInfo === undefined) {
      throw new ServerError("unknown collaborator");
    }

    collaberatorInfo.accepted = false;

    relationship.markModified("collaberatorsInfo");
    await relationship.save();
  }
);

TenancySchema.method(
  "findCollaborator",
  async function findCollaborator(collaboratorTenancy: mongoose.Types.ObjectId): Promise<CollaboratorsResponse> {
    const relationship = await RelationshipManager.findByCollaborators(this._id, collaboratorTenancy);

    if (relationship == null) {
      throw new UserInputError("unknown collaborator");
    }

    return relationship.toCollaboratorResponse(this._id);
  }
);

TenancySchema.method(
  "AssertProjectInTenancy",
  async function AssertProjectInTenancy(projectId: mongoose.Types.ObjectId): Promise<boolean> {
    return this.projects.includes(projectId);
  }
);

export const Tenancy = model<ITenancy, ITenancyModel>("Tenancy", TenancySchema);
