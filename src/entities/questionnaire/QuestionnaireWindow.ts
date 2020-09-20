import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Questionnaire } from "./Questionnaire";

@Entity()
export class QuestionnaireWindow extends Discardable {
  entityName = "QuestionnaireWindow";

  constructor(open_at: Date, close_at: Date, questionnaire: Questionnaire) {
    super();
    this.open_at = open_at;
    this.close_at = close_at;
    this.questionnaire = questionnaire;
  }

  @Column({ type: "timestamp without time zone" })
  open_at: Date;

  @Column({ type: "timestamp without time zone" })
  close_at: Date;

  @ManyToOne(
    (type) => Questionnaire,
    (questionnaire) => questionnaire.questionnaire_windows
  )
  questionnaire: Questionnaire;
}
