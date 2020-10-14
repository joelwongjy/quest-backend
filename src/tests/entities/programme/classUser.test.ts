import { getRepository } from "typeorm";
import { Class } from "../../../entities/programme/Class";
import { ClassUser } from "../../../entities/programme/ClassUser";
import { Programme } from "../../../entities/programme/Programme";
import { User } from "../../../entities/user/User";
import { ClassUserRole } from "../../../types/classUsers";
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

describe("Create and Query ClassUser", () => {
  let programme: Programme;
  let class_: Class;
  let user1: User;
  let user2: User;

  beforeAll(async () => {
    const programmeData = new Programme("X-Programme");
    const classData = new Class("X-Programme-Class 1", programmeData);
    const user1Data = new User("Bobby", "Bobby");
    const user2Data = new User("Timmy", "Timmy");

    programme = await getRepository(Programme).save(programmeData);
    class_ = await getRepository(Class).save(classData);
    user1 = await getRepository(User).save(user1Data);
    user2 = await getRepository(User).save(user2Data);
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create classUsers", async () => {
    const user1Class = new ClassUser(class_, user1, ClassUserRole.TEACHER);
    const user2Class = new ClassUser(class_, user2, ClassUserRole.STUDENT);

    const savedUser1Class = await getRepository(ClassUser).save(user1Class);
    const savedUser2Class = await getRepository(ClassUser).save(user2Class);

    expect(savedUser1Class.id).toBeTruthy();
    expect(savedUser2Class.id).toBeTruthy();
  });

  it("query using classUser table", async () => {
    const classUserQuery: ClassUser[] = await getRepository(ClassUser).find({
      where: { classId: class_.id },
      relations: ["class", "user"],
    });

    expect(classUserQuery).toHaveLength(2);
    expect(classUserQuery[0].class.name).toBe(class_.name);

    const usersInClass = classUserQuery.map((classUser) => classUser.user.name);
    expect(usersInClass).toContain(user1.name);
    expect(usersInClass).toContain(user2.name);
  });

  it("query using class table", async () => {
    const classQuery: Class[] = await getRepository(Class).find({
      where: { id: class_.id },
      relations: ["classUsers", "classUsers.user"],
    });

    expect(classQuery).toHaveLength(1);

    const usersInClass = classQuery[0].classUsers.map(
      (classUser: ClassUser) => classUser.user.name
    );
    expect(usersInClass).toContain(user1.name);
    expect(usersInClass).toContain(user2.name);
  });

  it("query using user table", async () => {
    const userQuery: User[] = await getRepository(User).find({
      where: { id: user1.id },
      relations: ["classUsers", "classUsers.class"],
    });

    expect(userQuery).toHaveLength(1);

    const classesInvolvedIn = userQuery[0].classUsers.map(
      (classUser: ClassUser) => classUser.class.name
    );
    expect(classesInvolvedIn).toHaveLength(1);
    expect(classesInvolvedIn).toContain(class_.name);
  });
});
