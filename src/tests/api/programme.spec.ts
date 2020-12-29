import request from "supertest";
import { getRepository } from "typeorm";
import { Programme } from "../../entities/programme/Programme";
import ApiServer from "../../server";
import { ProgrammeClassCreator } from "../../services/programme/programmesClasses";
import { ProgrammePostData } from "../../types/programmes";
import { Fixtures, synchronize, loadFixtures } from "../../utils/tests";

let server: ApiServer;
let fixtures: Fixtures;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
  fixtures = await loadFixtures(server);
});

afterAll(async () => {
  server.connection!.dropDatabase();
  await server.close();
});

describe("GET /programmes/", () => {
  it("should return 200 if logged in", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/programmes/`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toBeTruthy();
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/programmes/`)
      .send();
    expect(response.status).toEqual(401);
  });
});

describe("GET /programmes/:id", () => {
  it("should return 200 if logged in and valid id", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/programmes/${fixtures.programme.id}`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send();
    expect(response.status).toEqual(200);
    expect(response.body).toBeTruthy();
  });

  it("should return 400 if logged in and NaN id", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/programmes/NotAValidId`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send();
    expect(response.status).toEqual(400);
  });

  it("should return 401 if logged in and unpermitted id", async () => {
    const newProgramme = await getRepository(Programme).save(
      new Programme("Brand New Programme!")
    );
    const response = await request(server.server)
      .get(`${fixtures.api}/programmes/${newProgramme.id}`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send();
    expect(response.status).toEqual(401);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/programmes/${fixtures.programme.id}`)
      .send();
    expect(response.status).toEqual(401);
  });
});

describe("POST /", () => {
  const postData: ProgrammePostData = {
    name: "Winter programme for kids!",
    description: "Enjoy your december holidays with us!",
    classes: [
      {
        name: "Snowflake origami",
        description: "Make some origami with us!",
      },
      {
        name: "Hiking @ Bukit Timah",
      },
    ],
  };

  it("should return 200 and create programmes if admin", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/programmes`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(postData);
    expect(response.status).toBe(200);
    expect(
      await ProgrammeClassCreator.verify(response.body.id, postData)
    ).toBeTruthy();
  });

  it("should return 401 if not admin", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/programmes`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send(postData);
    expect(response.status).toBe(401);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/programmes`)
      .send(postData);
    expect(response.status).toBe(401);
  });
});
