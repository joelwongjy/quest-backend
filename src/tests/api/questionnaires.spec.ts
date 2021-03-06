import _ from "lodash";
import { Answer } from "../../entities/questionnaire/Answer";
import { AnswerPostData } from "../../types/answers";
import { AttemptPostData } from "../../types/attempts";
import request from "supertest";
import { getRepository } from "typeorm";
import { Questionnaire } from "../../entities/questionnaire/Questionnaire";
import ApiServer from "../../server";
import {
  QuestionnairePatchData,
  QuestionnaireFullData,
  QuestionnaireOneWindowData,
  QuestionnairePostData,
  QuestionnaireStatus,
  QuestionnaireType,
  QuestionnaireWindowData,
} from "../../types/questionnaires";
import { QuestionData, QuestionType } from "../../types/questions";
import {
  QuestionnaireDeleter,
  QuestionnaireWindowViewer,
} from "../../services/questionnaire";
import { Fixtures, synchronize, loadFixtures } from "../../utils/tests";
import { Attempt } from "../../entities/questionnaire/Attempt";

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
  classes: [],
  programmes: [],
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
  classes: [],
  programmes: [],
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

    expect(await QuestionnaireDeleter.verify(questionnaire.id)).toBeTruthy();
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

describe("GET /questionnaires/:id", () => {
  let questionnaire: Questionnaire;
  let invalidId: number;

  beforeAll(async () => {
    questionnaire = await fixtures.createSamplePrePostQuestionnaire();
    invalidId = questionnaire.id + 23;
  });

  afterAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);
  });

  it("should return 200 if valid id and is admin", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/questionnaires/${questionnaire.id}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(200);
  });

  it("should return 404 if invalid id", async () => {
    const response = await request(server.server)
      .get(`${fixtures.api}/questionnaires/${invalidId}`)
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(404);
  });
});

