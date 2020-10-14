import { Entity, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionOrder } from "./QuestionOrder";

@Entity()
export class QuestionSet extends Discardable {
  entityName = "QuestionSet";

  @OneToMany(
    (type) => QuestionOrder,
    (questionOrder) => questionOrder.questionSet
  )
  questionOrders!: QuestionOrder[];
}
