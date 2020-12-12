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
  ONE_TIME_QUESTIONNAIRE_CREATOR_ERROR,
  ONE_TIME_QUESTIONNAIRE_EDITOR_ERROR,
  PRE_POST_QUESTIONNAIRE_CREATOR_ERROR,
  PRE_POST_QUESTIONNAIRE_EDITOR_ERROR,
  QUESTIONNAIRE_PROGRAMS_AND_CLASSES_CREATOR_ERROR,
  QUESTIONNAIRE_PROGRAMS_AND_CLASSES_EDITOR_ERROR,
  QUESTIONNAIRE_VALIDATOR_ERROR,
  QUESTIONNAIRE_WINDOW_CREATOR_ERROR,
  QUESTIONNAIRE_WINDOW_EDITOR_ERROR,
  QUESTIONNAIRE_WINDOW_VIEWER_ERROR,
} from "../types/errors";
import {
  QuestionnaireEditData,
  QuestionnairePostData,
  QuestionnaireType,
  QuestionnaireWindowEditData,
  QuestionnaireWindowPostData,
} from "../types/questionnaires";
import {
  QuestionPostData,
  QuestionSetData,
  QuestionSetEditData,
  QuestionSetPostData,
} from "../types/questions";
import {
  QuestionSetCreator,
  QuestionSetEditor,
  QuestionSetViewer,
} from "./questions";

class PrePostQuestionnaireCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PRE_POST_QUESTIONNAIRE_CREATOR_ERROR;
  }
}

class OneTimeQuestionnaireCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ONE_TIME_QUESTIONNAIRE_CREATOR_ERROR;
  }
}

class QuestionnaireProgrammesAndClassesCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_PROGRAMS_AND_CLASSES_CREATOR_ERROR;
  }
}

class QuestionnaireProgrammesAndClassesEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_PROGRAMS_AND_CLASSES_EDITOR_ERROR;
  }
}

class QuestionnaireValidatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_VALIDATOR_ERROR;
  }
}

class OneTimeQuestionnaireEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ONE_TIME_QUESTIONNAIRE_EDITOR_ERROR;
  }
}

class PrePostQuestionnaireEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PRE_POST_QUESTIONNAIRE_EDITOR_ERROR;
  }
}

class QuestionnaireWindowCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_WINDOW_CREATOR_ERROR;
  }
}

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

/**
 * Provides methods to validate a Questionnaire.
 * In particular, checks if `isOneTimeQnnaire()` and `isPrePostQnnaire()`
 */
export class QuestionnaireValidator {
  validateQnnaire(qnnaire: Questionnaire): boolean {
    const hasId = Boolean(qnnaire.id);

    const isValidOneTimeQnnaire = this.isOneTimeQnnaire(qnnaire);
    const isValidPrePostQnnaire = this.isPrePostQnnaire(qnnaire);

    return hasId && (isValidOneTimeQnnaire || isValidPrePostQnnaire);
  }

  validateQnnaireOrReject(qnnaire: Questionnaire): boolean {
    const isValid = this.validateQnnaire(qnnaire);
    if (!isValid) {
      throw new QuestionnaireValidatorError("Provided Questionnaire has no id");
    }
    return isValid;
  }

  isOneTimeQnnaire(qnnaire: Questionnaire): boolean {
    const qnnaireWindowsLength = qnnaire.questionnaireWindows.length;

    const isValidOneTimeQnnaire =
      qnnaireWindowsLength === 1 &&
      qnnaire.questionnaireType === QuestionnaireType.ONE_TIME;

    return isValidOneTimeQnnaire;
  }

  isPrePostQnnaire(qnnaire: Questionnaire): boolean {
    const qnnaireWindowsLength = qnnaire.questionnaireWindows.length;

    let isValidPrePostQnnaire: boolean = false;

    if (qnnaireWindowsLength === 2) {
      const hasLoadedBothSharedSets =
        Boolean(qnnaire.questionnaireWindows[0]?.sharedSet?.id) &&
        Boolean(qnnaire.questionnaireWindows[1]?.sharedSet?.id);

      const hasMatchingSharedSetId =
        qnnaire.questionnaireWindows[0].sharedSet!.id ===
        qnnaire.questionnaireWindows[1].sharedSet!.id;

      isValidPrePostQnnaire =
        hasLoadedBothSharedSets &&
        hasMatchingSharedSetId &&
        qnnaire.questionnaireType === QuestionnaireType.PRE_POST;
    }

    return isValidPrePostQnnaire;
  }
}

