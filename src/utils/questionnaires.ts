import { validateOrReject } from "class-validator";
import { getRepository } from "typeorm";
import { edit } from "../controllers/QuestionnaireController";
import { Class } from "../entities/programme/Class";
import { Programme } from "../entities/programme/Programme";
import { ClassQuestionnaire } from "../entities/questionnaire/ClassQuestionnaire";
import { ProgrammeQuestionnaire } from "../entities/questionnaire/ProgrammeQuestionnaire";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";
import {
  QUESTIONNAIRE_WINDOW_EDITOR_ERROR,
  QUESTIONNAIRE_WINDOW_VIEWER_ERROR,
} from "../types/errors";
import {
  QuestionnaireEditData,
  QuestionnaireType,
  QuestionnaireWindowEditData,
  QuestionnaireWindowPostData,
} from "../types/questionnaires";
import {
  QuestionData,
  QuestionPostData,
  QuestionSetData,
  QuestionSetEditData,
} from "../types/questions";
import {
  QuestionSetCreator,
  QuestionSetEditor,
  QuestionSetViewer,
} from "./questions";

class QuestionnaireWindowEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_WINDOW_EDITOR_ERROR;
  }
}

class QuestionnaireWindowViewerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_WINDOW_VIEWER_ERROR;
  }
}

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
  const creator = new QuestionSetCreator();
  const mainSet = await creator.createQuestionSet(questions);

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

  const creator = new QuestionSetCreator();
  const beforeData = await creator.createQuestionSet(preSet);
  const afterData = await creator.createQuestionSet(postSet);
  const sharedData = await creator.createQuestionSet(sharedSet);

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
  const mainEditor = new QuestionnaireWindowEditor(
    savedWindow,
    editData,
    sharedQnsData
  );
  const updatedWindowWithMainQnSet = await mainEditor.editQnnaireWindowAttributesAndMainQnSet();

  if (savedWindow.sharedSet && sharedQnsData) {
    const updatedSharedQnSet = await mainEditor.editSharedQnSet();
    savedWindow.sharedSet = updatedSharedQnSet;
  }

  const updated = await getRepository(QuestionnaireWindow).save(savedWindow);
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

/**
 * Edits a QuestionnaireWindoww.
 */
export class QuestionnaireWindowEditor {
  private qnnaireWindow: QuestionnaireWindow;

  private mainSet: QuestionSet;
  private editWindowAndMainQnSetData: QuestionnaireWindowEditData;
  private mainSetEditor: QuestionSetEditor;

  private sharedSet: QuestionSet | null;
  private editSharedQnSetData: QuestionSetEditData | null;
  private sharedSetEditor: QuestionSetEditor | null;

  constructor(
    qnnaireWindow: QuestionnaireWindow,
    editWindowAndMainQnSetData: QuestionnaireWindowEditData,
    editSharedQnSetData: QuestionSetEditData | undefined
  ) {
    this.validateEditorOrReject(
      qnnaireWindow,
      editWindowAndMainQnSetData,
      editSharedQnSetData
    );
    this.qnnaireWindow = qnnaireWindow;

    this.mainSet = qnnaireWindow.mainSet;
    this.editWindowAndMainQnSetData = editWindowAndMainQnSetData;
    this.mainSetEditor = new QuestionSetEditor(
      this.mainSet,
      this.editWindowAndMainQnSetData
    );

    this.sharedSet = qnnaireWindow.sharedSet ?? null;
    this.editSharedQnSetData = editSharedQnSetData ?? null;
    this.sharedSetEditor = this.sharedSet
      ? new QuestionSetEditor(this.sharedSet, this.editSharedQnSetData!)
      : null;
  }

  private validateEditor(
    qnnaireWindow: QuestionnaireWindow,
    editWindowAndMainQnSetData: QuestionnaireWindowEditData,
    editSharedQnSetData: QuestionSetEditData | undefined
  ): boolean {
    const windowHasId = Boolean(qnnaireWindow.id);

    const editDataMatchesWindow =
      editWindowAndMainQnSetData.windowId === qnnaireWindow.id;

    const hasCorrespondingEditSharedQnSetData = qnnaireWindow.sharedSet
      ? Boolean(editSharedQnSetData)
      : true;

    return (
      windowHasId &&
      editDataMatchesWindow &&
      hasCorrespondingEditSharedQnSetData
    );
  }

