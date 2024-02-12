import http from "http";

import { connectionString } from "../config/config";
import { app } from "./app";
import { connectToDatabase } from "./utils/utils";

connectToDatabase(connectionString);

const port = process.env.PORT || 3001;

const server = http.createServer(app);
console.log(`listening on port ${port}`);
server.listen(port);
