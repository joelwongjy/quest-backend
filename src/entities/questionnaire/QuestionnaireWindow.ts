import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Questionnaire } from "./Questionnaire";
import { QuestionSet } from "./QuestionSet";

@Entity()
export class QuestionnaireWindow extends Discardable {
  entityName = "QuestionnaireWindow";

  constructor(open_at: Date, close_at: Date) {
    super();
    this.open_at = open_at;
    this.close_at = close_at;
  }

  @Column({ type: "timestamp without time zone" })
  open_at: Date;

  @Column({ type: "timestamp without time zone" })
  close_at: Date;

  @IsNotEmpty()
  @ManyToOne((type) => QuestionSet, { nullable: false })
  main_set!: QuestionSet;

  @ManyToOne((type) => QuestionSet, { nullable: true })
  shared_set!: QuestionSet | null;

  @ManyToOne(
    (type) => Questionnaire,
    (questionnaire) => questionnaire.questionnaire_windows
  )
  questionnaire!: Questionnaire;
}
