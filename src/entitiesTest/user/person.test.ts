import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { Gender } from "../../types/persons";
import { Person } from "../../entities/Person";
import { User } from "../../entities/User";

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
    expect(errors.length).toBe(0);

    const newPerson = await connection.getRepository(Person).save(person);
    expect(newPerson).toBeTruthy();
  });

  it("with valid email", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, "bobby@example.com");
    const errors = await validate(person);
    expect(errors.length).toBe(0);
  });

  it("with invalid email", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, "not-an-email");
    const errors = await validate(person);
    expect(errors.length).toBe(1);
  });

  it("with valid mobile_phone", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, undefined, "91234567");
    const errors = await validate(person);
    expect(errors.length).toBe(0);
  });

  it("with invalid mobile_phone", async () => {
    let person: Person;

    person = new Person("Bobby", Gender.MALE, undefined, "9123456");
    const errors = await validate(person);
    expect(errors.length).toBe(1);
  });

  it("with user", async () => {
    const user = new User("Bobby", "Bobby");
    const person = new Person("Bobby Tan", Gender.MALE);

    const newUser = await connection.getRepository(User).save(user);

    person.user = newUser;
    const newPerson = await connection.getRepository(Person).save(person);

    expect(newPerson).toBeTruthy();
    expect(newPerson.user?.id).toBe(newUser.id);
  });
});
