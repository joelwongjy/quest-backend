import { IsInt, IsNotEmpty, Min } from "class-validator";
import { Column, Entity, getRepository, ManyToOne } from "typeorm";
import { QuestionData } from "../../types/questions";
import { Discardable } from "../Discardable";
import { Question } from "./Question";
import { QuestionSet } from "./QuestionSet";

@Entity()
export class QuestionOrder extends Discardable {
  entityName = "QuestionOrder";

  constructor(order: number, question: Question, questionSet: QuestionSet) {
    super();
    this.order = order;
    this.question = question;
    this.questionSet = questionSet;
  }

  @Column()
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  order: number;

  // the same question could appear in different orders in different sets
  @ManyToOne((type) => Question, { nullable: false })
  question: Question;

  @ManyToOne((type) => QuestionSet, (qnSet) => qnSet.questionOrders, {
    nullable: false,
  })
  questionSet: QuestionSet;

  /**
   * Returns the question order with question and options.\
   * Beware of calling this within `.map()` callback, as it may cause the N+1 problem.
   */
  async getQuestionOrder(): Promise<QuestionData> {
    const query = await getRepository(QuestionOrder).findOneOrFail({
      where: { id: this.id },
      relations: ["question"],
    });

    const result: QuestionData = {
      ...query.getBase(),
      qnOrderId: query.id,
      order: query.order,
      questionType: query.question.questionType,
      questionText: query.question.questionText,
      options: query.question.options.map((option) => {
        return {
          ...option,
          optionId: option.id,
        };
      }),
    };

    return result;
  }
}
