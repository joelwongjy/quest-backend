import { validate } from "class-validator";
import jwt from "jsonwebtoken";
import { getRepository, QueryFailedError } from "typeorm";
import { AuthenticationData } from "../../../types/auth";
import { User } from "../../../entities/user/User";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { isAccessTokenSignedPayload } from "../../../types/tokens";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterEach(async () => {
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create user", () => {
  it("success with valid name, username, password", async () => {
    const user: User = new User("test_user_1", "Test User One", "FakePassword");
    const errors = await validate(user);
    expect(errors).toHaveLength(0);
  });

  it("success with valid name, username, and no password", async () => {
    const user: User = new User("test_user_2", "Test User Two");
    const errors = await validate(user);
    expect(errors).toHaveLength(0);
  });

  it("error with empty username", async () => {
    const user: User = new User("", "Test User Two");
    const errors = await validate(user);
    expect(errors).toHaveLength(1);
  });

  it("error with empty name", async () => {
    const user: User = new User("test_user_3", "");
    const errors = await validate(user);
    expect(errors).toHaveLength(1);
  });
});

describe("Save user to database", () => {
  it("success with valid name, username, password", async () => {
    const user: User = new User("test_user_1", "Test User One", "FakePassword");
    const errors = await validate(user);
    expect(errors).toHaveLength(0);

    const savedUser = await getRepository(User).save(user);
    expect(savedUser).toBeTruthy();
  });

  it("error with duplicate username", async () => {
    const userOne: User = new User(
      "test_user_2",
      "Duplicate User One",
      "RandomPassword"
    );
    const userTwo: User = new User(
      "test_user_2",
      "Duplicate User Two",
      "RandomPassword"
    );

    const savedUserOne = await getRepository(User).save(userOne);
    expect(savedUserOne).toBeTruthy();

    await expect(
      async () => await getRepository(User).save(userTwo)
    ).rejects.toThrow(QueryFailedError);
  });

  it("success with duplicate name", async () => {
    const userOne: User = new User(
      "test_user_3",
      "Test User Three",
      "RandomPassword"
    );
    const userTwo: User = new User(
      "test_user_4",
      "Test User Three",
      "RandomPassword"
    );
    const savedUserOne = await getRepository(User).save(userOne);
    expect(savedUserOne).toBeTruthy();

    const savedUserTwo = await getRepository(User).save(userTwo);
    expect(savedUserTwo).toBeTruthy();
  });
});

describe("User methods", () => {
  it("creates a signed authentication token", async () => {
    const user: User = new User("test_user_1", "Test User One", "FakePassword");
    const {
      accessToken,
    }: AuthenticationData = user.createAuthenticationToken();
    expect(accessToken).toBeTruthy();
    const payload = jwt.verify(accessToken, process.env.JWT_SECRET!);
    expect(payload).toBeTruthy();
    expect(isAccessTokenSignedPayload(payload));
  });
});
