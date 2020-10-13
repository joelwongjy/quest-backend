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

describe("POST /auth/login", () => {
  it("should allow an existing User to login", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/auth/login`)
      .send({
        username: fixtures.teacher.user.username,
        password: fixtures.teacherPassword,
      });
    expect(response.status).toEqual(200);
    expect(response.body.accessToken).toBeTruthy();
  });

  it("should not allow invalid credentials", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/auth/login`)
      .send({
        username: fixtures.teacher.user.username,
        password: fixtures.studentPassword,
      });
    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual("Invalid login credentials!");
  });

  it("should not allow non-existent User to login", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/auth/login`)
      .send({
        username: "doesnotexist",
        password: "fakepassword",
      });
    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual("Invalid login credentials!");
  });
});