type ProgrammeClasses = {
  programmes: Programme[];
  classes: Class[];
};

export abstract class QuestionnaireProgrammesAndClassesBase {
  async getRequestedProgrammesAndClasses(
    programmesData: number[],
    classesData: number[]
  ): Promise<ProgrammeClasses> {
    const programmesOR = programmesData.map((id) => Object.assign({}, { id }));
    const classesOR = classesData.map((id) => Object.assign({}, { id }));

    // seems like with an [], typeorm will return everything
    const programmes =
      programmesOR.length === 0
        ? []
        : await getRepository(Programme).find({
            select: ["id"],
            where: programmesOR,
          });
    const classes =
      classesOR.length === 0
        ? []
        : await getRepository(Class).find({
            select: ["id"],
            where: classesOR,
          });

    if (programmesData.length !== programmes.length) {
      throw new QuestionnaireProgrammesAndClassesEditorError(
        `One or more programmeIds given is invalid` +
          `(Received ${programmesData.length}. Found: ${programmes.length}`
      );
    }
    if (classesData.length !== classes.length) {
      throw new QuestionnaireProgrammesAndClassesEditorError(
        `One or more classIds given is invalid ` +
          `(Received ${classesData.length}. Found: ${classes.length}`
      );
    }
    return { programmes, classes };
  }
}

export class QuestionnaireProgrammesAndClassesCreator extends QuestionnaireProgrammesAndClassesBase {
  private _qnnaire: Questionnaire;
  private programmes: number[];
  private classes: number[];

  constructor(programmes: number[], classes: number[], qnnaire: Questionnaire) {
    if (!qnnaire.id) {
      throw new QuestionnaireProgrammesAndClassesCreatorError(
        "Provided Questionnaire has no id"
      );
    }

    super();
    this._qnnaire = qnnaire;
    this.programmes = programmes;
    this.classes = classes;
  }

  public async createRelations(): Promise<ProgrammeClassesQuestionnaires> {
    const {
      programmes,
      classes,
    } = await super.getRequestedProgrammesAndClasses(
      this.programmes,
      this.classes
    );

    const programmesRelations = programmes.map(
      (programme) => new ProgrammeQuestionnaire(programme, this._qnnaire)
    );
    const classRelations = classes.map(
      (clazz) => new ClassQuestionnaire(clazz, this._qnnaire)
    );

    const newProgrammesRelations = await getRepository(
      ProgrammeQuestionnaire
    ).save(programmesRelations);
    const newClassesQnnaires = await getRepository(ClassQuestionnaire).save(
      classRelations
    );

    return { programmes: newProgrammesRelations, classes: newClassesQnnaires };
  }
}

type Sets<Input, Existing> = {
  toAdd: Input[];
  toKeep: Existing[];
  toSoftDelete: Existing[];
};
type ProgrammeId = number;
type ShouldSoftDelete = boolean;
type WithId = { id: number };
type CurrentlySavedTuple<U> = [U, ShouldSoftDelete];
type ProgrammeClassesQuestionnaires = {
  programmes: ProgrammeQuestionnaire[];
  classes: ClassQuestionnaire[];
};
/**
 * Edits the ProgrammeQuestionnaires and ClassesQuestionnaires.
 */
export class QuestionnaireProgrammesAndClassesEditor extends QuestionnaireProgrammesAndClassesBase {
  private validator: QuestionnaireValidator = new QuestionnaireValidator();
  private _qnnaire: Questionnaire; // do not use save on this directly

  private editData: Pick<QuestionnairePostData, "classes" | "programmes">;
  private programmeQuestionnaires: ProgrammeQuestionnaire[];
  private classQuestionnaires: ClassQuestionnaire[];

