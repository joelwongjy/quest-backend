import { getRepository, In } from "typeorm";
import { Class } from "../../../entities/programme/Class";
import { Announcement } from "../../../entities/programme/Announcement";
import { Programme } from "../../../entities/programme/Programme";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create and Query Announcement", () => {
  let programme: Programme;
  let classOne: Class;
  let classTwo: Class;
  let announcement1: Announcement;
  let announcement2: Announcement;
  let announcement3: Announcement;
  const title1 = "No classes on Good Friday";
  const title2 =
    "We will be having no classes this Friday as it is a Public Holiday";

  beforeAll(async () => {
    const programmeData = new Programme("X-Programme");
    const classOneData = new Class("X-Programme-Class 1", programmeData);
    const classTwoData = new Class("X-Programme-Class 2", programmeData);

    const announcement1Data = new Announcement(
      new Date("2021-04-01"),
      new Date("2021-04-23"),
      title1,
      [programmeData],
      [classOneData, classTwoData],
      "Hello students, as this Friday is going to be a Public Holiday, we will not have any classes."
    );

    const announcement2Data = new Announcement(
      new Date("2021-04-01"),
      new Date("2021-04-23"),
      title2,
      undefined,
      [classOneData, classTwoData]
    );

    const announcement3Data = new Announcement(
      new Date("2021-04-01"),
      new Date("2021-04-23"),
      title1,
      [programmeData],
      undefined
    );

    programme = await getRepository(Programme).save(programmeData);
    classOne = await getRepository(Class).save(classOneData);
    classTwo = await getRepository(Class).save(classTwoData);
    announcement1 = await getRepository(Announcement).save(announcement1Data);
    announcement2 = await getRepository(Announcement).save(announcement2Data);
    announcement3 = await getRepository(Announcement).save(announcement3Data);
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create announcements using both programmes and classes data", async () => {
    expect(announcement1.id).toBeTruthy();
  });

  it("create announcements using only classes data", async () => {
    expect(announcement2.id).toBeTruthy();
  });

  it("create announcements using only programmes data", async () => {
    expect(announcement3.id).toBeTruthy();
  });

  it("query using class table", async () => {
    const classQuery: Class[] = await getRepository(Class).find({
      where: { id: In([classOne.id, classTwo.id]) },
      relations: ["programme", "announcements"],
    });

    expect(classQuery).toHaveLength(2);

    const classAnnouncements = classQuery[0].announcements?.map(
      (announcement: Announcement) => announcement.title
    );

    expect(classAnnouncements).toContain(title1);
    expect(classAnnouncements).toContain(title2);
  });

  it("query using programme table", async () => {
    const programmeQuery: Programme[] = await getRepository(Programme).find({
      where: { id: programme.id },
      relations: ["classes", "announcements"],
    });

    expect(programmeQuery).toHaveLength(1);

    const programmeAnnouncements = programmeQuery[0].announcements?.map(
      (announcement: Announcement) => announcement.title
    );

    expect(programmeAnnouncements).toContain(title1);
    expect(programmeAnnouncements).not.toContain(title2);
  });
});
