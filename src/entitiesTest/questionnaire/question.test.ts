import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { QuestionType } from "../../types/questions";
import { Question } from "../../entities/questionnaire/Question";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterEach(async () => {
  const questionRepository = connection.getRepository(Question);
  await questionRepository.delete({});
});

afterAll(async () => {
  await connection.close();
});

describe("Create question", () => {
  it("with valid question_text", async () => {
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    const errors = await validate(question);
    expect(errors.length).toBe(0);

    const newQuestion = await connection.getRepository(Question).save(question);
    expect(newQuestion).toBeTruthy();
  });

  it("with an empty question_text", async () => {
    let question: Question;

    question = new Question("", QuestionType.SHORT_ANSWER);
    const errors = await validate(question);
    expect(errors.length).not.toBe(0);
  });
});
