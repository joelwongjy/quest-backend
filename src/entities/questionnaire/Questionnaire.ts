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
} from "../../types/questionnaires";
import { QuestionnaireWindow } from "./QuestionnaireWindow";
import { ProgrammeQuestionnaire } from "./ProgrammeQuestionnaire";
import { ClassQuestionnaire } from "./ClassQuestionnaire";

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

  // Hook to ensure entity does not have null option and null answer
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

    return windows.map((w: QuestionnaireWindow) => ({
      ...this.getBase(),
      name: this.name,
      status: this.questionnaireStatus,
      startAt: w.openAt,
      endAt: w.closeAt,
    }));
  };
}
