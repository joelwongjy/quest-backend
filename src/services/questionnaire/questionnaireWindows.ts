import { validateOrReject } from "class-validator";
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
  QuestionnaireWindowEditData,
} from "../../types/questionnaires";
import {
  QuestionSetPostData,
  QuestionSetEditData,
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
