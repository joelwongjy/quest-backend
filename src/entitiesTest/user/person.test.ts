import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection, QueryFailedError } from "typeorm";
import { Gender } from "../../types/persons";
import { Person } from "../../entities/user/Person";
import { User } from "../../entities/user/User";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterEach(async () => {
  const personRepository = connection.getRepository(Person);
  const userRepository = connection.getRepository(User);

  await personRepository.delete({});
  await userRepository.delete({});
});

afterAll(async () => {
  await connection.close();
});

describe("Create person", () => {
  it("with valid name", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE);
    const errors = await validate(person);
    expect(errors).toHaveLength(0);

    const newPerson = await connection.getRepository(Person).save(person);
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

  it("with valid mobile_phone", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, undefined, "91234567");
    const errors = await validate(person);
    expect(errors).toHaveLength(0);
  });

  it("with invalid mobile_phone", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, undefined, "9123456");
    const errors = await validate(person);
    expect(errors).toHaveLength(1);
  });

  it("with user", async () => {
    const user = new User("Bobby", "Bobby");
    const person = new Person("Bobby Tan", Gender.MALE);

    const newUser = await connection.getRepository(User).save(user);

    person.user = newUser;
    const newPerson = await connection.getRepository(Person).save(person);

    expect(newPerson.id).toBeTruthy();
    expect(newPerson.user?.name).toBe(newUser.name);
  });

  it("connect one user to 2 persons", async () => {
    const userData = new User("Bobby", "Bobby");
    const user = await connection.getRepository(User).save(userData);

    const firstPersonData = new Person("BobbyPerson", Gender.MALE);
    firstPersonData.user = user;
    await connection.getRepository(Person).save(firstPersonData);

    const secondPersonData = new Person("TimmyPerson", Gender.MALE);
    secondPersonData.user = user;

    const errors = await validate(secondPersonData);
    expect(errors).toHaveLength(1);

    let saveError;
    try {
      await connection.getRepository(Person).save(secondPersonData);
    } catch (e) {
      saveError = e;
    }
    expect(saveError).toBeInstanceOf(QueryFailedError);
  });
});
