import { getRepository } from "typeorm";
import { User } from "../../../entities/user/User";
import { QuestionnaireWindow } from "../../../entities/questionnaire/QuestionnaireWindow";
import { Answer } from "../../../entities/questionnaire/Answer";
import { Attempt } from "../../../entities/questionnaire/Attempt";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { Question } from "../../../entities/questionnaire/Question";
import { QuestionType } from "../../../types/questions";
import { QuestionOrder } from "../../../entities/questionnaire/QuestionOrder";
import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create attempt", () => {
  let user: User;
  let window: QuestionnaireWindow;

  beforeAll(async () => {
    const userData = new User("Bobby", "Bobby");
    user = await getRepository(User).save(userData);

    const question = new Question(
      "How are you today?",
      QuestionType.SHORT_ANSWER
    );
    const newQuestion = await getRepository(Question).save(question);

    const questionOrder = new QuestionOrder(1, newQuestion);
    const newQuestionOrder = await getRepository(QuestionOrder).save(
      questionOrder
    );

    const questionSet = new QuestionSet();
    questionSet.questionOrders = [newQuestionOrder];
    const newQuestionSet = await getRepository(QuestionSet).save(questionSet);

    const windowData = new QuestionnaireWindow(
      new Date("2020/01/01"),
      new Date("2020/01/20")
    );
    windowData.mainSet = newQuestionSet;
    window = await getRepository(QuestionnaireWindow).save(windowData);
  });

  afterEach(async () => {
    await getRepository(Answer).delete({});
    await getRepository(Attempt).delete({});
  });

  it("construct attempt with 0 answers", async () => {
    const attemptData = new Attempt(user, window);
    const saved = await getRepository(Attempt).save(attemptData);

    expect(saved.id).toBeTruthy();

    const attemptQuery = await getRepository(Attempt).find({
      where: { id: saved.id },
      relations: ["user", "questionnaireWindow"],
    });

    expect(attemptQuery).toHaveLength(1);
    expect(attemptQuery[0].user.id).toBe(user.id);
    expect(attemptQuery[0].questionnaireWindow.id).toBe(window.id);
  });

  it("construct attempt with 2 answers", async () => {
    const attemptData = new Attempt(user, window);
    const attempt = await getRepository(Attempt).save(attemptData);

    const questionData = new Question(
      "Hi! How are you?",
      QuestionType.LONG_ANSWER
    );
    const question = await getRepository(Question).save(questionData);

    const answer1Data = new Answer(question, undefined, "I'm good!");
    const answer2Data = new Answer(question, undefined, "I'm okay!");
    const answer1 = await getRepository(Answer).save(answer1Data);
    const answer2 = await getRepository(Answer).save(answer2Data);

    attempt.answers = [answer1, answer2];
    const saved = await getRepository(Attempt).save(attempt);

    expect(saved.id).toBeTruthy();

    const attemptQuery = await getRepository(Attempt).find({
      where: { id: saved.id },
      relations: ["answers"],
    });
    expect(attemptQuery).toHaveLength(1);

    const attemptAnswers = attemptQuery[0].answers.map(
      (answer) => answer.answer
    );

    expect(attemptAnswers).toContain(answer1Data.answer);
    expect(attemptAnswers).toContain(answer2Data.answer);
  });
});
