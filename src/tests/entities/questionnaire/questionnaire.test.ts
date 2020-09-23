import { Questionnaire } from "../../../entities/questionnaire/Questionnaire";
import { QuestionnaireType } from "../../../types/questionnaires";
import { getRepository } from "typeorm";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { validate } from "class-validator";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create questionnaire", () => {
  it("with valid name and type", async () => {
    let data: Questionnaire = new Questionnaire(
      "Youth Development Framework",
      QuestionnaireType.ONE_TIME
    );
    let questionnaire: Questionnaire = await getRepository(Questionnaire).save(
      data
    );
    const errors = await validate(questionnaire);

    expect(questionnaire.id).toBeTruthy();
    expect(errors.length).toBe(0);
  });

  it("with empty name but valid type", async () => {
    let data: Questionnaire = new Questionnaire("", QuestionnaireType.ONE_TIME);
    const errors = await validate(data);

    expect(errors.length).not.toBe(0);
  });
});
