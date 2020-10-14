import { IsNotEmpty, validateOrReject } from "class-validator";
import { Column, Entity, OneToMany, BeforeInsert, BeforeUpdate } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionnaireType } from "../../types/questionnaires";
import { QuestionnaireWindow } from "./QuestionnaireWindow";
import { ProgrammeQuestionnaire } from "./ProgrammeQuestionnaire";
import { ClassQuestionnaire } from "./ClassQuestionnaire";

@Entity()
export class Questionnaire extends Discardable {
  entityName = "Questionnaire";

  constructor(name: string, questionnaireType: QuestionnaireType) {
    super();
    this.name = name;
    this.questionnaireType = questionnaireType;
  }

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({
    type: "enum",
    enum: QuestionnaireType,
  })
  questionnaireType: QuestionnaireType;

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
}
