import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { QuestionType } from "../../../types/questions";
import { Question } from "../../../entities/questionnaire/Question";
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

describe("Create question", () => {
  afterEach(async () => {
    await getRepository(Question).delete({});
  });

  it("with valid question_text", async () => {
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    const errors = await validate(question);
    expect(errors.length).toBe(0);

    const newQuestion = await getRepository(Question).save(question);
    expect(newQuestion).toBeTruthy();
  });

  it("with an empty question_text", async () => {
    let question: Question;

    question = new Question("", QuestionType.SHORT_ANSWER);
    const errors = await validate(question);
    expect(errors.length).not.toBe(0);
  });
});
