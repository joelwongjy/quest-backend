import { Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Class } from "../programme/Class";
import { Questionnaire } from "./Questionnaire";

@Entity()
export class ClassQuestionnaire extends Discardable {
  entityName = "ClassQuestionnaire";

  constructor(class_: Class, questionnaire: Questionnaire) {
    super();
    this.class = class_;
    this.questionnaire = questionnaire;
  }

  @ManyToOne((type) => Class, (class_) => class_.classQuestionnaires, {
    nullable: false,
  })
  class: Class;

  @ManyToOne(
    (type) => Questionnaire,
    (questionnaire) => questionnaire.classQuestionnaires,
    { nullable: false }
  )
  questionnaire: Questionnaire;
}
