import { validateOrReject } from "class-validator";
import { getRepository } from "typeorm";
import { QuestionOrder } from "../../entities/questionnaire/QuestionOrder";
import { QuestionSet } from "../../entities/questionnaire/QuestionSet";
import {
  QUESTION_SET_EDITOR_ERROR,
  QUESTION_SET_VIEWER_ERROR,
} from "../../types/errors";
import {
  QuestionPostData,
  QuestionSetPatchData,
  QuestionData,
} from "../../types/questions";
import { QuestionOrderCreator } from "./questionOrders";

/** Helper type for`QuestionSetEditor`.
 * Boolean is `true` if QuestionOrder should be deleted. */
type ShouldDelete = boolean;
type ExistingQnOrderStatusTuple = [QuestionOrder, ShouldDelete];

class QuestionSetEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTION_SET_EDITOR_ERROR;
  }
}

class QuestionSetViewerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTION_SET_VIEWER_ERROR;
  }
}

/**
 * Creates a QuestionSet.
 * Leverages on `QuestionOrderCreator`.
 */
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

/**
 * Edits a QuestionSet.
 */
export class QuestionSetEditor {
  private qnSet: QuestionSet;
  private existingQnOrders: QuestionOrder[];
  private editData: QuestionSetPatchData;
  private existingQnOrderMap: Map<number, ExistingQnOrderStatusTuple>;
  private orderCreator = new QuestionOrderCreator();

  constructor(questionSet: QuestionSet, editData: QuestionSetPatchData) {
    this.qnSet = questionSet;
    this.existingQnOrders = questionSet.questionOrders;
    this.editData = editData;

    this.existingQnOrderMap = new Map();
    this.existingQnOrders.forEach((order) => {
      if (!order.id) {
        // during validate, it will check this
        return;
      }

      // on init, might have to softDelete all qnOrders
      this.existingQnOrderMap.set(order.id, [order, true]);
    });
    this.validateEditorOrReject(questionSet, editData);
  }

  public validateEditor(
    questionSet: QuestionSet,
    editData: QuestionSetPatchData
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
    editData: QuestionSetPatchData
  ): boolean {
    const isValidated = this.validateEditor(questionSet, editData);
    if (!isValidated) {
      throw new QuestionSetEditorError("Edit data failed validation checks");
    }
    return isValidated;
  }

  /** Checks that the contained QuestionSet will not lose any QuestionOrder. */
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

/**
 * Reads and formats the contained QuestionSet. \
 * This is a wrapper class for the entity `QuestionSet`'s `getQuestionSet()`.
 */
export class QuestionSetViewer {
  private qnSet: QuestionSet;

  constructor(qnSet: QuestionSet) {
    this.validateHasIdOrReject(qnSet);
    this.qnSet = qnSet;
  }

  private validateHasId(qnSet: QuestionSet): boolean {
    return Boolean(qnSet.id);
  }

  private validateHasIdOrReject(qnSet: QuestionSet): boolean {
    const isValid = this.validateHasId(qnSet);
    if (!isValid) {
      throw new QuestionSetViewerError("Provided QuestionSet has no id");
    }
    return isValid;
  }

  public async getQuestionSet(): Promise<QuestionData[]> {
    return await this.qnSet.getQuestionOrders();
  }
}
