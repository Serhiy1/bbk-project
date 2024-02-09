import { components } from "../openapi/applications";

export type ApplicationResponse = components["schemas"]["ApplicationResponse"];
export type ApplicationID = { appID: components["schemas"]["UUID"] };