  private validateEditorOrReject(
    qnnaireWindow: QuestionnaireWindow,
    editWindowAndMainQnSet: QuestionnaireWindowEditData,
    editSharedQnSet: QuestionSetEditData | undefined
  ): boolean {
    const isValid = this.validateEditor(
      qnnaireWindow,
      editWindowAndMainQnSet,
      editSharedQnSet
    );
    if (!isValid) {
      throw new QuestionnaireWindowEditorError(
        "Provided QuestionnaireWindow has no id"
      );
    }
    return isValid;
  }

  public hasSharedSet(): boolean {
    return Boolean(this.sharedSet);
  }

  public hasSharedSetOrReject(): boolean {
    const isValid = this.hasSharedSet();
    if (!isValid) {
      throw new QuestionnaireWindowViewerError(
        `QnnaireWindow has not shared set`
      );
    }
    return isValid;
  }

  public async editQnnaireWindowAttributesAndMainQnSet(): Promise<QuestionnaireWindow> {
    const updatedMainQnSet = await this.mainSetEditor.editQnSet();
    this.qnnaireWindow.openAt = new Date(
      this.editWindowAndMainQnSetData.startAt
    );
    this.qnnaireWindow.closeAt = new Date(
      this.editWindowAndMainQnSetData.endAt
    );
    this.qnnaireWindow.mainSet = updatedMainQnSet;

    const updatedQnnaireWindow = await getRepository(QuestionnaireWindow).save(
      this.qnnaireWindow
    );
    return updatedQnnaireWindow;
  }

  public async editSharedQnSet(): Promise<QuestionSet> {
    this.hasSharedSetOrReject();
    const updated = await this.sharedSetEditor!.editQnSet();
    return updated;
  }
}

/**
 * Reads and formats the contained QuestionnaireWindow.
 */
export class QuestionnaireWindowViewer {
  private qnnaireWindow: QuestionnaireWindow;
  private mainSet: QuestionSet;
  private sharedSet: QuestionSet | null;
  private mainSetViewer: QuestionSetViewer;
  private sharedSetViewer: QuestionSetViewer | null;

  constructor(qnnaireWindow: QuestionnaireWindow) {
    this.validateHasIdOrReject(qnnaireWindow);
    this.qnnaireWindow = qnnaireWindow;

    this.mainSet = qnnaireWindow.mainSet;
    this.mainSetViewer = new QuestionSetViewer(this.mainSet);

    this.sharedSet = qnnaireWindow.sharedSet;
    this.sharedSetViewer = this.sharedSet
      ? new QuestionSetViewer(this.sharedSet)
      : null;
  }

  private validateHasId(qnnaireWindow: QuestionnaireWindow): boolean {
    return Boolean(qnnaireWindow.id);
  }

  private validateHasIdOrReject(qnnaireWindow: QuestionnaireWindow): boolean {
    const isValid = this.validateHasId(qnnaireWindow);
    if (!isValid) {
      throw new QuestionnaireWindowViewerError(`QnnaireWindow has no id`);
    }
    return isValid;
  }

  public hasSharedSet(): boolean {
    return Boolean(this.sharedSet);
  }

  public hasSharedSetOrReject(): boolean {
    const isValid = this.hasSharedSet();
    if (!isValid) {
      throw new QuestionnaireWindowViewerError(
        `QnnaireWindow has not shared set`
      );
    }
    return isValid;
  }

  public async getMainSet(): Promise<QuestionSetData> {
    const questions = await this.mainSetViewer.getQuestionSet();
    return {
      questions,
    };
  }

  public async getSharedSet(): Promise<QuestionSetData> {
    this.hasSharedSetOrReject();
    const questions = await this.sharedSetViewer!.getQuestionSet();
    return {
      questions,
    };
  }
}
