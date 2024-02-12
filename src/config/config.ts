import { GetEnvValue } from "../app/utils/utils";

export const JWTSignKey = GetEnvValue("JWTKey");
export const connectionString = GetEnvValue("MongoConnectionString");