  constructor(
    qnnaire: Questionnaire,
    editData: Pick<QuestionnairePostData, "classes" | "programmes">
  ) {
    super();
    this.validator.validateQnnaireOrReject(qnnaire);
    this._qnnaire = qnnaire;
    this.editData = editData;

    this.programmeQuestionnaires = this._qnnaire.programmeQuestionnaires;
    this.classQuestionnaires = this._qnnaire.classQuestionnaires;
  }

  public async editProgrammesAndClasses(): Promise<ProgrammeClassesQuestionnaires> {
    const {
      programmes,
      classes,
    } = await super.getRequestedProgrammesAndClasses(
      this.editData.programmes,
      this.editData.classes
    );

    const organisedProgrammes: Sets<
      Programme,
      ProgrammeQuestionnaire
    > = this.organiseSets(programmes, this.programmeQuestionnaires);
    const organisedClasses: Sets<Class, ClassQuestionnaire> = this.organiseSets(
      classes,
      this.classQuestionnaires
    );

    const newProgrammeQnnaires = await this.updateProgrammeQuestionnaire(
      organisedProgrammes
    );
    const newClassesQnnaires = await this.updateClassQuestionnaire(
      organisedClasses
    );

    return {
      programmes: newProgrammeQnnaires,
      classes: newClassesQnnaires,
    };
  }

  private organiseSets<Input extends WithId, Existing extends WithId>(
    given: Input[],
    currentlySaved: Existing[]
  ): Sets<Input, Existing> {
    const toAdd: Input[] = [];
    const toKeep: Existing[] = [];
    const toSoftDelete: Existing[] = [];

    const currentlySavedMap: Map<
      ProgrammeId,
      CurrentlySavedTuple<Existing>
    > = new Map();
    currentlySaved.forEach((item) => {
      currentlySavedMap.set(item.id, [item, true]);
    });

    given.forEach((item) => {
      if (currentlySavedMap.has(item.id)) {
        // intersection of the 2 arrays
        const savedItem = currentlySavedMap.get(item.id)![0];

        toKeep.push(savedItem);
        currentlySavedMap.set(item.id, [savedItem, false]);
      }

      // only in given
      toAdd.push(item);
    });

    // only in currentlySaved
    currentlySavedMap.forEach((tuple) => {
      const shouldSoftDelete = tuple[1];
      if (shouldSoftDelete) {
        toSoftDelete.push(tuple[0]);
      }
    });

    return { toAdd, toKeep, toSoftDelete };
  }

  private verifyNothingDanglingOrReject<T>(
    newList: T[],
    existingList: T[]
  ): void {
    if (newList < existingList) {
      throw new QuestionnaireProgrammesAndClassesEditorError(
        `Operation will cause dangling association between Programme/Class-Questionnaire` +
          `(New list ${newList.length}. Existing list: ${existingList.length}`
      );
    }
  }

  private async updateProgrammeQuestionnaire(
    sets: Sets<Programme, ProgrammeQuestionnaire>
  ): Promise<ProgrammeQuestionnaire[]> {
    const { toAdd, toKeep, toSoftDelete } = sets;

    const toAddMapped = toAdd.map(
      (programme) => new ProgrammeQuestionnaire(programme, this._qnnaire)
    );
    const addedList = await getRepository(ProgrammeQuestionnaire).save(
      toAddMapped
    );

    const softDeletedList = await getRepository(
      ProgrammeQuestionnaire
    ).softRemove(toSoftDelete);

    const updatedProgrammeQnnaires = addedList
      .concat(toKeep)
      .concat(softDeletedList);

    this.verifyNothingDanglingOrReject(
      updatedProgrammeQnnaires,
      this.programmeQuestionnaires
    );
    return updatedProgrammeQnnaires;
  }

