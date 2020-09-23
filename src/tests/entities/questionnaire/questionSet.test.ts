import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";
import { Questionnaire } from "../../../entities/questionnaire/Questionnaire";
import { QuestionnaireType } from "../../../types/questionnaires";
import { getRepository } from "typeorm";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create QuestionSet", () => {
  let questionnaire: Questionnaire;
  let questionSet: QuestionSet;

  beforeAll(async () => {
    const questionnaireData = new Questionnaire(
      "Youth Development StudyBuddies",
      QuestionnaireType.ONE_TIME
    );
    questionnaire = await getRepository(Questionnaire).save(questionnaireData);
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create QuestionSet", async () => {
    const data = new QuestionSet(questionnaire);
    questionSet = await getRepository(QuestionSet).save(data);

    expect(questionSet.id).toBeTruthy();
  });

  it("query QuestionSet", async () => {
    const questionSetQuery = await getRepository(QuestionSet).findOne({
      where: { id: questionSet.id },
      relations: ["questionnaire"],
    });

    expect(questionSetQuery?.questionnaire.name).toBe(questionnaire.name);
  });

  it("query questionnaire", async () => {
    const questionnaireQuery = await getRepository(Questionnaire).findOne({
      where: { id: questionnaire.id },
      relations: ["question_sets", "question_sets.questionnaire"],
    });

    expect(questionnaireQuery?.question_sets).toHaveLength(1);

    const relatedItem = questionnaireQuery?.question_sets[0];

    expect(relatedItem?.questionnaire.name).toBe(questionnaire.name);
  });
});
