import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { QuestionOrder } from "../../entities/questionnaire/QuestionOrder";
import { Question } from "../../entities/questionnaire/Question";
import { QuestionType } from "../../types/questions";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterEach(async () => {
  const questionOrderRepository = connection.getRepository(QuestionOrder);
  const questionRepository = connection.getRepository(Question);

  await questionOrderRepository.delete({});
  await questionRepository.delete({});
});

afterAll(async () => {
  await connection.close();
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

    const newQuestionOrder = await connection
      .getRepository(QuestionOrder)
      .save(questionOrder);
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
