import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Question } from "./Question";

@Entity()
export class Option extends Discardable {
  entityName = "Option";

  constructor(option_text: string, question: Question) {
    super();
    this.option_text = option_text;
    this.question = question;
  }

  @Column()
  @IsNotEmpty()
  option_text: string;

  @ManyToOne((type) => Question)
  question: Question;
}
