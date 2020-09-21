import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { Option } from "../../../entities/questionnaire/Option";
import { Question } from "../../../entities/questionnaire/Question";
import { QuestionType } from "../../../types/questions";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";

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

describe("Create option", () => {
  it("with valid option_text", async () => {
    let option: Option;
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    option = new Option("Awesome!", question);

    const errors = await validate(option);
    expect(errors.length).toBe(0);

    const newOption = await getRepository(Option).save(option);
    expect(newOption).toBeTruthy();
  });

  it("with an empty option_text", async () => {
    let option: Option;
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    option = new Option("", question);

    const errors = await validate(option);
    expect(errors.length).not.toBe(0);
  });

  it("with multiple options for the same question", async () => {
    let optionOne: Option;
    let optionTwo: Option;
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    optionOne = new Option("Good.", question);
    optionTwo = new Option("Terrible.", question);

    const errorsOptionOne = await validate(optionOne);
    expect(errorsOptionOne.length).toBe(0);

    const errorsOptionTwo = await validate(optionTwo);
    expect(errorsOptionTwo.length).toBe(0);
  });
});