  private async updateClassQuestionnaire(
    sets: Sets<Class, ClassQuestionnaire>
  ): Promise<ClassQuestionnaire[]> {
    const { toAdd, toKeep, toSoftDelete } = sets;

    const toAddMapped = toAdd.map(
      (clazz) => new ClassQuestionnaire(clazz, this._qnnaire)
    );
    const addedList = await getRepository(ClassQuestionnaire).save(toAddMapped);

    const softDeletedList = await getRepository(ClassQuestionnaire).softRemove(
      toSoftDelete
    );

    const updatedClassesQnnaires = addedList
      .concat(toKeep)
      .concat(softDeletedList);

    this.verifyNothingDanglingOrReject(
      updatedClassesQnnaires,
      this.classQuestionnaires
    );
    return updatedClassesQnnaires;
  }
}

export abstract class QuestionnaireCreator {
  protected validator: QuestionnaireValidator = new QuestionnaireValidator();
  protected createData: QuestionnairePostData;

  constructor(createData: QuestionnairePostData) {
    this.createData = createData;
  }

  public async createQuestionnaire() {
    const {
      title,
      type,
      status,
      programmes: programmesData,
      classes: classesData,
    } = this.createData;

    const newQnnaire = new Questionnaire(title, type, status);
    const saved = await getRepository(Questionnaire).save(newQnnaire);

    const {
      programmes,
      classes,
    } = await this.createProgrammesAndClassesRelations(
      programmesData,
      classesData,
      saved
    );

    saved.programmeQuestionnaires = programmes;
    saved.classQuestionnaires = classes;
    const savedWithRelations = await getRepository(Questionnaire).save(
      newQnnaire
    );

    return savedWithRelations;
  }

  private async createProgrammesAndClassesRelations(
    programmesData: number[],
    classesData: number[],
    qnnaire: Questionnaire
  ): Promise<ProgrammeClassesQuestionnaires> {
    const relationsCreator = new QuestionnaireProgrammesAndClassesCreator(
      programmesData,
      classesData,
      qnnaire
    );

    const result = await relationsCreator.createRelations();
    return result;
  }

  public getValidator(): QuestionnaireValidator {
    return this.validator;
  }
}

export class OneTimeQuestionnaireCreator extends QuestionnaireCreator {
  private mainWindowCreator: QuestionnaireWindowCreator;
  private mainWindowData: QuestionnaireWindowPostData;

  constructor(createData: QuestionnairePostData) {
    super(createData);

    const hasOnlyOneWindow = createData.questionWindows.length === 1;
    if (!hasOnlyOneWindow) {
      throw new OneTimeQuestionnaireCreatorError(
        `Could not create a One-Time Questionnaire as there are ${createData.questionWindows.length} windows given`
      );
    }
    this.mainWindowData = createData.questionWindows[0];
    this.mainWindowCreator = new QuestionnaireWindowCreator(
      this.mainWindowData,
      this.mainWindowData,
      undefined
    );
  }

  public async createQuestionnaire(): Promise<Questionnaire> {
    const newQnnaire = await super.createQuestionnaire();
    const newMainWindow = await this.mainWindowCreator.createWindowAndMainQnSet();

    newQnnaire.questionnaireWindows = [newMainWindow];
    const saved = await getRepository(Questionnaire).save(newQnnaire);

    if (!super.getValidator().isOneTimeQnnaire(saved)) {
      throw new OneTimeQuestionnaireCreatorError(
        `Created Questionnaire failed validation checks.`
      );
    }
    return saved;
  }
}

export class PrePostQuestionnaireCreator extends QuestionnaireCreator {
  private window1Data: QuestionnaireWindowPostData;
  private window1Creator: QuestionnaireWindowCreator;

  private window2Data: QuestionnaireWindowPostData;
  private window2Creator: QuestionnaireWindowCreator;

  private sharedQnsData: QuestionSetPostData;

  constructor(createData: QuestionnairePostData) {
    super(createData);

    const hasCorrectWindowLength = createData.questionWindows.length === 2;
    const hasSharedSet = Boolean(createData.sharedQuestions.questions);
    if (!hasCorrectWindowLength || !hasSharedSet) {
      throw new PrePostQuestionnaireCreatorError(
        `Could not create a Before/After Questionnaire as the data provided is invalid.`
      );
    }
    this.window1Data = createData.questionWindows[0];
    this.window2Data = createData.questionWindows[1];
    this.sharedQnsData = createData.sharedQuestions;

    this.window1Creator = new QuestionnaireWindowCreator(
      this.window1Data,
      this.window1Data,
      undefined
    );
    this.window2Creator = new QuestionnaireWindowCreator(
      this.window2Data,
      this.window2Data,
      this.sharedQnsData
    );
  }

