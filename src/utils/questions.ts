import { validateOrReject } from "class-validator";
import { assert } from "console";
import { getRepository } from "typeorm";
import { Question } from "../entities/questionnaire/Question";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";
import { QuestionPostData, QuestionType } from "../types/questions";
import { Option } from "../entities/questionnaire/Option";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";

async function _createQuestion(
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

export async function createShortAnswerQuestion(
  questionText: string,
  order: number
): Promise<QuestionOrder> {
  const rv = await _createQuestion(
    questionText,
    QuestionType.SHORT_ANSWER,
    order
  );
  return rv;
}

export async function createLongAnswerQuestion(
  questionText: string,
  order: number
): Promise<QuestionOrder> {
  const rv = await _createQuestion(
    questionText,
    QuestionType.LONG_ANSWER,
    order
  );
  return rv;
}

export async function createMCQ(
  questionText: string,
  optionsText: string[],
  order: number
): Promise<QuestionOrder> {
  const rv = await _createQuestion(
    questionText,
    QuestionType.MULTIPLE_CHOICE,
    order
  );

  const { question } = rv;
  assert(!!question.id);

  const options: Option[] = await Promise.all(
    optionsText.map(async (text) => {
      const data = new Option(text, question);
      await validateOrReject(data);
      return data;
    })
  );
  await getRepository(Option).save(options);

  return rv;
}

export async function createQuestionSet(
  questions: QuestionPostData[]
): Promise<QuestionSet> {
  // create each question
  const questionOrders = await Promise.all(
    questions.map(async (qn) => {
      const { questionText, questionType, order } = qn;
      switch (questionType) {
        case QuestionType.LONG_ANSWER:
          return await createLongAnswerQuestion(questionText, order);
        case QuestionType.SHORT_ANSWER:
          return await createShortAnswerQuestion(questionText, order);
        case QuestionType.MULTIPLE_CHOICE:
          if (!qn.options) {
            throw new Error(
              `Question text: ${questionText} of order ${order} has no options `
            );
          }
          return await createMCQ(questionText, qn.options, order);
        default:
          throw new Error(`QuestionType ${questionType} is not supported`);
      }
    })
  );

  // aggregate them into a set
  const questionSet = new QuestionSet();
  await validateOrReject(questionSet);

  questionSet.questionOrders = questionOrders;
  const newQuestionSet = await getRepository(QuestionSet).save(questionSet);

  return newQuestionSet;
}
