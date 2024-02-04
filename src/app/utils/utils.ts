import mongoose from "mongoose";

export function GetEnvValue(name: string): string {
  return (
    process.env[name] ||
    (() => {
      throw new Error(`${name} environment variables is not set`);
    })()
  );
}

export const connectToDatabase = (connectionString: string) => {
  mongoose.connect(connectionString);
};