describe("GET /questionnaires/:id/window/:windowId", () => {
  let questionnaire: Questionnaire;
  let validQuestionnaireId: number;
  let invalidQuestionnaireId: number;
  let validWindowId: number;
  let invalidWindowId: number;
  const nanId: string = "Unconvertable integer";

  beforeAll(async () => {
    questionnaire = await fixtures.createSamplePrePostQuestionnaire();

    validQuestionnaireId = questionnaire.id;
    invalidQuestionnaireId = validQuestionnaireId + 23;
    // assume it exists since it is a sample
    validWindowId = questionnaire.questionnaireWindows.map(
      (window) => window.mainSet
    )[0].id;
    invalidWindowId = validWindowId + 47;
  });

  afterAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);
  });

  it("should return 200 if valid id and logged in", async () => {
    const response = await request(server.server)
      .get(
        `${fixtures.api}/questionnaires/${validQuestionnaireId}/window/${validWindowId}`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toBe(200);
  });

  it("should return 404 if invalid questionnaire id", async () => {
    const response = await request(server.server)
      .get(
        `${fixtures.api}/questionnaires/${invalidQuestionnaireId}/window/${validWindowId}`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toBe(404);
  });

  it("should return 400 if valid questionnaire id but invalid window id", async () => {
    const response = await request(server.server)
      .get(
        `${fixtures.api}/questionnaires/${validQuestionnaireId}/window/${invalidWindowId}`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toBe(400);
  });

  it("should return 400 if valid questionnaire id but NaN window id", async () => {
    const response = await request(server.server)
      .get(
        `${fixtures.api}/questionnaires/${validQuestionnaireId}/window/${nanId}`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toBe(400);
  });
});

describe("POST /questionnaires/edit/:id", () => {
  let originalData: QuestionnaireFullData;

  beforeEach(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);

    originalData = await (
      await fixtures.createSampleOneTimeQuestionnaire()
    ).getAllWindows();
  });

  afterAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);
  });

  it("should return 200 if is admin and data is correct", async () => {
    // only change title, status, openAt, closeAt
    const editData: QuestionnairePatchData = {
      ...originalData,
      title: "Edited Qnnaire",
      status: QuestionnaireStatus.PUBLISHED,
      questionWindows: [
        {
          ...originalData.questionWindows[0],
          startAt: new Date("2022/12/12").toISOString(),
          endAt: new Date("2020/12/13").toISOString(),
        },
      ],
      classes: originalData.classes.map((clazz) => clazz.id),
      programmes: originalData.programmes.map((prg) => prg.id),
    };

    const response = await request(server.server)
      .post(
        `${fixtures.api}/questionnaires/edit/${originalData.questionnaireId}`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send(editData);
    expect(response.status).toEqual(200);

    const getQnnaire = await getRepository(Questionnaire).findOne({
      where: { id: originalData.questionnaireId },
      relations: ["questionnaireWindows"],
    });
    const mappedQnnaire = await getQnnaire!.getAllWindows();

    expect(mappedQnnaire.questionWindows).toHaveLength(1);
    expect(mappedQnnaire.title).toBe("Edited Qnnaire");
    expect(mappedQnnaire.questionWindows[0].startAt).toBe(
      new Date("2022/12/12").toISOString()
    );
    expect(mappedQnnaire.questionWindows[0].endAt).toBe(
      new Date("2020/12/13").toISOString()
    );
  });

  it("should return 200 if is admin and qns are added", async () => {
    const editData: QuestionnairePatchData = {
      ...originalData,
      title: "Edited Qnnaire",
      status: QuestionnaireStatus.PUBLISHED,
      questionWindows: [
        {
          windowId: originalData.questionWindows[0].windowId,
          startAt: new Date("2022/12/12").toISOString(),
          endAt: new Date("2020/12/13").toISOString(),
          questions: [
            {
              questionText: "My edited question!",
              questionType: QuestionType.SHORT_ANSWER,
              order: 1,
            },
          ],
        },
      ],
      classes: originalData.classes.map((clazz) => clazz.id),
      programmes: originalData.programmes.map((prg) => prg.id),
    };

    const response = await request(server.server)
      .post(
        `${fixtures.api}/questionnaires/edit/${originalData.questionnaireId}`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send(editData);
    expect(response.status).toEqual(200);

    const getQnnaire = await getRepository(Questionnaire).findOne({
      where: { id: originalData.questionnaireId },
      relations: [
        "questionnaireWindows",
        "questionnaireWindows.mainSet",
        "questionnaireWindows.sharedSet",
      ],
    });
    const mappedQnnaire = await getQnnaire!.getAllWindows();
    expect(mappedQnnaire.questionWindows).toHaveLength(1);

    const windowViewer = new QuestionnaireWindowViewer(
      getQnnaire?.questionnaireWindows[0]!
    );
    const mainWindowQns = await windowViewer.getMainSet();
    expect(mainWindowQns.questions).toHaveLength(1);
    expect(mainWindowQns.questions[0].questionText).toBe("My edited question!");
  });

  it("should return 200 if admin and qnOrders are changed", async () => {
    const originalQnOrder: QuestionData =
      originalData.questionWindows[0].questions[0];
    const newOrdering = originalQnOrder.order + 5;

    const editData: QuestionnairePatchData = {
      ...originalData,
      title: "Edited Qnnaire",
      status: QuestionnaireStatus.PUBLISHED,
      questionWindows: [
        {
          windowId: originalData.questionWindows[0].windowId,
          startAt: new Date("2022/12/12").toISOString(),
          endAt: new Date("2020/12/13").toISOString(),
          questions: [
            {
              ...originalQnOrder,
              order: newOrdering,
            },
          ],
        },
      ],
      classes: originalData.classes.map((clazz) => clazz.id),
      programmes: originalData.programmes.map((prg) => prg.id),
    };

    const response = await request(server.server)
      .post(
        `${fixtures.api}/questionnaires/edit/${originalData.questionnaireId}`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send(editData);
    expect(response.status).toEqual(200);

    const getQnnaire = await getRepository(Questionnaire).findOne({
      where: { id: originalData.questionnaireId },
      relations: ["questionnaireWindows", "questionnaireWindows.mainSet"],
    });

    const windowViewer = new QuestionnaireWindowViewer(
      getQnnaire!.questionnaireWindows[0]
    );
    const questions = (await windowViewer.getMainSet()).questions;

    expect(questions).toHaveLength(1);
    expect(questions[0].order).toBe(newOrdering);
  });
});

describe("POST /questionnaires/submissions", () => {
  let originalData: QuestionnaireFullData;
  let answerData: AnswerPostData[];
  let attemptData: AttemptPostData;

  beforeEach(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);

    // create sample questionnaire data
    originalData = await (
      await fixtures.createSampleOneTimeQuestionnaire()
    ).getAllWindows();

    // generate question responses based on questionnaire
    let testQuestionnaireWindow: QuestionnaireWindowData =
      originalData.questionWindows[0];
    let qnnaireWindowId = testQuestionnaireWindow.windowId;
    let questions = testQuestionnaireWindow.questions;
    answerData = questions.map((element) => {
      let answer: AnswerPostData = {
        questionOrderId: element.qnOrderId,
        optionId:
          element.options.length > 0 ? element.options[0].optionId : undefined,
        textResponse:
          "This is a sample answer to some non-multiple choice question!",
      };
      return answer;
    });

    attemptData = {
      qnnaireWindowId: qnnaireWindowId,
      answers: answerData,
    };
  });

  afterAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);
  });

  it("should create answers successfully", async () => {
    let allAnswers = await getRepository(Answer).findAndCount();
    const numAnswersBefore: number = allAnswers[1];
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/submissions`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(attemptData);
    expect(response.status).toBe(200);
    allAnswers = await getRepository(Answer).findAndCount();
    const numAnswersAfter: number = allAnswers[1];
    expect(numAnswersAfter).toBeGreaterThan(numAnswersBefore);
  });

  it("should create an attempt successfully", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/submissions`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(attemptData);
    expect(response.status).toEqual(200);

    const attemptId = response.body.id;
    expect(attemptId).toBeTruthy();

    const createdAttempt = await getRepository(Attempt).find({
      where: { id: attemptId },
      relations: [
        "user",
        "questionnaireWindow",
        "answers",
        "answers.questionOrder",
        "answers.questionOrder.question",
      ],
    });

    expect(createdAttempt).toHaveLength(1);
    expect(createdAttempt[0].user).toBeTruthy();
    expect(createdAttempt[0].questionnaireWindow).toBeTruthy();
    expect(createdAttempt[0].answers.length).toBeGreaterThan(0);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/submissions`)
      .send(attemptData);
    expect(response.status).toBe(401);
  });
});

describe("GET /questionnaires/:questionnaireId/submissions", () => {
  let originalData: QuestionnaireFullData;
  let answerData: AnswerPostData[];
  let attemptData: AttemptPostData;

  beforeEach(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);

    // create sample questionnaire data
    originalData = await (
      await fixtures.createSampleOneTimeQuestionnaire()
    ).getAllWindows();

    // generate question responses based on questionnaire
    let testQuestionnaireWindow: QuestionnaireWindowData =
      originalData.questionWindows[0];
    let qnnaireWindowId = testQuestionnaireWindow.windowId;
    let questions = testQuestionnaireWindow.questions;
    answerData = questions.map((element) => {
      let answer: AnswerPostData = {
        questionOrderId: element.qnOrderId,
        optionId:
          element.options.length > 0 ? element.options[0].optionId : undefined,
        textResponse:
          "This is a sample answer to some non-multiple choice question!",
      };
      return answer;
    });

    attemptData = {
      qnnaireWindowId: qnnaireWindowId,
      answers: answerData,
    };
  });

  afterAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);
  });

  it("should create an attempt successfully", async () => {
    const response = await request(server.server)
      .post(`${fixtures.api}/questionnaires/submissions`)
      .set("Authorization", fixtures.adminAccessToken)
      .send(attemptData);
    expect(response.status).toEqual(200);

    const attemptId = response.body.id;
    expect(attemptId).toBeTruthy();

    const createdAttempt = await getRepository(Attempt).find({
      where: { id: attemptId },
      relations: [
        "user",
        "questionnaireWindow",
        "answers",
        "answers.questionOrder",
        "answers.questionOrder.question",
      ],
    });

    expect(createdAttempt).toHaveLength(1);
    expect(createdAttempt[0].user).toBeTruthy();
    expect(createdAttempt[0].questionnaireWindow).toBeTruthy();
    expect(createdAttempt[0].answers.length).toBeGreaterThan(0);
  });

  it("should return 200 if valid id and is admin", async () => {
    const response = await request(server.server)
      .get(
        `${fixtures.api}/questionnaires/${originalData.questionnaireId}/submissions`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(200);
  });

  it("should return 404 if invalid id", async () => {
    const response = await request(server.server)
      .get(
        `${fixtures.api}/questionnaires/${
          originalData.questionnaireId + 200
        }/submissions`
      )
      .set("Authorization", fixtures.adminAccessToken)
      .send();
    expect(response.status).toEqual(404);
  });

  it("should return 401 if not logged in", async () => {
    const response = await request(server.server)
      .post(
        `${fixtures.api}/questionnaires/${originalData.questionnaireId}/submissions`
      )
      .send(attemptData);
    expect(response.status).toBe(401);
  });
});
