import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { Answer } from "../../entities/questionnaire/Answer";
import { Option } from "../../entities/questionnaire/Option";
import { Question } from "../../entities/questionnaire/Question";
import { QuestionType } from "../../types/questions";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterEach(async () => {
  const answerRepository = connection.getRepository(Answer);
  const optionRepository = connection.getRepository(Option);
  const questionRepository = connection.getRepository(Question);

  await answerRepository.delete({});
  await optionRepository.delete({});
  await questionRepository.delete({});
});

afterAll(async () => {
  await connection.close();
});

describe("Create answer", () => {
  it("with valid question and option", async () => {
    let answer: Answer;
    let option: Option;
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    option = new Option("Awesome!", question);
    answer = new Answer(question, option);

    const errors = await validate(answer);
    expect(errors.length).toBe(0);

    const newAnswer = await connection.getRepository(Answer).save(answer);
    expect(newAnswer).toBeTruthy();
  });

  it("with valid question and text answer", async () => {
    let answer: Answer;
    let question: Question;

    question = new Question(
      "How are you feeling today?",
      QuestionType.SHORT_ANSWER
    );
    answer = new Answer(question, undefined, "I'm feeling good like I should");

    const errors = await validate(answer);
    expect(errors.length).toBe(0);

    const newAnswer = await connection.getRepository(Answer).save(answer);
    expect(newAnswer).toBeTruthy();
  });

  it("with valid question but no option and no answer", async () => {
    let answer: Answer;
    let question: Question;

    question = new Question(
      "How are you feeling today?",
      QuestionType.SHORT_ANSWER
    );
    answer = new Answer(question);

    const errors = await validate(answer);
    expect(errors.length).not.toBe(0);
  });

  it("with multiple answers for the same question", async () => {
    let answerOne: Answer;
    let answerTwo: Answer;
    let question: Question;

    question = new Question(
      "What is your dream job?",
      QuestionType.SHORT_ANSWER
    );
    answerOne = new Answer(question, undefined, "Work for Campus Impact!");
    answerTwo = new Answer(question, undefined, "Competitive Eater. Omnomnom.");

    const errorsAnswerOne = await validate(answerOne);
    expect(errorsAnswerOne.length).toBe(0);

    const errorsAnswerTwo = await validate(answerTwo);
    expect(errorsAnswerTwo.length).toBe(0);
  });
});
