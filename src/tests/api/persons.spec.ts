import request from "supertest";
import { getRepository } from "typeorm";
import { Person } from "../../entities/user/Person";
import { ApiServer } from "../../server";
import { Gender } from "../../types/persons";
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

describe("POST /persons/:id/user", () => {
  let person: Person;

  beforeEach(async () => {
    person = await getRepository(Person).save(
      new Person("Test Person", Gender.FEMALE)
    );
  });

  it("should create a User", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/persons/${person.id}/user`)
      .set("Authorization", fixtures.adminAccessToken)
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
      .post(`${fixtures.api}/persons/${person.id}/user`)
      .set("Authorization", fixtures.adminAccessToken)
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
      .post(`${fixtures.api}/persons/${person.id}/user`)
      .set("Authorization", fixtures.adminAccessToken)
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
      .post(`${fixtures.api}/persons/${person.id}/user`)
      .set("Authorization", fixtures.adminAccessToken)
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
