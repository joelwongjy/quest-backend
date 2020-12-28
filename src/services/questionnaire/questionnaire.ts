import { EntityManager, getRepository } from "typeorm";
import { ClassQuestionnaire } from "../../entities/questionnaire/ClassQuestionnaire";
import { ProgrammeQuestionnaire } from "../../entities/questionnaire/ProgrammeQuestionnaire";
import { Questionnaire } from "../../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../../entities/questionnaire/QuestionnaireWindow";
import { QuestionOrder } from "../../entities/questionnaire/QuestionOrder";
import { QuestionSet } from "../../entities/questionnaire/QuestionSet";
import {
  ONE_TIME_QUESTIONNAIRE_CREATOR_ERROR,
  PRE_POST_QUESTIONNAIRE_CREATOR_ERROR,
  ONE_TIME_QUESTIONNAIRE_EDITOR_ERROR,
  PRE_POST_QUESTIONNAIRE_EDITOR_ERROR,
  QUESTIONNAIRE_VALIDATOR_ERROR,
  ONE_TIME_QUESTIONNAIRE_VIEWER_ERROR,
  PRE_POST_QUESTIONNAIRE_VIEWER_ERROR,
} from "../../types/errors";
import {
  QuestionnaireType,
  QuestionnairePostData,
  QuestionnaireWindowPostData,
  QuestionnairePatchData,
  QuestionnaireWindowPatchData,
  QuestionnaireFullData,
  QuestionnaireProgramClassData,
  QuestionnaireStatus,
} from "../../types/questionnaires";
import {
  QuestionSetPostData,
  QuestionSetPatchData,
} from "../../types/questions";
import {
  ProgrammeClassesQuestionnaires,
  QuestionnaireProgrammesAndClassesCreator,
  QuestionnaireProgrammesAndClassesEditor,
  QuestionnaireProgrammesAndClassesViewer,
} from "./programmesClassRelations";
import {
  QuestionnaireWindowCreator,
  QuestionnaireWindowEditor,
  QuestionnaireWindowViewer,
} from "./questionnaireWindows";

/** Helper type - for readability */
type WindowId = number;

class OneTimeQuestionnaireCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ONE_TIME_QUESTIONNAIRE_CREATOR_ERROR;
  }
}

class PrePostQuestionnaireCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PRE_POST_QUESTIONNAIRE_CREATOR_ERROR;
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

class OneTimeQuestionnaireViewerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ONE_TIME_QUESTIONNAIRE_VIEWER_ERROR;
  }
}

class PrePostQuestionnaireViewerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PRE_POST_QUESTIONNAIRE_VIEWER_ERROR;
  }
}

class QuestionnaireValidatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_VALIDATOR_ERROR;
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
        Boolean(qnnaire.questionnaireWindows[0].sharedSet?.id) &&
        Boolean(qnnaire.questionnaireWindows[1].sharedSet?.id);

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
      programmes: programmesData,
      classes: classesData,
    } = this.createData;

    const newQnnaire = new Questionnaire(
      title,
      type,
      QuestionnaireStatus.DRAFT
    );
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

  private editData: QuestionnairePatchData;

  private programmesClassesQnnaireEditor: QuestionnaireProgrammesAndClassesEditor;

  /** Constructor for `QuestionnaireEditor`. Note it does not perform validations on `editData` */
  constructor(qnnaire: Questionnaire, editData: QuestionnairePatchData) {
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

  getEditData(): QuestionnairePatchData {
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
  private windowEditData: QuestionnaireWindowPatchData;
  private windowEditor: QuestionnaireWindowEditor;

  constructor(qnnaire: Questionnaire, editData: QuestionnairePatchData) {
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
    editData: QuestionnairePatchData
  ): boolean {
    const editDataHasOneWindow = editData.questionWindows.length === 1;
    const isValidOneTimeQnnaire = super
      .getValidator()
      .isOneTimeQnnaire(qnnaire);
    return isValidOneTimeQnnaire && editDataHasOneWindow;
  }

  private validateEditorOrReject(
    qnnaire: Questionnaire,
    editData: QuestionnairePatchData
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

/**
 * Edits a Questionnaire that is a pre-post questionnaire.
 */
export class PrePostQuestionnaireEditor extends QuestionnaireEditor {
  private window1: QuestionnaireWindow;
  private window1EditData: QuestionnaireWindowPatchData;
  private window1Editor: QuestionnaireWindowEditor;

  private window2: QuestionnaireWindow;
  private window2EditData: QuestionnaireWindowPatchData;
  private window2Editor: QuestionnaireWindowEditor;

  private sharedQnSetData: QuestionSetPatchData;

  private editDataWindowMap: Map<WindowId, QuestionnaireWindowPatchData>;

  constructor(qnnaire: Questionnaire, editData: QuestionnairePatchData) {
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
    editData: QuestionnairePatchData
  ): boolean {
    const editDataHasTwoWindows = editData.questionWindows.length === 2;
    const isValidPrePostQnnaire = super
      .getValidator()
      .isPrePostQnnaire(qnnaire);
    return isValidPrePostQnnaire && editDataHasTwoWindows;
  }

  validateEditorOrReject(
    qnnaire: Questionnaire,
    editData: QuestionnairePatchData
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

export abstract class QuestionnaireViewer {
  private validator = new QuestionnaireValidator();

  protected qnnaireId: number;
  private programmesClassesQnnaireViewer: QuestionnaireProgrammesAndClassesViewer;

  constructor(qnnaireId: number) {
    this.qnnaireId = qnnaireId;
    this.programmesClassesQnnaireViewer = new QuestionnaireProgrammesAndClassesViewer(
      this.qnnaireId
    );
  }

  protected async getProgrammesClasses(): Promise<QuestionnaireProgramClassData> {
    return await this.programmesClassesQnnaireViewer.getProgrammesAndClasses();
  }

  protected async loadQuestionnaire(): Promise<Questionnaire> {
    const qnnaire = await getRepository(Questionnaire).findOneOrFail({
      where: { id: this.qnnaireId },
      relations: [
        "questionnaireWindows",
        "questionnaireWindows.mainSet",
        "questionnaireWindows.sharedSet",
        "questionnaireWindows.mainSet.questionOrders",
        "questionnaireWindows.sharedSet.questionOrders",
        "questionnaireWindows.mainSet.questionOrders.question",
        "questionnaireWindows.sharedSet.questionOrders.question",
      ],
    });
    return qnnaire;
  }

  protected isOneTimeQuestionnaire(qnnaire: Questionnaire): boolean {
    return this.validator.isOneTimeQnnaire(qnnaire);
  }

  protected isPrePostQuestionnaire(qnnaire: Questionnaire): boolean {
    return this.validator.isPrePostQnnaire(qnnaire);
  }

  public abstract getQuestionnaire(): Promise<QuestionnaireFullData>;
}

export class OneTimeQuestionnaireViewer extends QuestionnaireViewer {
  // loaded later
  private window!: QuestionnaireWindow;
  private windowViewer!: QuestionnaireWindowViewer;

  constructor(qnnaireId: number) {
    super(qnnaireId);
  }

  public async getQuestionnaire(): Promise<QuestionnaireFullData> {
    const { programmes, classes } = await super.getProgrammesClasses();
    const qnnaire = await super.loadQuestionnaire();

    if (!super.isOneTimeQuestionnaire(qnnaire)) {
      throw new OneTimeQuestionnaireViewerError(
        `Questionnaire ${super.qnnaireId} has failed validation checks`
      );
    }

    this.window = qnnaire.questionnaireWindows[0];
    this.windowViewer = new QuestionnaireWindowViewer(this.window);
    const windowData = await this.windowViewer.getWindowAndMainSet();
    return {
      questionnaireId: this.qnnaireId,
      title: qnnaire.name,
      type: qnnaire.questionnaireType,
      status: qnnaire.questionnaireStatus,
      questionWindows: [windowData],
      sharedQuestions: undefined,
      programmes,
      classes,
    };
  }
}

export class PrePostQuestionnaireViewer extends QuestionnaireViewer {
  // loaded later
  private window1!: QuestionnaireWindow;
  private window2!: QuestionnaireWindow;
  private window1Viewer!: QuestionnaireWindowViewer;
  private window2Viewer!: QuestionnaireWindowViewer;

  constructor(qnnaireId: number) {
    super(qnnaireId);
  }

  public async getQuestionnaire(): Promise<QuestionnaireFullData> {
    const { programmes, classes } = await super.getProgrammesClasses();
    const qnnaire = await super.loadQuestionnaire();

    if (!super.isPrePostQuestionnaire(qnnaire)) {
      throw new PrePostQuestionnaireViewerError(
        `Questionnaire ${super.qnnaireId} has failed validation checks`
      );
    }

    this.window1 = qnnaire.questionnaireWindows[0];
    this.window2 = qnnaire.questionnaireWindows[1];

    this.window1Viewer = new QuestionnaireWindowViewer(this.window1);
    this.window2Viewer = new QuestionnaireWindowViewer(this.window2);

    const window1Data = await this.window1Viewer.getWindowAndMainSet();
    const window2Data = await this.window2Viewer.getWindowAndMainSet();
    const sharedQns = await this.window1Viewer.getSharedSet();

    return {
      questionnaireId: this.qnnaireId,
      title: qnnaire.name,
      type: qnnaire.questionnaireType,
      status: qnnaire.questionnaireStatus,
      questionWindows: [window1Data, window2Data],
      sharedQuestions: sharedQns,
      programmes,
      classes,
    };
  }
}

export class QuestionnaireDeleter {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async deleteQuestionnaire(qnnaire: Questionnaire): Promise<void> {
    await this._deleteWindowsAndQuestions(qnnaire);
    await this._deleteProgrammeClassQnnaires(qnnaire);
  }

  private async _deleteWindowsAndQuestions(
    qnnaire: Questionnaire
  ): Promise<void> {
    // soft-delete the questionnaire
    await this.manager.getRepository(Questionnaire).softRemove(qnnaire);

    // soft-delete the windows
    await this.manager
      .getRepository(QuestionnaireWindow)
      .softRemove(qnnaire.questionnaireWindows!);

    const questionSets: QuestionSet[] = [];
    let questionOrders: QuestionOrder[] = [];
    let includesSharedSet = false;
    qnnaire.questionnaireWindows.forEach((window) => {
      if (window.mainSet) {
        questionSets.push(window.mainSet);
        questionOrders = questionOrders.concat(window.mainSet.questionOrders);
      }

      if (window.sharedSet && !includesSharedSet) {
        questionSets.push(window.sharedSet);
        questionOrders = questionOrders.concat(window.sharedSet.questionOrders);

        includesSharedSet = true;
      }
    });
    // soft-delete the sets
    await this.manager.getRepository(QuestionSet).softRemove(questionSets);

    // soft-delete the question orders
    await this.manager.getRepository(QuestionOrder).softRemove(questionOrders);
  }

  private async _deleteProgrammeClassQnnaires(
    qnnaire: Questionnaire
  ): Promise<void> {
    // soft-delete the related programme questionnaires
    await this.manager
      .getRepository(ProgrammeQuestionnaire)
      .softRemove(qnnaire.programmeQuestionnaires);

    // soft-delete the related class questionnaire
    await this.manager
      .getRepository(ClassQuestionnaire)
      .softRemove(qnnaire.classQuestionnaires);
  }

  public static async verify(id: number): Promise<boolean> {
    // leverage on softdeletion to find the ids of related entities
    const qnnaire = await getRepository(Questionnaire).findOneOrFail({
      where: { id },
      withDeleted: true,
      relations: [
        "questionnaireWindows",
        "questionnaireWindows.mainSet",
        "questionnaireWindows.mainSet.questionOrders",
        "questionnaireWindows.sharedSet",
        "questionnaireWindows.sharedSet.questionOrders",
        "programmeQuestionnaires",
        "classQuestionnaires",
      ],
    });

    const isQnnaireDeleted = !!qnnaire.discardedAt;
    const areWindowsDeleted =
      qnnaire.questionnaireWindows.filter((w) => !w.discardedAt).length === 0;

    const areRelatedProgrammeQuestionnairesDeleted =
      qnnaire.programmeQuestionnaires.filter((pq) => !pq.discardedAt).length ===
      0;
    const areRelatedClassQuestionnairesDeleted =
      qnnaire.classQuestionnaires.filter((cq) => !cq.discardedAt).length === 0;

    let areQnSetsDeleted: boolean = false;
    let areQnOrdersDeleted: boolean = false;
    switch (qnnaire.questionnaireType) {
      case QuestionnaireType.ONE_TIME:
        const mainSet = qnnaire.questionnaireWindows[0].mainSet;

        areQnSetsDeleted = !!mainSet.discardedAt;
        areQnOrdersDeleted =
          mainSet.questionOrders.filter((q) => !q.discardedAt).length === 0;
        break;

      case QuestionnaireType.PRE_POST:
        const set1Main = qnnaire.questionnaireWindows[0].mainSet;
        const set2Main = qnnaire.questionnaireWindows[1].mainSet;

        const set1Shared = qnnaire.questionnaireWindows[0].sharedSet!;

        areQnSetsDeleted =
          !!set1Main.discardedAt &&
          !!set2Main.discardedAt &&
          !!set1Shared?.discardedAt;
        areQnOrdersDeleted =
          set1Main.questionOrders.filter((q) => !q.discardedAt).length === 0 &&
          set2Main.questionOrders.filter((q) => !q.discardedAt).length === 0 &&
          set1Shared.questionOrders.filter((q) => !q.discardedAt).length === 0;
        break;

      default:
        return false;
    }

    // console.log({
    //   isQnnaireDeleted: isQnnaireDeleted,
    //   areWindowsDeleted: areWindowsDeleted,
    //   areRelatedProgrammeQuestionnairesDeleted: areRelatedProgrammeQuestionnairesDeleted,
    //   areRelatedClassQuestionnairesDeleted: areRelatedClassQuestionnairesDeleted,
    //   areQnSetsDeleted: areQnSetsDeleted,
    //   areQnOrdersDeleted: areQnOrdersDeleted,
    // });
    return (
      isQnnaireDeleted &&
      areWindowsDeleted &&
      areRelatedProgrammeQuestionnairesDeleted &&
      areRelatedClassQuestionnairesDeleted &&
      areQnSetsDeleted &&
      areQnOrdersDeleted
    );
  }
}
