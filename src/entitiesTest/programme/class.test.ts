import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { Programme } from "../../entities/programme/Programme";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterEach(async () => {
  const classRepository = connection.getRepository(Class);
  const programmeRepository = connection.getRepository(Programme);

  await classRepository.delete({});
  await programmeRepository.delete({});
});

afterAll(async () => {
  await connection.close();
});

describe("Create class", () => {
  let programme: Programme;
  beforeEach(async () => {
    const programmeData = new Programme("First Programme!");
    programme = await connection.getRepository(Programme).save(programmeData);
  });

  it("with valid name", async () => {
    const classData = new Class("First Programme - class 1", programme);
    const errors = await validate(classData);
    expect(errors).toHaveLength(0);

    const saved = await connection.getRepository(Class).save(classData);
    expect(saved.id).toBeTruthy();
  });

  it("with invalid name", async () => {
    const classData = new Class("", programme);
    const errors = await validate(classData);
    expect(errors).toHaveLength(1);
  });
});

describe("Query programme and class", () => {
  let programme: Programme;
  let class1: Class;
  let class2: Class;
  beforeEach(async () => {
    const programmeData = new Programme("X Programme!");
    const class1Data = new Class("X Programme - class 1", programmeData);
    const class2Data = new Class("X Programme - class 2", programmeData);

    programme = await connection.getRepository(Programme).save(programmeData);
    class1 = await connection.getRepository(Class).save(class1Data);
    class2 = await connection.getRepository(Class).save(class2Data);
  });

  it("Query programme for class", async () => {
    const programmeQuery = await connection.getRepository(Programme).find({
      where: { id: programme.id },
      relations: ["classes"],
    });
    expect(programmeQuery).toHaveLength(1);
    expect(programmeQuery[0].classes).toHaveLength(2);
  });

  it("Query class for programme", async () => {
    const classQuery = await connection.getRepository(Class).find({
      where: { id: class1.id },
      relations: ["programme"],
    });
    expect(classQuery).toHaveLength(1);
    expect(classQuery[0].programme.name).toBe(programme.name);
  });
});
