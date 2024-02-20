import mongoose, { HydratedDocument, model, Schema } from "mongoose";

import { ServerError } from "../../errors/errors";
import { collaboratorsProject, collaboratorsRequest, collaboratorsResponse } from "../types/collaborators";

// declare internal field that extebds CollaboratorResponse with a accpeted field
type collaboratorInternal = {
  tenantID: mongoose.Types.ObjectId;
  friendlyName: string;
  accepted: boolean;
  // projects that the collaberator has shared
  projects: collaboratorsProject[];
};

interface relationshipManagerArgs {}

interface IRelationshipManager extends relationshipManagerArgs {
  _id: mongoose.Types.ObjectId;
  // declare particpants map her, with the key being the participant id and the value being CollaboratorResponseInternal
  collaberatorsInfo: Map<mongoose.Types.ObjectId, collaboratorInternal>;
  collaberators: mongoose.Types.ObjectId[];
  // Combination of both collaberators tenant ID, put through a hash function
  // this is used for bi-directional searches
  collaberatorsHash: string;
}

interface relationshipManagerMethods {
  toCollaboratorResponse: (collaberatorTenantID: mongoose.Types.ObjectId) => collaboratorsResponse;

  // Returns if both collaberators have added each other
  status: () => string;

  // function when a collaberator adds back a collaberator
  acceptInvite: (request: collaboratorsRequest) => void;

  // function when a collaberator is deleted
  deleteCollaborator: (collaberatorTenantID: mongoose.Types.ObjectId) => void;
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
    request: collaboratorsRequest
  ) => Promise<relationshipManagerDocument>;
}

const relationshipManagerSchema = new Schema<IRelationshipManager, relationshipManagerModel, relationshipManagerMethods>({
  _id: { type: Schema.Types.ObjectId, required: true },
  collaberatorsInfo: { type: Map, of: { type: Object, required: true } },
  collaberators: [{ type: Schema.Types.ObjectId, required: true }],
  collaberatorsHash: { type: String, required: true },
});

relationshipManagerSchema.static(
  "findByCollaborators",
  async function findByCollaborators(
    collaboratorOneTenantID: mongoose.Types.ObjectId,
    collaboratorTwoTenantID: mongoose.Types.ObjectId
  ): Promise<relationshipManagerDocument | null> {
    const hash = collaboratorHash(collaboratorOneTenantID, collaboratorTwoTenantID);
    return this.findOne({ collaberatorsHash: hash });
  }
);

relationshipManagerSchema.static(
  "newRelationship",
  async function newRelationship(
    OwnerTenantID: mongoose.Types.ObjectId,
    request: collaboratorsRequest
  ): Promise<relationshipManagerDocument> {
    const hash = collaboratorHash(OwnerTenantID, new mongoose.Types.ObjectId(request.tenantID));

    // create the collaborator info of the first tenant from the request
    const collaberatorsInfo = {
      tenantID: OwnerTenantID,
      friendlyName: request.friendlyName,
      accepted: true,
      projects: [],
    };

    const document = await this.create({
      _id: new mongoose.Types.ObjectId(),
      collaberatorsInfo: new Map<mongoose.Types.ObjectId, collaboratorInternal>(),
      collaberators: [OwnerTenantID, new mongoose.Types.ObjectId(request.tenantID)],
      collaberatorsHash: hash,
    });

    document.collaberatorsInfo.set(OwnerTenantID, collaberatorsInfo);
    document.collaberatorsInfo.set(new mongoose.Types.ObjectId(request.tenantID), {
      tenantID: new mongoose.Types.ObjectId(request.tenantID),
      friendlyName: "",
      accepted: false,
      projects: [],
    });

    return document;
  }
);

relationshipManagerSchema.method("status", function status() {
  let status: boolean = true;

  for (const collaberatorTenantID in this.collaberators) {
    if (this.collaberatorsInfo.get(new mongoose.Types.ObjectId(collaberatorTenantID))?.accepted === false) {
      status = false;
      break;
    }
  }

  // PENDING if false and ACCEPTED if status is true
  return status ? "ACTIVE" : "PENDING";
});

relationshipManagerSchema.method(
  "toCollaboratorResponse",
  function toCollaboratorResponse(collaberatorTenantID: mongoose.Types.ObjectId): collaboratorsResponse {
    // PENDING if false and ACCEPTED if status is true
    const ret_status = this.status() as "PENDING" | "ACTIVE";
    const internalResponse = this.collaberatorsInfo.get(collaberatorTenantID);

    if (!internalResponse) {
      throw new ServerError("Collaberator not found");
    }
    return {
      friendlyName: internalResponse.friendlyName,
      tenantID: internalResponse.tenantID.toString(),
      status: ret_status,
      projects: internalResponse.projects,
    };
  }
);

relationshipManagerSchema.method("acceptInvite", function acceptInvite(request: collaboratorsRequest) {
  const collaberatorTenantID = new mongoose.Types.ObjectId(request.tenantID);

  // push the collaberator to the collaberators array
  this.collaberators.push(collaberatorTenantID);

  // add the collaberator to the collaberatorsInfo map
  this.collaberatorsInfo.set(collaberatorTenantID, {
    tenantID: collaberatorTenantID,
    friendlyName: request.friendlyName,
    accepted: true,
    projects: [],
  });
});

export const RelationshipManager = model<IRelationshipManager, relationshipManagerModel>("Event", relationshipManagerSchema);

/* create a uniqe string from the two participants without needing to worry about argument order */
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
