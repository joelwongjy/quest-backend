import { validate } from "class-validator";
import { getRepository } from "typeorm";
import { QuestionnaireWindow } from "../../entities/questionnaire/QuestionnaireWindow";
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

describe("Create questionnaireWindow", () => {
  it("with valid start and end date", async () => {
    let questionnaireWindow: QuestionnaireWindow;
    let startDate: Date = new Date("2019-05-20");
    let endDate: Date = new Date("2020-05-27");

    questionnaireWindow = new QuestionnaireWindow(startDate, endDate);

    const errors = await validate(questionnaireWindow);
    expect(errors.length).toBe(0);

    const newQuestionnaireWindow = await getRepository(
      QuestionnaireWindow
    ).save(questionnaireWindow);

    expect(newQuestionnaireWindow).toBeTruthy();
  });
});
