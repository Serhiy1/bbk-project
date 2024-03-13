import mongoose, { HydratedDocument, model, Schema } from "mongoose";

import { ServerError } from "../../errors/errors";
import { collaboratorsProject, collaboratorsRequest, collaboratorsResponse } from "../types/collaborators";

// declare internal field that extends CollaboratorResponse with a accepted field
type collaboratorInternal = {
  tenantID: mongoose.Types.ObjectId;
  friendlyName: string;
  accepted: boolean;
  // projects that the collaborator has shared
  projects: collaboratorsProject[];
};

interface relationshipManagerArgs {}

interface IRelationshipManager extends relationshipManagerArgs {
  _id: mongoose.Types.ObjectId;
  // declare participants map her, with the key being the participant id and the value being CollaboratorResponseInternal
  collaboratorsInfo: Map<mongoose.Types.ObjectId, collaboratorInternal>;
  collaborators: mongoose.Types.ObjectId[];
  // Combination of both collaborators tenant ID, put through a hash function
  // this is used for bi-directional searches
  collaboratorsHash: string;
}

interface relationshipManagerMethods {
  toCollaboratorResponse: (collaboratorTenantID: mongoose.Types.ObjectId) => collaboratorsResponse;

  // Returns if both collaborators have added each other
  status: () => string;

  // function when a collaborator adds back a collaborator
  acceptInvite: (OwnerTenantID: mongoose.Types.ObjectId, request: collaboratorsRequest) => Promise<void>;

  // function when a collaborator is deleted
  unAcceptInvite: (collaboratorTenantID: mongoose.Types.ObjectId) => Promise<void>;
}

interface relationshipManagerQueryHelpers {}

export type relationshipManagerDocument = HydratedDocument<IRelationshipManager, relationshipManagerMethods>;

interface relationshipManagerModel
  extends mongoose.Model<IRelationshipManager, relationshipManagerQueryHelpers, relationshipManagerMethods> {
  findByCollaborators: (
    collaboratorOneTenantID: mongoose.Types.ObjectId,
    collaboratorTwoTenantID: mongoose.Types.ObjectId
  ) => Promise<relationshipManagerDocument | null>;
  newRelationship: (
    collaboratorOneTenantID: mongoose.Types.ObjectId,
    owner_name: string,
    request: collaboratorsRequest
  ) => Promise<relationshipManagerDocument>;
}

const relationshipManagerSchema = new Schema<
  IRelationshipManager,
  relationshipManagerModel,
  relationshipManagerMethods
>({
  _id: { type: Schema.Types.ObjectId, required: true },
  collaboratorsInfo: { type: Map, of: { type: Object } },
  collaborators: [{ type: Schema.Types.ObjectId, required: true }],
  collaboratorsHash: { type: String, required: true },
});

relationshipManagerSchema.static(
  "findByCollaborators",
  async function findByCollaborators(
    collaboratorOneTenantID: mongoose.Types.ObjectId,
    collaboratorTwoTenantID: mongoose.Types.ObjectId
  ): Promise<relationshipManagerDocument | null> {
    const hash = collaboratorHash(collaboratorOneTenantID, collaboratorTwoTenantID);
    return this.findOne({ collaboratorsHash: hash });
  }
);

relationshipManagerSchema.static(
  "newRelationship",
  async function newRelationship(
    OwnerTenantID: mongoose.Types.ObjectId,
    owner_name: string,
    request: collaboratorsRequest
  ): Promise<relationshipManagerDocument> {
    const hash = collaboratorHash(OwnerTenantID, new mongoose.Types.ObjectId(request.tenantID));

    const collaboratorOneRequest = {
      tenantID: new mongoose.Types.ObjectId(request.tenantID),
      friendlyName: request.friendlyName,
      accepted: true,
      projects: [],
    };

    const collaboratorTwoRequest = {
      tenantID: OwnerTenantID,
      friendlyName: `Pending Request from ${owner_name}`,
      accepted: false,
      projects: [],
    };

    const collaboratorsMap: Map<mongoose.Types.ObjectId, collaboratorInternal> = new Map();
    collaboratorsMap.set(OwnerTenantID, collaboratorOneRequest);
    collaboratorsMap.set(new mongoose.Types.ObjectId(request.tenantID), collaboratorTwoRequest);

    const document = await this.create({
      _id: new mongoose.Types.ObjectId(),
      collaboratorsInfo: collaboratorsMap,
      collaborators: [OwnerTenantID, new mongoose.Types.ObjectId(request.tenantID)],
      collaboratorsHash: hash,
    });

    return document;
  }
);

relationshipManagerSchema.method("status", function status() {
  let status: boolean = true;

  // go through each collaborator and check if they have accepted
  this.collaboratorsInfo.forEach((collaborator) => {
    if (!collaborator.accepted) {
      status = false;
    }
  });

  // PENDING if false and ACCEPTED if status is true
  return status ? "ACTIVE" : "PENDING";
});

relationshipManagerSchema.method(
  "toCollaboratorResponse",
  function toCollaboratorResponse(collaboratorTenantID: mongoose.Types.ObjectId): collaboratorsResponse {
    // PENDING if false and ACCEPTED if status is true
    const ret_status = this.status() as "PENDING" | "ACTIVE";
    const internalResponse = this.collaboratorsInfo.get(collaboratorTenantID);

    if (!internalResponse) {
      throw new ServerError("Collaborator not found");
    }
    return {
      friendlyName: internalResponse.friendlyName,
      tenantID: internalResponse.tenantID.toString(),
      status: ret_status,
      projects: internalResponse.projects,
    };
  }
);

relationshipManagerSchema.method(
  "acceptInvite",
  function acceptInvite(AcceptingTenantID: mongoose.Types.ObjectId, request: collaboratorsRequest) {
    // update the collaboratorsInfo accept field and friendlyName field
    const collaboratorRequest = this.collaboratorsInfo.get(AcceptingTenantID);

    if (collaboratorRequest) {
      collaboratorRequest.accepted = true;
      collaboratorRequest.friendlyName = request.friendlyName;
      this.collaboratorsInfo.set(AcceptingTenantID, collaboratorRequest);
      this.markModified("collaboratorsInfo");
      this.save();
    }
  }
);

relationshipManagerSchema.method(
  "unAcceptInvite",
  async function unAcceptInvite(OwnerTenantID: mongoose.Types.ObjectId) {
    // Get the collaborator from the collaboratorsInfo map
    const collaborator = this.collaboratorsInfo.get(OwnerTenantID);

    if (collaborator) {
      collaborator.accepted = false;
      this.collaboratorsInfo.set(OwnerTenantID, collaborator);
      this.markModified("collaboratorsInfo");
      await this.save();
    }
  }
);

export const RelationshipManager = model<IRelationshipManager, relationshipManagerModel>(
  "RelationshipManager",
  relationshipManagerSchema
);

/* create a uniq string from the two participants without needing to worry about argument order */
export function collaboratorHash(
  collaboratorOneTenantID: mongoose.Types.ObjectId,
  collaboratorTwoTenantID: mongoose.Types.ObjectId
): string {
  // convert the IDs to strings and sort them alphabetically
  const sortedIDs = [collaboratorOneTenantID.toString(), collaboratorTwoTenantID.toString()].sort();

  // concatenate them
  const concatenatedIDs = sortedIDs[0] + sortedIDs[1];

  // return the hash
  return concatenatedIDs;
}
