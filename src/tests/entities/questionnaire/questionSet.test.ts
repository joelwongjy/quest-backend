import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";
import { getRepository } from "typeorm";
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

describe("Create QuestionSet", () => {
  let questionSet: QuestionSet;

  afterAll(async () => {
    await synchronize(server);
  });

  it("create QuestionSet", async () => {
    const data = new QuestionSet();
    questionSet = await getRepository(QuestionSet).save(data);

    expect(questionSet.id).toBeTruthy();
  });
});
