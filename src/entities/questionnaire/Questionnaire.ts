import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionnaireType } from "../../types/questionnaires";
import { QuestionnaireWindow } from "./QuestionnaireWindow";
import { QuestionSet } from "./QuestionSet";
import { ProgrammeQuestionnaire } from "./ProgrammeQuestionnaire";

@Entity()
export class Questionnaire extends Discardable {
  entityName = "Questionnaire";

  constructor(name: string, questionnaire_type: QuestionnaireType) {
    super();
    this.name = name;
    this.questionnaire_type = questionnaire_type;
  }

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({
    type: "enum",
    enum: QuestionnaireType,
  })
  questionnaire_type: QuestionnaireType;

  @OneToMany(
    (type) => QuestionSet,
    (questionSets) => questionSets.questionnaire
  )
  question_sets!: QuestionSet[];

  @OneToMany(
    (type) => QuestionnaireWindow,
    (questionnaireWindow) => questionnaireWindow.questionnaire
  )
  questionnaire_windows!: QuestionnaireWindow[];

  @OneToMany(
    (type) => ProgrammeQuestionnaire,
    (programmeQuestionnaire) => programmeQuestionnaire.questionnaire
  )
  programmeQuestionnaires!: ProgrammeQuestionnaire[];
}
