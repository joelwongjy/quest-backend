import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";
import { getRepository } from "typeorm";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { Question } from "../../../entities/questionnaire/Question";
import { QuestionType } from "../../../types/questions";
import { QuestionOrder } from "../../../entities/questionnaire/QuestionOrder";
import { QuestionnaireWindow } from "../../../entities/questionnaire/QuestionnaireWindow";

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
  let questionSet: QuestionSet;

  afterAll(async () => {
    await synchronize(server);
  });

  it("create QuestionSet", async () => {
    const data = new QuestionSet();
    questionSet = await getRepository(QuestionSet).save(data);

    expect(questionSet.id).toBeTruthy();
  });

  it("save questions", async () => {
    const question = new Question(
      "How are you today?",
      QuestionType.SHORT_ANSWER
    );

    const newQuestion = await getRepository(Question).save(question);
    expect(newQuestion).toBeTruthy();

    const questionOrder = new QuestionOrder(1, newQuestion);
    const newQuestionOrder = await getRepository(QuestionOrder).save(
      questionOrder
    );
    expect(newQuestionOrder).toBeTruthy();

    const questionnaireWindow = new QuestionnaireWindow(
      new Date("2019-05-20"),
      new Date("2020-05-27")
    );
    const newQuestionnaireWindow = await getRepository(
      QuestionnaireWindow
    ).save(questionnaireWindow);
    expect(newQuestionnaireWindow).toBeTruthy();

    const questionSet = new QuestionSet();
    questionSet.question_orders = [newQuestionOrder];
    questionSet.questionnaire_windows = [newQuestionnaireWindow];
    const newQuestionSet = await getRepository(QuestionSet).save(questionSet);
    expect(newQuestionSet).toBeTruthy();

    const queryQuestionSet = await getRepository(QuestionSet).findOne({
      where: { id: newQuestionSet.id },
      relations: ["question_orders", "questionnaire_windows"],
    });
    expect(queryQuestionSet?.question_orders).toHaveLength(1);
    expect(queryQuestionSet?.questionnaire_windows).toHaveLength(1);
  });
});
