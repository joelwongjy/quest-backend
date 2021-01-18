import { Column, Entity, ManyToOne, BeforeInsert, BeforeUpdate } from "typeorm";
import { QuestionOrder } from "./QuestionOrder";
import { Option } from "./Option";
import { IsNotEmpty, ValidateIf, validateOrReject } from "class-validator";
import { Attempt } from "./Attempt";
import { Discardable } from "../Discardable";
import { AnswerData } from "../../types/answers";
import { QuestionData } from "../../types/questions";
@Entity()
export class Answer extends Discardable {
  entityName = "Answer";

  constructor(questionOrder: QuestionOrder, option?: Option, answer?: string) {
    super();
    this.questionOrder = questionOrder;
    this.option = option ?? null;
    this.answer = answer ?? null;
  }

  // for each question, there can be multiple answer objects
  // use QuestionOrder to have reference to relevant QuestionSet as well
  @ManyToOne((type) => QuestionOrder)
  questionOrder: QuestionOrder;

  // option column may be empty if question type is text-based
  // for each option object, there can be multiple answer objects
  @ManyToOne((type) => Option, { nullable: true })
  option: Option | null;

  // answer column may be empty if question does not require a text-based answer
  @Column({ type: "character varying", nullable: true })
  @ValidateIf((answerObject) => !answerObject.option)
  @IsNotEmpty()
  answer: string | null;

  @ManyToOne((type) => Attempt, (attempt) => attempt.answers)
  attempt!: Attempt;

  // Hook to ensure entity does not have null option and null answer
  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    await validateOrReject(this);
  }

  getData = (): AnswerData => {
    // convert QuestionOrder to QuestionData
    const question: QuestionData = {
      qnOrderId: this.questionOrder.id,
      order: this.questionOrder.order,
      questionType: this.questionOrder.question.questionType,
      questionText: this.questionOrder.question.questionText,
      options: this.questionOrder.question.options.map((option) => {
        return {
          ...option,
          optionId: Number(option.id),
        };
      }),
    };

    // ensure Answer has Option else set to null
    return {
      answerId: this.id,
      questionOrder: question,
      option: this.option
        ? {
            ...this.option,
            optionId: Number(this.option.id),
          }
        : null,
      textResponse: this.answer,
    };
  };
}
