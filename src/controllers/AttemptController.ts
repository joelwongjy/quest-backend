import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { Attempt } from "../entities/questionnaire/Attempt";
import { Answer } from "../entities/questionnaire/Answer";
import { associateAttemptWithAnswers } from "../utils/attempts";
import { createAnswers } from "../utils/answers";
import { AccessTokenSignedPayload } from "../types/tokens";
import { AttemptFullData, AttemptListData } from "../types/attempts";
import { Message } from "../types/errors";
import { QuestionnaireWindowData } from "../types/questionnaires";
import { AnswerData } from "../types/answers";
import { QuestionData } from "../types/questions";

export async function create(
  request: Request,
  response: Response
): Promise<void> {
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;

  const { qnnaireWindowId, answers } = request.body;
  let user: User;
  let qnnaireWindow: QuestionnaireWindow;

  try {
    user = await getRepository(User).findOneOrFail({
      where: { id: userId },
    });

    qnnaireWindow = await getRepository(QuestionnaireWindow).findOneOrFail({
      where: { id: qnnaireWindowId },
    });
  } catch (e) {
    // when qnnaireWindowId or userId is invalid
    response.status(400).json({ message: e.message });
    return;
  }

  let createdAttempt = new Attempt(user, qnnaireWindow);
  createdAttempt = await getRepository(Attempt).save(createdAttempt);

  // create answers
  const answersProvided: Answer[] = await createAnswers(answers);

  // associate createdAttempt to answers provided
  createdAttempt = await associateAttemptWithAnswers(
    answersProvided,
    createdAttempt
  );

  response.status(200).json({ success: true, id: createdAttempt.id });

  return;
}

export async function show(
  request: Request,
  response: Response<AttemptFullData | Message>
): Promise<void> {
  const { id } = request.params;

  try {
    let attempt = await getRepository(Attempt).findOne({
      where: { id },
      relations: [
        "questionnaireWindow",
        "answers",
        "answers.questionOrder",
        "answers.questionOrder.question",
        "questionnaireWindow.mainSet",
        "questionnaireWindow.mainSet.questionOrder",
      ],
    });

    if (!attempt) {
      response.sendStatus(404);
      return;
    }

    const {
      id: windowId,
      openAt: startAt,
      closeAt: endAt,
    } = attempt.questionnaireWindow;
    const questions: QuestionData[] = await attempt.questionnaireWindow.mainSet.getQuestionOrders();
    const questionnaireWindow: QuestionnaireWindowData = {
      windowId,
      startAt: startAt.toString(),
      endAt: endAt.toString(),
      questions,
    };

    const answers: AnswerData[] = [];

    for (const answer of attempt.answers) {
      let temp: AnswerData;
      let question: QuestionData;

      // convert Question to QuestionData
      question = {
        qnOrderId: answer.questionOrder.id,
        order: answer.questionOrder.order,
        questionType: answer.questionOrder.question.questionType,
        questionText: answer.questionOrder.question.questionText,
        options: answer.questionOrder.question.options.map((option) => {
          return {
            ...option,
            optionId: Number(option.id),
          };
        }),
      };

      // ensure Answer has Option else set to null
      temp = {
        answerId: answer.id,
        questionOrder: question,
        option: answer.option
          ? {
              ...answer.option,
              optionId: Number(answer.option.id),
            }
          : null,
        textResponse: answer.answer,
      };

      answers.push(temp);
    }

    const result: AttemptFullData = {
      ...(await attempt.getListData()),
      windowId: questionnaireWindow.windowId,
      questionnaireWindow: questionnaireWindow,
      answers: answers,
    };

    response.status(200).json(result);
    return;
  } catch (e) {
    response.status(400).json({ message: e.message });
    return;
  }
}

export async function index(
  request: Request,
  response: Response<AttemptListData[] | Message>
): Promise<void> {
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;
  try {
    const attempts = await getRepository(Attempt).find({
      where: { user: { id: userId } }, // intentionally did not filter for discarded
    });
    const result = await Promise.all(attempts.map((a) => a.getListData()));
    response.status(200).json(result);
    return;
  } catch (e) {
    response.status(400).json({ message: e.message });
    return;
  }
}
