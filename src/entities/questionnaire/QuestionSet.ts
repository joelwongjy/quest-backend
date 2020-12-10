import { Entity, getRepository, OneToMany } from "typeorm";
import { QuestionData } from "../../types/questions";
import { Discardable } from "../Discardable";
import { QuestionOrder } from "./QuestionOrder";

@Entity()
export class QuestionSet extends Discardable {
  entityName = "QuestionSet";

  @OneToMany(
    (type) => QuestionOrder,
    (questionOrder) => questionOrder.questionSet
  )
  questionOrders!: QuestionOrder[];

  async getQuestionOrders(): Promise<QuestionData[]> {
    const query = await getRepository(QuestionSet).findOneOrFail({
      where: { id: this.id },
      relations: ["questionOrders", "questionOrders.question"],
    });

    // TODO: improve this, there's a n^2 code here
    const result: QuestionData[] = query.questionOrders
      .filter((order) => !order.discardedAt)
      .map((order) => {
        return {
          ...order.getBase(),
          qnOrderId: order.id,
          order: order.order,
          questionType: order.question.questionType,
          questionText: order.question.questionText,
          options: order.question.options.map((option) => {
            return {
              ...option,
              optionId: option.id,
            };
          }),
        };
      });

    return result;
  }
}
