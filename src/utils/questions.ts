import { validateOrReject } from "class-validator";
import { getRepository } from "typeorm";
import { Question } from "../entities/questionnaire/Question";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";
import {
  OptionPostData,
  QuestionData,
  QuestionPostData,
  QuestionSetEditData,
  QuestionType,
} from "../types/questions";
import {
  MOOD_OPTIONS,
  Option,
  SCALE_OPTIONS,
} from "../entities/questionnaire/Option";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";
import {
  QUESTION_ORDER_CREATION_ERROR,
  QUESTION_ORDER_EDITOR_ERROR,
} from "../types/errors";
import { is } from "date-fns/locale";

class QuestionOrderCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTION_ORDER_CREATION_ERROR;
  }
}

class QuestionSetEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTION_ORDER_EDITOR_ERROR;
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

export class QuestionSetCreator {
  private orderCreator = new QuestionOrderCreator();

  async createQuestionSet(questions: QuestionPostData[]): Promise<QuestionSet> {
    const questionOrders = await this.orderCreator.createQuestionOrders(
      questions
    );

    // aggregate them into a set
    const questionSet = new QuestionSet();
    await validateOrReject(questionSet);

    questionSet.questionOrders = questionOrders;
    const newQuestionSet = await getRepository(QuestionSet).save(questionSet);

    return newQuestionSet;
  }
}

// boolean is true if the qnOrder should be softDeleted
type ExistingQnOrderStatusTuple = [QuestionOrder, boolean];
export class QuestionSetEditor {
  private qnSet: QuestionSet;
  private existingQnOrders: QuestionOrder[];
  private editData: QuestionSetEditData;
  private existingQnOrderMap: Map<number, ExistingQnOrderStatusTuple>;
  private orderCreator = new QuestionOrderCreator();

  constructor(questionSet: QuestionSet, editData: QuestionSetEditData) {
    this.qnSet = questionSet;
    this.existingQnOrders = questionSet.questionOrders;
    this.editData = editData;

    this.existingQnOrderMap = new Map();
    this.existingQnOrders.forEach((order) => {
      if (!order.id) {
        return;
      }

      // on init, might have to softDelete all qnOrders
      this.existingQnOrderMap.set(order.id, [order, true]);
    });
    this.validateEditorOrReject(questionSet, editData);
  }

  public validateEditor(
    questionSet: QuestionSet,
    editData: QuestionSetEditData
  ): boolean {
    const setHasId = Boolean(questionSet.id);

    const setQnOrderIds = questionSet.questionOrders.map((order) => order.id);
    const setHasAllQnOrderIds =
      setQnOrderIds.map(Boolean).length === setQnOrderIds.length;

    let editDataHasMatchingQnOrderId = true;
    editData.questions.forEach((qn) => {
      const qnOrder = qn as QuestionData; // not sure why ts doesn't treat qn loosely
      if (
        qnOrder.qnOrderId &&
        !this.existingQnOrderMap.has(qnOrder.qnOrderId)
      ) {
        editDataHasMatchingQnOrderId = false;
      }
    });

    return setHasId && setHasAllQnOrderIds && editDataHasMatchingQnOrderId;
  }

  public validateEditorOrReject(
    questionSet: QuestionSet,
    editData: QuestionSetEditData
  ): boolean {
    const isValidated = this.validateEditor(questionSet, editData);
    if (!isValidated) {
      throw new QuestionSetEditorError("Edit data failed validation checks");
    }
    return isValidated;
  }

  private validateQnOrdersLength(newQnOrders: QuestionOrder[]): boolean {
    return newQnOrders.length >= this.existingQnOrders.length;
  }

  private validateQnOrdersLengthOrReject(
    newQnOrders: QuestionOrder[]
  ): boolean {
    const isValid = this.validateQnOrdersLength(newQnOrders);
    if (!isValid) {
      throw new QuestionSetEditorError(
        `New Qn Orders will cause dangling question orders` +
          `(Existing length: ${this.existingQnOrders.length}, New length: ${newQnOrders.length})`
      );
    }
    return isValid;
  }

  public async editQnSet(): Promise<QuestionSet> {
    const ordersToCreate: QuestionPostData[] = [];
    const ordersToKeep: QuestionOrder[] = [];
    const ordersToUpdate: QuestionOrder[] = [];
    const ordersToSoftDelete: QuestionOrder[] = [];

    this.editData.questions.forEach((qn) => {
      const qnOrder = qn as QuestionData; // not sure why ts doesn't treat qn loosely

      if (!qnOrder.qnOrderId) {
        ordersToCreate.push(qnOrder as QuestionPostData);
      } else {
        const existingQnOrder = this.existingQnOrderMap.get(qnOrder.qnOrderId);

        if (!existingQnOrder) {
          // editQnOrder exists, but it is not inside the existing map
          // will throw - since constructor validation should have picked it up
          throw new QuestionSetEditorError(
            `Error while editing: unexpected issue with validation`
          );
        }

        if (existingQnOrder[0].order !== qnOrder.order) {
          // editQnOrder exists, but order has been changed
          existingQnOrder[0].order = qnOrder.order;

          ordersToUpdate.push(existingQnOrder[0]);
          this.existingQnOrderMap.set(qnOrder.qnOrderId, [
            existingQnOrder[0],
            false,
          ]);
        }

        // editQnOrder exists and has same order as what is currently saved
        ordersToKeep.push(existingQnOrder[0]);
        this.existingQnOrderMap.set(qnOrder.qnOrderId, [
          existingQnOrder[0],
          false,
        ]);
      }
    });

    this.existingQnOrderMap.forEach((tuple) => {
      const shouldDelete = tuple[1];
      if (shouldDelete) {
        ordersToSoftDelete.push(tuple[0]);
      }
    });

    const newOrders = await this.orderCreator.createQuestionOrders(
      ordersToCreate
    );
    const updatedOrders = await getRepository(QuestionOrder).save(
      ordersToUpdate
    );
    const deletedOrders = await getRepository(QuestionOrder).softRemove(
      ordersToSoftDelete
    );

    const concatResult: QuestionOrder[] = newOrders
      .concat(updatedOrders)
      .concat(deletedOrders)
      .concat(ordersToKeep);
    this.qnSet.questionOrders = concatResult;
    this.validateQnOrdersLengthOrReject(concatResult);

    const updated = await getRepository(QuestionSet).save(this.qnSet);
    return updated;
  }
}
