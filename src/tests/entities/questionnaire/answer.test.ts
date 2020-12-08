import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { Answer } from "../../../entities/questionnaire/Answer";
import { Option } from "../../../entities/questionnaire/Option";
import { Question } from "../../../entities/questionnaire/Question";
import { QuestionOrder } from "../../../entities/questionnaire/QuestionOrder";
import { QuestionType } from "../../../types/questions";
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

describe("Create answer", () => {
  afterEach(async () => {
    await getRepository(Answer).delete({});
  });

  it("with valid question and option", async () => {
    let answer: Answer;
    let option: Option;
    let question: Question;
    let questionOrder: QuestionOrder;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    option = new Option("Awesome!", question);
    questionOrder = new QuestionOrder(1, question);
    answer = new Answer(questionOrder, option);

    const errors = await validate(answer);
    expect(errors.length).toBe(0);

    const newAnswer = await getRepository(Answer).save(answer);
    expect(newAnswer).toBeTruthy();
  });

  it("with valid question and text answer", async () => {
    let answer: Answer;
    let question: Question;
    let questionOrder: QuestionOrder;

    question = new Question(
      "How are you feeling today?",
      QuestionType.SHORT_ANSWER
    );

    questionOrder = new QuestionOrder(1, question);
    answer = new Answer(
      questionOrder,
      undefined,
      "I'm feeling good like I should"
    );

    const errors = await validate(answer);
    expect(errors.length).toBe(0);

    const newAnswer = await getRepository(Answer).save(answer);
    expect(newAnswer).toBeTruthy();
  });

  it("with valid question but no option and no answer", async () => {
    let answer: Answer;
    let question: Question;
    let questionOrder: QuestionOrder;

    question = new Question(
      "How are you feeling today?",
      QuestionType.SHORT_ANSWER
    );
    questionOrder = new QuestionOrder(1, question);
    answer = new Answer(questionOrder);

    const errors = await validate(answer);
    expect(errors.length).not.toBe(0);
  });

  it("with multiple answers for the same question", async () => {
    let answerOne: Answer;
    let answerTwo: Answer;
    let question: Question;
    let questionOrder: QuestionOrder;

    question = new Question(
      "What is your dream job?",
      QuestionType.SHORT_ANSWER
    );

    questionOrder = new QuestionOrder(1, question);
    answerOne = new Answer(questionOrder, undefined, "Work for Campus Impact!");
    answerTwo = new Answer(
      questionOrder,
      undefined,
      "Competitive Eater. Omnomnom."
    );

    const errorsAnswerOne = await validate(answerOne);
    expect(errorsAnswerOne.length).toBe(0);

    const errorsAnswerTwo = await validate(answerTwo);
    expect(errorsAnswerTwo.length).toBe(0);
  });
});
