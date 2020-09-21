import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { Programme } from "../../../entities/programme/Programme";
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

describe("Create programme", () => {
  afterEach(async () => {
    await synchronize(server);
  });

  it("with valid name", async () => {
    const programme = new Programme("First Programme!");
    const errors = await validate(programme);
    expect(errors).toHaveLength(0);

    const saved = await getRepository(Programme).save(programme);
    expect(saved.id).toBeTruthy();
  });

  it("with invalid name", async () => {
    const programme = new Programme("");
    const errors = await validate(programme);
    expect(errors).toHaveLength(1);
  });
});
