import { Questionnaire } from "../../../entities/questionnaire/Questionnaire";
import {
  QuestionnaireStatus,
  QuestionnaireType,
  QuestionnaireWindowPostData,
} from "../../../types/questionnaires";
import { getRepository } from "typeorm";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";
import { validate } from "class-validator";
import {
  OneTimeQuestionnaireCreator,
  PrePostQuestionnaireCreator,
} from "../../../services/questionnaire";
import { QuestionPostData, QuestionType } from "../../../types/questions";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create questionnaire", () => {
  afterEach(async () => {
    await getRepository(Questionnaire).delete({});
  });

  it("with valid name and type", async () => {
    let data: Questionnaire = new Questionnaire(
      "Youth Development Framework",
      QuestionnaireType.ONE_TIME
    );
    let questionnaire: Questionnaire = await getRepository(Questionnaire).save(
      data
    );
    const errors = await validate(questionnaire);

    expect(questionnaire.id).toBeTruthy();
    expect(errors.length).toBe(0);
  });

  it("with empty name but valid type", async () => {
    let data: Questionnaire = new Questionnaire("", QuestionnaireType.ONE_TIME);
    const errors = await validate(data);

    expect(errors.length).not.toBe(0);
  });
});

describe("Create questionnaire using util methods", () => {
  afterEach(async () => {
    await synchronize(server);
  });

  const OPEN_AT: Date = new Date("2019-05-20");
  const CLOSE_AT: Date = new Date("2020-05-27");

  const OPEN_AT_AFTER = new Date("2021-05-20");
  const CLOSE_AT_AFTER = new Date("2022-05-27");

  const QUESTION_1 = "How are you?";
  const QUESTION_2 = "Have you eaten?";
  const QUESTIONS: QuestionPostData[] = [QUESTION_1, QUESTION_2].map(
    (text, index) => {
      return {
        order: index,
        questionType: QuestionType.SHORT_ANSWER,
        questionText: text,
      };
    }
  );

  const BEFORE_ONLY = "Before: How young are you?";
  const AFTER_ONLY = "After: How old are you?";

  const BEFORE: QuestionPostData[] = [BEFORE_ONLY].map((text, index) => {
    return {
      order: index,
      questionType: QuestionType.SHORT_ANSWER,
      questionText: text,
    };
  });

  const AFTER: QuestionPostData[] = [AFTER_ONLY].map((text, index) => {
    return {
      order: index,
      questionType: QuestionType.SHORT_ANSWER,
      questionText: text,
    };
  });

  it("create one-time", async () => {
    const input: QuestionnaireWindowPostData = {
      startAt: OPEN_AT,
      endAt: CLOSE_AT,
      questions: QUESTIONS,
    };
    const creator = new OneTimeQuestionnaireCreator({
      title: "First Questionnaire!",
      type: QuestionnaireType.ONE_TIME,
      questionWindows: [input],
      sharedQuestions: {
        questions: [],
      },
      classes: [],
      programmes: [],
    });
    const newQuestionnaire = await creator.createQuestionnaire();

    expect(newQuestionnaire.id).toBeTruthy();

    const questionnaire = await getRepository(Questionnaire).findOneOrFail({
      where: { id: newQuestionnaire.id },
      relations: [
        "questionnaireWindows",
        "questionnaireWindows.mainSet",
        "questionnaireWindows.sharedSet",
        "questionnaireWindows.mainSet.questionOrders",
        "questionnaireWindows.mainSet.questionOrders.question",
      ],
    });

    expect(questionnaire).toBeTruthy();
    expect(questionnaire.questionnaireWindows).toHaveLength(1);

    const window = questionnaire.questionnaireWindows[0];
    expect(window.mainSet.id).toBeTruthy();
    expect(window.sharedSet?.id).toBeFalsy();

    const { questionOrders } = window.mainSet;
    expect(questionOrders).toHaveLength(2);

    const questions = questionOrders.map((order) => {
      const { question } = order;
      expect(question.id).toBeTruthy();
      return question.questionText;
    });
    expect(questions).toHaveLength(2);
    expect(questions).toContain(QUESTION_1);
    expect(questions).toContain(QUESTION_2);
  });

  it("create before-after", async () => {
    const input: QuestionnaireWindowPostData[] = [
      {
        startAt: OPEN_AT,
        endAt: CLOSE_AT,
        questions: BEFORE,
      },
      {
        startAt: OPEN_AT_AFTER,
        endAt: CLOSE_AT_AFTER,
        questions: AFTER,
      },
    ];
    const creator = new PrePostQuestionnaireCreator({
      title: "First Questionnaire!",
      type: QuestionnaireType.PRE_POST,
      questionWindows: input,
      sharedQuestions: {
        questions: QUESTIONS,
      },
      classes: [],
      programmes: [],
    });

    const newQuestionnaire = await creator.createQuestionnaire();

    expect(newQuestionnaire.id).toBeTruthy();

    const questionnaire = await getRepository(Questionnaire).findOneOrFail({
      where: { id: newQuestionnaire.id },
      relations: [
        "questionnaireWindows",
        "questionnaireWindows.mainSet",
        "questionnaireWindows.sharedSet",
        "questionnaireWindows.mainSet.questionOrders",
        "questionnaireWindows.sharedSet.questionOrders",
        "questionnaireWindows.sharedSet.questionOrders.question",
      ],
    });

    expect(questionnaire).toBeTruthy();
    expect(questionnaire.questionnaireWindows).toHaveLength(2);

    const before = questionnaire.questionnaireWindows[0];
    const after = questionnaire.questionnaireWindows[1];

    expect(before.mainSet.id).toBeTruthy();
    expect(before.sharedSet?.id).toBeTruthy();
    expect(after.mainSet.id).toBeTruthy();
    expect(after.sharedSet?.id).toBeTruthy();

    const { questionOrders: beforeOnly } = before.mainSet;
    expect(beforeOnly).toHaveLength(1);
    const { questionOrders: afterOnly } = after.mainSet;
    expect(afterOnly).toHaveLength(1);

    expect(before.sharedSet?.id).toEqual(after.sharedSet?.id);

    const sharedSetQnOrders = before.sharedSet?.questionOrders;
    expect(sharedSetQnOrders).toHaveLength(2);

    const questions = sharedSetQnOrders?.map((order) => {
      const { question } = order;
      expect(question.id).toBeTruthy();
      return question.questionText;
    });
    expect(questions).toHaveLength(2);
    expect(questions).toContain(QUESTION_1);
    expect(questions).toContain(QUESTION_2);
  });
});
