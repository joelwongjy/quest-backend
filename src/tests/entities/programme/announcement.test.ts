import { getRepository } from "typeorm";
import { Class } from "../../../entities/programme/Class";
import { Announcement } from "../../../entities/programme/Announcement";
import { Programme } from "../../../entities/programme/Programme";
import { ClassPersonRole } from "../../../types/classPersons";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { Person } from "../../../entities/user/Person";

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
  let class_: Class;
  let announcement1: Announcement;
  let announcement2: Announcement;
  const title1 = "No classes on Good Friday";
  const title2 =
    "We will be having no classes this Friday as it is a Public Holiday";

  beforeAll(async () => {
    const programmeData = new Programme("X-Programme");
    const classData = new Class("X-Programme-Class 1", programmeData);

    const announcement1Data = new Announcement(
      programmeData,
      classData,
      new Date(),
      "No classes on Good Friday",
      "Hello students, as this Friday is going to be a Public Holiday, we will not have any classes."
    );

    const announcement2Data = new Announcement(
      programmeData,
      classData,
      new Date(),
      "We will be having no classes this Friday as it is a Public Holiday"
    );

    programme = await getRepository(Programme).save(programmeData);
    class_ = await getRepository(Class).save(classData);
    announcement1 = await getRepository(Announcement).save(announcement1Data);
    announcement2 = await getRepository(Announcement).save(announcement2Data);
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create announcements", async () => {
    expect(announcement1.id).toBeTruthy();
    expect(announcement2.id).toBeTruthy();
  });

  it("query using class table", async () => {
    const classQuery: Class[] = await getRepository(Class).find({
      where: { id: class_.id },
      relations: ["announcements"],
    });

    expect(classQuery).toHaveLength(1);

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
    expect(programmeAnnouncements).toContain(title2);
  });
});
