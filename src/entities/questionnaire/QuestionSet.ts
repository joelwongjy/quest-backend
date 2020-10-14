import { Entity, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionOrder } from "./QuestionOrder";

@Entity()
export class QuestionSet extends Discardable {
  entityName = "QuestionSet";

  @OneToMany(
    (type) => QuestionOrder,
    (question_order) => question_order.question_set
  )
  question_orders!: QuestionOrder[];
}
