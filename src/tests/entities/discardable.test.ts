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

    await getRepository(User).softRemove(user);
    const removedUser = await getRepository(User).findOne(savedUser.id);
    expect(removedUser).toBeFalsy();

    const userStillPresent = await getRepository(User).findOne({
      where: { id: savedUser.id },
      withDeleted: true,
    });
    expect(userStillPresent).toBeTruthy();
    expect(userStillPresent!.id).toEqual(savedUser.id);
  });

  it("can restore soft deletion", async () => {
    const user: User = new User("username", "name", "password");
    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();

    await getRepository(User).softRemove(user);
    const removedUser = await getRepository(User).findOne(savedUser.id);
    expect(removedUser).toBeFalsy();

    await getRepository(User).recover(savedUser);
    const restoredUser = await getRepository(User).findOne(savedUser.id);
    expect(restoredUser).toBeTruthy();
  });
});
