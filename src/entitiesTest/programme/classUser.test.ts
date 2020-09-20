import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { ClassUser } from "../../entities/programme/ClassUser";
import { Programme } from "../../entities/programme/Programme";
import { User } from "../../entities/user/User";
import { ClassUserRole } from "../../types/classUsers";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterAll(async () => {
  await connection.close();
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

    programme = await connection.getRepository(Programme).save(programmeData);
    class_ = await connection.getRepository(Class).save(classData);
    user1 = await connection.getRepository(User).save(user1Data);
    user2 = await connection.getRepository(User).save(user2Data);
  });

  afterAll(async () => {
    const classUserRepository = connection.getRepository(ClassUser);
    const programmeRepository = connection.getRepository(Programme);
    const classRepository = connection.getRepository(Class);
    const userRepository = connection.getRepository(User);

    await classUserRepository.delete({});
    await classRepository.delete({});
    await programmeRepository.delete({});
    await userRepository.delete({});
  });

  it("create classUsers", async () => {
    const user1Class = new ClassUser(class_, user1, ClassUserRole.TEACHER);
    const user2Class = new ClassUser(class_, user2, ClassUserRole.STUDENT);

    const savedUser1Class = await connection
      .getRepository(ClassUser)
      .save(user1Class);
    const savedUser2Class = await connection
      .getRepository(ClassUser)
      .save(user2Class);

    expect(savedUser1Class.id).toBeTruthy();
    expect(savedUser2Class.id).toBeTruthy();
  });

  it("query using classUser table", async () => {
    const classUserQuery = await connection.getRepository(ClassUser).find({
      where: { class: class_.id },
      relations: ["class", "user"],
    });

    expect(classUserQuery).toHaveLength(2);
    expect(classUserQuery[0].class.name).toBe(class_.name);

    const usersInClass = classUserQuery.map((classUser) => classUser.user.name);
    expect(usersInClass).toContain(user1.name);
    expect(usersInClass).toContain(user2.name);
  });

  it("query using class table", async () => {
    const classQuery = await connection.getRepository(Class).find({
      where: { id: class_.id },
      relations: ["classUsers", "classUsers.user"],
    });

    expect(classQuery).toHaveLength(1);

    const usersInClass = classQuery[0].classUsers.map(
      (classUser) => classUser.user.name
    );
    expect(usersInClass).toContain(user1.name);
    expect(usersInClass).toContain(user2.name);
  });

  it("query using user table", async () => {
    const userQuery = await connection.getRepository(User).find({
      where: { id: user1.id },
      relations: ["classUsers", "classUsers.class"],
    });

    expect(userQuery).toHaveLength(1);

    const classesInvolvedIn = userQuery[0].classUsers.map(
      (classUser) => classUser.class.name
    );
    expect(classesInvolvedIn).toHaveLength(1);
    expect(classesInvolvedIn).toContain(class_.name);
  });
});
