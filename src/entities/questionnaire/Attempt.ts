import { Entity, ManyToOne, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { User } from "../user/User";
import { Answer } from "./Answer";
import { QuestionnaireWindow } from "./QuestionnaireWindow";

@Entity()
export class Attempt extends Discardable {
  entityName = "Attempt";

  constructor(user: User, questionnaire_window: QuestionnaireWindow) {
    super();
    this.user = user;
    this.questionnaire_window = questionnaire_window;
  }

  @ManyToOne((type) => User)
  user: User;

  @ManyToOne((type) => QuestionnaireWindow)
  questionnaire_window: QuestionnaireWindow;

  @OneToMany((type) => Answer, (answer) => answer.attempt)
  answers!: Answer[];
}
