import { validateOrReject } from "class-validator";
import { Questionnaire } from "../../entities/questionnaire/Questionnaire";
import { getRepository } from "typeorm";
import { QuestionnaireWindow } from "../../entities/questionnaire/QuestionnaireWindow";
import { QuestionSet } from "../../entities/questionnaire/QuestionSet";
import {
  QUESTIONNAIRE_WINDOW_CREATOR_ERROR,
  QUESTIONNAIRE_WINDOW_EDITOR_ERROR,
  QUESTIONNAIRE_WINDOW_VIEWER_ERROR,
} from "../../types/errors";
import {
  QuestionnaireWindowPostData,
  QuestionnaireWindowPatchData,
  QuestionnaireWindowData,
} from "../../types/questionnaires";
import {
  QuestionSetPostData,
  QuestionSetPatchData,
  QuestionSetData,
} from "../../types/questions";
import {
  QuestionSetCreator,
  QuestionSetEditor,
  QuestionSetViewer,
} from "./questionSets";

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
 * Creates a QuestionnaireWindow.
 */
export class QuestionnaireWindowCreator {
  private questionSetCreator = new QuestionSetCreator();

  constructor() {}

  private validateCreatorOrReject(mainQnsData: QuestionSetPostData): void {
    if (!mainQnsData.questions) {
      throw new QuestionnaireWindowCreatorError(
        `Cannot create as there are no questions provided in the MainQuestionSet`
      );
    }
  }

  async createWindowAndMainQnSet(
    questionnaire: Questionnaire,
    windowData: Omit<QuestionnaireWindowPostData, "questions">,
    mainQnsData: QuestionSetPostData
  ): Promise<QuestionnaireWindow> {
    this.validateCreatorOrReject(mainQnsData);

    const newMainQnSet = await this.questionSetCreator.createQuestionSet(
      mainQnsData.questions
    );
    const newWindow = new QuestionnaireWindow(
      questionnaire,
      windowData.startAt,
      windowData.endAt
    );
    newWindow.mainSet = newMainQnSet;

    await validateOrReject(newWindow);
    const saved = await getRepository(QuestionnaireWindow).save(newWindow);
    return saved;
  }

  async createSharedQnSet(
    sharedQnsData: QuestionSetPostData
  ): Promise<QuestionSet> {
    this.validateSharedQnsDataOrReject(sharedQnsData);

    const newSharedQnSet = await this.questionSetCreator.createQuestionSet(
      sharedQnsData!.questions
    );

    return newSharedQnSet;
  }

  private validateSharedQnsDataOrReject(
    sharedQnsData: QuestionSetPostData
  ): void {
    if (!sharedQnsData || !sharedQnsData.questions) {
      throw new QuestionnaireWindowCreatorError(
        `Cannot create as sharedQns is not given`
      );
    }

    if (sharedQnsData!.questions.length === 0) {
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
  private editWindowAndMainQnSetData: QuestionnaireWindowPatchData;
  private mainSetEditor: QuestionSetEditor;

  private sharedSet: QuestionSet | null;
  private editSharedQnSetData: QuestionSetPatchData | null;
  private sharedSetEditor: QuestionSetEditor | null;

  constructor(
    qnnaireWindow: QuestionnaireWindow,
    editWindowAndMainQnSetData: QuestionnaireWindowPatchData,
    editSharedQnSetData: QuestionSetPatchData | undefined
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
    editWindowAndMainQnSetData: QuestionnaireWindowPatchData,
    editSharedQnSetData: QuestionSetPatchData | undefined
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
    editWindowAndMainQnSet: QuestionnaireWindowPatchData,
    editSharedQnSet: QuestionSetPatchData | undefined
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

  public async getWindowAndMainSet(): Promise<QuestionnaireWindowData> {
    const mainSet = await this.getMainSet();
    return {
      windowId: this.qnnaireWindow.id,
      startAt: this.qnnaireWindow.openAt.toISOString(),
      endAt: this.qnnaireWindow.closeAt.toISOString(),
      ...mainSet,
    };
  }
}
