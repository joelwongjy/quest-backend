import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionnaireType } from "./QuestionnaireType";
import { QuestionnaireWindow } from "./QuestionnaireWindow";
import { QuestionSet } from "./QuestionSet";

@Entity()
export class Questionnaire extends Discardable {
  entityName = "Questionnaire";

  constructor(
    name: string,
    questionnaire_type: QuestionnaireType,
    question_sets: QuestionSet[],
    questionnaire_windows: QuestionnaireWindow[]
  ) {
    super();
    this.name = name;
    this.question_sets = question_sets;
    this.questionnaire_windows = questionnaire_windows;
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
  question_sets: QuestionSet[];

  @OneToMany(
    (type) => QuestionnaireWindow,
    (questionnaireWindow) => questionnaireWindow.questionnaire
  )
  questionnaire_windows: QuestionnaireWindow[];
}
