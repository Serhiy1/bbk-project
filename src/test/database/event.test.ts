import { expect, test } from "@jest/globals";
import mongoose from "mongoose";

import { Event, EventDocument } from "../../app/models/database/event";
import { CreateRandomEvent } from "../utils/utils";

test("test NewEventFromRequest Static Function", async () => {
  const eventdata = CreateRandomEvent();
  const projectID = new mongoose.Types.ObjectId();

  const event = await Event.NewEventFromRequest(eventdata, projectID);
  await event.save();

  // get the event from the database via id
  const eventFromDB = await Event.findById(event._id);

  // asseert that the result is not null
  expect(eventFromDB).not.toBeNull();

  // assert that the event has the correct properties
  expect(eventFromDB).toHaveProperty("eventDate");
  expect(eventFromDB).toHaveProperty("eventName", eventdata.eventName);
  expect(eventFromDB).toHaveProperty("eventType", eventdata.eventType);
  expect(eventFromDB).toHaveProperty("customMetaData");
  expect(eventFromDB).toHaveProperty("attachments");
  expect(eventFromDB).toHaveProperty("projectId", projectID);
});

test("ToEventResponse Method", async () => {
  const eventdata = CreateRandomEvent();
  const projectID = new mongoose.Types.ObjectId();

  const event = await Event.NewEventFromRequest(eventdata, projectID);
  await event.save();

  // get the event from the database via id
  const eventFromDB = await Event.findById(event._id);

  // asseert that the result is not null
  expect(eventFromDB).not.toBeNull();

  // assert that the event has the correct properties
  const eventResponse = (eventFromDB as EventDocument).ToEventResponse();
  expect(eventResponse).toHaveProperty("eventDate");
  expect(eventResponse).toHaveProperty("eventName", eventdata.eventName);
  expect(eventResponse).toHaveProperty("eventType", eventdata.eventType);
  expect(eventResponse).toHaveProperty("customMetaData");
  expect(eventResponse).toHaveProperty("projectId", projectID.toString());
});
