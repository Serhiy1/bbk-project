/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/projects/{projectID}/Collaborators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Viewing Current collaborators on a project */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectID: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description List of project collaborators */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["collaboratorsResponse"][];
                    };
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Project ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /** Adding a Collaborator to a project */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectID: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        collaborator: string;
                    };
                };
            };
            responses: {
                /** @description Collaborator added to the project */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Project ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/projects/{projectID}/Collaborators/{collaboratorTenantId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Removing a collaborator from a project */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectID: string;
                    collaboratorTenantId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Collaborator removed from the project */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Cannot remove collaborator, still present on projects */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Collaborator or Project ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/Projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** View all projects */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description List of projects */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProjectResponse"][];
                    };
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /** Creating a project */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ProjectRequest"];
                };
            };
            responses: {
                /** @description Project created successfully */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProjectResponse"];
                    };
                };
                /** @description Validation error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/Projects/{projectId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Project Overview */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Project details with history and events */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            projectDetails?: components["schemas"]["ProjectResponse"];
                            diffs?: components["schemas"]["ProjectDiffResponse"][];
                            events?: components["schemas"]["EventResponse"][];
                        };
                    };
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Project ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Updating a project */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ProjectDiffRequest"];
                };
            };
            responses: {
                /** @description Project updated successfully */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProjectDiffResponse"];
                    };
                };
                /** @description Validation error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Project ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/Projects/{projectId}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** View all Events on a project */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description List of events for the project */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EventResponse"][];
                    };
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Project ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /** Create an event on a project */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["EventRequest"];
                };
            };
            responses: {
                /** @description Event created successfully */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EventResponse"];
                    };
                };
                /** @description Validation error */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Project ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/Projects/{projectId}/events/{eventId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** View Single Event */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: string;
                    eventId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Event details */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EventResponse"];
                    };
                };
                /** @description JWT authentication required */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Project ID or Event ID not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        collaboratorsResponse: {
            friendlyName?: string;
            /** Format: uuid */
            tenantID?: string;
            /** @enum {string} */
            status?: "PENDING" | "ACTIVE";
            projects?: {
                projectName: string;
                /** Format: uuid */
                projectID: string;
            }[];
        };
        ProjectResponse: {
            projectName?: string;
            /** Format: uuid */
            projectId?: string;
            /** Format: date */
            startedDate?: string;
            customMetaData?: {
                [key: string]: string | undefined;
            };
            projectDescription?: string;
            /** @enum {string} */
            projectStatus?: "ACTIVE" | "INACTIVE";
        };
        ProjectRequest: {
            projectName: string;
            projectDescription: string;
            /** @enum {string} */
            projectStatus: "ACTIVE" | "INACTIVE";
            customMetaData?: {
                [key: string]: string | undefined;
            };
        };
        ProjectDiffResponse: {
            projectName?: {
                old?: string;
                new?: string;
            };
            projectDescription?: {
                old?: string;
                new?: string;
            };
            projectStatus?: {
                /** @enum {unknown} */
                old?: "ACTIVE" | "INACTIVE";
                /** @enum {unknown} */
                new?: "ACTIVE" | "INACTIVE";
            };
            /** Format: uuid */
            projectCreator?: string;
            customMetaData?: {
                [key: string]: {
                    old?: string;
                    new?: string;
                } | undefined;
            };
        };
        AttachmentRequest: {
            attachmentName: string;
            /** Format: uuid */
            blobUuid: string;
        };
        EventResponse: {
            /** Format: uuid */
            eventId?: string;
            /** Format: date */
            eventDate?: string;
            eventName?: string;
            eventType?: string;
            customMetaData?: {
                [key: string]: string | undefined;
            };
            attachments?: components["schemas"]["AttachmentRequest"][];
        };
        ProjectDiffRequest: {
            projectName?: string;
            projectDescription?: string;
            /** @enum {string} */
            projectStatus?: "ACTIVE" | "INACTIVE";
            customMetaData?: {
                [key: string]: {
                    old?: string;
                    new?: string;
                } | undefined;
            };
        };
        EventRequest: {
            eventName: string;
            eventType: string;
            customMetaData?: {
                [key: string]: string | undefined;
            };
            attachments?: components["schemas"]["AttachmentRequest"][];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
