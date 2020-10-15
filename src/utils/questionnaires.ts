import { validateOrReject } from "class-validator";
import { getRepository } from "typeorm";
import { Class } from "../entities/programme/Class";
import { Programme } from "../entities/programme/Programme";
import { ClassQuestionnaire } from "../entities/questionnaire/ClassQuestionnaire";
import { ProgrammeQuestionnaire } from "../entities/questionnaire/ProgrammeQuestionnaire";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";
import {
  QuestionnaireType,
  QuestionnaireWindowPostData,
} from "../types/questionnaires";
import { QuestionPostData } from "../types/questions";
import { createQuestionSet } from "./questions";

async function _createQuestionnaireWindow(
  openAt: Date,
  closeAt: Date,
  mainSet: QuestionSet,
  sharedSet?: QuestionSet
): Promise<QuestionnaireWindow> {
  const data = new QuestionnaireWindow(openAt, closeAt);
  data.mainSet = mainSet;

  if (sharedSet) {
    data.sharedSet = sharedSet;
  }

  await validateOrReject(data);
  const newWindow = getRepository(QuestionnaireWindow).save(data);
  return newWindow;
}

export async function createOneTimeQuestionnaireWindow(
  openAt: Date,
  closeAt: Date,
  questions: QuestionPostData[]
): Promise<QuestionnaireWindow> {
  const mainSet = await createQuestionSet(questions);

  const rv = await _createQuestionnaireWindow(openAt, closeAt, mainSet);
  return rv;
}

export async function createBeforeAfterQuestionnaireWindow(
  before: QuestionnaireWindowPostData,
  after: QuestionnaireWindowPostData,
  sharedSet: QuestionPostData[]
): Promise<[QuestionnaireWindow, QuestionnaireWindow]> {
  const { questions: preSet, openAt: preStart, closeAt: preEnd } = before;

  const { questions: postSet, openAt: postStart, closeAt: postEnd } = after;

  const beforeData = await createQuestionSet(preSet);
  const afterData = await createQuestionSet(postSet);
  const sharedData = await createQuestionSet(sharedSet);

  const beforeWindow = await _createQuestionnaireWindow(
    preStart,
    preEnd,
    beforeData,
    sharedData
  );
  const afterWindow = await _createQuestionnaireWindow(
    postStart,
    postEnd,
    afterData,
    sharedData
  );

  return [beforeWindow, afterWindow];
}

/**
 * Creates a questionnaire and the related questions.
 *
 * @param name Questionnaire name.
 * @param type Type of questionnaire.
 * @param questionnaireWindows Window list each containing question list, openAt, closeAt.
 * @param sharedQuestions Question list - this set is shared in the case of before/after.
 * @returns Newly created questionnaire. It will hold the created (with id) qnWindows, qnOrders, qns and options in it.
 */
export async function createQuestionnaireWithQuestions(
  name: string,
  type: QuestionnaireType,
  questionnaireWindows: QuestionnaireWindowPostData[],
  sharedQuestions: QuestionPostData[]
): Promise<Questionnaire> {
  if (
    questionnaireWindows.length === 2 &&
    type === QuestionnaireType.PRE_POST
  ) {
    // before-after
    const before = questionnaireWindows[0];
    const after = questionnaireWindows[1];
    const windows = await createBeforeAfterQuestionnaireWindow(
      before,
      after,
      sharedQuestions
    );

    const data = new Questionnaire(name, type);
    data.questionnaireWindows = windows;

    // skip .validate() since the class calls it before insert
    const rv = await getRepository(Questionnaire).save(data);
    return rv;
  }

  if (
    questionnaireWindows.length === 1 &&
    type === QuestionnaireType.ONE_TIME
  ) {
    // one-time
    const { openAt, closeAt, questions } = questionnaireWindows[0];
    const window = await createOneTimeQuestionnaireWindow(
      openAt,
      closeAt,
      questions
    );

    const data = new Questionnaire(name, type);
    data.questionnaireWindows = [window];
    // skip .validate() since the class calls it before insert
    const rv = await getRepository(Questionnaire).save(data);
    return rv;
  }

  throw new Error(
    `Invalid length of questionnaireWindows - received ${questionnaireWindows.length}`
  );
}

/**
 * Associates a list of classes and programmes to a given questionnaire.
 *
 * @param classes List of class ids.
 * @param programmes List of programme ids.
 * @param questionnaire Questionnaire to associate with. It needs an id field.
 */
export async function associateQuestionnaireWithClassesAndProgrammes(
  classes: number[],
  programmes: number[],
  questionnaire: Questionnaire
) {
  if (classes.length > 0) {
    const classIds = classes.map((id) => {
      return { id };
    });
    const classList = await getRepository(Class).find({ where: classIds });
    const classRelations = classList.map(
      (c) => new ClassQuestionnaire(c, questionnaire)
    );

    const saveClassRelations = await getRepository(ClassQuestionnaire).save(
      classRelations
    );
    questionnaire.classQuestionnaires = saveClassRelations;
  }

  if (programmes.length > 0) {
    const programmeIds = programmes.map((id) => {
      return { id };
    });
    const programmesList = await getRepository(Programme).find({
      where: programmeIds,
    });
    const programmeRelations = programmesList.map(
      (p) => new ProgrammeQuestionnaire(p, questionnaire)
    );

    const saveProgrammeRelations = await getRepository(
      ProgrammeQuestionnaire
    ).save(programmeRelations);

    questionnaire.programmeQuestionnaires = saveProgrammeRelations;
  }

  const saved = await getRepository(Questionnaire).save(questionnaire);
  return saved;
}
