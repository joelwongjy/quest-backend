import { validate } from "class-validator";
import { getRepository, QueryFailedError } from "typeorm";
import { Gender } from "../../../types/persons";
import { Person } from "../../../entities/user/Person";
import { User } from "../../../entities/user/User";
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

describe("Create person", () => {
  afterEach(async () => {
    await getRepository(User).delete({});
    await getRepository(Person).delete({});
  });

  it("with valid name", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE);
    const errors = await validate(person);
    expect(errors).toHaveLength(0);

    const newPerson = await getRepository(Person).save(person);
    expect(newPerson.id).toBeTruthy();
  });

  it("with valid email", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, "bobby@example.com");
    const errors = await validate(person);
    expect(errors).toHaveLength(0);
  });

  it("with invalid email", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, "not-an-email");
    const errors = await validate(person);
    expect(errors).toHaveLength(1);
  });

  it("with valid mobilePhone", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, undefined, "91234567");
    const errors = await validate(person);
    expect(errors).toHaveLength(0);
  });

  it("with invalid mobilePhone", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, undefined, "9123456");
    const errors = await validate(person);
    expect(errors).toHaveLength(1);
  });

  it("with user", async () => {
    const person = new Person("Bobby Tan", Gender.MALE);
    const user = new User(person, "Bobby", "Bobby");

    const newPerson = await getRepository(Person).save(person);
    await getRepository(User).save(user);

    expect(newPerson.id).toBeTruthy();
  });
});
