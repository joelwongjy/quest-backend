import { getRepository, IsNull } from "typeorm";
import { synchronize } from "../../utils/tests";
import ApiServer from "../../server";
import { User } from "../../entities/user/User";
import { isDiscardableData } from "../../types/entities";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

beforeEach(async () => {
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

// Unfortunately there is great difficulty in creating
// a mock just to test Discardable, due to the fixed schema
describe("Use User to test Discardable", () => {
  beforeEach(async () => {
    await synchronize(server);
  });

  it("has an initial null discardedAt date", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
    expect(savedUser.discardedAt).toBeFalsy();
  });

  it("allows for soft deletion", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
    await getRepository(User).update(savedUser.id, { discardedAt: new Date() });
    const updatedUser = await getRepository(User).findOne(savedUser.id);
    expect(updatedUser).toBeTruthy();
    expect(updatedUser!.discardedAt).toBeTruthy();
    expect(updatedUser!.discardedAt).toBeInstanceOf(Date);
  });

  it("can be filtered out after soft deletion", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    await getRepository(User).update(savedUser.id, { discardedAt: new Date() });
    const foundUser = await getRepository(User).findOne(savedUser.id, {
      where: { discardedAt: IsNull() },
    });
    expect(foundUser).toBeFalsy();
  });

  it("returns valid DiscardableData via getBase method", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
    const baseData = savedUser.getBase();
    expect(isDiscardableData(baseData));
  });
});
