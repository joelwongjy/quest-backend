import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { Class } from "../../entities/Class";
import { Programme } from "../../entities/Programme";
import ApiServer from "../../server";
import { synchronize } from "../../utils/tests";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
});

beforeEach(async () => {
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create class", () => {
  let programme: Programme;
  beforeEach(async () => {
    const programmeData = new Programme("First Programme!");
    programme = await getRepository(Programme).save(programmeData);
  });

  it("with valid name", async () => {
    const classData = new Class("First Programme - Class 1", programme);
    const errors = await validate(classData);
    expect(errors).toHaveLength(0);

    const saved = await getRepository(Class).save(classData);
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
    const class1Data = new Class("X Programme - Class 1", programmeData);
    const class2Data = new Class("X Programme - Class 2", programmeData);

    programme = await getRepository(Programme).save(programmeData);
    class1 = await getRepository(Class).save(class1Data);
    class2 = await getRepository(Class).save(class2Data);
  });

  it("Query programme for class", async () => {
    const programmeQuery = await getRepository(Programme).find({
      where: { id: programme.id },
      relations: ["classes"],
    });
    expect(programmeQuery).toHaveLength(1);
    expect(programmeQuery[0].classes).toHaveLength(2);
    expect(programmeQuery[0].classes.includes(class1));
    expect(programmeQuery[0].classes.includes(class2));
  });

  it("Query class for programme", async () => {
    const classQuery = await getRepository(Class).find({
      where: { id: class1.id },
      relations: ["programme"],
    });
    expect(classQuery).toHaveLength(1);
    expect(classQuery[0].programme.name).toBe(programme.name);
  });
});
