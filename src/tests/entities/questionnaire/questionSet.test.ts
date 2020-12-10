import { QuestionSet } from "../../../entities/questionnaire/QuestionSet";
import { getRepository } from "typeorm";
import ApiServer from "../../../server";
import { Fixtures, loadFixtures, synchronize } from "../../../utils/tests";
import { QuestionPostData, QuestionType } from "../../../types/questions";
import { QuestionSetCreator } from "../../../utils/questions";

let server: ApiServer;
let fixtures: Fixtures;

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

describe("Create questionSets using util methods", () => {
  let shortAnswerQns: Readonly<string[]>;
  let longAnswerQns: Readonly<string[]>;
  let moodQns: Readonly<string[]>;
  let scaleQns: Readonly<string[]>;
  let mcqQn: Readonly<string>;

  let moodOptions: Readonly<string[]>;
  let scaleOptions: Readonly<string[]>;
  let mcqOptions: Readonly<string[]>;

  let shortAnswerPostList: QuestionPostData[];
  let longAnswerPostList: QuestionPostData[];
  let moodQnsPostList: QuestionPostData[];
  let scaleQnsPostList: QuestionPostData[];
  let mcqQnsPostList: QuestionPostData[];

  const mapFunction = (questionType: QuestionType) => (
    prompt: string,
    index: number
  ): QuestionPostData => {
    return {
      order: index,
      questionType: questionType,
      questionText: prompt,
    };
  };

  const didCreationMethodLoadRelationIds = (
    qnSet: QuestionSet,
    qnOrdersLength: number
  ): boolean => {
    const hasQnSetId = Boolean(qnSet.id);
    const hasQuestionOrderLength =
      qnSet.questionOrders.length === qnOrdersLength;
    const hasQnOrderId = Boolean(qnSet.questionOrders[0].id);
    const hasQnId = Boolean(qnSet.questionOrders[0].question.id);
    return hasQnSetId && hasQuestionOrderLength && hasQnOrderId && hasQnId;
  };

  beforeAll(async () => {
    await synchronize(server);
    fixtures = await loadFixtures(server);

    shortAnswerQns = fixtures.shortAnswerQuestionsSet1;
    longAnswerQns = fixtures.longAnswerQuestionsSet1;
    moodQns = fixtures.moodQuestionsSet1;
    scaleQns = fixtures.scaleAnswerQuestionsSet1;
    mcqQn = fixtures.mcqQuestion1;

    moodOptions = fixtures.moodOptions;
    scaleOptions = fixtures.scaleOptions;
    mcqOptions = fixtures.mcqQuestion1Options;

    shortAnswerPostList = shortAnswerQns.map(
      mapFunction(QuestionType.SHORT_ANSWER)
    );
    longAnswerPostList = longAnswerQns.map(
      mapFunction(QuestionType.LONG_ANSWER)
    );
    moodQnsPostList = moodQns
      .map(mapFunction(QuestionType.MOOD))
      .map((data) => {
        const options = moodOptions.map((optionText) => {
          return {
            optionText,
          };
        });
        return { ...data, options };
      });
    scaleQnsPostList = scaleQns
      .map(mapFunction(QuestionType.SCALE))
      .map((data) => {
        const options = scaleOptions.map((optionText) => {
          return {
            optionText,
          };
        });
        return { ...data, options };
      });
    mcqQnsPostList = [mcqQn]
      .map(mapFunction(QuestionType.MULTIPLE_CHOICE))
      .map((data) => {
        const options = mcqOptions.map((optionText) => {
          return {
            optionText,
          };
        });
        return { ...data, options };
      });
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create short answer questions", async () => {
    const creator = new QuestionSetCreator();
    const questionSet = await creator.createQuestionSet(shortAnswerPostList);
    expect(
      didCreationMethodLoadRelationIds(questionSet, shortAnswerPostList.length)
    ).toBe(true);

    const searchResult = await getRepository(QuestionSet).findOne({
      where: { id: questionSet.id },
      relations: ["questionOrders", "questionOrders.question"],
    });
    const { questionOrders } = searchResult!;
    expect(questionOrders).toHaveLength(shortAnswerPostList.length);

    const questionTexts = questionOrders.map((q) => q.question.questionText);
    const questionType = questionOrders.map((q) => q.question.questionType);

    shortAnswerQns.forEach((qn) => {
      expect(questionTexts).toContain(qn);
    });
    expect(questionType).toContain(QuestionType.SHORT_ANSWER);
  });

  it("create long answer questions", async () => {
    const creator = new QuestionSetCreator();
    const questionSet = await creator.createQuestionSet(longAnswerPostList);
    expect(
      didCreationMethodLoadRelationIds(questionSet, longAnswerPostList.length)
    ).toBe(true);

    const searchResult = await getRepository(QuestionSet).findOne({
      where: { id: questionSet.id },
      relations: ["questionOrders", "questionOrders.question"],
    });
    const { questionOrders } = searchResult!;
    expect(questionOrders).toHaveLength(longAnswerPostList.length);
  });

  it("create MCQs", async () => {
    const creator = new QuestionSetCreator();
    const questionSet = await creator.createQuestionSet(mcqQnsPostList);
    expect(
      didCreationMethodLoadRelationIds(questionSet, mcqQnsPostList.length)
    ).toBe(true);

    const searchResult = await getRepository(QuestionSet).findOne({
      where: { id: questionSet.id },
      relations: ["questionOrders", "questionOrders.question"],
    });
    const { questionOrders } = searchResult!;
    expect(questionOrders).toHaveLength(mcqQnsPostList.length);
  });

  it("create mood questions", async () => {
    const creator = new QuestionSetCreator();
    const questionSet = await creator.createQuestionSet(moodQnsPostList);
    expect(
      didCreationMethodLoadRelationIds(questionSet, moodQnsPostList.length)
    ).toBe(true);

    const searchResult = await getRepository(QuestionSet).findOne({
      where: { id: questionSet.id },
      relations: ["questionOrders", "questionOrders.question"],
    });
    const { questionOrders } = searchResult!;
    expect(questionOrders).toHaveLength(moodQnsPostList.length);
  });

  it("create scale questions", async () => {
    const creator = new QuestionSetCreator();
    const questionSet = await creator.createQuestionSet(scaleQnsPostList);
    expect(
      didCreationMethodLoadRelationIds(questionSet, scaleQnsPostList.length)
    ).toBe(true);

    const searchResult = await getRepository(QuestionSet).findOne({
      where: { id: questionSet.id },
      relations: ["questionOrders", "questionOrders.question"],
    });
    const { questionOrders } = searchResult!;
    expect(questionOrders).toHaveLength(scaleQnsPostList.length);
  });
});
