import { Column, Entity } from "typeorm";
import { Discardable } from "../Discardable";

@Entity()
export class QuestionnaireWindow extends Discardable {
  entityName = "QuestionnaireWindow";

  constructor(open_at: Date, close_at: Date) {
    super();
    this.open_at = open_at;
    this.close_at = close_at;
  }

  @Column({ type: "timestamp without time zone" })
  open_at: Date;

  @Column({ type: "timestamp without time zone" })
  close_at: Date;
}
