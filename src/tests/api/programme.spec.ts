import request from "supertest";
import { getRepository } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { Programme } from "../../entities/programme/Programme";
import ApiServer from "../../server";
import {
  ProgrammeClassCreator,
  ProgrammeClassDeleter,
  ProgrammeClassEditor,
} from "../../services/programme/programmesClasses";
import { ProgrammePatchData, ProgrammePostData } from "../../types/programmes";
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
