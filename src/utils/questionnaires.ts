import { validateOrReject } from "class-validator";
import { getRepository } from "typeorm";
import { Class } from "../entities/programme/Class";
import { Programme } from "../entities/programme/Programme";
import { ClassQuestionnaire } from "../entities/questionnaire/ClassQuestionnaire";
import { ProgrammeQuestionnaire } from "../entities/questionnaire/ProgrammeQuestionnaire";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";
import {
  QuestionnaireEditData,
  QuestionnaireType,
  QuestionnaireWindowEditData,
  QuestionnaireWindowPostData,
} from "../types/questionnaires";
import {
  QuestionData,
  QuestionPostData,
  QuestionSetEditData,
} from "../types/questions";
import { createQuestionOrders, createQuestionSet } from "./questions";

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
  const { questions: preSet, startAt: preStart, endAt: preEnd } = before;

  const { questions: postSet, startAt: postStart, endAt: postEnd } = after;

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
  sharedQuestions?: QuestionPostData[]
): Promise<Questionnaire> {
  if (
    questionnaireWindows.length === 2 &&
    type === QuestionnaireType.PRE_POST &&
    sharedQuestions
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
    const { startAt, endAt, questions } = questionnaireWindows[0];
    const window = await createOneTimeQuestionnaireWindow(
      startAt,
      endAt,
      questions
    );

    const data = new Questionnaire(name, type);
    data.questionnaireWindows = [window];
    // skip .validate() since the class calls it before insert
    const rv = await getRepository(Questionnaire).save(data);
    return rv;
  }

  throw new Error(
    `Invalid arguments - received ${questionnaireWindows.length} windows with ${type} as desired type`
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

/**
 * Edits a saved questionnaire's attributes
 * @param savedQnnaire the questionnaire to change
 * @param editData values to edit with
 */
export async function updateAttributes(
  savedQnnaire: Questionnaire,
  editData: Omit<
    QuestionnaireEditData,
    "programmes" | "classes" | "questionWindows" | "sharedQuestions"
  >
): Promise<Questionnaire> {
  if (!savedQnnaire.id) {
    throw new Error(
      `Questionnaire does not have an id. Has it been saved to database?`
    );
  }

  savedQnnaire.name = editData.title;
  savedQnnaire.questionnaireType = editData.type;
  savedQnnaire.questionnaireStatus = editData.status;

  const updated = await getRepository(Questionnaire).save(savedQnnaire);
  return updated;
}

/**
 * Edits a saved questionnaire's programmes/classes relations
 */
export async function updateProgrammesClassesRelations(
  savedQnnaire: Questionnaire,
  editData: Pick<QuestionnaireEditData, "programmes" | "classes">
): Promise<Questionnaire> {
  const classesOR = editData.classes.map((id) => Object.assign({}, { id }));
  const programmesOR = editData.classes.map((id) => Object.assign({}, { id }));
  const classes = await getRepository(Class).find({
    select: ["id"],
    where: classesOR,
  });
  const programmes = await getRepository(Programme).find({
    select: ["id"],
    where: programmesOR,
  });

  const newClassQnnaires = classes.map((c) => {
    return new ClassQuestionnaire(c, savedQnnaire);
  });
  const newProgrammeQnnaires = programmes.map((p) => {
    return new ProgrammeQuestionnaire(p, savedQnnaire);
  });

  const savedClassQnnaires = await getRepository(ClassQuestionnaire).save(
    newClassQnnaires
  );
  const savedProgrammeQnnaires = await getRepository(
    ProgrammeQuestionnaire
  ).save(newProgrammeQnnaires);

  savedQnnaire.classQuestionnaires = savedClassQnnaires;
  savedQnnaire.programmeQuestionnaires = savedProgrammeQnnaires;
  const updated = await getRepository(Questionnaire).save(savedQnnaire);
  return updated;
}

async function updateWindow(
  savedWindow: QuestionnaireWindow,
  editData: QuestionnaireWindowEditData,
  sharedQnsData: QuestionSetEditData | undefined
): Promise<QuestionnaireWindow> {
  if (savedWindow.id !== editData.windowId) {
    throw new Error(
      `Editing refers to window with id ${editData.windowId}` +
        `but given saved window with id ${savedWindow.id}`
    );
  }

  savedWindow.openAt = new Date(editData.startAt);
  savedWindow.closeAt = new Date(editData.endAt);

  const updatedMainQnSet = await updateQnSet(savedWindow.mainSet, editData);
  savedWindow.mainSet = updatedMainQnSet;

  if (savedWindow.sharedSet && sharedQnsData) {
    const updatedSharedQnSet = await updateQnSet(
      savedWindow.sharedSet,
      sharedQnsData
    );
    savedWindow.sharedSet = updatedSharedQnSet;
  }

  const updated = await getRepository(QuestionnaireWindow).save(savedWindow);
  return updated;
}

async function updateQnSet(
  savedQnSet: QuestionSet,
  editData: QuestionSetEditData
): Promise<QuestionSet> {
  if (!savedQnSet.id) {
    throw new Error(`The provided Question Set has no id`);
  }

  const qnOrders: Map<number, QuestionOrder> = new Map();
  savedQnSet.questionOrders.forEach((order) => {
    qnOrders.set(order.id, order);
  });

  const ordersToKeep: QuestionOrder[] = [];
  const ordersToCreate: QuestionPostData[] = [];
  editData.questions.forEach((qn) => {
    const { qnOrderId } = qn as QuestionData;

    if (qnOrderId) {
      if (!qnOrders.has(qnOrderId)) {
        throw new Error(
          `Window does not contain the given question order ${qnOrderId}`
        );
      }

      ordersToKeep.push(qnOrders.get(qnOrderId)!);
      return;
    } else {
      ordersToCreate.push(qn as QuestionPostData);
    }
  });

  const ordersToAdd = await createQuestionOrders(ordersToCreate);
  savedQnSet.questionOrders = ordersToKeep.concat(ordersToAdd);

  if (savedQnSet.questionOrders.length === 0) {
    throw new Error(`QnSet requires at least 1 question`);
  }

  const updated = await getRepository(QuestionSet).save(savedQnSet);
  return updated;
}

/**
 * Edits a saved questionnaire's questionWindows
 */
export async function updateWindowRelations(
  savedQnnaire: Questionnaire,
  editData: Pick<QuestionnaireEditData, "questionWindows" | "sharedQuestions">
): Promise<Questionnaire> {
  const windows = await Promise.all(
    savedQnnaire.questionnaireWindows.map(async (win) => {
      const findEditWindow = editData.questionWindows.filter(
        (w) => w.windowId === win.id
      );
      if (findEditWindow.length === 0) {
        throw new Error(
          `Could not find corresponding window (was looking for window of id ${win.id})`
        );
      }

      const editWindowData = findEditWindow[0];
      const updatedWindows = await updateWindow(
        win,
        editWindowData,
        editData.sharedQuestions
      );

      return updatedWindows;
    })
  );

  savedQnnaire.questionnaireWindows = windows;
  const updated = await getRepository(Questionnaire).save(savedQnnaire);
  return updated;
}

export async function updateQnnaire(
  savedQnnaire: Questionnaire,
  editData: QuestionnaireEditData
): Promise<Questionnaire> {
  if (!savedQnnaire.id) {
    throw new Error(
      `Questionnaire does not have an id. Has it been saved to database?`
    );
  }

  const savedQnnaireMatchesEditData =
    savedQnnaire.questionnaireWindows.filter((window) => {
      const matchingWindows = editData.questionWindows.filter(
        (w) => w.windowId === window.id
      );
      return matchingWindows.length === 1;
    }).length === savedQnnaire.questionnaireWindows.length;
  if (!savedQnnaireMatchesEditData) {
    throw new Error(`Saved qnnaire does not match edit data`);
  }

  let updated: Questionnaire;
  updated = await updateAttributes(savedQnnaire, editData);
  updated = await updateProgrammesClassesRelations(savedQnnaire, editData);
  updated = await updateWindowRelations(savedQnnaire, editData);

  return updated;
}
