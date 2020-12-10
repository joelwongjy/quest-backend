import { validateOrReject } from "class-validator";
import { getRepository } from "typeorm";
import { Question } from "../entities/questionnaire/Question";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";
import {
  OptionPostData,
  QuestionPostData,
  QuestionType,
} from "../types/questions";
import {
  MOOD_OPTIONS,
  Option,
  SCALE_OPTIONS,
} from "../entities/questionnaire/Option";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";
import { QUESTION_ORDER_CREATION_ERROR } from "../types/errors";

class QuestionOrderCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTION_ORDER_CREATION_ERROR;
  }
}

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

export async function createQuestionSet(
  questions: QuestionPostData[]
): Promise<QuestionSet> {
  const creator = new QuestionOrderCreator();
  const questionOrders = await creator.createQuestionOrders(questions);

  // aggregate them into a set
  const questionSet = new QuestionSet();
  await validateOrReject(questionSet);

  questionSet.questionOrders = questionOrders;
  const newQuestionSet = await getRepository(QuestionSet).save(questionSet);

  return newQuestionSet;
}
