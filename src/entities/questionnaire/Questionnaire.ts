import { IsNotEmpty, validateOrReject } from "class-validator";
import {
  Column,
  Entity,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  getRepository,
} from "typeorm";
import { Discardable } from "../Discardable";
import {
  QuestionnaireType,
  QuestionnaireStatus,
  QuestionnaireListData,
  QuestionnaireFullData,
  QuestionnaireWindowData,
  QuestionnaireOneWindowData,
  QuestionnaireProgramClassData,
  QuestionnaireListDataType,
} from "../../types/questionnaires";
import { QuestionnaireWindow } from "./QuestionnaireWindow";
import { ProgrammeQuestionnaire } from "./ProgrammeQuestionnaire";
import { ClassQuestionnaire } from "./ClassQuestionnaire";
import { QuestionData, QuestionSetData } from "../../types/questions";
import { QuestionOrder } from "./QuestionOrder";
import { QuestionnaireProgrammesAndClassesViewer } from "../../services/questionnaire/programmesClassRelations";
import {
  OneTimeQuestionnaireViewer,
  PrePostQuestionnaireViewer,
  QuestionnaireViewer,
} from "../../services/questionnaire/questionnaire";

@Entity()
export class Questionnaire extends Discardable {
  entityName = "Questionnaire";

  constructor(
    name: string,
    questionnaireType: QuestionnaireType,
    questionnaireStatus?: QuestionnaireStatus
  ) {
    super();
    this.name = name;
    this.questionnaireType = questionnaireType;
    this.questionnaireStatus = questionnaireStatus ?? QuestionnaireStatus.DRAFT;
  }

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({
    type: "enum",
    enum: QuestionnaireType,
  })
  questionnaireType: QuestionnaireType;

  @Column({
    type: "enum",
    enum: QuestionnaireStatus,
  })
  questionnaireStatus: QuestionnaireStatus;

  @OneToMany(
    (type) => QuestionnaireWindow,
    (questionnaireWindow) => questionnaireWindow.questionnaire
  )
  questionnaireWindows!: QuestionnaireWindow[];

  @OneToMany(
    (type) => ProgrammeQuestionnaire,
    (programmeQuestionnaire) => programmeQuestionnaire.questionnaire
  )
  programmeQuestionnaires!: ProgrammeQuestionnaire[];

  @OneToMany(
    (type) => ClassQuestionnaire,
    (classQuestionnaire) => classQuestionnaire.questionnaire
  )
  classQuestionnaires!: ClassQuestionnaire[];

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    await validateOrReject(this);
  }

  getListDataList = async (): Promise<QuestionnaireListData[]> => {
    const windows =
      this.questionnaireWindows ||
      (
        await getRepository(Questionnaire).findOneOrFail({
          where: { id: this.id },
          relations: ["questionnaireWindows"],
        })
      ).questionnaireWindows;

    const isOneTime = windows.length === 1;
    const earlierOpenAt = windows
      .map((w: QuestionnaireWindow) => w.openAt)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return windows.map((w: QuestionnaireWindow) => {
      return {
        ...this.getBase(),
        name: this.name,
        status: this.questionnaireStatus,
        startAt: w.openAt,
        endAt: w.closeAt,
        type: isOneTime
          ? QuestionnaireListDataType.ONE_TIME
          : w.openAt === earlierOpenAt
          ? QuestionnaireListDataType.PRE
          : QuestionnaireListDataType.POST,
      };
    });
  };

  /**
   * Converts questionnaire instance to a 'flattened' version for the controller.
   * Note: it does not update the instance attributes
   * @throws if there is no valid questionnaire id, or qnnaire's sharedSets are not created properly
   */
  getAllWindows = async (): Promise<QuestionnaireFullData> => {
    let viewer: QuestionnaireViewer;
    const type =
      this.questionnaireType ||
      (await getRepository(Questionnaire).findOneOrFail(this.id))
        .questionnaireType;

    switch (type) {
      case QuestionnaireType.ONE_TIME:
        viewer = new OneTimeQuestionnaireViewer(this.id);
        break;
      case QuestionnaireType.PRE_POST:
        viewer = new PrePostQuestionnaireViewer(this.id);
        break;
      default:
        throw new Error(`Unknown QuestionnaireType.`);
    }

    if (!viewer) {
      throw new Error(`Unable to load QuestionnaireViewer for ${this.id}`);
    }

    const result = await viewer.getQuestionnaire();
    return result;
  };

  /**
   * Converts a questionnaire's mainSet to a 'flattened' version for the controller.
   * Note: it does not update instance attributes
   * @param windowId the window to generate
   * @throws if given windowId does not match a window in the instance
   */
  getMainWindow = async (
    mainWindowId: number
  ): Promise<QuestionnaireOneWindowData> => {
    const fullQnnaire = await this.getAllWindows();

    // from getAllWindows(), questionWindows only comprises of mainSets
    const matchingWindow = fullQnnaire.questionWindows.filter(
      (windowData) => windowData.windowId === mainWindowId
    );
    const hasMatchingWindow = matchingWindow.length === 1;
    if (!hasMatchingWindow) {
      throw new Error(
        `Could not find window with id: ${mainWindowId} in specified questionnaire` +
          `id: ${this.id}`
      );
    }

    return {
      questionnaireId: fullQnnaire.questionnaireId,
      title: fullQnnaire.title,
      status: fullQnnaire.status,
      type: fullQnnaire.type,
      sharedQuestions: fullQnnaire.sharedQuestions,
      programmes: fullQnnaire.programmes,
      classes: fullQnnaire.classes,
      ...matchingWindow[0],
    };
  };

  /**
   * Gets programmes and classes data.
   * May deprecate this method in a future update.
   */
  getProgrammesAndClasses = async (): Promise<QuestionnaireProgramClassData> => {
    const viewer = new QuestionnaireProgrammesAndClassesViewer(this.id);
    return await viewer.getProgrammesAndClasses();
  };
}

function _convertQnOrderRelations(qnOrder: QuestionOrder): QuestionData {
  {
    const { id: qnOrderId, order, question } = qnOrder;
    const { questionType, questionText, options } = question;
    const optionsWithId = options.map((o) => {
      const { id: optionId, optionText } = o;
      return {
        optionId,
        optionText,
      };
    });

    return {
      qnOrderId,
      order,
      questionType,
      questionText,
      options: optionsWithId,
    };
  }
}
