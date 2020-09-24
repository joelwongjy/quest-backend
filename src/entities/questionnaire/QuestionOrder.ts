import { IsInt, IsNotEmpty, Min } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Question } from "./Question";
import { QuestionSet } from "./QuestionSet";

@Entity()
export class QuestionOrder extends Discardable {
  entityName = "QuestionOrder";

  constructor(order: number, question: Question) {
    super();
    this.order = order;
    this.question = question;
  }

  @Column()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  order: number;

  // the same question could appear in different orders in different sets
  @ManyToOne((type) => Question)
  question: Question;

  @ManyToOne((type) => QuestionSet)
  question_set!: QuestionSet;
}
