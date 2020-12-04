import _ from "lodash";
import request from "supertest";
import { getRepository } from "typeorm";
import { Questionnaire } from "../../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../../entities/questionnaire/QuestionnaireWindow";
import { QuestionOrder } from "../../entities/questionnaire/QuestionOrder";
import { QuestionSet } from "../../entities/questionnaire/QuestionSet";
import ApiServer from "../../server";
import {
  QuestionnairePostData,
  QuestionnaireType,
} from "../../types/questionnaires";
import { QuestionType } from "../../types/questions";
import { Fixtures, synchronize, loadFixtures } from "../../utils/tests";

const QUESTIONNAIRE_ONE_TIME: QuestionnairePostData = {
  title: "My One Time Questionnaire",
  type: QuestionnaireType.ONE_TIME,
  questionWindows: [
    {
      startAt: new Date("2020/03/01"),
      endAt: new Date("2020/03/20"),
      questions: [
        {
          order: 1,
          questionType: QuestionType.SHORT_ANSWER,
          questionText: "How was your March Holidays?",
        },
      ],
    },
  ],
  sharedQuestions: {
    questions: [],
  },
};

const QUESTIONNAIRE_BEFORE_AFTER: QuestionnairePostData = {
  title: "My Before/After Questionnaire!",
  type: QuestionnaireType.PRE_POST,
  questionWindows: [
    {
      startAt: new Date("2020/01/01"),
      endAt: new Date("2020/01/20"),
      questions: [
        {
          order: 1,
          questionType: QuestionType.SHORT_ANSWER,
          questionText: "How are you feeling in January?",
        },
      ],
    },
    {
      startAt: new Date("2020/02/01"),
      endAt: new Date("2020/02/20"),
      questions: [
        {
          order: 1,
          questionType: QuestionType.SHORT_ANSWER,
          questionText: "How are you feeling in February?",
        },
      ],
    },
  ],
  sharedQuestions: {
    questions: [
      {
        order: 1,
        questionType: QuestionType.SHORT_ANSWER,
        questionText: "What is your name?",
      },
    ],
  },
};

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

describe("POST /questionnaires/create", () => {
  it("should create one-time questionnaires", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/create`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(QUESTIONNAIRE_ONE_TIME);
    expect(response.status).toEqual(200);
  });

  it("should create before-after questionnaire", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/create`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(QUESTIONNAIRE_BEFORE_AFTER);
    expect(response.status).toEqual(200);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/create`)
      .send(QUESTIONNAIRE_ONE_TIME);
    expect(response.status).toBe(401);
  });

  it("should return 401 if not admin", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/create`)
      .set("Authorization", fixtures.teacherAccessToken)
      .send(QUESTIONNAIRE_ONE_TIME);
    expect(response.status).toBe(401);
  });
});

describe("DELETE /questionnaires/delete for Pre-Post Questionnaires", () => {
  let questionnaire: Questionnaire;

  beforeEach(async () => {
    questionnaire = await fixtures.createSamplePrePostQuestionnaire();
  });

  afterAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);
  });

  it("should return 200 if valid id and admin", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/questionnaires/delete/${questionnaire.id}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(200);

    // check questionnaire has been deleted
    const searchQnnaire = await getRepository(Questionnaire).findOne({
      where: { id: questionnaire.id },
    });
    expect(searchQnnaire).toBeFalsy();

    // check windows have been deleted
    const createdWindows = questionnaire.questionnaireWindows;
    expect(createdWindows.length).toBeGreaterThan(0);
    expect(createdWindows[0].id).toBeTruthy();
    const searchWindows = await getRepository(QuestionnaireWindow).find({
      where: createdWindows.map((window) => Object.assign({ id: window.id })),
    });
    expect(searchWindows).toHaveLength(0);

    // check questionSets have been deleted
    const createdSets = questionnaire.questionnaireWindows.map(
      (window) => window.mainSet
    );
    expect(createdSets.length).toBeGreaterThan(0);
    expect(createdSets[0].id).toBeTruthy();
    const searchSets = await getRepository(QuestionSet).find({
      where: createdSets.map((set) => Object.assign({ id: set.id })),
    });
    expect(searchSets).toHaveLength(0);

    // check questionOrders have been deleted
    const createdOrders = _.flatMap(
      questionnaire.questionnaireWindows,
      (window) => window.mainSet.questionOrders
    );
    expect(createdOrders.length).toBeGreaterThan(0);
    expect(createdOrders[0].id).toBeTruthy();
    const searchOrders = await getRepository(QuestionOrder).find({
      where: createdOrders.map((order) => Object.assign({ id: order.id })),
    });
    expect(searchOrders).toHaveLength(0);
  });

  it("it should return 404 if invalid id", async () => {
    const invalidId = questionnaire.id + 23;
    const response = await request(server.server)
      .delete(`${fixtures.api}/questionnaires/delete/${invalidId}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(404);

    const searchQnnaire = await getRepository(Questionnaire).findOne(
      questionnaire.id
    );
    expect(searchQnnaire?.id).toEqual(questionnaire.id);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/questionnaires/delete/${questionnaire.id}`)
      .send();
    expect(response.status).toEqual(401);

    const searchQnnaire = await getRepository(Questionnaire).findOne(
      questionnaire.id
    );
    expect(searchQnnaire?.id).toEqual(questionnaire.id);
  });

  it("should return 401 if not admin", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/questionnaires/delete/${questionnaire.id}`)
      .set("Authorization", fixtures.studentAccessToken)
      .send();
    expect(response.status).toEqual(401);

    const searchQnnaire = await getRepository(Questionnaire).findOne(
      questionnaire.id
    );
    expect(searchQnnaire?.id).toEqual(questionnaire.id);
  });
});

describe("DELETE /questionnaires/delete for One-Time Questionnaires", () => {
  let questionnaire: Questionnaire;

  beforeEach(async () => {
    questionnaire = await fixtures.createSampleOneTimeQuestionnaire();
  });

  afterAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);
  });

  it("should return 200 if valid id and admin", async () => {
    const response = await request(server.server)
      .delete(`${fixtures.api}/questionnaires/delete/${questionnaire.id}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(200);
  });
});
