import express, { Request, Response } from "express";
import multer from "multer";

// Assuming `AttachmentRequest` and `AttachmentResponse` types are defined and imported correctly
import { AttachmentRequest, AttachmentResponse, BlobUuid } from "../models/types/attachments"; // Adjust the import path as necessary

const app = express();
const upload = multer({ dest: "uploads/" }); // Configure multer as needed

// Route for creating an attachment
app.post(
  "/attachments",
  upload.single("file"),
  (req: Request<never, AttachmentResponse, AttachmentRequest>, res: Response<AttachmentResponse>) => {
    console.log("File uploaded:", req.file); // `req.file` is the uploaded file information

    // Assuming you process the file and generate a response similar to `AttachmentResponse`
    const response: AttachmentResponse = {
      blobUuid: "generated-uuid-for-the-file", // Generate or retrieve this value as needed
      uploadDate: new Date().toISOString(),
    };
    res.status(201).json(response);
  }
);

// Route for retrieving an attachment by UUID
app.get("/attachments/:blobUuid", (req: Request<{ blobUuid: BlobUuid }>, res: Response) => {
  const { blobUuid } = req.params;
  console.log("Fetching attachment with UUID:", blobUuid);

  res.status(200).send("File data here"); // Replace with actual file response logic
});
