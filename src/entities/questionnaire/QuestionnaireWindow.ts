import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Questionnaire } from "./Questionnaire";
import { QuestionSet } from "./QuestionSet";

@Entity()
export class QuestionnaireWindow extends Discardable {
  entityName = "QuestionnaireWindow";

  constructor(openAt: Date, closeAt: Date) {
    super();
    this.openAt = openAt;
    this.closeAt = closeAt;
  }

  @Column({ type: "timestamptz" })
  openAt: Date;

  @Column({ type: "timestamptz" })
  closeAt: Date;

  @IsNotEmpty()
  @ManyToOne((type) => QuestionSet, { nullable: false })
  mainSet!: QuestionSet;

  @ManyToOne((type) => QuestionSet, { nullable: true })
  sharedSet!: QuestionSet | null;

  @ManyToOne(
    (type) => Questionnaire,
    (questionnaire) => questionnaire.questionnaireWindows
  )
  questionnaire!: Questionnaire;
}
