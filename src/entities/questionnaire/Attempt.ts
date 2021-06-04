import { AttemptListData } from "src/types/attempts";
import { Entity, getRepository, ManyToOne, OneToMany } from "typeorm";
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

  @ManyToOne((type) => User, { nullable: false })
  user: User;

  @ManyToOne((type) => QuestionnaireWindow, { nullable: false })
  questionnaireWindow: QuestionnaireWindow;

  @OneToMany((type) => Answer, (answer) => answer.attempt)
  answers!: Answer[];

  getListData = async (): Promise<AttemptListData> => {
    const attempt = await getRepository(Attempt).findOneOrFail(this.id, {
      relations: ["user", "questionnaireWindow"],
    });
    const user = this.user || attempt.user;
    const window = this.questionnaireWindow || attempt.questionnaireWindow;
    return {
      ...this.getBase(),
      user: user.getData(),
      windowId: window.id,
    };
  };
}
