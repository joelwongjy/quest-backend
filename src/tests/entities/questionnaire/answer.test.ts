import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { Answer } from "../../../entities/questionnaire/Answer";
import { Option } from "../../../entities/questionnaire/Option";
import { Question } from "../../../entities/questionnaire/Question";
import { QuestionOrder } from "../../../entities/questionnaire/QuestionOrder";
import { QuestionType } from "../../../types/questions";
import ApiServer from "../../../server";
import { Fixtures, loadFixtures, synchronize } from "../../../utils/tests";
import { Attempt } from "../../../entities/questionnaire/Attempt";
import { Questionnaire } from "../../../entities/questionnaire/Questionnaire";
import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";

let server: ApiServer;
let fixtures: Fixtures;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
  fixtures = await loadFixtures(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create answer", () => {
  let questionnaire: Questionnaire;
  let questionSet: QuestionSet;

  beforeAll(async () => {
    questionnaire = await fixtures.createSampleOneTimeQuestionnaire();
    questionSet = await getRepository(QuestionSet).save(new QuestionSet());
  });

  afterEach(async () => {
    await getRepository(Answer).delete({});
  });

  it("with valid question and option", async () => {
    let attempt: Attempt;
    let answer: Answer;
    let option: Option;
    let question: Question;
    let questionOrder: QuestionOrder;

    attempt = new Attempt(
      fixtures.student.person.user!,
      questionnaire.questionnaireWindows[0]
    );
    question = new Question("How are you feeling today?", QuestionType.MOOD);
    option = new Option("Awesome!", question);
    questionOrder = new QuestionOrder(1, question, questionSet);
    answer = new Answer(questionOrder, option);

    await getRepository(Attempt).save(attempt);
    await getRepository(Question).save(question);
    await getRepository(Option).save(option);
    await getRepository(QuestionOrder).save(questionOrder);
    answer.attempt = attempt;

    const errors = await validate(answer);
    expect(errors.length).toBe(0);

    const newAnswer = await getRepository(Answer).save(answer);
    expect(newAnswer).toBeTruthy();
  });

  it("with valid question and text answer", async () => {
    let attempt: Attempt;
    let answer: Answer;
    let question: Question;
    let questionOrder: QuestionOrder;

    attempt = new Attempt(
      fixtures.student.person.user!,
      questionnaire.questionnaireWindows[0]
    );
    question = new Question(
      "How are you feeling today?",
      QuestionType.SHORT_ANSWER
    );
    questionOrder = new QuestionOrder(1, question, questionSet);
    answer = new Answer(
      questionOrder,
      undefined,
      "I'm feeling good like I should"
    );

    await getRepository(Attempt).save(attempt);
    await getRepository(Question).save(question);
    await getRepository(QuestionOrder).save(questionOrder);
    answer.attempt = attempt;

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
    questionOrder = new QuestionOrder(1, question, questionSet);
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

    questionOrder = new QuestionOrder(1, question, questionSet);
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
