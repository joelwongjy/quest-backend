import { Entity, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionOrder } from "./QuestionOrder";
import { QuestionnaireWindow } from "./QuestionnaireWindow";

@Entity()
export class QuestionSet extends Discardable {
  entityName = "QuestionSet";

  @OneToMany(
    (type) => QuestionnaireWindow,
    (questionnaireWindow) => questionnaireWindow.question_set
  )
  questionnaire_windows!: QuestionnaireWindow[];

  @OneToMany(
    (type) => QuestionOrder,
    (question_order) => question_order.question_set
  )
  question_orders!: QuestionOrder[];
}
