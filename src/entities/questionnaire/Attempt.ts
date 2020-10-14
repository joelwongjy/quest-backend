import { Entity, ManyToOne, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { User } from "../user/User";
import { Answer } from "./Answer";
import { QuestionnaireWindow } from "./QuestionnaireWindow";

@Entity()
export class Attempt extends Discardable {
  entityName = "Attempt";

  constructor(user: User, questionnaireWindow: QuestionnaireWindow) {
    super();
    this.user = user;
    this.questionnaireWindow = questionnaireWindow;
  }

  @ManyToOne((type) => User)
  user: User;

  @ManyToOne((type) => QuestionnaireWindow)
  questionnaireWindow: QuestionnaireWindow;

  @OneToMany((type) => Answer, (answer) => answer.attempt)
  answers!: Answer[];
}
