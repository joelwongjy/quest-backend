import { Entity, ManyToOne, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionOrder } from "./QuestionOrder";
import { Questionnaire } from "./Questionnaire";

@Entity()
export class QuestionSet extends Discardable {
  entityName = "QuestionSet";

  constructor() {
    super();
  }

  @ManyToOne(
    (type) => Questionnaire,
    (questionnaire) => questionnaire.question_sets
  )
  questionnaire!: Questionnaire;

  @OneToMany(
    (type) => QuestionOrder,
    (question_order) => question_order.question_set
  )
  question_orders!: QuestionOrder[];
}
