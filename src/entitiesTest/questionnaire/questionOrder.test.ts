import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { QuestionOrder } from "../../entities/questionnaire/QuestionOrder";
import { Question } from "../../entities/questionnaire/Question";
import { QuestionType } from "../../types/questions";
import ApiServer from "../../server";
import { synchronize } from "../../utils/tests";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
});

beforeEach(async () => {
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create questionOrder", () => {
  it("with valid order and question", async () => {
    let order: number;
    let question: Question;
    let questionOrder: QuestionOrder;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    order = 2;
    questionOrder = new QuestionOrder(order, question);

    const errors = await validate(questionOrder);
    expect(errors.length).toBe(0);

    const newQuestionOrder = await getRepository(QuestionOrder).save(
      questionOrder
    );
    expect(newQuestionOrder).toBeTruthy();
  });

  it("with float order", async () => {
    let order: number;
    let question: Question;
    let questionOrder: QuestionOrder;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    order = 1.7;
    questionOrder = new QuestionOrder(order, question);

    const errors = await validate(questionOrder);
    expect(errors.length).not.toBe(0);
  });

  it("with negative integer order", async () => {
    let order: number;
    let question: Question;
    let questionOrder: QuestionOrder;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    order = -1;
    questionOrder = new QuestionOrder(order, question);

    const errors = await validate(questionOrder);
    expect(errors.length).not.toBe(0);
  });

  it("with multiple questionOrders for the same question", async () => {
    let questionOrderOne: QuestionOrder;
    let questionOrderTwo: QuestionOrder;
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    questionOrderOne = new QuestionOrder(3, question);
    questionOrderTwo = new QuestionOrder(4, question);

    const errorsQuestionOrderOne = await validate(questionOrderOne);
    expect(errorsQuestionOrderOne.length).toBe(0);

    const errorsQuestionOrderTwo = await validate(questionOrderTwo);
    expect(errorsQuestionOrderTwo.length).toBe(0);
  });
});
