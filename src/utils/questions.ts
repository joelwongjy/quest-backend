import { validateOrReject } from "class-validator";
import { assert } from "console";
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

async function createQuestionWithOptions(
  questionText: string,
  questionType: QuestionType,
  optionsText: OptionPostData[],
  order: number
): Promise<QuestionOrder> {
  const rv = await _createQuestion(questionText, questionType, order);

  const { question } = rv;
  assert(!!question.id);

  const options: Option[] = await Promise.all(
    optionsText.map(async (option) => {
      const data = new Option(option.optionText, question);
      await validateOrReject(data);
      return data;
    })
  );
  await getRepository(Option).save(options);

  return rv;
}

export async function createMCQ(
  questionText: string,
  optionsText: OptionPostData[],
  order: number
): Promise<QuestionOrder> {
  return await createQuestionWithOptions(
    questionText,
    QuestionType.MULTIPLE_CHOICE,
    optionsText,
    order
  );
}

export async function createScaleQuestion(
  questionText: string,
  optionsText: OptionPostData[],
  order: number
): Promise<QuestionOrder> {
  return await createQuestionWithOptions(
    questionText,
    QuestionType.SCALE,
    optionsText,
    order
  );
}

export async function createMoodQuestion(
  questionText: string,
  optionsText: OptionPostData[],
  order: number
): Promise<QuestionOrder> {
  return await createQuestionWithOptions(
    questionText,
    QuestionType.MOOD,
    optionsText,
    order
  );
}

export async function createQuestionOrders(
  questions: QuestionPostData[]
): Promise<QuestionOrder[]> {
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
              `MCQ Question (text: ${questionText}, order ${order}) has no options `
            );
          }
          return await createMCQ(questionText, qn.options, order);
        case QuestionType.MOOD:
          return await createMoodQuestion(questionText, MOOD_OPTIONS, order);
        case QuestionType.SCALE:
          return await createScaleQuestion(questionText, SCALE_OPTIONS, order);
        default:
          throw new Error(`QuestionType ${questionType} is not supported`);
      }
    })
  );

  return questionOrders;
}

export async function createQuestionSet(
  questions: QuestionPostData[]
): Promise<QuestionSet> {
  const questionOrders = await createQuestionOrders(questions);

  // aggregate them into a set
  const questionSet = new QuestionSet();
  await validateOrReject(questionSet);

  questionSet.questionOrders = questionOrders;
  const newQuestionSet = await getRepository(QuestionSet).save(questionSet);

  return newQuestionSet;
}
