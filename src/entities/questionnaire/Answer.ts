import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "../Base";
import { Question } from "./Question";
import { Option } from "./Option";

@Entity()
export class Answer extends Base {
  entityName = "Answer";

  constructor(question: Question, option?: Option, answer?: string) {
    super();
    this.question = question;
    this.option = option ?? null;
    this.answer = answer ?? null;
  }

  // for each question object, there can be multiple answer objects
  @ManyToOne((type) => Question)
  question: Question;

  // option column may be empty if question type is text-based
  // for each option object, there can be multiple answer objects
  @ManyToOne((type) => Option, { nullable: true })
  option: Option | null;

  // answer column may be empty if question does not require a text-based answer
  @Column({ type: "character varying", nullable: true })
  answer: string | null;
}
