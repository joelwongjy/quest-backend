import { getRepository } from "typeorm";
import { Class } from "../../../entities/programme/Class";
import { ClassUser } from "../../../entities/programme/ClassPerson";
import { Programme } from "../../../entities/programme/Programme";
import { ClassUserRole } from "../../../types/classUsers";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { Person } from "../../../entities/user/Person";
import { Gender } from "../../../types/persons";

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
  let person1: Person;
  let person2: Person;

  beforeAll(async () => {
    const programmeData = new Programme("X-Programme");
    const classData = new Class("X-Programme-Class 1", programmeData);
    const person1Data = new Person("Bobby", Gender.MALE);
    const person2Data = new Person("Timmy", Gender.MALE);

    programme = await getRepository(Programme).save(programmeData);
    class_ = await getRepository(Class).save(classData);
    person1 = await getRepository(Person).save(person1Data);
    person2 = await getRepository(Person).save(person2Data);
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create classUsers", async () => {
    const user1Class = new ClassUser(class_, person1, ClassUserRole.TEACHER);
    const user2Class = new ClassUser(class_, person2, ClassUserRole.STUDENT);

    const savedUser1Class = await getRepository(ClassUser).save(user1Class);
    const savedUser2Class = await getRepository(ClassUser).save(user2Class);

    expect(savedUser1Class.id).toBeTruthy();
    expect(savedUser2Class.id).toBeTruthy();
  });

  it("query using classUser table", async () => {
    const classUserQuery: ClassUser[] = await getRepository(ClassUser).find({
      where: {
        class: {
          id: class_.id,
        },
      },
      relations: ["class", "person"],
    });

    expect(classUserQuery).toHaveLength(2);
    expect(classUserQuery[0].class.name).toBe(class_.name);

    const personsInClass = classUserQuery.map(
      (classUser) => classUser.person.name
    );
    expect(personsInClass).toContain(person1.name);
    expect(personsInClass).toContain(person2.name);
  });

  it("query using class table", async () => {
    const classQuery: Class[] = await getRepository(Class).find({
      where: { id: class_.id },
      relations: ["classUsers", "classUsers.person"],
    });

    expect(classQuery).toHaveLength(1);

    const personsInClass = classQuery[0].classUsers.map(
      (classUser: ClassUser) => classUser.person.name
    );
    expect(personsInClass).toContain(person1.name);
    expect(personsInClass).toContain(person2.name);
  });

  it("query using person table", async () => {
    const personQuery: Person[] = await getRepository(Person).find({
      where: { id: person1.id },
      relations: ["classUsers", "classUsers.class"],
    });

    expect(personQuery).toHaveLength(1);

    const classesInvolvedIn = personQuery[0].classUsers.map(
      (classUser: ClassUser) => classUser.class.name
    );
    expect(classesInvolvedIn).toHaveLength(1);
    expect(classesInvolvedIn).toContain(class_.name);
  });
});
