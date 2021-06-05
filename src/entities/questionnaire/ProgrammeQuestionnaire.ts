import { Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Programme } from "../programme/Programme";
import { Questionnaire } from "./Questionnaire";

@Entity()
export class ProgrammeQuestionnaire extends Discardable {
  entityName = "ProgrammeQuestionnaire";

  constructor(programme: Programme, questionnaire: Questionnaire) {
    super();
    this.programme = programme;
    this.questionnaire = questionnaire;
  }

  @ManyToOne(
    (type) => Programme,
    (programme) => programme.programmeQuestionnaires,
    { nullable: false }
  )
  programme: Programme;

  @ManyToOne(
    (type) => Questionnaire,
    (questionnaire) => questionnaire.programmeQuestionnaires,
    { nullable: false }
  )
  questionnaire: Questionnaire;
}
