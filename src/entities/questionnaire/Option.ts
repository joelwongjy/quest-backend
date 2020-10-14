import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Question } from "./Question";

@Entity()
export class Option extends Discardable {
  entityName = "Option";

  constructor(optionText: string, question: Question) {
    super();
    this.optionText = optionText;
    this.question = question;
  }

  @Column()
  @IsNotEmpty()
  optionText: string;

  @ManyToOne((type) => Question)
  question: Question;
}
