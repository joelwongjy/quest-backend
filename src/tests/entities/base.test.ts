import { getRepository } from "typeorm";
import { synchronize } from "../../utils/tests";
import ApiServer from "../../server";
import { User } from "../../entities/user/User";
import { isBaseData } from "../../types/entities";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

// Unfortunately there is great difficulty in creating
// a mock just to test Base, due to the fixed schema
describe("Use User to test Base", () => {
  beforeEach(async () => {
    await synchronize(server);
  });

  it("has an entityName", async () => {
    const user: User = new User("username", "name", "password");
    expect(user.entityName).toBeTruthy();
  });

  it("has a createdAt date", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
    expect(savedUser.createdAt).toBeTruthy();
    expect(savedUser.createdAt).toBeInstanceOf(Date);
  });

  it("has a updatedAt date", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
    expect(savedUser.updatedAt).toBeTruthy();
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });

  it("has the same date for createdAt and updatedAt", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
    expect(savedUser.createdAt === savedUser.updatedAt);
  });

  it("returns valid baseData via getBase method", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
    const baseData = savedUser.getBase();
    expect(isBaseData(baseData));
  });
});
