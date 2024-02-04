import http from "http";

import { app } from "./app";
import { connectToDatabase, GetEnvValue } from "./utils/utils";

const connectionString = GetEnvValue("MongoConnectionString");
connectToDatabase(connectionString);

const port = process.env.PORT || 3001;

const server = http.createServer(app);
console.log(`listening on port ${port}`);
server.listen(port);
