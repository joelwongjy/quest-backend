import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";
import { getRepository } from "typeorm";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { QuestionPostData, QuestionType } from "../../../types/questions";
import { createQuestionSet } from "../../../utils/questions";

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
});

describe("Create questionSets using util methods", () => {
  afterEach(async () => {
    await synchronize(server);
  });

  it("create short answer questions", async () => {
    const QUESTION_1 = "How are you?";
    const QUESTION_2 = "Have you eaten?";
    const QUESTIONS: QuestionPostData[] = [QUESTION_1, QUESTION_2].map(
      (text, index) => {
        return {
          order: index,
          questionType: QuestionType.SHORT_ANSWER,
          questionText: text,
        };
      }
    );
    const questionSet = await createQuestionSet(QUESTIONS);

    expect(questionSet.id).toBeTruthy();
    expect(questionSet.questionOrders.length).toBe(2);
    expect(questionSet.questionOrders[0].id).toBeTruthy();
    expect(questionSet.questionOrders[0].question.id).toBeTruthy();

    const searchResult = await getRepository(QuestionSet).findOneOrFail({
      where: { id: questionSet.id },
      relations: ["questionOrders", "questionOrders.question"],
    });

    const { questionOrders } = searchResult;
    expect(questionOrders).toHaveLength(2);

    const questionTexts = questionOrders.map((q) => q.question.questionText);
    const questionType = questionOrders.map((q) => q.question.questionType);

    expect(questionTexts).toContain(QUESTION_1);
    expect(questionTexts).toContain(QUESTION_2);
    expect(questionType).toContain(QuestionType.SHORT_ANSWER);
  });

  it.todo("create long answer questions");
  it.todo("create MCQs");
});