  public async createQuestionnaire(): Promise<Questionnaire> {
    const newQnnaire = await super.createQuestionnaire();

    const newWindow1 = await this.window1Creator.createWindowAndMainQnSet();
    const newWindow2 = await this.window2Creator.createWindowAndMainQnSet();

    const sharedSet = await this.window2Creator.createSharedQnSet();
    newWindow1.sharedSet = sharedSet;
    newWindow2.sharedSet = sharedSet;
    const newWindowsWithSharedSets = await getRepository(
      QuestionnaireWindow
    ).save([newWindow1, newWindow2]);

    newQnnaire.questionnaireWindows = newWindowsWithSharedSets;
    const saved = await getRepository(Questionnaire).save(newQnnaire);

    if (!super.getValidator().isPrePostQnnaire(saved)) {
      throw new PrePostQuestionnaireCreatorError(
        `Created Before/After Questionnaire failed validation checks.`
      );
    }

    return saved;
  }
}

/**
 * Base class for editing Questionnaire attributes and its Programs/Classes.
 * See also `OneTimeQuestionnaireEditor` and `PrePostQuestionnaireEditor`.
 *
 * Contains `QuestionnaireProgramsAndClassesEditor`.
 */
export abstract class QuestionnaireEditor {
  private validator: QuestionnaireValidator = new QuestionnaireValidator();

  private qnnaire: Questionnaire;
  private qnnaireType: QuestionnaireType;

  private editData: QuestionnaireEditData;

  private programmesClassesQnnaireEditor: QuestionnaireProgrammesAndClassesEditor;

  /** Constructor for `QuestionnaireEditor`. Note it does not perform validations on `editData` */
  constructor(qnnaire: Questionnaire, editData: QuestionnaireEditData) {
    this.validator.validateQnnaireOrReject(qnnaire);
    this.qnnaire = qnnaire;
    this.qnnaireType = qnnaire.questionnaireType;
    this.editData = editData;

    this.programmesClassesQnnaireEditor = new QuestionnaireProgrammesAndClassesEditor(
      this.qnnaire,
      this.editData
    );
  }

  getValidator(): QuestionnaireValidator {
    return this.validator;
  }

  getEditData(): QuestionnaireEditData {
    return this.editData;
  }

  public async editQnnaire(): Promise<Questionnaire> {
    this.qnnaire.name = this.editData.title;
    this.qnnaire.questionnaireType = this.editData.type;
    this.qnnaire.questionnaireStatus = this.editData.status;

    const {
      programmes,
      classes,
    } = await this.programmesClassesQnnaireEditor.editProgrammesAndClasses();
    this.qnnaire.programmeQuestionnaires = programmes;
    this.qnnaire.classQuestionnaires = classes;

    const updated = await getRepository(Questionnaire).save(this.qnnaire);
    return updated;
  }
}

/**
 * Edits a Questionnaire that is a one-time questionnaire.
 */
export class OneTimeQuestionnaireEditor extends QuestionnaireEditor {
  private window: QuestionnaireWindow;
  private windowEditData: QuestionnaireWindowEditData;
  private windowEditor: QuestionnaireWindowEditor;

  constructor(qnnaire: Questionnaire, editData: QuestionnaireEditData) {
    super(qnnaire, editData);
    // qnnaire will be valid qnnaire

    this.validateEditorOrReject(qnnaire, editData);
    // qnnaire will be OneTime and have 1 qnnaireWindow
    // editData will have matching qnnaireId and 1 window

    this.window = qnnaire.questionnaireWindows[0];
    this.windowEditData = editData.questionWindows[0];
    this.windowEditor = new QuestionnaireWindowEditor(
      this.window,
      this.windowEditData,
      undefined
    );
  }

