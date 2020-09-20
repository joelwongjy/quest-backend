import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Question } from "./Question";

@Entity()
export class QuestionOrder extends Discardable {
  entityName = "QuestionOrder";

  constructor(order: number, question: Question) {
    super();
    this.order = order;
    this.question = question;
  }

  @Column()
  @IsNotEmpty()
  order: number;

  // the same question could appear in different orders in different sets
  @ManyToOne((type) => Question)
  question: Question;
}
