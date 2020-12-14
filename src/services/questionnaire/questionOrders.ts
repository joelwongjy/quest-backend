import { validateOrReject } from "class-validator";
import { getRepository } from "typeorm";
import {
  MOOD_OPTIONS,
  SCALE_OPTIONS,
} from "../../entities/questionnaire/Option";
import { Question } from "../../entities/questionnaire/Question";
import { QuestionOrder } from "../../entities/questionnaire/QuestionOrder";
import {
  QUESTION_ORDER_CREATION_ERROR,
  QUESTION_ORDER_VIEWER_ERROR,
} from "../../types/errors";
import {
  QuestionType,
  OptionPostData,
  QuestionPostData,
  QuestionData,
} from "../../types/questions";
import { Option } from "../../entities/questionnaire/Option";

class QuestionOrderCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTION_ORDER_CREATION_ERROR;
  }
}

class QuestionOrderViewerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTION_ORDER_VIEWER_ERROR;
  }
}

/**
 * Creates QuestionOrders.
 */
export class QuestionOrderCreator {
  private async _createQuestion(
    questionText: string,
    questionType: QuestionType,
    order: number
  ): Promise<QuestionOrder> {
    const data = new Question(questionText, questionType);
    await validateOrReject(data);
    const question = await getRepository(Question).save(data);

    const orderData = new QuestionOrder(order, question);
    const newOrder = await getRepository(QuestionOrder).save(orderData);

    // This object has the db id for qnOrder and qn
    return newOrder;
  }

  private async _createQuestionWithOptions(
    questionText: string,
    questionType: QuestionType,
    optionsText: OptionPostData[],
    order: number
  ): Promise<QuestionOrder> {
    const rv = await this._createQuestion(questionText, questionType, order);

    const { question } = rv;

    const options: Option[] = await Promise.all(
      optionsText.map(async (option) => {
        const data = new Option(option.optionText, question);
        await validateOrReject(data);
        return data;
      })
    );

    const savedOptions = await getRepository(Option).save(options);
    rv.question.options = savedOptions;

    return rv;
  }

  private async createShortAnswerQuestion(
    questionText: string,
    order: number
  ): Promise<QuestionOrder> {
    const rv = await this._createQuestion(
      questionText,
      QuestionType.SHORT_ANSWER,
      order
    );
    return rv;
  }

  private async createLongAnswerQuestion(
    questionText: string,
    order: number
  ): Promise<QuestionOrder> {
    const rv = await this._createQuestion(
      questionText,
      QuestionType.LONG_ANSWER,
      order
    );
    return rv;
  }

  private async createMCQ(
    questionText: string,
    optionsText: OptionPostData[],
    order: number
  ): Promise<QuestionOrder> {
    return await this._createQuestionWithOptions(
      questionText,
      QuestionType.MULTIPLE_CHOICE,
      optionsText,
      order
    );
  }

  private async createScaleQuestion(
    questionText: string,
    optionsText: OptionPostData[],
    order: number
  ): Promise<QuestionOrder> {
    return await this._createQuestionWithOptions(
      questionText,
      QuestionType.SCALE,
      optionsText,
      order
    );
  }

  private async createMoodQuestion(
    questionText: string,
    optionsText: OptionPostData[],
    order: number
  ): Promise<QuestionOrder> {
    return await this._createQuestionWithOptions(
      questionText,
      QuestionType.MOOD,
      optionsText,
      order
    );
  }

  public async createQuestionOrder(
    qn: QuestionPostData
  ): Promise<QuestionOrder> {
    const { questionText, questionType, order } = qn;
    switch (questionType) {
      case QuestionType.LONG_ANSWER:
        return await this.createLongAnswerQuestion(questionText, order);
      case QuestionType.SHORT_ANSWER:
        return await this.createShortAnswerQuestion(questionText, order);
      case QuestionType.MULTIPLE_CHOICE:
        if (!qn.options) {
          throw new Error(
            `MCQ Question (text: ${questionText}, order ${order}) has no options `
          );
        }
        return await this.createMCQ(questionText, qn.options, order);
      case QuestionType.MOOD:
        return await this.createMoodQuestion(questionText, MOOD_OPTIONS, order);
      case QuestionType.SCALE:
        return await this.createScaleQuestion(
          questionText,
          SCALE_OPTIONS,
          order
        );
      default:
        throw new Error(`QuestionType ${questionType} is not supported`);
    }
  }

  public async createQuestionOrders(
    questions: QuestionPostData[]
  ): Promise<QuestionOrder[]> {
    try {
      const questionOrders = await Promise.all(
        questions.map(async (qn) => this.createQuestionOrder(qn))
      );
      return questionOrders;
    } catch (e) {
      throw new QuestionOrderCreationError("Error while creating question");
    }
  }
}

/**
 * Reads and formats the contained QuestionOrder. \
 * This is a wrapper class for the entity `QuestionOrder`'s `getQuestionOrder()`.
 *
 * Beware of calling this in a `.map()` callback, as it may cause the N+1 problem.
 * To safeguard against this, you have to call `activate()` before running the read operation.
 */
export class QuestionOrderViewer {
  private isActive: boolean = false;
  private qnOrder: QuestionOrder;

  constructor(qnOrder: QuestionOrder) {
    this.validateHasIdOrReject(qnOrder);
    this.qnOrder = qnOrder;
  }

  public activate(): this {
    this.isActive = true;
    return this;
  }

  private validateHasId(qnOrder: QuestionOrder): boolean {
    return Boolean(qnOrder.id);
  }

  private validateHasIdOrReject(qnOrder: QuestionOrder): boolean {
    const isValid = this.validateHasId(qnOrder);
    if (!isValid) {
      throw new QuestionOrderViewerError(`Provided QuestionOrder has no id`);
    }
    return isValid;
  }

  public async getQuestionOrder(): Promise<QuestionData> {
    if (!this.isActive) {
      throw new QuestionOrderViewerError(
        `Are you sure you need this viewer, or is QuestionSetViewer the one you need?`
      );
    }

    return await this.qnOrder.getQuestionOrder();
  }
}