  private validateEditor(
    qnnaire: Questionnaire,
    editData: QuestionnaireEditData
  ): boolean {
    const editDatahasMatchingId = editData.questionnaireId === qnnaire.id;
    const editDataHasOneWindow = editData.questionWindows.length === 1;
    const isValidOneTimeQnnaire = super
      .getValidator()
      .isOneTimeQnnaire(qnnaire);
    return (
      isValidOneTimeQnnaire && editDatahasMatchingId && editDataHasOneWindow
    );
  }

  private validateEditorOrReject(
    qnnaire: Questionnaire,
    editData: QuestionnaireEditData
  ): boolean {
    const isValid = this.validateEditor(qnnaire, editData);
    if (!isValid) {
      throw new OneTimeQuestionnaireEditorError(
        `Provided editData failed validation checks`
      );
    }
    return isValid;
  }

  public async editQnnaire(): Promise<Questionnaire> {
    const attributesUpdated = await super.editQnnaire();

    const updatedWindow = await this.windowEditor.editAttributesAndMain();
    if (
      attributesUpdated.questionnaireWindows.length !== 1 ||
      attributesUpdated.questionnaireWindows[0].id !== updatedWindow.id
    ) {
      throw new OneTimeQuestionnaireEditorError(
        "Unexpected error has occured. Either validation has failed " +
          "or QuestionnaireWindowEditor has saved wrongly."
      );
    }
    attributesUpdated.questionnaireWindows = [updatedWindow]; // Risky operation

    const updated = await getRepository(Questionnaire).save(attributesUpdated);
    return updated;
  }
}

type WindowId = number;

/**
 * Edits a Questionnaire that is a pre-post questionnaire.
 */
export class PrePostQuestionnaireEditor extends QuestionnaireEditor {
  private window1: QuestionnaireWindow;
  private window1EditData: QuestionnaireWindowEditData;
  private window1Editor: QuestionnaireWindowEditor;

  private window2: QuestionnaireWindow;
  private window2EditData: QuestionnaireWindowEditData;
  private window2Editor: QuestionnaireWindowEditor;

  private sharedQnSetData: QuestionSetEditData;

  private editDataWindowMap: Map<WindowId, QuestionnaireWindowEditData>;

  constructor(qnnaire: Questionnaire, editData: QuestionnaireEditData) {
    super(qnnaire, editData);
    // qnnaire will be a valid qnnaire

    this.validateEditorOrReject(qnnaire, editData);
    // qnnaire will be PrePost and have 2 qnnaireWindows
    // editData will have matching qnnaireId and 2 matching windows

    this.sharedQnSetData = editData.sharedQuestions!;

    this.editDataWindowMap = new Map();
    super.getEditData().questionWindows.forEach((winData) => {
      if (winData.windowId) {
        throw new PrePostQuestionnaireEditorError(
          `Provided editData is invalid - missing windowId.`
        );
      }
      this.editDataWindowMap.set(winData.windowId, winData);
    });

    this.window1 = qnnaire.questionnaireWindows[0];
    this.window1EditData = this.editDataWindowMap.get(this.window1.id)!;
    this.window1Editor = new QuestionnaireWindowEditor(
      this.window1,
      this.window1EditData,
      undefined
    );

    this.window2 = qnnaire.questionnaireWindows[1];
    this.window2EditData = this.editDataWindowMap.get(this.window2.id)!;
    this.window2Editor = new QuestionnaireWindowEditor(
      this.window2,
      this.window2EditData,
      this.sharedQnSetData
    );
  }

  validateEditor(
    qnnaire: Questionnaire,
    editData: QuestionnaireEditData
  ): boolean {
    const editDataHasMatchingId = editData.questionnaireId === qnnaire.id;
    const editDataHasTwoWindows = editData.questionWindows.length === 2;
    const isValidPrePostQnnaire = super
      .getValidator()
      .isPrePostQnnaire(qnnaire);
    return (
      isValidPrePostQnnaire && editDataHasMatchingId && editDataHasTwoWindows
    );
  }

  validateEditorOrReject(
    qnnaire: Questionnaire,
    editData: QuestionnaireEditData
  ): boolean {
    const isValid = this.validateEditor(qnnaire, editData);
    if (!isValid) {
      throw new PrePostQuestionnaireEditorError(
        `Provided editData failed validation checks`
      );
    }
    return isValid;
  }

