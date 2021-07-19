import request from "supertest";
import { getRepository } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { Programme } from "../../entities/programme/Programme";
import { Announcement } from "../../entities/programme/Announcement";
import ApiServer from "../../server";
import {
  AnnouncementPatchData,
  AnnouncementPostData,
} from "../../types/announcements";
import { Fixtures, synchronize, loadFixtures } from "../../utils/tests";

let server: ApiServer;
let fixtures: Fixtures;
const mockAnnouncementId = 1;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
  fixtures = await loadFixtures(server);

  const programmeData = new Programme("X-Programme");
  const classOneData = new Class("X-Programme-Class 1", programmeData);
  const classTwoData = new Class("X-Programme-Class 2", programmeData);
  const title1 = "No classes on Good Friday";
  const title2 =
    "We will be having no classes this Friday as it is a Public Holiday";

  const announcementOneData = new Announcement(
    new Date("2021-04-01"),
    new Date("2021-04-23"),
    title1,
    [programmeData],
    [classOneData, classTwoData],
    "Hello students, as this Friday is going to be a Public Holiday, we will not have any classes."
  );

  const announcementTwoData = new Announcement(
    new Date("2021-04-01"),
    new Date("2021-04-23"),
    title2,
    [programmeData],
    [classOneData, classTwoData]
  );

  let programme: Programme = await getRepository(Programme).save(programmeData);
  let classOne: Class = await getRepository(Class).save(classOneData);
  let classTwo: Class = await getRepository(Class).save(classTwoData);
  let announcementOne: Announcement = await getRepository(Announcement).save(
    announcementOneData
  );
  let announcementTwo: Announcement = await getRepository(Announcement).save(
    announcementTwoData
  );
});

afterAll(async () => {
  await synchronize(server);
  server.connection!.dropDatabase();
  await server.close();
});

// test index controller
describe("GET /announcements/", () => {
  it("should return 200 if logged in", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/announcements/`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toBeTruthy();
    // console.log(response.body.announcements);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/announcements/`)
      .send();
    expect(response.status).toEqual(401);
  });
});

// test show controller
describe("GET /announcements/:id", () => {
  it("should return 200 if logged in and valid id", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/announcements/${mockAnnouncementId}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toBeTruthy();
    // console.log(response.body);
  });
});

describe("POST /announcements", () => {
  const postData: AnnouncementPostData = {
    title: "Dummy Title",
    startDate: new Date("2021-01-01"),
    endDate: new Date("2021-12-31"),
    body: "Dummy Body",
    programmeIds: [1],
    classIds: [1, 2],
  };

  it("should return 200 and create announcements if admin", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/announcements`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(postData);
    expect(response.status).toBe(200);
  });

  it("should return 401 if not admin", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/announcements`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send(postData);
    expect(response.status).toBe(401);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/announcements`)
      .send(postData);
    expect(response.status).toBe(401);
  });
});

describe("PATCH /:id", () => {
  let editData: AnnouncementPatchData = {
    title: "Edited title",
    body: "Edited body",
  };

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .patch(`${fixtures.api}/announcements/${mockAnnouncementId}`)
      .send(editData);
    expect(response.status).toBe(401);
  });

  it("should return 401 if not admin", async () => {
    const response = await request(server.server)
      .patch(`${fixtures.api}/announcements/${mockAnnouncementId}`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send(editData);
    expect(response.status).toBe(401);
  });

  it("should return 200 if admin and changed data", async () => {
    const response = await request(server.server)
      .patch(`${fixtures.api}/announcements/${mockAnnouncementId}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(editData);
    expect(response.status).toBe(200);
    const editedAnnouncement: Announcement | undefined = await getRepository(
      Announcement
    ).findOne({
      where: { id: mockAnnouncementId },
    });

    expect(editedAnnouncement?.title).toBe("Edited title");
    expect(editedAnnouncement?.body).toBe("Edited body");
  });
});

describe("DELETE /:id", () => {
  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/announcements/${mockAnnouncementId}`)
      .send();
    expect(response.status).toBe(401);
  });

  it("should return 401 if not admin", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/announcements/${mockAnnouncementId}`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send();
    expect(response.status).toBe(401);
  });

  it("should return 400 if admin and NaN id", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/announcements/NanId`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toBe(400);
  });

  it("should return 404 if admin and invalid id", async () => {
    const invalidId = 0;
    const response = await request(server.server)
      .delete(`${fixtures.api}/announcements/${invalidId}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toBe(404);
  });

  it("should return 200 and delete announcement if admin and valid id", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/announcements/${mockAnnouncementId}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toBe(200);
    expect(response.body.id).toBeTruthy();
  });
});
