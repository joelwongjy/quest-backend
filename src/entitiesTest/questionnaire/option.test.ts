import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { Option } from "../../entities/questionnaire/Option";
import { Question } from "../../entities/questionnaire/Question";
import { QuestionType } from "../../entities/questionnaire/QuestionType";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterEach(async () => {
  const optionRepository = connection.getRepository(Option);
  const questionRepository = connection.getRepository(Question);

  await optionRepository.delete({});
  await questionRepository.delete({});
});

afterAll(async () => {
  await connection.close();
});

describe("Create option", () => {
  it("with valid option_text", async () => {
    let option: Option;
    let question: Question;

    question = new Question("How are you feeling today?", QuestionType.MOOD);
    option = new Option("Awesome!", question);

    const errors = await validate(option);
    expect(errors.length).toBe(0);

    const newOption = await connection.getRepository(Option).save(option);
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

    const errorsOptionOne = await validate(optionOne); // validating either option is sufficient
    expect(errorsOptionOne.length).toBe(0);

    const errorsOptionTwo = await validate(optionTwo); // validating either option is sufficient
    expect(errorsOptionTwo.length).toBe(0);
  });
});
