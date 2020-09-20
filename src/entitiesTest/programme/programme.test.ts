import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { Programme } from "../../entities/programme/Programme";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterAll(async () => {
  await connection.close();
});

describe("Create programme", () => {
  afterEach(async () => {
    const programmeRepository = connection.getRepository(Programme);
    await programmeRepository.delete({});
  });

  it("with valid name", async () => {
    const programme = new Programme("First Programme!");
    const errors = await validate(programme);
    expect(errors).toHaveLength(0);

    const saved = await connection.getRepository(Programme).save(programme);
    expect(saved.id).toBeTruthy();
  });

  it("with invalid name", async () => {
    const programme = new Programme("");
    const errors = await validate(programme);
    expect(errors).toHaveLength(1);
  });
});
