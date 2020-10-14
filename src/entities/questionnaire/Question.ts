import { IsNotEmpty } from "class-validator";
import { Column, Entity } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionType } from "../../types/questions";

@Entity()
export class Question extends Discardable {
  entityName = "Question";

  constructor(questionText: string, questionType: QuestionType) {
    super();
    this.questionText = questionText;
    this.questionType = questionType;
  }

  @Column()
  @IsNotEmpty()
  questionText: string;

  @Column({
    type: "enum",
    enum: QuestionType,
  })
  questionType: QuestionType;
}
