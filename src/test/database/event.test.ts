import { expect, test } from "@jest/globals";

import { Event, EventDocument } from "../../app/models/database/event";
import { Project } from "../../app/models/database/project";
import { CreateRandomEventRequest, CreateRandomProjectRequest, CreateRandomTenancy } from "../utils/utils";

test("test NewEventFromRequest Static Function", async () => {
  const tenancy = await CreateRandomTenancy();
  const project = await Project.NewProjectFromRequest(CreateRandomProjectRequest(), tenancy);
  const eventdata = CreateRandomEventRequest();

  const event = await Event.NewEventFromRequest(eventdata, project, tenancy);
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
  expect(eventFromDB).toHaveProperty("projectId", project.ProjectId);
});

test("ToEventResponse Method", async () => {
  const eventdata = CreateRandomEventRequest();
  const tenancy = await CreateRandomTenancy();
  const project = await Project.NewProjectFromRequest(CreateRandomProjectRequest(), tenancy);

  const event = await Event.NewEventFromRequest(eventdata, project, tenancy);
  await event.save();

  // get the event from the database via id
  const eventFromDB = await Event.findById(event._id);

  // asseert that the result is not null
  expect(eventFromDB).not.toBeNull();

  // assert that the event has the correct properties
  const eventResponse = await (eventFromDB as EventDocument).ToEventResponse();
  expect(eventResponse).toHaveProperty("eventDate");
  expect(eventResponse).toHaveProperty("eventName", eventdata.eventName);
  expect(eventResponse).toHaveProperty("eventType", eventdata.eventType);
  expect(eventResponse).toHaveProperty("customMetaData");
  expect(eventResponse).toHaveProperty("projectId", project.ProjectId.toString());
});
