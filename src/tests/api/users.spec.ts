import request from "supertest";
import { ApiServer } from "../../server";
import { Fixtures, loadFixtures, synchronize } from "../../utils/tests";

let server: ApiServer;
let fixtures: Fixtures;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
  fixtures = await loadFixtures(server);
});

afterAll(async () => {
  await server.close();
});

describe("POST /users/", () => {
  it("should create a User", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/users/`)
      .send({
        username: "testuser",
        password: "password",
        name: "Test User",
      });
    expect(response.status).toEqual(201);
    expect(response.body.user).toBeTruthy();
    expect(response.body.user.username).toEqual("testuser");
    expect(response.body.user.name).toEqual("Test User");
    expect(response.body.accessToken).toBeTruthy();
  });

  it("should not allow duplicate username", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/users/`)
      .send({
        username: "testuser",
        password: "password2",
        name: "Test User 2",
      });
    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual(
      "Username is either invalid or already exists!"
    );
  });

  it("should not allow empty username", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/users/`)
      .send({
        username: "",
        password: "password",
        name: "Test User 3",
      });
    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual(
      "Username is either invalid or already exists!"
    );
  });

  it("should not allow empty name", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/users/`)
      .send({
        username: "testuser4",
        password: "password",
        name: "",
      });
    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual(
      "Something went wrong. Please try again!"
    );
  });
});

describe("GET /users/self", () => {
  it("should allow a User to get his own data", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/users/self`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send();
    expect(response.status).toEqual(200);
  });
});

describe("PATCH /users/self", () => {
  it("should allow a User to edit his own data", async () => {
    const response = await request(server.server)
      .patch(`${fixtures.api}/users/self`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send();
    expect(response.status).toEqual(200);
  });
});
