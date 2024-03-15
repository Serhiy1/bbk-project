/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/public/projects": {
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
                /** @description List of all public projects */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProjectResponse"][];
                    };
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
    "/public/projects/{projectId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Public Project Overview */
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
                            events?: (components["schemas"]["EventResponse"] | components["schemas"]["ProjectDiffResponse"])[];
                        };
                    };
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
        patch?: never;
        trace?: never;
    };
    "/public/projects/{projectId}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** View all Events on a public project */
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
        patch?: never;
        trace?: never;
    };
    "/public/projects/{projectId}/events/{eventId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** View Single Event on a public project */
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
        ProjectCollaborator: {
            friendlyName: string;
            /** Format: uuid */
            tenantID: string;
        };
        ProjectResponse: {
            projectName: string;
            /** Format: uuid */
            projectId: string;
            /** Format: date */
            startedDate: string;
            customMetaData?: {
                [key: string]: string | undefined;
            };
            projectDescription?: string;
            /** @enum {string} */
            projectStatus: "ACTIVE" | "INACTIVE";
            ProjectCollaborators: components["schemas"]["ProjectCollaborator"][];
            public: boolean;
        };
        AttachmentRequest: {
            /** @description Name of the file */
            filename: string;
            /** @description File extension */
            extension: string;
            /**
             * Format: binary
             * @description Binary data of the file
             */
            file: string;
            hash: {
                /** @enum {string} */
                hashType?: "MD5" | "SHA1" | "SHA256";
                hashValue?: string;
            };
        };
        EventResponse: {
            /** Format: uuid */
            projectId: string;
            /** Format: uuid */
            eventId: string;
            /** Format: date */
            eventDate: string;
            eventName: string;
            eventType: string;
            eventCreator: components["schemas"]["ProjectCollaborator"];
            customMetaData?: {
                [key: string]: string | undefined;
            };
            attachments: components["schemas"]["AttachmentRequest"][];
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
            ProjectCollaborators?: {
                old?: string[];
                new?: string[];
            };
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
