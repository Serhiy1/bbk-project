import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";

import { ServerError, UserInputError } from "../../errors/errors";
import { collaboratorsRequest, collaboratorsResponse } from "../types/collaborators";
import { ProjectCollaborator, ProjectResponse } from "../types/projects";
import { Project } from "./project";
import { RelationshipManager } from "./relationshipManager";

// Declare the attributes of the model
interface ITenancy {
  _id: mongoose.Types.ObjectId;
  projects: mongoose.Types.ObjectId[];
  relationships: mongoose.Types.ObjectId[];
  companyName: string;
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
  findCollaborator: (collaboratorTenancy: mongoose.Types.ObjectId) => Promise<collaboratorsResponse>;
  CheckCollaboratorsAreActive: (collaborators: mongoose.Types.ObjectId[]) => Promise<boolean>;
  toProjectCollaboratorResponse: () => ProjectCollaborator;
}

// Declare the byEmail Query helper
interface ITenancyQueryHelpers {
  // Keep Empty for now https://mongoosejs.com/docs/typescript/query-helpers.html
}

export type TenancyDocument = HydratedDocument<ITenancy, ITenancyMethods>;

// declare the Full Model along with any static methods
export interface ITenancyModel extends Model<ITenancy, ITenancyQueryHelpers, ITenancyMethods> {
  NewTenancy: (companyName: string) => Promise<TenancyDocument>;
}

// Create the schema
const TenancySchema = new Schema<ITenancy, ITenancyModel, ITenancyMethods>({
  _id: { type: Schema.Types.ObjectId, required: true },
  projects: [{ type: Schema.Types.ObjectId, ref: Project, required: true }],
  companyName: { type: String, required: true },
  relationships: [{ type: Schema.Types.ObjectId, ref: RelationshipManager }],
});

TenancySchema.static("NewTenancy", async function NewTenancy(companyName: string): Promise<TenancyDocument> {
  return this.create({
    _id: new mongoose.Types.ObjectId(),
    projects: [],
    relationships: [],
    companyName: companyName,
  });
});

TenancySchema.method("ListProjects", async function ListProjects(): Promise<ProjectResponse[]> {
  // call toObject to convert the Mongoose Document to a plain JS object
  const FindProjectPromises = this.projects.map(async (projectId) => {
    const project = await Project.FindByProjectId(projectId, this);
    if (project == null) {
      throw new ServerError("Project not found");
    }
    return project;
  });

  const projects = await Promise.all(FindProjectPromises);

  const projectResponses: ProjectResponse[] = [];

  for (const project of projects) {
    projectResponses.push(await project.ToProjectResponse());
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

TenancySchema.method(
  "CheckCollaboratorsAreActive",
  async function CheckCollaboratorsAreActive(collaborators: mongoose.Types.ObjectId[]) {
    // Create a copy of the project for each new collaborator, while also checking
    const CheckPromises = collaborators.map(async (tenancyId) => {
      // Check if there is an active relationship between the collaborator and the project
      const relationship = await RelationshipManager.findByCollaborators(this._id, tenancyId);

      if (relationship === null) {
        throw new UserInputError(`Tenancy ${tenancyId} has not been added as a collaborator`);
      }

      if (relationship.status() !== "ACTIVE") {
        throw new UserInputError(`Tenancy ${tenancyId} has not accepted as a collaborator`);
      }
    });

    await Promise.all(CheckPromises);
  }
);

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
    if (collaborator.collaboratorsInfo.get(this._id)?.accepted === true && collaborator.status() === "PENDING") {
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
    if (collaborator.collaboratorsInfo.get(this._id)?.accepted === false && collaborator.status() === "PENDING") {
      openInvites.push(collaborator.toCollaboratorResponse(this._id));
    }
  }

  return openInvites;
});

TenancySchema.method(
  "AddCollaborator",
  async function AddCollaborator(collaboratorRequest: collaboratorsRequest): Promise<collaboratorsResponse> {
    const otherTenancy = await Tenancy.findById(collaboratorRequest.tenantID);

    if (!otherTenancy) {
      throw new UserInputError("collaborator Tenant does not exist");
    }

    // check if there is an open invite
    let relationship = await RelationshipManager.findByCollaborators(
      this._id,
      new mongoose.Types.ObjectId(collaboratorRequest.tenantID)
    );

    const session = await mongoose.startSession();
    session.startTransaction();

    if (relationship == null) {
      // if there is no open invite, create a new one
      relationship = await RelationshipManager.newRelationship(this._id, this.companyName, collaboratorRequest);
      this.relationships.push(relationship._id);
      otherTenancy.relationships.push(relationship._id);
    } else {
      // if there is an open invite, accept it
      relationship.acceptInvite(this.id, collaboratorRequest);
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

    const collaboratorInfo = relationship.collaboratorsInfo.get(this._id);

    if (collaboratorInfo === undefined) {
      throw new ServerError("unknown collaborator");
    }

    // Check for any active projects
    const checkPromises = this.projects.map(async (projectId) => {
      // find all projects that are with the collaborator
      const collaborator = await Tenancy.findById(collaboratorTenancy);
      if (collaborator == null) {
        return;
      }
      const project = await Project.FindByProjectId(projectId, collaborator);
      if (project == null) {
        return;
      }

      // if the the current tenant is the owner of the project, check that the collaborator is not active on the project
      if (project.OwnerTenancy.equals(this._id)) {
        if (project.collaborators.includes(collaboratorTenancy)) {
          throw new UserInputError(
            `collaborator is still active on project ${project.projectName}, id ${project.ProjectId}`
          );
        }
        return;
      }

      // else check that the current tenant is not active on the project
      if (project.collaborators.includes(this._id)) {
        throw new UserInputError(
          `you are still active on project ${project.projectName}, id ${project.ProjectId}, contact the owner to remove you`
        );
      }
    });

    await Promise.all(checkPromises);

    collaboratorInfo.accepted = false;

    relationship.markModified("collaboratorsInfo");
    await relationship.save();
  }
);

TenancySchema.method(
  "findCollaborator",
  async function findCollaborator(collaboratorTenancy: mongoose.Types.ObjectId): Promise<collaboratorsResponse> {
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

TenancySchema.method("toProjectCollaboratorResponse", function toProjectCollaboratorResponse(): ProjectCollaborator {
  return {
    tenantID: this._id.toString(),
    friendlyName: this.companyName,
  };
});

export const Tenancy = model<ITenancy, ITenancyModel>("Tenancy", TenancySchema);
