import { IsNotEmpty } from "class-validator";
import { Column, Entity } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionType } from "./QuestionType";

@Entity()
export class Question extends Discardable {
  entityName = "Question";

  constructor(question_text: string, question_type: QuestionType) {
    super();
    this.question_text = question_text;
    this.question_type = question_type;
  }

  @Column()
  @IsNotEmpty()
  question_text: string;

  @Column({
    type: "enum",
    enum: QuestionType,
  })
  question_type: QuestionType;
}
