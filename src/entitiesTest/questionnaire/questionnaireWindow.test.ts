import { validate } from "class-validator";
import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { QuestionnaireWindow } from "../../entities/questionnaire/QuestionnaireWindow";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterEach(async () => {
  const questionnaireWindowRepository = connection.getRepository(
    QuestionnaireWindow
  );

  await questionnaireWindowRepository.delete({});
});

afterAll(async () => {
  await connection.close();
});

describe("Create questionnaireWindow", () => {
  it("with valid start and end date", async () => {
    let questionnaireWindow: QuestionnaireWindow;
    let startDate: Date = new Date("2019-05-20");
    let endDate: Date = new Date("2020-05-27");

    questionnaireWindow = new QuestionnaireWindow(startDate, endDate);

    const errors = await validate(questionnaireWindow);
    expect(errors.length).toBe(0);

    const newQuestionnaireWindow = await connection
      .getRepository(QuestionnaireWindow)
      .save(questionnaireWindow);

    expect(newQuestionnaireWindow).toBeTruthy();
  });
});
