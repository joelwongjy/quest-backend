import { validate } from "class-validator";
import { Question } from "../../../entities/questionnaire/Question";
import { QuestionOrder } from "../../../entities/questionnaire/QuestionOrder";
import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";
import { QuestionType } from "../../../types/questions";
import { getRepository } from "typeorm";
import { QuestionnaireWindow } from "../../../entities/questionnaire/QuestionnaireWindow";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { Questionnaire } from "../../../entities/questionnaire/Questionnaire";
import {
  QuestionnaireType,
  QuestionnaireStatus,
} from "../../../types/questionnaires";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create questionnaireWindow", () => {
  afterEach(async () => {
    await synchronize(server);
  });

  it("with valid arguments", async () => {
    const startDate: Date = new Date("2019-05-20");
    const endDate: Date = new Date("2020-05-27");

    const questionnaire = await getRepository(Questionnaire).save(
      new Questionnaire(
        "Testing Questionnaire",
        QuestionnaireType.ONE_TIME,
        QuestionnaireStatus.PUBLISHED
      )
    );

    const question = new Question(
      "How are you today?",
      QuestionType.SHORT_ANSWER
    );
    const newQuestion = await getRepository(Question).save(question);
    expect(newQuestion.id).toBeTruthy();

    const questionSet = new QuestionSet();
    const newQuestionSet = await getRepository(QuestionSet).save(questionSet);
    expect(newQuestionSet.id).toBeTruthy();

    const questionOrder = new QuestionOrder(1, newQuestion, newQuestionSet);
    const newQuestionOrder = await getRepository(QuestionOrder).save(
      questionOrder
    );
    expect(newQuestionOrder.id).toBeTruthy();

    const questionnaireWindow = new QuestionnaireWindow(
      questionnaire,
      startDate,
      endDate
    );
    questionnaireWindow.mainSet = newQuestionSet;
    const errors = await validate(questionnaireWindow);
    expect(errors.length).toBe(0);

    const newQuestionnaireWindow = await getRepository(
      QuestionnaireWindow
    ).save(questionnaireWindow);

    expect(newQuestionnaireWindow.id).toBeTruthy();
  });
});