  public async editQnnaire(): Promise<Questionnaire> {
    const attributesUpdated = await super.editQnnaire();

    let updatedWindows: QuestionnaireWindow[] = [];
    const updatedWindow1 = await this.window1Editor.editAttributesAndMain();
    const updatedWindow2 = await this.window2Editor.editAttributesMainShared();
    updatedWindows = [updatedWindow1, updatedWindow2];

    if (attributesUpdated.questionnaireWindows.length !== 2) {
      throw new OneTimeQuestionnaireEditorError(
        "Unexpected error has occured. Validation has failed."
      );
    }
    attributesUpdated.questionnaireWindows = updatedWindows;

    const updated = await getRepository(Questionnaire).save(attributesUpdated);
    return updated;
  }
}

/**
 * Creates a QuestionnaireWindow.
 */
export class QuestionnaireWindowCreator {
  private questionSetCreator = new QuestionSetCreator();
  private windowData: Omit<QuestionnaireWindowPostData, "questions">;

  private mainQnsData: QuestionSetPostData;
  private sharedQnsData: QuestionSetPostData | null;

  constructor(
    windowData: Omit<QuestionnaireWindowPostData, "questions">,
    mainQnsData: QuestionSetPostData,
    sharedQnsData: QuestionSetPostData | undefined
  ) {
    this.validateCreatorOrReject(mainQnsData);
    this.windowData = windowData;

    this.mainQnsData = mainQnsData;
    this.sharedQnsData = sharedQnsData ?? null;
  }

  private validateCreatorOrReject(mainQnsData: QuestionSetPostData): void {
    if (!mainQnsData.questions || mainQnsData.questions.length === 0) {
      throw new QuestionnaireWindowCreatorError(
        `Cannot create as there are no questions provided in the MainQuestionSet`
      );
    }
  }

  async createWindowAndMainQnSet(): Promise<QuestionnaireWindow> {
    const newMainQnSet = await this.questionSetCreator.createQuestionSet(
      this.mainQnsData.questions
    );
    const newWindow = new QuestionnaireWindow(
      this.windowData.startAt,
      this.windowData.endAt
    );
    newWindow.mainSet = newMainQnSet;

    await validateOrReject(newWindow);
    const saved = await getRepository(QuestionnaireWindow).save(newWindow);
    return saved;
  }

  async createSharedQnSet(): Promise<QuestionSet> {
    this.hasSharedQnsDataOrReject();

    const newSharedQnSet = await this.questionSetCreator.createQuestionSet(
      this.sharedQnsData!.questions
    );

    return newSharedQnSet;
  }

  private hasSharedQnsDataOrReject(): void {
    if (!this.sharedQnsData || !this.sharedQnsData.questions) {
      throw new QuestionnaireWindowCreatorError(
        `Cannot create as sharedQns is not given`
      );
    }

    if (this.sharedQnsData!.questions.length === 0) {
      throw new QuestionnaireWindowCreatorError(
        `Cannot create as sharedQns has no questions`
      );
    }
  }
}

/**
 * Edits a QuestionnaireWindow.
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
    return Boolean(this.sharedSet) && Boolean(this.sharedSetEditor);
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

  public async editAttributesAndMain(): Promise<QuestionnaireWindow> {
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

  public async editAttributesMainShared(): Promise<QuestionnaireWindow> {
    this.hasSharedSetOrReject();

    const updatedMainQnSet = await this.mainSetEditor.editQnSet();
    const updatedSharedQnSet = await this.sharedSetEditor!.editQnSet();

    this.qnnaireWindow.openAt = new Date(
      this.editWindowAndMainQnSetData.startAt
    );
    this.qnnaireWindow.closeAt = new Date(
      this.editWindowAndMainQnSetData.endAt
    );
    this.qnnaireWindow.mainSet = updatedMainQnSet;
    this.qnnaireWindow.sharedSet = updatedSharedQnSet;

    const updatedQnnaireWindow = await getRepository(QuestionnaireWindow).save(
      this.qnnaireWindow
    );
    return updatedQnnaireWindow;
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
